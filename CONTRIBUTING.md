# Contributing

Thanks for helping! This is a small hobby project for playing Blood on the Clocktower with friends.

## Ground rules

- **No official content.** Character abilities must stay paraphrased in our own words.
  Never paste official card/almanac text, and never add official artwork, logos or token images.
- Keep the disclaimer ("Unofficial fan-made tool. Not affiliated with The Pandemonium Institute.") in the README and footer.
- Mobile first. Test anything you touch at phone width (390px) — the app is used on phones in a pub.
- Keep dependencies minimal.

## Workflow

1. Fork (or branch, if you have write access) and make your change.
2. `npm test && npm run typecheck && npm run build` must pass.
3. Try it: `VITE_BACKEND=local npm run dev`, open one tab as Storyteller and a couple as players.
4. Open a pull request against `main`. CI builds and tests it. Merging to `main` deploys automatically.

## Adding or fixing a character

Everything lives in `src/data/characters.ts`: ability (paraphrased), first/other night prompts,
and the night order arrays. Night-step target pickers are the `pick` field; fake roles are `fake`.
If a change affects dealing or setup, add a test in `src/game/logic.test.ts`.

## Changing the backend

`src/lib/store.ts` is the only file that talks to Supabase. `store.local.ts` is the same API on
localStorage. Any replacement must keep `player_view` semantics: a player only ever receives their own role.
