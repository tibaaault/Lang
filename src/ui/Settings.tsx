import { resetProgress, updateSettings, useProgress } from '../store/progress'
import { courses } from '../content'
import { getLastPushedAt, pushNow, useAuth } from '../store/sync'
import { isRemoteEnabled } from '../store/supabase'
import { useState } from 'react'
import { Button, Card, Screen } from './components'

const GOALS = [10, 20, 30, 50]
const NEW_PER_DAY = [4, 8, 12, 20]

export function Settings({ onBack }: { onBack: () => void }) {
  const progress = useProgress()
  const auth = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)

  return (
    <Screen title="Réglages" onBack={onBack}>
      <div className="space-y-5">
        <Card>
          <h2 className="text-sm font-medium">Cours suivis</h2>
          <p className="mt-1 text-xs text-muted">
            Seuls les cours cochés apparaissent sur l'accueil. Un cours trop
            difficile décourage : mieux vaut le masquer que le subir.
          </p>
          <div className="mt-3 space-y-2">
            {courses.map((course) => {
              const followed =
                progress.settings.courses?.includes(course.id) ?? true
              return (
                <button
                  key={course.id}
                  onClick={() => {
                    const current =
                      progress.settings.courses ?? courses.map((c) => c.id)
                    const next = followed
                      ? current.filter((id) => id !== course.id)
                      : [...current, course.id]
                    updateSettings({ courses: next })
                  }}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 text-left text-sm ${
                    followed ? 'border-accent bg-accent-soft' : 'border-line'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
                      followed
                        ? 'border-accent bg-accent text-paper'
                        : 'border-line'
                    }`}
                  >
                    {followed ? '✓' : ''}
                  </span>
                  <span className={followed ? 'text-accent' : ''}>
                    {course.title}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-medium">Objectif quotidien</h2>
          <p className="mt-1 text-xs text-muted">
            Nombre de réponses par session. Vingt tiennent en cinq minutes.
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => updateSettings({ dailyGoal: g })}
                className={`min-h-12 rounded-xl border text-sm ${
                  progress.settings.dailyGoal === g
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-medium">Mots nouveaux par jour</h2>
          <p className="mt-1 text-xs text-muted">
            Chaque mot nouveau engendre des révisions pendant des semaines. En
            introduire trop d'un coup crée une dette qui décourage.
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {NEW_PER_DAY.map((n) => (
              <button
                key={n}
                onClick={() => updateSettings({ newPerDay: n })}
                className={`min-h-12 rounded-xl border text-sm ${
                  progress.settings.newPerDay === n
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </Card>

        {/* Rend visible l'état réel de la sauvegarde : sans cela, une erreur
            de synchronisation passe inaperçue et les réglages semblent ne pas
            s'enregistrer sans qu'on sache pourquoi. */}
        <Card>
          <h2 className="text-sm font-medium">Sauvegarde</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Compte</dt>
              <dd className="text-right">
                {!isRemoteEnabled
                  ? 'non configurée'
                  : (auth.pseudo ?? auth.user?.email ?? 'non connecté')}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">État</dt>
              <dd className="text-right">
                {auth.sync === 'idle' && 'à jour'}
                {auth.sync === 'syncing' && 'en cours…'}
                {auth.sync === 'signed-out' && 'hors ligne (cet appareil seul)'}
                {auth.sync === 'off' && 'désactivée'}
                {auth.sync === 'error' && (
                  <span className="text-wrong">échec</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Réglages enregistrés</dt>
              <dd className="text-right tabular-nums">
                {progress.settings.newPerDay} nouveaux ·{' '}
                {progress.settings.courses
                  ? `${progress.settings.courses.length} cours`
                  : 'tous les cours'}
              </dd>
            </div>
            {saved && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Dernière sauvegarde</dt>
                <dd className="text-right tabular-nums">{saved}</dd>
              </div>
            )}
          </dl>

          {auth.error && (
            <p className="mt-3 rounded-lg bg-wrong-soft p-3 text-xs leading-relaxed text-wrong">
              {auth.error}
            </p>
          )}

          {auth.user && (
            <Button
              variant="ghost"
              className="mt-4 w-full"
              disabled={saving}
              onClick={async () => {
                setSaving(true)
                await pushNow()
                const at = getLastPushedAt()
                setSaved(
                  at
                    ? new Date(at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : 'échec',
                )
                setSaving(false)
              }}
            >
              {saving ? 'Sauvegarde…' : 'Sauvegarder maintenant'}
            </Button>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-medium">Zone sensible</h2>
          <p className="mt-1 text-xs text-muted">
            Efface toute la progression de ce compte, sans retour possible. Si
            vous êtes connecté, la sauvegarde en ligne est effacée aussi.
          </p>
          <Button
            variant="ghost"
            className="mt-3 w-full text-wrong"
            onClick={() => {
              if (
                confirm(
                  'Effacer toute la progression de ce compte, ici comme en ligne ?',
                )
              ) {
                resetProgress()
              }
            }}
          >
            Réinitialiser
          </Button>
        </Card>
      </div>

      {/* Permet de vérifier d'un coup d'œil quelle version tourne réellement
          sur l'appareil, sans quoi un défaut déjà corrigé peut sembler
          persister sur un téléphone qui n'a pas rechargé son code. */}
      <p className="mt-6 text-center text-xs text-muted">
        Version {__APP_VERSION__}
      </p>
    </Screen>
  )
}
