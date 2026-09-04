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

function getSeasonRecords(completedWeeks: typeof results) {
  const directMatches = completedWeeks.flatMap((result) => getGameweekMatches(result)
    .filter((match) => match.away !== "average" && match.homeScore !== undefined && match.awayScore !== undefined)
    .map((match) => ({ ...match, gameweek: result.gameweek, away: match.away as PlayerId, margin: Math.abs(match.homeScore! - match.awayScore!) })));
  const wins = directMatches.filter((match) => match.margin > 0).sort((a, b) => b.margin - a.margin);
  const records = new Map<PlayerId, { won: number; drawn: number; lost: number }>(playerIds.map((id) => [id, { won: 0, drawn: 0, lost: 0 }]));
  const rivalries = new Map<string, { players: [PlayerId, PlayerId]; wins: [number, number]; draws: number; margin: number }>();

  directMatches.forEach((match) => {
    const home = records.get(match.home)!;
    const away = records.get(match.away)!;
    if (match.homeScore! > match.awayScore!) { home.won += 1; away.lost += 1; }
    else if (match.homeScore! < match.awayScore!) { away.won += 1; home.lost += 1; }
    else { home.drawn += 1; away.drawn += 1; }

    const pair = [match.home, match.away].sort() as [PlayerId, PlayerId];
    const key = pair.join(":");
    const rivalry = rivalries.get(key) ?? { players: pair, wins: [0, 0] as [number, number], draws: 0, margin: 0 };
    if (match.homeScore === match.awayScore) rivalry.draws += 1;
    else rivalry.wins[match.homeScore! > match.awayScore! ? pair.indexOf(match.home) : pair.indexOf(match.away)] += 1;
    rivalry.margin += match.margin;
    rivalries.set(key, rivalry);
  });

  const rankedRecords = [...records.entries()].filter(([, record]) => record.won + record.drawn + record.lost > 0).sort((a, b) => {
    const aPlayed = a[1].won + a[1].drawn + a[1].lost;
    const bPlayed = b[1].won + b[1].drawn + b[1].lost;
    return (b[1].won * 3 + b[1].drawn) / bPlayed - (a[1].won * 3 + a[1].drawn) / aPlayed || b[1].won - a[1].won;
  });
  const rankedRivalries = [...rivalries.values()].sort((a, b) => Math.abs(a.wins[0] - a.wins[1]) - Math.abs(b.wins[0] - b.wins[1]) || a.margin - b.margin);
  const weeklyScores = completedWeeks.flatMap((result) => playerIds.map((player) => ({ player, gameweek: result.gameweek, score: result.scores[player]! })));
  const highestScores = [...weeklyScores].sort((a, b) => b.score - a.score);
  const consistency = playerIds.map((player) => {
    const scores = completedWeeks.map((week) => week.scores[player]!);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const deviation = Math.sqrt(scores.reduce((sum, score) => sum + (score - average) ** 2, 0) / scores.length);
    return { player, deviation };
  }).sort((a, b) => a.deviation - b.deviation);
  const matchLabel = (match?: typeof directMatches[number]) => match ? `${players[match.homeScore! > match.awayScore! ? match.home : match.away].name} by ${number(match.margin)} vs ${players[match.homeScore! > match.awayScore! ? match.away : match.home].name} (GW ${match.gameweek})` : "Awaiting a win";

  return [
    { label: "Biggest H2H win", entries: wins.slice(0, 3).map(matchLabel), empty: "Direct matchups only" },
    { label: "Narrowest H2H win", entries: [...wins].reverse().slice(0, 3).map(matchLabel), empty: "Direct matchups only" },
    { label: "Best H2H record", entries: rankedRecords.slice(0, 3).map(([player, record]) => `${players[player].name} - ${record.won}W ${record.drawn}D ${record.lost}L`), empty: "Awaiting results" },
    { label: "Closest rivalry", entries: rankedRivalries.slice(0, 3).map((rivalry) => `${players[rivalry.players[0]].name} vs ${players[rivalry.players[1]].name} - ${rivalry.wins[0]}-${rivalry.wins[1]}${rivalry.draws ? `, ${rivalry.draws}D` : ""}`), empty: "Awaiting results" },
    { label: "Highest weekly score", entries: highestScores.slice(0, 3).map((score) => `${players[score.player].name} - ${number(score.score)} (GW ${score.gameweek})`), empty: "Awaiting results" },
    { label: "Most consistent", entries: completedWeeks.length > 1 ? consistency.slice(0, 3).map((item) => `${players[item.player].name} - ${number(item.deviation)} deviation`) : [], empty: "Needs two gameweeks" },
  ];
}

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
  const seasonRecords = useMemo(() => getSeasonRecords(completedWeeks), [completedWeeks.length]);
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
  const managerStats = selectedPlayer ? (() => {
    const direct = completedWeeks.flatMap((result) => getGameweekMatches(result).filter((match) => match.away !== "average" && (match.home === selectedPlayer || match.away === selectedPlayer) && match.homeScore !== undefined && match.awayScore !== undefined).map((match) => ({ ...match, gameweek: result.gameweek, margin: Math.abs(match.homeScore! - match.awayScore!) })));
    const wins = direct.filter((match) => (match.home === selectedPlayer ? match.homeScore! > match.awayScore! : match.awayScore! > match.homeScore!));
    const rivalries = new Map<PlayerId, { opponent: PlayerId; wins: number; losses: number; draws: number; margin: number }>();
    direct.forEach((match) => { const opponent = (match.home === selectedPlayer ? match.away : match.home) as PlayerId; const item = rivalries.get(opponent) ?? { opponent, wins: 0, losses: 0, draws: 0, margin: 0 }; const score = match.home === selectedPlayer ? match.homeScore! : match.awayScore!; const other = match.home === selectedPlayer ? match.awayScore! : match.homeScore!; score > other ? item.wins++ : score < other ? item.losses++ : item.draws++; item.margin += Math.abs(score - other); rivalries.set(opponent, item); });
    const scores = completedWeeks.map((week) => week.scores[selectedPlayer]!);
    const average = scores.reduce((sum, score) => sum + score, 0) / (scores.length || 1);
    const deviation = scores.length > 1 ? Math.sqrt(scores.reduce((sum, score) => sum + (score - average) ** 2, 0) / scores.length) : undefined;
    return { biggest: wins.sort((a, b) => b.margin - a.margin)[0], narrowest: [...wins].sort((a, b) => a.margin - b.margin)[0], record: direct.reduce((r, m) => { const s = m.home === selectedPlayer ? m.homeScore! : m.awayScore!; const o = m.home === selectedPlayer ? m.awayScore! : m.homeScore!; s > o ? r.w++ : s < o ? r.l++ : r.d++; return r; }, { w: 0, d: 0, l: 0 }), rivalry: [...rivalries.values()].sort((a, b) => Math.abs(a.wins - a.losses) - Math.abs(b.wins - b.losses) || a.margin - b.margin)[0], highest: scores.length ? Math.max(...scores) : undefined, deviation };
  })() : undefined;

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

        <section className="records-section" aria-label="Season records">
          <div className="records-heading"><p className="eyebrow">Across the league</p><h2>Season records</h2></div>
          <div className="records-grid">{seasonRecords.map((record) => <article className="record" key={record.label}><span>{record.label}</span>{record.entries.length ? <ol>{record.entries.map((entry, index) => <li className={index === 0 ? "record-winner" : ""} key={entry}><b>{entry}</b></li>)}</ol> : <small>{record.empty}</small>}</article>)}</div>
        </section>

        {selectedPlayer && selectedStanding && managerStats && <section className="journey-section" aria-label={`${players[selectedPlayer].name} season journey`}>
          <div className="section-title-row"><div><p className="eyebrow">Manager journey</p><h2>{players[selectedPlayer].name}</h2></div><button className="back-button" onClick={() => setSelectedPlayer(undefined)}>Close</button></div>
          <div className="journey-summary"><span><strong>{selectedStanding.totalPoints}</strong> points</span><span>{selectedStanding.won}W {selectedStanding.drawn}D {selectedStanding.lost}L</span><span>{number(selectedStanding.pointsFor)} scored</span><span>Waiver spent: {number(waiverBudget[selectedPlayer])}</span></div>
          <div className="manager-records"><article><span>Biggest H2H win</span><b>{managerStats.biggest ? `${number(managerStats.biggest.margin)} vs ${name(managerStats.biggest.home === selectedPlayer ? managerStats.biggest.away : managerStats.biggest.home)}` : "Awaiting a win"}</b></article><article><span>Narrowest H2H win</span><b>{managerStats.narrowest ? `${number(managerStats.narrowest.margin)} vs ${name(managerStats.narrowest.home === selectedPlayer ? managerStats.narrowest.away : managerStats.narrowest.home)}` : "Awaiting a win"}</b></article><article><span>H2H record</span><b>{managerStats.record.w}W {managerStats.record.d}D {managerStats.record.l}L</b></article><article><span>Closest rivalry</span><b>{managerStats.rivalry ? `${name(managerStats.rivalry.opponent)} ${managerStats.rivalry.wins}-${managerStats.rivalry.losses}${managerStats.rivalry.draws ? `, ${managerStats.rivalry.draws}D` : ""}` : "Awaiting results"}</b></article><article><span>Highest weekly score</span><b>{managerStats.highest === undefined ? "Awaiting results" : number(managerStats.highest)}</b></article><article><span>Consistency</span><b>{managerStats.deviation === undefined ? "Needs two gameweeks" : `${number(managerStats.deviation)} deviation`}</b></article></div>
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
