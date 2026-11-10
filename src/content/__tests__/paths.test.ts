import { describe, expect, it } from 'vitest'
import { courses } from '../index'
import { buildLesson, indexPath, wordsOfPhrase } from '../../engine/lesson'
import { EMOJI as VI_EMOJI } from '../vi/extras'
import { EMOJI as TH_EMOJI } from '../th/extras'

const EMOJI: Record<string, Record<string, string>> = { vi: VI_EMOJI, th: TH_EMOJI }

// Les règles communes à tous les parcours guidés, quelle que soit la langue.
describe.each(courses.filter((c) => c.path).map((c) => [c.title, c] as const))(
  'parcours guidé : %s',
  (_title, course) => {
    const index = indexPath(course)
    const proper = new Set(
      (course.properNouns ?? []).map((n) => n.toLocaleLowerCase()),
    )

    it('découpe le cours en leçons courtes', () => {
      expect(index.lessons.length).toBeGreaterThanOrEqual(15)
      for (const { lesson } of index.lessons) {
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
      for (const { lesson } of index.lessons) {
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
          expect(steps.length, lesson.id).toBeGreaterThanOrEqual(10)
          for (const step of steps) {
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
