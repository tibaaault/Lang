import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Course, Lexeme } from '../types'
import type {
  BuildStep,
  ChoiceStep,
  ClozeStep,
  FillStep,
  QuizStep,
  MatchStep,
  PathIndex,
  Step,
  TypeStep,
} from '../engine/lesson'
import { buildLesson, buildReview, lessonTimes } from '../engine/lesson'
import { checkAnswer } from '../engine/grade'
import { sameTokens } from '../engine/tokens'
import { shuffle } from '../engine/shuffle'
import type { CardState } from '../engine/fsrs'
import { createCard, isDue, reviewCard } from '../engine/fsrs'
import {
  completeLesson,
  getCard,
  getProgress,
  recordStep,
} from '../store/progress'
import { mayListen, speak, stopSpeaking } from '../audio'
import { Button, Card, ProgressBar, SpeakButton, Stat } from './components'

/** Ce qu'un exercice rapporte une fois la réponse donnée. */
interface StepResult {
  correct: boolean
  /**
   * Les mots mis en jeu. `strict` : une erreur prouve que le mot n'est pas
   * su. Une phrase mal assemblée ne dit pas lequel de ses mots a manqué :
   * elle n'est donc jamais retenue contre eux.
   */
  words: { id: string; correct: boolean; strict: boolean }[]
  /** La bonne réponse, telle qu'on la montre après coup. */
  solution?: string
  translation?: string
  /** Remarque sur une réponse acceptée mais imparfaite. */
  remark?: string
  /** Texte à lire une fois la réponse donnée. */
  speakAfter?: string
  /** Erreurs commises en route, pour un exercice qui se finit toujours. */
  slips?: number
}

const LANG_NAME: Record<string, string> = {
  vi: 'vietnamien',
  th: 'thaï',
  en: 'anglais',
}

const XP_LESSON = 10
const XP_FLAWLESS = 5

/**
 * Une leçon de parcours, ou une révision quand `lessonId` est nul.
 *
 * Aucune vie, aucun compteur d'erreurs qui arrête la séance : un exercice
 * raté revient simplement en fin de leçon, jusqu'à être réussi. L'erreur
 * coûte du temps, jamais le droit de continuer.
 */
export function LessonSession({
  course,
  index,
  lessonId,
  onExit,
}: {
  course: Course
  index: PathIndex
  lessonId: string | null
  onExit: () => void
}) {
  const [queue, setQueue] = useState<Step[]>(() => {
    if (!lessonId) return buildReview(index, getProgress())
    const ref = index.byLessonId.get(lessonId)
    const done = ref && lessonTimes(course.id, ref.lesson, getProgress())
    return buildLesson(index, lessonId, { practice: Boolean(done) })
  })
  const [total] = useState(queue.length)
  const [pos, setPos] = useState(0)
  const [cleared, setCleared] = useState(0)
  const [result, setResult] = useState<StepResult | null>(null)
  const [answered, setAnswered] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  // Sans voix disponible, les exercices d'écoute montrent leur texte.
  const [deaf, setDeaf] = useState(
    () => Boolean(course.silent) || !mayListen(course.voice),
  )
  const [xp, setXp] = useState<number | null>(null)

  const sessionStart = useRef(Date.now())
  const stepStart = useRef(Date.now())
  // Fiche de chaque mot telle qu'elle était avant la séance : un mot revient
  // plusieurs fois dans une leçon, et chaque passage ne doit pas le
  // replanifier comme s'il s'agissait d'une révision distincte.
  const before = useRef(new Map<string, CardState | undefined>())
  const outcome = useRef(new Map<string, boolean>())

  const step = queue[pos]
  const lang = LANG_NAME[course.lang] ?? course.title.toLocaleLowerCase()
  // Une unité peut avoir sa propre voix : un accent régional, quand
  // l'appareil en propose un.
  const voice =
    (lessonId && index.byLessonId.get(lessonId)?.unit.voice) || course.voice
  const title = lessonId
    ? (index.byLessonId.get(lessonId)?.lesson.title ?? course.title)
    : 'Révision'

  useEffect(() => {
    stepStart.current = Date.now()
    return stopSpeaking
  }, [pos])

  const say = useCallback(
    (text: string, rate?: number) => {
      // Un cours de connaissances n'a rien à faire entendre.
      if (course.silent) return
      // Les mots thaïs sont séparés à l'écran pour être lisibles, mais la
      // langue s'écrit d'un trait : on recolle avant de faire lire.
      speak(
        course.romanized ? text.replace(/\s+/g, '') : text,
        voice,
        rate,
      )
    },
    [voice, course.romanized, course.silent],
  )

  const onResult = useCallback(
    (r: StepResult) => {
      const cards: { lexemeId: string; card: CardState; isNew: boolean }[] = []
      for (const w of r.words) {
        if (!before.current.has(w.id)) {
          before.current.set(w.id, getCard(course.id, w.id))
        }
        const base = before.current.get(w.id)
        const previous = outcome.current.get(w.id)

        if (previous === undefined) {
          if (!w.correct && !w.strict) continue
          outcome.current.set(w.id, w.correct)
          // Réussir un mot pas encore échu ne repousse pas sa révision :
          // s'entraîner davantage ne doit pas gonfler la mémorisation estimée.
          if (base && w.correct && !isDue(base)) continue
          cards.push({
            lexemeId: w.id,
            // Un mot neuf réussi revient dès le lendemain : l'avoir reconnu
            // dix secondes après l'avoir lu ne prouve pas grand-chose.
            card: base
              ? reviewCard(base, w.correct ? 3 : 1)
              : createCard(w.correct ? 2 : 1),
            isNew: !base,
          })
        } else if (previous && !w.correct && w.strict) {
          // Réussi plus tôt dans la séance, raté ensuite : l'échec l'emporte.
          outcome.current.set(w.id, false)
          cards.push({
            lexemeId: w.id,
            card: base ? reviewCard(base, 1) : createCard(1),
            isNew: false,
          })
        }
      }

      recordStep({
        courseId: course.id,
        correct: r.correct,
        seconds: Math.round((Date.now() - stepStart.current) / 1000),
        cards,
      })
      setAnswered((n) => n + 1)
      if (!r.correct || r.slips) setMistakes((n) => n + 1)
      if (r.speakAfter) say(r.speakAfter)
      setResult(r)
    },
    [course.id, say],
  )

  const advance = useCallback(() => {
    if (!step) return
    if (result && !result.correct) {
      // L'exercice raté revient en fin de leçon, avec une clé neuve pour
      // repartir d'un état vierge.
      setQueue((q) => [...q, { ...step, key: `${step.key}'` }])
    } else {
      setCleared((n) => n + 1)
    }
    setResult(null)
    setPos((p) => p + 1)
  }, [result, step])

  const finished = !step
  useEffect(() => {
    if (!finished || xp !== null || total === 0) return
    const gained = XP_LESSON + (mistakes === 0 ? XP_FLAWLESS : 0)
    completeLesson(course.id, lessonId, gained)
    setXp(gained)
  }, [finished, xp, total, mistakes, course.id, lessonId])

  if (finished) {
    return (
      <Summary
        empty={total === 0}
        review={!lessonId}
        xp={xp ?? 0}
        answered={answered}
        mistakes={mistakes}
        seconds={Math.round((Date.now() - sessionStart.current) / 1000)}
        streak={getProgress().streak.current}
        onExit={onExit}
      />
    )
  }

  return (
    <Silent.Provider value={Boolean(course.silent)}>
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-6">
      <header className="flex items-center gap-4 py-4">
        <button
          onClick={onExit}
          aria-label="Quitter la leçon"
          className="-ml-2 flex h-10 w-10 items-center justify-center text-xl text-muted"
        >
          ×
        </button>
        <div className="flex-1">
          <ProgressBar value={total ? cleared / total : 0} />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <p className="mb-2 text-xs uppercase tracking-wide text-muted">
          {step.kind === 'intro' ? 'Nouveau mot' : title}
        </p>

        {step.kind === 'intro' && (
          <Intro key={step.key} word={step.word} say={say} onNext={advance} />
        )}
        {step.kind === 'choice' && (
          <Choice
            key={step.key}
            step={step}
            labels={course.labels}
            emo={index.emoji}
            rom={index.roman}
            say={say}
            deaf={deaf}
            onDeaf={() => setDeaf(true)}
            locked={result !== null}
            onResult={onResult}
          />
        )}
        {step.kind === 'match' && (
          <Match
            key={step.key}
            step={step}
            emo={index.emoji}
            rom={index.roman}
            say={say}
            locked={result !== null}
            onResult={onResult}
          />
        )}
        {step.kind === 'build' && (
          <Build
            key={step.key}
            step={step}
            lang={lang}
            rom={index.roman}
            say={say}
            deaf={deaf}
            onDeaf={() => setDeaf(true)}
            locked={result !== null}
            onResult={onResult}
          />
        )}
        {step.kind === 'cloze' && (
          <ClozeView
            key={step.key}
            step={step}
            locked={result !== null}
            onResult={onResult}
          />
        )}
        {step.kind === 'quiz' && (
          <QuizView
            key={step.key}
            step={step}
            say={say}
            locked={result !== null}
            onResult={onResult}
          />
        )}
        {step.kind === 'fill' && (
          <Fill
            key={step.key}
            step={step}
            rom={index.roman}
            locked={result !== null}
            onResult={onResult}
          />
        )}
        {step.kind === 'type' && (
          <Type
            key={step.key}
            step={step}
            labels={course.labels}
            lang={lang}
            locked={result !== null}
            onResult={onResult}
          />
        )}

        {result && <Feedback result={result} rom={index.roman} say={say} onNext={advance} />}
      </main>
    </div>
    </Silent.Provider>
  )
}

/** Vrai pour un cours sans son : les boutons d'écoute disparaissent. */
const Silent = createContext(false)

type Say = (text: string, rate?: number) => void
type Rom = (text: string) => string | undefined
type Emo = (termOrGloss: string) => string | undefined

/** Pictogramme devant un sens. Décoratif : absent de ce que lit un lecteur d'écran. */
function Emoji({ of, emo }: { of: string; emo: Emo }) {
  const emoji = emo(of)
  return emoji ? <span aria-hidden>{emoji} </span> : null
}

/**
 * Prononciation en lettres latines, sous un texte écrit dans un autre
 * alphabet. Rien ne s'affiche pour une langue déjà en alphabet latin.
 */
function Roman({ text, rom }: { text: string; rom: Rom }) {
  const roman = rom(text)
  if (!roman) return null
  return (
    <span className="mt-0.5 block font-sans text-xs font-normal text-muted">
      {roman}
    </span>
  )
}

/** Lecture normale et lecture lente : la seconde détache les tons. */
function Listen({ text, say, big }: { text: string; say: Say; big?: boolean }) {
  if (useContext(Silent)) return null
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => say(text)}
        aria-label="Écouter"
        className={`flex items-center justify-center rounded-2xl bg-accent text-paper active:opacity-70 ${
          big ? 'h-20 w-20 text-3xl' : 'h-11 w-11 text-lg'
        }`}
      >
        <span aria-hidden>🔊</span>
      </button>
      <button
        onClick={() => say(text, 0.55)}
        aria-label="Écouter lentement"
        className={`flex items-center justify-center rounded-2xl border border-line text-muted active:opacity-70 ${
          big ? 'h-14 w-14 text-xl' : 'h-11 w-11 text-base'
        }`}
      >
        <span aria-hidden>🐢</span>
      </button>
    </div>
  )
}

function CantListen({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-3 text-sm text-muted underline underline-offset-4"
    >
      Je ne peux pas écouter
    </button>
  )
}

const optionClass = (state: 'idle' | 'right' | 'wrong') =>
  `min-h-14 rounded-xl border-2 px-4 py-2 text-left text-base transition-colors active:opacity-70 ${
    state === 'right'
      ? 'border-accent bg-accent-soft text-accent'
      : state === 'wrong'
        ? 'border-wrong bg-wrong-soft text-wrong'
        : 'border-line bg-surface'
  }`

function Intro({
  word,
  say,
  onNext,
}: {
  word: Lexeme
  say: Say
  onNext: () => void
}) {
  // Le mot est lu dès qu'il apparaît : on le rencontre d'abord par l'oreille.
  useEffect(() => {
    say(word.term)
  }, [say, word.term])

  return (
    <>
      <Card className="border-accent/30 bg-accent-soft">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-serif text-3xl">
              {word.emoji && <span aria-hidden>{word.emoji} </span>}
              {word.term}
            </p>
            {word.roman && (
              <p className="mt-1 text-sm text-muted">≈ {word.roman}</p>
            )}
          </div>
          <Listen text={word.term} say={say} />
        </div>
        <p className="mt-3 text-lg">{word.gloss}</p>
        {word.note && (
          <p className="mt-3 border-t border-accent/20 pt-3 text-sm leading-relaxed text-muted">
            {word.note}
          </p>
        )}
      </Card>
      <div className="flex-1" />
      <Button className="mt-4 w-full" onClick={onNext}>
        Continuer
      </Button>
    </>
  )
}

function Choice({
  step,
  labels,
  emo,
  rom,
  say,
  deaf,
  onDeaf,
  locked,
  onResult,
}: {
  step: ChoiceStep
  labels?: { meaning?: string; term?: string; write?: string }
  emo: Emo
  rom: Rom
  say: Say
  deaf: boolean
  onDeaf: () => void
  locked: boolean
  onResult: (r: StepResult) => void
}) {
  const [chosen, setChosen] = useState<string | null>(null)
  const heard = step.mode !== 'term'
  const blind = step.mode === 'listen' && !deaf

  useEffect(() => {
    if (heard) say(step.term)
  }, [heard, say, step.term])

  const choose = (opt: string) => {
    if (locked) return
    setChosen(opt)
    const correct = opt === step.answer
    onResult({
      correct,
      words: [{ id: step.wordId, correct, strict: true }],
      solution: step.term,
      translation: step.gloss,
      speakAfter: heard ? undefined : step.term,
    })
  }

  return (
    <div>
      <p className="text-sm text-muted">
        {step.mode === 'term'
          ? (labels?.term ?? 'Comment dit-on ?')
          : blind
            ? 'Que veut dire ce que vous entendez ?'
            : (labels?.meaning ?? 'Que veut dire ce mot ?')}
      </p>
      {step.mode === 'term' ? (
        <p className="mt-2 font-serif text-2xl leading-snug">
          <Emoji of={step.gloss} emo={emo} />
          {step.gloss}
        </p>
      ) : blind ? (
        <div className="mt-4">
          <Listen text={step.term} say={say} big />
          <CantListen onClick={onDeaf} />
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="font-serif text-3xl">
            {step.term}
            <Roman text={step.term} rom={rom} />
          </p>
          <Listen text={step.term} say={say} />
        </div>
      )}

      <div className="mt-6 grid gap-2">
        {step.options.map((opt) => (
          <button
            key={opt}
            disabled={locked}
            onClick={() => choose(opt)}
            className={optionClass(
              locked && opt === step.answer
                ? 'right'
                : locked && opt === chosen
                  ? 'wrong'
                  : 'idle',
            )}
          >
            {step.mode !== 'term' && <Emoji of={opt} emo={emo} />}
            {opt}
            {step.mode === 'term' && <Roman text={opt} rom={rom} />}
          </button>
        ))}
      </div>
    </div>
  )
}

function Match({
  step,
  emo,
  rom,
  say,
  locked,
  onResult,
}: {
  step: MatchStep
  emo: Emo
  rom: Rom
  say: Say
  locked: boolean
  onResult: (r: StepResult) => void
}) {
  // Les deux colonnes sont mélangées séparément, une fois pour l'exercice.
  const left = useMemo(() => shuffle(step.pairs), [step])
  const right = useMemo(() => shuffle(step.pairs), [step])
  const [term, setTerm] = useState<string | null>(null)
  const [gloss, setGloss] = useState<string | null>(null)
  const [done, setDone] = useState<string[]>([])
  const [clash, setClash] = useState<[string, string] | null>(null)
  const missed = useRef(new Set<string>())

  const attempt = (t: string | null, g: string | null) => {
    setTerm(t)
    setGloss(g)
    if (!t || !g) return
    if (t === g) {
      const next = [...done, t]
      setDone(next)
      setTerm(null)
      setGloss(null)
      if (next.length === step.pairs.length) {
        onResult({
          // On finit toujours par tout relier : l'exercice n'est pas rejoué,
          // mais les mots confondus en route sont notés comme manqués.
          correct: true,
          slips: missed.current.size,
          words: step.pairs.map((p) => ({
            id: p.id,
            correct: !missed.current.has(p.id),
            strict: true,
          })),
        })
      }
    } else {
      missed.current.add(t)
      missed.current.add(g)
      setClash([t, g])
      setTimeout(() => {
        setClash(null)
        setTerm(null)
        setGloss(null)
      }, 500)
    }
  }

  const cell = (id: string, selected: boolean, clashing: boolean) => {
    const matched = done.includes(id)
    return `min-h-14 w-full rounded-xl border-2 px-3 py-2 text-center text-base transition-colors ${
      matched
        ? 'border-line bg-paper text-muted opacity-40'
        : clashing
          ? 'border-wrong bg-wrong-soft text-wrong'
          : selected
            ? 'border-accent bg-accent-soft text-accent'
            : 'border-line bg-surface'
    }`
  }

  return (
    <div>
      <p className="text-sm text-muted">Reliez chaque mot à son sens</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="grid content-start gap-2">
          {left.map((p) => (
            <button
              key={p.id}
              disabled={locked || done.includes(p.id) || clash !== null}
              onClick={() => {
                say(p.term)
                attempt(p.id, gloss)
              }}
              className={cell(p.id, term === p.id, clash?.[0] === p.id)}
            >
              {p.term}
              <Roman text={p.term} rom={rom} />
            </button>
          ))}
        </div>
        <div className="grid content-start gap-2">
          {right.map((p) => (
            <button
              key={p.id}
              disabled={locked || done.includes(p.id) || clash !== null}
              onClick={() => attempt(term, p.id)}
              className={cell(p.id, gloss === p.id, clash?.[1] === p.id)}
            >
              <Emoji of={p.gloss} emo={emo} />
              {p.gloss}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Build({
  step,
  lang,
  rom,
  say,
  deaf,
  onDeaf,
  locked,
  onResult,
}: {
  step: BuildStep
  lang: string
  rom: Rom
  say: Say
  deaf: boolean
  onDeaf: () => void
  locked: boolean
  onResult: (r: StepResult) => void
}) {
  // Positions des tuiles posées, dans l'ordre : deux tuiles identiques
  // restent ainsi deux tuiles distinctes.
  const [placed, setPlaced] = useState<number[]>([])
  const toFr = step.mode === 'to-fr'
  const heard = step.mode !== 'to-target'
  const blind = step.mode === 'listen' && !deaf

  useEffect(() => {
    if (heard) say(step.phrase.text)
  }, [heard, say, step.phrase.text])

  const check = () => {
    const correct = sameTokens(
      placed.map((i) => step.tiles[i]),
      step.answer,
    )
    onResult({
      correct,
      words: step.wordIds.map((id) => ({ id, correct, strict: false })),
      solution: step.phrase.text,
      translation: step.phrase.fr,
      speakAfter: heard ? undefined : step.phrase.text,
    })
  }

  const tile =
    'min-h-11 rounded-xl border-2 border-line bg-surface px-3 py-1.5 text-base active:opacity-70'

  return (
    <>
      <div>
        <p className="text-sm text-muted">
          {toFr
            ? 'Traduisez en français'
            : blind
              ? 'Écoutez et reconstruisez la phrase'
              : step.mode === 'listen'
                ? 'Reconstruisez la phrase'
                : `Traduisez en ${lang}`}
        </p>
        {step.mode === 'to-target' ? (
          <p className="mt-2 font-serif text-2xl leading-snug">
            {step.phrase.fr}
          </p>
        ) : blind ? (
          <div className="mt-4">
            <Listen text={step.phrase.text} say={say} big />
            <CantListen onClick={onDeaf} />
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="font-serif text-2xl leading-snug">
              {step.phrase.text}
              <Roman text={step.phrase.text} rom={rom} />
            </p>
            <Listen text={step.phrase.text} say={say} />
          </div>
        )}

        <div
          aria-label="Votre phrase"
          className="mt-6 flex min-h-28 flex-wrap content-start gap-2 border-y border-line py-3"
        >
          {placed.map((i) => (
            <button
              key={i}
              disabled={locked}
              onClick={() => setPlaced((p) => p.filter((x) => x !== i))}
              className={tile}
            >
              {step.tiles[i]}
              {!toFr && <Roman text={step.tiles[i]} rom={rom} />}
            </button>
          ))}
        </div>

        <div
          aria-label="Mots proposés"
          className="mt-5 flex flex-wrap justify-center gap-2"
        >
          {step.tiles.map((t, i) => {
            const used = placed.includes(i)
            return (
              <button
                key={i}
                disabled={locked || used}
                onClick={() => {
                  if (!toFr) say(t)
                  setPlaced((p) => [...p, i])
                }}
                className={`${tile} ${used ? 'border-dashed text-transparent' : ''}`}
              >
                {t}
                {!toFr && !used && <Roman text={t} rom={rom} />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1" />
      {!locked && (
        <Button
          className="mt-4 w-full"
          onClick={check}
          disabled={placed.length === 0}
        >
          Vérifier
        </Button>
      )}
    </>
  )
}

function Fill({
  step,
  rom,
  locked,
  onResult,
}: {
  step: FillStep
  rom: Rom
  locked: boolean
  onResult: (r: StepResult) => void
}) {
  const [chosen, setChosen] = useState<string | null>(null)

  const choose = (opt: string) => {
    if (locked) return
    setChosen(opt)
    const correct = opt === step.answer
    onResult({
      correct,
      words: [{ id: step.wordId, correct, strict: true }],
      solution: step.phrase.text,
      translation: step.phrase.fr,
      speakAfter: step.phrase.text,
    })
  }

  return (
    <div>
      <p className="text-sm text-muted">Complétez la phrase</p>
      <p className="mt-2 text-base text-muted">{step.phrase.fr}</p>
      <p
        aria-label="Phrase à compléter"
        className="mt-3 font-serif text-2xl leading-snug"
      >
        {step.sentence.split('___').map((part, i, all) => (
          <span key={i}>
            {part}
            {i < all.length - 1 && (
              <span className="mx-1 inline-block min-w-16 border-b-2 border-accent text-center text-accent">
                {locked ? step.answer : ' '}
              </span>
            )}
          </span>
        ))}
        <Roman text={step.sentence} rom={rom} />
      </p>
      <div className="mt-6 grid grid-cols-2 gap-2">
        {step.options.map((opt) => (
          <button
            key={opt}
            disabled={locked}
            onClick={() => choose(opt)}
            className={`${optionClass(
              locked && opt === step.answer
                ? 'right'
                : locked && opt === chosen
                  ? 'wrong'
                  : 'idle',
            )} text-center`}
          >
            {opt}
            <Roman text={opt} rom={rom} />
          </button>
        ))}
      </div>
    </div>
  )
}

/** La phrase d'un exercice à trou, ses trous comblés par la réponse. */
function filled(sentence: string, answer: string): string {
  const holes = sentence.split('___').length - 1
  // Plusieurs trous : un mot de la réponse dans chacun, dans l'ordre.
  const parts = holes > 1 ? answer.split(' ') : [answer]
  let i = 0
  return sentence.replace(/___/g, () => parts[i++] ?? '')
}

/**
 * Phrase à trou où l'on écrit le mot manquant. C'est la forme la plus
 * exigeante : rien n'est proposé, et une erreur prévue reçoit son explication.
 */
function ClozeView({
  step,
  locked,
  onResult,
}: {
  step: ClozeStep
  locked: boolean
  onResult: (r: StepResult) => void
}) {
  const [input, setInput] = useState('')
  const [right, setRight] = useState(false)
  const { cloze } = step

  const check = () => {
    if (locked || !input.trim()) return
    const verdict = checkAnswer(input, cloze.accepted, cloze.nearMisses ?? [])
    setRight(verdict.correct)
    const sentence = filled(cloze.sentence, verdict.answer)
    onResult({
      correct: verdict.correct,
      words: [{ id: cloze.lexemeId, correct: verdict.correct, strict: true }],
      solution: sentence,
      translation: cloze.fr,
      remark: verdict.feedback,
      speakAfter: sentence,
    })
  }

  return (
    <>
      <div>
        <p className="text-sm text-muted">Complétez la phrase</p>
        <p className="mt-2 text-base text-muted">{cloze.fr}</p>
        <p className="mt-3 font-serif text-2xl leading-snug">
          {cloze.sentence.split('___').map((part, i, all) => (
            <span key={i}>
              {part}
              {i < all.length - 1 && (
                <span className="mx-1 inline-block min-w-16 border-b-2 border-accent text-center text-accent">
                  {right ? input.trim().split(' ')[all.length > 2 ? i : 0] : ' '}
                </span>
              )}
            </span>
          ))}
        </p>
        <input
          value={input}
          disabled={locked}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') check()
          }}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="Le mot manquant"
          className="mt-6 w-full rounded-xl border-2 border-line bg-surface px-4 py-4 text-lg outline-none focus:border-accent disabled:opacity-70"
        />
      </div>
      <div className="flex-1" />
      {!locked && (
        <Button className="mt-4 w-full" onClick={check} disabled={!input.trim()}>
          Vérifier
        </Button>
      )}
    </>
  )
}

function QuizView({
  step,
  say,
  locked,
  onResult,
}: {
  step: QuizStep
  say: Say
  locked: boolean
  onResult: (r: StepResult) => void
}) {
  const [chosen, setChosen] = useState<string | null>(null)
  const { speak: spoken } = step.quiz

  useEffect(() => {
    if (spoken) say(spoken)
  }, [say, spoken])

  const choose = (opt: string) => {
    if (locked) return
    setChosen(opt)
    onResult({
      correct: opt === step.answer,
      words: [],
      // La bonne option est déjà mise en évidence : la répéter ici ferait
      // lire une réponse française par une voix anglaise.
      // L'explication est le cœur de l'exercice : elle s'affiche que la
      // réponse soit juste ou non.
      remark: step.quiz.why,
    })
  }

  return (
    <div>
      <p className="font-serif text-xl leading-snug">{step.quiz.prompt}</p>
      {spoken && (
        <div className="mt-4">
          <Listen text={spoken} say={say} />
        </div>
      )}
      <div className="mt-6 grid gap-2">
        {step.options.map((opt) => (
          <button
            key={opt}
            disabled={locked}
            onClick={() => choose(opt)}
            className={optionClass(
              locked && opt === step.answer
                ? 'right'
                : locked && opt === chosen
                  ? 'wrong'
                  : 'idle',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function Type({
  step,
  labels,
  lang,
  locked,
  onResult,
}: {
  step: TypeStep
  labels?: { meaning?: string; term?: string; write?: string }
  lang: string
  locked: boolean
  onResult: (r: StepResult) => void
}) {
  const [input, setInput] = useState('')

  const check = () => {
    if (locked || !input.trim()) return
    const verdict = checkAnswer(input, [step.term, ...(step.accepted ?? [])])
    // Les tons ne se tapent pas sur un clavier français : on accepte le mot
    // sans eux, mais on montre toujours la graphie complète.
    const exact =
      input.trim().toLocaleLowerCase() === step.term.toLocaleLowerCase()
    onResult({
      correct: verdict.correct,
      words: [{ id: step.wordId, correct: verdict.correct, strict: true }],
      solution: step.term,
      translation: step.gloss,
      remark:
        verdict.correct && !exact
          ? `Avec ses accents : « ${step.term} ».`
          : undefined,
      speakAfter: step.term,
    })
  }

  return (
    <>
      <div>
        <p className="text-sm text-muted">{labels?.write ?? `Écrivez en ${lang}`}</p>
        <p className="mt-2 font-serif text-2xl leading-snug">{step.gloss}</p>
        <input
          value={input}
          disabled={locked}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') check()
          }}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="Votre réponse"
          className="mt-6 w-full rounded-xl border-2 border-line bg-surface px-4 py-4 text-lg outline-none focus:border-accent disabled:opacity-70"
        />
        <p className="mt-2 text-xs text-muted">
          Les accents et la ponctuation sont facultatifs.
        </p>
      </div>
      <div className="flex-1" />
      {!locked && (
        <Button className="mt-4 w-full" onClick={check} disabled={!input.trim()}>
          Vérifier
        </Button>
      )}
    </>
  )
}

function Feedback({
  result,
  rom,
  say,
  onNext,
}: {
  result: StepResult
  rom: Rom
  say: Say
  onNext: () => void
}) {
  const silent = useContext(Silent)
  // Entrée valide puis enchaîne : le raccourci ne s'arme qu'après un court
  // délai, sans quoi le même appui ferait disparaître la correction.
  useEffect(() => {
    let armed = false
    const timer = setTimeout(() => (armed = true), 400)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && armed) {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onNext])

  return (
    <div className="mt-4 space-y-3">
      <div
        role="status"
        className={`rounded-2xl p-4 ${
          result.correct ? 'bg-accent-soft' : 'bg-wrong-soft'
        }`}
      >
        <p
          className={`text-sm font-semibold ${
            result.correct ? 'text-accent' : 'text-wrong'
          }`}
        >
          {result.correct ? 'Bien joué !' : 'Pas tout à fait'}
        </p>
        {result.solution && (
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-serif text-lg leading-snug">
                {result.solution}
                <Roman text={result.solution} rom={rom} />
              </p>
              {result.translation && (
                <p className="mt-0.5 text-sm text-muted">
                  {result.translation}
                </p>
              )}
            </div>
            {!silent && (
              <SpeakButton onClick={() => say(result.solution!)} label="" />
            )}
          </div>
        )}
        {result.remark && (
          <p className="mt-2 text-sm leading-relaxed">{result.remark}</p>
        )}
        {!result.correct && (
          <p className="mt-2 text-xs text-muted">
            Cet exercice reviendra à la fin de la leçon.
          </p>
        )}
      </div>
      <Button className="w-full" onClick={onNext}>
        Continuer
      </Button>
    </div>
  )
}

function Summary({
  empty,
  review,
  xp,
  answered,
  mistakes,
  seconds,
  streak,
  onExit,
}: {
  empty: boolean
  review: boolean
  xp: number
  answered: number
  mistakes: number
  seconds: number
  streak: number
  onExit: () => void
}) {
  const accuracy = answered
    ? Math.round(((answered - mistakes) / answered) * 100)
    : 0
  const minutes = Math.max(1, Math.round(seconds / 60))

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5">
      {empty ? (
        <>
          <h2 className="font-serif text-3xl">Rien à réviser</h2>
          <p className="mt-2 text-muted">
            Terminez une première leçon : ses mots reviendront ici.
          </p>
        </>
      ) : (
        <>
          <p className="text-5xl" aria-hidden>
            {mistakes === 0 ? '🌟' : '🎉'}
          </p>
          <h2 className="mt-4 font-serif text-3xl">
            {review ? 'Révision terminée' : 'Leçon terminée'}
          </h2>
          <p className="mt-2 text-muted">
            {mistakes === 0
              ? 'Sans une seule erreur.'
              : 'Les mots hésitants reviendront plus tôt en révision.'}
            {streak > 0 &&
              ` ${streak} jour${streak > 1 ? 's' : ''} d'affilée.`}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            <Stat value={`+${xp}`} label="points" />
            <Stat value={`${accuracy} %`} label="de justesse" />
            <Stat value={`${minutes} min`} label="de travail" />
          </div>
        </>
      )}
      <Button className="mt-10 w-full" onClick={onExit}>
        Continuer
      </Button>
    </div>
  )
}
