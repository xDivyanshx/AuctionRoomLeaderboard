# Auction Room Leaderboard

A static fantasy league leaderboard for Divyansh, Ishaan, Avneesh, Akshat, and Viren across 38 gameweeks.

## Current milestone

- Responsive standings and gameweek fixture UI implemented.
- Exact 2026/27 fixture schedule imported for all 38 gameweeks.
- Head-to-head, average matchup, median bonus, score difference, and form calculations implemented.
- Cloudflare Workers static-assets deployment configured through `wrangler.jsonc`.
- GW1 currently contains sample scores and is waiting for the real results.

## League rules

- Each gameweek has two head-to-head matches and one player against the average score of the other four players.
- Head-to-head win: 3 points; draw: 1 point each; loss: 0 points.
- Every score strictly above the five-player weekly median earns a 1-point bonus.
- Standings rank by total points, then season points-for minus points-against, then total points-for.
- An unresolved tie after all tie-breakers shares the same sporting position.

## Update weekly scores

Edit `src/data/results.ts` and add one entry containing all five scores. The app calculates head-to-head results, the average matchup, weekly median bonuses, score difference, form, and standings.

Before the first real deployment, replace the sample GW1 entry rather than appending a second GW1 entry.

## Run locally

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run build
npx wrangler deploy --dry-run
```

## Cloudflare

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Node version: `22`
- Production branch: `development`

The full 2026/27 fixture schedule is stored in `src/data/fixtures.ts`.

## Git workflow

Coding agents may modify and stage files, but the repository owner performs all commits and pushes. Review staged changes before committing.
