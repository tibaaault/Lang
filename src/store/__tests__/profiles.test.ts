import { describe, expect, it, vi } from 'vitest'

vi.mock('../supabase', () => ({
  getSupabase: () => Promise.resolve(null),
  isRemoteEnabled: false,
  DB_SCHEMA: 'lang',
}))

import { currentProfile, type PublicProfile } from '../sync'

const now = new Date(2026, 10, 10, 15, 0)
const profile = (lastActive: string | null): PublicProfile => ({
  id: 'u',
  pseudo: 'Léa',
  streak: 5,
  mastered: 12,
  reviews7d: 80,
  lastActive,
})

describe('profils des autres comptes', () => {
  it("garde les totaux de qui a travaillé aujourd'hui ou hier", () => {
    expect(currentProfile(profile('2026-11-10'), now)).toMatchObject({ streak: 5, reviews7d: 80 })
    expect(currentProfile(profile('2026-11-09'), now)).toMatchObject({ streak: 5, reviews7d: 80 })
  })

  it('rompt la série dès deux jours sans activité', () => {
    const p = currentProfile(profile('2026-11-08'), now)
    expect(p.streak).toBe(0)
    // Les réponses, elles, datent encore de la semaine.
    expect(p.reviews7d).toBe(80)
  })

  it("n'affiche plus de réponses « cette semaine » après sept jours d'absence", () => {
    expect(currentProfile(profile('2026-11-04'), now).reviews7d).toBe(80)
    expect(currentProfile(profile('2026-11-03'), now)).toMatchObject({ streak: 0, reviews7d: 0 })
    expect(currentProfile(profile('2026-09-01'), now)).toMatchObject({ streak: 0, reviews7d: 0 })
  })

  it('tient pour absent un compte sans activité connue', () => {
    expect(currentProfile(profile(null), now)).toMatchObject({ streak: 0, reviews7d: 0 })
  })

  it('ne touche pas aux mots acquis, qui ne périment pas', () => {
    expect(currentProfile(profile('2026-01-01'), now).mastered).toBe(12)
  })
})
