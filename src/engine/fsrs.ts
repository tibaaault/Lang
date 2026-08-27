// FSRS 4.5 — Free Spaced Repetition Scheduler.
// Décide de la date à laquelle un mot doit revenir, à partir de deux
// variables : la stabilité (combien de temps la trace mémoire tient) et la
// difficulté (à quel point ce mot particulier résiste).
//
// Choix important : on ne demande jamais à l'utilisateur d'auto-évaluer sa
// réponse ("facile / moyen / difficile"), ce qui casse le rythme et fatigue.
// La note est déduite de ce qu'il a fait : voir gradeFromAnswer().

/** Poids par défaut de FSRS-4.5, entraînés sur un large corpus public. */
const W = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474,
  0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755,
] as const

const DECAY = -0.5
const FACTOR = 19 / 81

/** Probabilité visée de se souvenir au moment de la révision. */
export const DESIRED_RETENTION = 0.9

/** 1 = oublié, 2 = laborieux, 3 = su, 4 = immédiat. */
export type Grade = 1 | 2 | 3 | 4

export interface CardState {
  /** Stabilité en jours. */
  stability: number
  /** Difficulté intrinsèque, de 1 (facile) à 10 (coriace). */
  difficulty: number
  /** Nombre total de révisions. */
  reps: number
  /** Nombre d'oublis. */
  lapses: number
  /** Date de la dernière révision (ISO). */
  lastReview: string
  /** Date de la prochaine révision (ISO). */
  due: string
}

const clampD = (d: number) => Math.min(Math.max(d, 1), 10)
const clampS = (s: number) => Math.max(s, 0.01)

/** Probabilité de se souvenir après `elapsed` jours avec une stabilité `s`. */
export function retrievability(elapsedDays: number, s: number): number {
  return Math.pow(1 + (FACTOR * Math.max(elapsedDays, 0)) / s, DECAY)
}

/** Intervalle, en jours, au bout duquel la rétention retombe à `retention`. */
export function intervalFor(s: number, retention = DESIRED_RETENTION): number {
  const raw = (s / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1)
  // On garde au moins un jour, et on plafonne : au-delà de deux ans, l'écart
  // avec la réalité n'est plus mesurable et la carte semble abandonnée.
  return Math.min(Math.max(Math.round(raw), 1), 730)
}

function initialStability(g: Grade): number {
  return clampS(W[g - 1])
}

function initialDifficulty(g: Grade): number {
  return clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1)
}

function nextDifficulty(d: number, g: Grade): number {
  const delta = d - W[6] * (g - 3)
  // Retour progressif vers la difficulté moyenne : sans ça, une longue série
  // de réussites rendrait une carte artificiellement facile pour toujours.
  return clampD(W[7] * initialDifficulty(4) + (1 - W[7]) * delta)
}

function stabilityOnSuccess(d: number, s: number, r: number, g: Grade): number {
  const hardPenalty = g === 2 ? W[15] : 1
  const easyBonus = g === 4 ? W[16] : 1
  const growth =
    Math.exp(W[8]) *
    (11 - d) *
    Math.pow(s, -W[9]) *
    (Math.exp(W[10] * (1 - r)) - 1) *
    hardPenalty *
    easyBonus
  return clampS(s * (1 + growth))
}

function stabilityOnLapse(d: number, s: number, r: number): number {
  const next =
    W[11] *
    Math.pow(d, -W[12]) *
    (Math.pow(s + 1, W[13]) - 1) *
    Math.exp(W[14] * (1 - r))
  // Un oubli ne doit jamais rendre la carte plus solide qu'elle ne l'était.
  return clampS(Math.min(next, s))
}

const DAY_MS = 86_400_000

/** Première rencontre avec un mot. */
export function createCard(g: Grade, now = new Date()): CardState {
  const stability = initialStability(g)
  const difficulty = initialDifficulty(g)
  return {
    stability,
    difficulty,
    reps: 1,
    lapses: g === 1 ? 1 : 0,
    lastReview: now.toISOString(),
    due: new Date(
      now.getTime() + intervalFor(stability) * DAY_MS,
    ).toISOString(),
  }
}

/** Révision d'un mot déjà connu. */
export function reviewCard(
  card: CardState,
  g: Grade,
  now = new Date(),
): CardState {
  const elapsed = (now.getTime() - Date.parse(card.lastReview)) / DAY_MS
  const r = retrievability(elapsed, card.stability)
  const difficulty = nextDifficulty(card.difficulty, g)
  const stability =
    g === 1
      ? stabilityOnLapse(card.difficulty, card.stability, r)
      : stabilityOnSuccess(card.difficulty, card.stability, r, g)

  return {
    stability,
    difficulty,
    reps: card.reps + 1,
    lapses: card.lapses + (g === 1 ? 1 : 0),
    lastReview: now.toISOString(),
    due: new Date(
      now.getTime() + intervalFor(stability) * DAY_MS,
    ).toISOString(),
  }
}

/**
 * Traduit une réponse en note FSRS, sans rien demander à l'utilisateur.
 * Une réponse juste mais lente, mal orthographiée ou obtenue après un indice
 * révèle une trace mémoire fragile : elle vaut « laborieux », pas « su ».
 */
export function gradeFromAnswer(opts: {
  correct: boolean
  /** Faute de frappe ou orthographe approximative acceptée. */
  fuzzy?: boolean
  usedHint?: boolean
  elapsedMs?: number
}): Grade {
  if (!opts.correct) return 1
  if (opts.fuzzy || opts.usedHint) return 2
  if (opts.elapsedMs !== undefined && opts.elapsedMs < 4000) return 4
  return 3
}

/** Un mot est « acquis » quand il tient au moins trois semaines en mémoire. */
export const MASTERED_STABILITY_DAYS = 21

export function isDue(card: CardState, now = new Date()): boolean {
  return Date.parse(card.due) <= now.getTime()
}
