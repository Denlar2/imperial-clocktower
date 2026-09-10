import { useState } from 'react'
import type { PlayerView } from '../game/types'
import { getLocal, setLocal } from '../lib/device'
import { cx } from './kit'

type NoteMap = Record<string, string>
const key = (code: string) => `ct.notes.${code}`

/** A player's private notes: one line per player plus a free-text area. Stored on this phone only. */
export default function Notes({ view, myId }: { view: PlayerView; myId: string }) {
  const [notes, setNotes] = useState<NoteMap>(() => getLocal<NoteMap>(key(view.code)) ?? {})
  const set = (id: string, text: string) => {
    const next = { ...notes, [id]: text }
    setNotes(next)
    setLocal(key(view.code), next)
  }
  return (
    <>
      <h2 className="mt-6 mb-2 text-xl text-candle">Your notes</h2>
      <p className="mb-3 text-sm text-dim">Only on this phone. Who claims what, who you trust, who voted how.</p>
      <ol className="flex flex-col gap-2">
        {view.players.map((p, i) => (
          <li key={p.id} className={cx('rounded-2xl border border-line bg-dusk p-3', p.dead && 'opacity-60')}>
            <div className="flex items-baseline gap-2">
              <span className="w-5 text-right text-sm text-dim">{i + 1}</span>
              <span className={cx('display text-lg', p.id === myId && 'text-candle', p.dead && 'line-through')}>{p.name}</span>
              {p.id === myId && <span className="text-xs text-dim">you</span>}
              {p.dead && <span className="ml-auto text-xs text-evil">dead{p.ghost ? ' · 👻 vote left' : ''}</span>}
            </div>
            <input
              className="mt-1 w-full border-0 border-b border-line bg-transparent px-0 py-1 text-wax placeholder:text-dim/50 focus:border-candle focus:outline-none"
              placeholder="claims… / suspicious / trusted"
              value={notes[p.id] ?? ''}
              onChange={(e) => set(p.id, e.target.value)}
            />
          </li>
        ))}
      </ol>
      <textarea
        className="mt-3 min-h-28 w-full rounded-2xl border border-line bg-dusk p-3 text-wax placeholder:text-dim/50 focus:border-candle focus:outline-none"
        placeholder="General notes (your role, what you learned each night…)"
        value={notes._general ?? ''}
        onChange={(e) => set('_general', e.target.value)}
      />
    </>
  )
}
