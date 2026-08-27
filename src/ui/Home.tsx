import { useMemo } from 'react'
import type { Course } from '../types'
import { indexCourse, pendingCount } from '../engine/scheduler'
import { courseStats, today, useProgress } from '../store/progress'
import { Button, Card, Stat } from './components'

export function Home({
  courses,
  onStart,
  onOpen,
}: {
  courses: Course[]
  onStart: (courseId: string) => void
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
          <Stat
            value={
              doneToday >= goal ? 'atteint' : `${Math.max(goal - doneToday, 0)}`
            }
            label={doneToday >= goal ? 'objectif du jour' : 'restants'}
          />
        </div>
      </Card>

      <div className="space-y-3">
        {courses.map((course) => {
          const index = indexes.get(course.id)!
          const { due, fresh } = pendingCount(course, index, progress)
          const stats = courseStats(
            course.id,
            index.lexemes.map((l) => l.id),
          )
          const waiting = due + fresh

          return (
            <Card key={course.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-serif text-xl">{course.title}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {stats.known} mot{stats.known > 1 ? 's' : ''} en cours ·{' '}
                    {stats.mastered} acquis sur {stats.total}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Button
                  className="flex-1"
                  onClick={() => onStart(course.id)}
                  disabled={waiting === 0}
                >
                  {waiting === 0
                    ? 'Rien à réviser'
                    : `Réviser · ${Math.min(waiting, progress.settings.dailyGoal)}`}
                </Button>
              </div>

              {waiting > 0 && (
                <p className="mt-3 text-xs text-muted">
                  {due > 0 && `${due} à revoir`}
                  {due > 0 && fresh > 0 && ' · '}
                  {fresh > 0 && `${fresh} nouveau${fresh > 1 ? 'x' : ''}`}
                </p>
              )}
            </Card>
          )
        })}
      </div>

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
