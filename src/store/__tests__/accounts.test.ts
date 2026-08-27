// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  activateAccount,
  cardKey,
  courseStats,
  emptyProgress,
  getProgress,
  hasUnclaimedAnonymousProgress,
  recordReview,
  resetProgress,
} from '../progress'
import {
  MASTERED_STABILITY_DAYS,
  createCard,
  reviewCard,
} from '../../engine/fsrs'

function answerOneWord(courseId = 'en', lexemeId = 'w1') {
  recordReview({
    courseId,
    lexemeId,
    card: createCard(3),
    correct: true,
    isNew: true,
    seconds: 5,
    exerciseId: `${lexemeId}.x0`,
  })
}

beforeEach(() => {
  localStorage.clear()
  activateAccount(null)
  resetProgress()
})

describe('cloisonnement des comptes sur un même appareil', () => {
  it('ne donne pas la progression d’un compte à un autre', () => {
    activateAccount('alice')
    answerOneWord()
    expect(Object.keys(getProgress().cards)).toHaveLength(1)

    // Le second compte créé sur le même téléphone doit partir de zéro : c'est
    // le défaut constaté à l'usage, un compte héritant des réponses du premier.
    activateAccount('bob')
    expect(Object.keys(getProgress().cards)).toHaveLength(0)
    expect(getProgress().days).toEqual({})
  })

  it('rend à chaque compte sa progression quand il revient', () => {
    activateAccount('alice')
    answerOneWord('en', 'w1')
    activateAccount('bob')
    answerOneWord('en', 'w2')
    answerOneWord('en', 'w3')

    activateAccount('alice')
    expect(Object.keys(getProgress().cards)).toEqual(['en:w1'])
    activateAccount('bob')
    expect(Object.keys(getProgress().cards).sort()).toEqual(['en:w2', 'en:w3'])
  })

  it('garde les réglages propres à chaque compte', () => {
    activateAccount('alice')
    const alice = getProgress()
    alice.settings.courses = ['en']
    activateAccount('alice')

    activateAccount('bob')
    // Les cours suivis ne doivent pas fuiter d'un compte à l'autre.
    expect(getProgress().settings.courses).toBeUndefined()
  })

  it('revient à l’espace anonyme à la déconnexion', () => {
    activateAccount('alice')
    answerOneWord()
    activateAccount(null)
    expect(Object.keys(getProgress().cards)).toHaveLength(0)
  })
})

describe('reprise de la progression faite sans compte', () => {
  it('ne reprend rien sans demande explicite', () => {
    answerOneWord()
    expect(hasUnclaimedAnonymousProgress()).toBe(true)

    activateAccount('alice')
    expect(Object.keys(getProgress().cards)).toHaveLength(0)
  })

  it('la reprend quand elle est demandée, et une seule fois', () => {
    answerOneWord()
    activateAccount('alice', true)
    expect(Object.keys(getProgress().cards)).toHaveLength(1)

    // Un second compte ne peut plus la réclamer, même en la demandant.
    activateAccount('bob', true)
    expect(Object.keys(getProgress().cards)).toHaveLength(0)
    expect(hasUnclaimedAnonymousProgress()).toBe(false)
  })

  it('ne propose rien quand aucun travail n’a été fait sans compte', () => {
    expect(hasUnclaimedAnonymousProgress()).toBe(false)
    activateAccount('alice', true)
    expect(Object.keys(getProgress().cards)).toHaveLength(0)
  })
})

describe('comptage des mots acquis', () => {
  it("ne compte pas comme acquis un mot vu une seule fois", () => {
    const p = emptyProgress()
    p.cards[cardKey('en', 'w1')] = createCard(3)
    // Une première réponse donne une stabilité de quelques jours seulement :
    // le mot est en cours d'apprentissage, pas acquis.
    expect(courseStats(p, 'en', ['w1'])).toMatchObject({ known: 1, mastered: 0 })
  })

  it("compte comme acquis un mot qui tient trois semaines en mémoire", () => {
    const p = emptyProgress()
    let card = createCard(3)
    // Deuxième réussite, le jour prévu : c'est là que la stabilité franchit
    // le seuil des trois semaines.
    card = reviewCard(card, 3, new Date(Date.parse(card.due)))
    expect(card.stability).toBeGreaterThanOrEqual(MASTERED_STABILITY_DAYS)

    p.cards[cardKey('en', 'w1')] = card
    expect(courseStats(p, 'en', ['w1'])).toMatchObject({ known: 1, mastered: 1 })
  })

  it('ne compte que les mots du cours interrogé', () => {
    const p = emptyProgress()
    p.cards[cardKey('en', 'w1')] = createCard(3)
    p.cards[cardKey('id', 'w1')] = createCard(3)
    expect(courseStats(p, 'en', ['w1']).known).toBe(1)
    expect(courseStats(p, 'en', ['w1', 'w2']).total).toBe(2)
  })
})
