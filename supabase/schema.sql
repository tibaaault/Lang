-- ============================================================================
--  Lang — schéma Supabase
--  À coller tel quel dans Supabase → SQL Editor → New query → Run.
--  Le script peut être rejoué sans dommage.
--
--  IMPORTANT — ce projet Supabase héberge aussi une autre application.
--  Tout est donc créé dans un schéma dédié « lang » plutôt que dans « public »,
--  et aucun déclencheur n'est posé sur auth.users. Ainsi rien ici ne peut
--  entrer en collision avec les tables ou les déclencheurs existants, et
--  l'ensemble se retire d'un seul « drop schema lang cascade ».
-- ============================================================================

create schema if not exists lang;

-- PostgREST, qui sert l'API, doit pouvoir traverser le schéma. Les droits
-- larges accordés ici ne donnent aucun accès par eux-mêmes : ce sont les
-- politiques RLS définies plus bas qui décident, ligne par ligne.
grant usage on schema lang to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
--  lang.profiles : la partie visible par les autres comptes.
--  Volontairement pauvre : un pseudo et des totaux. Jamais le détail de ce
--  qui est su, raté ou en cours d'apprentissage.
-- ----------------------------------------------------------------------------
create table if not exists lang.profiles (
  id          uuid primary key references auth.users on delete cascade,
  pseudo      text not null check (char_length(pseudo) between 2 and 24),
  streak      integer not null default 0,
  mastered    integer not null default 0,
  reviews_7d  integer not null default 0,
  last_active date,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
--  lang.progress : la progression complète, strictement privée.
--  Stockée en JSON : le format est décrit par l'interface Progress côté
--  application, et évolue sans migration de base.
-- ----------------------------------------------------------------------------
create table if not exists lang.progress (
  user_id    uuid primary key references auth.users on delete cascade,
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on lang.profiles to authenticated;
grant select, insert, update, delete on lang.progress to authenticated;

alter table lang.profiles enable row level security;
alter table lang.progress enable row level security;

-- --- Politiques : profils ---------------------------------------------------
-- Lecture ouverte aux comptes connectés : c'est ce qui permet de voir la série
-- de jours des autres. Écriture limitée à sa propre ligne.
--
-- À noter : les comptes sont communs aux deux applications du projet. Une
-- personne inscrite sur l'autre application pourrait donc lire cette table,
-- mais elle n'y verra que des pseudos et des totaux d'apprentissage, et elle
-- n'y figurera elle-même qu'après avoir ouvert Lang au moins une fois.
drop policy if exists "lang profils lisibles par les comptes connectés" on lang.profiles;
create policy "lang profils lisibles par les comptes connectés"
  on lang.profiles for select
  to authenticated
  using (true);

drop policy if exists "lang chacun crée son profil" on lang.profiles;
create policy "lang chacun crée son profil"
  on lang.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "lang chacun modifie son profil" on lang.profiles;
create policy "lang chacun modifie son profil"
  on lang.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- --- Politiques : progression ------------------------------------------------
-- Aucune lecture croisée possible, y compris entre comptes connectés.
drop policy if exists "lang progression strictement privée" on lang.progress;
create policy "lang progression strictement privée"
  on lang.progress for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
--  Horodatage automatique des écritures de progression.
--  Ce déclencheur ne porte que sur une table de ce schéma : il n'interfère
--  avec rien d'autre dans le projet.
-- ----------------------------------------------------------------------------
create or replace function lang.touch_progress()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lang_progress_touch on lang.progress;
create trigger lang_progress_touch
  before insert or update on lang.progress
  for each row execute function lang.touch_progress();

-- ============================================================================
--  Pour tout retirer un jour, sans laisser de trace dans le projet :
--     drop schema lang cascade;
-- ============================================================================
