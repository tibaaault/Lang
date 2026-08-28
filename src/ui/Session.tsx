import { useCallback, useEffect, useRef, useState } from 'react'
import type { Course, Exercise, FlipExercise, Lexeme } from '../types'
import type { CourseIndex, SessionItem, SessionMode } from '../engine/scheduler'
import { buildSession } from '../engine/scheduler'
import { checkAnswer, type Verdict } from '../engine/grade'
import type { Grade } from '../engine/fsrs'
import { createCard, gradeFromAnswer, reviewCard } from '../engine/fsrs'
import { getCard, getProgress, recordReview } from '../store/progress'
import { speak, stopSpeaking } from '../audio'
import { Button, Card, ProgressBar, SpeakButton, Stat } from './components'

interface Props {
  course: Course
  index: CourseIndex
  mode: SessionMode
  onExit: () => void
}

interface Tally {
  answered: number
  correct: number
}

export function Session({ course, index, mode, onExit }: Props) {
  // La file est construite une seule fois : les mots répondus pendant la
  // session ne doivent pas la faire changer sous les pieds de l'utilisateur.
  const [queue, setQueue] = useState<SessionItem[]>(() => {
    const progress = getProgress()
    return buildSession(
      course,
      index,
      progress,
      new Date(),
      mode,
      progress.settings.unitFilter?.[course.id] || undefined,
    )
  })
  const [pos, setPos] = useState(0)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [input, setInput] = useState('')
  const [usedHint, setUsedHint] = useState(false)
  const [tally, setTally] = useState<Tally>({ answered: 0, correct: 0 })
  const [total] = useState(queue.length)

  const startedAt = useRef(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)
  const item = queue[pos]

  useEffect(() => {
    startedAt.current = Date.now()
    setInput('')
    setVerdict(null)
    setUsedHint(false)
    // La lecture automatique n'a de sens que si l'exercice est un exercice
    // d'écoute : ailleurs elle donnerait la réponse.
    if (item?.exercise.kind === 'listen') {
      speak(item.exercise.text, course.voice)
    }
    inputRef.current?.focus()
    return stopSpeaking
  }, [pos, item, course.voice])

  /**
   * Enregistre le résultat d'une réponse, quelle que soit la forme prise par
   * l'exercice. La planification et les statistiques suivent les mêmes règles
   * pour une phrase à trou et pour une carte retournée.
   */
  const commit = useCallback(
    (correct: boolean, grade: Grade) => {
      if (!item) return
      const existing = getCard(course.id, item.lexeme.id)
      // Un mot rejoué en fin de session sert de renforcement : il ne doit pas
      // écraser la planification déjà calculée à la première tentative.
      const alreadyAnsweredThisSession = item.replay === true
      if (!alreadyAnsweredThisSession) {
        // En entraînement libre, une réussite sur un mot pas encore échu ne
        // repousse pas sa révision : s'entraîner davantage ne doit pas gonfler
        // artificiellement la mémorisation estimée. Un échec, lui, compte
        // toujours — il révèle une lacune réelle.
        const keepSchedule =
          mode === 'free' && existing !== undefined && correct
        const card = keepSchedule
          ? existing
          : existing
            ? reviewCard(existing, grade)
            : createCard(grade)
        recordReview({
          courseId: course.id,
          lexemeId: item.lexeme.id,
          card,
          correct,
          isNew: !existing,
          seconds: Math.round((Date.now() - startedAt.current) / 1000),
          exerciseId: item.exercise.id,
        })
        setTally((t) => ({
          answered: t.answered + 1,
          correct: t.correct + (correct ? 1 : 0),
        }))
      }

      if (!correct) {
        // Une réponse ratée revient avant la fin : c'est le moment où la
        // correction est encore fraîche et où elle s'ancre le mieux.
        setQueue((q) => [...q, { ...item, replay: true }])
      }
    },
    [course.id, item, mode],
  )

  const submit = useCallback(
    (raw: string) => {
      if (!item || verdict || item.phase === 'introduce') return
      const ex = item.exercise
      // La carte à retourner a son propre chemin : rien n'y est saisi.
      if (ex.kind === 'flip') return

      const accepted =
        ex.kind === 'choice'
          ? [ex.answer]
          : ex.kind === 'listen'
            ? [ex.text]
            : ex.accepted
      const nearMisses = ex.kind === 'cloze' ? (ex.nearMisses ?? []) : []
      const result = checkAnswer(raw, accepted, nearMisses)

      if (ex.kind === 'choice' && ex.why) result.feedback = ex.why
      setVerdict(result)

      commit(
        result.correct,
        gradeFromAnswer({
          correct: result.correct,
          fuzzy: result.fuzzy,
          usedHint,
          elapsedMs: Date.now() - startedAt.current,
        }),
      )
    },
    [commit, item, usedHint, verdict],
  )

  /**
   * Réponse à une carte retournée. L'utilisateur est seul juge : c'est le
   * compromis accepté pour éviter d'écrire une réponse au pouce. Se déclarer
   * savant à tort ne trompe que soi.
   */
  const answerFlip = useCallback(
    (knew: boolean) => {
      if (!item || item.phase === 'introduce') return
      commit(knew, knew ? 3 : 1)
      setPos((p) => p + 1)
    },
    [commit, item],
  )

  const next = useCallback(() => setPos((p) => p + 1), [])

  if (!item) {
    return (
      <Summary
        tally={tally}
        total={total}
        seconds={Math.round((Date.now() - startedAt.current) / 1000)}
        onExit={onExit}
      />
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-6">
      <header className="flex items-center gap-4 py-4">
        <button
          onClick={onExit}
          aria-label="Quitter la session"
          className="-ml-2 flex h-10 w-10 items-center justify-center text-xl text-muted"
        >
          ×
        </button>
        <div className="flex-1">
          <ProgressBar value={total ? Math.min(pos / total, 1) : 0} />
        </div>
        <span className="text-sm tabular-nums text-muted">
          {Math.min(pos + 1, total)}/{total}
        </span>
      </header>

      <main className="flex flex-1 flex-col">
        <p className="mb-1 text-xs uppercase tracking-wide text-muted">
          {item.phase === 'introduce' ? 'Nouveau mot' : item.unitTitle}
        </p>

        {item.phase === 'introduce' ? (
          <Introduction
            lexeme={item.lexeme}
            voice={course.silent ? '' : course.voice}
            onNext={next}
          />
        ) : item.exercise.kind === 'flip' ? (
          <FlipCard
            // Remonter le composant remet la carte face avant.
            key={`${item.exercise.id}-${pos}`}
            exercise={item.exercise}
            onAnswer={answerFlip}
          />
        ) : (
          <>
        <Prompt
          exercise={item.exercise}
          voice={course.voice}
          locked={verdict !== null}
          input={input}
          setInput={setInput}
          onSubmit={submit}
          inputRef={inputRef}
          usedHint={usedHint}
          onHint={() => setUsedHint(true)}
          verdict={verdict}
        />

        <div className="flex-1" />

        {verdict ? (
          <Feedback
            verdict={verdict}
            lexeme={item.lexeme}
            voice={course.silent ? '' : course.voice}
            onNext={next}
          />
        ) : (
          item.exercise.kind !== 'choice' && (
            <Button
              className="w-full"
              onClick={() => submit(input)}
              disabled={!input.trim()}
            >
              Valider
            </Button>
          )
        )}
          </>
        )}
      </main>
    </div>
  )
}

function Prompt({
  exercise,
  voice,
  locked,
  input,
  setInput,
  onSubmit,
  inputRef,
  usedHint,
  onHint,
  verdict,
}: {
  exercise: Exercise
  voice: string
  locked: boolean
  input: string
  setInput: (v: string) => void
  onSubmit: (v: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  usedHint: boolean
  onHint: () => void
  verdict: Verdict | null
}) {
  const hint =
    'hint' in exercise && exercise.hint ? (exercise.hint as string) : null

  return (
    <div className="space-y-4">
      {exercise.kind === 'cloze' && (
        <>
          <p className="text-sm text-muted">{exercise.fr}</p>
          <p className="font-serif text-2xl leading-snug">
            {exercise.sentence.split('___').map((part, i, all) => (
              <span key={i}>
                {part}
                {i < all.length - 1 && (
                  <span className="mx-0.5 inline-block min-w-16 border-b-2 border-accent align-baseline text-center text-accent">
                    {verdict?.correct ? verdict.answer : ' '}
                  </span>
                )}
              </span>
            ))}
          </p>
        </>
      )}

      {exercise.kind === 'recall' && (
        <>
          <p className="text-xs uppercase tracking-wide text-muted">
            {exercise.prompt ?? 'Comment dit-on ?'}
          </p>
          <p className="font-serif text-2xl leading-snug">{exercise.fr}</p>
        </>
      )}

      {exercise.kind === 'listen' && (
        <>
          <p className="text-xs uppercase tracking-wide text-muted">
            Écoutez et écrivez
          </p>
          <SpeakButton
            onClick={() => speak(exercise.text, voice)}
            label="Réécouter"
          />
          <p className="text-sm text-muted">{exercise.fr}</p>
        </>
      )}

      {exercise.kind === 'choice' ? (
        <div className="space-y-2 pt-2">
          <p className="font-serif text-xl leading-snug">{exercise.prompt}</p>
          <div className="grid gap-2 pt-2">
            {exercise.options.map((opt) => {
              const chosen = verdict && input === opt
              const isAnswer = verdict && opt === exercise.answer
              return (
                <button
                  key={opt}
                  disabled={locked}
                  onClick={() => {
                    setInput(opt)
                    onSubmit(opt)
                  }}
                  className={`min-h-14 rounded-xl border px-4 text-left text-base transition-colors active:opacity-70 ${
                    isAnswer
                      ? 'border-accent bg-accent-soft text-accent'
                      : chosen
                        ? 'border-wrong bg-wrong-soft text-wrong'
                        : 'border-line bg-surface'
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <input
            ref={inputRef}
            value={input}
            disabled={locked}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit(input)
            }}
            // Les corrections automatiques du téléphone réécriraient la
            // réponse en langue étrangère : on les désactive toutes.
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="Votre réponse"
            className="w-full rounded-xl border border-line bg-surface px-4 py-4 text-lg outline-none focus:border-accent disabled:opacity-70"
          />
          {hint && !locked && (
            <button
              onClick={onHint}
              className="mt-3 text-sm text-muted underline underline-offset-4"
            >
              {usedHint ? (
                <span className="font-mono tracking-widest">{hint}</span>
              ) : (
                'Un indice ?'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Carte à retourner. On cherche de tête, on retourne, on se juge.
 *
 * La réponse n'apparaît qu'après le retournement : c'est tout l'intérêt de
 * l'exercice, et la raison pour laquelle les deux boutons de jugement ne
 * s'affichent pas avant.
 */
function FlipCard({
  exercise,
  onAnswer,
}: {
  exercise: FlipExercise
  onAnswer: (knew: boolean) => void
}) {
  const [revealed, setRevealed] = useState(false)

  return (
    <>
      <button
        onClick={() => setRevealed(true)}
        disabled={revealed}
        className="mt-2 w-full rounded-2xl border border-line bg-surface px-6 py-12 text-center transition-colors active:bg-accent-soft disabled:active:bg-surface"
      >
        <span className="block font-serif text-3xl leading-tight">
          {exercise.front}
        </span>
        {revealed ? (
          <>
            <span className="mx-auto mt-6 block h-px w-16 bg-line" />
            <span className="mt-6 block font-serif text-3xl leading-tight text-accent">
              {exercise.back}
            </span>
            {exercise.note && (
              <span className="mt-4 block text-sm leading-relaxed text-muted">
                {exercise.note}
              </span>
            )}
          </>
        ) : (
          <span className="mt-8 block text-sm text-muted">
            Touchez pour retourner
          </span>
        )}
      </button>

      <div className="flex-1" />

      {revealed ? (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="ghost" onClick={() => onAnswer(false)}>
            Je ne savais pas
          </Button>
          <Button onClick={() => onAnswer(true)}>Je savais</Button>
        </div>
      ) : (
        <Button className="w-full" onClick={() => setRevealed(true)}>
          Retourner
        </Button>
      )}
    </>
  )
}

/**
 * Présentation d'un mot inconnu : on montre, on ne teste pas.
 * Le test du même mot revient quelques questions plus loin, une fois cet
 * écran disparu — sans quoi il suffirait de recopier la réponse.
 */
function Introduction({
  lexeme,
  voice,
  onNext,
}: {
  lexeme: Lexeme
  voice: string
  onNext: () => void
}) {
  return (
    <>
      <div className="space-y-4">
        <Card className="border-accent/30 bg-accent-soft">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-serif text-2xl">{lexeme.term}</span>
            {lexeme.roman && (
              <span className="text-sm text-muted">{lexeme.roman}</span>
            )}
          </div>
          <p className="mt-1 text-base">{lexeme.gloss}</p>
          {lexeme.note && (
            <p className="mt-3 border-t border-accent/20 pt-3 text-sm leading-relaxed text-muted">
              {lexeme.note}
            </p>
          )}
          {voice && (
            <div className="mt-3">
              <SpeakButton onClick={() => speak(lexeme.term, voice)} />
            </div>
          )}
        </Card>

        <div className="space-y-3">
          {lexeme.examples?.map((ex) => (
            <div key={ex.text} className="border-l-2 border-line pl-3">
              <p className="font-serif text-lg leading-snug">{ex.text}</p>
              <p className="mt-0.5 text-sm text-muted">{ex.fr}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted">
          Lisez-le une fois. La question arrive dans quelques écrans.
        </p>
      </div>

      <div className="flex-1" />

      <Button className="w-full" onClick={onNext}>
        J'ai lu
      </Button>
    </>
  )
}

function Feedback({
  verdict,
  lexeme,
  voice,
  onNext,
}: {
  verdict: Verdict
  lexeme: Lexeme
  voice: string
  onNext: () => void
}) {
  // La touche Entrée sert à valider puis à enchaîner. Sans précaution, le
  // même appui fait les deux : la correction s'affiche et disparaît avant
  // d'avoir pu être lue. Le raccourci ne s'arme donc qu'une fois la touche
  // relâchée — ce qui neutralise aussi l'auto-répétition si on la maintient —
  // ou après un court délai, pour ceux qui ont validé à la souris.
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    const arm = () => setArmed(true)
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter') arm()
    }
    const timer = setTimeout(arm, 400)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    if (!armed) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [armed, onNext])

  const example = lexeme.examples?.[0]

  return (
    <div className="space-y-4 pt-4">
      <div
        className={`rounded-2xl p-4 ${
          verdict.correct ? 'bg-accent-soft' : 'bg-wrong-soft'
        }`}
      >
        <p
          className={`text-sm font-medium ${
            verdict.correct ? 'text-accent' : 'text-wrong'
          }`}
        >
          {verdict.correct ? 'Juste' : `Réponse : ${verdict.answer}`}
        </p>
        {verdict.feedback && (
          <p className="mt-1.5 text-sm leading-relaxed">{verdict.feedback}</p>
        )}
        {example && (
          <div className="mt-3 border-t border-line/60 pt-3">
            <p className="font-serif text-base">{example.text}</p>
            <p className="mt-0.5 text-sm text-muted">{example.fr}</p>
            {voice && (
              <div className="mt-2">
                <SpeakButton onClick={() => speak(example.text, voice)} />
              </div>
            )}
          </div>
        )}
      </div>
      <Button className="w-full" onClick={onNext}>
        Continuer
      </Button>
    </div>
  )
}

function Summary({
  tally,
  total,
  seconds,
  onExit,
}: {
  tally: Tally
  total: number
  seconds: number
  onExit: () => void
}) {
  const accuracy = tally.answered
    ? Math.round((tally.correct / tally.answered) * 100)
    : 0
  const minutes = Math.max(1, Math.round(seconds / 60))

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5">
      <h2 className="font-serif text-3xl">Session terminée</h2>
      <p className="mt-2 text-muted">
        {total === 0
          ? "Plus rien à proposer dans cette langue : tous les mots ont été vus récemment. Revenez demain, ou passez à l'autre langue."
          : 'Les mots ratés reviendront plus tôt que les autres.'}
      </p>
      {total > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Stat value={tally.answered} label="réponses" />
          <Stat value={`${accuracy} %`} label="de justesse" />
          <Stat value={`${minutes} min`} label="de travail" />
        </div>
      )}
      <Button className="mt-10 w-full" onClick={onExit}>
        Terminer
      </Button>
    </div>
  )
}
