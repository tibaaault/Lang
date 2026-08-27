// Construction d'une session : quels mots, dans quel ordre, sous quelle forme.

import type { Course, Exercise, Lexeme } from '../types'
import type { CardState } from './fsrs'
import { isDue } from './fsrs'
import type { Progress } from '../store/progress'
import { cardKey, today } from '../store/progress'

export interface SessionItem {
  lexeme: Lexeme
  exercise: Exercise
  isNew: boolean
  unitTitle: string
  /** Rejoué en fin de session après une erreur : ne replanifie pas la carte. */
  replay?: boolean
}

export interface CourseIndex {
  lexemes: Lexeme[]
  byId: Map<string, Lexeme>
  unitOf: Map<string, string>
  exercisesOf: Map<string, Exercise[]>
}

export function indexCourse(course: Course): CourseIndex {
  const byId = new Map<string, Lexeme>()
  const unitOf = new Map<string, string>()
  const exercisesOf = new Map<string, Exercise[]>()
  const lexemes: Lexeme[] = []

  for (const unit of course.units) {
    for (const lex of unit.lexemes) {
      lexemes.push(lex)
      byId.set(lex.id, lex)
      unitOf.set(lex.id, unit.title)
    }
    for (const ex of unit.exercises) {
      const list = exercisesOf.get(ex.lexemeId)
      if (list) list.push(ex)
      else exercisesOf.set(ex.lexemeId, [ex])
    }
  }
  return { lexemes, byId, unitOf, exercisesOf }
}

/**
 * Choisit la forme d'exercice la plus utile pour ce mot maintenant.
 * Un mot tout juste rencontré se reconnaît avant de se produire : on commence
 * par un choix multiple, puis on exige de l'écrire, puis de le retrouver sans
 * la phrase. La difficulté suit la solidité de la trace mémoire.
 */
function pickExercise(
  candidates: Exercise[],
  card: CardState | undefined,
  seen: Record<string, number>,
): Exercise | null {
  if (!candidates.length) return null

  const stability = card?.stability ?? 0
  const rank = (ex: Exercise): number => {
    switch (ex.kind) {
      case 'choice':
        // Devient trop facile dès que le mot tient quelques jours.
        return stability >= 4 ? 3 : 0
      case 'cloze':
        return stability < 1 ? 1 : 0
      case 'recall':
        return stability < 2 ? 2 : 0
      case 'listen':
        return stability < 3 ? 2 : 1
    }
  }

  let best: Exercise | null = null
  let bestScore = Infinity
  for (const ex of candidates) {
    // À pertinence égale, on ressort l'exercice le moins vu.
    const score = rank(ex) * 100 + (seen[ex.id] ?? 0)
    if (score < bestScore) {
      bestScore = score
      best = ex
    }
  }
  return best
}

/** Entrelace deux listes pour ne pas enchaîner dix mots neufs d'affilée. */
function interleave<T>(reviews: T[], fresh: T[]): T[] {
  const out: T[] = []
  let r = 0
  let f = 0
  // Un mot nouveau toutes les trois révisions : assez pour progresser, assez
  // peu pour ne pas saturer la mémoire de travail.
  while (r < reviews.length || f < fresh.length) {
    for (let i = 0; i < 3 && r < reviews.length; i++) out.push(reviews[r++])
    if (f < fresh.length) out.push(fresh[f++])
    if (r >= reviews.length && f < fresh.length) {
      out.push(...fresh.slice(f))
      break
    }
  }
  return out
}

export function buildSession(
  course: Course,
  index: CourseIndex,
  progress: Progress,
  now = new Date(),
): SessionItem[] {
  const size = progress.settings.dailyGoal
  const doneToday = progress.days[today(now)]?.newWords ?? 0
  const newBudget = Math.max(progress.settings.newPerDay - doneToday, 0)

  const dueItems: { item: SessionItem; lateness: number }[] = []
  const freshItems: SessionItem[] = []

  for (const lex of index.lexemes) {
    const card = progress.cards[cardKey(course.id, lex.id)]
    const exercise = pickExercise(
      index.exercisesOf.get(lex.id) ?? [],
      card,
      progress.seen,
    )
    if (!exercise) continue

    const base = {
      lexeme: lex,
      exercise,
      unitTitle: index.unitOf.get(lex.id) ?? course.title,
    }

    if (!card) {
      if (freshItems.length < newBudget) {
        freshItems.push({ ...base, isNew: true })
      }
    } else if (isDue(card, now)) {
      dueItems.push({
        item: { ...base, isNew: false },
        lateness: now.getTime() - Date.parse(card.due),
      })
    }
  }

  // Les mots les plus en retard sont les plus près d'être perdus.
  dueItems.sort((a, b) => b.lateness - a.lateness)

  const reviews = dueItems.slice(0, Math.max(size - freshItems.length, 0)).map((d) => d.item)
  return interleave(reviews, freshItems).slice(0, size)
}

/** Ce qui reste à faire aujourd'hui, pour l'écran d'accueil. */
export function pendingCount(
  course: Course,
  index: CourseIndex,
  progress: Progress,
  now = new Date(),
): { due: number; fresh: number } {
  let due = 0
  let fresh = 0
  const doneToday = progress.days[today(now)]?.newWords ?? 0
  const newBudget = Math.max(progress.settings.newPerDay - doneToday, 0)

  for (const lex of index.lexemes) {
    const card = progress.cards[cardKey(course.id, lex.id)]
    if (!card) {
      if (fresh < newBudget) fresh++
    } else if (isDue(card, now)) {
      due++
    }
  }
  return { due, fresh }
}
