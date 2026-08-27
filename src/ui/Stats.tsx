import { useMemo } from 'react'
import type { Course } from '../types'
import { indexCourse } from '../engine/scheduler'
import { MASTERED_STABILITY_DAYS } from '../engine/fsrs'
import { cardKey, today, useProgress } from '../store/progress'
import { Card, Screen, Stat } from './components'

const WEEKS = 12

export function Stats({
  courses,
  onBack,
}: {
  courses: Course[]
  onBack: () => void
}) {
  const progress = useProgress()

  const totals = useMemo(() => {
    const cards = Object.values(progress.cards)
    const mastered = cards.filter(
      (c) => c.stability >= MASTERED_STABILITY_DAYS,
    ).length
    const seconds = Object.values(progress.days).reduce(
      (s, d) => s + d.seconds,
      0,
    )
    const reviews = Object.values(progress.days).reduce(
      (s, d) => s + d.reviews,
      0,
    )
    const correct = Object.values(progress.days).reduce(
      (s, d) => s + d.correct,
      0,
    )
    return { cards: cards.length, mastered, seconds, reviews, correct }
  }, [progress])

  // Grille type calendrier : chaque colonne est une semaine, chaque case un
  // jour. On voit d'un coup d'œil la régularité, qui compte plus que le volume.
  const grid = useMemo(() => {
    const days: { key: string; reviews: number }[] = []
    const end = new Date()
    for (let i = WEEKS * 7 - 1; i >= 0; i--) {
      const d = new Date(end.getTime() - i * 86_400_000)
      const key = today(d)
      days.push({ key, reviews: progress.days[key]?.reviews ?? 0 })
    }
    return days
  }, [progress])

  const upcoming = useMemo(() => {
    const buckets = new Array(14).fill(0)
    const now = Date.now()
    for (const card of Object.values(progress.cards)) {
      const inDays = Math.floor((Date.parse(card.due) - now) / 86_400_000)
      if (inDays < 0) buckets[0]++
      else if (inDays < 14) buckets[inDays]++
    }
    return buckets
  }, [progress])

  const maxUpcoming = Math.max(...upcoming, 1)
  const perCourse = courses.map((course) => {
    const index = indexCourse(course)
    const known = index.lexemes.filter(
      (l) => progress.cards[cardKey(course.id, l.id)],
    ).length
    return { course, known, total: index.lexemes.length }
  })

  return (
    <Screen title="Progression" onBack={onBack}>
      <div className="space-y-5">
        <Card>
          <div className="grid grid-cols-3 gap-3">
            <Stat value={totals.mastered} label="mots acquis" />
            <Stat value={totals.cards} label="mots vus" />
            <Stat
              value={`${Math.round(totals.seconds / 60)} min`}
              label="au total"
            />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-5">
            <Stat value={progress.streak.current} label="série en cours" />
            <Stat value={progress.streak.longest} label="record de série" />
            <Stat
              value={
                totals.reviews
                  ? `${Math.round((totals.correct / totals.reviews) * 100)} %`
                  : '—'
              }
              label="de justesse"
            />
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-medium">Régularité</h2>
          <div className="grid grid-flow-col grid-rows-7 gap-1">
            {grid.map((d) => (
              <div
                key={d.key}
                title={`${d.key} · ${d.reviews} réponses`}
                className="aspect-square rounded-[3px]"
                style={{
                  background:
                    d.reviews === 0
                      ? 'var(--color-line)'
                      : `color-mix(in srgb, var(--color-accent) ${Math.min(
                          25 + d.reviews * 4,
                          100,
                        )}%, var(--color-line))`,
                }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Les {WEEKS} dernières semaines. Une case par jour.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-medium">Révisions à venir</h2>
          <div className="flex h-24 items-end gap-1">
            {upcoming.map((n, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-accent"
                  style={{
                    height: `${(n / maxUpcoming) * 100}%`,
                    minHeight: n > 0 ? 3 : 0,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>aujourd'hui</span>
            <span>dans 14 jours</span>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-medium">Par langue</h2>
          <ul className="space-y-3">
            {perCourse.map(({ course, known, total }) => (
              <li key={course.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{course.title}</span>
                  <span className="tabular-nums text-muted">
                    {known}/{total}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${total ? (known / total) * 100 : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Screen>
  )
}
