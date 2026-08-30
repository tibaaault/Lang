import { describe, expect, it } from 'vitest'
import {
  createCard,
  gradeFromAnswer,
  intervalFor,
  isDue,
  retrievability,
  reviewCard,
} from '../fsrs'
import { checkAnswer, editDistance, normalize } from '../grade'
import { mergeProgress } from '../../store/sync'
import { emptyProgress, type Progress } from '../../store/progress'

describe('FSRS', () => {
  it('espace de plus en plus les révisions réussies', () => {
    let card = createCard(3)
    const intervals: number[] = [intervalFor(card.stability)]
    for (let i = 0; i < 5; i++) {
      // On révise le jour prévu, pas le jour même.
      card = reviewCard(card, 3, new Date(Date.parse(card.due)))
      intervals.push(intervalFor(card.stability))
    }
    for (let i = 1; i < intervals.length; i++) {
      // La croissance est stricte jusqu'au plafond volontaire de deux ans,
      // au-delà duquel la carte est de toute façon acquise.
      if (intervals[i - 1] < 730) {
        expect(intervals[i]).toBeGreaterThan(intervals[i - 1])
      } else {
        expect(intervals[i]).toBe(730)
      }
    }
    expect(intervals[0]).toBeLessThan(7)
  })

  it('rapproche la révision après un oubli', () => {
    let card = createCard(3)
    card = reviewCard(card, 3, new Date(Date.parse(card.due)))
    const before = card.stability
    const lapsed = reviewCard(card, 1, new Date(Date.parse(card.due)))
    expect(lapsed.stability).toBeLessThanOrEqual(before)
    expect(lapsed.lapses).toBe(1)
  })

  it('ne programme jamais une révision dans le passé', () => {
    for (const g of [1, 2, 3, 4] as const) {
      const card = createCard(g)
      expect(Date.parse(card.due)).toBeGreaterThan(Date.now())
      expect(isDue(card)).toBe(false)
    }
  })

  it('donne un intervalle plus long à une réponse immédiate', () => {
    expect(intervalFor(createCard(4).stability)).toBeGreaterThan(
      intervalFor(createCard(2).stability),
    )
  })

  it('fait décroître la probabilité de rappel avec le temps', () => {
    expect(retrievability(0, 10)).toBeCloseTo(1, 5)
    expect(retrievability(10, 10)).toBeLessThan(1)
    expect(retrievability(60, 10)).toBeLessThan(retrievability(10, 10))
  })

  it('déduit une note prudente des réponses fragiles', () => {
    expect(gradeFromAnswer({ correct: false })).toBe(1)
    expect(gradeFromAnswer({ correct: true, fuzzy: true })).toBe(2)
    expect(gradeFromAnswer({ correct: true, usedHint: true })).toBe(2)
    expect(gradeFromAnswer({ correct: true, elapsedMs: 1000 })).toBe(4)
    expect(gradeFromAnswer({ correct: true, elapsedMs: 30000 })).toBe(3)
  })
})

describe('correction des réponses', () => {
  it('ignore casse, accents et ponctuation', () => {
    expect(normalize('  Actually, ')).toBe('actually')
    expect(normalize('Résumé')).toBe('resume')
  })

  it('accepte une faute de frappe sur un mot long', () => {
    const v = checkAnswer('eventualy', ['eventually'])
    expect(v.correct).toBe(true)
    expect(v.fuzzy).toBe(true)
  })

  it("refuse une lettre d'écart sur un mot court, où le sens change", () => {
    expect(checkAnswer('live', ['love']).correct).toBe(false)
  })

  it('explique une erreur anticipée', () => {
    const v = checkAnswer('currently', ['actually'], [
      { word: 'currently', why: 'Currently veut dire actuellement.' },
    ])
    expect(v.correct).toBe(false)
    expect(v.feedback).toContain('actuellement')
  })

  it('accepte toutes les formulations listées', () => {
    expect(checkAnswer('finally', ['eventually', 'finally']).correct).toBe(true)
  })

  it('refuse une réponse vide', () => {
    expect(checkAnswer('   ', ['actually']).correct).toBe(false)
  })

  it('calcule la distance d’édition', () => {
    expect(editDistance('kitten', 'sitting')).toBe(3)
    expect(editDistance('abc', 'abc')).toBe(0)
  })
})

describe('fusion entre appareils', () => {
  function withCard(reviewedAt: string, stability: number): Progress {
    const p = emptyProgress()
    p.cards['en:x'] = {
      stability,
      difficulty: 5,
      reps: 1,
      lapses: 0,
      lastReview: reviewedAt,
      due: reviewedAt,
    }
    p.updatedAt = reviewedAt
    return p
  }

  it('garde la révision la plus récente de chaque mot', () => {
    const local = withCard('2026-03-02T10:00:00Z', 9)
    const remote = withCard('2026-03-01T10:00:00Z', 3)
    expect(mergeProgress(local, remote).cards['en:x'].stability).toBe(9)
    expect(mergeProgress(remote, local).cards['en:x'].stability).toBe(9)
  })

  it('ne perd pas un mot travaillé sur un seul des deux appareils', () => {
    const local = withCard('2026-03-02T10:00:00Z', 9)
    const remote = emptyProgress()
    remote.cards['en:y'] = { ...local.cards['en:x'], stability: 2 }
    const merged = mergeProgress(local, remote)
    expect(Object.keys(merged.cards).sort()).toEqual(['en:x', 'en:y'])
  })

  it('ne compte pas deux fois un même jour déjà synchronisé', () => {
    const local = emptyProgress()
    local.days['2026-03-02'] = { reviews: 20, correct: 18, seconds: 300, newWords: 5 }
    const remote = emptyProgress()
    remote.days['2026-03-02'] = { reviews: 12, correct: 11, seconds: 180, newWords: 3 }
    expect(mergeProgress(local, remote).days['2026-03-02'].reviews).toBe(20)
  })
})

describe('saisie du vietnamien', () => {
  it('accepte une réponse tapée sans tons ni d barré', () => {
    // Aucun clavier français ne permet de saisir « đ » ni les tons : les
    // exiger rendrait tout exercice écrit impossible à réussir.
    expect(checkAnswer('duoc khong', ['được không']).correct).toBe(true)
    expect(checkAnswer('cam on', ['cảm ơn']).correct).toBe(true)
    expect(checkAnswer('di', ['đi']).correct).toBe(true)
    expect(checkAnswer('pho', ['phở']).correct).toBe(true)
    expect(checkAnswer('nguoi', ['người']).correct).toBe(true)
  })

  it('distingue toujours des mots réellement différents', () => {
    // La tolérance porte sur les accents, pas sur les consonnes : « cay »
    // (épicé) et « chay » (végétarien) doivent rester distincts.
    expect(checkAnswer('chay', ['cay']).correct).toBe(false)
    expect(checkAnswer('xa', ['xe']).correct).toBe(false)
  })
})
