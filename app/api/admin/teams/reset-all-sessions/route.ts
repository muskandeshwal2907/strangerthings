import { NextRequest, NextResponse } from "next/server";
import { getApiBase } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const base = getApiBase();
    const token = req.headers.get("authorization") || "Bearer HAWKINS_CHIEF_1983";
    const res = await fetch(`${base}/admin/teams/reset-all-sessions`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[RESET ALL SESSIONS ERROR]", err);
    return NextResponse.json({ success: false, error: "BACKEND_UNREACHABLE" }, { status: 500 });
  }
}
