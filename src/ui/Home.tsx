import { PLAYER_KEY, ST_KEY, fresh, getLocal, type Remembered } from '../lib/device'
import { navigate } from '../lib/router'
import { configured } from '../lib/store'
import { SCRIPT_IDS, SCRIPTS } from '../data/characters'
import { Banner, Button, Footer, Page } from './kit'

export default function Home() {
  const st = fresh(getLocal<Remembered>(ST_KEY))
  const pl = fresh(getLocal<Remembered>(PLAYER_KEY))
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
        {st && (
          <Button big variant="primary" onClick={() => navigate(`/st/${st.code}`)}>
            Resume your game · code {st.code}
          </Button>
        )}
        {pl && (
          <Button big variant="primary" onClick={() => navigate(`/p/${pl.code}`)}>
            Back to game {pl.code}{pl.name ? ` as ${pl.name}` : ''}
          </Button>
        )}
        <Button big variant={st || pl ? 'default' : 'primary'} onClick={() => navigate('/st')} disabled={!configured}>
          Run a game
        </Button>
        <Button big onClick={() => navigate('/join')} disabled={!configured}>
          Join a game
        </Button>
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
