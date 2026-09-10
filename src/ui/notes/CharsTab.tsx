import { COMP, TYPES, charsOfType, type Script } from '../../data/characters'
import { claimants, type CharStatus, type Notebook } from '../../notes/model'
import { Card, cx } from '../kit'

type Set = (fn: (n: Notebook) => Notebook) => void
const NEXT: Record<CharStatus, CharStatus> = { none: 'confirmed', confirmed: 'out', out: 'none' }

/** Every character in the script: who claims it, and your verdict (tap: confirmed → ruled out → clear). */
export default function CharsTab({ nb, setNb, S }: { nb: Notebook; setNb: Set; S: Script }) {
  const comp = COMP[nb.players.length]
  const claimedByType = TYPES.map((t) => nb.players.filter((p) => p.claim && charsOfType(S, t).some((c) => c.name === p.claim)).length)
  const dupes = S.characters.filter((c) => claimants(nb, c.name).length > 1).map((c) => c.name)
  return (
    <>
      {comp && (
        <Card className="mb-3 text-sm text-dim">
          <div className="font-semibold text-wax">Claims vs. the set-up table</div>
          {TYPES.map((t, i) => (
            <div key={t} className={cx(claimedByType[i] > comp[i] && (t === 'Townsfolk' || t === 'Outsider') && 'text-evil')}>
              {t}: <b className="text-wax">{claimedByType[i]}</b> claimed of {comp[i]} expected{t === 'Outsider' ? ' (before modifiers)' : ''}
            </div>
          ))}
          {dupes.length > 0 && <div className="mt-1 text-evil">Double claims: {dupes.join(', ')} — someone is lying.</div>}
          <div className="mt-1 text-xs">Tap a character: ✓ confirmed → ✗ ruled out → clear.</div>
        </Card>
      )}
      {TYPES.map((t) => (
        <section key={t} className="mb-4">
          <h2 className={cx('mb-1 text-xl', t === 'Minion' || t === 'Demon' ? 'text-evil' : 'text-good')}>{t}</h2>
          <div className="flex flex-col gap-1">
            {charsOfType(S, t).map((c) => {
              const st = nb.chars[c.name] ?? 'none'
              const who = claimants(nb, c.name)
              const mine = nb.myRole === c.name
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setNb((n) => ({ ...n, chars: { ...n.chars, [c.name]: NEXT[st] } }))}
                  className={cx('flex min-h-11 items-center gap-2 rounded-xl border px-3 text-left', st === 'confirmed' ? 'border-good/60 bg-good/10' : st === 'out' ? 'border-line opacity-50' : 'border-line bg-dusk')}
                >
                  <span className={cx('w-5 text-center', st === 'confirmed' ? 'text-good' : st === 'out' ? 'text-evil' : 'text-dim')}>{st === 'confirmed' ? '✓' : st === 'out' ? '✗' : '·'}</span>
                  <span className={cx('display flex-1', st === 'out' && 'line-through')}>{c.name}</span>
                  <span className={cx('truncate text-sm', who.length > 1 ? 'text-evil' : 'text-dim')}>
                    {mine ? 'you' : who.map((p) => p.name + (p.dead ? ' †' : '')).join(', ')}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}
