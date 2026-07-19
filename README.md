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
JPM, V, KO, PG, XOM, HON, HD, DIS) and displays, per ticker, in a sortable
table:

- P/E ratio (trailing twelve months)
- Return on equity (trailing twelve months)
- Debt-to-equity ratio
- A DuPont decomposition of ROE — net margin × asset turnover × equity
  multiplier — so a high ROE driven by leverage reads differently from one
  driven by genuine margin/efficiency

Missing data from Finnhub (common on smaller or newer metrics) renders as
`—` instead of breaking the row or the request.

## Tech stack

- **Backend:** Python + FastAPI
- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Data source:** [Finnhub](https://finnhub.io/) free-tier API (basic
  financials endpoint)
- **Testing:** pytest, with all external API calls mocked — no live network
  calls in the test suite or CI
- **CI:** GitHub Actions running the test suite on every push/PR

## Running it locally

Requires Python 3.11+, Node 18+, and a free [Finnhub API key](https://finnhub.io/register).

**Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows PowerShell; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
cp .env.example .env        # then fill in FINNHUB_API_KEY
python -m uvicorn app.main:app --port 8000
```

**Frontend** (separate terminal)

```bash
cd frontend
npm install
cp .env.example .env.local  # defaults to http://localhost:8000, adjust if needed
npm run dev
```

Then open `http://localhost:3000`. The raw API is at
`http://localhost:8000/api/screener`.

**Tests**

```bash
cd backend
.venv\Scripts\Activate.ps1
pytest -v
```

## Status

Backend and frontend are wired end-to-end against live Finnhub data, with a
sortable table, loading/error states, and CI running the test suite on every
push. Not yet deployed — see the commit history for what's left. A
screenshot and live demo link will be added once that lands.

## Development process

Built AI-assisted with [Claude Code](https://claude.com/claude-code), under
continuous human review. Nothing here is generated-and-forgotten: every diff
was read, tested, and understood before being committed.

## License

MIT — see [LICENSE](LICENSE).
