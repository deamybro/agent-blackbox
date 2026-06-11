import { NextResponse } from "next/server";
import { z } from "zod";
import { runMainnetPaperCycle } from "@/lib/service";

const bodySchema = z.object({ scenario: z.enum(["auto", "safe", "dangerous"]).default("auto") });

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await runMainnetPaperCycle(body.scenario), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request" }, { status: 400 });
  }
}
