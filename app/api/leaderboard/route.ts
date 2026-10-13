import { NextResponse } from "next/server";
import { getApiBase } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/leaderboard`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({ success: false, error: "BACKEND_ERROR" }, { status: 502 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "BACKEND_UNREACHABLE" }, { status: 500 });
  }
}
