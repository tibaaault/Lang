// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Session } from '../Session'
import { courseById } from '../../content'
import { indexCourse } from '../../engine/scheduler'
import { resetProgress, updateSettings } from '../../store/progress'

vi.mock('../../store/supabase', () => ({
  getSupabase: () => Promise.resolve(null),
  isRemoteEnabled: false,
  DB_SCHEMA: 'lang',
}))

const indonesian = courseById('id')!

beforeEach(() => {
  vi.stubGlobal('speechSynthesis', {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: () => [],
    addEventListener: vi.fn(),
  })
  vi.stubGlobal('SpeechSynthesisUtterance', class {})
  localStorage.clear()
  resetProgress()
  updateSettings({ newPerDay: 20, dailyGoal: 40 })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/** Position de la bonne réponse parmi les options affichées, ou -1. */
async function firstChoicePosition(): Promise<number> {
  const index = indexCourse(indonesian)
  const answers = new Map<string, string>()
  for (const unit of indonesian.units) {
    for (const ex of unit.exercises) {
      if (ex.kind === 'choice') answers.set(ex.prompt, ex.answer)
    }
  }

  const user = userEvent.setup()
  render(
    <Session course={indonesian} index={index} mode="free" onExit={() => {}} />,
  )

  for (let step = 0; step < 40; step++) {
    const read = screen.queryByRole('button', { name: "J'ai lu" })
    if (read) {
      await user.click(read)
      continue
    }

    const options = screen
      .getAllByRole('button')
      .filter((b) => b.className.includes('rounded-xl border') && b.textContent)
    const prompt = [...answers.keys()].find((p) => screen.queryByText(p))
    if (prompt && options.length === 4) {
      const answer = answers.get(prompt)!
      return options.findIndex((b) => b.textContent?.trim() === answer)
    }

    // Ce n'est pas un choix multiple : on répond n'importe quoi et on avance.
    const input = screen.queryByPlaceholderText('Votre réponse')
    if (!input) return -1
    await user.type(input, 'zzz{Enter}')
    const next = screen.queryByRole('button', { name: 'Continuer' })
    if (next) await user.click(next)
  }
  return -1
}

describe('ordre des propositions', () => {
  it("ne place pas systématiquement la bonne réponse en premier", async () => {
    // Le contenu est écrit avec la bonne réponse en tête : sans mélange à
    // l'affichage, cette position vaudrait zéro à chaque tirage, et répondre
    // « la première » suffirait à tout réussir.
    const seen = new Set<number>()
    for (let run = 0; run < 12; run++) {
      const position = await firstChoicePosition()
      if (position >= 0) seen.add(position)
      cleanup()
      resetProgress()
      updateSettings({ newPerDay: 20, dailyGoal: 40 })
    }

    expect(seen.size, `positions observées : ${[...seen]}`).toBeGreaterThan(1)
  }, 60_000)
})
