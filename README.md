# Imperial Clocktower

A mobile-first web app for running **Blood on the Clocktower** without the physical game.
One Storyteller runs the game from their phone; players join with a 2-digit code and see
their own role on their own phone. Nobody else's role is ever sent to a player's phone.

> Unofficial fan-made tool. Not affiliated with The Pandemonium Institute.
> Character abilities are paraphrased reminders, not official card text. No official art.

**Live app:** https://denlar2.github.io/imperial-clocktower/

Scripts: Trouble Brewing, Bad Moon Rising, Sects & Violets, and Unholier Than Thou (custom, with Djinn jinxes).

## How a game works

The Storyteller taps **Run a game**, picks a script and player count, then chooses one of two modes:

**Players join with their phones**
1. The Storyteller gets a 2-digit code. Players tap **Join a game**, enter the code and their name. The lobby fills up live.
2. Storyteller drags seats to match the circle, taps **Deal roles** (or picks roles per player), then **Start game**.
3. Every player gets a full-screen role token on their phone: tap to reveal, tap to hide.
   The role is only available until the Storyteller begins the first night — remember it, like handing back a token.
4. After that a player's phone turns into their private **notebook** (see below) with day/night and alive/dead
   status. Nobody else's role is ever sent to a player.

**Notetaking** (from the home screen, no game needed — also for the physical game)
A private notebook: pick the script, type the names in seat order, say which seat is you. Then per player:
alignment guess, what they claim, what you think they could really be, notes, and their voting history.
Per day: night deaths, nominations with who voted and who was executed. A **Roles** tab shows every character
with who claims it, double claims, claim counts vs. the set-up table, and your confirmed / ruled-out marks.
A **You** tab holds your character, what you learned each night, and general notes. Player phones in a live game
get the same notebook automatically (names, seats and deaths stay in sync).

**Single phone, pass it around** (no internet needed)
1. Type in the players' names in seat order, deal roles.
2. The **Reveal** tab lists the players: hand the phone around, each taps their name, reads, taps to hide.

In both modes the Storyteller runs the game from the **Grimoire** (alive/dead, marks, reminders, and tapping a role
to change a player's character or alignment mid-game for Pit-Hag, Snake Charmer, Fang Gu, Imp star-passes…), the **Night**
order (filtered to characters in play, with target pickers that move marks), and the **Vote** helper.

Phone games expire after 12 hours. The Storyteller can refresh or close the browser and resume from the home screen.

## Run locally

```sh
npm install
VITE_BACKEND=local npm run dev
```

`VITE_BACKEND=local` needs no server: game state lives in your browser's localStorage and every
**tab** is its own phone (open one tab as Storyteller and a few more as players). Use it for development and UI work.

To run against a real Supabase backend instead, copy `.env.example` to `.env.local`, fill it in, and run `npm run dev`.

Other commands: `npm test` (game-logic tests), `npm run typecheck`, `npm run build`.

## Supabase setup (once, ~5 minutes)

1. Create a free project at https://supabase.com.
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and **Run**.
3. Go to **Project Settings → API** and copy the **Project URL** and the **anon public** key.
4. Put them where the app is built:
   - locally: `.env.local` (see `.env.example`)
   - GitHub Pages: repository **Settings → Secrets and variables → Actions → Variables** →
     add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then re-run the deploy workflow.

Realtime uses Supabase **Broadcast** channels (on by default), so no table replication needs enabling.

Schema changes after the initial setup live in `supabase/migrations/`. They are applied automatically:
the **Supabase schema** workflow runs `scripts/migrate.sh` on every push that touches `supabase/`, and weekly
(which also keeps the free-tier project from being paused). It runs in the protected `supabase` environment (the repo owner approves each run under Actions), and needs the secret `SUPABASE_ACCESS_TOKEN`
(a personal access token from https://supabase.com/dashboard/account/tokens) and the variable `SUPABASE_PROJECT_REF`.
To apply by hand instead: paste the files into the SQL editor, or run the script locally with those two variables set.

### How the data is protected

There is one `games` table with the whole game as JSON, but the anon key cannot read or write
it directly (row level security with no policies). All access goes through five SQL functions:

| function | who | what |
|---|---|---|
| `create_game` | Storyteller | picks a free code, stores the game with the ST's secret |
| `st_read` / `st_write` | Storyteller | full grimoire, requires the secret |
| `join_game` | player | adds/renames the player in the lobby |
| `player_view` | player | public info (names, alive/dead, phase) + **only this player's** role |

The Storyteller's secret is the random device id in their browser's localStorage. Players are
identified the same way, so a player would need another phone's device id to see that phone's role.

Live updates: whoever writes sends a `poke` on the broadcast channel `game:<code>`; everyone else
refetches. Clients also poll every 15–20 s and on regaining focus, so a dropped WebSocket in a pub with
one bar of signal only delays an update, it never loses one.

## Deploy

Pushing to `main` builds, runs the tests, and deploys to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Pull requests get a build + test check.

Manual redeploy: **Actions → Build and deploy to GitHub Pages → Run workflow**, or

```sh
gh workflow run deploy.yml
```

Hosting elsewhere (Vercel, Netlify, any static host): `VITE_BASE=/ npm run build` and publish `dist/`.
It is a static site; only the two `VITE_SUPABASE_*` variables are needed at build time.

## Project layout

```
src/data/characters.ts   all characters, night orders, setup modifiers, jinxes (paraphrased)
src/game/logic.ts        pure game rules: dealing, fake roles, phases, night rows, reveals (tested)
src/game/types.ts        Game / Player / PlayerView shapes
src/lib/store.ts         backend adapter (Supabase); store.local.ts is the no-server version
src/lib/useStGame.ts     Storyteller state hook: local-first, debounced writes, merges joins
src/lib/usePlayerView.ts player state hook: poke + poll refresh, auto-rejoin
src/ui/                  screens: Home, StCreate, Lobby, Grimoire, Night, Vote, Reveal, More, Join, PlayerScreen, Sheet
src/notes/, src/ui/notes/ the notebook: model + tests, setup wizard, Players / Days / Roles / You tabs
supabase/schema.sql      table + RPC functions
docs/                    original build brief and the single-file reference implementation
```

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).
Keep character text paraphrased and do not add official artwork or card text.

## Licence

MIT. Blood on the Clocktower is a trademark of The Pandemonium Institute; this project is an
unofficial fan-made tool and is not affiliated with or endorsed by them.
