import { useMemo } from 'react'
import type { Course } from '../types'
import { indexCourse, pendingCount, type SessionMode } from '../engine/scheduler'
import { courseStats, today, useProgress } from '../store/progress'
import { Button, Card, Stat } from './components'

export function Home({
  courses,
  onStart,
  onOpen,
}: {
  courses: Course[]
  onStart: (courseId: string, mode: SessionMode) => void
  onOpen: (view: 'stats' | 'account' | 'settings') => void
}) {
  const progress = useProgress()
  const day = progress.days[today()]
  const doneToday = day?.reviews ?? 0
  const goal = progress.settings.dailyGoal

  const indexes = useMemo(
    () => new Map(courses.map((c) => [c.id, indexCourse(c)])),
    [courses],
  )

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-10">
      <header className="flex items-center justify-between py-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <h1 className="font-serif text-2xl">
            {progress.streak.current > 0
              ? `${progress.streak.current} jour${progress.streak.current > 1 ? 's' : ''} d'affilée`
              : 'Bonjour'}
          </h1>
        </div>
        <button
          onClick={() => onOpen('settings')}
          aria-label="Réglages"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-muted"
        >
          ⚙
        </button>
      </header>

      <Card className="mb-6">
        <div className="grid grid-cols-3 gap-3">
          <Stat value={doneToday} label="réponses aujourd'hui" />
          <Stat
            value={`${Math.round(((day?.seconds ?? 0) / 60) * 10) / 10} min`}
            label="de travail"
          />
          {/* Un décompte « restants » mentirait dès que la planification n'a
              plus rien à proposer : on montre l'objectif, jamais faux. */}
          <Stat value={`${doneToday}/${goal}`} label="objectif du jour" />
        </div>
      </Card>

      <div className="space-y-3">
        {courses.map((course) => {
          const index = indexes.get(course.id)!
          const { due, fresh, remaining } = pendingCount(course, index, progress)
          const stats = courseStats(
            course.id,
            index.lexemes.map((l) => l.id),
          )
          const waiting = due + fresh
          const canTrain = remaining > 0 || stats.known > 0

          return (
            <Card key={course.id}>
              <div className="min-w-0">
                <h2 className="font-serif text-xl">{course.title}</h2>
                <p className="mt-1 text-sm text-muted">
                  {stats.known} mot{stats.known > 1 ? 's' : ''} en cours ·{' '}
                  {stats.mastered} acquis sur {stats.total}
                </p>
              </div>

              <Button
                className="mt-4 w-full"
                onClick={() => onStart(course.id, 'daily')}
                disabled={waiting === 0}
              >
                {waiting === 0
                  ? 'À jour'
                  : `Réviser · ${Math.min(waiting, progress.settings.dailyGoal)}`}
              </Button>

              {waiting > 0 && (
                <p className="mt-3 text-xs text-muted">
                  {due > 0 && `${due} à revoir`}
                  {due > 0 && fresh > 0 && ' · '}
                  {fresh > 0 && `${fresh} nouveau${fresh > 1 ? 'x' : ''}`}
                </p>
              )}

              {canTrain && (
                <button
                  onClick={() => onStart(course.id, 'free')}
                  className="mt-3 w-full py-2 text-sm text-muted underline underline-offset-4"
                >
                  Entraînement libre
                  {remaining > 0 && ` · ${remaining} mots en réserve`}
                </button>
              )}
            </Card>
          )
        })}
      </div>

      <p className="mt-5 px-1 text-xs leading-relaxed text-muted">
        L'entraînement libre ignore le rythme conseillé : il enchaîne les mots
        en réserve, puis les moins bien retenus. Réussir un mot n'y repousse pas
        sa révision — travailler plus ne fausse pas la mémorisation estimée.
      </p>

      <div className="mt-8 flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={() => onOpen('stats')}>
          Progression
        </Button>
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => onOpen('account')}
        >
          Comptes
        </Button>
      </div>
    </div>
  )
}
