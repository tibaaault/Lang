// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeSupabase } from './fakeSupabase'

const fake = createFakeSupabase()

vi.mock('../supabase', () => ({
  getSupabase: () => Promise.resolve(fake),
  isRemoteEnabled: true,
  DB_SCHEMA: 'lang',
}))

const {
  activateAccount,
  getProgress,
  updateSettings,
} = await import('../progress')
const { initAuth, signUp, signIn, signOut } = await import('../sync')

/** Laisse partir la sauvegarde différée et se résoudre les promesses. */
async function settle() {
  await vi.advanceTimersByTimeAsync(5000)
  await vi.waitFor(() => {})
}

beforeEach(async () => {
  vi.useFakeTimers()
  localStorage.clear()
  fake.db.progress.clear()
  fake.db.profiles.clear()
  activateAccount(null)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('réglages à travers le cycle de connexion', () => {
  it('sauvegarde en ligne les réglages modifiés après connexion', async () => {
    await initAuth()
    await signIn('thibault@example.com', 'xxxxxx')
    await settle()

    updateSettings({ courses: ['en'], newPerDay: 12, dailyGoal: 30 })
    await settle()

    const row = fake.db.progress.get('uid-thibault@example.com') as {
      payload: { settings: Record<string, unknown> }
    }
    expect(row).toBeDefined()
    expect(row.payload.settings.courses).toEqual(['en'])
    expect(row.payload.settings.newPerDay).toBe(12)
    expect(row.payload.settings.dailyGoal).toBe(30)
  })

  it('les retrouve après un rafraîchissement du jeton', async () => {
    await initAuth()
    await signIn('thibault@example.com', 'xxxxxx')
    await settle()

    updateSettings({ courses: ['en'], newPerDay: 12 })
    await settle()

    // Le jeton se renouvelle tout seul : la synchronisation repart, et ne
    // doit pas ramener les réglages précédents.
    fake._refreshToken()
    await settle()

    expect(getProgress().settings.courses).toEqual(['en'])
    expect(getProgress().settings.newPerDay).toBe(12)
  })

  it('les retrouve au rechargement de l’application', async () => {
    await initAuth()
    await signIn('thibault@example.com', 'xxxxxx')
    await settle()
    updateSettings({ courses: ['en'], newPerDay: 12 })
    await settle()

    // Rechargement : l'espace local repart à zéro, seule la sauvegarde en
    // ligne subsiste — le cas d'un nouveau téléphone ou d'un cache vidé.
    localStorage.clear()
    activateAccount(null)
    await initAuth()
    fake._restoreSession({ id: 'uid-thibault@example.com', email: 'thibault@example.com' })
    fake._refreshToken()
    await settle()

    expect(getProgress().settings.courses).toEqual(['en'])
    expect(getProgress().settings.newPerDay).toBe(12)
  })

  it('ne transmet pas les réglages d’un compte à un autre', async () => {
    await initAuth()
    await signIn('thibault@example.com', 'xxxxxx')
    await settle()
    updateSettings({ courses: ['en'], newPerDay: 12 })
    await settle()

    await signOut()
    await settle()
    await signUp('soeur@example.com', 'xxxxxx', 'Soeur')
    await settle()

    expect(getProgress().settings.courses).toBeUndefined()
    expect(getProgress().settings.newPerDay).toBe(8)
    expect(Object.keys(getProgress().cards)).toHaveLength(0)
  })
})
