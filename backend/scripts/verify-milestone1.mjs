// backend/scripts/verify-milestone1.mjs
// Comprehensive verification test for Milestone 1 requirements:
// F1: 70 questions + HMAC keys in TiDB
// F2: Authoritative evaluation (+10 correct / 0 wrong + lock)
// F3: Atomic persistence to score_ledger & question_submissions
// F4: Dual-store in-memory sync & score:update + leaderboard broadcasts

import { io } from "socket.io-client";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

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
  console.log("⚡ VERIFYING MILESTONE 1: TIDB CATALOG & AUTHORITATIVE EVALUATION");
  console.log("==================================================================");

  // 1. Direct TiDB Catalog Count Verification (F1)
  console.log("\n--- 1. Testing TiDB 70-Question Catalog & HMAC Key Seeding (F1) ---");
  const connection = await mysql.createConnection({
    host: process.env.TIDB_HOST || "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
    port: parseInt(process.env.TIDB_PORT || "4000", 10),
    user: process.env.TIDB_USER || "XvTn2VkXqThHS3a.root",
    password: process.env.TIDB_PASSWORD || "7h1Om30uVXky8w2D",
    database: process.env.TIDB_DATABASE || "stranger_thinks",
    ssl: { rejectUnauthorized: true },
  });

  const [qCount] = await connection.query(
    "SELECT COUNT(1) AS count FROM questions WHERE question_code LIKE 'ch%-q%'"
  );
  assert("All 70 tournament questions present in TiDB", qCount[0].count === 70, `Count: ${qCount[0].count}`);

  const [kCount] = await connection.query(
    "SELECT COUNT(1) AS count FROM question_answer_keys WHERE question_id IN (SELECT question_id FROM questions WHERE question_code LIKE 'ch%-q%')"
  );
  assert("All 70 questions have valid HMAC keys seeded", kCount[0].count >= 70, `Keys count: ${kCount[0].count}`);

  // Clean up any prior test submissions for team T01 on ch1-q1, ch1-q2, ch1-q3, ch1-q4
  await connection.query(
    `DELETE FROM question_submissions WHERE team_id = 'T01' AND question_id IN (
      SELECT question_id FROM questions WHERE question_code IN ('ch1-q1', 'ch1-q2', 'ch1-q3', 'ch1-q4')
    )`
  );
  await connection.query(
    `DELETE FROM score_ledger WHERE team_id = 'T01' AND question_id IN (
      SELECT question_id FROM questions WHERE question_code IN ('ch1-q1', 'ch1-q2', 'ch1-q3', 'ch1-q4')
    )`
  );

  // 2. Admin Login & Event Active State
  console.log("\n--- 2. Setting Up Event & Player Auth ---");
  const adminLogin = await post(`${BACKEND_BASE}/auth/admin-login`, { passkey: ADMIN_PASSKEY });
  assert("Admin authentication successful", adminLogin.status === 200 && adminLogin.data.success);
  const adminToken = adminLogin.data.token;

  await post(`${BACKEND_BASE}/admin/event/start`, {}, adminToken);

  // Player Login (T01)
  const playerLogin = await post(`${BACKEND_BASE}/auth/login`, {
    teamName: "Null Pointers",
    leaderName: "Aarav Sharma",
  });
  assert("Player login successful", playerLogin.status === 200 && playerLogin.data.token);
  const playerToken = playerLogin.data.token;

  // Read initial score
  const [initScoreRows] = await connection.query(
    "SELECT COALESCE(SUM(points_delta), 0) AS total FROM score_ledger WHERE team_id = 'T01'"
  );
  const baseScore = Number(initScoreRows[0].total || 0);

  // 3. Test Correct Submission & Atomic Persistence (F2 & F3)
  console.log("\n--- 3. Testing Correct Submission (Award exactly +10 PTS, Atomic Persistence) ---");
  // ch1-q1 correct answer is "B"
  const correctRes = await post(
    `${BACKEND_BASE}/questions/ch1-q1/submit`,
    { answer: "  B  " }, // Test trim normalization
    playerToken
  );

  assert("Correct submission returns HTTP 200", correctRes.status === 200);
  assert("Correct submission returns success: true", correctRes.data.success === true);
  assert("Correct submission returns isCorrect: true", correctRes.data.isCorrect === true);
  assert("Correct submission awards strictly +10 PTS", correctRes.data.pointsAwarded === 10);
  assert("Correct submission sets isLocked: true", correctRes.data.isLocked === true);
  assert("Correct submission returns correct currentScore", correctRes.data.currentScore === baseScore + 10);

  // Verify atomic persistence in TiDB
  const [subRows] = await connection.query(
    `SELECT * FROM question_submissions WHERE team_id = 'T01' AND question_id = (SELECT question_id FROM questions WHERE question_code = 'ch1-q1')`
  );
  assert("question_submissions has 1 row with is_correct=1 and points_awarded=10", subRows.length === 1 && subRows[0].is_correct === 1 && Number(subRows[0].points_awarded) === 10);

  const [ledgerRows] = await connection.query(
    `SELECT * FROM score_ledger WHERE team_id = 'T01' AND question_id = (SELECT question_id FROM questions WHERE question_code = 'ch1-q1')`
  );
  assert("score_ledger has 1 row with points_delta=10.00", ledgerRows.length === 1 && Number(ledgerRows[0].points_delta) === 10);

  // 4. Test Idempotent Retry on ch1-q1 (F2)
  console.log("\n--- 4. Testing Idempotent Retry (Duplicate Attempt) ---");
  const retryRes = await post(
    `${BACKEND_BASE}/questions/ch1-q1/submit`,
    { answer: "B" },
    playerToken
  );
  assert("Idempotent retry returns HTTP 200", retryRes.status === 200);
  assert("Idempotent retry returns success: true", retryRes.data.success === true);
  assert("Idempotent retry returns isLocked: true", retryRes.data.isLocked === true);
  assert("Idempotent retry returns idempotentRecovery: true", retryRes.data.idempotentRecovery === true);

  // Ensure no duplicate ledger entries were created
  const [ledgerRetry] = await connection.query(
    `SELECT COUNT(1) AS count FROM score_ledger WHERE team_id = 'T01' AND question_id = (SELECT question_id FROM questions WHERE question_code = 'ch1-q1')`
  );
  assert("Score ledger remains at exactly 1 entry (no duplicate points)", ledgerRetry[0].count === 1);

  // 5. Test Incorrect Submission & Permanent Lock (F2 & F3)
  console.log("\n--- 5. Testing Incorrect Submission (0 PTS & Permanent Lock) ---");
  // ch1-q2 correct answer is "A". Submit incorrect "D"
  const wrongRes = await post(
    `${BACKEND_BASE}/questions/ch1-q2/submit`,
    { answer: "D" },
    playerToken
  );
  assert("Incorrect submission returns HTTP 200", wrongRes.status === 200);
  assert("Incorrect submission returns success: true", wrongRes.data.success === true);
  assert("Incorrect submission returns isCorrect: false", wrongRes.data.isCorrect === false);
  assert("Incorrect submission awards strictly 0 PTS", wrongRes.data.pointsAwarded === 0);
  assert("Incorrect submission permanently locks question (isLocked: true)", wrongRes.data.isLocked === true);

  // Verify in TiDB: question_submissions has 1 row with is_correct=0, score_ledger has 0 rows
  await wait(400);
  const [wrongSubRows] = await connection.query(
    `SELECT * FROM question_submissions WHERE team_id = 'T01' AND question_id = (SELECT question_id FROM questions WHERE question_code = 'ch1-q2')`
  );
  assert("question_submissions records wrong attempt with is_correct=0", wrongSubRows.length === 1 && wrongSubRows[0].is_correct === 0 && Number(wrongSubRows[0].points_awarded) === 0);

  const [wrongLedgerRows] = await connection.query(
    `SELECT COUNT(1) AS count FROM score_ledger WHERE team_id = 'T01' AND question_id = (SELECT question_id FROM questions WHERE question_code = 'ch1-q2')`
  );
  assert("score_ledger has 0 rows for incorrect submission", wrongLedgerRows[0].count === 0);

  // 6. Test Retry of Locked Incorrect Question
  console.log("\n--- 6. Testing Retry on Permanently Locked Incorrect Question ---");
  const retryWrongRes = await post(
    `${BACKEND_BASE}/questions/ch1-q2/submit`,
    { answer: "A" }, // Submitting correct answer after lock
    playerToken
  );
  assert("Retry on locked question returns idempotentRecovery: true", retryWrongRes.data.idempotentRecovery === true);
  assert("Retry awards 0 points on previously locked question", retryWrongRes.data.pointsAwarded === 0);

  // 7. Test Dual-Store Synchronization & Leaderboard (F4)
  console.log("\n--- 7. Testing Dual-Store Sync & Leaderboard (F4) ---");
  const lbRes = await get(`${BACKEND_BASE}/leaderboard`);
  assert("Leaderboard endpoint responds 200", lbRes.status === 200);
  const t01Lb = (lbRes.data.leaderboard || []).find((t) => t.teamId === "T01");
  assert("In-memory team score matches TiDB score (+10 PTS)", t01Lb && t01Lb.score === baseScore + 10, `In-memory score: ${t01Lb?.score}`);

  // 8. Test Event Pause & Ended Enforcement (F2)
  console.log("\n--- 8. Testing Event Paused & Ended Rejection (F2) ---");
  await post(`${BACKEND_BASE}/admin/event/pause`, {}, adminToken);

  const pausedSub = await post(
    `${BACKEND_BASE}/questions/ch1-q3/submit`,
    { answer: "B" },
    playerToken
  );
  assert("Submitting while tournament paused returns HTTP 403 EVENT_PAUSED", pausedSub.status === 403 && pausedSub.data.error === "EVENT_PAUSED");

  await post(`${BACKEND_BASE}/admin/event/resume`, {}, adminToken);

  await post(`${BACKEND_BASE}/admin/event/end`, {}, adminToken);

  // When event ends, player sessions are logged out (HTTP 401 SESSION_REVOKED)
  const playerEndedSub = await post(
    `${BACKEND_BASE}/questions/ch1-q3/submit`,
    { answer: "B" },
    playerToken
  );
  assert(
    "Player submission rejected after event ended (HTTP 401 or 403)",
    playerEndedSub.status === 401 || playerEndedSub.status === 403,
    `Status: ${playerEndedSub.status}`
  );

  // Authenticated admin submission directly tests QuestionService rejection with HTTP 403 EVENT_ENDED
  const adminEndedSub = await post(
    `${BACKEND_BASE}/questions/ch1-q3/submit`,
    { answer: "B", teamId: "T01" },
    adminToken
  );
  assert(
    "Submission while event ended returns HTTP 403 EVENT_ENDED",
    adminEndedSub.status === 403 && adminEndedSub.data.error === "EVENT_ENDED",
    `Status: ${adminEndedSub.status}, Error: ${adminEndedSub.data?.error}`
  );

  // Restart active event state
  await post(`${BACKEND_BASE}/admin/event/start`, {}, adminToken);

  // Re-login player to get valid token for socket test
  const relogin = await post(`${BACKEND_BASE}/auth/login`, {
    teamName: "Null Pointers",
    leaderName: "Aarav Sharma",
  });
  const activePlayerToken = relogin.data.token;

  // 9. Real-Time Socket Score Update & Broadcast Matrix (F4)
  console.log("\n--- 9. Testing Socket.IO Real-Time Score Broadcast (F4) ---");
  const testSocket = io(SOCKET_URL, {
    auth: { token: activePlayerToken },
    transports: ["websocket"],
  });

  let receivedScoreUpdate = false;
  let receivedLeaderboardUpdate = false;
  let scorePayload = null;

  testSocket.on("connect", () => {
    testSocket.emit("authenticate", { token: activePlayerToken });
  });
  testSocket.on("score:update", (data) => {
    if (data.teamId === "T01") {
      receivedScoreUpdate = true;
      scorePayload = data;
    }
  });
  testSocket.on("leaderboard:update", () => {
    receivedLeaderboardUpdate = true;
  });

  await wait(300);

  // Submit correct answer for ch1-q4 ("A")
  await post(
    `${BACKEND_BASE}/questions/ch1-q4/submit`,
    { answer: "A" },
    activePlayerToken
  );

  await wait(400);

  assert("Socket received score:update event in real time", receivedScoreUpdate === true, `Delta: ${scorePayload?.delta}`);
  assert("score:update contains delta = 10", scorePayload && scorePayload.delta === 10);
  assert("Socket received leaderboard:update event in real time", receivedLeaderboardUpdate === true);

  testSocket.disconnect();
  await connection.end();

  console.log("\n==================================================================");
  console.log(`🎉 ALL ${passed}/${total} MILESTONE 1 VERIFICATION TESTS PASSED (100%)!`);
  console.log("==================================================================");
}

run().catch((err) => {
  console.error("\n❌ Verification Failed:", err);
  process.exit(1);
});
