# Stock Fundamentals Screener

A full-stack web app that screens a fixed basket of large-cap stocks on core
value and quality fundamentals — P/E ratio, return on equity, and
debt-to-equity — pulled live from a public market data API.

## Why this project exists

I'm transitioning from 17 years in project management into a hands-on,
AI-assisted developer role. This repo is independent, verifiable proof that I
can direct an AI coding agent (Claude Code) on a real codebase with
systematic review — not just accept generated output at face value.

Every commit in this repo's history was written by Claude Code and reviewed
by me before being committed. The milestone-by-milestone commit log is
intentional: it's meant to be read, not just skimmed.

The domain — value investing and balance-sheet analysis — is a genuine
personal interest of mine, not a topic picked for convenience. That's on
purpose: I can defend the logic in an interview, not just the code.

## What it does

Screens a fixed set of 12 tickers across 8 sectors (AAPL, MSFT, JNJ, UNH,
JPM, V, KO, PG, XOM, HON, HD, DIS) and displays, per ticker:

- P/E ratio (trailing twelve months)
- Return on equity (trailing twelve months)
- Debt-to-equity ratio

in a sortable table, so a viewer can quickly compare quality/value profiles
across sectors.

## Tech stack

- **Backend:** Python + FastAPI
- **Frontend:** Next.js (App Router) + React
- **Data source:** [Finnhub](https://finnhub.io/) free-tier API (basic
  financials endpoint)
- **Testing:** pytest, with all external API calls mocked — no live network
  calls in the test suite or CI
- **CI:** GitHub Actions running the test suite on every push/PR

## Status

🚧 Work in progress. See commit history for build order — this README will
be updated with setup instructions, a live demo link, and a screenshot as
each milestone lands.

## Development process

Built AI-assisted with [Claude Code](https://claude.com/claude-code), under
continuous human review. Nothing here is generated-and-forgotten: every diff
was read, tested, and understood before being committed.

## License

MIT — see [LICENSE](LICENSE).
