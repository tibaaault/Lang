// État de progression : la seule donnée qui appartienne vraiment à l'utilisateur.
//
// Elle vit d'abord en local (localStorage), ce qui rend l'application
// utilisable hors-ligne et instantanée au démarrage. Supabase n'intervient
// qu'en second rideau, pour retrouver sa progression sur un autre appareil.

import { useSyncExternalStore } from 'react'
import type { CardState } from '../engine/fsrs'
import { MASTERED_STABILITY_DAYS, isDue } from '../engine/fsrs'

export interface DayStats {
  reviews: number
  correct: number
  /** Secondes réellement passées à répondre. */
  seconds: number
  /** Total de mots découverts, toutes langues confondues. */
  newWords: number
  /**
   * Mots découverts aujourd'hui, par cours.
   * Le budget quotidien doit se compter langue par langue : apprendre huit
   * mots d'anglais ne doit pas épuiser le quota d'indonésien.
   */
  newByCourse?: Record<string, number>
  /** Points gagnés ce jour-là en terminant des leçons. */
  xp?: number
}

export interface Progress {
  version: 1
  /** Une carte par mot, indexée `courseId:lexemeId`. */
  cards: Record<string, CardState>
  /** Compteur d'apparitions par exercice, pour éviter les répétitions. */
  seen: Record<string, number>
  streak: { current: number; longest: number; lastDay: string | null }
  days: Record<string, DayStats>
  settings: {
    dailyGoal: number
    newPerDay: number
    audio: boolean
    /**
     * Identifiants des cours suivis. Absent signifie « tous ».
     * Chaque compte choisit son parcours : afficher un cours hors de portée
     * décourage plus qu'il ne motive.
     */
    courses?: string[]
    /**
     * Unité à réviser, par cours — un continent pour les capitales.
     * Absent ou vide signifie « tout le cours ».
     */
    unitFilter?: Record<string, string>
    /**
     * Ce que l'accueil affiche : l'identifiant d'un parcours guidé, ou
     * `others` pour la liste des autres cours. Absent, le parcours l'emporte.
     */
    homeTab?: string
  }
  /**
   * Leçons de parcours terminées, indexées `courseId:lessonId`, avec le
   * nombre de fois où chacune a été menée au bout.
   */
  lessons?: Record<string, number>
  /** Total des points gagnés. */
  xp?: number
  /** Horodatage de la dernière écriture, pour arbitrer la synchronisation. */
  updatedAt: string
}

// Chaque compte a son propre espace de stockage sur l'appareil. Sans ce
// cloisonnement, deux personnes partageant un téléphone héritent l'une de la
// progression de l'autre : c'est exactement ce qui arrivait au compte créé en
// second, qui reprenait les réponses et les réglages du premier.
const STORAGE_KEY = 'lang.progress.v1'

/** Espace d'un compte donné ; sans compte, on reste sur l'espace anonyme. */
function storageKeyFor(userId: string | null): string {
  return userId ? `${STORAGE_KEY}.${userId}` : STORAGE_KEY
}

/**
 * Compte ayant repris la progression faite avant toute inscription.
 * Elle ne peut être reprise qu'une fois : le deuxième compte créé sur
 * l'appareil part forcément de zéro.
 */
const CLAIM_KEY = 'lang.anonymous-claimed-by'

let activeKey = STORAGE_KEY

export function emptyProgress(): Progress {
  return {
    version: 1,
    cards: {},
    seen: {},
    streak: { current: 0, longest: 0, lastDay: null },
    days: {},
    settings: { dailyGoal: 20, newPerDay: 8, audio: true },
    updatedAt: new Date(0).toISOString(),
  }
}

export function today(now = new Date()): string {
  // Date locale, pas UTC : une session à 23 h compte pour le bon jour.
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function load(key = activeKey): Progress {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as Progress
    if (parsed.version !== 1) return emptyProgress()
    // Complète les réglages ajoutés après coup sans perdre la progression.
    return { ...emptyProgress(), ...parsed, settings: { ...emptyProgress().settings, ...parsed.settings } }
  } catch {
    return emptyProgress()
  }
}

let state: Progress = load()
const listeners = new Set<() => void>()
let onChange: ((p: Progress, immediate: boolean) => void) | null = null

function emit(immediate = false) {
  try {
    localStorage.setItem(activeKey, JSON.stringify(state))
  } catch {
    // Quota plein ou mode privé : on continue en mémoire plutôt que planter.
  }
  for (const l of listeners) l()
  onChange?.(state, immediate)
}

/**
 * Branche la synchronisation distante (voir store/sync.ts).
 * `immediate` demande une sauvegarde sans attendre le délai habituel : les
 * réponses aux exercices s'enchaînent et supportent d'être regroupées, mais un
 * réglage est suivi d'une sortie d'écran, souvent d'une mise en arrière-plan
 * qui gèle les minuteries et ferait perdre la sauvegarde différée.
 */
export function setProgressListener(
  fn: ((p: Progress, immediate: boolean) => void) | null,
) {
  onChange = fn
}

export function getProgress(): Progress {
  return state
}

/** Vrai si du travail a été fait sur cet appareil avant toute inscription. */
export function hasUnclaimedAnonymousProgress(): boolean {
  try {
    if (localStorage.getItem(CLAIM_KEY)) return false
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as Progress
    return Object.keys(parsed.cards ?? {}).length > 0
  } catch {
    return false
  }
}

/**
 * Bascule l'application sur l'espace de stockage d'un compte.
 *
 * `adoptAnonymous` ne vaut que pour une première inscription depuis un
 * appareil déjà utilisé sans compte : la progression anonyme est alors
 * rattachée à ce compte, et à lui seul. Tout autre compte démarre vierge,
 * même sur le même téléphone.
 */
/**
 * Fusionne deux progressions locales en gardant, pour chaque mot, la révision
 * la plus récente. Sert à rattacher à un compte le travail fait avant de s'y
 * connecter, sans effacer ce que le compte contenait déjà.
 */
function mergeCards(base: Progress, extra: Progress): Progress {
  const merged: Progress = structuredClone(base)
  for (const [key, card] of Object.entries(extra.cards)) {
    const existing = merged.cards[key]
    if (
      !existing ||
      Date.parse(card.lastReview) > Date.parse(existing.lastReview)
    ) {
      merged.cards[key] = card
    }
  }
  for (const [day, stats] of Object.entries(extra.days)) {
    const other = merged.days[day]
    if (!other || stats.reviews > other.reviews) merged.days[day] = stats
  }
  merged.lessons = mergeLessons(base.lessons, extra.lessons)
  merged.xp = Math.max(base.xp ?? 0, extra.xp ?? 0)
  merged.streak = {
    current: Math.max(base.streak.current, extra.streak.current),
    longest: Math.max(base.streak.longest, extra.streak.longest),
    lastDay:
      (base.streak.lastDay ?? '') > (extra.streak.lastDay ?? '')
        ? base.streak.lastDay
        : extra.streak.lastDay,
  }
  merged.updatedAt = new Date().toISOString()
  return merged
}

/**
 * Réunit deux relevés de leçons terminées. On garde le plus grand compte de
 * chaque leçon : additionner compterait deux fois ce qui est déjà synchronisé.
 */
export function mergeLessons(
  a: Record<string, number> | undefined,
  b: Record<string, number> | undefined,
): Record<string, number> {
  const out = { ...a }
  for (const [key, count] of Object.entries(b ?? {})) {
    out[key] = Math.max(count, out[key] ?? 0)
  }
  return out
}

export function activateAccount(
  userId: string | null,
  adoptAnonymous = false,
): Progress {
  const key = storageKeyFor(userId)
  const stored = localStorage.getItem(key)

  let next: Progress
  if (userId && adoptAnonymous && hasUnclaimedAnonymousProgress()) {
    // La reprise demandée l'emporte sur l'espace déjà présent : c'est le cas
    // d'un compte existant qui récupère une session faite hors connexion.
    const anonymous = load(STORAGE_KEY)
    next = stored ? mergeCards(load(key), anonymous) : anonymous
    try {
      localStorage.setItem(CLAIM_KEY, userId)
    } catch {
      // Sans trace de reprise, la progression anonyme pourrait être reprise
      // une seconde fois : on continue, mais le cas reste rare.
    }
  } else if (stored) {
    next = load(key)
  } else {
    next = emptyProgress()
  }

  activeKey = key
  state = next
  emit()
  return next
}

export function replaceProgress(next: Progress) {
  state = next
  emit()
}

function update(fn: (draft: Progress) => void, immediate = false) {
  const next: Progress = structuredClone(state)
  fn(next)
  next.updatedAt = new Date().toISOString()
  state = next
  emit(immediate)
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    getProgress,
    getProgress,
  )
}

export const cardKey = (courseId: string, lexemeId: string) =>
  `${courseId}:${lexemeId}`

export function getCard(
  courseId: string,
  lexemeId: string,
): CardState | undefined {
  return state.cards[cardKey(courseId, lexemeId)]
}

/** Compte une réponse dans la journée et entretient la série de jours. */
function touchDay(p: Progress, correct: boolean, seconds: number): DayStats {
  const day = today()
  const stats = (p.days[day] ??= {
    reviews: 0,
    correct: 0,
    seconds: 0,
    newWords: 0,
  })
  stats.reviews += 1
  if (correct) stats.correct += 1
  // Une réponse qui prend plus de deux minutes est une pause, pas du travail.
  stats.seconds += Math.min(seconds, 120)

  if (p.streak.lastDay !== day) {
    const yesterday = today(new Date(Date.now() - 86_400_000))
    p.streak.current = p.streak.lastDay === yesterday ? p.streak.current + 1 : 1
    p.streak.longest = Math.max(p.streak.longest, p.streak.current)
    p.streak.lastDay = day
  }
  return stats
}

function countNewWord(stats: DayStats, courseId: string) {
  stats.newWords += 1
  stats.newByCourse = {
    ...stats.newByCourse,
    [courseId]: (stats.newByCourse?.[courseId] ?? 0) + 1,
  }
}

/**
 * Enregistre une réponse à un exercice de parcours.
 *
 * Un tel exercice peut porter sur plusieurs mots à la fois — une phrase à
 * assembler — ou sur aucun en particulier : la réponse compte toujours dans
 * la journée, et seules les fiches fournies sont replanifiées.
 */
export function recordStep(opts: {
  courseId: string
  correct: boolean
  seconds: number
  cards: { lexemeId: string; card: CardState; isNew: boolean }[]
}) {
  update((p) => {
    const stats = touchDay(p, opts.correct, opts.seconds)
    for (const { lexemeId, card, isNew } of opts.cards) {
      p.cards[cardKey(opts.courseId, lexemeId)] = card
      if (isNew) countNewWord(stats, opts.courseId)
    }
  })
}

/** Marque une leçon comme terminée et crédite ses points. */
export function completeLesson(courseId: string, lessonId: string | null, xp: number) {
  update((p) => {
    if (lessonId) {
      const key = `${courseId}:${lessonId}`
      p.lessons = { ...p.lessons, [key]: (p.lessons?.[key] ?? 0) + 1 }
    }
    p.xp = (p.xp ?? 0) + xp
    const stats = p.days[today()]
    if (stats) stats.xp = (stats.xp ?? 0) + xp
  }, true)
}

/** Enregistre le résultat d'une réponse et met à jour la série de jours. */
export function recordReview(opts: {
  courseId: string
  lexemeId: string
  card: CardState
  correct: boolean
  isNew: boolean
  seconds: number
  exerciseId: string
}) {
  update((p) => {
    p.cards[cardKey(opts.courseId, opts.lexemeId)] = opts.card
    p.seen[opts.exerciseId] = (p.seen[opts.exerciseId] ?? 0) + 1

    const stats = touchDay(p, opts.correct, opts.seconds)
    if (opts.isNew) countNewWord(stats, opts.courseId)
  })
}

/**
 * Mots découverts aujourd'hui dans ce cours précis.
 * La progression est passée en argument plutôt que lue dans l'état du module :
 * les fonctions de planification doivent pouvoir être appelées sur n'importe
 * quelle progression, y compris dans les tests.
 */
export function newWordsToday(
  progress: Progress,
  courseId: string,
  now = new Date(),
): number {
  const stats = progress.days[today(now)]
  if (!stats) return 0
  // Le repli se décide journée par journée, jamais cours par cours : dès que
  // le détail existe, une langue absente de ce détail vaut zéro. L'imputer au
  // total ferait épuiser le quota d'une langue par le travail d'une autre.
  if (stats.newByCourse) return stats.newByCourse[courseId] ?? 0
  // Journées enregistrées avant l'introduction du compteur par cours : seul le
  // total est connu, on l'impute au cours interrogé, ce qui est prudent.
  return stats.newWords
}

export function updateSettings(patch: Partial<Progress['settings']>) {
  update((p) => {
    p.settings = { ...p.settings, ...patch }
  }, true)
}

export function resetProgress() {
  replaceProgress(emptyProgress())
}

// --- Statistiques dérivées -------------------------------------------------

export interface CourseStats {
  known: number
  mastered: number
  due: number
  total: number
}

export function courseStats(
  progress: Progress,
  courseId: string,
  lexemeIds: string[],
  now = new Date(),
): CourseStats {
  let known = 0
  let mastered = 0
  let due = 0
  for (const id of lexemeIds) {
    const card = progress.cards[cardKey(courseId, id)]
    if (!card) continue
    known++
    if (card.stability >= MASTERED_STABILITY_DAYS) mastered++
    if (isDue(card, now)) due++
  }
  return { known, mastered, due, total: lexemeIds.length }
}
