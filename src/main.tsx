import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service worker : l'application se lance et fonctionne sans réseau une fois
// visitée. C'est ce qui la rend utilisable dans le métro ou à l'étranger sans
// forfait de données.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    const registration = await navigator.serviceWorker.register(
      `${import.meta.env.BASE_URL}sw.js`,
    )

    // Une application installée sur l'écran d'accueil d'un iPhone n'est pas
    // rechargée quand on la rouvre : elle reprend là où elle en était, avec le
    // code qu'elle avait en mémoire. Sans cette vérification au retour au
    // premier plan, une correction déployée peut mettre des jours à parvenir
    // jusqu'à l'utilisateur, qui continue d'observer un défaut déjà réparé.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void registration.update()
    })

    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return
      reloading = true
      // La progression est écrite à chaque réponse : un rechargement ne perd
      // au pire que la question affichée.
      window.location.reload()
    })
  })
}
