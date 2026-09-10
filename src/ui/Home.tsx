import { useState } from 'react'
import { PLAYER_KEY, ST_KEY, delLocal, fresh, getLocal, type Remembered } from '../lib/device'
import { navigate } from '../lib/router'
import { configured } from '../lib/store'
import { SOLO_KEY, endSoloGame } from '../lib/useSoloGame'
import type { Game } from '../game/types'
import { SCRIPT_IDS, SCRIPTS } from '../data/characters'
import { Banner, Button, Footer, Page } from './kit'

/** A resume button with a small ✕ to forget that game on this phone. */
function Resume({ label, onGo, onForget }: { label: string; onGo: () => void; onForget: () => void }) {
  return (
    <div className="flex gap-2">
      <Button big variant="primary" className="min-w-0 flex-1" onClick={onGo}>{label}</Button>
      <Button big aria-label="Leave this game" className="w-14 shrink-0 text-xl" onClick={() => { if (confirm('Forget this game on this phone?')) onForget() }}>✕</Button>
    </div>
  )
}

export default function Home() {
  const [, bump] = useState(0)
  const forget = (fn: () => void) => { fn(); bump((n) => n + 1) }
  const st = fresh(getLocal<Remembered>(ST_KEY))
  const pl = fresh(getLocal<Remembered>(PLAYER_KEY))
  const solo = getLocal<Game>(SOLO_KEY)
  return (
    <Page>
      <div className="flex flex-col items-center pt-10 text-center">
        <div className="mb-2 text-6xl" aria-hidden>🕯</div>
        <h1 className="text-5xl">Clocktower</h1>
        <p className="mt-2 text-dim">Run Blood on the Clocktower from your phones.</p>
      </div>
      {!configured && (
        <div className="mt-6">
          <Banner>
            Backend not configured. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (see README).
          </Banner>
        </div>
      )}
      <div className="mt-10 flex flex-col gap-3">
        {st && <Resume label={`Resume your game · code ${st.code}`} onGo={() => navigate(`/st/${st.code}`)} onForget={() => forget(() => delLocal(ST_KEY))} />}
        {solo && <Resume label="Resume single-phone game" onGo={() => navigate('/solo')} onForget={() => forget(endSoloGame)} />}
        {pl && <Resume label={`Back to game ${pl.code}${pl.name ? ` as ${pl.name}` : ''}`} onGo={() => navigate(`/p/${pl.code}`)} onForget={() => forget(() => delLocal(PLAYER_KEY))} />}
        <Button big variant={st || pl || solo ? 'default' : 'primary'} onClick={() => navigate('/st')}>
          Run a game
        </Button>
        <Button big onClick={() => navigate('/join')} disabled={!configured}>
          Join a game
        </Button>
        <Button big onClick={() => navigate('/notes')}>
          Notetaking
        </Button>
        <p className="-mt-1 text-center text-sm text-dim">Private notes for any game, also with the physical game.</p>
      </div>
      <h2 className="mt-12 mb-2 text-xl text-candle">Character sheets</h2>
      <div className="flex flex-col gap-2">
        {SCRIPT_IDS.map((id) => (
          <Button key={id} variant="ghost" className="justify-start" onClick={() => navigate(`/sheet/${id}`)}>
            {SCRIPTS[id].name} ›
          </Button>
        ))}
      </div>
      <Footer />
    </Page>
  )
}
