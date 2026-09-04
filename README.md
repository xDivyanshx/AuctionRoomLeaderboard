# Auction Room Leaderboard

A static fantasy league leaderboard for Divyansh, Ishaan, Avneesh, Akshat, and Viren across 38 gameweeks.

## Current milestone

- Responsive standings and gameweek fixture UI implemented.
- Exact 2026/27 fixture schedule imported for all 38 gameweeks.
- Head-to-head, average matchup, median bonus, score difference, and form calculations implemented.
- Cloudflare Workers static-assets deployment configured through `wrangler.jsonc`.
- All 38 gameweeks are prefilled in `src/data/results.json` and are waiting for real results.
- The footer automatically displays the latest deployment time in IST.
- Waiver budget spent is shown by hovering or focusing a manager name; values are maintained in `src/data/waiverBudget.json`.
- League-wide season records are derived automatically from completed results, including H2H margins, records, rivalries, high scores, and consistency.
- Season records are presented as top-three rankings, with the leader emphasized in each category.
- Clicking a manager name opens a client-side manager journey with season summary and completed gameweek details.
- The manager detail view also shows six manager-specific records: biggest and narrowest H2H win (with opponent), H2H record, closest rivalry, highest weekly score, and scoring consistency.
- Waiver journey history (players released/bought per week and cumulative spend) is intentionally deferred until a lower-maintenance weekly data format is chosen.

## Current UI features

- The standings table shows the latest five completed results as manager form.
- Manager names can be hovered or focused to see waiver budget spent, and clicked to open their full journey.
- Manager journeys derive weekly score, opponent, result, points, median bonus, and season totals entirely in the browser.
- The homepage season-records section ranks the top three for biggest H2H win, narrowest H2H win, best H2H record, closest rivalry, highest weekly score, and most consistent scoring.

## League rules

- Each gameweek has two head-to-head matches and one player against the average score of the other four players.
- Head-to-head win: 3 points; draw: 1 point each; loss: 0 points.
- Every score strictly above the five-player weekly median earns a 1-point bonus.
- Standings rank by total points, then season points-for minus points-against, then total points-for.
- An unresolved tie after all tie-breakers shares the same sporting position.

## Update weekly scores

Edit only `src/data/results.json`. Find the required gameweek and replace its five `null` values with the real scores:

```json
{
  "gameweek": 1,
  "scores": {
    "divyansh": 72,
    "ishaan": 68,
    "avneesh": 55,
    "akshat": 55,
    "viren": 61
  }
}
```

Do not enter `0` for an unplayed week. Zero is treated as a real score; `null` means not played. A gameweek is included only when all five values are filled.

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

## Next session

Resume tomorrow with any requested UI refinements. Keep all stats client-derived from `results.json` and fixtures; update `waiverBudget.json` only when spending values change.
