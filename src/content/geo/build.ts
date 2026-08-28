// Construction des exercices de capitales à partir des seules données brutes.
//
// Stocker les quatre exercices de chaque pays dans le JSON revenait à répéter
// des centaines de fois les mêmes intitulés et les mêmes listes d'options,
// pour un fichier plusieurs fois plus lourd. Les exercices sont donc dérivés
// au chargement : le calcul est immédiat, et le poids téléchargé bien moindre.

import type { Exercise, Lexeme, Unit } from '../../types'

/** [pays, capitale, note éventuelle, autres réponses acceptées] */
export type CountryEntry = [string, string, (string | null)?, string[]?]

export interface CapitalsData {
  id: string
  title: string
  subtitle: string
  countries: CountryEntry[]
}

function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Trois leurres pris à distance fixe dans la liste, donc voisins de région le
 * plus souvent — un leurre invraisemblable ne fait pas réfléchir. Le procédé
 * est déterministe : les mêmes options réapparaissent à chaque révision.
 */
function decoys(values: string[], index: number, correct: string): string[] {
  const out: string[] = []
  for (const offset of [7, 13, 23]) {
    let j = (index + offset) % values.length
    while (values[j] === correct || out.includes(values[j])) {
      j = (j + 1) % values.length
    }
    out.push(values[j])
  }
  return out
}

export function buildCapitalsUnit(data: CapitalsData): Unit {
  const capitals = data.countries.map((c) => c[1])
  const names = data.countries.map((c) => c[0])
  const lexemes: Lexeme[] = []
  const exercises: Exercise[] = []

  data.countries.forEach(([country, capital, note, variants], i) => {
    const id = `geo.${data.id}.${slug(country)}`
    lexemes.push({ id, term: capital, gloss: country, ...(note ? { note } : {}) })

    const why = note ?? `La capitale de ${country} est ${capital}.`
    const hint = `${capital[0]}${'_'.repeat(Math.max(capital.length - 2, 1))}${capital[capital.length - 1]}`

    exercises.push(
      {
        kind: 'choice',
        id: `${id}.q0`,
        lexemeId: id,
        prompt: `Quelle est la capitale de : ${country} ?`,
        options: [capital, ...decoys(capitals, i, capital)].sort(),
        answer: capital,
        why,
      },
      {
        kind: 'flip',
        id: `${id}.f0`,
        lexemeId: id,
        front: country,
        back: capital,
        ...(note ? { note } : {}),
      },
      {
        kind: 'recall',
        id: `${id}.r0`,
        lexemeId: id,
        prompt: 'Quelle est sa capitale ?',
        fr: country,
        accepted: [capital, ...(variants ?? [])],
        hint,
      },
      {
        kind: 'choice',
        id: `${id}.q1`,
        lexemeId: id,
        prompt: `${capital} est la capitale de quel pays ?`,
        options: [country, ...decoys(names, i, country)].sort(),
        answer: country,
        why,
      },
    )
  })

  return { id: data.id, title: data.title, subtitle: data.subtitle, lexemes, exercises }
}
