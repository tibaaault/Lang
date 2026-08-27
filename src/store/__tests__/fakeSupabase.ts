// Client Supabase minimal, en mémoire, pour éprouver le flux réel de
// connexion et de synchronisation sans réseau. Il ne reproduit que ce que
// sync.ts utilise, mais il le reproduit fidèlement, y compris le fait que les
// données distantes survivent à un rechargement de l'application.

import { vi } from 'vitest'

export interface FakeUser {
  id: string
  email: string
  user_metadata?: Record<string, unknown>
}

export function createFakeSupabase(db = {
  progress: new Map<string, unknown>(),
  profiles: new Map<string, Record<string, unknown>>(),
}) {
  let session: { user: FakeUser } | null = null
  const listeners: ((event: string, s: typeof session) => void)[] = []

  function table(name: 'progress' | 'profiles') {
    const store = name === 'progress' ? db.progress : db.profiles
    const keyOf = (row: Record<string, unknown>) =>
      String(name === 'progress' ? row.user_id : row.id)

    const builder = {
      _filterValue: undefined as string | undefined,
      select() {
        return builder
      },
      eq(_column: string, value: string) {
        builder._filterValue = value
        return builder
      },
      order() {
        return Promise.resolve({
          data: [...db.profiles.values()],
          error: null,
        })
      },
      maybeSingle() {
        const row = store.get(String(builder._filterValue))
        return Promise.resolve({ data: row ?? null, error: null })
      },
      upsert(row: Record<string, unknown>) {
        const key = keyOf(row)
        store.set(key, { ...(store.get(key) as object), ...row })
        return Promise.resolve({ data: null, error: null })
      },
      update(patch: Record<string, unknown>) {
        return {
          eq(_column: string, value: string) {
            const existing = store.get(String(value))
            if (existing) store.set(String(value), { ...existing, ...patch })
            return Promise.resolve({ data: null, error: null })
          },
        }
      },
    }
    return builder
  }

  const client = {
    db,
    auth: {
      getSession: () => Promise.resolve({ data: { session } }),
      onAuthStateChange(cb: (event: string, s: typeof session) => void) {
        listeners.push(cb)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      },
      signUp({ email, options }: { email: string; options?: { data?: Record<string, unknown> } }) {
        const user: FakeUser = {
          id: `uid-${email}`,
          email,
          user_metadata: options?.data,
        }
        session = { user }
        listeners.forEach((cb) => cb('SIGNED_IN', session))
        return Promise.resolve({ data: { user }, error: null })
      },
      signInWithPassword({ email }: { email: string }) {
        const user: FakeUser = { id: `uid-${email}`, email }
        session = { user }
        listeners.forEach((cb) => cb('SIGNED_IN', session))
        return Promise.resolve({ data: { user }, error: null })
      },
      signOut() {
        session = null
        listeners.forEach((cb) => cb('SIGNED_OUT', null))
        return Promise.resolve({ error: null })
      },
    },
    from: (name: 'progress' | 'profiles') => table(name),
    /** Simule une session déjà ouverte au lancement de l'application. */
    _restoreSession(user: FakeUser) {
      session = { user }
    },
    /** Simule le rafraîchissement périodique du jeton d'authentification. */
    _refreshToken() {
      listeners.forEach((cb) => cb('TOKEN_REFRESHED', session))
    },
  }
  return client
}
