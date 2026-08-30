// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Lexicon } from '../Lexicon'
import { courseById } from '../../content'
import { cardKey, getProgress, resetProgress } from '../../store/progress'
import { createCard, reviewCard } from '../../engine/fsrs'

vi.mock('../../store/supabase', () => ({
  getSupabase: () => Promise.resolve(null),
  isRemoteEnabled: false,
  DB_SCHEMA: 'lang',
}))

const indonesian = courseById('id')!

beforeEach(() => {
  vi.stubGlobal('speechSynthesis', {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: () => [],
    addEventListener: vi.fn(),
  })
  vi.stubGlobal('SpeechSynthesisUtterance', class {})
  localStorage.clear()
  resetProgress()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('lexique', () => {
  it('liste tout le contenu du cours sans rien demander', () => {
    render(<Lexicon course={indonesian} onBack={() => {}} />)

    expect(screen.getByText('terima kasih')).toBeTruthy()
    expect(screen.getByText('merci')).toBeTruthy()
    // Aucun exercice : c'est un écran de lecture.
    expect(screen.queryByPlaceholderText('Votre réponse')).toBeNull()
    expect(screen.getByText(/50 entrées/)).toBeTruthy()
  })

  it('cherche aussi bien par le mot que par son sens français', async () => {
    const user = userEvent.setup()
    render(<Lexicon course={indonesian} onBack={() => {}} />)
    const search = screen.getByPlaceholderText('Rechercher un mot ou son sens')

    await user.type(search, 'merci')
    expect(screen.getByText('terima kasih')).toBeTruthy()
    expect(screen.queryByText('berapa')).toBeNull()

    await user.clear(search)
    // La recherche ignore les accents, comme la correction des réponses.
    await user.type(search, 'epice')
    expect(screen.getByText('pedas')).toBeTruthy()
  })

  it('déplie une entrée pour montrer la note et les exemples', async () => {
    const user = userEvent.setup()
    render(<Lexicon course={indonesian} onBack={() => {}} />)

    expect(screen.queryByText(/Pas de souci/)).toBeNull()
    await user.click(screen.getByText('terima kasih'))
    expect(screen.getByText(/sama-sama/)).toBeTruthy()
    expect(screen.getByText('Terima kasih banyak!')).toBeTruthy()
  })

  it('montre où en est chaque mot', async () => {
    const p = getProgress()
    let card = createCard(3)
    card = reviewCard(card, 3, new Date(Date.parse(card.due)))
    p.cards[cardKey('id', 'id.pm.terima-kasih')] = card

    const user = userEvent.setup()
    render(<Lexicon course={indonesian} onBack={() => {}} />)
    await user.click(screen.getByText('terima kasih'))
    expect(screen.getByText('acquis')).toBeTruthy()
  })

  it('se limite à une unité quand on en choisit une', async () => {
    const user = userEvent.setup()
    render(<Lexicon course={indonesian} onBack={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Premiers mots' }))
    expect(screen.getByText('terima kasih')).toBeTruthy()
    expect(screen.queryByText('berapa')).toBeNull()
  })
})
