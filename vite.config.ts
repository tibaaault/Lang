import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `base` doit correspondre au chemin du site GitHub Pages
// (https://<compte>.github.io/<repo>/). Le workflow de déploiement le
// renseigne automatiquement à partir du nom du dépôt.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
})
