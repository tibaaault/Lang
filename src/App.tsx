import { useEffect, useMemo, useState } from 'react'
import { courses, courseById } from './content'
import { indexCourse, type SessionMode } from './engine/scheduler'
import { initAuth, useAuth } from './store/sync'
import { isRemoteEnabled } from './store/supabase'
import { Home } from './ui/Home'
import { Session } from './ui/Session'
import { LessonSession } from './ui/LessonSession'
import { indexPath } from './engine/lesson'
import { Lexicon } from './ui/Lexicon'
import { Phrasebook } from './ui/Phrasebook'
import { Stats } from './ui/Stats'
import { Account } from './ui/Account'
import { Settings } from './ui/Settings'
import { BottomNav, type Tab } from './ui/components'

type View =
  | { name: 'home' }
  | { name: 'session'; courseId: string; mode: SessionMode }
  | { name: 'lesson'; courseId: string; lessonId: string | null }
  | { name: 'lexicon'; courseId: string }
  | { name: 'phrases'; courseId: string }
  | { name: 'stats' }
  | { name: 'account' }
  | { name: 'settings' }

export default function App() {
  const auth = useAuth()
  const [view, setView] = useState<View>({ name: 'home' })
  // Choix de travailler sans compte, valable pour ce lancement seulement :
  // au prochain démarrage, la question est reposée.
  const [offlineAccepted, setOfflineAccepted] = useState(false)
  // Change à chaque lancement : deux sessions libres d'affilée doivent
  // reconstruire leur file, pas reprendre l'ancienne.
  const [sessionStamp, setSessionStamp] = useState(0)

  useEffect(() => {
    void initAuth()
  }, [])

  const home = () => setView({ name: 'home' })


  const sessionCourse =
    view.name === 'session' ? courseById(view.courseId) : undefined
  const sessionIndex = useMemo(
    () => (sessionCourse ? indexCourse(sessionCourse) : null),
    [sessionCourse],
  )

  const lessonCourse =
    view.name === 'lesson' ? courseById(view.courseId) : undefined
  const pathIndex = useMemo(
    () => (lessonCourse ? indexPath(lessonCourse) : null),
    [lessonCourse],
  )

  // Ces sorties viennent après tous les hooks : React exige qu'ils soient
  // appelés dans le même ordre à chaque rendu.
  //
  // Tant que la session n'est pas vérifiée, on n'affiche rien, sans quoi
  // l'écran de connexion apparaîtrait brièvement à chaque lancement, y
  // compris pour un compte déjà connecté.
  if (isRemoteEnabled && auth.sync === 'checking') {
    return <div className="min-h-dvh" />
  }

  // Réviser sans compte ne compte nulle part, et rien ne le signalait :
  // la connexion est donc demandée avant d'entrer dans l'application.
  if (isRemoteEnabled && !auth.user && !offlineAccepted) {
    return <Account gate onContinueOffline={() => setOfflineAccepted(true)} />
  }

  if (view.name === 'session' && sessionCourse && sessionIndex) {
    return (
      <Session
        // Remonter le composant à chaque session repart d'une file propre.
        key={`${sessionCourse.id}-${view.mode}-${sessionStamp}`}
        course={sessionCourse}
        index={sessionIndex}
        mode={view.mode}
        onExit={home}
      />
    )
  }
  if (view.name === 'lesson' && lessonCourse && pathIndex) {
    return (
      <LessonSession
        key={`${lessonCourse.id}-${view.lessonId}-${sessionStamp}`}
        course={lessonCourse}
        index={pathIndex}
        lessonId={view.lessonId}
        onExit={home}
      />
    )
  }
  if (view.name === 'lexicon') {
    const course = courseById(view.courseId)
    if (course) return <Lexicon course={course} onBack={home} />
  }
  if (view.name === 'phrases') {
    const course = courseById(view.courseId)
    if (course) return <Phrasebook course={course} onBack={home} />
  }
  // Les quatre écrans principaux partagent la barre du bas.
  const tab: Tab =
    view.name === 'stats' || view.name === 'account' || view.name === 'settings'
      ? view.name
      : 'home'
  const screen =
    view.name === 'stats' ? (
      <Stats courses={courses} onBack={home} />
    ) : view.name === 'account' ? (
      <Account onBack={home} />
    ) : view.name === 'settings' ? (
      <Settings onBack={home} />
    ) : null

  return (
    <>
      {screen ?? (
    <Home
      courses={courses}
      onStart={(courseId, mode) => {
        setSessionStamp((n) => n + 1)
        setView({ name: 'session', courseId, mode })
      }}
      onLesson={(courseId, lessonId) => {
        setSessionStamp((n) => n + 1)
        setView({ name: 'lesson', courseId, lessonId })
      }}
      onPhrases={(courseId) => setView({ name: 'phrases', courseId })}
      onLexicon={(courseId) => setView({ name: 'lexicon', courseId })}
      onOpen={(name) => setView({ name } as View)}
    />
      )}
      {/* Réserve la hauteur de la barre : le bas de l'écran reste lisible. */}
      <div aria-hidden className="h-20" />
      <BottomNav current={tab} onGo={(name) => setView({ name } as View)} />
    </>
  )
}
