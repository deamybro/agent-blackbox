import { NextResponse } from "next/server";
import { bitget } from "@/lib/bitget/client";
import type { BitgetStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ticker = await bitget.ticker("BTCUSDT");
    let account = null;
    let accountError = "";
    if (bitget.configured) {
      try {
        account = await bitget.account();
      } catch (error) {
        accountError = error instanceof Error ? error.message : "Read-only account authentication failed.";
      }
    }
    const status: BitgetStatus = {
      network: "BITGET_MAINNET",
      configured: bitget.configured,
      publicMarketConnected: true,
      authenticated: Boolean(account),
      executionMode: "PAPER_ONLY",
      btcPrice: Number(ticker.lastPr),
      accountEquity: account ? Number(account.accountEquity) : undefined,
      availableBalance: account ? Number(account.available) : undefined,
      message: account ? "Bitget mainnet market data and read-only account connection are active. Orders remain paper-only." : accountError || "Bitget mainnet public market data is active. Orders remain paper-only."
    };
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({
      network: "BITGET_MAINNET", configured: bitget.configured, publicMarketConnected: false,
      authenticated: false, executionMode: "PAPER_ONLY", message: error instanceof Error ? error.message : "Bitget connection failed."
    } satisfies BitgetStatus, { status: 503 });
  }
}
