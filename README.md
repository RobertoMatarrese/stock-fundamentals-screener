# Stock Fundamentals Toolkit

Two tools over public-market fundamental data: a sortable screener across a
fixed basket of 12 large-cap tickers, and a retrieval-augmented chat that
answers questions about Apple's real financial statements from the last
10 years.

## Why this project exists

I'm transitioning from 17 years in project management into a hands-on,
AI-assisted developer role. This repo is independent, verifiable proof that I
can direct an AI coding agent (Claude Code) on a real codebase with
systematic review — not just accept generated output at face value.

Every commit in this repo's history was written by Claude Code and reviewed
by me before being committed. The milestone-by-milestone commit log is
intentional: it's meant to be read, not just skimmed.

The two halves of this repo intentionally show different things: the
screener is systematic data-pipeline engineering (typed contracts, mocked
tests, graceful degradation on missing data); the chat is a small
retrieval-augmented generation system (local retrieval, structured LLM
output, server-side abuse protection). Both stay on the same theme —
financial fundamentals, balance-sheet analysis, value investing — because
that's a genuine personal interest of mine, not a topic picked for
convenience. I can defend the domain logic in an interview, not just the
code.

## What it does

### 1. Fundamentals screener

Screens a fixed set of 12 tickers across 8 sectors (AAPL, MSFT, JNJ, UNH,
JPM, V, KO, PG, XOM, HON, HD, DIS) and displays, per ticker, in a sortable
table:

- P/E ratio, ROE, debt-to-equity (trailing twelve months)
- A DuPont decomposition of ROE — net margin × asset turnover × equity
  multiplier — so a high ROE driven by leverage reads differently from one
  driven by genuine margin/efficiency

Missing data from Finnhub (common on smaller or newer metrics) renders as
`—` instead of breaking the row or the request.

### 2. Apple fundamentals chat (RAG)

A chat, scoped to a single company (Apple), that answers free-form questions
about its fundamentals — growth, margins, cash flow, balance sheet,
dividends/buybacks, valuation vs. peers — using only real data from its last
10 years of 10-K filings. It does **not** cover live market price, news, or
trading, and says so explicitly in the UI.

Flow: a local keyword-matching retrieval step picks the 1-2 relevant data
chunks for the question (no vector DB, no external calls) → those chunks,
and only those, are sent to Gemini as context → Gemini returns structured
JSON (`{ testo, grafico }`) → the frontend renders the text and, when the
question implies a historical trend, a chart.

Capped at 2 questions per IP per day, enforced server-side.

## Architecture rationale

**Why retrieval instead of stuffing the whole dataset into every prompt.**
The full 10-year dataset is small enough to fit in a single prompt, but
that's not the point of building this as RAG: retrieval keeps the context
the model sees narrowly scoped to what the question actually needs, which
keeps answers grounded and makes it easy to reason about (and test) what
data can influence which answers. It's also a more honest demonstration of
the RAG pattern than a toy example would be.

**Why Gemini's free tier for the public-facing model call.** This repo is a
public portfolio piece with no rate control over who visits it. Using a paid
API for the part strangers can trigger means an unbounded cost surface tied
to traffic I don't control. Gemini's free tier (no card required, generous
daily quota) guarantees the public path costs $0 regardless of traffic.

**Why the rate limit is server-side, not just client-side JavaScript.** A
client-side check is trivially bypassed from the browser console — it
protects nothing. The limit exists to keep the shared free Gemini quota
available; only a check the client can't skip actually does that. It's
enforced with Upstash Redis (not an in-memory counter) because Vercel's
serverless functions are stateless between invocations and can run on
multiple concurrent instances — in-memory state doesn't reliably persist or
stay in sync across them.

**Why the Apple dataset is static instead of fetched per request.** Finnhub
free tier does expose 10 years of real reported financials (verified live
before building this), but re-fetching and re-parsing them on every chat
request would be wasteful and slower for no benefit — fundamentals don't
change intra-day. It's built once via `npm run build:dataset` into a
committed JSON file with an `as_of` date shown in the UI, and re-run
manually when it needs refreshing.

## Data notes

The Apple dataset comes from Finnhub's `stock/financials-reported` endpoint,
which returns real SEC 10-K line items (XBRL-tagged). Two things worth
knowing if you look at the raw JSON:

- XBRL concept names drift across years (e.g. a 2018 revenue-recognition
  standard change renamed the revenue concept). Each field is looked up
  through a list of known aliases, falling back to `null` if none match.
- AAPL did a 4-for-1 stock split on 2020-08-31. Each fiscal year's own 10-K
  reports EPS as filed at the time, so years before the split are on a
  different share-count basis than years after it. Pre-split EPS values are
  divided by 4 in the build script so the 10-year series is comparable
  end to end — without this, the raw data shows a fake ~3.6x "collapse" in
  FY2020 despite flat net income that year.

## Tech stack

- **Screener backend:** Python + FastAPI, [Finnhub](https://finnhub.io/)
  free-tier API
- **Chat backend:** Next.js API routes (no separate service), Google
  [Gemini](https://ai.google.dev/) free tier (`gemini-3-flash-preview`),
  [Upstash Redis](https://upstash.com/) for rate limiting
- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS +
  Recharts
- **Testing:** pytest (backend, all Finnhub calls mocked) + Vitest
  (retrieval module) — no live network calls in either test suite
- **CI:** GitHub Actions running both suites on every push/PR

## Running it locally

Requires Python 3.11+, Node 18+, a free
[Finnhub API key](https://finnhub.io/register), a free
[Gemini API key](https://aistudio.google.com/) (no card), and a free
[Upstash Redis database](https://upstash.com/) (no card).

**Backend (screener)**

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows PowerShell; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
cp .env.example .env        # then fill in FINNHUB_API_KEY
python -m uvicorn app.main:app --port 8000
```

**Frontend (screener + chat)** (separate terminal)

```bash
cd frontend
npm install
cp .env.example .env        # fill in GEMINI_API_KEY, UPSTASH_REDIS_REST_URL/TOKEN
npm run dev
```

Then open `http://localhost:3000` for the screener and `/chat` for the
Apple chat. The Apple dataset is already committed
(`frontend/data/apple-fundamentals.json`); to rebuild it from scratch:

```bash
cd frontend
FINNHUB_API_KEY=your_key npm run build:dataset
```

**Tests**

```bash
# Backend
cd backend
.venv\Scripts\Activate.ps1
pytest -v

# Frontend
cd frontend
npm run test
```

## Status

Both features work end-to-end locally against live data (Finnhub, Gemini,
Upstash) — screener table, RAG chat with charts, server-side rate limiting,
CI running both test suites. Not yet deployed — see the commit history for
what's left. A screenshot and live demo link will be added once that lands.

## Development process

Built AI-assisted with [Claude Code](https://claude.com/claude-code), under
continuous human review. Nothing here is generated-and-forgotten: every diff
was read, tested, and understood before being committed.

## License

MIT — see [LICENSE](LICENSE).
