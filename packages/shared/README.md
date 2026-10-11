# @deaddrop/shared

Tiny shared contract for the web app and the API: drop and find shapes, leaderboard rows, and the scoring rules.

- Hunters earn `10 × difficulty` on a verified find.
- Hiders earn `5 × difficulty` for each verified find on their drop.
- A model "yes" below confidence `0.72` is forced to no.

`src/index.ts` is the source. `dist/` is committed so Render and Vercel can import it without a separate compile step. Rebuild with `npm run build` after changing the source.
