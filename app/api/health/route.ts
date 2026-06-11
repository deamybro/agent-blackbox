import { NextResponse } from "next/server";
import { bitget } from "@/lib/bitget/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ticker = await bitget.ticker("BTCUSDT");
    return NextResponse.json({
      status: "ok",
      service: "agent-blackbox",
      executionMode: "PAPER_ONLY",
      marketData: "BITGET_MAINNET",
      btcPrice: Number(ticker.lastPr),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: "degraded",
      service: "agent-blackbox",
      executionMode: "PAPER_ONLY",
      message: error instanceof Error ? error.message : "Bitget market connection unavailable",
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
