import { NextRequest, NextResponse } from "next/server";
import { getApiBase } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = (body.username || body.teamName || "").trim();
    const password = (body.password || body.leaderName || "").trim();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "MISSING_CREDENTIALS", message: "Username and password are required." },
        { status: 400 }
      );
    }

    const base = getApiBase();
    const res = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamName: username, leaderName: password }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "BACKEND_UNREACHABLE", message: "Mainframe connection failed." },
      { status: 500 }
    );
  }
}
