import rawResults from "./results.json";
import { playerIds, type GameweekResult, type PlayerId } from "../types";

type RawResult = {
  gameweek: number;
  scores: Record<PlayerId, number | null>;
};

// JSON uses null for weeks that have not been played. Keep 0 available as a valid score.
export const results: GameweekResult[] = (rawResults as RawResult[]).map((result) => ({
  gameweek: result.gameweek,
  scores: Object.fromEntries(
    playerIds
      .filter((player) => result.scores[player] !== null)
      .map((player) => [player, result.scores[player]]),
  ),
}));
