// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'
import { courses } from '../../content'
import { indexCourse } from '../../engine/scheduler'
import { getProgress, resetProgress } from '../../store/progress'

// Les identifiants Supabase sont désormais présents en développement : sans
// ce leurre, chaque test ouvrirait une vraie connexion au projet.
vi.mock('../../store/supabase', () => ({
  getSupabase: () => Promise.resolve(null),
  isRemoteEnabled: false,
  DB_SCHEMA: 'lang',
}))

// La synthèse vocale n'existe pas dans jsdom.
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

describe("parcours complet d'une session", () => {
  it('enchaîne accueil, session et retour, en enregistrant la progression', async () => {
    const user = userEvent.setup()
    render(<App />)

    // L'accueil propose de commencer, avec des mots en attente.
    // Un bouton « Réviser » par cours : on prend celui de l'anglais.
    const start = (await screen.findAllByRole('button', { name: /Réviser/ }))[0]
    await user.click(start)

    // Premier exercice : un mot neuf est présenté avant d'être testé.
    expect(await screen.findByText(/Nouveau mot/)).toBeTruthy()

    // On répond à dix questions, quelle que soit leur forme.
    for (let i = 0; i < 10; i++) {
      const input = screen.queryByPlaceholderText<HTMLInputElement>(
        'Votre réponse',
      )
      if (input) {
        await user.type(input, 'zzz{Enter}')
        // La correction doit rester à l'écran : la frappe qui valide ne doit
        // pas enchaîner sur la question suivante.
        expect(
          screen.queryByRole('button', { name: 'Continuer' }),
        ).not.toBeNull()
      } else {
        // Exercice à choix multiple : on prend la première option.
        const options = screen.getAllByRole('button')
        const choice = options.find(
          (b) => b.className.includes('min-h-14') && b.textContent,
        )
        if (choice) await user.click(choice)
      }
      const next = await screen.findByRole('button', { name: 'Continuer' })
      await user.click(next)
    }

    const progress = getProgress()
    // Le premier jour, la session est plafonnée par le nombre de mots
    // nouveaux autorisés : il n'y a encore rien à réviser.
    const budget = progress.settings.newPerDay
    expect(Object.keys(progress.cards).length).toBe(budget)
    expect(progress.streak.current).toBe(1)

    const day = Object.values(progress.days)[0]
    // Les mots rejoués en fin de session ne sont pas recomptés : sinon une
    // mauvaise réponse gonflerait artificiellement les statistiques.
    expect(day.reviews).toBe(budget)
    expect(day.newWords).toBe(budget)
    // Le test clique la première option des choix multiples, parfois juste :
    // on vérifie seulement la cohérence du total.
    expect(day.correct).toBeLessThanOrEqual(budget)
  }, 30_000)

  it('affiche la bonne réponse et son explication après une erreur', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(
      (await screen.findAllByRole('button', { name: /Réviser/ }))[0],
    )

    const input = document.querySelector<HTMLInputElement>(
      'input[placeholder="Votre réponse"]',
    )
    const options = screen.queryAllByRole('button')
    if (input) {
      await user.type(input, 'zzzzz{Enter}')
      expect(await screen.findByText(/Réponse :/)).toBeTruthy()
    } else {
      const wrong = options.find((b) => b.className.includes('min-h-14'))
      if (wrong) await user.click(wrong)
    }
    expect(await screen.findByRole('button', { name: 'Continuer' })).toBeTruthy()
  }, 20_000)

  it('ouvre la progression et les réglages depuis l’accueil', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Progression' }))
    expect(await screen.findByText('mots acquis')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Retour' }))

    await user.click(await screen.findByRole('button', { name: 'Réglages' }))
    expect(await screen.findByText('Objectif quotidien')).toBeTruthy()
  }, 20_000)

  it('expose chaque cours avec des mots tous couverts par un exercice', () => {
    expect(courses.map((c) => c.id)).toEqual(['en', 'id'])
    for (const course of courses) {
      const index = indexCourse(course)
      expect(index.lexemes.length).toBeGreaterThanOrEqual(20)
      const ids = new Set(index.lexemes.map((l) => l.id))
      for (const lex of index.lexemes) {
        // Un mot sans exercice ne serait jamais proposé en session.
        expect(index.exercisesOf.get(lex.id)?.length ?? 0).toBeGreaterThan(0)
      }
      // Et aucun exercice ne doit pointer vers un mot inexistant.
      for (const unit of course.units) {
        for (const ex of unit.exercises) {
          expect(ids.has(ex.lexemeId)).toBe(true)
        }
      }
    }
  })
})
