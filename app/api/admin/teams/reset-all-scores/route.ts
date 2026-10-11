import { NextResponse } from "next/server";
import { getApiBase } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const base = getApiBase();
    const token = req.headers.get("authorization") || "Bearer HAWKINS_CHIEF_1983";
    const res = await fetch(`${base}/admin/teams/reset-all-scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
