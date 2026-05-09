# FIFA World Cup Betting Intelligence

Professional static dashboard and report for FIFA World Cup sports betting history, market patterns, and disciplined wager planning.

## What is included

- `index.html` - polished dashboard for GitHub Pages or any static server.
- `REPORT.md` - professional report with findings, methodology, and wager framework.
- `data/worldcup_odds_history.csv` - World Cup outright favorite and winner odds from 1966-2022.
- `data/worldcup_2022_odds.csv` - Qatar 2022 outright board and finish outcomes.
- `fifa_ranking_2022-10-06.csv` - FIFA ranking snapshot used for the 2022 case study.
- `assets/stadium-analytics-hero.png` - generated dashboard hero image.

## Run locally

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Core findings

- The pre-tournament favorite won 3 of 15 World Cups in the 1966-2022 odds sample.
- Most champions came from the short contender band, especially the 2nd-4th favorite range.
- True longshot outright wins were rare; longshots historically fit top-4, qualification, or knockout-progression markets better than single outright tickets.
- The 2022 case study shows why FIFA ranking and market price must be combined: Brazil was both world number one and favorite, but Argentina had the cleaner contender profile at a slightly better price.

## Sources

- The Guardian: https://www.theguardian.com/football/2022/dec/14/which-team-won-the-world-cup-with-the-longest-pre-tournament-odds
- Sports Illustrated 2022 odds: https://www.si.com/betting/2022/11/16/odds-groups-2022-world-cup
- FIFA champions archive: https://www.fifa.com/en/tournaments/mens/worldcup/articles/world-cup-champions-1982-2022-italy-argentina-germany-brazil-france-spain
- FIFA ranking release, October 2022: https://inside.fifa.com/en/fifa-world-ranking/men/news/en/news/brazil-pull-away-from-the-pack

## Responsible use

This project is analytical and educational. It is not betting advice, financial advice, or a promise of profit. Use fixed units, cap total exposure, and never bet money you cannot afford to lose.
