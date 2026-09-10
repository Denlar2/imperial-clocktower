import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { navigate } from '../lib/router'

export const DISCLAIMER = 'Unofficial fan-made tool. Not affiliated with The Pandemonium Institute.'

export function cx(...a: (string | false | null | undefined)[]) { return a.filter(Boolean).join(' ') }

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'default'; big?: boolean }
export function Button({ variant = 'default', big, className, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl border px-4 font-semibold transition active:scale-[.98] disabled:opacity-40 disabled:active:scale-100',
        big ? 'min-h-14 text-lg' : 'min-h-11',
        variant === 'primary' && 'border-candle bg-candle text-night',
        variant === 'default' && 'border-line bg-dusk text-wax',
        variant === 'ghost' && 'border-transparent bg-transparent text-candle',
        variant === 'danger' && 'border-evil/60 bg-transparent text-evil',
        className,
      )}
    />
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx('min-h-12 w-full rounded-xl border border-line bg-dusk px-3 text-wax placeholder:text-dim/70 focus:border-candle focus:outline-none', props.className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={cx('min-h-12 w-full rounded-xl border border-line bg-dusk pr-9 pl-3 text-wax focus:border-candle focus:outline-none', props.className)} />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-dim">▾</span>
    </div>
  )
}

export function Card({ children, className, warn }: { children: ReactNode; className?: string; warn?: boolean }) {
  return <div className={cx('rounded-2xl border bg-dusk p-3', warn ? 'border-evil' : 'border-line', className)}>{children}</div>
}

export function Chip({ on, bad, children, onClick }: { on?: boolean; bad?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cx(
        'min-h-9 rounded-full border px-3 text-sm transition active:scale-95',
        on ? (bad ? 'border-evil bg-evil/25 text-wax' : 'border-candle bg-candle/20 text-candle') : 'border-line bg-transparent text-dim',
      )}
    >
      {children}
    </button>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="mb-1 text-sm text-dim">{children}</div>
}

export function Page({ title, back, right, children, nav }: { title?: ReactNode; back?: string | (() => void); right?: ReactNode; children: ReactNode; nav?: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      {(title || back) && (
        <header className="safe-t sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-night/95 px-3 py-2 backdrop-blur">
          {back && (
            <button type="button" aria-label="Back" onClick={() => (typeof back === 'string' ? navigate(back) : back())} className="min-h-11 min-w-11 rounded-xl text-xl text-candle">
              ‹
            </button>
          )}
          <h1 className="flex-1 truncate text-2xl">{title}</h1>
          {right}
        </header>
      )}
      <main className={cx('flex-1 px-4 pt-4', nav ? 'pb-28' : 'pb-8')}>{children}</main>
      {nav}
    </div>
  )
}

export function Footer() {
  return <p className="mt-10 text-center text-xs text-dim/80">{DISCLAIMER}</p>
}

export function BottomNav({ items, current, onChange }: { items: { id: string; label: string; badge?: string | number }[]; current: string; onChange: (id: string) => void }) {
  return (
    <nav className="safe-b fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-dusk">
      <div className="mx-auto flex w-full max-w-xl">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={cx('display relative flex-1 py-3.5 text-lg', current === it.id ? '-mt-px border-t-2 border-candle text-candle' : 'text-dim')}
          >
            {it.label}
            {it.badge != null && it.badge !== 0 && <span className="absolute top-2 right-3 rounded-full bg-evil px-1.5 text-xs text-wax">{it.badge}</span>}
          </button>
        ))}
      </div>
    </nav>
  )
}

export function Banner({ kind = 'error', children }: { kind?: 'error' | 'info'; children: ReactNode }) {
  return <div className={cx('mb-3 rounded-xl border px-3 py-2 text-sm', kind === 'error' ? 'border-evil/60 bg-evil/15 text-wax' : 'border-candle/50 bg-candle/10 text-wax')}>{children}</div>
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="py-12 text-center text-dim">{children}</div>
}

/** Short-lived message. */
export function useToast(): [string | null, (m: string) => void] {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    if (!msg) return
    const t = window.setTimeout(() => setMsg(null), 2200)
    return () => window.clearTimeout(t)
  }, [msg])
  return [msg, setMsg]
}
export function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null
  return <div className="fade-in pointer-events-none fixed bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full bg-wax px-4 py-2 text-sm font-semibold text-night shadow-lg">{msg}</div>
}

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true } catch { return false }
}

export const alignClass = (evil: boolean) => (evil ? 'text-evil' : 'text-good')
