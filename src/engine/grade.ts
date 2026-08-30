// Correction des réponses libres.
//
// Sans IA en ligne, la justesse d'une réponse se joue sur trois niveaux :
// une liste de formulations acceptées écrite avec le contenu, une tolérance
// aux fautes de frappe, et une liste d'erreurs plausibles auxquelles on a
// pré-associé une explication. C'est cette dernière qui fait apprendre :
// savoir qu'on s'est trompé ne vaut rien, savoir pourquoi vaut tout.

import type { NearMiss } from '../types'

/** Diacritiques arabes (harakat) : jamais écrits dans l'usage courant. */
const ARABIC_DIACRITICS = /[ً-ْٰـ]/g

export function normalize(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    // Retire les accents latins : « repondre » vaut « répondre ».
    .replace(/[̀-ͯ]/g, '')
    // Le d barré vietnamien est une lettre à part entière, que la
    // décomposition Unicode ne ramène pas à un d : sans cette ligne, taper
    // « di » pour « đi » serait compté faux, alors qu'aucun clavier français
    // ne permet de saisir ce caractère.
    .replace(/đ/g, 'd')
    .replace(ARABIC_DIACRITICS, '')
    .replace(/['’`]/g, "'")
    .replace(/[.,!?;:"“”()]/g, '')
    .replace(/\s+/g, ' ')
}

/** Distance de Levenshtein, en O(n) mémoire. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  const curr = new Array<number>(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    prev = curr.slice()
  }
  return prev[b.length]
}

/**
 * Combien de fautes on pardonne, selon la longueur du mot.
 * Sur un mot court, une lettre de différence change souvent le mot
 * (« live » / « love ») : on n'y tolère rien.
 */
function tolerance(len: number): number {
  if (len <= 4) return 0
  if (len <= 7) return 1
  return 2
}

export interface Verdict {
  correct: boolean
  /** Juste, mais mal orthographié : compté comme une réussite fragile. */
  fuzzy: boolean
  /** La bonne réponse, telle qu'on l'écrit. */
  answer: string
  /** Message pédagogique à afficher. */
  feedback?: string
}

export function checkAnswer(
  input: string,
  accepted: string[],
  nearMisses: NearMiss[] = [],
): Verdict {
  const given = normalize(input)
  const answer = accepted[0]

  if (!given) {
    return { correct: false, fuzzy: false, answer }
  }

  for (const candidate of accepted) {
    if (given === normalize(candidate)) {
      return { correct: true, fuzzy: false, answer: candidate }
    }
  }

  // Faute de frappe sur une réponse par ailleurs juste.
  for (const candidate of accepted) {
    const target = normalize(candidate)
    if (editDistance(given, target) <= tolerance(target.length)) {
      return {
        correct: true,
        fuzzy: true,
        answer: candidate,
        feedback: `Presque : on écrit « ${candidate} ».`,
      }
    }
  }

  // Erreur anticipée : c'est ici qu'on explique la nuance.
  for (const miss of nearMisses) {
    const target = normalize(miss.word)
    if (
      given === target ||
      editDistance(given, target) <= tolerance(target.length)
    ) {
      return { correct: false, fuzzy: false, answer, feedback: miss.why }
    }
  }

  return { correct: false, fuzzy: false, answer }
}
