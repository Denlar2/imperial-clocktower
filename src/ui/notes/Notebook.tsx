import { useState, type ReactNode } from 'react'
import { getScript } from '../../data/characters'
import type { Notebook as NB } from '../../notes/model'
import { BottomNav, Page } from '../kit'
import CharsTab from './CharsTab'
import DaysTab from './DaysTab'
import MeTab from './MeTab'
import PlayersTab from './PlayersTab'

type Set = (fn: (n: NB) => NB) => void
type Tab = 'players' | 'days' | 'chars' | 'me'

/** The notebook UI. Used standalone and inside the player screen of a live game. */
export default function Notebook({ nb, setNb, title, right, back, header, onDelete }: { nb: NB; setNb: Set; title?: ReactNode; right?: ReactNode; back?: string | (() => void); header?: ReactNode; onDelete?: () => void }) {
  const [tab, setTab] = useState<Tab>('players')
  const S = getScript(nb.script)!
  const titles: Record<Tab, string> = { players: 'Players', days: 'Days & votes', chars: 'Characters', me: 'You' }
  return (
    <Page
      title={title ?? titles[tab]}
      right={right}
      back={back}
      nav={<BottomNav current={tab} onChange={(t) => setTab(t as Tab)} items={[{ id: 'players', label: 'Players' }, { id: 'days', label: 'Days' }, { id: 'chars', label: 'Roles' }, { id: 'me', label: 'You' }]} />}
    >
      {header}
      {tab === 'players' && <PlayersTab nb={nb} setNb={setNb} S={S} />}
      {tab === 'days' && <DaysTab nb={nb} setNb={setNb} />}
      {tab === 'chars' && <CharsTab nb={nb} setNb={setNb} S={S} />}
      {tab === 'me' && <MeTab nb={nb} setNb={setNb} S={S} onDelete={onDelete} />}
    </Page>
  )
}
