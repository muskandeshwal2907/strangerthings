import { NextRequest, NextResponse } from "next/server";
import { getApiBase } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const base = getApiBase();
    const token =
      req.cookies.get("hawkins_session_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    const res = await fetch(`${base}/vecna/status`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[VECNA STATUS API ERROR]", err);
    return NextResponse.json({ success: false, error: "BACKEND_UNREACHABLE" }, { status: 500 });
  }
}
