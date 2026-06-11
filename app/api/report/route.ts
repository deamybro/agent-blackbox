import { NextResponse } from "next/server";
import { report } from "@/lib/report";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json(report()); }
