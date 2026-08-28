// Modèle de données du contenu pédagogique.
// Le contenu vit dans des fichiers JSON versionnés dans le repo : il est
// identique pour tout le monde, ne change qu'entre deux déploiements, et n'a
// donc rien à faire dans une base de données. Supabase ne stocke que la
// progression personnelle.

export type LangCode = 'en' | 'ja' | 'vi' | 'id' | 'ar' | 'fr'

export type Pos = 'verb' | 'noun' | 'adj' | 'adv' | 'phrase' | 'expr'

/** Un mot ou une expression à apprendre : l'unité de mémorisation. */
export interface Lexeme {
  id: string
  term: string
  /** Translittération, pour les langues qui n'utilisent pas l'alphabet latin. */
  roman?: string
  pos?: Pos
  /** Sens en français. */
  gloss: string
  /** Nuance, registre, faux-ami, piège fréquent. */
  note?: string
  /** Absent pour un fait bref, comme une capitale, où l'exemple serait creux. */
  examples?: Example[]
}

export interface Example {
  text: string
  fr: string
  roman?: string
}

/** Phrase à trou : on écrit le mot manquant. Le format préféré de Thibault. */
export interface ClozeExercise {
  kind: 'cloze'
  id: string
  lexemeId: string
  /** La phrase française qui donne le sens visé. */
  fr: string
  /** La phrase cible, avec ___ à la place du mot manquant. */
  sentence: string
  /** Toutes les réponses considérées comme justes (la 1re est la référence). */
  accepted: string[]
  /** Réponses plausibles mais fausses, avec l'explication du pourquoi. */
  nearMisses?: NearMiss[]
  hint?: string
}

export interface NearMiss {
  word: string
  why: string
}

/** Choix multiple : plus rapide, bon pour introduire un mot nouveau. */
export interface ChoiceExercise {
  kind: 'choice'
  id: string
  lexemeId: string
  prompt: string
  options: string[]
  answer: string
  /** Explication affichée après la réponse, juste ou fausse. */
  why?: string
}

/** Production : on retrouve le mot cible à partir du français seul. */
export interface RecallExercise {
  kind: 'recall'
  id: string
  lexemeId: string
  fr: string
  accepted: string[]
  hint?: string
  /** Remplace l'intitulé « Comment dit-on ? », inadapté hors des langues. */
  prompt?: string
}

/**
 * Carte à retourner : on cherche de tête, on retourne, on dit si l'on savait.
 *
 * C'est le seul exercice où l'utilisateur s'auto-évalue. Ailleurs la note est
 * déduite de la réponse, ce qui est plus fiable ; mais pour un fait bref comme
 * une capitale, taper la réponse au pouce coûte plus qu'il ne rapporte.
 */
export interface FlipExercise {
  kind: 'flip'
  id: string
  lexemeId: string
  /** Face visible au départ. */
  front: string
  /** Face révélée après le retournement. */
  back: string
  /** Précision affichée avec la réponse. */
  note?: string
}

/** Écoute : la phrase est lue par le navigateur, on la transcrit. */
export interface ListenExercise {
  kind: 'listen'
  id: string
  lexemeId: string
  /** Texte lu à voix haute et attendu en réponse. */
  text: string
  fr: string
}

export type Exercise =
  | ClozeExercise
  | ChoiceExercise
  | RecallExercise
  | ListenExercise
  | FlipExercise

export type ExerciseKind = Exercise['kind']

/** Un ensemble cohérent de mots et d'exercices : un thème, une leçon. */
export interface Unit {
  id: string
  title: string
  subtitle?: string
  lexemes: Lexeme[]
  exercises: Exercise[]
}

export interface Course {
  id: string
  lang: LangCode
  /** Code BCP-47 passé à la synthèse vocale du navigateur. */
  voice: string
  title: string
  /** Le sens de lecture, pour l'arabe. */
  rtl?: boolean
  /** Masque les boutons d'écoute, sans objet hors apprentissage d'une langue. */
  silent?: boolean
  /**
   * Propose de ne réviser qu'une unité à la fois — un continent pour les
   * capitales. Les cours de langue gardent leurs unités mélangées, l'ordre
   * de découverte y étant pédagogique.
   */
  filterByUnit?: boolean
  units: Unit[]
}
