import { useEffect, useMemo, useRef, useState } from 'react'
import type { Course, Unit } from '../types'
import {
  currentLesson,
  indexPath,
  lessonKey,
  reviewStatus,
} from '../engine/lesson'
import { useProgress } from '../store/progress'
import { Button, Card, Stat } from './components'

/** Décalage horizontal des leçons : le chemin serpente au lieu de s'empiler. */
const ZIGZAG = [0, 36, 72, 36]

/**
 * Le parcours : toutes les leçons du cours, dans l'ordre, sur un seul écran.
 *
 * Rien n'y est verrouillé. La leçon suivante est mise en avant, mais on peut
 * sauter à celle que l'on veut ou refaire n'importe laquelle, autant de fois
 * que l'on veut : c'est un outil de voyage, pas un jeu à débloquer.
 */
export function Path({
  course,
  onLesson,
  onLexicon,
}: {
  course: Course
  /** `null` lance une révision des mots déjà vus. */
  onLesson: (lessonId: string | null) => void
  onLexicon: () => void
}) {
  const progress = useProgress()
  const index = useMemo(() => indexPath(course), [course])
  const { learned, due } = reviewStatus(index, progress)
  const next = currentLesson(index, progress)
  const nextRef = useRef<HTMLButtonElement>(null)

  // On retrouve sa place en ouvrant l'application, sans faire défiler tout
  // ce qui est déjà fait.
  useEffect(() => {
    if (next && next.order > 1) {
      nextRef.current?.scrollIntoView?.({ block: 'center' })
    }
    // Une seule fois, à l'ouverture : suivre chaque changement ferait sauter
    // l'écran pendant qu'on le lit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const doneCount = (unit: Unit) =>
    (unit.lessons ?? []).filter(
      (l) => progress.lessons?.[lessonKey(course.id, l.id)],
    ).length

  return (
    <div>
      <Card className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat
            value={`🔥 ${progress.streak.current}`}
            label={`jour${progress.streak.current > 1 ? 's' : ''} d'affilée`}
          />
          <Stat value={`⚡ ${progress.xp ?? 0}`} label="points" />
          <Stat value={`${learned}/${index.words.length}`} label="mots vus" />
        </div>
      </Card>

      <div className="mb-8 flex gap-3">
        <Button
          variant={due > 0 ? 'primary' : 'ghost'}
          className="flex-1"
          disabled={learned === 0}
          onClick={() => onLesson(null)}
        >
          {due > 0 ? `Réviser · ${due} mot${due > 1 ? 's' : ''}` : "S'entraîner"}
        </Button>
        <Button variant="ghost" onClick={onLexicon}>
          Lexique
        </Button>
      </div>

      <div className="space-y-10">
        {course.units.map((unit, u) => (
          <section key={unit.id} aria-label={unit.title}>
            <UnitHeader
              number={u + 1}
              unit={unit}
              done={doneCount(unit)}
            />
            <ol className="mt-5 space-y-4">
              {(unit.lessons ?? []).map((lesson, i) => {
                const times =
                  progress.lessons?.[lessonKey(course.id, lesson.id)] ?? 0
                const isNext = next?.lesson.id === lesson.id
                return (
                  <li
                    key={lesson.id}
                    style={{ marginLeft: ZIGZAG[i % ZIGZAG.length] }}
                  >
                    <button
                      ref={isNext ? nextRef : undefined}
                      onClick={() => onLesson(lesson.id)}
                      aria-label={`${lesson.title} — ${
                        times ? 'refaire' : 'commencer'
                      }`}
                      className="flex items-center gap-4 text-left active:opacity-70"
                    >
                      <span
                        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-b-4 text-xl font-semibold ${
                          times
                            ? 'border-accent/40 bg-accent text-paper'
                            : isNext
                              ? 'border-accent bg-accent-soft text-accent ring-4 ring-accent/25'
                              : 'border-line bg-surface text-muted'
                        }`}
                      >
                        {times ? '✓' : i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-medium">
                          {lesson.title}
                        </span>
                        <span className="block text-xs text-muted">
                          {isNext ? (
                            <span className="font-semibold text-accent">
                              Commencer
                            </span>
                          ) : times ? (
                            `Terminée${times > 1 ? ` · ${times} fois` : ''}`
                          ) : (
                            `${lesson.lexemeIds.length} mots`
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </div>

      {!next && (
        <p className="mt-10 text-center text-sm text-muted">
          Tout le parcours est fait. La révision garde les mots en mémoire.
        </p>
      )}
    </div>
  )
}

function UnitHeader({
  number,
  unit,
  done,
}: {
  number: number
  unit: Unit
  done: number
}) {
  const [open, setOpen] = useState(false)
  const total = unit.lessons?.length ?? 0

  return (
    <div className="rounded-2xl bg-accent px-5 py-4 text-paper">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide opacity-80">
            Unité {number} · {done}/{total}
          </p>
          <h2 className="mt-0.5 font-serif text-xl">{unit.title}</h2>
          {unit.subtitle && (
            <p className="mt-0.5 text-sm opacity-90">{unit.subtitle}</p>
          )}
        </div>
        {unit.tips && unit.tips.length > 0 && (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="shrink-0 rounded-xl border border-paper/40 px-3 py-2 text-sm active:opacity-70"
          >
            {open ? 'Fermer' : 'Conseils'}
          </button>
        )}
      </div>
      {open && (
        <ul className="mt-4 space-y-3 border-t border-paper/30 pt-4 text-sm leading-relaxed">
          {unit.tips!.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
