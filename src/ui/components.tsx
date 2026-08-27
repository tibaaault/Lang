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
