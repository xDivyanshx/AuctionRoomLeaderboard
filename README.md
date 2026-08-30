# Auction Room Leaderboard

A static fantasy league leaderboard for five managers across 38 gameweeks.

## Update weekly scores

Edit `src/data/results.ts` and add one entry containing all five scores. The app calculates head-to-head results, the average matchup, weekly median bonuses, score difference, form, and standings.

## Run locally

```bash
npm install
npm run dev
```

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Node version: `22`

The included fixture cycle is a placeholder. Replace the five rounds in `src/data/fixtures.ts` with the agreed schedule before publishing real results.
