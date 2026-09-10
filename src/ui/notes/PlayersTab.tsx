import { useState } from 'react'
import { getChar, type Script } from '../../data/characters'
import { nameOf, voteHistory, type Align, type NotePlayer, type Notebook } from '../../notes/model'
import { Chip, cx } from '../kit'
import { CharChips, CharSelect } from './CharPicker'

type Set = (fn: (n: Notebook) => Notebook) => void
const ALIGN: { v: Align; label: string }[] = [{ v: 'unknown', label: '?' }, { v: 'good', label: 'Good' }, { v: 'evil', label: 'Evil' }]

export default function PlayersTab({ nb, setNb, S }: { nb: Notebook; setNb: Set; S: Script }) {
  const [open, setOpen] = useState<string | null>(null)
  const [picking, setPicking] = useState<string | null>(null)
  const votes = voteHistory(nb)
  const setP = (id: string, fn: (p: NotePlayer) => NotePlayer) => setNb((n) => ({ ...n, players: n.players.map((p) => (p.id === id ? fn(p) : p)) }))
  const alive = nb.players.filter((p) => !p.dead).length
  const evil = nb.players.filter((p) => p.align === 'evil' && !p.dead).length

  return (
    <>
      <div className="mb-3 text-center text-sm text-dim">
        <b className="text-wax">{alive}</b> alive · <b className="text-evil">{evil}</b> you think evil · <b className="text-wax">{nb.players.length - alive}</b> dead
      </div>
      <div className="flex flex-col gap-2">
        {nb.players.map((p, i) => {
          const isMe = p.id === nb.me
          const expanded = open === p.id
          const claim = getChar(S, p.claim)
          const hist = votes[p.id] ?? []
          return (
            <div key={p.id} className={cx('rounded-2xl border bg-dusk', p.align === 'evil' ? 'border-evil/60' : p.align === 'good' ? 'border-good/50' : 'border-line', p.dead && 'opacity-70')}>
              <button type="button" className="flex w-full items-center gap-2 p-3 text-left" onClick={() => setOpen(expanded ? null : p.id)} aria-expanded={expanded}>
                <span className="w-5 text-right text-sm text-dim">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className={cx('display truncate text-lg', isMe && 'text-candle', p.dead && 'line-through')}>{p.name}</span>
                    {isMe && <span className="text-xs text-dim">you</span>}
                    {p.dead && <span className="text-xs text-evil">dead</span>}
                  </div>
                  <div className="truncate text-sm text-dim">
                    {p.claim ? <span className={claim?.type === 'Minion' || claim?.type === 'Demon' ? 'text-evil' : 'text-good'}>claims {p.claim}</span> : <span>no claim</span>}
                    {p.suspects.length > 0 && <span> · maybe {p.suspects.join(', ')}</span>}
                    {p.note && <span> · {p.note}</span>}
                  </div>
                </div>
                <span className={cx('display text-lg', p.align === 'evil' ? 'text-evil' : p.align === 'good' ? 'text-good' : 'text-dim')}>{p.align === 'unknown' ? '?' : p.align === 'good' ? 'G' : 'E'}</span>
              </button>
              {expanded && (
                <div className="border-t border-line p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {ALIGN.map((a) => (
                      <Chip key={a.v} on={p.align === a.v} bad={a.v === 'evil'} onClick={() => setP(p.id, (q) => ({ ...q, align: a.v }))}>{a.label}</Chip>
                    ))}
                    {!nb.synced && <Chip on={p.dead} bad onClick={() => setP(p.id, (q) => ({ ...q, dead: !q.dead }))}>{p.dead ? 'Dead' : 'Alive'}</Chip>}
                    <Chip on={isMe} onClick={() => setNb((n) => ({ ...n, me: isMe ? null : p.id }))}>Me</Chip>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <div>
                      <div className="mb-1 text-xs text-dim">Claims to be</div>
                      <CharSelect S={S} value={p.claim} onChange={(v) => setP(p.id, (q) => ({ ...q, claim: v }))} aria-label={`${p.name} claims`} />
                    </div>
                    <div>
                      <button type="button" className="mb-1 text-xs text-candle" onClick={() => setPicking(picking === p.id ? null : p.id)}>
                        {picking === p.id ? 'Done picking' : `Could really be… (${p.suspects.length})`}
                      </button>
                      {picking === p.id ? (
                        <CharChips S={S} selected={p.suspects} onToggle={(name) => setP(p.id, (q) => ({ ...q, suspects: q.suspects.includes(name) ? q.suspects.filter((x) => x !== name) : [...q.suspects, name] }))} />
                      ) : (
                        <div className="text-sm text-dim">{p.suspects.join(', ') || '—'}</div>
                      )}
                    </div>
                    <input
                      className="w-full border-0 border-b border-line bg-transparent px-0 py-1 text-wax placeholder:text-dim/50 focus:border-candle focus:outline-none"
                      placeholder="Note: what they said, who they defend, gut feeling…"
                      value={p.note}
                      onChange={(e) => setP(p.id, (q) => ({ ...q, note: e.target.value }))}
                    />
                    <div className="text-sm text-dim">
                      <span className="text-xs">Voted for: </span>
                      {hist.length ? hist.map((h, k) => <span key={k}>{k > 0 && ' · '}D{h.day} {nameOf(nb, h.nominee)}{h.executed ? ' ☠' : ''}</span>) : '—'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
