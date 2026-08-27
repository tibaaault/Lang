// Connexion à Supabase.
//
// La clé « anon » est publique par conception : elle identifie le projet, elle
// n'autorise rien par elle-même. Ce sont les politiques RLS écrites dans
// supabase/schema.sql qui décident qui lit quoi. Elle peut donc figurer sans
// risque dans un dépôt public.
//
// Si les variables ne sont pas renseignées, l'application fonctionne
// entièrement en local : c'est le mode par défaut au premier lancement.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isRemoteEnabled = Boolean(url && anonKey)

// Ce projet Supabase héberge aussi une autre application : les tables de Lang
// vivent dans un schéma dédié plutôt que dans « public », où les noms
// « profiles » et « progress » risqueraient d'entrer en collision.
// Le schéma doit être déclaré dans les schémas exposés de l'API du projet.
export const DB_SCHEMA = 'lang'

// Le type du client est laissé à l'inférence : il porte le nom du schéma,
// qu'une annotation explicite ramènerait à « public ».
function createIfConfigured() {
  if (!url || !anonKey) return null
  return createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
    db: { schema: DB_SCHEMA },
  })
}

export const supabase = createIfConfigured()
