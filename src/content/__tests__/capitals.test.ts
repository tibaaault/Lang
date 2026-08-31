import { describe, expect, it } from 'vitest'
import { courseById, courses } from '../index'
import { indexCourse, buildSession } from '../../engine/scheduler'
import { emptyProgress } from '../../store/progress'
import { checkAnswer, normalize } from '../../engine/grade'

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

describe('kit de voyage vietnamien', () => {
  const vietnamese = courseById('vi')!

  it('couvre les cinq domaines du voyage', () => {
    expect(vietnamese.units.map((u) => u.title)).toEqual([
      'Premiers mots',
      'Manger et boire',
      'Acheter et négocier',
      'Se déplacer et se loger',
      'Rencontrer et discuter',
    ])
    expect(indexCourse(vietnamese).lexemes.length).toBe(50)
  })

  it('donne une prononciation approchée à chaque entrée', () => {
    // Le vietnamien s'écrit en alphabet latin mais ne se lit pas comme le
    // français : sans indication, on prononce « phở » comme « fo ».
    for (const lex of indexCourse(vietnamese).lexemes) {
      expect(lex.roman, lex.term).toBeTruthy()
    }
  })

  it('ne contient aucun mot que le retrait des tons rendrait ambigu', () => {
    const seen = new Map<string, string>()
    for (const lex of indexCourse(vietnamese).lexemes) {
      const key = normalize(lex.term)
      const previous = seen.get(key)
      // Deux entrées différentes réduites à la même graphie rendraient un
      // exercice écrit impossible à corriger.
      expect(previous === undefined || previous === lex.term, lex.term).toBe(true)
      seen.set(key, lex.term)
    }
  })

  it("explique les pronoms, principale difficulté pour un étranger", () => {
    const pronouns = indexCourse(vietnamese).lexemes.find(
      (l) => l.id === 'vi.po.anh-chi-em',
    )
    // La note doit expliquer que le pronom dépend de l'âge de l'interlocuteur.
    expect(pronouns?.note).toMatch(/plus âgé/)
    expect(pronouns?.note).toMatch(/plus jeune/)
  })
})

describe('densité des phrases à trou', () => {
  // Parcours où cette forme a été demandée à l'usage : écrire le mot manquant
  // dans une phrase. Avec une seule phrase par mot, elle revenait à
  // l'identique dès la deuxième révision.
  const denseCourses = ['en-basics', 'id', 'vi']

  it.each(denseCourses)('donne au moins deux phrases par mot : %s', (id) => {
    const index = indexCourse(courseById(id)!)
    for (const lex of index.lexemes) {
      const clozes = (index.exercisesOf.get(lex.id) ?? []).filter(
        (e) => e.kind === 'cloze',
      )
      expect(clozes.length, `${id} · ${lex.term}`).toBeGreaterThanOrEqual(2)
    }
  })

  it.each(denseCourses)('en fait la forme dominante : %s', (id) => {
    const kinds = courseById(id)!.units.flatMap((u) =>
      u.exercises.map((e) => e.kind),
    )
    const clozes = kinds.filter((k) => k === 'cloze').length
    expect(clozes / kinds.length).toBeGreaterThan(0.5)
  })
})

describe('bonne formation des phrases à trou', () => {
  it('met autant de trous que la réponse compte de mots', () => {
    // Un trou unique devant une réponse de deux mots laisse croire qu'il n'en
    // faut qu'un : l'exercice devient impossible à réussir tel qu'il s'affiche.
    for (const course of courses) {
      for (const unit of course.units) {
        for (const ex of unit.exercises) {
          if (ex.kind !== 'cloze') continue
          const blanks = (ex.sentence.match(/___/g) ?? []).length
          const words = ex.accepted[0].trim().split(/\s+/).length
          expect(blanks, `${ex.id} : « ${ex.accepted[0]} »`).toBe(words)
          expect(ex.fr.length, ex.id).toBeGreaterThan(0)
        }
      }
    }
  })
})
