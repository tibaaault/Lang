// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LessonSession } from '../LessonSession'
import { courseById } from '../../content'
import { indexPath } from '../../engine/lesson'
import { resetProgress } from '../../store/progress'
import { checkAnswer, checkExactly } from '../../engine/grade'

vi.mock('../../store/supabase', () => ({
  getSupabase: () => Promise.resolve(null),
  isRemoteEnabled: false,
  DB_SCHEMA: 'lang',
}))

beforeEach(() => {
  vi.stubGlobal('speechSynthesis', {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: () => [],
    addEventListener: vi.fn(),
  })
  vi.stubGlobal('SpeechSynthesisUtterance', class {})
  resetProgress()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const course = courseById('en-oral')!
const index = indexPath(course)
const lesson = index.lessons.find((l) => l.lesson.title === 'Après did, does, do')!.lesson

/** Avance jusqu'à la première phrase à trou, en répondant aux questions. */
async function reachCloze(user: ReturnType<typeof userEvent.setup>) {
  for (let i = 0; i < 10; i++) {
    const input = screen.queryByRole('textbox')
    if (input) return input
    const options = screen
      .getAllByRole('button')
      .filter((b) => b.className.includes('min-h-14') && !b.textContent?.includes('Continuer'))
    await user.click(options[0])
    await user.click(await screen.findByRole('button', { name: 'Continuer' }))
  }
  throw new Error('aucune phrase à trou')
}

describe('phrases à trou de conjugaison', () => {
  it("refuse la forme conjuguée après « did » et explique pourquoi", async () => {
    const user = userEvent.setup()
    render(<LessonSession course={course} index={index} lessonId={lesson.id} onExit={() => {}} />)
    const input = await reachCloze(user)

    // On retrouve la phrase affichée, puis on y commet l'erreur attendue.
    const cloze = lesson.clozes!.find((c) => screen.queryByText(c.fr))!
    expect(screen.getByText(cloze.hint!)).toBeTruthy()
    const miss = cloze.nearMisses![0]
    await user.type(input, miss.word)
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))

    expect(await screen.findByText('Pas tout à fait')).toBeTruthy()
    expect(screen.getByText(miss.why)).toBeTruthy()
  })

  it('ne pardonne pas une lettre de travers : c’est justement la faute', () => {
    const strict = lesson.clozes!.find((c) => c.accepted[0] === 'lives')!
    // La correction ordinaire prend « live » pour une faute de frappe…
    expect(checkAnswer('live', strict.accepted, strict.nearMisses).correct).toBe(true)
    // …la correction de grammaire, non, et elle explique.
    const verdict = checkExactly('live', strict.accepted, strict.nearMisses)
    expect(verdict.correct).toBe(false)
    expect(verdict.feedback).toBeTruthy()
    expect(checkExactly(' Lives ', strict.accepted).correct).toBe(true)
  })
})
