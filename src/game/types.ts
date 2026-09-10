import type { ScriptId, CharType } from '../data/characters'

/** What a player is allowed to see about themselves once the game has started. */
export interface Reveal {
  /** Character shown to the player (fake role for Drunk / Lunatic / Marionette). */
  shown: string
  type: CharType
  evil: boolean
  /** Extra line: evil team, "you are evil but…", etc. */
  mates: string
}

export interface Player {
  /** Device id of the player's phone. */
  id: string
  name: string
  role: string | null
  fakeAs: string | null
  /** Alignment override (Bounty Hunter's evil Townsfolk). null = derive from role. */
  evil: boolean | null
  dead: boolean
  executed: boolean
  /** Ghost vote still available. */
  ghost: boolean
  poison: boolean
  drunk: boolean
  safe: boolean
  mad: boolean
  note: string
  reveal: Reveal | null
}

export type Status = 'lobby' | 'playing'
/** 'phones': players join with their own phones. 'single': one phone passed around, no backend. */
export type Mode = 'phones' | 'single'

export interface Game {
  v: 1
  code: string
  /** Defaults to 'phones' when missing (older games). */
  mode?: Mode
  script: ScriptId
  /** Target player count chosen by the ST. */
  count: number
  status: Status
  /** 0 = setup, odd = night (1 = first night), even = day. */
  phase: number
  /** Night checklist: order index → done. */
  done: Record<string, boolean>
  /** Seat order. */
  players: Player[]
  /** Vote helper: ids of players currently counted as voting. */
  votes: string[]
  createdAt: number
}

/** The subset of the game a player is allowed to receive. Built server-side by player_view(). */
export interface PlayerView {
  code: string
  script: ScriptId
  status: Status
  phase: number
  count: number
  players: { id: string; name: string; dead: boolean; ghost: boolean }[]
  me: { id: string; name: string; dead: boolean; executed: boolean; ghost: boolean; reveal: Reveal | null } | null
}
