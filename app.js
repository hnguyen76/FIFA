const files = {
  history: "data/worldcup_odds_history.csv",
  odds2022: "data/worldcup_2022_odds.csv",
  rankings: "fifa_ranking_2022-10-06.csv",
};

const state = {
  teams: [],
  filter: "all",
};

const teamAliases = new Map([
  ["Iran", "IR Iran"],
  ["South Korea", "Korea Republic"],
]);

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])),
  );
}

async function loadCSV(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return parseCSV(await response.text());
}

function fractionalToDecimal(odds) {
  const [numerator, denominator] = odds.split("/").map(Number);
  return numerator / denominator;
}

function fractionalToProbability(odds) {
  const decimalProfit = fractionalToDecimal(odds);
  return 1 / (decimalProfit + 1);
}

function americanToProbability(odds) {
  const value = Number(odds.replace("+", ""));
  if (value > 0) return 100 / (value + 100);
  return Math.abs(value) / (Math.abs(value) + 100);
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function formatProbability(value) {
  return `${(value * 100).toFixed(value < 0.1 ? 1 : 0)}%`;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const center = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[center] : (sorted[center - 1] + sorted[center]) / 2;
}

function setText(id, text) {
  document.getElementById(id).textContent = text;
}

function renderMetrics(history) {
  const favoriteWins = history.filter((row) => row.winner === row.favorite).length;
  const topFourWins = history.filter((row) => Number(row.winner_market_rank) <= 4).length;
  const winnerPrices = history.map((row) => fractionalToDecimal(row.winner_fractional_odds));
  const longest = history.reduce((best, row) =>
    fractionalToDecimal(row.winner_fractional_odds) > fractionalToDecimal(best.winner_fractional_odds)
      ? row
      : best,
  );

  setText("favoriteWinRate", formatPercent(favoriteWins / history.length));
  setText("medianWinnerOdds", `${median(winnerPrices).toFixed(1)}/1`);
  setText("longestWinnerOdds", longest.winner_fractional_odds);
  setText("longestWinnerTeam", `${longest.winner}, ${longest.year}`);
  setText("topFourWinnerRate", formatPercent(topFourWins / history.length));
}

function renderHistoryBars(history) {
  const container = document.getElementById("historyBars");
  const maxOdds = Math.max(...history.map((row) => fractionalToDecimal(row.winner_fractional_odds)));

  container.innerHTML = history
    .map((row) => {
      const odds = fractionalToDecimal(row.winner_fractional_odds);
      const height = Math.max(34, (odds / maxOdds) * 300);
      const className =
        row.winner === row.favorite ? "bar bar--favorite" : odds >= 10 ? "bar bar--longshot" : "bar";
      const title = `${row.year}: ${row.winner} won at ${row.winner_fractional_odds}; favorite ${row.favorite} finished ${row.favorite_result}.`;

      return `
        <div class="bar-item" title="${title}">
          <div class="${className}" style="height:${height}px"></div>
          <div class="bar-label">${row.winner} ${row.winner_fractional_odds}</div>
          <div class="bar-year">${row.year}</div>
        </div>
      `;
    })
    .join("");
}

function renderOddsBands(history) {
  const bands = [
    { label: "Favorite winners", test: (row) => row.winner === row.favorite },
    { label: "2nd-4th favorite winners", test: (row) => Number(row.winner_market_rank) >= 2 && Number(row.winner_market_rank) <= 4 },
    { label: "5th+ favorite winners", test: (row) => Number(row.winner_market_rank) >= 5 },
    { label: "Winner price 10/1 or longer", test: (row) => fractionalToDecimal(row.winner_fractional_odds) >= 10 },
  ];

  document.getElementById("oddsBands").innerHTML = bands
    .map((band) => {
      const hits = history.filter(band.test);
      return `
        <article class="odds-band">
          <strong>${hits.length}</strong>
          <span>${band.label}</span>
          <p>${formatPercent(hits.length / history.length)} of the 15-tournament sample</p>
        </article>
      `;
    })
    .join("");
}

function buildTeams(odds2022, rankings) {
  const rankByTeam = new Map(rankings.map((row) => [row.team, row]));
  return odds2022.map((team) => {
    const rankingName = teamAliases.get(team.team) ?? team.team;
    const ranking = rankByTeam.get(rankingName);
    const implied = americanToProbability(team.odds_american);
    const rank = ranking ? Number(ranking.rank) : null;
    const finishRank = Number(team.finish_rank);
    const price = Number(team.odds_american.replace("+", ""));
    const category =
      finishRank > 16 ? "miss" : price >= 3300 ? "longshot" : rank && rank <= 12 ? "contender" : "all";

    return {
      ...team,
      rank,
      points: ranking ? Number(ranking.points) : null,
      previousRank: ranking ? Number(ranking.previous_rank) : null,
      implied,
      category,
    };
  });
}

function signalForTeam(team) {
  if (team.finish === "Champion") return "Converted contender";
  if (team.finish_rank <= 4 && Number(team.odds_american.replace("+", "")) >= 3300) return "Longshot place value";
  if (team.rank && team.rank <= 10 && team.finish_rank > 16) return "Rank-price trap";
  if (team.rank && team.rank <= 12 && team.implied >= 0.05) return "Elite contender";
  if (Number(team.odds_american.replace("+", "")) >= 10000 && team.finish_rank <= 16) return "Deep-run underdog";
  if (team.finish_rank > 16) return "Group-stage miss";
  return "Market in range";
}

function renderTeamTable() {
  const rows = state.teams
    .filter((team) => state.filter === "all" || team.category === state.filter)
    .sort((a, b) => Number(a.odds_american.replace("+", "")) - Number(b.odds_american.replace("+", "")));

  document.getElementById("teamTable").innerHTML = rows
    .map((team) => `
      <tr>
        <td>
          <div class="team-cell">
            <span class="badge">${team.team_code}</span>
            <strong>${team.team}</strong>
          </div>
        </td>
        <td>${team.rank ? `#${team.rank}` : "n/a"}</td>
        <td><span class="pill">${team.odds_american}</span></td>
        <td>${formatProbability(team.implied)}</td>
        <td>${team.finish}</td>
        <td>${signalForTeam(team)}<br><small>${team.market_note}</small></td>
      </tr>
    `)
    .join("");
}

function bindFilters() {
  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach((node) => node.classList.remove("is-active"));
      button.classList.add("is-active");
      state.filter = button.dataset.filter;
      renderTeamTable();
    });
  });
}

async function init() {
  const [history, odds2022, rankings] = await Promise.all([
    loadCSV(files.history),
    loadCSV(files.odds2022),
    loadCSV(files.rankings),
  ]);

  renderMetrics(history);
  renderHistoryBars(history);
  renderOddsBands(history);
  state.teams = buildTeams(odds2022, rankings);
  bindFilters();
  renderTeamTable();
}

init().catch((error) => {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div class="error-banner">Dashboard data failed to load: ${error.message}</div>`,
  );
});
