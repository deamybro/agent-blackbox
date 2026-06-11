import { getMetrics } from "@/lib/db/store";
export async function report() {
  const m = await getMetrics();
  const regimes = m.decisions.reduce<Record<string, number>>((a, d) => ({ ...a, [d.marketRegime]: (a[d.marketRegime] || 0) + d.resultPnL }), {});
  const sorted = Object.entries(regimes).sort((a, b) => b[1] - a[1]);
  return { generatedAt: new Date().toISOString(), totalTrades: m.total, blocked: m.blocked, reduced: m.reduced, winRate: m.winRate, pnl: m.pnl, maxDrawdown: m.maxDrawdown, topRiskReason: m.commonRiskReason, bestRegime: sorted[0]?.[0] || "N/A", worstRegime: sorted.at(-1)?.[0] || "N/A" };
}
