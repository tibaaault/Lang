import { useEffect, useMemo, useState } from 'react'
import { courses, courseById } from './content'
import { indexCourse, type SessionMode } from './engine/scheduler'
import { initAuth, useAuth } from './store/sync'
import { isRemoteEnabled } from './store/supabase'
import { Home } from './ui/Home'
import { Session } from './ui/Session'
import { Lexicon } from './ui/Lexicon'
import { Stats } from './ui/Stats'
import { Account } from './ui/Account'
import { Settings } from './ui/Settings'

type View =
  | { name: 'home' }
  | { name: 'session'; courseId: string; mode: SessionMode }
  | { name: 'lexicon'; courseId: string }
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
  if (view.name === 'lexicon') {
    const course = courseById(view.courseId)
    if (course) return <Lexicon course={course} onBack={home} />
  }
  if (view.name === 'stats') return <Stats courses={courses} onBack={home} />
  if (view.name === 'account') return <Account onBack={home} />
  if (view.name === 'settings') return <Settings onBack={home} />

  return (
    <Home
      courses={courses}
      onStart={(courseId, mode) => {
        setSessionStamp((n) => n + 1)
        setView({ name: 'session', courseId, mode })
      }}
      onLexicon={(courseId) => setView({ name: 'lexicon', courseId })}
      onOpen={(name) => setView({ name } as View)}
    />
  )
}
