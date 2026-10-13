import { NextRequest, NextResponse } from "next/server";
import { getApiBase } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const token =
      req.cookies.get("hawkins_session_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (token) {
      const base = getApiBase();
      await fetch(`${base}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).catch(() => {});
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully." });
    response.cookies.delete("hawkins_session_token");
    return response;
  } catch (err: any) {
    console.error("[LOGOUT API ERROR]", err);
    return NextResponse.json({ success: false, error: "LOGOUT_FAILED" }, { status: 500 });
  }
}
