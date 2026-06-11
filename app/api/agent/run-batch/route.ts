import { NextResponse } from "next/server";
import { z } from "zod";
import { runMainnetPaperCycle } from "@/lib/service";

const schema = z.object({ count: z.number().int().min(1).max(25).default(10) });
export async function POST(request: Request) {
  try {
    const { count } = schema.parse(await request.json().catch(() => ({})));
    const decisions = [];
    for (let i = 0; i < count; i++) decisions.push(await runMainnetPaperCycle());
    return NextResponse.json(decisions);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
  }
}
