// scripts/verify-all-defects.mjs
// Automated verification suite for BUG-01 through BUG-06 in The Hawkins Protocol

import { io } from "socket.io-client";

const BACKEND_BASE = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";
const FRONTEND_BASE = "http://localhost:3000/api";

const ADMIN_PASSKEY = "HAWKINS_CHIEF_1983";

let passed = 0;
let total = 0;

function assert(description, condition, details = "") {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS ${passed}] ✅ ${description} ${details ? `(${details})` : ""}`);
  } else {
    console.error(`[FAIL ${total}] ❌ ${description} ${details ? `(${details})` : ""}`);
    throw new Error(`Assertion failed: ${description} - ${details}`);
  }
}

async function post(url, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function get(url, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("==================================================================");
  console.log("⚡ VERIFYING FIXES FOR DEFECTS BUG-01 THROUGH BUG-06");
  console.log("==================================================================");

  // Obtain Admin Token
  const adminLogin = await post(`${BACKEND_BASE}/auth/admin-login`, { passkey: ADMIN_PASSKEY });
  assert("Admin logs in successfully", adminLogin.status === 200 && adminLogin.data.success);
  const adminToken = adminLogin.data.token;

  // Ensure event is active initially and reset stale test sessions & scores
  await post(`${BACKEND_BASE}/admin/event/resume`, {}, adminToken);
  await post(`${BACKEND_BASE}/admin/teams/reset-all-sessions`, {}, adminToken);
  await post(`${BACKEND_BASE}/admin/teams/reset-all-scores`, {}, adminToken);

  // -------------------------------------------------------------------------
  // BUG-01: Admin force logout immediately logs team out
  // -------------------------------------------------------------------------
  console.log("\n--- Testing BUG-01: Admin Force Logout ---");
  const testTeamName = "Stack Smashers";
  const testLeader = "Maya Lin";

  // Login participant
  const loginRes = await post(`${BACKEND_BASE}/auth/login`, {
    teamName: testTeamName,
    leaderName: testLeader,
  });
  assert("Participant logs in", loginRes.status === 200 && loginRes.data.success);
  const playerToken = loginRes.data.token;
  const teamId = loginRes.data.session.teamId;

  // Connect socket and authenticate
  const socket = io(SOCKET_URL, {
    auth: { token: playerToken },
    transports: ["websocket"],
  });

  let receivedRevocation = false;
  let revocationPayload = null;

  socket.on("connect", () => {
    socket.emit("authenticate", { token: playerToken });
  });

  socket.on("session:revoked", (data) => {
    receivedRevocation = true;
    revocationPayload = data;
  });
  socket.on("team:force_logged_out", (data) => {
    receivedRevocation = true;
    revocationPayload = data;
  });

  // Wait for socket handshake
  await wait(300);

  // Admin triggers force logout
  const forceRes = await post(`${BACKEND_BASE}/admin/teams/${teamId}/force-logout`, {}, adminToken);
  assert("Admin force logout returns 200 success", forceRes.status === 200 && forceRes.data.success);

  // Wait for socket event delivery
  await wait(300);
  assert("Participant socket receives revocation event immediately (<1s)", receivedRevocation === true, `Target: ${revocationPayload?.teamId}`);

  // Check that subsequent HTTP request using the revoked token is rejected with 401
  const checkReq = await get(`${BACKEND_BASE}/auth/me`, playerToken);
  assert("Server rejects revoked session token with 401 SESSION_REVOKED", checkReq.status === 401 && checkReq.data.error === "SESSION_REVOKED");

  // Verify team can log in again
  const reLoginRes = await post(`${BACKEND_BASE}/auth/login`, {
    teamName: testTeamName,
    leaderName: testLeader,
  });
  assert("Team can log in again after force logout", reLoginRes.status === 200 && reLoginRes.data.success);
  const activePlayerToken = reLoginRes.data.token;

  socket.disconnect();

  // -------------------------------------------------------------------------
  // BUG-02: Player score restoration after logout and login (hydrates correct score, not 000)
  // -------------------------------------------------------------------------
  console.log("\n--- Testing BUG-02: Score Hydration After Relogin ---");
  // Award points to the team
  const valChapter = await post(`${BACKEND_BASE}/chapters/validate`, {
    chapterId: 1,
    taskId: "ch1-quiz",
    answer: "A",
    teamId,
  });
  assert("Chapter validation awards points", valChapter.status === 200 && valChapter.data.success && valChapter.data.pointsAwarded > 0);

  // Fetch team score from backend
  const meRes = await get(`${BACKEND_BASE}/auth/me`, activePlayerToken);
  assert("Backend returns team record", meRes.status === 200 && meRes.data.success && meRes.data.team);
  const currentTotalScore = meRes.data.team.totalScore;
  assert("Team totalScore is greater than 0", currentTotalScore > 0, `Score: ${currentTotalScore}`);

  // Test participant session hydration endpoint (Frontend /api/auth/session or auth/login)
  const reRelogin = await post(`${BACKEND_BASE}/auth/login`, {
    teamName: testTeamName,
    leaderName: testLeader,
  });
  // Since session exists, if same team reconnects or checks progress:
  const progressRes = await get(`${BACKEND_BASE}/me/progress`, activePlayerToken);
  assert("Progress endpoint returns persisted totalScore (>0, not 000)", progressRes.status === 200 && progressRes.data.team?.totalScore === currentTotalScore);
  assert("Progress endpoint returns category breakdown", !!progressRes.data.team?.breakdown);

  // -------------------------------------------------------------------------
  // BUG-03: Reset All Sessions leaves old scores visible (invalidates sessions only)
  // -------------------------------------------------------------------------
  console.log("\n--- Testing BUG-03: Reset All Sessions Semantics ---");
  const resetSessionsRes = await post(`${BACKEND_BASE}/admin/teams/reset-all-sessions`, {}, adminToken);
  assert("Admin resets all sessions", resetSessionsRes.status === 200 && resetSessionsRes.data.success);

  // Verify the active session is revoked
  const revokedAfterReset = await get(`${BACKEND_BASE}/auth/me`, activePlayerToken);
  assert("Active session was invalidated by Reset All Sessions", revokedAfterReset.status === 401);

  // Verify scores were NOT wiped or zeroed
  const leaderboardRes = await get(`${BACKEND_BASE}/admin/teams`, adminToken);
  assert("Admin leaderboard fetched", leaderboardRes.status === 200 && leaderboardRes.data.success);
  const targetTeam = (leaderboardRes.data.teams || []).find((t) => t.id === teamId || t.teamName === testTeamName);
  assert("Team score is preserved after Reset All Sessions (NOT 0)", targetTeam && targetTeam.totalScore === currentTotalScore, `Preserved score: ${targetTeam?.totalScore}`);

  // -------------------------------------------------------------------------
  // BUG-04: Admin STAGE / SOLVED count shows 1 (not 2) after completing one stage
  // -------------------------------------------------------------------------
  console.log("\n--- Testing BUG-04: Solve Count Idempotency (1 stage = 1 count) ---");
  // Inspect targetTeam's solvedCount
  assert("Stage solve count is exactly 1 (not 2) after completing Chapter 1", targetTeam.solvedCount === 1, `solvedCount: ${targetTeam?.solvedCount}, solvedChapters: ${JSON.stringify(targetTeam?.solvedChapters)}`);

  // Submit retry / repeat request for same stage
  await post(`${BACKEND_BASE}/chapters/validate`, {
    chapterId: 1,
    taskId: "ch1-quiz",
    answer: "A",
    teamId,
  });

  const lbAfterRetry = await get(`${BACKEND_BASE}/admin/teams`, adminToken);
  const targetAfterRetry = (lbAfterRetry.data.teams || []).find((t) => t.id === teamId || t.teamName === testTeamName);
  assert("Stage solve count remains exactly 1 on duplicate/retry attempt", targetAfterRetry.solvedCount === 1, `solvedCount: ${targetAfterRetry?.solvedCount}`);

  // -------------------------------------------------------------------------
  // BUG-05: Event Pause Enforces Rejection Across All Mutations
  // -------------------------------------------------------------------------
  console.log("\n--- Testing BUG-05: Tournament Pause Enforcement ---");
  // Log in team fresh to get valid token
  const freshLogin = await post(`${BACKEND_BASE}/auth/login`, {
    teamName: testTeamName,
    leaderName: testLeader,
  });
  const freshToken = freshLogin.data.token;

  // Pause event
  const pauseRes = await post(`${BACKEND_BASE}/admin/event/pause`, {}, adminToken);
  assert("Admin pauses tournament", pauseRes.status === 200 && pauseRes.data.event?.isPaused === true);

  // Attempt chapter validation while paused
  const pausedChapterVal = await post(`${BACKEND_BASE}/chapters/validate`, {
    chapterId: 2,
    taskId: "ch2-police",
    answer: "B",
    teamId,
  }, freshToken);
  assert("Chapter validation rejected with 403 EVENT_PAUSED while tournament is paused", pausedChapterVal.status === 403 && pausedChapterVal.data.error === "EVENT_PAUSED");

  // Attempt radiometer pin validation while paused
  const pausedPinVal = await post(`${BACKEND_BASE}/radiometer/validate-pin`, {
    pinIndex: 1,
    answer: "3",
    teamId,
  }, freshToken);
  assert("Radiometer pin validation rejected with 403 EVENT_PAUSED while paused", pausedPinVal.status === 403 && pausedPinVal.data.error === "EVENT_PAUSED");

  // Attempt master keypad validation while paused
  const pausedKeypadVal = await post(`${BACKEND_BASE}/radiometer/validate-master-keypad`, {
    code: "83479",
  }, freshToken);
  assert("Radiometer keypad validation rejected with 403 EVENT_PAUSED while paused", pausedKeypadVal.status === 403 && pausedKeypadVal.data.error === "EVENT_PAUSED");

  // Resume event
  const resumeRes = await post(`${BACKEND_BASE}/admin/event/resume`, {}, adminToken);
  assert("Admin resumes tournament", resumeRes.status === 200 && resumeRes.data.event?.isPaused === false);

  // Mutations allowed again
  const resumedPinVal = await post(`${BACKEND_BASE}/radiometer/validate-pin`, {
    pinIndex: 0,
    answer: "8",
    teamId,
  }, freshToken);
  assert("Radiometer pin validation succeeds after resume", resumedPinVal.status === 200 && resumedPinVal.data.success);

  // -------------------------------------------------------------------------
  // BUG-06: Real-Time Synchronization & Socket Delivery
  // -------------------------------------------------------------------------
  console.log("\n--- Testing BUG-06: Real-Time Socket Event Delivery ---");
  const syncSocket = io(SOCKET_URL, {
    auth: { token: freshToken },
    transports: ["websocket"],
  });

  let receivedScoreUpdate = false;
  let receivedEventState = false;

  syncSocket.on("connect", () => {
    syncSocket.emit("authenticate", { token: freshToken });
  });

  syncSocket.on("score:update", (data) => {
    if (data.teamId === teamId) {
      receivedScoreUpdate = true;
    }
  });

  syncSocket.on("event:state_changed", () => {
    receivedEventState = true;
  });

  await wait(300);

  // Trigger score-changing action
  await post(`${BACKEND_BASE}/radiometer/validate-pin`, {
    pinIndex: 2,
    answer: "4",
    teamId,
  }, freshToken);

  await wait(400);
  assert("Team receives score:update socket event in real time after score mutation", receivedScoreUpdate === true);

  // Trigger event pause to test event:state_changed delivery
  await post(`${BACKEND_BASE}/admin/event/pause`, {}, adminToken);
  await wait(400);
  assert("Connected sockets receive event:state_changed socket event in real time", receivedEventState === true);

  // Clean up: resume event
  await post(`${BACKEND_BASE}/admin/event/resume`, {}, adminToken);
  syncSocket.disconnect();

  console.log("\n==================================================================");
  console.log(`🎉 ALL ${passed}/${total} DEFECT VERIFICATION TESTS PASSED WITH 100% SUCCESS!`);
  console.log("==================================================================");
}

run().catch((err) => {
  console.error("\nVerification run failed:", err);
  process.exit(1);
});
