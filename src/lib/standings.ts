import { playerIds, type GameweekResult, type MatchResult, type PlayerId, type Standing } from "../types";
import { fixtures } from "../data/fixtures";

export function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function getAverageOpponentScore(scores: GameweekResult["scores"], player: PlayerId) {
  const opponents = playerIds.filter((id) => id !== player).map((id) => scores[id]);
  if (opponents.some((score) => score === undefined)) return undefined;
  return opponents.reduce<number>((sum, score) => sum + (score ?? 0), 0) / opponents.length;
}

export function getGameweekMatches(result: GameweekResult): MatchResult[] {
  const schedule = fixtures.find((week) => week.gameweek === result.gameweek);
  if (!schedule) return [];

  return schedule.matches.map((match) => {
    const homeScore = result.scores[match.home];
    const awayScore = match.away === "average"
      ? getAverageOpponentScore(result.scores, match.home)
      : result.scores[match.away];

    if (homeScore === undefined || awayScore === undefined) return { ...match, homeScore, awayScore };
    if (homeScore > awayScore) return { ...match, homeScore, awayScore, homePoints: 3, awayPoints: 0 };
    if (homeScore < awayScore) return { ...match, homeScore, awayScore, homePoints: 0, awayPoints: 3 };
    return { ...match, homeScore, awayScore, homePoints: 1, awayPoints: 1 };
  });
}

export function buildStandings(results: GameweekResult[]): Standing[] {
  const table = new Map<PlayerId, Standing>(
    playerIds.map((player) => [player, {
      player, played: 0, won: 0, drawn: 0, lost: 0, pointsFor: 0, pointsAgainst: 0,
      h2hPoints: 0, medianBonus: 0, totalPoints: 0, form: [],
    }]),
  );

  [...results].sort((a, b) => a.gameweek - b.gameweek).forEach((result) => {
    const allScores = playerIds.map((id) => result.scores[id]);
    if (allScores.some((score) => score === undefined)) return;
    const weeklyMedian = median(allScores as number[]);

    playerIds.forEach((player) => {
      if ((result.scores[player] ?? 0) > weeklyMedian) table.get(player)!.medianBonus += 1;
    });

    getGameweekMatches(result).forEach((match) => {
      if (match.homeScore === undefined || match.awayScore === undefined || match.homePoints === undefined) return;
      const home = table.get(match.home)!;
      home.played += 1;
      home.pointsFor += match.homeScore;
      home.pointsAgainst += match.awayScore;
      home.h2hPoints += match.homePoints;
      if (match.homePoints === 3) { home.won += 1; home.form.push("W"); }
      else if (match.homePoints === 1) { home.drawn += 1; home.form.push("D"); }
      else { home.lost += 1; home.form.push("L"); }

      if (match.away !== "average") {
        const away = table.get(match.away)!;
        away.played += 1;
        away.pointsFor += match.awayScore;
        away.pointsAgainst += match.homeScore;
        away.h2hPoints += match.awayPoints ?? 0;
        if (match.awayPoints === 3) { away.won += 1; away.form.push("W"); }
        else if (match.awayPoints === 1) { away.drawn += 1; away.form.push("D"); }
        else { away.lost += 1; away.form.push("L"); }
      }
    });
  });

  return [...table.values()]
    .map((standing) => ({ ...standing, totalPoints: standing.h2hPoints + standing.medianBonus }))
    .sort((a, b) =>
      b.totalPoints - a.totalPoints ||
      (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst) ||
      b.pointsFor - a.pointsFor,
    );
}
