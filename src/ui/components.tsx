import type { ReactNode, ButtonHTMLAttributes } from 'react'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'quiet'
}) {
  const styles = {
    primary: 'bg-accent text-paper font-medium',
    ghost: 'border border-line text-ink',
    quiet: 'text-muted',
  }[variant]
  return (
    <button
      // min-h-14 : cible tactile confortable, y compris au pouce sur grand écran.
      className={`min-h-14 rounded-xl px-5 text-base transition-opacity active:opacity-70 disabled:opacity-40 ${styles} ${className}`}
      {...props}
    />
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface p-5 ${className}`}
    >
      {children}
    </div>
  )
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-300"
        style={{ width: `${Math.round(Math.min(Math.max(value, 0), 1) * 100)}%` }}
      />
    </div>
  )
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  )
}

export function Screen({
  title,
  onBack,
  children,
  right,
}: {
  title: string
  onBack?: () => void
  children: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-8">
      <header className="flex items-center gap-3 py-4">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Retour"
            className="-ml-2 flex h-10 w-10 items-center justify-center text-xl text-muted"
          >
            ←
          </button>
        )}
        <h1 className="flex-1 text-lg font-semibold">{title}</h1>
        {right}
      </header>
      {children}
    </div>
  )
}

export type Tab = 'home' | 'stats' | 'account' | 'settings'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'home', icon: '📚', label: 'Apprendre' },
  { id: 'stats', icon: '📈', label: 'Progression' },
  { id: 'account', icon: '👥', label: 'Comptes' },
  { id: 'settings', icon: '⚙️', label: 'Réglages' },
]

/**
 * Barre de navigation, fixée en bas : les quatre écrans de l'application à
 * portée de pouce, où que l'on soit. Elle s'efface pendant une leçon, où
 * rien ne doit distraire ni se toucher par erreur.
 */
export function BottomNav({
  current,
  onGo,
}: {
  current: Tab
  onGo: (tab: Tab) => void
}) {
  return (
    <nav
      aria-label="Navigation"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.id === current
          return (
            <button
              key={tab.id}
              onClick={() => onGo(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs active:opacity-70 ${
                active ? 'font-semibold text-accent' : 'text-muted'
              }`}
            >
              <span aria-hidden className="text-xl leading-none">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function SpeakButton({
  onClick,
  label = 'Écouter',
}: {
  onClick: () => void
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-muted active:opacity-60"
    >
      <span aria-hidden>🔊</span>
      {label}
    </button>
  )
}
