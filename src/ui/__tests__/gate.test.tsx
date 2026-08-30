// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createFakeSupabase } from '../../store/__tests__/fakeSupabase'

const fake = createFakeSupabase()

vi.mock('../../store/supabase', () => ({
  getSupabase: () => Promise.resolve(fake),
  isRemoteEnabled: true,
  DB_SCHEMA: 'lang',
}))

const App = (await import('../../App')).default
const { activateAccount } = await import('../../store/progress')

beforeEach(() => {
  vi.stubGlobal('speechSynthesis', {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: () => [],
    addEventListener: vi.fn(),
  })
  vi.stubGlobal('SpeechSynthesisUtterance', class {})
  localStorage.clear()
  fake.db.progress.clear()
  fake.db.profiles.clear()
  activateAccount(null)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('connexion demandée avant de réviser', () => {
  it('présente la connexion plutôt que l’accueil', async () => {
    render(<App />)
    expect(await screen.findByText(/Connectez-vous avant de réviser/)).toBeTruthy()
    // Aucun cours n'est accessible tant que le choix n'est pas fait.
    expect(screen.queryByRole('button', { name: /Réviser/ })).toBeNull()
  })

  it('laisse passer sans compte, mais le signale en permanence', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(
      await screen.findByRole('button', {
        name: /Continuer sans compte/,
      }),
    )

    expect(await screen.findByText(/Hors connexion/)).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Réviser/ }).length).toBeGreaterThan(0)
  })

  it('ouvre directement l’accueil quand la session est déjà là', async () => {
    fake._restoreSession({ id: 'uid-thibault', email: 'thibault@example.com' })
    render(<App />)

    expect(
      (await screen.findAllByRole('button', { name: /Réviser|À jour/ })).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText(/Hors connexion/)).toBeNull()
  })
})
