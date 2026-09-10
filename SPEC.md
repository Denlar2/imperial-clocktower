# Clocktower Storyteller — build brief

Build a mobile-first web app for running Blood on the Clocktower without the physical game. One Storyteller (ST) runs the game from their phone; players join with a 2-digit code and see their own role on their own phone.

Unofficial fan-made tool. Not affiliated with The Pandemonium Institute. Use character names and paraphrased abilities only (see `reference-storyteller.html` — it is a working single-file version of the Storyteller side with all character data, night orders, setup modifiers and mark tracking; port its logic, don't rewrite the rules from memory). No official art, logos, or card text.

## Stack

- Vite + React + TypeScript
- Supabase (free tier): Postgres + Realtime for live game state. One `games` table keyed by code; store the whole game as a JSON column plus a `updated_at`. Subscribe with Realtime so players update instantly.
- Deploy to Vercel or Netlify. Give me the deploy command at the end.
- No login. Players are identified by a random device ID kept in localStorage.
- Keep it one repo, minimal dependencies. Tailwind is fine.

## Scripts

Support all three, selectable at game creation:
- Trouble Brewing
- Bad Moon Rising
- Unholier Than Thou (custom script; includes Djinn jinx rules to display)

Store all character data in a single `characters.ts`: name, script, type (Townsfolk/Outsider/Minion/Demon), paraphrased ability, first-night prompt, other-night prompt, first-night order index, other-night order index. Copy the data, night orders, setup modifiers (Baron, Godfather, Balloonist, Bounty Hunter's evil Townsfolk, Marionette seated next to the Demon), fake-role logic (Drunk, Lunatic, Marionette) and jinx text from the reference HTML.

Set-up table (players → Townsfolk/Outsiders/Minions/Demon):
5:3/0/1/1, 6:3/1/1/1, 7:5/0/1/1, 8:5/1/1/1, 9:5/2/1/1, 10:7/0/2/1, 11:7/1/2/1, 12:7/2/2/1, 13:9/0/3/1, 14:9/1/3/1, 15:9/2/3/1.
Modifiers: Baron +2 Outsiders (TB). Godfather +1 or −1 Outsider (BMR). Drunk is shown a Townsfolk not in play (TB). Lunatic is shown a Demon (BMR) and the real Demon is told who the Lunatic is.

## Flow

### Home
Two buttons: **Run a game** (ST) and **Join a game** (player).

### ST creates a game
- Pick script, player count. App generates a 2-digit code (00–99, reject codes already active in the last 12 hours).
- Lobby screen shows the code big, and players appearing as they join, in seat order (ST can drag to reorder so it matches the circle).
- "Deal roles" button: random by the set-up table, or ST can assign manually per player. ST can re-deal.
- "Start game" locks roles and sends every player their reveal.

### Player joins
- Enter 2-digit code + name. Waits in lobby ("Waiting for the Storyteller…").
- On start: full-screen role reveal, tap to hide/show. Shows character, type, alignment colour, paraphrased ability. Evil players (7+ players) also see their team. Drunk/Lunatic see their fake role only.
- After reveal, the player screen stays simple: their role (tap to peek), whether they're alive/dead, ghost vote used or not, and a link to the character sheet.
- Player never sees anyone else's role.

### ST Grimoire
- Players listed in seat order with role, type, alignment colour.
- Per-player toggles: alive/dead, executed, ghost vote used, poisoned, drunk, protected, mad. Free-text reminder field.
- Night steps that target a player (Poisoner, Pukka, Monk, Sailor, Devil's Advocate, Cerenovus) have a target picker that moves the mark automatically. Nightly marks reset at dusk (poison persists in BMR).
- Leviathan tracker when in play: good executions count and day number, warns when evil has won.
- Counts: alive, evil alive, dead.
- Day/night phase button, reachable from both Grimoire and Night screens (Dusk from Grimoire opens the night order; Dawn from the night order returns to the Grimoire). Phase is broadcast to players (they see "Night 2" / "Day 2").
- "Not in play" list of good characters for Demon bluffs.
- Changes to alive/dead push to the player's phone.

### ST Night order
- On entering a night, show the wake-up order for that night (first night vs other nights differ), filtered to characters actually in play (including fake Drunk/Lunatic roles). Toggle to show the full order.
- Each row: character, which player(s), dead/poisoned/drunk flags, short prompt for what the ST does. Checkbox to mark done.
- Special rows: Minion info and Demon info (7+ players only), Demon info also names the Lunatic in BMR.

### Character sheet
- Public page reachable by anyone in the game (and from the lobby before start): every character in the chosen script grouped by type, with paraphrased ability. This is what players use instead of the physical sheet.
- Also show the night order for the script (first and other nights) so players can see who wakes when.

## Design

Mobile first, thumb-reachable bottom nav for the ST. Dark night palette with candle-amber accent, serif display face for names and headings, sans for body. Big tap targets. Role reveal must feel like flipping a token: full-screen, one tap to hide, obvious "hand phone back" state. Test on iPhone Safari (safe areas, no zoom on input focus). Respect reduced motion. Keep it fast — it will be used with one bar of signal in a pub.

## Nice to have (do last)

- ST can kick/rename a player.
- ST can "rejoin" their own game from the home screen if they refresh.
- Vote helper: ST taps players who raise hands, shows count vs. needed majority.
- Copy-link share button for the character sheet.

## Deliverables

1. Working app deployed with a URL.
2. README with: how to run locally, Supabase setup (SQL for the table + Realtime enabled), deploy steps, and the fan-content disclaimer.
