// Apparence claire ou sombre.
//
// Par défaut l'application suit le réglage du téléphone. Mais le bon choix
// dépend du lieu plus que de l'heure : en plein soleil, un fond sombre est
// illisible même le soir venu sur un téléphone réglé en sombre. On peut donc
// forcer l'un ou l'autre.
//
// Le choix est propre à l'appareil, pas au compte : on ne veut pas le même
// écran sur un téléphone dehors et sur un ordinateur le soir.

export type Theme = 'auto' | 'light' | 'dark'

const KEY = 'lang.theme'
const PAPER = { light: '#faf9f7', dark: '#131416' }

export function getTheme(): Theme {
  try {
    const stored = localStorage.getItem(KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'auto'
  } catch {
    return 'auto'
  }
}

/** Applique le choix à la page ; `auto` laisse décider le système. */
export function applyTheme(theme = getTheme()) {
  const root = document.documentElement
  if (theme === 'auto') delete root.dataset.theme
  else root.dataset.theme = theme

  // La barre du navigateur prend la couleur du fond, sans quoi un bandeau
  // sombre coiffe une page claire.
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    const scheme = meta.getAttribute('media')?.includes('dark') ? 'dark' : 'light'
    meta.setAttribute('content', PAPER[theme === 'auto' ? scheme : theme])
  }
}

export function setTheme(theme: Theme) {
  try {
    if (theme === 'auto') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {
    // Stockage indisponible : le choix vaut pour cette visite.
  }
  applyTheme(theme)
}
