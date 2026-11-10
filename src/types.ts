// Modèle de données du contenu pédagogique.
// Le contenu vit dans des fichiers JSON versionnés dans le repo : il est
// identique pour tout le monde, ne change qu'entre deux déploiements, et n'a
// donc rien à faire dans une base de données. Supabase ne stocke que la
// progression personnelle.

export type LangCode = 'en' | 'ja' | 'vi' | 'th' | 'id' | 'ar' | 'fr'

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
  /** Pictogramme d'un mot concret : une image sans le poids d'une image. */
  emoji?: string
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

/** Une phrase d'un parcours, faite de mots déjà enseignés. */
export interface Phrase {
  text: string
  fr: string
}

/**
 * Une leçon d'un parcours guidé : quelques mots neufs et des phrases qui les
 * emploient. Les exercices ne sont pas écrits à la main : ils sont fabriqués
 * à la volée à partir de ces deux listes (voir engine/lesson.ts).
 */
export interface Lesson {
  id: string
  title: string
  lexemeIds: string[]
  phrases: Phrase[]
  /** Questions rédigées : usage, prononciation, registre. */
  quizzes?: Quiz[]
  /** Phrases à trou rédigées, où l'on écrit le mot manquant. */
  clozes?: ClozeExercise[]
  /** Réponses écrites admises pour un mot, au-delà de son terme. */
  accepted?: Record<string, string[]>
  /** Ce que la leçon contient, sous son titre. */
  summary?: string
  /**
   * Échange à écouter avant de répondre à des questions dessus. Ses
   * répliques servent ensuite de phrases à reconstruire.
   */
  dialogue?: DialogueLine[]
  /**
   * Leçon d'oreille : on y distingue des sons proches, sans rien écrire ni
   * assembler. Les règles d'une leçon ordinaire ne s'y appliquent pas.
   */
  drill?: boolean
  /** Nombres à reconnaître à l'écoute : un prix dit, un prix à taper. */
  numbers?: SpokenNumber[]
}

export interface DialogueLine {
  /** `A` pour l'interlocuteur, `B` pour le voyageur. */
  who: 'A' | 'B'
  text: string
  fr: string
}

export interface SpokenNumber {
  /** Le nombre tel qu'il se dit. */
  text: string
  value: number
}

/**
 * Question à choix rédigée à la main, avec son explication. Sert à ce qu'un
 * exercice fabriqué ne sait pas poser : pourquoi une tournure sonne mieux
 * qu'une autre, où tombe l'accent d'un mot, ce qu'un accent régional avale.
 */
export interface Quiz {
  prompt: string
  /** Texte lu à voix haute avec la question. */
  speak?: string
  /** Pictogramme montré en grand au-dessus de la question : un drapeau. */
  picture?: string
  /** La bonne réponse en premier ; l'ordre est mélangé à l'affichage. */
  options: string[]
  why: string
}

/** Un ensemble cohérent de mots et d'exercices : un thème, une leçon. */
export interface Unit {
  id: string
  title: string
  subtitle?: string
  lexemes: Lexeme[]
  exercises: Exercise[]
  /** Voix propre à l'unité, pour un accent régional ; sinon celle du cours. */
  voice?: string
  /** Découpage en leçons, pour un cours suivi comme un parcours. */
  lessons?: Lesson[]
  /** Repères de prononciation ou de grammaire, lisibles avant l'unité. */
  tips?: string[]
}

export interface Course {
  id: string
  lang: LangCode
  /** Pictogramme du cours, devant son nom dans les onglets. */
  icon?: string
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
  /**
   * Cours suivi comme un parcours : des leçons courtes qui s'enchaînent, aux
   * exercices variés, plutôt qu'une file de révision.
   */
  path?: boolean
  /**
   * Cours rédigé avant les parcours et mis à leur format après coup : ses
   * phrases emploient librement tout le vocabulaire.
   */
  adapted?: boolean
  /** Intitulés des questions, quand « que veut dire ce mot » ne convient pas. */
  labels?: { meaning?: string; term?: string; write?: string }
  /**
   * Parcours pour qui parle déjà la langue : les phrases emploient librement
   * tout le vocabulaire, et l'on produit plus qu'on ne reconnaît.
   */
  advanced?: boolean
  /**
   * Langue écrite dans un autre alphabet : la prononciation en lettres
   * latines accompagne alors chaque mot, et rien n'est demandé au clavier.
   */
  romanized?: boolean
  /**
   * Vocabulaire du lexique seulement : des mots à consulter sur place, que
   * les leçons n'enseignent pas.
   */
  extras?: Unit[]
  /** Noms propres des phrases, à ne pas mettre en minuscules sur les tuiles. */
  properNouns?: string[]
  units: Unit[]
}
