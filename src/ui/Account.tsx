import { useEffect, useState } from 'react'
import { hasUnclaimedAnonymousProgress } from '../store/progress'
import { isRemoteEnabled } from '../store/supabase'
import {
  fetchProfiles,
  signIn,
  signOut,
  signUp,
  useAuth,
  type PublicProfile,
} from '../store/sync'
import { Button, Card, Screen } from './components'

export function Account({
  onBack,
  gate = false,
  onContinueOffline,
}: {
  onBack?: () => void
  /** Écran d'entrée : on ne peut pas le quitter sans choisir. */
  gate?: boolean
  onContinueOffline?: () => void
}) {
  const auth = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Proposé uniquement s'il y a du travail fait sans compte sur cet appareil,
  // et qu'aucun compte ne l'a déjà repris.
  const [canAdopt] = useState(hasUnclaimedAnonymousProgress)
  const [adoptLocal, setAdoptLocal] = useState(false)
  const [profiles, setProfiles] = useState<PublicProfile[]>([])

  useEffect(() => {
    if (auth.user) void fetchProfiles().then(setProfiles)
  }, [auth.user, auth.sync])

  if (!isRemoteEnabled) {
    return (
      <Screen title="Comptes" onBack={onBack}>
        <Card>
          <p className="text-sm leading-relaxed text-muted">
            La synchronisation n'est pas encore configurée. Votre progression
            est enregistrée sur cet appareil uniquement : elle survit à la
            fermeture de l'application, mais pas à un changement de téléphone.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Une fois les clés Supabase renseignées, chacun pourra créer son
            compte et retrouver sa progression sur n'importe quel appareil.
          </p>
        </Card>
      </Screen>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'signup') {
        if (pseudo.trim().length < 2) {
          throw new Error('Choisissez un pseudo d’au moins deux lettres.')
        }
        await signUp(email.trim(), password, pseudo.trim(), adoptLocal)
      } else {
        await signIn(email.trim(), password, adoptLocal)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.')
    } finally {
      setBusy(false)
    }
  }

  if (!auth.user) {
    return (
      <Screen title={gate ? 'Connexion' : 'Comptes'} onBack={onBack}>
        {gate && (
          <p className="mb-4 px-1 text-sm leading-relaxed text-muted">
            Connectez-vous avant de réviser : sans compte, la progression reste
            sur cet appareil et n'est comptée nulle part. C'est ce qui fait
            perdre une série sans s'en apercevoir.
          </p>
        )}
        <Card>
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-lg py-2 text-sm ${mode === 'signin' ? 'bg-accent-soft text-accent' : 'text-muted'}`}
            >
              Se connecter
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-lg py-2 text-sm ${mode === 'signup' ? 'bg-accent-soft text-accent' : 'text-muted'}`}
            >
              Créer un compte
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Pseudo (visible par les autres)"
                autoComplete="nickname"
                className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 outline-none focus:border-accent"
              />
            )}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="Adresse email"
              autoComplete="email"
              autoCapitalize="none"
              className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 outline-none focus:border-accent"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={6}
              placeholder="Mot de passe (6 caractères minimum)"
              autoComplete={
                mode === 'signup' ? 'new-password' : 'current-password'
              }
              className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 outline-none focus:border-accent"
            />
            {canAdopt && (
              <button
                type="button"
                onClick={() => setAdoptLocal((v) => !v)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm ${
                  adoptLocal ? 'border-accent bg-accent-soft' : 'border-line'
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
                    adoptLocal
                      ? 'border-accent bg-accent text-paper'
                      : 'border-line'
                  }`}
                >
                  {adoptLocal ? '✓' : ''}
                </span>
                <span>
                  {mode === 'signup'
                    ? 'Reprendre la progression déjà faite sur cet appareil'
                    : 'Rattacher le travail fait sans être connecté'}
                  <span className="mt-0.5 block text-xs text-muted">
                    À cocher seulement si c'est vous qui l'avez fait. Un compte
                    créé pour quelqu'un d'autre doit partir de zéro.
                  </span>
                </span>
              </button>
            )}

            {error && <p className="text-sm text-wrong">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy
                ? 'Un instant…'
                : mode === 'signup'
                  ? 'Créer le compte'
                  : 'Se connecter'}
            </Button>
          </form>
        </Card>

        <p className="mt-4 px-1 text-xs leading-relaxed text-muted">
          Chaque compte a sa propre progression et ses propres réglages, y
          compris sur un appareil partagé. Seuls le pseudo, la série de jours et
          le nombre de mots acquis sont visibles des autres.
        </p>

        {gate && onContinueOffline && (
          <button
            onClick={onContinueOffline}
            className="mt-6 w-full py-3 text-center text-sm text-muted underline underline-offset-4"
          >
            Continuer sans compte, sur cet appareil seulement
          </button>
        )}
      </Screen>
    )
  }

  return (
    <Screen title="Comptes" onBack={onBack}>
      <Card className="mb-5">
        <p className="text-sm text-muted">Connecté en tant que</p>
        <p className="mt-0.5 font-serif text-xl">
          {auth.pseudo ?? auth.user.email}
        </p>
        <p className="mt-2 text-xs text-muted">
          {auth.sync === 'syncing' && 'Synchronisation en cours…'}
          {auth.sync === 'idle' && 'Progression sauvegardée'}
          {auth.sync === 'error' && `Erreur de synchronisation : ${auth.error}`}
        </p>
        <Button
          variant="ghost"
          className="mt-4 w-full"
          onClick={() => void signOut()}
        >
          Se déconnecter
        </Button>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-medium">Tout le monde</h2>
        {profiles.length === 0 ? (
          <p className="text-sm text-muted">Personne d'autre pour l'instant.</p>
        ) : (
          <ul className="divide-y divide-line">
            {profiles.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate">
                    {p.pseudo}
                    {p.id === auth.user?.id && (
                      <span className="ml-2 text-xs text-muted">vous</span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {p.mastered} mots acquis · {p.reviews7d} réponses cette
                    semaine
                  </p>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-accent">
                  {p.streak} j
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Screen>
  )
}
