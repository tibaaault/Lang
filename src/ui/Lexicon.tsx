import { useMemo, useState } from 'react'
import type { Course, Lexeme } from '../types'
import { MASTERED_STABILITY_DAYS } from '../engine/fsrs'
import { normalize } from '../engine/grade'
import { cardKey, useProgress } from '../store/progress'
import { canSpeak, speak } from '../audio'
import { Card, Screen, SpeakButton } from './components'

type State = 'new' | 'learning' | 'mastered'

const STATE_LABEL: Record<State, string> = {
  new: 'à découvrir',
  learning: 'en cours',
  mastered: 'acquis',
}

/**
 * Lexique consultable : tout le contenu d'un cours, lisible sans exercice.
 *
 * Réviser n'est pas toujours se tester. Avant un départ, relire d'affilée les
 * phrases d'un kit de voyage vaut mieux que d'attendre que le planificateur
 * les propose une par une.
 */
export function Lexicon({
  course,
  onBack,
}: {
  course: Course
  onBack: () => void
}) {
  const progress = useProgress()
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [unitFilter, setUnitFilter] = useState<string | null>(null)

  const audible = !course.silent && canSpeak(course.voice)

  const stateOf = (lex: Lexeme): State => {
    const card = progress.cards[cardKey(course.id, lex.id)]
    if (!card) return 'new'
    return card.stability >= MASTERED_STABILITY_DAYS ? 'mastered' : 'learning'
  }

  const units = useMemo(() => {
    const needle = normalize(query)
    return course.units
      .filter((u) => !unitFilter || u.title === unitFilter)
      .map((unit) => ({
        title: unit.title,
        lexemes: unit.lexemes.filter((lex) => {
          if (!needle) return true
          // La recherche porte aussi sur le sens : on cherche parfois le mot
          // français dont on a oublié la traduction.
          return (
            normalize(lex.term).includes(needle) ||
            normalize(lex.gloss).includes(needle) ||
            (lex.roman ? normalize(lex.roman).includes(needle) : false)
          )
        }),
      }))
      .filter((u) => u.lexemes.length > 0)
  }, [course.units, query, unitFilter])

  const total = units.reduce((n, u) => n + u.lexemes.length, 0)

  return (
    <Screen title={course.title} onBack={onBack}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un mot ou son sens"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 outline-none focus:border-accent"
      />

      {course.units.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {[null, ...course.units.map((u) => u.title)].map((title) => (
            <button
              key={title ?? 'tout'}
              onClick={() => setUnitFilter(title)}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                unitFilter === title
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line text-muted'
              }`}
            >
              {title ?? 'Tout'}
            </button>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        {total} {total > 1 ? 'entrées' : 'entrée'}
        {query && ' trouvées'}
      </p>

      <div className="mt-3 space-y-5 pb-4">
        {units.map((unit) => (
          <section key={unit.title}>
            <h2 className="mb-2 text-xs uppercase tracking-wide text-muted">
              {unit.title}
            </h2>
            <Card className="divide-y divide-line p-0">
              {unit.lexemes.map((lex) => {
                const open = openId === lex.id
                const state = stateOf(lex)
                return (
                  <div key={lex.id}>
                    <button
                      onClick={() => setOpenId(open ? null : lex.id)}
                      className="flex w-full items-start justify-between gap-3 px-5 py-3.5 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block font-serif text-lg leading-tight">
                          {lex.term}
                        </span>
                        {lex.roman && (
                          <span className="block text-xs text-muted">
                            {lex.roman}
                          </span>
                        )}
                        <span className="mt-0.5 block text-sm text-muted">
                          {lex.gloss}
                        </span>
                      </span>
                      <span
                        aria-label={STATE_LABEL[state]}
                        title={STATE_LABEL[state]}
                        className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                          state === 'mastered'
                            ? 'bg-accent'
                            : state === 'learning'
                              ? 'bg-accent/40'
                              : 'bg-line'
                        }`}
                      />
                    </button>

                    {open && (
                      <div className="space-y-3 px-5 pb-4">
                        {lex.note && (
                          <p className="text-sm leading-relaxed text-muted">
                            {lex.note}
                          </p>
                        )}
                        {lex.examples?.map((ex) => (
                          <div
                            key={ex.text}
                            className="border-l-2 border-line pl-3"
                          >
                            <p className="font-serif">{ex.text}</p>
                            {ex.roman && (
                              <p className="text-xs text-muted">{ex.roman}</p>
                            )}
                            <p className="mt-0.5 text-sm text-muted">{ex.fr}</p>
                          </div>
                        ))}
                        <div className="flex items-center gap-3">
                          {audible && (
                            <SpeakButton
                              onClick={() => speak(lex.term, course.voice)}
                            />
                          )}
                          <span className="text-xs text-muted">
                            {STATE_LABEL[state]}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </Card>
          </section>
        ))}

        {total === 0 && (
          <Card>
            <p className="text-sm text-muted">
              Aucune entrée ne correspond à « {query} ».
            </p>
          </Card>
        )}
      </div>
    </Screen>
  )
}
