import crypto from "node:crypto";
import { createProposal } from "@/lib/agent/runner";
import { hydrateWithBitgetMarket } from "@/lib/bitget/market";
import { currentBalance, getDecisions, saveDecision } from "@/lib/db/store";
import { checkRisk } from "@/lib/risk/engine";
import { simulateTrade } from "@/lib/simulation/engine";
import type { Decision, Proposal } from "@/lib/types";

export function processProposal(proposal: Proposal): Decision {
  const recent = getDecisions(30);
  const balance = currentBalance();
  let peak = 100000;
  recent.forEach(d => { peak = Math.max(peak, d.balanceAfter); });
  const drawdown = peak ? (peak - balance) / peak : 0;
  const risk = checkRisk(proposal, { drawdown, recent });
  const id = crypto.randomUUID();
  const sim = simulateTrade(proposal, risk, balance, id);
  const decision: Decision = {
    ...proposal, id, timestamp: new Date().toISOString(), finalPositionSize: risk.finalPositionSize,
    marketRegime: risk.regime, riskVerdict: risk.verdict, riskScore: risk.score, riskReasons: risk.reasons,
    riskChecks: risk.checks, verdictExplanation: risk.explanation, executionMode: "PAPER",
    tradeStatus: risk.verdict === "BLOCK" ? "BLOCKED" : risk.verdict === "HUMAN_REVIEW" ? "REVIEW" : proposal.side === "HOLD" ? "HELD" : "EXECUTED",
    resultPnL: sim.pnl, exitPrice: sim.exitPrice, balanceAfter: sim.balanceAfter, postTradeReview: sim.review
  };
  return saveDecision(decision);
}

export function runCycle(scenario: "auto" | "safe" | "dangerous" = "auto") {
  return processProposal(createProposal(scenario));
}

export async function runMainnetPaperCycle(scenario: "auto" | "safe" | "dangerous" = "auto") {
  const proposal = createProposal(scenario);
  if (scenario === "dangerous") return processProposal(proposal);
  return processProposal(await hydrateWithBitgetMarket(proposal));
}
