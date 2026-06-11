import type { MarketContext, Regime } from "@/lib/types";

export function classifyRegime(m: MarketContext): Regime {
  if (m.volatility >= 0.85 && m.sentimentScore < -0.55 && m.newsScore < -0.45) return "CRISIS";
  if (m.volumeCondition < 0.25) return "LOW_LIQUIDITY";
  if (m.volatility >= 0.68) return "HIGH_VOLATILITY";
  if (m.trendStrength >= 0.56 && m.technicalScore >= 0.25 && m.sentimentScore > -0.2) return "TRENDING_BULL";
  if (m.trendStrength <= -0.56 && m.technicalScore <= -0.25 && m.sentimentScore < 0.2) return "TRENDING_BEAR";
  if (Math.abs(m.trendStrength) < 0.28 && m.volatility < 0.5) return "RANGING";
  return "UNCLEAR";
}
