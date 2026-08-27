import { resetProgress, updateSettings, useProgress } from '../store/progress'
import { Button, Card, Screen } from './components'

const GOALS = [10, 20, 30, 50]
const NEW_PER_DAY = [4, 8, 12, 20]

export function Settings({ onBack }: { onBack: () => void }) {
  const progress = useProgress()

  return (
    <Screen title="Réglages" onBack={onBack}>
      <div className="space-y-5">
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

        <Card>
          <h2 className="text-sm font-medium">Zone sensible</h2>
          <p className="mt-1 text-xs text-muted">
            Efface toute la progression de cet appareil, sans retour possible.
          </p>
          <Button
            variant="ghost"
            className="mt-3 w-full text-wrong"
            onClick={() => {
              if (
                confirm(
                  'Effacer toute la progression enregistrée sur cet appareil ?',
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
    </Screen>
  )
}
