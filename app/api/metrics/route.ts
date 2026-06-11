import { NextResponse } from "next/server";
import { getMetrics } from "@/lib/db/store";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json(getMetrics()); }
