# Project: Imperial Clocktower (Blood on the Clocktower storyteller app)

Read README.md first. The original build brief is docs/SPEC.md and the single-file reference
implementation (source of all character data and rules) is docs/reference-storyteller.html.

Rules of engagement:
- Backend is Supabase via RPC functions in supabase/schema.sql; all backend access goes through src/lib/store.ts.
  A player must only ever receive their own role (see player_view).
- Mobile first. Test the role-reveal and join flow at phone width (390px). `VITE_BACKEND=local npm run dev`
  runs without a server; each browser tab is a separate phone.
- Character ability text must stay paraphrased. Never copy official card text. No official artwork.
- Keep "Unofficial fan-made tool. Not affiliated with The Pandemonium Institute." in the README and footer.
- Keep dependencies minimal. Commit in small steps. `npm test && npm run typecheck && npm run build` before pushing.
- Deploy: push to main → GitHub Actions → GitHub Pages.
