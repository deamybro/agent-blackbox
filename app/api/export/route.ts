import { NextResponse } from "next/server";
import { z } from "zod";
import { getDecisions } from "@/lib/db/store";
const schema = z.object({ format: z.enum(["json", "csv"]) });
export async function POST(request: Request) {
  try {
    const { format } = schema.parse(await request.json());
    const rows = getDecisions();
    if (format === "json") return new NextResponse(JSON.stringify(rows, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": "attachment; filename=agent-blackbox-audit.json" } });
    const fields = ["id", "timestamp", "agentName", "symbol", "side", "riskVerdict", "riskScore", "tradeStatus", "resultPnL", "balanceAfter"];
    const csv = [fields.join(","), ...rows.map(d => fields.map(f => JSON.stringify(d[f as keyof typeof d] ?? "")).join(","))].join("\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=agent-blackbox-audit.csv" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
  }
}
