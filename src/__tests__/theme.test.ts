// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { applyTheme, getTheme, setTheme } from '../theme'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  document.head.innerHTML =
    '<meta name="theme-color" content="x" media="(prefers-color-scheme: light)">' +
    '<meta name="theme-color" content="x" media="(prefers-color-scheme: dark)">'
})

const bars = () =>
  [...document.querySelectorAll('meta[name="theme-color"]')].map((m) =>
    m.getAttribute('content'),
  )

describe('apparence', () => {
  it('suit le système tant que rien n’est choisi', () => {
    expect(getTheme()).toBe('auto')
    applyTheme()
    expect(document.documentElement.dataset.theme).toBeUndefined()
    // Chaque barre garde la couleur de son propre mode.
    expect(bars()).toEqual(['#faf9f7', '#131416'])
  })

  it('force le clair, y compris sur un téléphone réglé en sombre', () => {
    setTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(bars()).toEqual(['#faf9f7', '#faf9f7'])
    // Le choix tient au prochain lancement.
    expect(getTheme()).toBe('light')
  })

  it('force le sombre, puis revient au réglage du système', () => {
    setTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(bars()).toEqual(['#131416', '#131416'])
    setTheme('auto')
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(getTheme()).toBe('auto')
  })
})
