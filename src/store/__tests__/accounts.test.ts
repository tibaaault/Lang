// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  activateAccount,
  getProgress,
  hasUnclaimedAnonymousProgress,
  recordReview,
  resetProgress,
} from '../progress'
import { createCard } from '../../engine/fsrs'

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
