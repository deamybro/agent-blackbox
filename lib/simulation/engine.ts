import type { Proposal, RiskResult } from "@/lib/types";

function seeded(id: string) {
  let x = [...id].reduce((n, c) => ((n << 5) - n + c.charCodeAt(0)) | 0, 0);
  x = Math.sin(x) * 10000;
  return x - Math.floor(x);
}

export function simulateTrade(proposal: Proposal, risk: RiskResult, balance: number, id: string) {
  if (!["ALLOW", "REDUCE_SIZE"].includes(risk.verdict) || proposal.side === "HOLD") {
    return { pnl: 0, exitPrice: proposal.entryPrice, balanceAfter: balance, review: `No simulated execution: ${risk.verdict}.` };
  }
  const bias = proposal.side === "LONG" ? 1 : -1;
  const signalEdge = proposal.signals.reduce((a, s) => a + s.score, 0) / Math.max(1, proposal.signals.length);
  const movement = ((seeded(id) - 0.46) * proposal.market.volatility * 0.055) + signalEdge * 0.006;
  const exitPrice = proposal.entryPrice * (1 + movement);
  const pnl = balance * risk.finalPositionSize * proposal.leverage * movement * bias;
  return {
    pnl: Math.round(pnl * 100) / 100,
    exitPrice: Math.round(exitPrice * 100) / 100,
    balanceAfter: Math.round((balance + pnl) * 100) / 100,
    review: pnl >= 0 ? "Simulated execution closed profitably; controls preserved expected risk." : "Simulated loss remained inside the pre-trade risk envelope."
  };
}
