# Agent Handoff

## Project purpose

This repository is a frontend-only fantasy league leaderboard for five managers: Divyansh, Ishaan, Avneesh, Akshat, and Viren. It covers 38 EPL-style gameweeks and is deployed as a Cloudflare Worker with static assets.

## Current state

- React, TypeScript, and Vite application is implemented.
- Exact fixtures from `EPL_H2H_Fixtures_2026_27.pdf` have been transcribed into `src/data/fixtures.ts`.
- The source PDF was intentionally removed after verification to keep the repository clean.
- `src/data/results.json` contains all 38 gameweeks prefilled with `null` scores.
- Cloudflare deployment is configured in `wrangler.jsonc`.
- The footer timestamp is injected at build time through `__BUILD_TIME__` in `vite.config.ts` and displayed in IST.
- Manager names expose waiver budget spent on hover/focus, sourced from `src/data/waiverBudget.json`.

## Competition rules

- Players: `divyansh`, `ishaan`, `avneesh`, `akshat`, `viren`.
- Each week: two direct head-to-head matches and one player versus the average of the other four scores.
- Win = 3 H2H points, draw = 1, loss = 0.
- A score strictly above that week's five-player median earns 1 bonus point.
- Total standings points = H2H points + median bonuses.
- Tie-breakers: score difference (`pointsFor - pointsAgainst`), then `pointsFor`; otherwise share the sporting position.
- Preserve fractional average scores without premature rounding.

## Important files

- `src/data/fixtures.ts`: exact 38-gameweek schedule.
- `src/data/results.json`: only file normally edited after each gameweek.
- `src/data/results.ts`: adapter that converts JSON `null` values into incomplete scores for the app.
- `src/lib/standings.ts`: scoring and ranking logic.
- `src/App.tsx`: leaderboard and gameweek UI.
- `wrangler.jsonc`: Cloudflare static-assets deployment.
- `README.md`: user-facing status and operating instructions.

## Working rules

- Keep the repository frontend-only unless the owner explicitly changes the requirement.
- Do not commit secrets, generated build output, dependency folders, Wrangler state, or source fixture PDFs.
- Run `npm run build` after code or data changes.
- For deployment changes, also run `npx wrangler deploy --dry-run`.
- Update `README.md` and this file after each meaningful milestone or rule change.
- Coding agents may edit and stage changes only. The owner performs `git commit` and `git push`.
- Preserve user changes and avoid unrelated refactors.

## Next action

Wait for the owner to provide the five real GW1 fantasy scores and current waiver-budget values. Replace the relevant values in `src/data/results.json` and `src/data/waiverBudget.json`, verify the calculated match results and median bonuses, build, update milestone notes, and stage the changes for owner review.
