import { useState } from 'react'
import type { Game } from '../game/types'
import RoleReveal from './RoleReveal'
import { Button } from './kit'

/** Single-phone mode: hand the phone to each player. They tap their name, read, then tap to hide. */
export default function Reveal({ game }: { game: Game }) {
  const [open, setOpen] = useState<string | null>(null)
  const p = game.players.find((q) => q.id === open)
  return (
    <>
      <p className="mb-3 text-dim">Hand the phone to each player. They tap their name, read, then tap to hide and pass it on.</p>
      <div className="flex flex-col gap-2">
        {game.players.map((q) => (
          <Button key={q.id} big className="w-full justify-start text-xl" onClick={() => setOpen(q.id)} disabled={!q.reveal}>
            {q.name}
          </Button>
        ))}
      </div>
      {p?.reveal && (
        <RoleReveal reveal={p.reveal} scriptId={game.script} name={p.name} shown onToggle={() => setOpen(null)} />
      )}
    </>
  )
}
