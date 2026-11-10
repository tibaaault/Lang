// Mise en forme d'un parcours guidé à partir d'une écriture compacte : des
// mots et des phrases par leçon. Commun à toutes les langues suivies ainsi.

import type { Lesson, Lexeme, Unit } from '../types'

/** terme, sens, note éventuelle, prononciation approchée éventuelle. */
export type W = [term: string, gloss: string, note?: string, roman?: string]
/** phrase dans la langue apprise, traduction française. */
export type P = [text: string, fr: string]

export interface LessonSource {
  title: string
  words: W[]
  phrases: P[]
}

export interface UnitSource {
  id: string
  title: string
  subtitle: string
  tips: string[]
  lessons: LessonSource[]
}

/**
 * `prefix` distingue les mots d'une langue de ceux d'une autre. L'identifiant
 * d'un mot dérive de son terme : il reste stable si une leçon est déplacée.
 */
export function buildPathUnits(prefix: string, sources: UnitSource[]): Unit[] {
  const wordId = (term: string) => `${prefix}:${term}`

  const units = sources.map((source): Unit => {
    const lexemes: Lexeme[] = []
    const lessons: Lesson[] = []
    source.lessons.forEach((lesson, i) => {
      for (const [term, gloss, note, roman] of lesson.words) {
        lexemes.push({ id: wordId(term), term, gloss, note, roman })
      }
      lessons.push({
        id: `${source.id}-${i + 1}`,
        title: lesson.title,
        lexemeIds: lesson.words.map(([term]) => wordId(term)),
        phrases: lesson.phrases.map(([text, fr]) => ({ text, fr })),
      })
    })
    return {
      id: `${prefix}.${source.id}`,
      title: source.title,
      subtitle: source.subtitle,
      tips: source.tips,
      lexemes,
      exercises: [],
      lessons,
    }
  })

  // Les exemples du lexique sont les phrases du parcours qui emploient le
  // mot : rien à écrire deux fois, et l'on relit ce que l'on a pratiqué.
  const phrases = units.flatMap((u) => u.lessons!.flatMap((l) => l.phrases))
  const flat = (s: string) =>
    ` ${s.toLocaleLowerCase().replace(/[.,!?…]/g, '')} `
  for (const unit of units) {
    for (const lex of unit.lexemes) {
      const needle = ` ${lex.term.toLocaleLowerCase()} `
      lex.examples = phrases
        .filter((p) => flat(p.text).includes(needle))
        .slice(0, 2)
    }
  }
  return units
}
