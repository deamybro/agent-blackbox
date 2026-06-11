import Link from "next/link";
import { Activity, ArrowRight, BrainCircuit, FileSearch, Gauge, LockKeyhole, RadioTower } from "lucide-react";

const features = [
  [BrainCircuit, "Decision recorder", "Capture the full perception, reasoning, intent, risk, execution, and outcome loop."],
  [LockKeyhole, "Risk firewall", "Block unsafe leverage, stale signals, concentration, missing stops, and policy violations."],
  [Gauge, "Regime-aware scoring", "Adapt risk controls to trend, volatility, liquidity, ranging, and crisis conditions."],
  [Activity, "Simulation evidence", "Run repeatable agent cycles and build a persisted track record without risking capital."],
  [FileSearch, "Auditable by design", "Inspect every risk check, signal source, verdict explanation, and raw event payload."],
  [RadioTower, "Integration ready", "Wrap any agent with a small SDK and plug in Bitget Agent Hub-style signal adapters."]
];
export default function Landing() {
  return <main>
    <section className="hero"><div className="container">
      <span className="eyebrow">Trading infrastructure · Bitget AI Base Camp S1</span>
      <h1>A black box for<br/><span className="gradient">autonomous traders.</span></h1>
      <p>Agent BlackBox records every decision, checks risk before execution, blocks unsafe actions, and gives developers an auditable record of why an AI agent wanted to trade.</p>
      <div className="actions"><Link className="btn btn-primary" href="/dashboard">Launch dashboard <ArrowRight size={15}/></Link><Link className="btn" href="/dashboard?run=safe">Run sim agent</Link><Link className="btn" href="/audit">View audit logs</Link></div>
      <div className="proofbar"><div className="proof"><strong>15</strong><span>pre-trade risk checks</span></div><div className="proof"><strong>4</strong><span>explainable verdicts</span></div><div className="proof"><strong>SQLite</strong><span>persistent audit record</span></div><div className="proof"><strong>0</strong><span>live trades by default</span></div></div>
    </div></section>
    <section className="section"><div className="container"><div className="section-head"><span className="eyebrow">Control plane</span><h2>Observe every thought. Control every action.</h2><p className="muted">A serious safety and observability layer between an autonomous agent and the market.</p></div><div className="grid3">{features.map(([Icon,title,text])=><div className="card feature" key={title as string}><span className="iconbox"><Icon size={19}/></span><h3>{title as string}</h3><p>{text as string}</p></div>)}</div></div></section>
    <footer className="footer"><div className="container">Agent BlackBox · Simulation-first infrastructure for safer agentic trading.</div></footer>
  </main>;
}
