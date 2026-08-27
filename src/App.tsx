import { useEffect, useMemo, useState } from 'react'
import { courses, courseById } from './content'
import { indexCourse } from './engine/scheduler'
import { initAuth } from './store/sync'
import { Home } from './ui/Home'
import { Session } from './ui/Session'
import { Stats } from './ui/Stats'
import { Account } from './ui/Account'
import { Settings } from './ui/Settings'

type View =
  | { name: 'home' }
  | { name: 'session'; courseId: string }
  | { name: 'stats' }
  | { name: 'account' }
  | { name: 'settings' }

export default function App() {
  const [view, setView] = useState<View>({ name: 'home' })

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

  if (view.name === 'session' && sessionCourse && sessionIndex) {
    return (
      <Session
        // Remonter le composant à chaque session repart d'une file propre.
        key={`${sessionCourse.id}-${view.name}`}
        course={sessionCourse}
        index={sessionIndex}
        onExit={home}
      />
    )
  }
  if (view.name === 'stats') return <Stats courses={courses} onBack={home} />
  if (view.name === 'account') return <Account onBack={home} />
  if (view.name === 'settings') return <Settings onBack={home} />

  return (
    <Home
      courses={courses}
      onStart={(courseId) => setView({ name: 'session', courseId })}
      onOpen={(name) => setView({ name } as View)}
    />
  )
}
