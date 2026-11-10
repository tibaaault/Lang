import { describe, expect, it } from 'vitest'
import type { Lesson } from '../../types'
import { courses } from '../index'
import { buildLesson, indexPath, wordsOfPhrase } from '../../engine/lesson'
import { EMOJI as VI_EMOJI } from '../vi/extras'
import { EMOJI as TH_EMOJI } from '../th/extras'

/** Une leçon faite de mots neufs et de phrases qui les emploient. */
const ordinary = (l: Lesson) => !l.dialogue && !l.drill

const EMOJI: Record<string, Record<string, string>> = { vi: VI_EMOJI, th: TH_EMOJI }

// Les règles communes à tous les parcours guidés, quelle que soit la langue.
describe.each(
  courses.filter((c) => c.path && !c.adapted).map((c) => [c.title, c] as const),
)(
  'parcours guidé : %s',
  (_title, course) => {
    const index = indexPath(course)
    const proper = new Set(
      (course.properNouns ?? []).map((n) => n.toLocaleLowerCase()),
    )

    it('découpe le cours en leçons courtes', () => {
      expect(index.lessons.length).toBeGreaterThanOrEqual(15)
      // Dialogues et leçons d'oreille n'enseignent pas de mots neufs.
      for (const { lesson } of index.lessons.filter((l) => ordinary(l.lesson))) {
        expect(lesson.lexemeIds.length, lesson.id).toBeGreaterThanOrEqual(4)
        expect(lesson.lexemeIds.length, lesson.id).toBeLessThanOrEqual(7)
        expect(lesson.phrases.length, lesson.id).toBeGreaterThanOrEqual(4)
      }
    })

    it("n'enseigne jamais deux fois le même mot, ni deux mots de même sens", () => {
      const terms = index.words.map((w) => w.term.toLocaleLowerCase())
      expect(new Set(terms).size).toBe(terms.length)
      const glosses = index.words.map((w) => w.gloss)
      expect(new Set(glosses).size).toBe(glosses.length)
    })

    it("n'emploie dans une phrase que des mots déjà enseignés", () => {
      // Un parcours avancé emploie librement tout le vocabulaire.
      if (course.advanced) return
      for (const { lesson, order } of index.lessons) {
        for (const phrase of lesson.phrases) {
          for (const token of index.tokenizer.target(phrase.text)) {
            const key = token.toLocaleLowerCase()
            if (proper.has(key)) continue
            const id = index.idOfTerm.get(key)
            const where = `${lesson.id} · « ${phrase.text} » · ${token}`
            expect(id, where).toBeTruthy()
            expect(index.lessonOfWord.get(id!)!, where).toBeLessThanOrEqual(order)
          }
        }
      }
    })

    it('emploie chaque mot neuf dans les phrases de sa leçon', () => {
      for (const { lesson } of index.lessons.filter((l) => ordinary(l.lesson))) {
        const used = new Set(lesson.phrases.flatMap((p) => wordsOfPhrase(index, p)))
        for (const id of lesson.lexemeIds) {
          expect(used.has(id), `${lesson.id} · ${id}`).toBe(true)
        }
      }
    })

    it('ne donne pas deux traductions françaises identiques dans une leçon', () => {
      // Deux phrases de même traduction rendraient l'assemblage indécidable.
      for (const { lesson } of index.lessons) {
        const fr = lesson.phrases.map((p) => p.fr)
        expect(new Set(fr).size, lesson.id).toBe(fr.length)
      }
    })

    it('donne la prononciation de tout ce qui ne se lit pas', () => {
      if (!course.romanized) return
      for (const word of index.words) {
        expect(word.roman, word.term).toBeTruthy()
      }
      // Sur les tuiles, aucun mot ne doit rester sans lettres latines.
      expect(index.roman('ผม ชื่อ Tom ครับ')).toBe('phom chue Tom khrap')
    })

    it('enrichit le lexique de mots de voyage que les leçons ne donnent pas', () => {
      // Un parcours avancé emploie librement tout le vocabulaire.
      if (course.advanced) return
      const taught = new Set(index.words.map((w) => w.term.toLocaleLowerCase()))
      const extras = (course.extras ?? []).flatMap((u) => u.lexemes)
      expect(extras.length).toBeGreaterThanOrEqual(80)
      const seen = new Set<string>()
      for (const word of extras) {
        const key = word.term.toLocaleLowerCase()
        // Ni doublon d'une leçon, ni doublon dans le lexique.
        expect(taught.has(key), word.term).toBe(false)
        expect(seen.has(key), word.term).toBe(false)
        seen.add(key)
        if (course.romanized) expect(word.roman, word.term).toBeTruthy()
      }
    })

    it('ne pose un pictogramme que sur des mots qui existent', () => {
      // Un parcours avancé emploie librement tout le vocabulaire.
      if (course.advanced) return
      const all = [...index.words, ...(course.extras ?? []).flatMap((u) => u.lexemes)]
      expect(all.filter((w) => w.emoji).length).toBeGreaterThanOrEqual(60)
      // Une faute de frappe dans la table laisserait un mot sans image,
      // sans rien signaler.
      const terms = new Set(all.map((w) => w.term))
      for (const term of Object.keys(EMOJI[course.id] ?? {})) {
        expect(terms.has(term), term).toBe(true)
      }
    })

    it('fabrique pour chaque leçon des exercices qui ont une réponse', () => {
      for (const { lesson } of index.lessons) {
        for (const practice of [false, true]) {
          const steps = buildLesson(index, lesson.id, { practice })
          expect(steps.length, lesson.id).toBeGreaterThanOrEqual(8)
          for (const step of steps) {
            if (step.kind === 'quiz') {
              expect(step.options.length, lesson.id).toBeGreaterThanOrEqual(3)
              expect(new Set(step.options).size, lesson.id).toBe(step.options.length)
              expect(step.quiz.why.length, lesson.id).toBeGreaterThan(20)
            }
            if (step.kind === 'choice' || step.kind === 'fill') {
              expect(new Set(step.options).size, lesson.id).toBe(4)
              expect(step.options).toContain(step.answer)
            }
            // Rien à écrire dans un alphabet que le clavier ne sait pas saisir.
            if (course.romanized) expect(step.kind).not.toBe('type')
          }
        }
      }
    })
  },
)

describe('leçons vietnamiennes hors du moule', () => {
  const index = indexPath(courses.find((c) => c.id === 'vi')!)
  const dialogues = index.lessons.filter((l) => l.lesson.dialogue)

  it('propose un dialogue à écouter dans les situations de voyage', () => {
    expect(dialogues.length).toBeGreaterThanOrEqual(5)
    for (const { lesson } of dialogues) {
      expect(lesson.dialogue!.length, lesson.id).toBeGreaterThanOrEqual(6)
      // Les deux personnages parlent.
      expect(new Set(lesson.dialogue!.map((l) => l.who)).size).toBe(2)
      expect(lesson.quizzes!.length, lesson.id).toBeGreaterThanOrEqual(4)
    }
  })

  it("fait écouter le dialogue avant d'en montrer le texte", () => {
    for (const { lesson } of dialogues) {
      const steps = buildLesson(index, lesson.id)
      expect(steps[0]).toMatchObject({ kind: 'dialogue', revealed: false })
      const again = steps.findIndex((s) => s.kind === 'dialogue' && s.revealed)
      // Les questions viennent entre l'écoute et la relecture.
      expect(steps.slice(1, again).every((s) => s.kind === 'quiz')).toBe(true)
      expect(steps.slice(again + 1).length).toBeGreaterThanOrEqual(3)
    }
  })

  it('dit les prix comme on les annonce', () => {
    const prices = index.lessons.find((l) => l.lesson.numbers)!.lesson
    const said = new Map(prices.numbers!.map((n) => [n.value, n.text]))
    expect(said.get(15_000)).toBe('mười lăm nghìn')
    expect(said.get(21_000)).toBe('hai mươi mốt nghìn')
    expect(said.get(55_000)).toBe('năm mươi lăm nghìn')
    expect(said.get(105_000)).toBe('một trăm linh năm nghìn')
    expect(said.get(350_000)).toBe('ba trăm năm mươi nghìn')
    expect(said.get(1_500_000)).toBe('một triệu năm trăm nghìn')
    const steps = buildLesson(index, prices.id)
    expect(steps.filter((s) => s.kind === 'number').length).toBe(8)
  })

  it("entraîne l'oreille aux tons sans rien faire écrire", () => {
    for (const { lesson } of index.lessons.filter((l) => l.lesson.drill)) {
      const steps = buildLesson(index, lesson.id)
      expect(steps.some((s) => s.kind === 'type' || s.kind === 'build')).toBe(false)
      const heard = steps.filter(
        (s) => (s.kind === 'quiz' && s.quiz.speak) || (s.kind === 'choice' && s.mode === 'listen'),
      )
      expect(heard.length, lesson.id).toBeGreaterThanOrEqual(5)
    }
  })
})

// Les cours rédigés avant les parcours, mis à leur format après coup.
describe.each(
  courses.filter((c) => c.adapted).map((c) => [c.title, c] as const),
)('cours mis au format parcours : %s', (_title, course) => {
  const index = indexPath(course)

  it('range chaque mot dans une leçon, et une seule', () => {
    const placed = index.lessons.flatMap((l) => l.lesson.lexemeIds)
    expect(new Set(placed).size).toBe(placed.length)
    expect(placed.length).toBe(index.words.length)
    for (const { lesson } of index.lessons) {
      expect(lesson.lexemeIds.length, lesson.id).toBeGreaterThanOrEqual(3)
      expect(lesson.lexemeIds.length, lesson.id).toBeLessThanOrEqual(8)
    }
  })

  it('garde les identifiants des mots, donc la progression acquise', () => {
    for (const unit of course.units) {
      for (const ex of unit.exercises) {
        expect(index.byId.has(ex.lexemeId), ex.id).toBe(true)
      }
    }
  })

  it('fabrique pour chaque leçon une séance jouable', () => {
    for (const { lesson } of index.lessons) {
      for (const practice of [false, true]) {
        const steps = buildLesson(index, lesson.id, { practice })
        expect(steps.length, lesson.id).toBeGreaterThanOrEqual(8)
        expect(steps.length, lesson.id).toBeLessThanOrEqual(32)
        for (const step of steps) {
          if (step.kind === 'choice') {
            expect(new Set(step.options).size, lesson.id).toBe(4)
            expect(step.options).toContain(step.answer)
          }
          if (step.kind === 'quiz') {
            expect(step.options).toContain(step.answer)
            expect(new Set(step.options).size, lesson.id).toBe(step.options.length)
          }
          if (step.kind === 'build') {
            expect(step.answer.length, lesson.id).toBeGreaterThanOrEqual(2)
          }
          // Une phrase à trou ne porte que sur un mot de sa leçon.
          if (step.kind === 'cloze') {
            expect(lesson.lexemeIds).toContain(step.cloze.lexemeId)
          }
        }
      }
    }
  })

  it('réemploie les phrases à trou écrites pour le cours', () => {
    const written = course.units.flatMap((u) => u.exercises).filter((e) => e.kind === 'cloze')
    const reused = index.lessons.flatMap((l) => l.lesson.clozes ?? [])
    expect(reused.length).toBe(written.length)
  })
})

describe('anglais pas à pas', () => {
  const course = courses.find((c) => c.id === 'en-basics')!
  const index = indexPath(course)
  const written = index.lessons.filter((l) => l.unit.id.startsWith('eb2.'))

  it("commence par le parcours écrit leçon par leçon, avant l'ancien vocabulaire", () => {
    expect(written.length).toBeGreaterThanOrEqual(12)
    expect(index.lessons.slice(0, written.length)).toEqual(written)
    // L'ancien contenu suit, avec ses identifiants : la progression tient.
    expect(index.lessons.length).toBeGreaterThan(written.length)
    expect(index.words.some((w) => w.id.startsWith('eb.'))).toBe(true)
  })

  it('avance par petites leçons, chacune expliquée', () => {
    for (const { lesson, unit } of written) {
      expect(lesson.lexemeIds.length, lesson.id).toBeGreaterThanOrEqual(5)
      expect(lesson.lexemeIds.length, lesson.id).toBeLessThanOrEqual(7)
      expect(lesson.phrases.length, lesson.id).toBeGreaterThanOrEqual(5)
      expect(lesson.quizzes!.length, lesson.id).toBeGreaterThanOrEqual(2)
      expect(unit.tips!.length, unit.id).toBeGreaterThanOrEqual(3)
      // Chaque mot neuf est employé dans une phrase de sa leçon.
      const used = new Set(lesson.phrases.flatMap((p) => wordsOfPhrase(index, p)))
      for (const id of lesson.lexemeIds) expect(used.has(id), `${lesson.id} · ${id}`).toBe(true)
    }
  })
})

describe('drapeaux des capitales', () => {
  const course = courses.find((c) => c.id === 'geo-capitals')!
  const index = indexPath(course)

  it('donne son drapeau à chaque pays', () => {
    for (const word of index.words) expect(word.emoji, word.gloss).toBeTruthy()
    const flags = index.words.map((w) => w.emoji)
    expect(new Set(flags).size).toBe(flags.length)
  })

  it('fait reconnaître un pays à son drapeau', () => {
    const quizzes = index.lessons.flatMap((l) => l.lesson.quizzes ?? [])
    const flagQuizzes = quizzes.filter((q) => q.prompt.includes('drapeau'))
    expect(flagQuizzes.length).toBe(index.words.length)
    for (const q of flagQuizzes) expect(new Set(q.options).size).toBe(4)
  })

  it('ne met jamais la bonne réponse toujours à la même place', () => {
    // Le défaut d'origine : la première proposition était toujours la bonne.
    const lesson = index.lessons[0].lesson
    const places = new Set<number>()
    for (let run = 0; run < 40; run++) {
      for (const step of buildLesson(index, lesson.id)) {
        if (step.kind === 'quiz' || step.kind === 'choice') {
          places.add(step.options.indexOf(step.answer))
        }
      }
    }
    expect(places.size).toBe(4)
  })
})
