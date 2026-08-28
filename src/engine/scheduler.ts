// Construction d'une session : quels mots, dans quel ordre, sous quelle forme.

import type { Course, Exercise, Lexeme } from '../types'
import type { CardState } from './fsrs'
import { isDue, retrievability } from './fsrs'
import type { Progress } from '../store/progress'
import { cardKey, newWordsToday } from '../store/progress'

/**
 * `introduce` montre le mot, son sens et un exemple, sans rien demander.
 * `test` interroge, et l'encadré de présentation n'est alors plus affiché.
 *
 * Les deux ne doivent jamais tenir sur le même écran : la réponse attendue
 * serait lisible juste au-dessus de la question, et l'exercice se réduirait à
 * une recopie.
 */
export type SessionPhase = 'introduce' | 'test'

export interface SessionItem {
  lexeme: Lexeme
  exercise: Exercise
  isNew: boolean
  unitTitle: string
  phase: SessionPhase
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
      case 'flip':
        // Intermédiaire : reconnaître sans choix proposé, mais sans écrire.
        return stability < 1 ? 2 : 1
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

/** Questions qui séparent la présentation d'un mot de son premier test. */
const INTRODUCTION_GAP = 4

/**
 * Insère, après chaque présentation, le test correspondant quelques questions
 * plus loin. L'écart laisse le mot quitter la mémoire immédiate : le
 * retrouver demande alors un vrai effort de rappel, ce qui est précisément ce
 * qui fixe le souvenir.
 */
export function scheduleIntroductions(
  base: SessionItem[],
  gap = INTRODUCTION_GAP,
): SessionItem[] {
  const out: SessionItem[] = []
  const pending: { item: SessionItem; dueAt: number }[] = []
  let i = 0

  while (i < base.length || pending.length) {
    const ready = pending.findIndex((p) => p.dueAt <= out.length)
    if (ready !== -1) {
      out.push(pending[ready].item)
      pending.splice(ready, 1)
      continue
    }
    if (i < base.length) {
      const item = base[i++]
      out.push(item)
      if (item.phase === 'introduce') {
        pending.push({
          item: { ...item, phase: 'test' },
          dueAt: out.length + gap,
        })
      }
    } else {
      // Fin de la file : on sort les tests restants dans l'ordre prévu.
      pending.sort((a, b) => a.dueAt - b.dueAt)
      out.push(pending.shift()!.item)
    }
  }
  return out
}

/**
 * `daily` respecte le rythme conseillé : ce qui est dû, plus un quota de mots
 * neufs. `free` ignore les deux, pour qui veut travailler plus longtemps —
 * il pioche les mots restants puis les plus fragiles, même non échus.
 */
export type SessionMode = 'daily' | 'free'

export function buildSession(
  course: Course,
  index: CourseIndex,
  progress: Progress,
  now = new Date(),
  mode: SessionMode = 'daily',
  /** Restreint la session à une unité — un continent, par exemple. */
  unitTitle?: string,
): SessionItem[] {
  const size = progress.settings.dailyGoal
  const newBudget =
    mode === 'free'
      ? Infinity
      : Math.max(
          progress.settings.newPerDay - newWordsToday(progress, course.id, now),
          0,
        )

  const dueItems: { item: SessionItem; lateness: number }[] = []
  const earlyItems: { item: SessionItem; retention: number }[] = []
  const freshItems: SessionItem[] = []

  for (const lex of index.lexemes) {
    if (unitTitle && index.unitOf.get(lex.id) !== unitTitle) continue
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
      // On collecte tous les candidats : le plafond est appliqué plus bas,
      // après un éventuel brassage entre unités.
      freshItems.push({ ...base, isNew: true, phase: 'introduce' })
    } else if (isDue(card, now)) {
      dueItems.push({
        item: { ...base, isNew: false, phase: 'test' },
        lateness: now.getTime() - Date.parse(card.due),
      })
    } else if (mode === 'free') {
      // Mot pas encore échu : on le garde en réserve, les moins bien retenus
      // d'abord, pour que l'entraînement libre serve vraiment à quelque chose.
      const elapsed = (now.getTime() - Date.parse(card.lastReview)) / 86_400_000
      earlyItems.push({
        item: { ...base, isNew: false, phase: 'test' },
        retention: retrievability(elapsed, card.stability),
      })
    }
  }

  // Les mots les plus en retard sont les plus près d'être perdus.
  dueItems.sort((a, b) => b.lateness - a.lateness)
  earlyItems.sort((a, b) => a.retention - b.retention)

  // Sans continent choisi, un cours de connaissances doit brasser ses unités :
  // en suivant leur ordre, on passerait des semaines sur l'Europe avant de
  // voir un seul pays d'Afrique. Les cours de langue, eux, gardent leur ordre,
  // qui est pédagogique.
  const fresh = (
    course.filterByUnit && !unitTitle
      ? roundRobinByUnit(freshItems)
      : freshItems
  ).slice(0, Math.min(newBudget, size))

  // La place restante revient aux révisions : c'est le nombre de mots neufs
  // retenus qui compte ici, pas celui des candidats.
  const reviews = [
    ...dueItems.map((d) => d.item),
    ...earlyItems.map((e) => e.item),
  ].slice(0, Math.max(size - fresh.length, 0))

  // Le plafond porte sur les questions de fond ; les présentations, qui ne
  // demandent aucune réponse, s'y ajoutent.
  const base = interleave(reviews, fresh).slice(0, size)
  return scheduleIntroductions(base)
}

/** Alterne les unités : un pays d'Europe, un d'Afrique, un d'Asie, etc. */
function roundRobinByUnit(items: SessionItem[]): SessionItem[] {
  const groups = new Map<string, SessionItem[]>()
  for (const item of items) {
    const group = groups.get(item.unitTitle)
    if (group) group.push(item)
    else groups.set(item.unitTitle, [item])
  }
  const queues = [...groups.values()]
  const out: SessionItem[] = []
  let remaining = items.length
  while (remaining > 0) {
    for (const queue of queues) {
      const next = queue.shift()
      if (next) {
        out.push(next)
        remaining--
      }
    }
  }
  return out
}

/** Ce qui reste à faire aujourd'hui, pour l'écran d'accueil. */
export function pendingCount(
  course: Course,
  index: CourseIndex,
  progress: Progress,
  now = new Date(),
  unitTitle?: string,
): { due: number; fresh: number; remaining: number } {
  let due = 0
  let fresh = 0
  let remaining = 0
  const newBudget = Math.max(
    progress.settings.newPerDay - newWordsToday(progress, course.id, now),
    0,
  )

  for (const lex of index.lexemes) {
    if (unitTitle && index.unitOf.get(lex.id) !== unitTitle) continue
    const card = progress.cards[cardKey(course.id, lex.id)]
    if (!card) {
      if (fresh < newBudget) fresh++
      // Mots du cours encore jamais vus, quota du jour mis à part : c'est ce
      // que l'entraînement libre peut encore offrir.
      else remaining++
    } else if (isDue(card, now)) {
      due++
    }
  }
  return { due, fresh, remaining }
}
