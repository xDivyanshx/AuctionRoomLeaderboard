export const playerIds = ["divyansh", "ishaan", "avneesh", "akshat", "viren"] as const;

export type PlayerId = (typeof playerIds)[number];
export type OpponentId = PlayerId | "average";

export interface Fixture {
  home: PlayerId;
  away: OpponentId;
}

export interface GameweekFixture {
  gameweek: number;
  matches: Fixture[];
}

export type WeeklyScores = Partial<Record<PlayerId, number>>;

export interface GameweekResult {
  gameweek: number;
  scores: WeeklyScores;
}

export interface MatchResult extends Fixture {
  homeScore?: number;
  awayScore?: number;
  homePoints?: number;
  awayPoints?: number;
}

export interface Standing {
  player: PlayerId;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  h2hPoints: number;
  medianBonus: number;
  totalPoints: number;
  form: Array<"W" | "D" | "L">;
}
