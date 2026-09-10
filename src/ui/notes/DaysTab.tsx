import { useState } from 'react'
import { nameOf, uid, type DayLog, type Nomination, type Notebook } from '../../notes/model'
import { Button, Card, Chip, Select, cx } from '../kit'

type Set = (fn: (n: Notebook) => Notebook) => void

export default function DaysTab({ nb, setNb }: { nb: Notebook; setNb: Set }) {
  const [cur, setCur] = useState(nb.days.length - 1)
  const d = nb.days[Math.min(cur, nb.days.length - 1)]
  const setDay = (fn: (x: DayLog) => DayLog) => setNb((n) => ({ ...n, days: n.days.map((x) => (x.day === d.day ? fn(x) : x)) }))
  const setNom = (id: string, fn: (x: Nomination) => Nomination) => setDay((x) => ({ ...x, nominations: x.nominations.map((m) => (m.id === id ? fn(m) : m)) }))
  const alive = nb.players.filter((p) => !p.dead).length
  const needed = Math.ceil(alive / 2)

  function toggleDeath(id: string) {
    setNb((n) => {
      const day = n.days.find((x) => x.day === d.day)!
      const dead = !day.deaths.includes(id)
      return {
        ...n,
        days: n.days.map((x) => (x.day === d.day ? { ...x, deaths: dead ? [...x.deaths, id] : x.deaths.filter((v) => v !== id) } : x)),
        players: n.synced ? n.players : n.players.map((p) => (p.id === id ? { ...p, dead } : p)),
      }
    })
  }
  function setExecuted(nom: Nomination, executed: boolean) {
    setNb((n) => ({
      ...n,
      days: n.days.map((x) => (x.day === d.day ? { ...x, nominations: x.nominations.map((m) => ({ ...m, executed: m.id === nom.id ? executed : executed ? false : m.executed })) } : x)),
      players: n.synced || !nom.nominee ? n.players : n.players.map((p) => (p.id === nom.nominee ? { ...p, dead: executed } : p)),
    }))
  }

  const playerOpts = nb.players.map((p) => <option key={p.id} value={p.id}>{p.name}{p.dead ? ' †' : ''}</option>)
  return (
    <>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {nb.days.map((x, i) => (
          <button key={x.day} type="button" onClick={() => setCur(i)} className={cx('display min-h-10 shrink-0 rounded-full border px-4', i === cur ? 'border-candle bg-candle/15 text-candle' : 'border-line text-dim')}>
            Day {x.day}
          </button>
        ))}
        <button type="button" onClick={() => { setNb((n) => ({ ...n, days: [...n.days, { day: n.days.length + 1, deaths: [], nominations: [], note: '' }] })); setCur(nb.days.length) }} className="min-h-10 shrink-0 rounded-full border border-line px-4 text-candle">
          + Day
        </button>
      </div>

      <Card>
        <div className="mb-1 font-semibold">Died in the night <span className="text-xs text-dim">(announced at dawn)</span></div>
        <div className="flex flex-wrap gap-1.5">
          {nb.players.map((p) => (
            <Chip key={p.id} on={d.deaths.includes(p.id)} bad onClick={() => toggleDeath(p.id)}>{p.name}</Chip>
          ))}
        </div>
      </Card>

      <h2 className="mt-5 mb-2 flex items-baseline justify-between text-xl text-candle">
        Nominations <span className="text-sm text-dim">{needed} votes to execute ({alive} alive)</span>
      </h2>
      <div className="flex flex-col gap-3">
        {d.nominations.map((nom) => (
          <Card key={nom.id} className={cx(nom.executed && 'border-evil')}>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="mb-1 text-xs text-dim">Nominator</div>
                <Select value={nom.nominator ?? ''} onChange={(e) => setNom(nom.id, (m) => ({ ...m, nominator: e.target.value || null }))}><option value="">–</option>{playerOpts}</Select>
              </div>
              <span className="pt-4 text-dim">→</span>
              <div className="flex-1">
                <div className="mb-1 text-xs text-dim">Nominee</div>
                <Select value={nom.nominee ?? ''} onChange={(e) => setNom(nom.id, (m) => ({ ...m, nominee: e.target.value || null }))}><option value="">–</option>{playerOpts}</Select>
              </div>
            </div>
            <div className="mt-2 mb-1 text-xs text-dim">Who voted ✋ — tap</div>
            <div className="flex flex-wrap gap-1.5">
              {nb.players.map((p) => (
                <Chip key={p.id} on={nom.votes.includes(p.id)} onClick={() => setNom(nom.id, (m) => ({ ...m, votes: m.votes.includes(p.id) ? m.votes.filter((v) => v !== p.id) : [...m.votes, p.id] }))}>{p.name}</Chip>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className={cx('display text-2xl', nom.votes.length >= needed ? 'text-candle' : 'text-wax')}>{nom.votes.length} <span className="text-sm text-dim">/ {needed}</span></span>
              <div className="flex gap-2">
                <Chip on={nom.executed} bad onClick={() => setExecuted(nom, !nom.executed)}>Executed{nom.nominee ? `: ${nameOf(nb, nom.nominee)}` : ''}</Chip>
                <button type="button" aria-label="Remove nomination" className="min-h-9 min-w-9 text-dim" onClick={() => setDay((x) => ({ ...x, nominations: x.nominations.filter((m) => m.id !== nom.id) }))}>✕</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Button className="mt-3 w-full" onClick={() => setDay((x) => ({ ...x, nominations: [...x.nominations, { id: uid(), nominator: null, nominee: null, votes: [], executed: false }] }))}>
        + Nomination
      </Button>
      <textarea
        className="mt-4 min-h-24 w-full rounded-2xl border border-line bg-dusk p-3 text-wax placeholder:text-dim/50 focus:border-candle focus:outline-none"
        placeholder={`Day ${d.day} notes: claims made, who defended whom, Slayer shots…`}
        value={d.note}
        onChange={(e) => setDay((x) => ({ ...x, note: e.target.value }))}
      />
    </>
  )
}
