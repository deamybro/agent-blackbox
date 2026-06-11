import { NextResponse } from "next/server";
import { getDecisions } from "@/lib/db/store";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json(getDecisions().map(d => ({ id: d.id, timestamp: d.timestamp, agent: d.agentName, action: `${d.side} ${d.symbol}`, verdict: d.riskVerdict, score: d.riskScore, finalAction: d.tradeStatus, reasoning: d.reasoning }))); }
