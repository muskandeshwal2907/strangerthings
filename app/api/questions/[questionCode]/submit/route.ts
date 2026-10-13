import { NextRequest, NextResponse } from "next/server";
import { getApiBase } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ questionCode: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const questionCode = resolvedParams.questionCode;
    const body = await req.json().catch(() => ({}));
    const answer = String(body.answer ?? "").trim();
    const token =
      req.cookies.get("hawkins_session_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!questionCode) {
      return NextResponse.json({ success: false, error: "INVALID_INPUT", message: "Question code is required." }, { status: 400 });
    }

    const base = getApiBase();
    const res = await fetch(`${base}/questions/${encodeURIComponent(questionCode)}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ answer, teamId: body.teamId }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("[QUESTION SUBMIT ERROR]", err);
    return NextResponse.json({ success: false, error: "BACKEND_UNREACHABLE" }, { status: 500 });
  }
}
