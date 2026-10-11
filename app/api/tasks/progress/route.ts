import { NextRequest, NextResponse } from "next/server";
import { getApiBase } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const base = getApiBase();
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get("authorization") || "";

    const res = await fetch(`${base}/tasks/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "BACKEND_UNREACHABLE" }, { status: 500 });
  }
}
