import { bitget } from "@/lib/bitget/client";
import { buildSignals } from "@/lib/agent/signals";
import type { Proposal } from "@/lib/types";

export async function hydrateWithBitgetMarket(proposal: Proposal): Promise<Proposal> {
  const ticker = await bitget.ticker(proposal.symbol);
  const price = Number(ticker.lastPr);
  const high = Number(ticker.high24h);
  const low = Number(ticker.low24h);
  const change = Number(ticker.change24h);
  const volatility = Math.min(1, Math.max(0.05, (high - low) / Math.max(price, 1) * 6));
  const trend = Math.max(-1, Math.min(1, change * 8));
  const market = {
    ...proposal.market, price, volatility, trendStrength: trend,
    technicalScore: trend, fundingRate: Number(ticker.fundingRate),
    volumeCondition: Number(ticker.quoteVolume) > 0 ? 0.8 : 0.2
  };
  const side = trend > 0.08 ? "LONG" : trend < -0.08 ? "SHORT" : "HOLD";
  return {
    ...proposal, side, entryPrice: price, market, signals: buildSignals(market),
    stopLoss: side === "SHORT" ? price * 1.018 : price * 0.982,
    takeProfit: side === "SHORT" ? price * 0.96 : price * 1.04,
    reasoning: `${proposal.symbol} proposal uses live Bitget mainnet ticker, funding, volume, and 24-hour range data. Current directional signal is ${side}.`
  };
}
