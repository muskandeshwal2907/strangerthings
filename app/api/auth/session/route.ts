import { NextRequest, NextResponse } from "next/server";
import { getApiBase } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token =
      req.cookies.get("hawkins_session_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    const base = getApiBase();
    const meRes = await fetch(`${base}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => null);

    if (!meRes || !meRes.ok) {
      return NextResponse.json(
        { authenticated: false, forceLoggedOut: meRes?.status === 401 },
        {
          status: meRes?.status === 401 ? 401 : 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    const meData = await meRes.json().catch(() => ({}));
    if (!meData.success || !meData.session) {
      return NextResponse.json(
        { authenticated: false, forceLoggedOut: true },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    // Query submissions and event state in parallel
    const [subsRes, eventRes] = await Promise.all([
      fetch(`${base}/me/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }).catch(() => null),
      fetch(`${base}/event/state`, {
        cache: "no-store",
      }).catch(() => null),
    ]);

    const subsData = subsRes && subsRes.ok ? await subsRes.json().catch(() => ({})) : {};
    const eventData = eventRes && eventRes.ok ? await eventRes.json().catch(() => ({})) : {};

    const team = meData.team || {};
    const session = meData.session || {};

    return NextResponse.json(
      {
        authenticated: true,
        team: {
          id: team.id || session.teamId || "T01",
          username: team.teamName || session.teamName || "",
          teamName: team.teamName || session.teamName || "",
          squadLeader: team.leaderName || session.leaderName || "",
          totalScore: team.score || 0,
          currentStage: 1,
          isFrozen: false,
          freezeRemainingSeconds: 0,
        },
        submissions: subsData.submissions || [],
        hintsUsed: [],
        event: {
          status: eventData.event?.status || "active",
          submissionsOpen: eventData.event?.submissionsOpen ?? true,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: any) {
    console.error("[SESSION API ERROR]", err);
    return NextResponse.json({ authenticated: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
