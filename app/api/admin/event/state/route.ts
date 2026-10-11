import { NextRequest, NextResponse } from "next/server";
import { getApiBase } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/event/state`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const ev = data.event || {};
      return NextResponse.json({
        success: true,
        eventState: {
          id: 1,
          status: ev.status || "active",
          login_open: ev.loginOpen !== false,
          submissions_open: ev.submissionsOpen !== false,
          current_round_max: 7,
          is_paused: !!ev.isPaused,
        },
      });
    }
    return NextResponse.json({
      success: true,
      eventState: {
        id: 1,
        status: "active",
        login_open: true,
        submissions_open: true,
        current_round_max: 7,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      eventState: {
        id: 1,
        status: "active",
        login_open: true,
        submissions_open: true,
        current_round_max: 7,
      },
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const base = getApiBase();
    const token = req.headers.get("authorization") || "Bearer HAWKINS_CHIEF_1983";

    if (body.status === "paused") {
      await fetch(`${base}/admin/event/pause`, { method: "POST", headers: { Authorization: token } });
    } else if (body.status === "active") {
      // Trigger start event (sets status to active, submissionsOpen to true)
      await fetch(`${base}/admin/event/start`, { method: "POST", headers: { Authorization: token } });
      await fetch(`${base}/admin/event/resume`, { method: "POST", headers: { Authorization: token } });
    }

    if (body.loginOpen === false) {
      await fetch(`${base}/admin/event/close-login`, { method: "POST", headers: { Authorization: token } });
    }

    if (body.submissionsOpen === false) {
      await fetch(`${base}/admin/event/stop-submissions`, { method: "POST", headers: { Authorization: token } });
    }

    return NextResponse.json({ success: true, message: "Event state updated" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
