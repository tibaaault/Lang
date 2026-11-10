// Découpage d'une phrase en tuiles à assembler.
//
// Le vietnamien sépare les syllabes par des espaces, pas les mots : « khách
// sạn » (hôtel) tient en deux syllabes qui n'ont pas de sens isolément. Une
// tuile par syllabe ferait assembler du bruit ; on regroupe donc les syllabes
// en mots connus du cours, au plus long d'abord.

const PUNCTUATION = /[.,!?;:«»"“”…()]/g

/** Les mots d'une phrase, ponctuation retirée. */
export function splitWords(text: string): string[] {
  return text
    .replace(PUNCTUATION, ' ')
    .split(/\s+/)
    .filter((w) => w && !/^[—–-]+$/.test(w))
}

const lower = (s: string) => s.toLocaleLowerCase()

export interface Tokenizer {
  /** Tuiles d'une phrase dans la langue apprise. */
  target(text: string): string[]
  /** Tuiles d'une phrase française. */
  fr(text: string): string[]
}

/** Longueur maximale d'un mot ou d'une expression figée, en syllabes. */
const MAX_SYLLABLES = 8

export function makeTokenizer(terms: string[], properNouns: string[]): Tokenizer {
  // Graphie de référence de chaque mot : c'est elle qui s'affiche sur la
  // tuile, ce qui efface la majuscule de début de phrase sans toucher à celle
  // d'un nom propre.
  const canonical = new Map<string, string>()
  for (const t of [...terms, ...properNouns]) canonical.set(lower(t), t)
  const proper = new Set(properNouns.map(lower))

  return {
    target(text) {
      const syllables = splitWords(text)
      const out: string[] = []
      let i = 0
      while (i < syllables.length) {
        let taken = 1
        // Mot inconnu du cours : on ne lui retire que la majuscule de début
        // de phrase, et jamais celle du « I » anglais.
        let token =
          i === 0 && !/^I($|')/.test(syllables[i])
            ? lower(syllables[i])
            : syllables[i]
        for (let n = Math.min(MAX_SYLLABLES, syllables.length - i); n >= 1; n--) {
          const candidate = lower(syllables.slice(i, i + n).join(' '))
          const known = canonical.get(candidate)
          if (known) {
            taken = n
            token = known
            break
          }
        }
        out.push(token)
        i += taken
      }
      return out
    },
    fr(text) {
      return splitWords(text).map((word, i) =>
        i === 0 && !proper.has(lower(word)) ? lower(word) : word,
      )
    },
  }
}

/** Deux suites de tuiles disent-elles la même phrase ? */
export function sameTokens(a: string[], b: string[]): boolean {
  return lower(a.join(' ')) === lower(b.join(' '))
}
