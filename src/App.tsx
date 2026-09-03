import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, CircleHelp, Trophy } from "lucide-react";
import { fixtures } from "./data/fixtures";
import { players } from "./data/players";
import waiverBudget from "./data/waiverBudget.json";
import { results } from "./data/results";
import { buildStandings, getGameweekMatches, median } from "./lib/standings";
import { playerIds, type MatchResult, type OpponentId, type PlayerId } from "./types";

const number = (value?: number) => value === undefined ? "-" : Number.isInteger(value) ? value : value.toFixed(2);
const name = (id: OpponentId) => id === "average" ? "League Average" : players[id].name;

function App() {
  const completedWeeks = results.filter((result) => playerIds.every((id) => result.scores[id] !== undefined));
  const latestWeek = completedWeeks.at(-1)?.gameweek ?? 1;
  const lastUpdated = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(__BUILD_TIME__));
  const [selectedWeek, setSelectedWeek] = useState(latestWeek);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerId>();
  const standings = useMemo(() => buildStandings(results), []);
  const selectedResult = results.find((result) => result.gameweek === selectedWeek);
  const selectedFixture = fixtures.find((fixture) => fixture.gameweek === selectedWeek)!;
  const matches: MatchResult[] = selectedResult
    ? getGameweekMatches(selectedResult)
    : selectedFixture.matches.map((match) => ({ ...match }));
  const weekScores = selectedResult ? playerIds.map((id) => selectedResult.scores[id]).filter((x): x is number => x !== undefined) : [];
  const weekMedian = weekScores.length === 5 ? median(weekScores) : undefined;
  const selectedStanding = selectedPlayer ? standings.find((row) => row.player === selectedPlayer) : undefined;
  const playerJourney = selectedPlayer ? results.flatMap((result) => {
    const score = result.scores[selectedPlayer];
    const matches = getGameweekMatches(result);
    const match = matches.find((item) => item.home === selectedPlayer || item.away === selectedPlayer);
    if (score === undefined || !match || match.homeScore === undefined || match.awayScore === undefined || match.homePoints === undefined) return [];
    const points = match.home === selectedPlayer ? match.homePoints : match.awayPoints;
    const opponent = match.home === selectedPlayer ? match.away : match.home;
    const allScores = playerIds.map((id) => result.scores[id]);
    const weeklyMedian = allScores.every((value) => value !== undefined) ? median(allScores as number[]) : undefined;
    return [{ gameweek: result.gameweek, score, opponent, opponentScore: match.home === selectedPlayer ? match.awayScore : match.homeScore, result: points === 3 ? "W" : points === 1 ? "D" : "L", points, bonus: weeklyMedian !== undefined && score > weeklyMedian ? 1 : 0 }];
  }) : [];

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Auction Room home">
          <span className="brand-mark"><Trophy size={19} strokeWidth={2.4} /></span>
          <span><strong>Auction Room</strong><small>Fantasy League</small></span>
        </a>
        <div className="season"><span className="live-dot" /> 2026/27 Season</div>
      </header>

      <main id="top">
        <section className="league-heading">
          <div>
            <p className="eyebrow">Five managers. Thirty-eight gameweeks.</p>
            <h1>League table</h1>
          </div>
          <div className="week-status"><CalendarDays size={18} /> Gameweek {latestWeek} of 38</div>
        </section>

        <section className="table-section" aria-label="League standings">
          <div className="table-scroll">
            <table>
              <thead><tr><th>Pos</th><th>Manager</th><th>P</th><th>W</th><th>D</th><th>L</th><th>PF</th><th>PA</th><th>Diff</th><th><span className="tooltip-label">Median <CircleHelp size={13} /><span className="tooltip">One point for scoring above the weekly league median.</span></span></th><th>Pts</th><th>Form</th></tr></thead>
              <tbody>
                {standings.map((row, index) => {
                  const diff = row.pointsFor - row.pointsAgainst;
                  return <tr key={row.player}>
                    <td><span className="position">{index + 1}</span></td>
                    <td><div className="manager"><span className={`avatar avatar-${index}`}>{players[row.player].initials}</span><span className="manager-name"><button className="manager-link" onClick={() => setSelectedPlayer(row.player)}>{players[row.player].name}</button><span className="tooltip manager-tooltip">Waiver budget spent: {number(waiverBudget[row.player])}</span></span></div></td>
                    <td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td>
                    <td>{number(row.pointsFor)}</td><td>{number(row.pointsAgainst)}</td>
                    <td className={diff > 0 ? "positive" : diff < 0 ? "negative" : ""}>{diff > 0 ? "+" : ""}{number(diff)}</td>
                    <td>{row.medianBonus}</td><td><strong className="points">{row.totalPoints}</strong></td>
                    <td><div className="form">{row.form.slice(-5).map((result, i) => <span className={`form-${result}`} key={i}>{result}</span>)}</div></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          <div className="table-key"><span>Pts = H2H points + median bonus</span></div>
        </section>

        {selectedPlayer && selectedStanding && <section className="journey-section" aria-label={`${players[selectedPlayer].name} season journey`}>
          <div className="section-title-row"><div><p className="eyebrow">Manager journey</p><h2>{players[selectedPlayer].name}</h2></div><button className="back-button" onClick={() => setSelectedPlayer(undefined)}>Close</button></div>
          <div className="journey-summary"><span><strong>{selectedStanding.totalPoints}</strong> points</span><span>{selectedStanding.won}W {selectedStanding.drawn}D {selectedStanding.lost}L</span><span>{number(selectedStanding.pointsFor)} scored</span><span>Waiver spent: {number(waiverBudget[selectedPlayer])}</span></div>
          <div className="table-section"><div className="table-scroll"><table className="journey-table"><thead><tr><th>GW</th><th>Score</th><th>Opponent</th><th>Against</th><th>Result</th><th>Pts</th><th>Bonus</th></tr></thead><tbody>{playerJourney.map((week) => <tr key={week.gameweek}><td>{week.gameweek}</td><td><strong>{number(week.score)}</strong></td><td>{name(week.opponent)}</td><td>{number(week.opponentScore)}</td><td><span className={`journey-result result-${week.result}`}>{week.result}</span></td><td>{week.points}</td><td>{week.bonus ? "+1" : "-"}</td></tr>)}</tbody></table></div></div>
        </section>}

        <section className="gameweek-section">
          <div className="section-title-row">
            <div><p className="eyebrow">Fixtures & results</p><h2>Gameweek {selectedWeek}</h2></div>
            <div className="week-nav">
              <button aria-label="Previous gameweek" disabled={selectedWeek === 1} onClick={() => setSelectedWeek((week) => week - 1)}><ChevronLeft /></button>
              <select aria-label="Select gameweek" value={selectedWeek} onChange={(event) => setSelectedWeek(Number(event.target.value))}>
                {fixtures.map((week) => <option value={week.gameweek} key={week.gameweek}>GW {week.gameweek}</option>)}
              </select>
              <button aria-label="Next gameweek" disabled={selectedWeek === 38} onClick={() => setSelectedWeek((week) => week + 1)}><ChevronRight /></button>
            </div>
          </div>

          <div className="fixtures-grid">
            {matches.map((match, index) => {
              const complete = match.homeScore !== undefined && match.awayScore !== undefined;
              return <article className="fixture" key={`${match.home}-${match.away}`}>
                <div className="fixture-meta"><span>{index < 2 ? "Head-to-head" : "Average matchup"}</span><span>{complete ? "Final" : "Upcoming"}</span></div>
                <div className="team-line"><span>{name(match.home)}</span><strong>{complete ? number(match.homeScore) : "-"}</strong></div>
                <div className="team-line"><span>{name(match.away)}</span><strong>{complete ? number(match.awayScore) : "-"}</strong></div>
                {complete && <div className="result-note">{match.homeScore! > match.awayScore! ? name(match.home) : match.homeScore === match.awayScore ? "Draw" : name(match.away)} {match.homeScore === match.awayScore ? "" : "wins"}</div>}
              </article>;
            })}
          </div>

          <div className="median-strip">
            <div><span>Weekly median</span><strong>{number(weekMedian)}</strong></div>
            <p>{weekMedian === undefined ? "Scores have not been added for this gameweek." : "The two scores above this mark earn a +1 bonus."}</p>
          </div>
        </section>
      </main>

      <footer>
        <span>Auction Room Fantasy League</span>
        <span>{completedWeeks.length ? `Updated through GW ${latestWeek}` : "No results yet"} · Last updated {lastUpdated} IST</span>
      </footer>
    </div>
  );
}

export default App;
