# Agent BlackBox

Agent BlackBox is a production-minded risk firewall, flight recorder, and observability dashboard for autonomous Bitget trading agents. It records the full decision loop, applies deterministic pre-trade risk controls, paper-trades permitted actions against real Bitget mainnet market data, and persists an auditable evidence trail.

Built for **Bitget AI Base Camp Hackathon S1**, Trading Infrastructure track.

## Why it exists

Autonomous agents can read many signals and act quickly, but operators still need to answer: Why did it trade? Did it follow policy? What was blocked? Agent BlackBox sits between agent intent and execution to make those answers inspectable.

## Working features

- 15 explainable pre-trade checks and `ALLOW`, `REDUCE_SIZE`, `HUMAN_REVIEW`, or `BLOCK` verdicts
- Deterministic regime detection across bull, bear, range, volatility, liquidity, crisis, and unclear markets
- Persistent SQLite decision ledger and portfolio snapshots using Node's built-in SQLite driver
- Autonomous BTC Momentum Agent using real Bitget mainnet ticker/funding data, plus a dangerous ETH leverage stress test
- Simulated execution, PnL, balance, win rate, and drawdown tracking
- Landing page, operations dashboard, audit filters, decision evidence pages, reports, and SDK page
- JSON and CSV audit exports
- Validated server APIs and Bitget integration boundary
- Permanently paper-only execution; no live order-placement function exists

## Architecture

```text
Signal adapters -> Agent proposal -> Regime classifier -> Risk firewall
                                                       |
                  Audit SQLite <- Decision recorder <- verdict
                                                       |
                              permitted -> Sim engine -> Portfolio snapshots
                                                       |
                                  APIs -> Dashboard / Audit / Reports / SDK
```

## Local setup

Requires Node.js 22.5+ because the persistent store uses `node:sqlite`.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Use **Run cycle** for an autonomous cycle, **Run 10** for a batch, or **Stress test** to prove the firewall blocks a dangerous ETH proposal.

## Environment variables

Copy `.env.example` and supply credentials only when available. Secrets are server-side and never hardcoded.

Bitget API keys are optional and used only to display read-only account status. Public mainnet market data works without keys. Agent BlackBox contains no live order API call and all permitted trades are recorded as paper executions.

## APIs

- `POST /api/agent/run-cycle` body: `{ "scenario": "auto" | "safe" | "dangerous" }`
- `POST /api/agent/run-batch` body: `{ "count": 10 }`
- `POST /api/risk/check`
- `GET /api/decisions`, `GET /api/decisions/:id`, `GET /api/audit`
- `GET /api/metrics`, `GET /api/report`, `POST /api/export`

## Bitget integration

`lib/bitget/client.ts` connects to Bitget V2 mainnet public market data and optionally reads authenticated futures account status. `lib/bitget/market.ts` converts real ticker, funding, volume, range, and price data into the agent's market context. There is deliberately no order-placement method.

## Tests and production build

```bash
npm test
npm run build
npm start
```

## Free deployment

The app supports a no-card serverless deployment using **Vercel Hobby + Neon Free Postgres**:

1. Create a free Neon project and copy its Postgres connection string.
2. Import this repository into Vercel.
3. Add `DATABASE_URL` with the Neon connection string.
4. Add `NEXT_PUBLIC_APP_URL` with the Vercel project URL.
5. Deploy. Tables are created automatically on first request.

Local development continues to use SQLite when `DATABASE_URL=data/blackbox.db`.

## Three-minute demo

1. Open the landing page and launch the dashboard.
2. Run a safe sim cycle and open its decision detail.
3. Show reasoning, signals, risk checks, and simulated outcome.
4. Run the dangerous ETH stress test and show the `BLOCK` verdict.
5. Open Audit Logs, export a report, and finish on Developer SDK.

## Safety disclaimer

This software defaults to simulation and is not financial advice. Live trading is disabled and no production order placement is implemented.
