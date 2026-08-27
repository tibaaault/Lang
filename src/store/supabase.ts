// Connexion à Supabase.
//
// La clé « publishable » est publique par conception : elle identifie le
// projet, elle n'autorise rien par elle-même. Ce sont les politiques RLS
// écrites dans supabase/schema.sql qui décident qui lit quoi. Elle peut donc
// figurer sans risque dans un dépôt public.
//
// Si les variables ne sont pas renseignées, l'application fonctionne
// entièrement en local : la progression reste alors dans le navigateur.

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isRemoteEnabled = Boolean(url && anonKey)

// Ce projet Supabase héberge aussi une autre application : les tables de Lang
// vivent dans un schéma dédié plutôt que dans « public », où les noms
// « profiles » et « progress » entreraient en collision. Le schéma doit être
// déclaré dans les schémas exposés de l'API du projet.
export const DB_SCHEMA = 'lang'

type Client = Awaited<ReturnType<typeof create>>

async function create() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url!, anonKey!, {
    auth: { persistSession: true, autoRefreshToken: true },
    db: { schema: DB_SCHEMA },
  })
}

let pending: Promise<Client> | null = null

/**
 * Charge la bibliothèque Supabase à la première utilisation seulement.
 *
 * Elle pèse une cinquantaine de kilo-octets compressés, soit plus que tout le
 * reste de l'application. L'importer au démarrage retarderait l'affichage de
 * la première question alors que réviser ne demande aucun réseau : le contenu
 * et la progression sont locaux.
 */
export function getSupabase(): Promise<Client | null> {
  if (!isRemoteEnabled) return Promise.resolve(null)
  pending ??= create()
  return pending
}
