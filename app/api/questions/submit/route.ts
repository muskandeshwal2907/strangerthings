import { NextRequest, NextResponse } from "next/server";
import { getApiBase } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const questionId = String(body.questionId || "").trim();
    const answer = String(body.answer ?? "").trim();
    const token =
      req.cookies.get("hawkins_session_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!questionId) {
      return NextResponse.json({ success: false, error: "INVALID_INPUT", message: "Question ID is required." }, { status: 400 });
    }

    const base = getApiBase();
    const res = await fetch(`${base}/questions/${encodeURIComponent(questionId)}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ answer }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[QUESTION SUBMIT ERROR]", err);
    return NextResponse.json({ success: false, error: "BACKEND_UNREACHABLE" }, { status: 500 });
  }
}
