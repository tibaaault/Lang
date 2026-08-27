// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  activateAccount,
  emptyProgress,
  getProgress,
  updateSettings,
  type Progress,
} from '../progress'
import { mergeProgress } from '../sync'

beforeEach(() => {
  localStorage.clear()
  activateAccount(null)
})

describe('persistance des réglages', () => {
  it('les écrit dans le stockage du compte actif', () => {
    activateAccount('alice')
    updateSettings({ courses: ['en'], newPerDay: 12, dailyGoal: 30 })

    const raw = localStorage.getItem('lang.progress.v1.alice')
    expect(raw).not.toBeNull()
    const stored = JSON.parse(raw!) as Progress
    expect(stored.settings.courses).toEqual(['en'])
    expect(stored.settings.newPerDay).toBe(12)
  })

  it('les retrouve après un retour sur le compte', () => {
    activateAccount('alice')
    updateSettings({ courses: ['en'], newPerDay: 12 })

    // Rechargement de l'application : on repart de l'espace anonyme, puis la
    // session est restaurée et bascule sur le compte.
    activateAccount(null)
    activateAccount('alice')

    expect(getProgress().settings.courses).toEqual(['en'])
    expect(getProgress().settings.newPerDay).toBe(12)
  })

  it('ne mélange pas les réglages de deux comptes', () => {
    activateAccount('alice')
    updateSettings({ courses: ['en'], newPerDay: 12 })
    activateAccount('bob')
    updateSettings({ courses: ['en-basics'], newPerDay: 4 })

    activateAccount('alice')
    expect(getProgress().settings.courses).toEqual(['en'])
    expect(getProgress().settings.newPerDay).toBe(12)
  })
})

describe('réglages et synchronisation', () => {
  function withSettings(
    settings: Partial<Progress['settings']>,
    updatedAt: string,
  ): Progress {
    const p = emptyProgress()
    p.settings = { ...p.settings, ...settings }
    p.updatedAt = updatedAt
    return p
  }

  it('garde les réglages locaux quand ils sont les plus récents', () => {
    const local = withSettings(
      { courses: ['en'], newPerDay: 12 },
      '2026-03-02T10:00:00Z',
    )
    const remote = withSettings({}, '2026-03-01T10:00:00Z')
    const merged = mergeProgress(local, remote)
    expect(merged.settings.courses).toEqual(['en'])
    expect(merged.settings.newPerDay).toBe(12)
  })

  it('reprend les réglages distants quand ce sont eux les plus récents', () => {
    const local = withSettings({}, '2026-03-01T10:00:00Z')
    const remote = withSettings(
      { courses: ['id'], newPerDay: 20 },
      '2026-03-02T10:00:00Z',
    )
    const merged = mergeProgress(local, remote)
    expect(merged.settings.courses).toEqual(['id'])
    expect(merged.settings.newPerDay).toBe(20)
  })

  it("ne perd pas des réglages changés hors ligne, à horodatage égal", () => {
    // Cas courant sur téléphone : le réglage est modifié puis l'application
    // est fermée avant que la sauvegarde en ligne ne parte.
    const stamp = '2026-03-02T10:00:00Z'
    const local = withSettings({ courses: ['en'], newPerDay: 12 }, stamp)
    const remote = withSettings({}, stamp)
    const merged = mergeProgress(local, remote)
    expect(merged.settings.courses).toEqual(['en'])
  })
})
