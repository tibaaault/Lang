// Fabrique des leçons d'un parcours guidé.
//
// Une leçon n'est pas écrite exercice par exercice : le contenu ne donne que
// des mots et des phrases, et les exercices en sont tirés ici. On y gagne
// deux choses. Refaire une leçon ne repasse jamais le même film, puisque les
// formes et les leurres sont retirés au sort ; et ajouter du contenu revient
// à écrire une phrase, pas six variantes de la même question.
//
// La progression à l'intérieur d'une leçon va du plus guidé au plus libre :
// voir le mot, le reconnaître, l'apparier, comprendre une phrase, la
// construire, puis l'écrire.

import type { Course, Lesson, Lexeme, Phrase, Unit } from '../types'
import type { Progress } from '../store/progress'
import { cardKey } from '../store/progress'
import { isDue, retrievability } from './fsrs'
import { shuffle } from './shuffle'
import { makeTokenizer, type Tokenizer } from './tokens'

export interface LessonRef {
  lesson: Lesson
  unit: Unit
  /** Rang dans le parcours entier, toutes unités confondues. */
  order: number
}

export interface PathIndex {
  course: Course
  words: Lexeme[]
  byId: Map<string, Lexeme>
  lessons: LessonRef[]
  byLessonId: Map<string, LessonRef>
  /** Rang de la leçon qui enseigne chaque mot. */
  lessonOfWord: Map<string, number>
  /** Du terme, en minuscules, vers l'identifiant du mot. */
  idOfTerm: Map<string, string>
  tokenizer: Tokenizer
  /**
   * Prononciation en lettres latines d'un texte, mot à mot ; rien si le
   * cours s'écrit déjà en alphabet latin.
   */
  roman: (text: string) => string | undefined
  /** Pictogramme d'un mot, retrouvé par son terme ou par son sens. */
  emoji: (termOrGloss: string) => string | undefined
}

export function indexPath(course: Course): PathIndex {
  const words: Lexeme[] = []
  const byId = new Map<string, Lexeme>()
  const lessons: LessonRef[] = []
  const byLessonId = new Map<string, LessonRef>()
  const lessonOfWord = new Map<string, number>()
  const idOfTerm = new Map<string, string>()

  for (const unit of course.units) {
    for (const lex of unit.lexemes) {
      words.push(lex)
      byId.set(lex.id, lex)
      idOfTerm.set(lex.term.toLocaleLowerCase(), lex.id)
    }
    for (const lesson of unit.lessons ?? []) {
      const ref = { lesson, unit, order: lessons.length }
      lessons.push(ref)
      byLessonId.set(lesson.id, ref)
      for (const id of lesson.lexemeIds) lessonOfWord.set(id, ref.order)
    }
  }

  const emojiOf = new Map<string, string>()
  for (const w of words) {
    if (!w.emoji) continue
    emojiOf.set(w.term, w.emoji)
    emojiOf.set(w.gloss, w.emoji)
  }

  const tokenizer = makeTokenizer(
    words.map((w) => w.term),
    course.properNouns ?? [],
  )
  const roman = (text: string) =>
    course.romanized
      ? tokenizer
          .target(text)
          .map((t) => {
            const id = idOfTerm.get(t.toLocaleLowerCase())
            return (id && byId.get(id)?.roman) || t
          })
          .join(' ')
      : undefined

  return {
    course,
    words,
    byId,
    lessons,
    byLessonId,
    lessonOfWord,
    idOfTerm,
    tokenizer,
    roman,
    emoji: (key) => emojiOf.get(key),
  }
}

// --- Les formes d'exercice ---------------------------------------------------

/** Présentation d'un mot neuf : on montre, on n'interroge pas. */
export interface IntroStep {
  kind: 'intro'
  key: string
  word: Lexeme
}

/**
 * Choix entre quatre propositions.
 * `meaning` : le mot est affiché et lu, on choisit son sens.
 * `term` : le sens est affiché, on choisit le mot.
 * `listen` : le mot est seulement lu, on choisit son sens.
 */
export interface ChoiceStep {
  kind: 'choice'
  key: string
  mode: 'meaning' | 'term' | 'listen'
  wordId: string
  term: string
  gloss: string
  options: string[]
  answer: string
}

/** Paires à relier : chaque mot avec son sens. */
export interface MatchStep {
  kind: 'match'
  key: string
  pairs: { id: string; term: string; gloss: string }[]
}

/**
 * Phrase à assembler à partir de tuiles.
 * `to-fr` : la phrase est affichée et lue, on la traduit en français.
 * `to-target` : la phrase française est affichée, on la construit.
 * `listen` : la phrase est seulement lue, on la reconstruit.
 */
export interface BuildStep {
  kind: 'build'
  key: string
  mode: 'to-fr' | 'to-target' | 'listen'
  wordIds: string[]
  phrase: Phrase
  tiles: string[]
  answer: string[]
}

/** Phrase à trou, complétée par un choix parmi quatre mots. */
export interface FillStep {
  kind: 'fill'
  key: string
  wordId: string
  phrase: Phrase
  /** La phrase avec ___ à la place du mot. */
  sentence: string
  options: string[]
  answer: string
}

/** Le mot à écrire à partir de son sens. */
export interface TypeStep {
  kind: 'type'
  key: string
  wordId: string
  term: string
  gloss: string
}

export type Step =
  | IntroStep
  | ChoiceStep
  | MatchStep
  | BuildStep
  | FillStep
  | TypeStep

let counter = 0
const nextKey = () => `s${++counter}`

// --- Leurres -----------------------------------------------------------------

/**
 * Tire `n` éléments distincts de la réponse dans des viviers classés du plus
 * proche au plus lointain. Un leurre pris dans la même leçon oblige à
 * distinguer ce que l'on vient d'apprendre ; un leurre lointain se devine.
 */
function pick(tiers: string[][], exclude: string[], n: number): string[] {
  const taken = new Set(exclude.map((e) => e.toLocaleLowerCase()))
  const out: string[] = []
  for (const tier of tiers) {
    for (const candidate of shuffle(tier)) {
      if (out.length >= n) return out
      const k = candidate.toLocaleLowerCase()
      if (taken.has(k)) continue
      taken.add(k)
      out.push(candidate)
    }
  }
  return out
}

interface Pools {
  /** Mots classés par proximité : la leçon, l'unité, puis le reste connu. */
  words: Lexeme[][]
  /** Phrases dont on tire les tuiles en trop, même classement. */
  phrases: Phrase[][]
}

function makeChoice(
  word: Lexeme,
  mode: ChoiceStep['mode'],
  pools: Pools,
): ChoiceStep {
  const asTerm = mode === 'term'
  const answer = asTerm ? word.term : word.gloss
  const others = pick(
    pools.words.map((tier) => tier.map((w) => (asTerm ? w.term : w.gloss))),
    [answer],
    3,
  )
  return {
    kind: 'choice',
    key: nextKey(),
    mode,
    wordId: word.id,
    term: word.term,
    gloss: word.gloss,
    options: shuffle([answer, ...others]),
    answer,
  }
}

function makeMatch(words: Lexeme[]): MatchStep {
  return {
    kind: 'match',
    key: nextKey(),
    pairs: words.map((w) => ({ id: w.id, term: w.term, gloss: w.gloss })),
  }
}

function makeType(word: Lexeme): TypeStep {
  return {
    kind: 'type',
    key: nextKey(),
    wordId: word.id,
    term: word.term,
    gloss: word.gloss,
  }
}

/** Les mots du cours présents dans une phrase. */
export function wordsOfPhrase(index: PathIndex, phrase: Phrase): string[] {
  const ids: string[] = []
  for (const token of index.tokenizer.target(phrase.text)) {
    const id = index.idOfTerm.get(token.toLocaleLowerCase())
    if (id && !ids.includes(id)) ids.push(id)
  }
  return ids
}

function makeBuild(
  index: PathIndex,
  phrase: Phrase,
  mode: BuildStep['mode'],
  pools: Pools,
): BuildStep | null {
  const toFr = mode === 'to-fr'
  const tokenize = toFr ? index.tokenizer.fr : index.tokenizer.target
  const answer = tokenize(toFr ? phrase.fr : phrase.text)
  // Une seule tuile à poser n'est pas un exercice.
  if (answer.length < 2) return null

  const extra = pick(
    pools.phrases.map((tier) =>
      tier.flatMap((p) => tokenize(toFr ? p.fr : p.text)),
    ),
    answer,
    answer.length <= 3 ? 4 : 3,
  )
  return {
    kind: 'build',
    key: nextKey(),
    mode,
    wordIds: wordsOfPhrase(index, phrase),
    phrase,
    tiles: shuffle([...answer, ...extra]),
    answer,
  }
}

function makeFill(
  index: PathIndex,
  phrase: Phrase,
  /** Mots à faire deviner en priorité : ceux de la leçon. */
  focus: Set<string>,
  pools: Pools,
): FillStep | null {
  const tokens = index.tokenizer.target(phrase.text)
  if (tokens.length < 2) return null

  const idAt = (i: number) => index.idOfTerm.get(tokens[i].toLocaleLowerCase())
  const positions = tokens.map((_, i) => i).filter((i) => idAt(i))
  const preferred = positions.filter((i) => focus.has(idAt(i)!))
  const candidates = preferred.length ? preferred : positions
  if (!candidates.length) return null
  const hole = candidates[Math.floor(Math.random() * candidates.length)]

  const answer = tokens[hole]
  const others = pick(
    pools.words.map((tier) => tier.map((w) => w.term)),
    // Un mot déjà présent ailleurs dans la phrase ferait un leurre défendable.
    tokens,
    3,
  )
  const shown = tokens.map((t, i) => (i === hole ? '___' : t)).join(' ')
  const end = /[.!?…]$/.exec(phrase.text.trim())?.[0] ?? ''

  return {
    kind: 'fill',
    key: nextKey(),
    wordId: idAt(hole)!,
    phrase,
    sentence: shown.charAt(0).toLocaleUpperCase() + shown.slice(1) + end,
    options: shuffle([answer, ...others]),
    answer,
  }
}

type PhraseMode = BuildStep['mode'] | 'fill'

/**
 * Tire un exercice d'une phrase, dans la forme demandée si elle s'y prête,
 * sinon dans la première qui convient.
 */
function makePhraseStep(
  index: PathIndex,
  phrase: Phrase,
  mode: PhraseMode,
  focus: Set<string>,
  pools: Pools,
): Step | null {
  const order: PhraseMode[] = [mode, 'to-target', 'to-fr', 'fill']
  for (const m of order) {
    const step =
      m === 'fill'
        ? makeFill(index, phrase, focus, pools)
        : makeBuild(index, phrase, m, pools)
    if (step) return step
  }
  return null
}

/** Un sens entre parenthèses décrit un rôle grammatical : rien à écrire. */
const typable = (w: Lexeme) => !w.gloss.startsWith('(')
/** Un alphabet que le clavier ne sait pas saisir : on n'y écrit pas. */
const canType = (index: PathIndex) => !index.course.romanized

// --- Leçon -------------------------------------------------------------------

const PHRASE_ROTATION: PhraseMode[] = [
  'to-fr',
  'to-target',
  'listen',
  'fill',
  'to-target',
  'to-fr',
  'listen',
  'to-target',
]

export function buildLesson(
  index: PathIndex,
  lessonId: string,
  opts: { practice?: boolean } = {},
): Step[] {
  const ref = index.byLessonId.get(lessonId)
  if (!ref) return []
  const words = ref.lesson.lexemeIds.map((id) => index.byId.get(id)!)
  const inLesson = new Set(ref.lesson.lexemeIds)

  const earlierLessons = index.lessons.filter((l) => l.order < ref.order)
  const sameUnit = earlierLessons.filter((l) => l.unit === ref.unit)
  const wordsOf = (refs: LessonRef[]) =>
    refs.flatMap((l) => l.lesson.lexemeIds.map((id) => index.byId.get(id)!))
  const pools: Pools = {
    words: [
      words,
      wordsOf(sameUnit),
      wordsOf(earlierLessons),
      // Tout premier écran du cours : rien d'antérieur où puiser.
      index.words,
    ],
    phrases: [
      ref.lesson.phrases,
      sameUnit.flatMap((l) => l.lesson.phrases),
      earlierLessons.flatMap((l) => l.lesson.phrases),
      index.lessons.flatMap((l) => l.lesson.phrases),
    ],
  }

  const steps: Step[] = []

  if (opts.practice) {
    // Leçon déjà faite : plus de présentation, et l'écoute d'entrée de jeu.
    const modes: ChoiceStep['mode'][] = ['listen', 'term', 'meaning']
    shuffle(words).forEach((w, i) =>
      steps.push(makeChoice(w, modes[i % modes.length], pools)),
    )
  } else {
    // Deux mots à la fois : on les voit, puis on les reconnaît aussitôt,
    // avant que les suivants ne viennent les chasser de la mémoire immédiate.
    for (let i = 0; i < words.length; i += 2) {
      const pair = words.slice(i, i + 2)
      for (const w of pair) steps.push({ kind: 'intro', key: nextKey(), word: w })
      shuffle(pair).forEach((w, j) =>
        steps.push(makeChoice(w, j % 2 ? 'term' : 'meaning', pools)),
      )
      if (i > 0) {
        // Retour sur un mot de la paire précédente, à l'oreille seulement.
        const earlier = words.slice(0, i)
        const w = earlier[Math.floor(Math.random() * earlier.length)]
        steps.push(makeChoice(w, 'listen', pools))
      }
    }
  }

  steps.push(makeMatch(shuffle(words).slice(0, 5)))

  const phrases = shuffle(ref.lesson.phrases).slice(0, opts.practice ? 7 : 6)
  // Une leçon refaite attaque par la production, une première fois par la
  // compréhension.
  const shift = opts.practice ? 1 : 0
  phrases.forEach((phrase, i) => {
    const mode = PHRASE_ROTATION[(i + shift) % PHRASE_ROTATION.length]
    const step = makePhraseStep(index, phrase, mode, inLesson, pools)
    if (step) steps.push(step)
  })

  // On termine en écrivant : c'est ce qui fixe le mieux, et ce qui coûte le
  // plus au pouce — d'où un ou deux mots seulement.
  for (const w of shuffle(canType(index) ? words.filter(typable) : []).slice(
    0,
    opts.practice ? 2 : 1,
  )) {
    steps.push(makeType(w))
  }

  return steps
}

// --- Révision ----------------------------------------------------------------

/** Mots déjà rencontrés, et combien d'entre eux sont à revoir aujourd'hui. */
export function reviewStatus(
  index: PathIndex,
  progress: Progress,
  now = new Date(),
): { learned: number; due: number } {
  let learned = 0
  let due = 0
  for (const w of index.words) {
    const card = progress.cards[cardKey(index.course.id, w.id)]
    if (!card) continue
    learned++
    if (isDue(card, now)) due++
  }
  return { learned, due }
}

/**
 * Séance de révision : les mots échus d'abord, puis les plus fragiles, repris
 * dans les mêmes formes que les leçons, avec des phrases entièrement connues.
 */
export function buildReview(
  index: PathIndex,
  progress: Progress,
  now = new Date(),
  size = 10,
): Step[] {
  const known = index.words
    .map((word) => ({
      word,
      card: progress.cards[cardKey(index.course.id, word.id)],
    }))
    .filter((k) => k.card !== undefined)
  if (!known.length) return []

  const urgency = (k: (typeof known)[number]) => {
    const elapsed = (now.getTime() - Date.parse(k.card.lastReview)) / 86_400_000
    // Un mot échu passe devant tous les autres ; ensuite, le moins bien retenu.
    return (isDue(k.card, now) ? 0 : 1) + retrievability(elapsed, k.card.stability)
  }
  const chosen = [...known].sort((a, b) => urgency(a) - urgency(b)).slice(0, size)
  const chosenIds = new Set(chosen.map((k) => k.word.id))
  const knownIds = new Set(known.map((k) => k.word.id))

  // Seules les phrases dont tous les mots ont été vus : la révision ne doit
  // pas faire découvrir un mot par surprise.
  const knownPhrases = index.lessons
    .flatMap((l) => l.lesson.phrases)
    .filter((p) => wordsOfPhrase(index, p).every((id) => knownIds.has(id)))

  const pools: Pools = {
    words: [chosen.map((k) => k.word), known.map((k) => k.word), index.words],
    phrases: [knownPhrases, index.lessons.flatMap((l) => l.lesson.phrases)],
  }

  const wordSteps: Step[] = chosen.map((k, i) => {
    // Plus la trace est solide, plus la forme est exigeante.
    if (k.card.stability < 2) {
      return makeChoice(k.word, i % 2 ? 'listen' : 'meaning', pools)
    }
    if (i % 3 === 2 && canType(index) && typable(k.word)) return makeType(k.word)
    return makeChoice(k.word, i % 2 ? 'term' : 'listen', pools)
  })

  const phraseSteps: Step[] = []
  const relevant = shuffle(
    knownPhrases.filter((p) =>
      wordsOfPhrase(index, p).some((id) => chosenIds.has(id)),
    ),
  ).slice(0, 6)
  relevant.forEach((phrase, i) => {
    const mode = PHRASE_ROTATION[(i + 1) % PHRASE_ROTATION.length]
    const step = makePhraseStep(index, phrase, mode, chosenIds, pools)
    if (step) phraseSteps.push(step)
  })

  const steps = shuffle([...wordSteps, ...phraseSteps])
  if (chosen.length >= 3) {
    const match = makeMatch(shuffle(chosen.map((k) => k.word)).slice(0, 5))
    steps.splice(Math.floor(steps.length / 2), 0, match)
  }
  return steps
}

// --- État du parcours --------------------------------------------------------

export const lessonKey = (courseId: string, lessonId: string) =>
  `${courseId}:${lessonId}`

/** La première leçon jamais terminée : celle que le parcours met en avant. */
export function currentLesson(
  index: PathIndex,
  progress: Progress,
): LessonRef | undefined {
  return index.lessons.find(
    (l) => !progress.lessons?.[lessonKey(index.course.id, l.lesson.id)],
  )
}
