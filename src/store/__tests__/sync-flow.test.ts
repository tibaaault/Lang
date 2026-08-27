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

describe('sauvegarde des réglages sans attendre', () => {
  it('envoie un réglage en ligne sans attendre le délai groupé', async () => {
    await initAuth()
    await signIn('thibault@example.com', 'xxxxxx')
    await settle()

    updateSettings({ newPerDay: 12, courses: ['en'] })
    // Aucune minuterie n'est avancée : la sauvegarde doit déjà être partie.
    await vi.waitFor(() => {
      const row = fake.db.progress.get('uid-thibault@example.com') as {
        payload: { settings: { newPerDay: number } }
      }
      expect(row.payload.settings.newPerDay).toBe(12)
    })
  })

  it('retrouve ses réglages depuis un autre contexte du même téléphone', async () => {
    await initAuth()
    await signIn('thibault@example.com', 'xxxxxx')
    await settle()
    updateSettings({ newPerDay: 12, courses: ['en'] })
    await vi.waitFor(() => {
      expect(fake.db.progress.get('uid-thibault@example.com')).toBeDefined()
    })

    // Safari et l'application installée sur l'écran d'accueil ont chacun leur
    // stockage local : ce qui n'a pas été sauvegardé en ligne est invisible de
    // l'autre côté. C'est le cas qui faisait revenir les anciens réglages.
    localStorage.clear()
    activateAccount(null)
    await signIn('thibault@example.com', 'xxxxxx')
    await settle()

    expect(getProgress().settings.newPerDay).toBe(12)
    expect(getProgress().settings.courses).toEqual(['en'])
  })

  it('sauvegarde ce qui restait en attente avant de déconnecter', async () => {
    await initAuth()
    await signIn('thibault@example.com', 'xxxxxx')
    await settle()

    // Une réponse d'exercice, elle, reste groupée : sa sauvegarde attend.
    const { recordReview } = await import('../progress')
    const { createCard } = await import('../../engine/fsrs')
    recordReview({
      courseId: 'en',
      lexemeId: 'w1',
      card: createCard(3),
      correct: true,
      isNew: true,
      seconds: 4,
      exerciseId: 'w1.x0',
    })

    await signOut()
    await settle()

    const row = fake.db.progress.get('uid-thibault@example.com') as {
      payload: { cards: Record<string, unknown> }
    }
    expect(Object.keys(row.payload.cards)).toContain('en:w1')
  })
})
