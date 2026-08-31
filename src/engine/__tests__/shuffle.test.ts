import { describe, expect, it } from 'vitest'
import { shuffle } from '../shuffle'
import { courses } from '../../content'

describe('mélange des options', () => {
  it('conserve exactement les mêmes éléments', () => {
    const items = ['a', 'b', 'c', 'd']
    for (let i = 0; i < 50; i++) {
      expect([...shuffle(items)].sort()).toEqual(items)
    }
    expect(items).toEqual(['a', 'b', 'c', 'd'])
  })

  it('ne laisse pas le premier élément en tête', () => {
    // Sur cinquante tirages, la probabilité que « a » reste en première
    // position à chaque fois est d'une sur 10^15 : un échec ici signale un
    // mélange qui ne mélange rien.
    const positions = new Set<number>()
    for (let i = 0; i < 50; i++) {
      positions.add(shuffle(['a', 'b', 'c', 'd']).indexOf('a'))
    }
    expect(positions.size).toBeGreaterThan(1)
  })
})

describe('biais de position dans le contenu', () => {
  it('documente que les données placent la bonne réponse en tête', () => {
    // Le contenu est écrit à la main, réponse en premier : c'est l'affichage
    // qui rétablit le hasard, et ce test rappelle pourquoi il est nécessaire.
    let first = 0
    let total = 0
    for (const course of courses) {
      for (const unit of course.units) {
        for (const ex of unit.exercises) {
          if (ex.kind !== 'choice') continue
          total++
          if (ex.options[0] === ex.answer) first++
        }
      }
    }
    expect(total).toBeGreaterThan(100)
    // Sans mélange à l'affichage, choisir la première option suffirait très
    // souvent : c'est précisément le défaut signalé à l'usage.
    expect(first / total).toBeGreaterThan(0.2)
  })
})
