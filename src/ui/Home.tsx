import { useEffect, useMemo, useRef } from 'react'
import type { Course } from '../types'
import { indexCourse, pendingCount, type SessionMode } from '../engine/scheduler'
import { courseStats, today, updateSettings, useProgress } from '../store/progress'
import { useAuth } from '../store/sync'
import { isRemoteEnabled } from '../store/supabase'
import { Button, Card, Stat } from './components'
import { Path } from './Path'

export function Home({
  courses,
  onStart,
  onLesson,
  onLexicon,
  onPhrases,
  onOpen,
}: {
  courses: Course[]
  onStart: (courseId: string, mode: SessionMode) => void
  /** Ouvre une leçon de parcours, ou une révision si `lessonId` est nul. */
  onLesson: (courseId: string, lessonId: string | null) => void
  onLexicon: (courseId: string) => void
  onPhrases: (courseId: string) => void
  onOpen: (view: 'stats' | 'account' | 'settings') => void
}) {
  const progress = useProgress()
  const auth = useAuth()
  const day = progress.days[today()]
  const doneToday = day?.reviews ?? 0
  const goal = progress.settings.dailyGoal

  const followed = progress.settings.courses
  const visibleCourses = useMemo(
    () => (followed ? courses.filter((c) => followed.includes(c.id)) : courses),
    [courses, followed],
  )

  // Un parcours guidé occupe tout l'accueil ; les autres cours se partagent
  // un second onglet. Le choix est mémorisé avec les réglages : qui ne suit
  // que l'anglais ne doit pas retomber sur le vietnamien à chaque ouverture.
  const paths = visibleCourses.filter((c) => c.path)
  const listed = visibleCourses.filter((c) => !c.path)
  const tab = progress.settings.homeTab
  const activePath =
    tab === 'others' && listed.length > 0
      ? undefined
      : (paths.find((c) => c.id === tab) ?? paths[0])

  const tabs: { id: string; label: string; icon?: string }[] = [
    ...paths.map((c) => ({ id: c.id, label: c.title, icon: c.icon })),
    ...(listed.length > 0 ? [{ id: 'others', label: 'Autres cours' }] : []),
  ]
  const activeTab = activePath?.id ?? 'others'
  // L'onglet ouvert doit être visible sans faire défiler la rangée.
  const activeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ inline: 'center', block: 'nearest' })
  }, [activeTab])

  const indexes = useMemo(
    () => new Map(listed.map((c) => [c.id, indexCourse(c)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleCourses],
  )

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-10">
      <div className="h-4" />

      {/* Un état qui change silencieusement le comportement doit rester
          visible : c'est en travaillant sans le savoir hors connexion qu'on
          perd une série entière. */}
      {isRemoteEnabled && !auth.user && (
        // Une ligne, pas un bandeau : l'état reste visible à chaque ouverture
        // sans repousser le cours hors de l'écran.
        <button
          onClick={() => onOpen('account')}
          className="mb-3 flex w-full items-center gap-2 rounded-full border border-wrong/30 px-3 py-1.5 text-left text-xs text-wrong"
        >
          <span aria-hidden>⚠</span>
          <span className="flex-1">
            Hors connexion — progression sur cet appareil
          </span>
          <span className="underline underline-offset-2">Se connecter</span>
        </button>
      )}

      {tabs.length > 1 && (
        // Une seule ligne, que l'on fait défiler du doigt : sept cours sur
        // trois rangées repoussaient les leçons hors de l'écran.
        <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map(({ id, label, icon }) => {
            const active = id === activeTab
            return (
              <button
                key={id}
                ref={active ? activeRef : undefined}
                onClick={() => updateSettings({ homeTab: id })}
                aria-pressed={active}
                className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm ${
                  active
                    ? 'border-accent bg-accent-soft font-medium text-accent'
                    : 'border-line text-muted'
                }`}
              >
                {icon && <span aria-hidden>{icon} </span>}
                {label}
              </button>
            )
          })}
        </div>
      )}

      {activePath ? (
        <Path
          course={activePath}
          onLesson={(lessonId) => onLesson(activePath.id, lessonId)}
          onLexicon={() => onLexicon(activePath.id)}
          onPhrases={() => onPhrases(activePath.id)}
        />
      ) : (
        <>
      <header className="flex items-center justify-between pb-5">
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
        {listed.map((course) => {
          const index = indexes.get(course.id)!
          const unit = progress.settings.unitFilter?.[course.id] || undefined
          const { due, fresh, remaining } = pendingCount(
            course,
            index,
            progress,
            new Date(),
            unit,
          )
          const stats = courseStats(
            progress,
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

              {/* Les unités d'un cours de connaissances n'ont pas d'ordre
                  pédagogique : on peut se limiter à l'une d'elles. */}
              {course.filterByUnit && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[null, ...course.units.map((u) => u.title)].map((title) => {
                    const active = (unit ?? null) === title
                    return (
                      <button
                        key={title ?? 'tous'}
                        onClick={() =>
                          updateSettings({
                            unitFilter: {
                              ...progress.settings.unitFilter,
                              [course.id]: title ?? '',
                            },
                          })
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          active
                            ? 'border-accent bg-accent-soft text-accent'
                            : 'border-line text-muted'
                        }`}
                      >
                        {title ?? 'Tous'}
                      </button>
                    )
                  })}
                </div>
              )}

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

              <div className="mt-3 flex items-center justify-between gap-3 text-sm text-muted">
                {canTrain ? (
                  <button
                    onClick={() => onStart(course.id, 'free')}
                    className="py-2 underline underline-offset-4"
                  >
                    Entraînement libre
                    {remaining > 0 && ` · ${remaining} en réserve`}
                  </button>
                ) : (
                  <span />
                )}
                {/* Consulter sans être interrogé : relire un kit de voyage
                    avant un départ, ou vérifier un mot au passage. */}
                <button
                  onClick={() => onLexicon(course.id)}
                  className="shrink-0 py-2 underline underline-offset-4"
                >
                  Lexique
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      {visibleCourses.length === 0 && (
        <Card>
          <p className="text-sm text-muted">
            Aucun cours suivi. Choisissez-en un dans les réglages.
          </p>
        </Card>
      )}

      <p className="mt-5 px-1 text-xs leading-relaxed text-muted">
        L'entraînement libre ignore le rythme conseillé : il enchaîne les mots
        en réserve, puis les moins bien retenus. Réussir un mot n'y repousse pas
        sa révision — travailler plus ne fausse pas la mémorisation estimée.
      </p>
        </>
      )}

    </div>
  )
}
