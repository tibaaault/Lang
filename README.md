# Lang

Application d'apprentissage des langues par répétition espacée, hébergée
gratuitement sur GitHub Pages, avec Supabase pour les comptes et la
synchronisation.

- **Anglais B2+** : faux amis, phrasal verbs, vocabulaire de nuance.
- **Indonésien** : kit de voyage — politesse, marchandage, commander, s'orienter.
- Exercices à trous, production, écoute, choix multiple.
- Planification par **FSRS** : chaque mot revient juste avant d'être oublié.
- Fonctionne **hors-ligne** et s'installe sur l'écran d'accueil.
- **Plusieurs comptes**, chacun avec sa progression privée et une page
  commune où l'on voit les séries de jours de chacun.

## Ce qu'il faut faire une seule fois

### 1. Supabase (comptes et synchronisation)

Lang s'installe dans un **projet Supabase existant**, partagé avec une autre
application. Tout ce qu'il crée vit dans un schéma séparé nommé `lang` : aucune
table, aucune fonction et aucun déclencheur de l'application existante n'est
touché, et l'ensemble se retire d'un seul `drop schema lang cascade`.

1. Ouvrir le projet Supabase, puis **SQL Editor → New query**, coller tout le
   contenu de [`supabase/schema.sql`](supabase/schema.sql), puis **Run**.
2. Aller dans **Project Settings → API** (rubrique *Data API*) et ajouter
   `lang` à la liste **Exposed schemas**, à côté de `public`. Sans cette
   étape, l'API répond `PGRST106` et la synchronisation échoue.
3. Relever sur la même page les deux valeurs `Project URL` et `anon public`.

**Ne pas modifier les réglages d'authentification du projet** : ils sont
communs aux deux applications, et désactiver la confirmation par email pour
Lang l'affaiblirait aussi pour l'autre. Le quota d'emails de l'offre gratuite
(quelques envois par heure) suffit largement à inscrire deux ou trois
personnes. Si la confirmation par email est active, il faut simplement ajouter
l'adresse du site publié dans **Authentication → URL Configuration →
Redirect URLs**.

> Les comptes (`auth.users`) sont communs aux deux applications : une personne
> inscrite sur l'autre pourrait se connecter à Lang avec les mêmes
> identifiants. Elle n'apparaît dans la liste des profils qu'après avoir
> réellement ouvert Lang, et ne voit alors que des pseudos et des totaux.

### 2. GitHub Pages (hébergement)

1. Créer un dépôt **public** (GitHub Pages n'est gratuit que sur un dépôt
   public) et y pousser ce projet.
2. Dans **Settings → Pages**, choisir **Source : GitHub Actions**.
3. Dans **Settings → Secrets and variables → Actions → New repository
   secret**, ajouter les deux secrets :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Chaque poussée sur `main` reconstruit et publie le site automatiquement.

Le site est ensuite servi sur `https://<compte>.github.io/<dépôt>/`.

> La clé `anon` se retrouve dans le code publié : c'est prévu ainsi. Elle
> identifie le projet sans autoriser quoi que ce soit. Ce sont les politiques
> RLS du fichier SQL qui garantissent que chacun ne lit que ses données.

### 3. Installer sur le téléphone

- **iPhone** : ouvrir le site dans Safari → Partager → « Sur l'écran
  d'accueil ».
- **Android** : Chrome propose « Installer l'application ».

## Développer en local

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # tests du moteur de répétition et de la correction
npm run build        # build de production dans dist/
```

Sans fichier `.env.local`, l'application tourne entièrement en local et la
progression est enregistrée dans le navigateur — c'est le mode par défaut,
et il n'exige aucune configuration. Pour tester la
synchronisation, copier `.env.example` en `.env.local` et y mettre les deux
valeurs Supabase.

## Ajouter du contenu

Une unité est un fichier JSON dans [`src/content/`](src/content/). Il suffit
de le déposer et de l'importer dans [`src/content/index.ts`](src/content/index.ts).
Le format est décrit par les types de [`src/types.ts`](src/types.ts) :

- `lexemes` : les mots, avec leur sens, une note d'usage et des exemples.
- `exercises` : `cloze` (phrase à trou), `recall` (production),
  `choice` (choix multiple), `listen` (dictée).

Pour les exercices à trou, `accepted` liste toutes les réponses justes et
`nearMisses` les erreurs plausibles **avec leur explication** — c'est cette
explication qui fait apprendre, davantage que la correction elle-même.

## Organisation du code

| Fichier | Rôle |
| --- | --- |
| `src/engine/fsrs.ts` | Quand revoir chaque mot |
| `src/engine/scheduler.ts` | Quoi réviser, sous quelle forme |
| `src/engine/grade.ts` | Correction des réponses libres |
| `src/store/progress.ts` | Progression locale |
| `src/store/sync.ts` | Comptes et fusion entre appareils |
| `supabase/schema.sql` | Tables et droits, dans le schéma `lang` |
| `src/content/` | Les leçons |
| `src/ui/` | Les écrans |
