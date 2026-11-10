// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'
import { courseById } from '../../content'
import { indexPath, lessonKey } from '../../engine/lesson'
import { cardKey, getProgress, resetProgress } from '../../store/progress'

vi.mock('../../store/supabase', () => ({
  getSupabase: () => Promise.resolve(null),
  isRemoteEnabled: false,
  DB_SCHEMA: 'lang',
}))

beforeEach(() => {
  vi.stubGlobal('speechSynthesis', {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: () => [],
    addEventListener: vi.fn(),
  })
  vi.stubGlobal('SpeechSynthesisUtterance', class {})
  resetProgress()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const course = courseById('vi')!
const index = indexPath(course)
const first = index.lessons[0].lesson
const glossOf = new Map(index.words.map((w) => [w.term, w.gloss]))
const termOf = new Map(index.words.map((w) => [w.gloss, w.term]))
const phraseByFr = new Map(
  index.lessons.flatMap((l) => l.lesson.phrases).map((p) => [p.fr, p]),
)
const phraseByText = new Map(
  index.lessons.flatMap((l) => l.lesson.phrases).map((p) => [p.text, p]),
)

/**
 * Joue l'exercice affiché, juste ou faux, en lisant l'écran comme le ferait
 * un apprenant qui connaît toutes les réponses.
 */
async function play(user: ReturnType<typeof userEvent.setup>, wrong = false) {
  const text = (re: RegExp) => screen.queryByText(re)

  if (text(/Reliez chaque mot/)) {
    // Les paires : on relie chaque mot affiché à son sens.
    for (const [term, gloss] of glossOf) {
      const left = screen.queryByRole('button', { name: term })
      const right = screen.queryByRole('button', { name: gloss })
      if (left && right && !left.hasAttribute('disabled')) {
        await user.click(left)
        await user.click(right)
      }
    }
    return
  }

  if (screen.queryByLabelText('Mots proposés')) {
    // Une phrase à assembler. Sans voix, l'écoute affiche son texte.
    if (text(/Je ne peux pas écouter/)) {
      await user.click(screen.getByText(/Je ne peux pas écouter/))
    }
    const bank = within(screen.getByLabelText('Mots proposés'))
    const toFr = text(/Traduisez en français/) !== null
    // Seule la traduction vers le vietnamien affiche la phrase française.
    const fromFr = text(/Traduisez en vietnamien/) !== null
    const phrase = [...(fromFr ? phraseByFr : phraseByText).entries()].find(
      ([shown]) => screen.queryByText(shown),
    )![1]
    const answer = toFr
      ? index.tokenizer.fr(phrase.fr)
      : index.tokenizer.target(phrase.text)
    const tokens = wrong ? [...answer].reverse() : answer
    for (const token of tokens) {
      const tile = bank
        .getAllByRole('button', { name: token })
        .find((b) => !b.hasAttribute('disabled'))!
      await user.click(tile)
    }
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))
    return
  }

  const input = screen.queryByPlaceholderText('Votre réponse')
  if (input) {
    const gloss = [...termOf.keys()].find((g) => screen.queryByText(g))!
    // Sans accents : c'est ainsi qu'on tape sur un clavier français.
    const plain = termOf
      .get(gloss)!
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
    await user.type(input, wrong ? 'zzzz' : plain)
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))
    return
  }

  if (text(/Complétez la phrase/)) {
    const phrase = [...phraseByFr.entries()].find(([fr]) => screen.queryByText(fr))![1]
    const tokens = index.tokenizer.target(phrase.text)
    const options = screen
      .getAllByRole('button')
      .filter((b) => b.className.includes('min-h-14'))
    // La bonne option est celle qui, remise dans le trou, redonne la phrase.
    const sentence = screen.getByLabelText('Phrase à compléter')
    const shown = index.tokenizer.target(sentence.textContent ?? '')
    const right = options.find((o) => {
      const word = o.textContent!
      return tokens.includes(word) && !shown.includes(word)
    })
    const pick = wrong ? options.find((o) => o !== right)! : (right ?? options[0])
    await user.click(pick)
    return
  }

  // Choix multiple, dans un sens ou dans l'autre.
  if (text(/Je ne peux pas écouter/)) {
    await user.click(screen.getByText(/Je ne peux pas écouter/))
  }
  const options = screen
    .getAllByRole('button')
    .filter((b) => b.className.includes('min-h-14'))
  const labels = options.map((o) => o.textContent!)
  const right = options.find((o) => {
    const label = o.textContent!
    const asGloss = termOf.get(label)
    const asTerm = glossOf.get(label)
    // Sens proposés : le mot affiché est celui dont c'est le sens, et
    // inversement.
    return (
      (asGloss !== undefined && !labels.includes(asGloss) && screen.queryByText(asGloss)) ||
      (asTerm !== undefined && !labels.includes(asTerm) && screen.queryByText(asTerm))
    )
  })!
  await user.click(wrong ? options.find((o) => o !== right)! : right)
}

async function finishLesson(user: ReturnType<typeof userEvent.setup>, failFirst = false) {
  let failed = !failFirst
  for (let guard = 0; guard < 80; guard++) {
    if (screen.queryByText(/Leçon terminée|Révision terminée/)) return
    const intro = screen.queryByText('Nouveau mot')
    if (!intro && !screen.queryByRole('status')) {
      const isMatch = screen.queryByText(/Reliez chaque mot/) !== null
      await play(user, !failed && !isMatch)
      if (!isMatch) failed = true
    }
    await user.click(await screen.findByRole('button', { name: 'Continuer' }))
  }
  throw new Error('la leçon ne se termine pas')
}

describe("leçon de parcours, de l'accueil au bilan", () => {
  it('ouvre sur le parcours et lance la première leçon', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Le parcours vietnamien est l'accueil par défaut.
    expect(await screen.findByText('Premiers mots')).toBeTruthy()
    await user.click(
      screen.getByRole('button', { name: `${first.title} — commencer` }),
    )
    expect(await screen.findByText('Nouveau mot')).toBeTruthy()

    await finishLesson(user)

    const progress = getProgress()
    expect(progress.lessons?.[lessonKey('vi', first.id)]).toBe(1)
    // Sans faute : dix points, plus cinq.
    expect(progress.xp).toBe(15)
    expect(progress.streak.current).toBe(1)
    // Tous les mots de la leçon ont désormais une fiche de révision.
    for (const id of first.lexemeIds) {
      expect(progress.cards[cardKey('vi', id)], id).toBeTruthy()
    }

    // Retour au parcours : la leçon est cochée, la suivante mise en avant.
    await user.click(screen.getByRole('button', { name: 'Continuer' }))
    expect(
      await screen.findByRole('button', { name: `${first.title} — refaire` }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', {
        name: `${index.lessons[1].lesson.title} — commencer`,
      }),
    ).toBeTruthy()
  })

  it("ne s'arrête jamais sur une erreur : l'exercice revient en fin de leçon", async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(
      await screen.findByRole('button', { name: `${first.title} — commencer` }),
    )

    await finishLesson(user, true)

    // L'erreur est expliquée, la leçon va quand même au bout : pas de vies.
    const progress = getProgress()
    expect(progress.lessons?.[lessonKey('vi', first.id)]).toBe(1)
    expect(progress.xp).toBe(10)
  })

  it('propose de réviser une fois des mots appris', async () => {
    const user = userEvent.setup()
    render(<App />)
    const review = await screen.findByRole('button', { name: "S'entraîner" })
    expect(review.hasAttribute('disabled')).toBe(true)

    await user.click(
      screen.getByRole('button', { name: `${first.title} — commencer` }),
    )
    await finishLesson(user)
    await user.click(screen.getByRole('button', { name: 'Continuer' }))

    await user.click(await screen.findByRole('button', { name: "S'entraîner" }))
    await finishLesson(user)
    expect(screen.getByText('Révision terminée')).toBeTruthy()
    expect(getProgress().xp).toBe(30)
  })
})
