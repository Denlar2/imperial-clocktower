// Character data for the three supported scripts.
// Ability text is a short plain-words reminder, NOT the official card text.
// Ported from docs/reference-storyteller.html — keep it paraphrased.
//
// type  = Townsfolk | Outsider | Minion | Demon
// fake  = this character is shown a different role ('Townsfolk' | 'Demon' | 'Good')
// pick  = the night step has a target picker that sets this mark on the chosen player

export type ScriptId = 'TB' | 'BMR' | 'UTT'
export type CharType = 'Townsfolk' | 'Outsider' | 'Minion' | 'Demon'
export type Mark = 'poison' | 'drunk' | 'safe' | 'mad'
export type FakeKind = 'Townsfolk' | 'Demon' | 'Good'

export interface Character {
  name: string
  script: ScriptId
  type: CharType
  ability: string
  firstNight?: string
  otherNight?: string
  /** 0-based index in the first-night order, or -1 if the character does not wake. */
  firstNightOrder: number
  /** 0-based index in the other-nights order, or -1 if the character does not wake. */
  otherNightOrder: number
  fake?: FakeKind
  pick?: Mark
}

export interface Script {
  id: ScriptId
  name: string
  characters: Character[]
  /** First-night wake order. May contain the special rows 'Minion info' and 'Demon info'. */
  firstNight: string[]
  otherNight: string[]
  setupNote: string
  jinx?: string[]
}

export const TYPES: CharType[] = ['Townsfolk', 'Outsider', 'Minion', 'Demon']

export const MARKS: Record<Mark, string> = { poison: 'Poisoned', drunk: 'Drunk', safe: 'Protected', mad: 'Mad' }

/** players → [Townsfolk, Outsiders, Minions, Demon] */
export const COMP: Record<number, [number, number, number, number]> = {
  5: [3, 0, 1, 1], 6: [3, 1, 1, 1], 7: [5, 0, 1, 1], 8: [5, 1, 1, 1], 9: [5, 2, 1, 1],
  10: [7, 0, 2, 1], 11: [7, 1, 2, 1], 12: [7, 2, 2, 1], 13: [9, 0, 3, 1], 14: [9, 1, 3, 1], 15: [9, 2, 3, 1],
}
export const MIN_PLAYERS = 5
export const MAX_PLAYERS = 15

type Raw = { t: CharType; a: string; n1?: string; n?: string; fake?: FakeKind; pick?: Mark }

const shared: Record<string, Raw> = {
  Chef: { t: 'Townsfolk', a: 'Starts knowing how many pairs of evil players sit next to each other.', n1: 'Show the number of adjacent evil pairs.' },
  Librarian: { t: 'Townsfolk', a: 'Starts knowing that one of two players is a particular Outsider, or that there are none.', n1: 'Show an Outsider token and point to two players, or show a 0.' },
  Lunatic: { t: 'Outsider', fake: 'Demon', a: 'Thinks they are a Demon, but are not. The real Demon knows who the Lunatic is and who they try to kill.', n1: 'Wake the Lunatic as a Demon; show fake Minions and 3 bluffs. Then wake the Demon and point out the Lunatic.', n: 'Wake the Lunatic as the Demon and let them "act". Nobody dies. Tell the real Demon who was chosen.' },
  Poisoner: { t: 'Minion', pick: 'poison', a: 'Each night, poisons one player until the next dusk.', n1: 'They pick a player. Mark poisoned.', n: 'They pick a player. Mark poisoned.' },
}

const RAW: Record<ScriptId, { name: string; chars: Record<string, Raw>; first: string[]; other: string[]; setup: string; jinx?: string[] }> = {
  TB: {
    name: 'Trouble Brewing',
    chars: {
      Washerwoman: { t: 'Townsfolk', a: 'Starts knowing that one of two players is a particular Townsfolk.', n1: 'Show a Townsfolk token and point to two players (one really is that character).' },
      Librarian: shared.Librarian,
      Investigator: { t: 'Townsfolk', a: 'Starts knowing that one of two players is a particular Minion.', n1: 'Show a Minion token and point to two players.' },
      Chef: shared.Chef,
      Empath: { t: 'Townsfolk', a: 'Each night, learns how many of their two living neighbours are evil.', n1: 'Show 0, 1 or 2.', n: 'Show 0, 1 or 2 for living neighbours.' },
      'Fortune Teller': { t: 'Townsfolk', a: 'Each night, picks two players and learns if one of them is the Demon. One good player also reads as the Demon (the red herring).', n1: 'They pick two. Yes if either is the Demon or the red herring.', n: 'They pick two. Yes or no.' },
      Undertaker: { t: 'Townsfolk', a: 'Each night, learns which character was executed that day.', n: 'Show the executed character, if any.' },
      Monk: { t: 'Townsfolk', pick: 'safe', a: 'Each night, protects one other player from the Demon.', n: 'They pick a player. Mark them safe.' },
      Ravenkeeper: { t: 'Townsfolk', a: "If killed at night, wakes and learns one chosen player's character.", n: 'Only if they died tonight: they pick a player, show that character.' },
      Virgin: { t: 'Townsfolk', a: 'The first time they are nominated, if the nominator is a Townsfolk, the nominator is executed immediately.' },
      Slayer: { t: 'Townsfolk', a: 'Once per game, during the day, may publicly pick a player. If it is the Demon, it dies.' },
      Soldier: { t: 'Townsfolk', a: 'Cannot be killed by the Demon.' },
      Mayor: { t: 'Townsfolk', a: 'If only three players are alive and nobody is executed, good wins. If the Demon attacks them, someone else may die instead.' },
      Butler: { t: 'Outsider', a: 'Each night, picks a master. May only vote if the master is voting too.', n1: 'They pick a master.', n: 'They pick a master.' },
      Drunk: { t: 'Outsider', fake: 'Townsfolk', a: 'Thinks they are a Townsfolk, but their ability does not work.' },
      Recluse: { t: 'Outsider', a: 'May register as evil, or as a Minion or Demon, even when dead.' },
      Saint: { t: 'Outsider', a: 'If executed, good loses the game.' },
      Poisoner: shared.Poisoner,
      Spy: { t: 'Minion', a: 'Each night, sees the Grimoire. May register as good, or as a Townsfolk or Outsider.', n1: 'Show them the Grimoire tab.', n: 'Show them the Grimoire tab.' },
      'Scarlet Woman': { t: 'Minion', a: 'If the Demon dies while five or more players live, becomes the Demon.', n: 'If the Imp died today (5+ alive): tell them they are now the Imp.' },
      Baron: { t: 'Minion', a: 'Two extra Outsiders are in play.' },
      Imp: { t: 'Demon', a: 'Each night, kills one player. If they kill themselves, a Minion becomes the Imp.', n: 'They pick a player. That player dies (unless protected/Soldier).' },
    },
    first: ['Minion info', 'Demon info', 'Poisoner', 'Spy', 'Washerwoman', 'Librarian', 'Investigator', 'Chef', 'Empath', 'Fortune Teller', 'Butler'],
    other: ['Poisoner', 'Monk', 'Spy', 'Scarlet Woman', 'Imp', 'Ravenkeeper', 'Undertaker', 'Empath', 'Fortune Teller', 'Butler'],
    setup: 'Baron adds 2 Outsiders.',
  },
  BMR: {
    name: 'Bad Moon Rising',
    chars: {
      Grandmother: { t: 'Townsfolk', a: 'Starts knowing a good player and their character (the grandchild). If the Demon kills the grandchild, the Grandmother dies too.', n1: 'Show the grandchild and their character.', n: 'If the Demon killed the grandchild tonight, the Grandmother dies too.' },
      Sailor: { t: 'Townsfolk', pick: 'drunk', a: 'Each night, picks a living player. Either the Sailor or that player is drunk until dusk. Cannot die while sober.', n1: 'They pick a player. Choose who is drunk.', n: 'They pick a player. Choose who is drunk.' },
      Chambermaid: { t: 'Townsfolk', a: 'Each night, picks two living players and learns how many of them woke tonight to use their ability.', n1: 'They pick two. Show how many woke tonight.', n: 'They pick two. Show how many woke tonight.' },
      Exorcist: { t: 'Townsfolk', a: 'Each night after the first, picks a player (not the same as last night). If it is the Demon, the Demon learns who the Exorcist is and does not act tonight.', n: 'They pick a player. If Demon: wake the Demon, show the Exorcist, skip the Demon tonight.' },
      Innkeeper: { t: 'Townsfolk', a: 'Each night after the first, picks two players. Neither can die tonight, but one of them is drunk until dusk.', n: 'They pick two. Mark both safe, one drunk.' },
      Gambler: { t: 'Townsfolk', a: 'Each night after the first, picks a player and guesses their character. A wrong guess kills the Gambler.', n: 'They pick a player and a character. Wrong guess: Gambler dies.' },
      Gossip: { t: 'Townsfolk', a: 'Each day, may make a public statement. If it is true, a player dies tonight.', n: "If today's statement was true: choose a player to die." },
      Courtier: { t: 'Townsfolk', a: 'Once per game at night, names a character. That player is drunk for three days and nights.', n1: 'If used: they name a character. Mark drunk for 3 days.', n: 'If used: they name a character. Mark drunk for 3 days.' },
      Professor: { t: 'Townsfolk', a: 'Once per game at night after the first, picks a dead player. If they are a Townsfolk, they come back to life.', n: 'If used: they pick a dead player. Townsfolk returns to life.' },
      Minstrel: { t: 'Townsfolk', a: 'When a Minion dies by execution, everyone else is drunk until dusk tomorrow.' },
      'Tea Lady': { t: 'Townsfolk', a: 'Both living neighbours cannot die as long as both are good.' },
      Pacifist: { t: 'Townsfolk', a: 'Executed good players might not die.' },
      Fool: { t: 'Townsfolk', a: 'The first time they would die, they do not.' },
      Goon: { t: 'Outsider', a: "Each night, the first player to target them with an ability is drunk until dusk, and the Goon takes that player's alignment.", n1: 'First player to pick the Goon is drunk; Goon switches to their alignment.', n: 'First player to pick the Goon is drunk; Goon switches to their alignment.' },
      Lunatic: shared.Lunatic,
      Tinker: { t: 'Outsider', a: 'May die at any time, for no reason.', n: 'You may kill the Tinker.' },
      Moonchild: { t: 'Outsider', a: 'When they learn they have died, they publicly pick a living player. If that player is good, they die tonight.', n: 'If the Moonchild chose a good player today, that player dies.' },
      Godfather: { t: 'Minion', a: 'Starts knowing which Outsiders are in play. If an Outsider dies during the day, picks a player to kill that night. One extra or one fewer Outsider is in play.', n1: 'Show the Outsider characters in play.', n: 'If an Outsider died today: they pick a player, who dies.' },
      "Devil's Advocate": { t: 'Minion', pick: 'safe', a: 'Each night, picks a living player (not the same as last night). If that player is executed tomorrow, they do not die.', n1: 'They pick a player. Mark safe from execution.', n: 'They pick a player. Mark safe from execution.' },
      Assassin: { t: 'Minion', a: 'Once per game at night after the first, picks a player. They die, even if protected.', n: 'If used: they pick a player, who dies no matter what.' },
      Mastermind: { t: 'Minion', a: 'If the Demon dies by execution, the game continues for one more day. If a player is executed that day, evil wins.' },
      Zombuul: { t: 'Demon', a: 'Each night after the first, if nobody died today, picks a player who dies. The first time the Zombuul dies, it survives but looks dead.', n: 'Only if nobody died today: they pick a player, who dies.' },
      Pukka: { t: 'Demon', pick: 'poison', a: 'Each night, picks a player who becomes poisoned. The player poisoned the night before dies, then becomes healthy.', n1: 'They pick a player. Mark poisoned.', n: "They pick a player. Mark poisoned. Yesterday's poisoned player dies." },
      Shabaloth: { t: 'Demon', a: 'Each night after the first, picks two players who die. A player killed the night before may be spat back to life.', n: "They pick two, who die. You may revive one of last night's victims." },
      Po: { t: 'Demon', a: 'Each night after the first, may pick a player who dies. If they chose nobody last night, they pick three players tonight instead.', n: 'They pick one player (or nobody). If they chose nobody last night: three players.' },
    },
    first: ['Minion info', 'Lunatic', 'Demon info', 'Sailor', 'Courtier', 'Godfather', "Devil's Advocate", 'Pukka', 'Grandmother', 'Chambermaid', 'Goon'],
    other: ['Sailor', 'Innkeeper', 'Courtier', 'Gambler', "Devil's Advocate", 'Exorcist', 'Lunatic', 'Zombuul', 'Pukka', 'Shabaloth', 'Po', 'Assassin', 'Godfather', 'Gossip', 'Tinker', 'Moonchild', 'Grandmother', 'Professor', 'Chambermaid', 'Goon'],
    setup: 'Godfather adds or removes 1 Outsider.',
  },
  UTT: {
    name: 'Unholier Than Thou',
    chars: {
      Chef: shared.Chef,
      Noble: { t: 'Townsfolk', a: 'Starts knowing three players; exactly one of them is evil.', n1: 'Point to the three chosen players (one evil, two good).' },
      Librarian: shared.Librarian,
      'Bounty Hunter': { t: 'Townsfolk', a: 'Starts knowing one evil player. When that player dies, learns another evil player that night. One Townsfolk in the game is secretly evil.', n1: 'Point to the known evil player.', n: 'If the known player died today or tonight: point to a new evil player.' },
      Balloonist: { t: 'Townsfolk', a: 'Each night, learns a player whose character type differs from the one learned the night before. May add one Outsider to the game.', n1: 'Point to any player.', n: 'Point to a player of a different character type than last time.' },
      'Snake Charmer': { t: 'Townsfolk', a: 'Each night, picks a living player. If it is the Demon, they swap characters and alignments, and the new Snake Charmer is poisoned.', n1: 'They pick a player. If Demon: swap the two roles here, poison the new Snake Charmer.', n: 'They pick a player. If Demon: swap the two roles here, poison the new Snake Charmer.' },
      Dreamer: { t: 'Townsfolk', a: 'Each night, picks a player (not themselves). Learns one good and one evil character; one of them is correct.', n1: 'They pick a player. Show one good and one evil character.', n: 'They pick a player. Show one good and one evil character.' },
      'Town Crier': { t: 'Townsfolk', a: 'Each night after the first, learns whether a Minion made a nomination today.', n: 'Nod or shake your head.' },
      Savant: { t: 'Townsfolk', a: 'Each day, may visit the Storyteller privately for two statements: one true, one false.' },
      Nightwatchman: { t: 'Townsfolk', a: 'Once per game at night, picks a player. That player learns who the Nightwatchman is.', n1: 'If used: wake the chosen player and point to the Nightwatchman.', n: 'If used: wake the chosen player and point to the Nightwatchman.' },
      Seamstress: { t: 'Townsfolk', a: 'Once per game at night, picks two other players. Learns whether they are on the same team.', n1: 'If used: they pick two. Nod or shake.', n: 'If used: they pick two. Nod or shake.' },
      Amnesiac: { t: 'Townsfolk', a: 'Does not know their own ability. Each day may privately guess it and learns how close the guess is.', n1: 'Run the secret ability you gave them, if it acts at night.', n: 'Run the secret ability you gave them, if it acts at night.' },
      Magician: { t: 'Townsfolk', a: 'The Demon believes they are a Minion; the Minions believe they are the Demon.', n1: 'Handled in Minion info and Demon info.' },
      Lunatic: shared.Lunatic,
      Mutant: { t: 'Outsider', a: 'If they are "mad" that they are an Outsider, they may be executed.' },
      Politician: { t: 'Outsider', a: 'If they were the player most responsible for their team losing, they switch sides and win, even if dead.' },
      Damsel: { t: 'Outsider', a: 'Every Minion knows a Damsel is in play. If a Minion publicly guesses who it is (one guess total), good loses.' },
      Poisoner: shared.Poisoner,
      Cerenovus: { t: 'Minion', pick: 'mad', a: 'Each night, picks a player and a good character. That player must act "mad" that they are that character tomorrow, or may be executed.', n1: 'They pick a player and a character. Wake the target, show the character. Mark mad.', n: 'They pick a player and a character. Wake the target, show the character. Mark mad.' },
      Marionette: { t: 'Minion', fake: 'Good', a: 'Thinks they are a good character but is actually evil. Sits next to the Demon, who knows who they are.', n1: 'Wake the Demon and point to the Marionette (skip this if the Magician is alive).' },
      Goblin: { t: 'Minion', a: 'If they publicly claim to be the Goblin when nominated and are executed that day, evil wins.' },
      Leviathan: { t: 'Demon', a: 'Never kills. Everyone knows it is in play. If more than one good player is executed, evil wins. After day 5, evil wins.', n1: 'At dawn: announce "The Leviathan is in play." Day 1 starts.', n: 'At dawn: announce it again. Check the day counter.' },
    },
    first: ['Minion info', 'Lunatic', 'Demon info', 'Marionette', 'Poisoner', 'Snake Charmer', 'Cerenovus', 'Amnesiac', 'Librarian', 'Chef', 'Dreamer', 'Seamstress', 'Noble', 'Balloonist', 'Bounty Hunter', 'Nightwatchman', 'Leviathan'],
    other: ['Poisoner', 'Snake Charmer', 'Cerenovus', 'Lunatic', 'Amnesiac', 'Dreamer', 'Town Crier', 'Seamstress', 'Balloonist', 'Bounty Hunter', 'Nightwatchman', 'Leviathan'],
    setup: 'Bounty Hunter makes one Townsfolk evil. Balloonist may add 1 Outsider.',
    jinx: [
      'Magician + Marionette: while the Magician is alive, the Demon is not told who the Marionette is.',
      'Cerenovus + Goblin: the Cerenovus may make a player mad that they are the Goblin.',
      'Marionette + Balloonist: if the Marionette thinks they are the Balloonist, an Outsider might have been added.',
    ],
  },
}

function build(id: ScriptId): Script {
  const r = RAW[id]
  const characters = Object.entries(r.chars).map(([name, c]) => ({
    name,
    script: id,
    type: c.t,
    ability: c.a,
    firstNight: c.n1,
    otherNight: c.n,
    firstNightOrder: r.first.indexOf(name),
    otherNightOrder: r.other.indexOf(name),
    fake: c.fake,
    pick: c.pick,
  }))
  return { id, name: r.name, characters, firstNight: r.first, otherNight: r.other, setupNote: r.setup, jinx: r.jinx }
}

export const SCRIPTS: Record<ScriptId, Script> = { TB: build('TB'), BMR: build('BMR'), UTT: build('UTT') }
export const SCRIPT_IDS: ScriptId[] = ['TB', 'BMR', 'UTT']

export function getScript(id: string | null | undefined): Script | null {
  return id && id in SCRIPTS ? SCRIPTS[id as ScriptId] : null
}

export function getChar(script: Script, name: string | null | undefined): Character | undefined {
  return name ? script.characters.find((c) => c.name === name) : undefined
}

export function charsOfType(script: Script, type: CharType): Character[] {
  return script.characters.filter((c) => c.type === type)
}

/** Outsider count modifier for a random deal, given the roles about to be dealt. Mirrors the reference. */
export function outsiderMod(script: Script, roles: string[], rnd: () => number = Math.random): number {
  if (script.id === 'TB') return roles.includes('Baron') ? 2 : 0
  if (script.id === 'BMR') return roles.includes('Godfather') ? (rnd() < 0.5 ? 1 : -1) : 0
  if (script.id === 'UTT') return roles.includes('Balloonist') && rnd() < 0.5 ? 1 : 0
  return 0
}
