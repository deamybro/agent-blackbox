import { classifyRegime } from "@/lib/regime/classifier";
import type { Decision, Proposal, RiskCheck, RiskResult } from "@/lib/types";

type PortfolioState = { drawdown: number; recent: Decision[] };

export function checkRisk(p: Proposal, state: PortfolioState = { drawdown: 0, recent: [] }): RiskResult {
  const checks: RiskCheck[] = [];
  const add = (name: string, status: RiskCheck["status"], score: number, explanation: string) => checks.push({ name, status, score, explanation });
  const regime = classifyRegime(p.market);
  const recent = state.recent.filter(d => Date.now() - new Date(d.timestamp).getTime() < 60 * 60 * 1000);
  const sameAsset = recent.filter(d => d.symbol === p.symbol && d.tradeStatus === "EXECUTED");
  const losses = state.recent.slice(0, 4).filter(d => d.resultPnL < 0).length;
  const signalSpread = Math.max(...p.signals.map(s => s.score), 0) - Math.min(...p.signals.map(s => s.score), 0);
  const stale = p.signals.some(s => s.freshness > 45);
  const reward = p.takeProfit ? Math.abs(p.takeProfit - p.entryPrice) : 0;
  const risk = p.stopLoss ? Math.abs(p.entryPrice - p.stopLoss) : 0;

  add("Position size", p.proposedPositionSize > 0.25 ? "FAIL" : p.proposedPositionSize > 0.12 ? "WARN" : "PASS", p.proposedPositionSize > 0.25 ? 30 : p.proposedPositionSize > 0.12 ? 15 : 0, `Proposed allocation is ${(p.proposedPositionSize * 100).toFixed(1)}%.`);
  add("Leverage", p.leverage > 15 ? "FAIL" : p.leverage > 7 ? "WARN" : "PASS", p.leverage > 15 ? 35 : p.leverage > 7 ? 15 : 0, `${p.leverage}x leverage ${p.leverage > 15 ? "exceeds" : "is within"} policy.`);
  add("Stop loss", !p.stopLoss ? "FAIL" : "PASS", !p.stopLoss ? 30 : 0, p.stopLoss ? "Protective stop is present." : "No protective stop was supplied.");
  add("Risk/reward", risk && reward / risk >= 1.25 ? "PASS" : "WARN", risk && reward / risk >= 1.25 ? 0 : 12, risk ? `Risk/reward ratio is ${(reward / risk).toFixed(2)}.` : "Risk/reward cannot be calculated.");
  add("Volatility", p.market.volatility > 0.75 ? "FAIL" : p.market.volatility > 0.55 ? "WARN" : "PASS", p.market.volatility > 0.75 ? 20 : p.market.volatility > 0.55 ? 10 : 0, `Volatility index is ${(p.market.volatility * 100).toFixed(0)}.`);
  add("Signal agreement", signalSpread > 1.4 ? "WARN" : "PASS", signalSpread > 1.4 ? 12 : 0, signalSpread > 1.4 ? "Signals strongly conflict." : "Signals are sufficiently aligned.");
  add("Signal freshness", stale ? "WARN" : "PASS", stale ? 10 : 0, stale ? "At least one signal is stale." : "Signal data is fresh.");
  add("Drawdown", state.drawdown > 0.1 ? "FAIL" : state.drawdown > 0.06 ? "WARN" : "PASS", state.drawdown > 0.1 ? 25 : state.drawdown > 0.06 ? 12 : 0, `Portfolio drawdown is ${(state.drawdown * 100).toFixed(1)}%.`);
  add("Trade frequency", recent.length >= 8 ? "FAIL" : recent.length >= 5 ? "WARN" : "PASS", recent.length >= 8 ? 20 : recent.length >= 5 ? 8 : 0, `${recent.length} decisions in the last hour.`);
  add("Repeated losses", losses >= 3 ? "FAIL" : losses === 2 ? "WARN" : "PASS", losses >= 3 ? 20 : losses === 2 ? 8 : 0, `${losses} losses in the recent window.`);
  add("Asset concentration", sameAsset.length >= 3 ? "FAIL" : sameAsset.length >= 1 ? "WARN" : "PASS", sameAsset.length >= 3 ? 18 : sameAsset.length >= 1 ? 7 : 0, `${sameAsset.length} recent ${p.symbol} executions.`);
  add("Confidence", p.confidence < 0.42 ? "FAIL" : p.confidence < 0.62 ? "WARN" : "PASS", p.confidence < 0.42 ? 20 : p.confidence < 0.62 ? 8 : 0, `Agent confidence is ${(p.confidence * 100).toFixed(0)}%.`);
  add("Funding", Math.abs(p.market.fundingRate) > 0.002 ? "FAIL" : Math.abs(p.market.fundingRate) > 0.001 ? "WARN" : "PASS", Math.abs(p.market.fundingRate) > 0.002 ? 18 : Math.abs(p.market.fundingRate) > 0.001 ? 8 : 0, `Funding rate is ${(p.market.fundingRate * 100).toFixed(3)}%.`);
  const mismatch = (regime === "TRENDING_BULL" && p.side === "SHORT") || (regime === "TRENDING_BEAR" && p.side === "LONG") || (regime === "RANGING" && p.confidence > 0.8);
  add("Regime alignment", mismatch ? "FAIL" : regime === "UNCLEAR" ? "WARN" : "PASS", mismatch ? 18 : regime === "UNCLEAR" ? 10 : 0, mismatch ? `The ${p.side} proposal conflicts with ${regime}.` : `Proposal assessed under ${regime}.`);
  const duplicate = state.recent.some(d => d.symbol === p.symbol && d.side === p.side && Math.abs(d.entryPrice - p.entryPrice) / p.entryPrice < 0.002 && Date.now() - new Date(d.timestamp).getTime() < 10 * 60 * 1000);
  add("Duplicate trade", duplicate ? "FAIL" : "PASS", duplicate ? 25 : 0, duplicate ? "A nearly identical recent decision exists." : "No duplicate decision detected.");
  add("Execution boundary", "PASS", 0, "Execution is permanently paper-only while prices come from Bitget mainnet.");

  let score = Math.min(100, Math.round(checks.reduce((a, c) => a + c.score, 0) * 0.68));
  if (regime === "CRISIS" && p.leverage > 3) score = Math.max(score, 88);
  if (regime === "HIGH_VOLATILITY" && !p.stopLoss) score = Math.max(score, 85);
  const failCount = checks.filter(c => c.status === "FAIL").length;
  let verdict: RiskResult["verdict"] = score <= 30 ? "ALLOW" : score <= 60 ? "REDUCE_SIZE" : score <= 80 ? "HUMAN_REVIEW" : "BLOCK";
  if (failCount >= 3 || p.leverage > 30 || p.proposedPositionSize > 0.5) verdict = "BLOCK";
  if (regime === "UNCLEAR" && verdict === "ALLOW") verdict = "REDUCE_SIZE";
  const finalPositionSize = verdict === "ALLOW" ? p.proposedPositionSize : verdict === "REDUCE_SIZE" ? Math.min(p.proposedPositionSize * 0.4, 0.06) : 0;
  const reasons = checks.filter(c => c.status !== "PASS").sort((a, b) => b.score - a.score).map(c => c.explanation);
  const action = verdict === "REDUCE_SIZE" ? ` Position size was reduced from ${(p.proposedPositionSize * 100).toFixed(1)}% to ${(finalPositionSize * 100).toFixed(1)}%.` : "";
  return { verdict, score, reasons, checks, finalPositionSize, regime, explanation: `Verdict: ${verdict}. ${reasons.slice(0, 3).join(" ")}${action}` };
}
