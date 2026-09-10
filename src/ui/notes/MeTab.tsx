import { getChar, type Script } from '../../data/characters'
import type { Notebook } from '../../notes/model'
import { navigate } from '../../lib/router'
import { Button, Card, Input, Label } from '../kit'
import { CharSelect } from './CharPicker'

type Set = (fn: (n: Notebook) => Notebook) => void

export default function MeTab({ nb, setNb, S, onDelete, onLeave }: { nb: Notebook; setNb: Set; S: Script; onDelete?: () => void; onLeave?: () => void }) {
  const c = getChar(S, nb.myRole)
  const nights = Math.max(1, nb.days.length)
  return (
    <>
      <Label>Your character</Label>
      <CharSelect S={S} value={nb.myRole} onChange={(v) => setNb((n) => ({ ...n, myRole: v }))} placeholder="– not set –" />
      {c && (
        <Card className="mt-2 text-sm">
          <div className={c.type === 'Minion' || c.type === 'Demon' ? 'text-evil' : 'text-good'}>{c.type}</div>
          <div className="text-dim">{c.ability}</div>
          {(c.firstNight || c.otherNight) && (
            <div className="mt-1 text-xs text-dim">
              {c.firstNight && <div>First night: wakes.</div>}
              {c.otherNight && <div>Other nights: wakes.</div>}
            </div>
          )}
        </Card>
      )}
      <h2 className="mt-6 mb-2 text-xl text-candle">What you learned</h2>
      <div className="flex flex-col gap-2">
        {Array.from({ length: nights }, (_, i) => i + 1).map((n) => (
          <div key={n} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-sm text-dim">Night {n}</span>
            <Input placeholder={n === 1 ? 'e.g. saw 1 — Bo or Cass is the Librarian' : 'info, or "no wake"'} value={nb.nights[n] ?? ''} onChange={(e) => setNb((x) => ({ ...x, nights: { ...x.nights, [n]: e.target.value } }))} />
          </div>
        ))}
        <button type="button" className="self-start text-sm text-candle" onClick={() => setNb((x) => ({ ...x, nights: { ...x.nights, [nights + 1]: x.nights[nights + 1] ?? '' }, days: x.days.length < nights + 1 ? [...x.days, { day: x.days.length + 1, deaths: [], nominations: [], note: '' }] : x.days }))}>
          + Night {nights + 1}
        </button>
      </div>
      <h2 className="mt-6 mb-2 text-xl text-candle">General notes</h2>
      <textarea
        className="min-h-32 w-full rounded-2xl border border-line bg-dusk p-3 text-wax placeholder:text-dim/50 focus:border-candle focus:outline-none"
        placeholder="Theories, bluffs you're running, who to nominate tomorrow…"
        value={nb.general}
        onChange={(e) => setNb((x) => ({ ...x, general: e.target.value }))}
      />
      <div className="mt-4">
        <Label>Notebook name</Label>
        <Input value={nb.title} onChange={(e) => setNb((x) => ({ ...x, title: e.target.value }))} placeholder="Friday at the pub" />
      </div>
      <Button className="mt-6 w-full" onClick={() => navigate(`/sheet/${S.id}`)}>Character sheet</Button>
      {onDelete && <Button variant="danger" className="mt-2 w-full" onClick={onDelete}>Delete notebook</Button>}
      {onLeave && <Button variant="danger" className="mt-2 w-full" onClick={onLeave}>Leave game</Button>}
    </>
  )
}
