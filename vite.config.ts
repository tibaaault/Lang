import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Version affichée dans les réglages. Sans elle, impossible de savoir quelle
// version tourne réellement sur un téléphone : une application installée sur
// l'écran d'accueil garde son code en mémoire pendant des jours, et un défaut
// déjà corrigé semble persister.
function buildVersion(): string {
  const date = new Date().toISOString().slice(0, 16).replace('T', ' ')
  try {
    const sha = execSync('git rev-parse --short HEAD').toString().trim()
    return `${date} · ${sha}`
  } catch {
    return date
  }
}

// `base` doit correspondre au chemin du site GitHub Pages
// (https://<compte>.github.io/<repo>/). Le workflow de déploiement le
// renseigne automatiquement à partir du nom du dépôt.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  define: { __APP_VERSION__: JSON.stringify(buildVersion()) },
  plugins: [react(), tailwindcss()],
})
