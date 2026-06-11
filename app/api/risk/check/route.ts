import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRisk } from "@/lib/risk/engine";
import type { Proposal } from "@/lib/types";

const schema = z.object({
  agentName: z.string().min(1), symbol: z.string().min(3), side: z.enum(["LONG", "SHORT", "HOLD", "CLOSE"]),
  proposedPositionSize: z.number().min(0).max(1), leverage: z.number().min(0), entryPrice: z.number().positive(),
  stopLoss: z.number().positive().optional(), takeProfit: z.number().positive().optional(), confidence: z.number().min(0).max(1),
  reasoning: z.string(), signals: z.array(z.any()), market: z.any()
});
export async function POST(request: Request) {
  try {
    return NextResponse.json(checkRisk(schema.parse(await request.json()) as Proposal));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
  }
}
