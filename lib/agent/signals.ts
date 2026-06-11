import type { MarketContext, Signal, SignalCategory } from "@/lib/types";

const categories: SignalCategory[] = ["macro", "market_intel", "news", "sentiment", "technical", "on_chain", "liquidity", "funding"];

export function buildSignals(m: MarketContext, seed = Math.random()): Signal[] {
  const values = [m.newsScore, m.trendStrength, m.newsScore, m.sentimentScore, m.technicalScore, m.onChainScore, m.volumeCondition * 2 - 1, -Math.abs(m.fundingRate * 200)];
  return categories.map((category, i) => ({
    category,
    source: `Bitget ${category.replace("_", " ")} adapter`,
    value: values[i],
    score: Math.max(-1, Math.min(1, values[i] + (seed - 0.5) * 0.12)),
    timestamp: new Date().toISOString(),
    freshness: Math.round(2 + seed * 18 + i),
    explanation: `${category.replace("_", " ")} signal is ${values[i] > 0.2 ? "constructive" : values[i] < -0.2 ? "defensive" : "neutral"}.`
  }));
}
