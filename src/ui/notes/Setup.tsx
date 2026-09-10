import { useState } from 'react'
import { MAX_PLAYERS, MIN_PLAYERS, SCRIPTS, SCRIPT_IDS, type ScriptId } from '../../data/characters'
import { blankNotePlayer, uid, type Notebook } from '../../notes/model'
import { Button, Input, Label, Page, cx } from '../kit'
import { CharSelect } from './CharPicker'

type Set = (fn: (n: Notebook) => Notebook) => void

/** Wizard for a standalone notebook: script → player count → names → which seat is you + your role. */
export default function Setup({ nb, setNb, onDone, onBack }: { nb: Notebook; setNb: Set; onDone: () => void; onBack: () => void }) {
  const [step, setStep] = useState(0)
  const [count, setCount] = useState(Math.max(MIN_PLAYERS, nb.players.length || 8))
  const [names, setNames] = useState<string[]>(() => Array.from({ length: 15 }, (_, i) => nb.players[i]?.name ?? ''))
  const S = SCRIPTS[nb.script]

  function finish() {
    setNb((n) => {
      const players = names.slice(0, count).map((nm, i) => {
        const existing = n.players[i]
        const name = nm.trim() || `Player ${i + 1}`
        return existing ? { ...existing, name } : blankNotePlayer(uid(), name)
      })
      const me = n.me && players.some((p) => p.id === n.me) ? n.me : null
      return { ...n, players, me, title: n.title || `${S.name} · ${new Date().toLocaleDateString()}` }
    })
  }

  return (
    <Page title="New notebook" back={step === 0 ? onBack : () => setStep(step - 1)}>
      {step === 0 && (
        <>
          <Label>Script</Label>
          <div className="flex flex-col gap-2">
            {SCRIPT_IDS.map((id: ScriptId) => (
              <button key={id} type="button" onClick={() => setNb((n) => ({ ...n, script: id }))} className={cx('display min-h-14 rounded-2xl border px-4 text-left text-xl', nb.script === id ? 'border-candle bg-candle/15 text-candle' : 'border-line bg-dusk text-wax')}>
                {SCRIPTS[id].name}
              </button>
            ))}
          </div>
          <div className="mt-6">
            <Label>Players</Label>
            <div className="flex items-center gap-3">
              <Button big className="w-16 text-2xl" aria-label="Fewer" onClick={() => setCount((c) => Math.max(MIN_PLAYERS, c - 1))}>−</Button>
              <div className="display flex-1 text-center text-5xl">{count}</div>
              <Button big className="w-16 text-2xl" aria-label="More" onClick={() => setCount((c) => Math.min(MAX_PLAYERS, c + 1))}>+</Button>
            </div>
          </div>
          <Button big variant="primary" className="mt-8 w-full" onClick={() => setStep(1)}>Next: names</Button>
        </>
      )}
      {step === 1 && (
        <>
          <Label>Names in seat order (clockwise from anyone)</Label>
          <div className="flex flex-col gap-2">
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-right text-dim">{i + 1}</span>
                <Input placeholder={`Player ${i + 1}`} value={names[i]} onChange={(e) => setNames((a) => a.map((x, j) => (j === i ? e.target.value : x)))} maxLength={24} autoComplete="off" enterKeyHint="next" />
              </div>
            ))}
          </div>
          <Button big variant="primary" className="mt-6 w-full" onClick={() => { finish(); setStep(2) }}>Next: you</Button>
        </>
      )}
      {step === 2 && (
        <>
          <Label>Which seat is you?</Label>
          <div className="grid grid-cols-2 gap-2">
            {nb.players.map((p, i) => (
              <button key={p.id} type="button" onClick={() => setNb((n) => ({ ...n, me: p.id }))} className={cx('min-h-12 rounded-xl border px-3 text-left', nb.me === p.id ? 'border-candle bg-candle/15 text-candle' : 'border-line bg-dusk')}>
                <span className="text-dim">{i + 1}.</span> {p.name}
              </button>
            ))}
          </div>
          <div className="mt-6">
            <Label>Your character (as told to you)</Label>
            <CharSelect S={S} value={nb.myRole} onChange={(v) => setNb((n) => ({ ...n, myRole: v }))} placeholder="– pick later –" />
          </div>
          <Button big variant="primary" className="mt-8 w-full" onClick={onDone}>Open notebook</Button>
        </>
      )}
    </Page>
  )
}
