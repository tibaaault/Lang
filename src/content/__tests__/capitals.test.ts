import { describe, expect, it } from 'vitest'
import { courseById, courses } from '../index'
import { indexCourse, buildSession } from '../../engine/scheduler'
import { emptyProgress } from '../../store/progress'
import { checkAnswer } from '../../engine/grade'

const capitals = courseById('geo-capitals')!

describe('cours des capitales', () => {
  it('couvre les six continents et près de deux cents pays', () => {
    expect(capitals.units.map((u) => u.title)).toEqual([
      'Europe',
      'Afrique',
      'Asie',
      'Amérique du Nord et Caraïbes',
      'Amérique du Sud',
      'Océanie',
    ])
    expect(indexCourse(capitals).lexemes.length).toBeGreaterThanOrEqual(190)
  })

  it('ne propose jamais deux fois le même pays', () => {
    const names = indexCourse(capitals).lexemes.map((l) => l.gloss)
    expect(new Set(names).size).toBe(names.length)
  })

  it('donne à chaque pays les quatre formes d’exercice', () => {
    const index = indexCourse(capitals)
    for (const lex of index.lexemes) {
      const kinds = (index.exercisesOf.get(lex.id) ?? []).map((e) => e.kind)
      expect(kinds.sort()).toEqual(['choice', 'choice', 'flip', 'recall'])
    }
  })

  it('propose des choix multiples valides et sans doublon', () => {
    for (const unit of capitals.units) {
      for (const ex of unit.exercises) {
        if (ex.kind !== 'choice') continue
        expect(ex.options).toContain(ex.answer)
        expect(new Set(ex.options).size).toBe(ex.options.length)
        expect(ex.options).toHaveLength(4)
      }
    }
  })

  it('accepte les variantes des capitales à plusieurs noms', () => {
    const index = indexCourse(capitals)
    const recallFor = (country: string) => {
      const lex = index.lexemes.find((l) => l.gloss === country)!
      const ex = (index.exercisesOf.get(lex.id) ?? []).find(
        (e) => e.kind === 'recall',
      )
      return ex && ex.kind === 'recall' ? ex.accepted : []
    }

    // L'Afrique du Sud a trois capitales : plusieurs réponses sont justes.
    expect(checkAnswer('Le Cap', recallFor('Afrique du Sud')).correct).toBe(true)
    expect(checkAnswer('Pretoria', recallFor('Afrique du Sud')).correct).toBe(true)
    // La Bolivie en a deux, selon qu'on parle de droit ou de fait.
    expect(checkAnswer('La Paz', recallFor('Bolivie')).correct).toBe(true)
    expect(checkAnswer('Sucre', recallFor('Bolivie')).correct).toBe(true)
    // Orthographes concurrentes.
    expect(checkAnswer('Kyiv', recallFor('Ukraine')).correct).toBe(true)
    expect(checkAnswer('Beijing', recallFor('Chine')).correct).toBe(true)
  })

  it('explique les capitales qui prêtent à confusion', () => {
    const index = indexCourse(capitals)
    for (const country of [
      'Afrique du Sud',
      'Bolivie',
      'Pays-Bas',
      'Suisse',
      "Côte d'Ivoire",
      'Tanzanie',
      'Birmanie',
      'Kazakhstan',
      'Mexique',
    ]) {
      const lex = index.lexemes.find((l) => l.gloss === country)
      expect(lex, country).toBeDefined()
      expect(lex!.note, country).toBeTruthy()
    }
  })

  it('se limite au continent choisi', () => {
    const p = emptyProgress()
    const session = buildSession(
      capitals,
      indexCourse(capitals),
      p,
      new Date(),
      'daily',
      'Océanie',
    )
    expect(session.length).toBeGreaterThan(0)
    for (const item of session) expect(item.unitTitle).toBe('Océanie')
  })

  it('mélange tous les continents quand aucun n’est choisi', () => {
    const p = emptyProgress()
    p.settings.newPerDay = 60
    const session = buildSession(
      capitals,
      indexCourse(capitals),
      p,
      new Date(),
      'free',
    )
    expect(new Set(session.map((i) => i.unitTitle)).size).toBeGreaterThan(1)
  })
})

describe('catalogue complet', () => {
  it('ne partage aucun identifiant entre les cours', () => {
    const ids = courses.flatMap((c) =>
      c.units.flatMap((u) => [
        ...u.lexemes.map((l) => l.id),
        ...u.exercises.map((e) => e.id),
      ]),
    )
    expect(new Set(ids).size).toBe(ids.length)
  })
})
