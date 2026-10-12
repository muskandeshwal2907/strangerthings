import { io } from "socket.io-client";

const BACKEND_BASE = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";
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
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function put(url, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { method: "PUT", headers, body: JSON.stringify(body) });
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
  console.log("⚡ TESTING PRESENCE, SCORING RULES & EVENT LIFECYCLE");
  console.log("==================================================================");

  // 1. Admin login
  const adminLogin = await post(`${BACKEND_BASE}/auth/admin-login`, { passkey: ADMIN_PASSKEY });
  assert("Admin logs in successfully", adminLogin.status === 200 && adminLogin.data.success);
  const adminToken = adminLogin.data.token;

  // Reset all sessions & scores
  await post(`${BACKEND_BASE}/admin/teams/reset-all-sessions`, {}, adminToken);
  await post(`${BACKEND_BASE}/admin/teams/reset-all-scores`, {}, adminToken);

  // -------------------------------------------------------------------------
  // PRESENCE & SQUAD USERNAME TEST
  // -------------------------------------------------------------------------
  console.log("\n--- Testing Presence & Squad Username ---");
  // Check that all teams are offline initially
  const initTeams = await get(`${BACKEND_BASE}/admin/teams`, adminToken);
  const t01 = initTeams.data.teams.find((t) => t.id === "T01");
  assert("T01 is offline with no active socket", t01 && !t01.isOnline);

  // Login T01
  const loginT01 = await post(`${BACKEND_BASE}/auth/login`, {
    teamName: "Null Pointers",
    leaderName: "Aarav Sharma",
  });
  assert("T01 logs in", loginT01.status === 200 && loginT01.data.token);
  const t01Token = loginT01.data.token;

  // Connect socket with token
  const sockT01 = io(SOCKET_URL, {
    auth: { token: t01Token },
    transports: ["websocket"],
  });
  sockT01.on("connect", () => {
    sockT01.emit("authenticate", { token: t01Token });
  });
  await wait(400);

  // Check admin/teams: T01 should be Online
  const onlineTeams = await get(`${BACKEND_BASE}/admin/teams`, adminToken);
  const t01Online = onlineTeams.data.teams.find((t) => t.id === "T01");
  assert("T01 is reported Online when socket is connected", t01Online && t01Online.isOnline === true);

  // Assign T04 to VECNA role (roles can be modified while event is paused or not started)
  await post(`${BACKEND_BASE}/admin/event/pause`, {}, adminToken);
  const roleRes = await put(`${BACKEND_BASE}/admin/teams/T04/role`, { role: "VECNA" }, adminToken);
  assert("Role update returns 200 success", roleRes.status === 200 && roleRes.data.success);
  await post(`${BACKEND_BASE}/admin/event/resume`, {}, adminToken);

  // Verify T04 retains username TEAM04 (not overwritten to VECNA-001)
  const teamsAfterRole = await get(`${BACKEND_BASE}/admin/teams`, adminToken);
  const t04Record = teamsAfterRole.data.teams.find((t) => t.id === "T04");
  assert("T04 with role VECNA keeps username TEAM04", t04Record && t04Record.username === "TEAM04" && t04Record.role === "VECNA", `username=${t04Record?.username}, role=${t04Record?.role}`);

  // Disconnect T01 socket
  sockT01.disconnect();
  await wait(400);

  const teamsAfterDisc = await get(`${BACKEND_BASE}/admin/teams`, adminToken);
  const t01AfterDisc = teamsAfterDisc.data.teams.find((t) => t.id === "T01");
  assert("T01 is Offline after socket disconnects (even if DB session existed)", t01AfterDisc && t01AfterDisc.isOnline === false);

  // -------------------------------------------------------------------------
  // SCORING RULES & INTEL CLUES
  // -------------------------------------------------------------------------
  console.log("\n--- Testing Scoring Rules & Intel Clues ---");
  // T01 score is currently 0. Attempt to unlock hint with 0 balance
  const hintAttempt1 = await post(`${BACKEND_BASE}/tasks/hint/unlock`, {
    hintKey: "ch1-story-intel",
    teamId: "T01",
  }, t01Token);
  assert("Unlocking hint with 0 points balance rejected with 400 INSUFFICIENT_BALANCE", hintAttempt1.status === 400 && hintAttempt1.data.error === "INSUFFICIENT_BALANCE");

  // Award 10 points via single-answer question
  const ansVal = await post(`${BACKEND_BASE}/chapters/validate`, {
    chapterId: 1,
    taskId: "ch1-quiz",
    answer: "A",
    teamId: "T01",
  }, t01Token);
  assert("Correct answer awards exactly +10 PTS", ansVal.status === 200 && ansVal.data.pointsAwarded === 10);

  // Check score is 10
  const t01Check1 = await get(`${BACKEND_BASE}/auth/me`, t01Token);
  assert("Team score is 10 PTS", t01Check1.data.team?.totalScore === 10, `Score: ${t01Check1.data.team?.totalScore}`);

  // Now team has 10 points (>= 5). Unlocking hint should succeed
  const hintAttempt2 = await post(`${BACKEND_BASE}/tasks/hint/unlock`, {
    hintKey: "ch1-story-intel",
    teamId: "T01",
  }, t01Token);
  assert("Unlocking hint with 10 balance succeeds with -5 penalty", hintAttempt2.status === 200 && hintAttempt2.data.cost === 5);

  // Check score decreased from 10 to 5
  const t01Check2 = await get(`${BACKEND_BASE}/auth/me`, t01Token);
  assert("Team score after 1 clue is 5 PTS", t01Check2.data.team?.totalScore === 5, `Score: ${t01Check2.data.team?.totalScore}`);

  // Unlocking same hint again is idempotent (cost 0)
  const hintAttempt3 = await post(`${BACKEND_BASE}/tasks/hint/unlock`, {
    hintKey: "ch1-story-intel",
    teamId: "T01",
  }, t01Token);
  assert("Unlocking already-unlocked hint costs 0 points", hintAttempt3.status === 200 && hintAttempt3.data.cost === 0);

  // Unlocking second distinct hint with 5 balance succeeds
  const hintAttempt4 = await post(`${BACKEND_BASE}/tasks/hint/unlock`, {
    hintKey: "ch2-story-intel",
    teamId: "T01",
  }, t01Token);
  assert("Unlocking second distinct hint with 5 balance succeeds", hintAttempt4.status === 200 && hintAttempt4.data.cost === 5);

  const t01Check3 = await get(`${BACKEND_BASE}/auth/me`, t01Token);
  assert("Team score after 2 clues is 0 PTS", t01Check3.data.team?.totalScore === 0, `Score: ${t01Check3.data.team?.totalScore}`);

  // Now score is 0. Unlocking third hint must be rejected with INSUFFICIENT_BALANCE
  const hintAttempt5 = await post(`${BACKEND_BASE}/tasks/hint/unlock`, {
    hintKey: "ch3-story-intel",
    teamId: "T01",
  }, t01Token);
  assert("Unlocking third hint with 0 balance rejected with 400 INSUFFICIENT_BALANCE", hintAttempt5.status === 400 && hintAttempt5.data.error === "INSUFFICIENT_BALANCE");

  // -------------------------------------------------------------------------
  // EVENT LIFECYCLE: END & START FRESH EVENT
  // -------------------------------------------------------------------------
  console.log("\n--- Testing Event End & Fresh Event Start ---");
  // Admin ends the event
  const endRes = await post(`${BACKEND_BASE}/admin/event/end`, {}, adminToken);
  assert("Admin ends event", endRes.status === 200 && endRes.data.event?.status === "ended");

  // Verify participant cannot submit answers while event is ended
  const submitWhileEnded = await post(`${BACKEND_BASE}/chapters/validate`, {
    chapterId: 2,
    taskId: "ch2-police",
    answer: "B",
    teamId: "T01",
  }, t01Token);
  assert("Mutations rejected while event is ended", submitWhileEnded.status === 403 || submitWhileEnded.status === 401);

  // Start fresh event
  const startFresh = await post(`${BACKEND_BASE}/admin/event/start`, {}, adminToken);
  assert("Admin starts fresh event", startFresh.status === 200 && startFresh.data.event?.status === "active");

  // Scores should be initialized to 0
  const lbFresh = await get(`${BACKEND_BASE}/admin/teams`, adminToken);
  const t01Fresh = lbFresh.data.teams.find((t) => t.id === "T01");
  assert("Fresh event initializes scores to 0", t01Fresh && t01Fresh.totalScore === 0, `Score: ${t01Fresh?.totalScore}`);

  console.log("\n==================================================================");
  console.log(`🎉 ALL ${passed}/${total} TARGETED TESTS PASSED!`);
  console.log("==================================================================");
}

run().catch((err) => {
  console.error("\nTest failed:", err);
  process.exit(1);
});
