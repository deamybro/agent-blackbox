const example=`import { blackbox } from "@/lib/sdk/blackbox"

const decision = await agent.decide(marketData)

const verdict = await blackbox.check({
  agentName: "BTC Momentum Agent",
  symbol: "BTCUSDT",
  side: "LONG",
  proposedPositionSize: 0.20,
  leverage: 10,
  confidence: 0.72,
  reasoning: decision.reasoning,
  signals: decision.signals,
  market: marketData
})

if (verdict.verdict === "ALLOW" ||
    verdict.verdict === "REDUCE_SIZE") {
  await blackbox.record(decision)
}`;
const api=`POST /api/risk/check
POST /api/agent/run-cycle
POST /api/agent/run-batch
GET  /api/decisions
GET  /api/decisions/:id
GET  /api/audit
GET  /api/metrics
GET  /api/report
POST /api/export`;
export default function SDK(){return <main className="appmain"><div className="container"><div className="topline"><div><span className="eyebrow">Developer platform</span><h1>Wrap any trading agent.</h1><p className="muted">One integration boundary between autonomous reasoning and paper execution.</p></div></div><div className="detail-grid"><div className="card"><div className="card-title"><h3>TypeScript SDK</h3><span className="status">internal module</span></div><div className="code">{example}</div></div><div className="stack"><div className="card"><div className="card-title"><h3>HTTP API</h3></div><div className="code">{api}</div></div><div className="card"><h3>Safety defaults</h3><p className="muted">Agent BlackBox consumes real Bitget mainnet market data but permanently records paper executions only. The codebase contains no live order-placement function.</p></div></div></div></div></main>}
