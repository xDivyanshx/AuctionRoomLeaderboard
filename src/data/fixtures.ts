import type { Fixture, GameweekFixture } from "../types";

// Replace these five rounds with your real schedule if its cycle differs.
const cycle: Fixture[][] = [
  [
    { home: "divyansh", away: "ishaan" },
    { home: "avneesh", away: "akshat" },
    { home: "viren", away: "average" },
  ],
  [
    { home: "divyansh", away: "avneesh" },
    { home: "akshat", away: "viren" },
    { home: "ishaan", away: "average" },
  ],
  [
    { home: "divyansh", away: "akshat" },
    { home: "ishaan", away: "viren" },
    { home: "avneesh", away: "average" },
  ],
  [
    { home: "divyansh", away: "viren" },
    { home: "ishaan", away: "avneesh" },
    { home: "akshat", away: "average" },
  ],
  [
    { home: "ishaan", away: "akshat" },
    { home: "avneesh", away: "viren" },
    { home: "divyansh", away: "average" },
  ],
];

export const fixtures: GameweekFixture[] = Array.from({ length: 38 }, (_, index) => ({
  gameweek: index + 1,
  matches: cycle[index % cycle.length],
}));
