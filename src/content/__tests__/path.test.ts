import { describe, expect, it } from 'vitest'
import { courseById } from '../index'
import {
  buildLesson,
  buildReview,
  currentLesson,
  indexPath,
  lessonKey,
  wordsOfPhrase,
} from '../../engine/lesson'
import { sameTokens, splitWords } from '../../engine/tokens'
import { createCard } from '../../engine/fsrs'
import { cardKey, emptyProgress } from '../../store/progress'

const course = courseById('vi')!
const index = indexPath(course)
/** Dialogues et leçons d'oreille suivent d'autres règles : voir paths.test.ts. */
const ordinary = index.lessons.filter((l) => !l.lesson.dialogue && !l.lesson.drill)
const drilled = new Set(
  index.lessons.filter((l) => l.lesson.drill).flatMap((l) => l.lesson.lexemeIds),
)
const proper = new Set((course.properNouns ?? []).map((n) => n.toLocaleLowerCase()))

describe('parcours vietnamien : contenu', () => {
  it('offre un parcours substantiel, découpé en leçons courtes', () => {
    expect(course.path).toBe(true)
    expect(index.lessons.length).toBeGreaterThanOrEqual(30)
    expect(index.words.length).toBeGreaterThanOrEqual(180)
    for (const { lesson } of ordinary) {
      // Au-delà de sept mots neufs, la mémoire de travail décroche.
      expect(lesson.lexemeIds.length, lesson.id).toBeGreaterThanOrEqual(4)
      expect(lesson.lexemeIds.length, lesson.id).toBeLessThanOrEqual(7)
      expect(lesson.phrases.length, lesson.id).toBeGreaterThanOrEqual(4)
    }
  })

  it("n'enseigne jamais deux fois le même mot", () => {
    const terms = index.words.map((w) => w.term.toLocaleLowerCase())
    expect(new Set(terms).size).toBe(terms.length)
    const lessonIds = index.lessons.map((l) => l.lesson.id)
    expect(new Set(lessonIds).size).toBe(lessonIds.length)
  })

  it('ne donne pas le même sens à deux mots', () => {
    // Deux sens identiques rendraient un choix multiple indécidable.
    const glosses = index.words.map((w) => w.gloss)
    expect(new Set(glosses).size).toBe(glosses.length)
  })

  it("n'emploie dans une phrase que des mots déjà enseignés", () => {
    // La règle qui rend les tuiles possibles : aucune phrase ne pose un mot
    // que la leçon en cours ou une leçon antérieure n'a pas présenté.
    for (const { lesson, order } of index.lessons) {
      for (const phrase of lesson.phrases) {
        for (const token of index.tokenizer.target(phrase.text)) {
          const key = token.toLocaleLowerCase()
          if (proper.has(key)) continue
          const id = index.idOfTerm.get(key)
          expect(id, `${lesson.id} · « ${phrase.text} » · ${token}`).toBeTruthy()
          expect(
            index.lessonOfWord.get(id!)!,
            `${lesson.id} · « ${phrase.text} » · ${token} vient plus tard`,
          ).toBeLessThanOrEqual(order)
        }
      }
    }
  })

  it('fait pratiquer chaque mot dans au moins une phrase', () => {
    const used = new Set(
      index.lessons.flatMap((l) =>
        l.lesson.phrases.flatMap((p) => wordsOfPhrase(index, p)),
      ),
    )
    for (const word of index.words.filter((w) => !drilled.has(w.id))) {
      expect(used.has(word.id), word.term).toBe(true)
    }
  })

  it('emploie les mots neufs dans les phrases de leur propre leçon', () => {
    for (const { lesson } of ordinary) {
      const used = new Set(lesson.phrases.flatMap((p) => wordsOfPhrase(index, p)))
      for (const id of lesson.lexemeIds) {
        expect(used.has(id), `${lesson.id} · ${id}`).toBe(true)
      }
    }
  })

  it('donne des exemples au lexique à partir des phrases', () => {
    for (const word of index.words.filter((w) => !drilled.has(w.id))) {
      expect(word.examples?.length ?? 0, word.term).toBeGreaterThan(0)
    }
  })
})

describe('découpage en tuiles', () => {
  it('regroupe les syllabes en mots connus, au plus long', () => {
    expect(index.tokenizer.target('Nhà vệ sinh ở đâu?')).toEqual([
      'nhà vệ sinh',
      'ở',
      'đâu',
    ])
    expect(index.tokenizer.target('Ngày mai tôi sẽ đi Hà Nội.')).toEqual([
      'ngày mai',
      'tôi',
      'sẽ',
      'đi',
      'Hà Nội',
    ])
  })

  it('garde la majuscule des noms propres, pas celle du début de phrase', () => {
    expect(index.tokenizer.fr("J'habite en France.")).toEqual([
      "j'habite",
      'en',
      'France',
    ])
    expect(index.tokenizer.fr('Nam est vietnamien.')[0]).toBe('Nam')
    expect(index.tokenizer.target('Pháp')).toEqual(['Pháp'])
  })

  it('compare deux phrases sans tenir compte de la casse', () => {
    expect(sameTokens(['Tôi', 'khỏe'], ['tôi', 'khỏe'])).toBe(true)
    expect(sameTokens(['khỏe', 'tôi'], ['tôi', 'khỏe'])).toBe(false)
    expect(splitWords('Xin chào! Xin lỗi…')).toEqual(['Xin', 'chào', 'Xin', 'lỗi'])
  })
})

describe('fabrication des leçons', () => {
  // Les leurres sont tirés au sort : on rejoue chaque leçon plusieurs fois.
  const everyLesson = ordinary.flatMap((ref) =>
    [false, true, false].map((practice) => ({
      ref,
      practice,
      steps: buildLesson(index, ref.lesson.id, { practice }),
    })),
  )

  it('présente chaque mot neuf avant de le tester', () => {
    for (const { ref, practice, steps } of everyLesson) {
      if (practice) {
        expect(steps.some((s) => s.kind === 'intro')).toBe(false)
        continue
      }
      for (const id of ref.lesson.lexemeIds) {
        const intro = steps.findIndex((s) => s.kind === 'intro' && s.word.id === id)
        const test = steps.findIndex((s) => s.kind === 'choice' && s.wordId === id)
        expect(intro, id).toBeGreaterThanOrEqual(0)
        expect(test, id).toBeGreaterThan(intro)
      }
    }
  })

  it('mêle reconnaissance, paires, phrases à assembler et écriture', () => {
    for (const { ref, steps } of everyLesson) {
      const kinds = new Set(steps.map((s) => s.kind))
      for (const kind of ['choice', 'match', 'build', 'type']) {
        expect(kinds.has(kind as never), `${ref.lesson.id} · ${kind}`).toBe(true)
      }
      expect(steps.length).toBeGreaterThanOrEqual(10)
      expect(steps.length).toBeLessThanOrEqual(30)
    }
  })

  it('pose des questions qui ont une réponse, et une seule', () => {
    for (const { ref, steps } of everyLesson) {
      for (const step of steps) {
        const where = `${ref.lesson.id} · ${step.kind}`
        if (step.kind === 'choice' || step.kind === 'fill') {
          expect(step.options.length, where).toBe(4)
          expect(new Set(step.options).size, where).toBe(4)
          expect(step.options.filter((o) => o === step.answer).length, where).toBe(1)
        }
        if (step.kind === 'build') {
          expect(step.answer.length, where).toBeGreaterThanOrEqual(2)
          expect(step.tiles.length, where).toBeGreaterThan(step.answer.length)
          // Toutes les tuiles de la réponse sont bien proposées.
          const bank = [...step.tiles]
          for (const token of step.answer) {
            const at = bank.indexOf(token)
            expect(at, `${where} · ${token}`).toBeGreaterThanOrEqual(0)
            bank.splice(at, 1)
          }
          // Et aucune tuile en trop ne double un mot de la réponse.
          const answer = new Set(step.answer.map((t) => t.toLocaleLowerCase()))
          for (const extra of bank) {
            expect(answer.has(extra.toLocaleLowerCase()), `${where} · ${extra}`).toBe(false)
          }
        }
        if (step.kind === 'match') {
          expect(step.pairs.length, where).toBeGreaterThanOrEqual(4)
        }
      }
    }
  })

  it("n'emploie comme leurre aucun mot d'une leçon à venir", () => {
    for (const { ref, steps } of everyLesson) {
      if (ref.order === 0) continue
      for (const step of steps) {
        if (step.kind !== 'choice' || step.mode !== 'term') continue
        for (const option of step.options) {
          const id = index.idOfTerm.get(option.toLocaleLowerCase())!
          expect(index.lessonOfWord.get(id)!, option).toBeLessThanOrEqual(ref.order)
        }
      }
    }
  })
})

describe('révision et avancement', () => {
  it("n'a rien à réviser avant la première leçon", () => {
    expect(buildReview(index, emptyProgress())).toEqual([])
  })

  it('ne révise que des mots déjà vus, dans des phrases entièrement connues', () => {
    const progress = emptyProgress()
    const seen = new Set<string>()
    for (const { lesson } of index.lessons.slice(0, 4)) {
      for (const id of lesson.lexemeIds) {
        progress.cards[cardKey(course.id, id)] = createCard(2)
        seen.add(id)
      }
    }
    for (let run = 0; run < 5; run++) {
      const steps = buildReview(index, progress)
      expect(steps.length).toBeGreaterThanOrEqual(8)
      for (const step of steps) {
        if (step.kind === 'choice' || step.kind === 'type' || step.kind === 'fill') {
          expect(seen.has(step.wordId), step.wordId).toBe(true)
        }
        if (step.kind === 'build') {
          for (const id of step.wordIds) expect(seen.has(id), id).toBe(true)
        }
      }
    }
  })

  it('met en avant la première leçon non terminée', () => {
    const progress = emptyProgress()
    expect(currentLesson(index, progress)?.order).toBe(0)
    progress.lessons = {
      [lessonKey(course.id, index.lessons[0].lesson.id)]: 1,
      [lessonKey(course.id, index.lessons[1].lesson.id)]: 2,
    }
    expect(currentLesson(index, progress)?.order).toBe(2)
  })
})
