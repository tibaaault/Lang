import { useMemo, useState } from 'react'
import type { Course } from '../types'
import { indexPath } from '../engine/lesson'
import { normalize } from '../engine/grade'
import { speak } from '../audio'
import { Screen } from './components'

/**
 * Carnet de phrases : toutes les phrases du parcours, rangées par situation,
 * à lire ou à faire lire à voix haute sans passer par un exercice.
 *
 * C'est l'écran que l'on ouvre devant un étal ou dans un taxi : on cherche
 * « combien » ou « épicé », on touche la phrase, le téléphone la dit.
 */
export function Phrasebook({
  course,
  onBack,
}: {
  course: Course
  onBack: () => void
}) {
  const index = useMemo(() => indexPath(course), [course])
  const [query, setQuery] = useState('')

  const units = useMemo(() => {
    const needle = normalize(query)
    return course.units
      .map((unit) => {
        const seen = new Set<string>()
        const phrases = (unit.lessons ?? [])
          .flatMap((l) => l.phrases)
          // Une phrase reprise dans deux leçons n'apparaît qu'une fois.
          .filter((p) => !seen.has(p.text) && seen.add(p.text))
          .filter(
            (p) =>
              !needle ||
              normalize(p.fr).includes(needle) ||
              normalize(p.text).includes(needle),
          )
        return { title: unit.title, phrases }
      })
      .filter((u) => u.phrases.length > 0)
  }, [course, query])

  const say = (text: string) =>
    speak(course.romanized ? text.replace(/\s+/g, '') : text, course.voice)

  return (
    <Screen title="Phrases utiles" onBack={onBack}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Chercher : combien, épicé, toilettes…"
        autoCorrect="off"
        spellCheck={false}
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-accent"
      />
      <p className="mt-2 text-xs text-muted">
        Touchez une phrase pour l'entendre.
      </p>

      {units.length === 0 && (
        <p className="mt-8 text-sm text-muted">Aucune phrase ne correspond.</p>
      )}

      <div className="mt-5 space-y-8">
        {units.map((unit) => (
          <section key={unit.title}>
            <h2 className="mb-2 text-xs uppercase tracking-wide text-muted">
              {unit.title}
            </h2>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {unit.phrases.map((p) => {
                const roman = index.roman(p.text)
                return (
                  <li key={p.text}>
                    <button
                      onClick={() => say(p.text)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-accent-soft"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-muted">{p.fr}</span>
                        <span className="mt-0.5 block font-serif text-lg leading-snug">
                          {p.text}
                        </span>
                        {roman && (
                          <span className="block text-xs text-muted">
                            {roman}
                          </span>
                        )}
                      </span>
                      <span aria-hidden className="shrink-0 text-muted">
                        🔊
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </Screen>
  )
}
