import { usePath } from './lib/router'
import Home from './ui/Home'
import StCreate from './ui/StCreate'
import StGame from './ui/StGame'
import Join from './ui/Join'
import PlayerScreen from './ui/PlayerScreen'
import Sheet from './ui/Sheet'

export default function App() {
  const path = usePath()
  const seg = path.split('/').filter(Boolean)
  if (seg[0] === 'st' && !seg[1]) return <StCreate />
  if (seg[0] === 'st' && seg[1]) return <StGame code={seg[1]} />
  if (seg[0] === 'join') return <Join code={seg[1]} />
  if (seg[0] === 'p' && seg[1]) return <PlayerScreen code={seg[1]} />
  if (seg[0] === 'sheet') return <Sheet scriptId={seg[1]} />
  return <Home />
}
