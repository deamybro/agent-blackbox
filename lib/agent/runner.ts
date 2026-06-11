import { buildSignals } from "@/lib/agent/signals";
import type { MarketContext, Proposal } from "@/lib/types";

const prices: Record<string, number> = { BTCUSDT: 104250, ETHUSDT: 3560, SOLUSDT: 168 };

export function createProposal(scenario: "auto" | "safe" | "dangerous" = "auto"): Proposal {
  const danger = scenario === "dangerous";
  const safe = scenario === "safe";
  const r = Math.random();
  const symbol = danger ? "ETHUSDT" : safe ? "BTCUSDT" : r > 0.72 ? "SOLUSDT" : r > 0.18 ? "BTCUSDT" : "ETHUSDT";
  const market: MarketContext = danger
    ? { price: prices[symbol], volatility: 0.91, trendStrength: -0.72, sentimentScore: -0.66, fundingRate: 0.0032, newsScore: -0.7, technicalScore: -0.65, onChainScore: -0.35, volumeCondition: 0.72 }
    : { price: prices[symbol] * (0.995 + r * 0.01), volatility: safe ? 0.28 : 0.25 + r * 0.45, trendStrength: safe ? 0.68 : r * 1.4 - 0.6, sentimentScore: safe ? 0.54 : r * 1.2 - 0.5, fundingRate: 0.0002 + r * 0.0005, newsScore: safe ? 0.42 : r - 0.42, technicalScore: safe ? 0.71 : r * 1.4 - 0.55, onChainScore: safe ? 0.35 : r - 0.45, volumeCondition: 0.55 + r * 0.35 };
  const side = danger ? "LONG" : market.trendStrength > 0.15 ? "LONG" : market.trendStrength < -0.35 ? "SHORT" : "HOLD";
  const signals = buildSignals(market, r);
  const entry = Math.round(market.price * 100) / 100;
  return {
    agentName: danger ? "ETH Leverage Stress Agent" : "BTC Momentum Agent",
    symbol, side,
    proposedPositionSize: danger ? 0.62 : safe ? 0.06 : 0.05 + r * 0.14,
    leverage: danger ? 50 : safe ? 2 : 2 + Math.floor(r * 8),
    entryPrice: entry,
    stopLoss: danger ? undefined : side === "SHORT" ? entry * 1.018 : entry * 0.982,
    takeProfit: danger ? entry * 1.03 : side === "SHORT" ? entry * 0.96 : entry * 1.04,
    confidence: danger ? 0.31 : safe ? 0.82 : 0.5 + r * 0.4,
    reasoning: danger ? "Aggressive leverage seeks to catch a reversal despite deteriorating signals." : `${symbol} momentum and signal consensus support a controlled ${side.toLowerCase()} proposal with a defined exit.`,
    signals, market
  };
}
