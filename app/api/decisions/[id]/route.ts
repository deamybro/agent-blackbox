import { NextResponse } from "next/server";
import { getDecision } from "@/lib/db/store";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const decision = await getDecision((await params).id);
  return decision ? NextResponse.json(decision) : NextResponse.json({ error: "Decision not found" }, { status: 404 });
}
