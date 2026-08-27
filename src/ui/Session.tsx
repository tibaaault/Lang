import { useCallback, useEffect, useRef, useState } from 'react'
import type { Course, Exercise, Lexeme } from '../types'
import type { CourseIndex, SessionItem } from '../engine/scheduler'
import { buildSession } from '../engine/scheduler'
import { checkAnswer, type Verdict } from '../engine/grade'
import { createCard, gradeFromAnswer, reviewCard } from '../engine/fsrs'
import { getCard, getProgress, recordReview } from '../store/progress'
import { speak, stopSpeaking } from '../audio'
import { Button, Card, ProgressBar, SpeakButton, Stat } from './components'

interface Props {
  course: Course
  index: CourseIndex
  onExit: () => void
}

interface Tally {
  answered: number
  correct: number
}

export function Session({ course, index, onExit }: Props) {
  // La file est construite une seule fois : les mots répondus pendant la
  // session ne doivent pas la faire changer sous les pieds de l'utilisateur.
  const [queue, setQueue] = useState<SessionItem[]>(() =>
    buildSession(course, index, getProgress()),
  )
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

  const submit = useCallback(
    (raw: string) => {
      if (!item || verdict) return
      const ex = item.exercise
      const accepted =
        ex.kind === 'choice'
          ? [ex.answer]
          : ex.kind === 'listen'
            ? [ex.text]
            : ex.accepted
      const nearMisses = ex.kind === 'cloze' ? (ex.nearMisses ?? []) : []
      const result = checkAnswer(raw, accepted, nearMisses)

      if (ex.kind === 'choice' && !result.correct && ex.why) {
        result.feedback = ex.why
      }
      if (ex.kind === 'choice' && result.correct && ex.why) {
        result.feedback = ex.why
      }
      setVerdict(result)

      const elapsedMs = Date.now() - startedAt.current
      const existing = getCard(course.id, item.lexeme.id)
      const grade = gradeFromAnswer({
        correct: result.correct,
        fuzzy: result.fuzzy,
        usedHint,
        elapsedMs,
      })
      // Un mot rejoué en fin de session sert de renforcement : il ne doit pas
      // écraser la planification déjà calculée à la première tentative.
      const alreadyAnsweredThisSession = item.replay === true
      if (!alreadyAnsweredThisSession) {
        const card = existing
          ? reviewCard(existing, grade)
          : createCard(grade)
        recordReview({
          courseId: course.id,
          lexemeId: item.lexeme.id,
          card,
          correct: result.correct,
          isNew: !existing,
          seconds: Math.round(elapsedMs / 1000),
          exerciseId: ex.id,
        })
        setTally((t) => ({
          answered: t.answered + 1,
          correct: t.correct + (result.correct ? 1 : 0),
        }))
      }

      if (!result.correct) {
        // Une réponse ratée revient avant la fin : c'est le moment où la
        // correction est encore fraîche et où elle s'ancre le mieux.
        setQueue((q) => [...q, { ...item, replay: true }])
      }
    },
    [course.id, item, usedHint, verdict],
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
          {item.isNew ? 'Nouveau mot' : item.unitTitle}
        </p>

        <Prompt
          exercise={item.exercise}
          lexeme={item.lexeme}
          voice={course.voice}
          isNew={item.isNew}
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
            voice={course.voice}
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
      </main>
    </div>
  )
}

function Prompt({
  exercise,
  lexeme,
  voice,
  isNew,
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
  lexeme: Lexeme
  voice: string
  isNew: boolean
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
      {/* Un mot rencontré pour la première fois est d'abord montré, pas testé :
          deviner un mot qu'on n'a jamais vu n'apprend rien. */}
      {isNew && (
        <Card className="bg-accent-soft border-accent/20">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-lg font-semibold">{lexeme.term}</span>
            <span className="text-sm text-muted">{lexeme.gloss}</span>
          </div>
          {lexeme.note && (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {lexeme.note}
            </p>
          )}
        </Card>
      )}

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
            Comment dit-on ?
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

  const example = lexeme.examples[0]

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
            <div className="mt-2">
              <SpeakButton onClick={() => speak(example.text, voice)} />
            </div>
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
          ? "Rien à réviser pour l'instant. Revenez demain, ou augmentez le nombre de mots nouveaux par jour dans les réglages."
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
