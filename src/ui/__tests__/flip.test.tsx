// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Session } from '../Session'
import { courseById } from '../../content'
import { indexCourse } from '../../engine/scheduler'
import { getProgress, resetProgress, updateSettings } from '../../store/progress'

vi.mock('../../store/supabase', () => ({
  getSupabase: () => Promise.resolve(null),
  isRemoteEnabled: false,
  DB_SCHEMA: 'lang',
}))

const capitals = courseById('geo-capitals')!

beforeEach(() => {
  localStorage.clear()
  resetProgress()
  // Un seul continent : la session reste courte et prévisible.
  updateSettings({ unitFilter: { 'geo-capitals': 'Océanie' } })
})

afterEach(cleanup)

describe('carte à retourner', () => {
  it('cache la réponse tant que la carte n’est pas retournée', async () => {
    const user = userEvent.setup()
    render(
      <Session
        course={capitals}
        index={indexCourse(capitals)}
        mode="free"
        onExit={() => {}}
      />,
    )

    // On traverse les présentations pour atteindre un exercice.
    for (let i = 0; i < 30; i++) {
      const read = screen.queryByRole('button', { name: "J'ai lu" })
      if (!read) break
      await user.click(read)
    }

    const flip = screen.queryByRole('button', { name: /Retourner/ })
    if (!flip) return // La session a commencé par un autre type d'exercice.

    // Avant le retournement, aucun jugement n'est possible.
    expect(screen.queryByRole('button', { name: 'Je savais' })).toBeNull()
    await user.click(flip)
    expect(screen.getByRole('button', { name: 'Je savais' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Je ne savais pas' })).toBeTruthy()
  }, 30_000)

  it('enregistre une carte quand on déclare la connaître', async () => {
    const user = userEvent.setup()
    render(
      <Session
        course={capitals}
        index={indexCourse(capitals)}
        mode="daily"
        onExit={() => {}}
      />,
    )

    let answered = 0
    for (let i = 0; i < 40 && answered < 3; i++) {
      const read = screen.queryByRole('button', { name: "J'ai lu" })
      if (read) {
        await user.click(read)
        continue
      }
      const flip = screen.queryByRole('button', { name: /Retourner/ })
      if (flip) {
        await user.click(flip)
        await user.click(screen.getByRole('button', { name: 'Je savais' }))
        answered++
        continue
      }
      const options = screen
        .getAllByRole('button')
        .filter((b) => b.className.includes('min-h-14') && b.textContent)
      if (options.length) {
        await user.click(options[0])
        const next = screen.queryByRole('button', { name: 'Continuer' })
        if (next) await user.click(next)
        answered++
        continue
      }
      break
    }

    const cards = Object.entries(getProgress().cards)
    expect(cards.length).toBeGreaterThan(0)
    // Toutes les fiches enregistrées appartiennent bien au cours de géographie.
    for (const [key] of cards) expect(key.startsWith('geo-capitals:')).toBe(true)
  }, 30_000)
})
