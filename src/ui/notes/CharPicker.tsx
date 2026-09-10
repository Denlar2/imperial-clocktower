import { TYPES, charsOfType, getChar, type Script } from '../../data/characters'
import { Select, cx } from '../kit'

/** Single character dropdown grouped by type. */
export function CharSelect({ S, value, onChange, placeholder = '– none –', className, ...rest }: { S: Script; value: string | null; onChange: (v: string | null) => void; placeholder?: string; className?: string; 'aria-label'?: string }) {
  const c = getChar(S, value)
  const evil = c?.type === 'Minion' || c?.type === 'Demon'
  return (
    <Select {...rest} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} className={cx(className, value && (evil ? 'text-evil' : 'text-good'))}>
      <option value="">{placeholder}</option>
      {TYPES.map((t) => (
        <optgroup key={t} label={t}>
          {charsOfType(S, t).map((ch) => <option key={ch.name} value={ch.name}>{ch.name}</option>)}
        </optgroup>
      ))}
    </Select>
  )
}

/** Tap-to-toggle character chips grouped by type. */
export function CharChips({ S, selected, onToggle }: { S: Script; selected: string[]; onToggle: (name: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {TYPES.map((t) => {
        const evil = t === 'Minion' || t === 'Demon'
        return (
          <div key={t}>
            <div className={cx('mb-1 text-xs', evil ? 'text-evil' : 'text-good')}>{t}</div>
            <div className="flex flex-wrap gap-1.5">
              {charsOfType(S, t).map((ch) => {
                const on = selected.includes(ch.name)
                return (
                  <button
                    key={ch.name}
                    type="button"
                    onClick={() => onToggle(ch.name)}
                    aria-pressed={on}
                    className={cx('min-h-9 rounded-full border px-3 text-sm', on ? (evil ? 'border-evil bg-evil/25 text-wax' : 'border-good bg-good/25 text-wax') : 'border-line text-dim')}
                  >
                    {ch.name}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
