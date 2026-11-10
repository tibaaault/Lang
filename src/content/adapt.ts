// Met un cours écrit pour la file de révision au format du parcours guidé.
//
// Ces cours ont été rédigés exercice par exercice, unité par unité, sans
// découpage en leçons. On ne réécrit rien : chaque unité est coupée en leçons
// de cinq mots, et ce qui existait est réemployé — les exemples deviennent
// des phrases à assembler, les choix multiples des questions avec leur
// explication, les phrases à trou restent des phrases à trou, où l'on écrit.
//
// Les identifiants des cours et des mots ne changent pas : la progression
// déjà acquise est conservée.

import type { ClozeExercise, Course, Lesson, Lexeme, Quiz, Unit } from '../types'

const LESSON_SIZE = 5

/** Coupe en parts égales, sans laisser une dernière leçon de deux mots. */
function chunk<T>(items: T[], size: number): T[][] {
  const parts = Math.max(1, Math.round(items.length / size))
  const each = Math.ceil(items.length / parts)
  const out: T[][] = []
  for (let i = 0; i < items.length; i += each) out.push(items.slice(i, i + each))
  return out
}

/** Écart de rang entre deux mots de l'unité : des leurres pris tout près. */
function distance(all: Lexeme[], a: Lexeme, b: Lexeme): number {
  return Math.abs(all.indexOf(a) - all.indexOf(b))
}

function adaptUnit(unit: Unit, by: 'term' | 'gloss'): Unit {
  const lessons: Lesson[] = chunk(unit.lexemes, LESSON_SIZE).map(
    (words: Lexeme[], i) => {
      const ids = new Set(words.map((w) => w.id))
      const own = unit.exercises.filter((e) => ids.has(e.lexemeId))

      const seen = new Set<string>()
      const phrases = words
        .flatMap((w) => w.examples ?? [])
        .filter((e) => !seen.has(e.text) && seen.add(e.text))
        .map((e) => ({ text: e.text, fr: e.fr }))

      const quizzes: Quiz[] = own.flatMap((e) =>
        e.kind === 'choice'
          ? [
              {
                prompt: e.prompt,
                options: [e.answer, ...e.options.filter((o) => o !== e.answer)],
                why: e.why ?? '',
              },
            ]
          : [],
      )

      // Un mot illustré d'un drapeau donne une question de plus : reconnaître
      // le pays à son drapeau, parmi ses voisins de l'unité.
      if (by === 'gloss') {
        for (const w of words) {
          if (!w.emoji) continue
          const others = unit.lexemes
            .filter((o) => o.id !== w.id)
            .sort((a, b) => distance(unit.lexemes, a, w) - distance(unit.lexemes, b, w))
            .slice(0, 3)
            .map((o) => o.gloss)
          quizzes.push({
            picture: w.emoji,
            prompt: 'À quel pays appartient ce drapeau ?',
            options: [w.gloss, ...others],
            why: `C'est le drapeau de : ${w.gloss}. Capitale : ${w.term}.`,
          })
        }
      }

      const clozes = own.filter((e): e is ClozeExercise => e.kind === 'cloze')

      // Les variantes admises d'une réponse écrite : « Kiev » pour « Kyiv ».
      const accepted: Record<string, string[]> = {}
      for (const e of own) {
        if (e.kind === 'recall') accepted[e.lexemeId] = e.accepted
      }

      return {
        id: `${unit.id}-${i + 1}`,
        title: `${unit.title} · ${i + 1}`,
        // Sous le titre, ce que la leçon contient.
        summary: words
          .slice(0, 3)
          .map((w) => w[by])
          .join(', ')
          .concat(words.length > 3 ? '…' : ''),
        lexemeIds: words.map((w) => w.id),
        phrases,
        quizzes,
        clozes,
        accepted,
      }
    },
  )
  return { ...unit, lessons }
}

export function asPath(
  course: Course,
  extra: Partial<Course> = {},
): Course {
  return {
    ...course,
    path: true,
    adapted: true,
    // Un cours de connaissances se résume par ses questions, pas ses réponses.
    units: course.units.map((u) => adaptUnit(u, course.silent ? 'gloss' : 'term')),
    ...extra,
  }
}
