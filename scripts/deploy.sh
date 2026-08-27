#!/usr/bin/env bash
# Déploiement de secours, sans passer par GitHub Actions.
#
# En temps normal, une poussée sur « main » suffit : le workflow construit et
# publie tout seul. Ce script sert quand Actions est indisponible — compte
# bloqué pour facturation, panne GitHub, quota épuisé. Il construit en local et
# pousse le résultat sur la branche « gh-pages », que Pages sait servir
# directement, à condition de basculer la source dans Settings → Pages.
#
# Le dépôt de travail n'est jamais modifié : tout se passe dans un clone
# temporaire.
set -euo pipefail

REPO_URL=$(git remote get-url origin)
REPO_NAME=${REPO_URL##*/}
REPO_NAME=${REPO_NAME%.git}
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

echo "→ Tests"
npm test

echo "→ Construction (base /$REPO_NAME/)"
VITE_BASE="/$REPO_NAME/" npm run build

# GitHub Pages passe les fichiers par Jekyll par défaut, qui ignore les
# dossiers commençant par un tiret bas. Ce fichier désactive ce traitement.
touch dist/.nojekyll
# Pages sert 404.html pour toute URL inconnue : y placer la page principale
# permet aux liens profonds d'ouvrir l'application.
cp dist/index.html dist/404.html

echo "→ Publication sur gh-pages"
cp -R dist/. "$WORK/"
cd "$WORK"
git init -q
git checkout -q -b gh-pages
git add -A
git -c user.name="$(git -C "$OLDPWD" config user.name)" \
    -c user.email="$(git -C "$OLDPWD" config user.email)" \
    commit -q -m "Déploiement du $(date '+%d/%m/%Y à %H:%M')"
git push -q --force "$REPO_URL" gh-pages

echo "→ En ligne sur https://$(basename "$(dirname "$REPO_URL")" | sed 's/.*github.com[:/]//').github.io/$REPO_NAME/"
