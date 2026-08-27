// Comptes et synchronisation.
//
// Le local reste la source de vérité de la session en cours ; le distant sert
// à retrouver sa progression ailleurs. À la connexion on fusionne les deux
// plutôt que d'écraser l'un par l'autre : sinon, réviser dans le train sans
// réseau puis ouvrir l'application sur l'ordinateur perdrait la session.

import { useSyncExternalStore } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabase, isRemoteEnabled } from './supabase'
import {
  getProgress,
  replaceProgress,
  setProgressListener,
  type Progress,
} from './progress'
import { MASTERED_STABILITY_DAYS } from '../engine/fsrs'

export interface PublicProfile {
  id: string
  pseudo: string
  streak: number
  mastered: number
  reviews7d: number
  lastActive: string | null
}

export type SyncState = 'off' | 'signed-out' | 'idle' | 'syncing' | 'error'

interface AuthSnapshot {
  user: User | null
  pseudo: string | null
  sync: SyncState
  error: string | null
}

let snapshot: AuthSnapshot = {
  user: null,
  pseudo: null,
  sync: isRemoteEnabled ? 'signed-out' : 'off',
  error: null,
}

const listeners = new Set<() => void>()

function set(patch: Partial<AuthSnapshot>) {
  snapshot = { ...snapshot, ...patch }
  for (const l of listeners) l()
}

export function useAuth(): AuthSnapshot {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => snapshot,
    () => snapshot,
  )
}

/**
 * Fusionne deux progressions carte par carte.
 * Pour chaque mot on garde la révision la plus récente : deux appareils
 * peuvent avoir travaillé des mots différents hors ligne sans que l'un
 * n'annule le travail de l'autre.
 */
export function mergeProgress(local: Progress, remote: Progress): Progress {
  const merged: Progress = structuredClone(
    Date.parse(remote.updatedAt) > Date.parse(local.updatedAt) ? remote : local,
  )

  merged.cards = { ...remote.cards }
  for (const [key, localCard] of Object.entries(local.cards)) {
    const remoteCard = remote.cards[key]
    if (
      !remoteCard ||
      Date.parse(localCard.lastReview) > Date.parse(remoteCard.lastReview)
    ) {
      merged.cards[key] = localCard
    }
  }

  merged.seen = { ...remote.seen }
  for (const [key, count] of Object.entries(local.seen)) {
    merged.seen[key] = Math.max(count, remote.seen[key] ?? 0)
  }

  merged.days = { ...remote.days }
  for (const [day, stats] of Object.entries(local.days)) {
    const other = remote.days[day]
    // Un même jour travaillé sur deux appareils : on prend le plus avancé,
    // additionner compterait deux fois les révisions déjà synchronisées.
    if (!other || stats.reviews > other.reviews) merged.days[day] = stats
  }

  merged.streak = {
    current: Math.max(local.streak.current, remote.streak.current),
    longest: Math.max(local.streak.longest, remote.streak.longest),
    lastDay:
      (local.streak.lastDay ?? '') > (remote.streak.lastDay ?? '')
        ? local.streak.lastDay
        : remote.streak.lastDay,
  }

  merged.updatedAt = new Date().toISOString()
  return merged
}

/** Résumé public : des totaux, jamais le détail de ce qui est su ou raté. */
export function publicSummary(p: Progress) {
  const mastered = Object.values(p.cards).filter(
    (c) => c.stability >= MASTERED_STABILITY_DAYS,
  ).length
  const since = Date.now() - 7 * 86_400_000
  const reviews7d = Object.entries(p.days)
    .filter(([day]) => Date.parse(day) >= since)
    .reduce((sum, [, s]) => sum + s.reviews, 0)
  return {
    streak: p.streak.current,
    mastered,
    reviews_7d: reviews7d,
    last_active: p.streak.lastDay,
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null

function schedulePush(progress: Progress) {
  if (!snapshot.user) return
  if (pushTimer) clearTimeout(pushTimer)
  // On écrit une fois la salve de réponses terminée, pas à chaque question.
  pushTimer = setTimeout(() => void push(progress), 4000)
}

async function push(progress: Progress) {
  const supabase = await getSupabase()
  if (!supabase || !snapshot.user) return
  set({ sync: 'syncing', error: null })
  const { error } = await supabase.from('progress').upsert({
    user_id: snapshot.user.id,
    payload: progress,
    updated_at: progress.updatedAt,
  })
  if (error) {
    set({ sync: 'error', error: error.message })
    return
  }
  const { error: statsError } = await supabase
    .from('profiles')
    .update(publicSummary(progress))
    .eq('id', snapshot.user.id)
  set(
    statsError
      ? { sync: 'error', error: statsError.message }
      : { sync: 'idle', error: null },
  )
}

async function pullAndMerge(user: User) {
  const supabase = await getSupabase()
  if (!supabase) return
  set({ sync: 'syncing', error: null })

  const [{ data: row, error }, { data: profile }] = await Promise.all([
    supabase.from('progress').select('payload').eq('user_id', user.id).maybeSingle(),
    supabase.from('profiles').select('pseudo').eq('id', user.id).maybeSingle(),
  ])

  if (error) {
    set({ sync: 'error', error: error.message })
    return
  }

  const local = getProgress()
  const merged = row?.payload
    ? mergeProgress(local, row.payload as Progress)
    : local
  replaceProgress(merged)
  set({ pseudo: profile?.pseudo ?? (await ensureProfile(user)), sync: 'idle' })
  await push(merged)
}

/**
 * Crée le profil s'il manque encore.
 *
 * Le projet Supabase étant partagé avec une autre application, on évite d'y
 * poser un déclencheur sur auth.users : il porterait le nom canonique de la
 * documentation et écraserait celui de l'autre application. Le profil est donc
 * créé par l'application, ici en filet de sécurité — ce qui a l'avantage de
 * n'inscrire dans la liste que les comptes ayant réellement ouvert Lang.
 */
async function ensureProfile(user: User): Promise<string | null> {
  const supabase = await getSupabase()
  if (!supabase) return null
  const pseudo =
    (user.user_metadata?.pseudo as string | undefined)?.trim() ||
    user.email?.split('@')[0] ||
    'anonyme'

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, pseudo, ...publicSummary(getProgress()) })
  return error ? null : pseudo
}

export async function initAuth() {
  const supabase = await getSupabase()
  if (!supabase) return
  setProgressListener(schedulePush)

  const { data } = await supabase.auth.getSession()
  if (data.session?.user) {
    set({ user: data.session.user })
    await pullAndMerge(data.session.user)
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null
    set({ user, sync: user ? 'idle' : 'signed-out' })
    if (user) void pullAndMerge(user)
  })
}

export async function signUp(email: string, password: string, pseudo: string) {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Synchronisation non configurée.')
  // Le pseudo est aussi rangé dans les métadonnées du compte : si la création
  // du profil échoue juste après (réseau coupé, inscription à confirmer par
  // email), il sera retrouvé à la première connexion par ensureProfile.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { pseudo } },
  })
  if (error) throw error
  if (data.user) {
    await supabase
      .from('profiles')
      .upsert({ id: data.user.id, pseudo, ...publicSummary(getProgress()) })
    set({ pseudo })
  }
}

export async function signIn(email: string, password: string) {
  const supabase = await getSupabase()
  if (!supabase) throw new Error('Synchronisation non configurée.')
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  const supabase = await getSupabase()
  if (!supabase) return
  await supabase.auth.signOut()
  set({ user: null, pseudo: null, sync: 'signed-out' })
}

export async function fetchProfiles(): Promise<PublicProfile[]> {
  const supabase = await getSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, pseudo, streak, mastered, reviews_7d, last_active')
    .order('reviews_7d', { ascending: false })
  if (error || !data) return []
  return data.map((r) => ({
    id: r.id as string,
    pseudo: r.pseudo as string,
    streak: (r.streak as number) ?? 0,
    mastered: (r.mastered as number) ?? 0,
    reviews7d: (r.reviews_7d as number) ?? 0,
    lastActive: (r.last_active as string) ?? null,
  }))
}
