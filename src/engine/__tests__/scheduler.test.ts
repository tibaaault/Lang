import { describe, expect, it } from 'vitest'
import type { Course } from '../../types'
import { buildSession, indexCourse, pendingCount } from '../scheduler'
import { createCard } from '../fsrs'
import { cardKey, emptyProgress, type Progress } from '../../store/progress'

function courseOf(id: string, wordCount: number): Course {
  return {
    id,
    lang: 'en',
    voice: 'en-GB',
    title: id,
    units: [
      {
        id: `${id}.u`,
        title: 'Unité',
        lexemes: Array.from({ length: wordCount }, (_, i) => ({
          id: `${id}.w${i}`,
          term: `mot${i}`,
          gloss: `sens${i}`,
          examples: [{ text: 'x', fr: 'y' }],
        })),
        exercises: Array.from({ length: wordCount }, (_, i) => ({
          kind: 'recall' as const,
          id: `${id}.e${i}`,
          lexemeId: `${id}.w${i}`,
          fr: `sens${i}`,
          accepted: [`mot${i}`],
        })),
      },
    ],
  }
}

const english = courseOf('en', 30)
const indo = courseOf('id', 30)

describe('constitution des sessions', () => {
  it('plafonne les mots nouveaux au budget quotidien', () => {
    const p = emptyProgress()
    const session = buildSession(english, indexCourse(english), p)
    // Chaque mot neuf apparaît deux fois : une présentation, puis un test.
    const tested = session.filter((i) => i.phase === 'test')
    expect(tested.length).toBe(p.settings.newPerDay)
    expect(session.every((i) => i.isNew)).toBe(true)
  })

  it('compte le budget par cours, pas globalement', () => {
    const p: Progress = emptyProgress()
    // Journée où le quota d'anglais est déjà épuisé.
    p.days[
      new Date().toLocaleDateString('sv-SE')
    ] = {
      reviews: 8,
      correct: 8,
      seconds: 60,
      newWords: 8,
      newByCourse: { en: 8 },
    }

    expect(pendingCount(english, indexCourse(english), p).fresh).toBe(0)
    // L'indonésien doit rester intact : c'est le défaut constaté à l'usage.
    expect(pendingCount(indo, indexCourse(indo), p).fresh).toBe(
      p.settings.newPerDay,
    )
    expect(
      buildSession(indo, indexCourse(indo), p).filter(
        (i) => i.phase === 'test',
      ).length,
    ).toBe(p.settings.newPerDay)
  })

  it('signale les mots encore en réserve au-delà du quota', () => {
    const p = emptyProgress()
    const { fresh, remaining } = pendingCount(english, indexCourse(english), p)
    expect(fresh).toBe(p.settings.newPerDay)
    expect(fresh + remaining).toBe(30)
  })

  it("l'entraînement libre dépasse le quota de mots nouveaux", () => {
    const p = emptyProgress()
    const free = buildSession(english, indexCourse(english), p, new Date(), 'free')
    const tested = free.filter((i) => i.phase === 'test')
    expect(tested.length).toBe(p.settings.dailyGoal)
    expect(tested.length).toBeGreaterThan(p.settings.newPerDay)
  })

  it("l'entraînement libre repêche les mots non échus quand tout est vu", () => {
    const p = emptyProgress()
    const small = courseOf('sm', 5)
    // Les cinq mots sont vus et planifiés dans le futur : rien n'est dû.
    for (let i = 0; i < 5; i++) {
      p.cards[cardKey('sm', `sm.w${i}`)] = createCard(3)
    }
    const index = indexCourse(small)
    expect(pendingCount(small, index, p).due).toBe(0)
    expect(buildSession(small, index, p).length).toBe(0)

    const free = buildSession(small, index, p, new Date(), 'free')
    expect(free.length).toBe(5)
    expect(free.every((i) => !i.isNew)).toBe(true)
  })

  it('propose en priorité les mots les plus en retard', () => {
    const p = emptyProgress()
    const now = new Date()
    const old = new Date(now.getTime() - 40 * 86_400_000)
    const recent = new Date(now.getTime() - 10 * 86_400_000)
    p.cards[cardKey('en', 'en.w0')] = { ...createCard(3, recent), due: recent.toISOString() }
    p.cards[cardKey('en', 'en.w1')] = { ...createCard(3, old), due: old.toISOString() }

    const session = buildSession(english, indexCourse(english), p, now)
    const reviews = session.filter((i) => !i.isNew)
    expect(reviews[0].lexeme.id).toBe('en.w1')
  })
})

describe('présentation avant test', () => {
  it('montre un mot inconnu avant de le tester', () => {
    const p = emptyProgress()
    const session = buildSession(english, indexCourse(english), p)
    const first = session.filter((i) => i.lexeme.id === 'en.w0')
    expect(first.map((i) => i.phase)).toEqual(['introduce', 'test'])
  })

  it('laisse des questions entre la présentation et le test', () => {
    const p = emptyProgress()
    const session = buildSession(english, indexCourse(english), p)
    for (const lex of new Set(session.map((i) => i.lexeme.id))) {
      const intro = session.findIndex(
        (i) => i.lexeme.id === lex && i.phase === 'introduce',
      )
      const test = session.findIndex(
        (i) => i.lexeme.id === lex && i.phase === 'test',
      )
      if (intro === -1 || test === -1) continue
      // Sans cet écart, la réponse serait encore en mémoire immédiate et
      // l'exercice se réduirait à une recopie. L'écart visé est de cinq
      // questions ; il se resserre nécessairement pour les derniers mots
      // présentés, faute de questions restantes pour les séparer.
      expect(test - intro).toBeGreaterThanOrEqual(3)
    }
  })

  it('teste directement les mots déjà connus, sans les représenter', () => {
    const p = emptyProgress()
    const now = new Date()
    const past = new Date(now.getTime() - 5 * 86_400_000)
    p.cards[cardKey('en', 'en.w0')] = {
      ...createCard(3, past),
      due: past.toISOString(),
    }
    const session = buildSession(english, indexCourse(english), p, now)
    const known = session.filter((i) => i.lexeme.id === 'en.w0')
    expect(known).toHaveLength(1)
    expect(known[0].phase).toBe('test')
  })

  it('ne laisse aucun test orphelin ni aucune présentation sans suite', () => {
    const p = emptyProgress()
    const session = buildSession(english, indexCourse(english), p)
    const intros = session.filter((i) => i.phase === 'introduce')
    for (const intro of intros) {
      expect(
        session.some(
          (i) => i.lexeme.id === intro.lexeme.id && i.phase === 'test',
        ),
      ).toBe(true)
    }
  })
})
