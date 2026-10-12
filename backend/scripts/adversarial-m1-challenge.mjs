// backend/scripts/adversarial-m1-challenge.mjs
// Adversarial Empirical Challenge Suite for Milestone 1:
// 1. Concurrency stress: rapid parallel submissions from the same team for the same question
// 2. Non-existent questions, special characters, whitespace variations, and SQL injection payloads
// 3. Event state transition stress: pause/resume/end during in-flight submissions
// 4. Direct TiDB persistence & dual-store integrity audit

import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const BACKEND_BASE = "http://localhost:5000/api";
const ADMIN_PASSKEY = "HAWKINS_CHIEF_1983";

let passedCount = 0;
let failedCount = 0;
const failures = [];
const findings = [];

function assert(category, testName, condition, details = "") {
  if (condition) {
    passedCount++;
    console.log(`  [PASS] [${category}] ${testName} ${details ? `(${details})` : ""}`);
  } else {
    failedCount++;
    const errMsg = `[FAIL] [${category}] ${testName} ${details ? `(${details})` : ""}`;
    console.error(`  ${errMsg}`);
    failures.push(errMsg);
  }
}

async function post(url, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (err) {
    return { status: 0, data: { error: err.message } };
  }
}

async function get(url, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const res = await fetch(url, { headers });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (err) {
    return { status: 0, data: { error: err.message } };
  }
}

async function run() {
  console.log("================================================================================");
  console.log("⚡ ADVERSARIAL CHALLENGER SUITE: MILESTONE 1 EMPIRICAL AUDIT");
  console.log("================================================================================");

  // 0. Connect to TiDB directly for ground-truth verification
  const tidbConn = await mysql.createConnection({
    host: process.env.TIDB_HOST,
    port: Number(process.env.TIDB_PORT) || 4000,
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  });

  // Login admin
  const adminLoginRes = await post(`${BACKEND_BASE}/auth/admin-login`, { passkey: ADMIN_PASSKEY });
  assert("AUTH", "Admin Login with master passkey", adminLoginRes.status === 200 && adminLoginRes.data.success);
  const adminToken = adminLoginRes.data.token;

  // Reset scores and ensure event is active and fresh
  await post(`${BACKEND_BASE}/admin/event/start`, {}, adminToken);

  // Authenticate teams
  // T05: Shadow Walkers / Mike Wheeler
  // T06: Hellfire Club / Eddie Munson
  // T04: Byte Byters / Dustin Henderson
  // T03: Rift Runners / Lucas Sinclair
  const t05Login = await post(`${BACKEND_BASE}/auth/login`, { teamName: "Shadow Walkers", leaderName: "Mike Wheeler" });
  assert("AUTH", "T05 Login (Shadow Walkers)", t05Login.status === 200 && Boolean(t05Login.data.token));
  const t05Token = t05Login.data.token;

  const t06Login = await post(`${BACKEND_BASE}/auth/login`, { teamName: "Hellfire Club", leaderName: "Eddie Munson" });
  assert("AUTH", "T06 Login (Hellfire Club)", t06Login.status === 200 && Boolean(t06Login.data.token));
  const t06Token = t06Login.data.token;

  const t04Login = await post(`${BACKEND_BASE}/auth/login`, { teamName: "Byte Byters", leaderName: "Dustin Henderson" });
  assert("AUTH", "T04 Login (Byte Byters)", t04Login.status === 200 && Boolean(t04Login.data.token));
  const t04Token = t04Login.data.token;

  const t03Login = await post(`${BACKEND_BASE}/auth/login`, { teamName: "Rift Runners", leaderName: "Lucas Sinclair" });
  assert("AUTH", "T03 Login (Rift Runners)", t03Login.status === 200 && Boolean(t03Login.data.token));
  const t03Token = t03Login.data.token;

  // ============================================================================
  // SUITE 1: CONCURRENCY STRESS ON POST /api/questions/:questionCode/submit
  // ============================================================================
  console.log("\n--------------------------------------------------------------------------------");
  console.log("🔥 SUITE 1: CONCURRENCY STRESS (RAPID PARALLEL SUBMISSIONS)");
  console.log("--------------------------------------------------------------------------------");

  // Test 1.1: 10 Rapid parallel identical CORRECT submissions from T05 for ch1-q1 (correct answer is "B")
  console.log(">>> [1.1] 10 Rapid Parallel Correct Submissions (ch1-q1 by T05)...");
  const p11 = Array.from({ length: 10 }).map(() =>
    post(`${BACKEND_BASE}/questions/ch1-q1/submit`, { answer: "B" }, t05Token)
  );
  const r11 = await Promise.all(p11);

  // Check HTTP responses
  const statuses11 = r11.map((r) => r.status);
  assert("CONCURRENCY", "All 10 parallel requests returned HTTP 200", statuses11.every((s) => s === 200), `Statuses: ${JSON.stringify(statuses11)}`);

  // Count fresh awards vs idempotent recoveries
  const nonIdempotentAwards = r11.filter((r) => r.data.pointsAwarded > 0 && !r.data.idempotentRecovery);
  const idempotentRecoveries = r11.filter((r) => r.data.idempotentRecovery === true);
  console.log(`  [OBSERVATION] Fresh awards claimed: ${nonIdempotentAwards.length}, Idempotent recoveries: ${idempotentRecoveries.length}`);

  const singleFreshAward = nonIdempotentAwards.length === 1;
  assert("CONCURRENCY", "Points awarded exactly once across parallel requests (no duplicate awards)", singleFreshAward, `Fresh award count: ${nonIdempotentAwards.length}`);
  if (!singleFreshAward) {
    findings.push(`CONCURRENCY RACE DEFECT: 10 parallel requests returned ${nonIdempotentAwards.length} fresh award responses claiming +10 PTS each!`);
  }

  assert("CONCURRENCY", "Concurrent duplicate attempts return idempotentRecovery: true", idempotentRecoveries.length === 9, `Recoveries: ${idempotentRecoveries.length}`);

  // Query TiDB ground truth for T05 / ch1-q1
  const [q11Rows] = await tidbConn.query("SELECT question_id FROM questions WHERE question_code = 'ch1-q1'");
  const q11Id = q11Rows[0].question_id;

  const [subCount11] = await tidbConn.query(
    "SELECT COUNT(*) AS total FROM question_submissions WHERE team_id = 'T05' AND question_id = ?",
    [q11Id]
  );
  assert("CONCURRENCY_TIDB", "TiDB question_submissions has EXACTLY 1 row for T05 / ch1-q1", Number(subCount11[0].total) === 1, `Count: ${subCount11[0].total}`);

  const [ledger11] = await tidbConn.query(
    "SELECT COUNT(*) AS count, COALESCE(SUM(points_delta), 0) AS totalDelta FROM score_ledger WHERE team_id = 'T05' AND question_id = ?",
    [q11Id]
  );
  assert("CONCURRENCY_TIDB", "TiDB score_ledger has EXACTLY 1 row for T05 / ch1-q1", Number(ledger11[0].count) === 1, `Rows: ${ledger11[0].count}`);
  assert("CONCURRENCY_TIDB", "TiDB score_ledger delta is EXACTLY +10 PTS", Number(ledger11[0].totalDelta) === 10, `Delta: ${ledger11[0].totalDelta}`);

  // Dual-store sync check
  const lb11 = await get(`${BACKEND_BASE}/leaderboard`);
  const t05Lb = lb11.data.leaderboard?.find((t) => t.teamId === "T05");
  const inMemoryScore = t05Lb?.score;
  const tidbScore = Number(ledger11[0].totalDelta);

  assert("DUAL_STORE", "Public Leaderboard in-memory score matches TiDB ground truth exactly", inMemoryScore === tidbScore, `In-memory: ${inMemoryScore}, TiDB: ${tidbScore}`);
  if (inMemoryScore !== tidbScore) {
    findings.push(`DUAL-STORE DESYNC DEFECT: Under concurrency, in-memory leaderboard score inflated to ${inMemoryScore} PTS while TiDB has ${tidbScore} PTS!`);
  }

  // Test 1.2: 10 Rapid parallel identical WRONG submissions from T05 for ch1-q2 (wrong answer "D", correct is "A")
  console.log("\n>>> [1.2] 10 Rapid Parallel Incorrect Submissions (ch1-q2 by T05)...");
  const p12 = Array.from({ length: 10 }).map(() =>
    post(`${BACKEND_BASE}/questions/ch1-q2/submit`, { answer: "D" }, t05Token)
  );
  const r12 = await Promise.all(p12);

  const statuses12 = r12.map((r) => r.status);
  assert("CONCURRENCY", "All 10 parallel incorrect requests returned HTTP 200", statuses12.every((s) => s === 200));

  const allZeroAwards = r12.every((r) => r.data.pointsAwarded === 0 && r.data.isCorrect === false);
  assert("CONCURRENCY", "All 10 parallel incorrect requests awarded 0 PTS", allZeroAwards);

  const [q12Rows] = await tidbConn.query("SELECT question_id FROM questions WHERE question_code = 'ch1-q2'");
  const q12Id = q12Rows[0].question_id;

  const [subCount12] = await tidbConn.query(
    "SELECT COUNT(*) AS total, is_correct, points_awarded FROM question_submissions WHERE team_id = 'T05' AND question_id = ? GROUP BY is_correct, points_awarded",
    [q12Id]
  );
  assert("CONCURRENCY_TIDB", "TiDB question_submissions has EXACTLY 1 row for T05 / ch1-q2", Number(subCount12[0]?.total) === 1, `Count: ${subCount12[0]?.total}`);
  assert("CONCURRENCY_TIDB", "TiDB submission recorded is_correct = 0", subCount12[0]?.is_correct === 0);
  assert("CONCURRENCY_TIDB", "TiDB submission recorded points_awarded = 0", Number(subCount12[0]?.points_awarded) === 0);

  const [ledger12] = await tidbConn.query(
    "SELECT COUNT(*) AS count FROM score_ledger WHERE team_id = 'T05' AND question_id = ?",
    [q12Id]
  );
  assert("CONCURRENCY_TIDB", "TiDB score_ledger has 0 rows for incorrect submission", Number(ledger12[0].count) === 0, `Rows: ${ledger12[0].count}`);

  // Test retry on locked question with correct answer "A"
  const retryCorrect12 = await post(`${BACKEND_BASE}/questions/ch1-q2/submit`, { answer: "A" }, t05Token);
  assert("CONCURRENCY", "Submitting correct answer on locked question returns idempotentRecovery: true", retryCorrect12.data.idempotentRecovery === true);
  assert("CONCURRENCY", "Submitting correct answer on locked question awards 0 points", retryCorrect12.data.pointsAwarded === 0);

  // Test 1.3: Race condition with mixed correct ("B") and incorrect ("D") submissions for ch1-q3 by T06
  console.log("\n>>> [1.3] 10 Parallel Mixed Submissions (5 Correct + 5 Incorrect for ch1-q3 by T06)...");
  const mixedPromises = [
    post(`${BACKEND_BASE}/questions/ch1-q3/submit`, { answer: "B" }, t06Token),
    post(`${BACKEND_BASE}/questions/ch1-q3/submit`, { answer: "D" }, t06Token),
    post(`${BACKEND_BASE}/questions/ch1-q3/submit`, { answer: "B" }, t06Token),
    post(`${BACKEND_BASE}/questions/ch1-q3/submit`, { answer: "D" }, t06Token),
    post(`${BACKEND_BASE}/questions/ch1-q3/submit`, { answer: "B" }, t06Token),
    post(`${BACKEND_BASE}/questions/ch1-q3/submit`, { answer: "D" }, t06Token),
    post(`${BACKEND_BASE}/questions/ch1-q3/submit`, { answer: "B" }, t06Token),
    post(`${BACKEND_BASE}/questions/ch1-q3/submit`, { answer: "D" }, t06Token),
    post(`${BACKEND_BASE}/questions/ch1-q3/submit`, { answer: "B" }, t06Token),
    post(`${BACKEND_BASE}/questions/ch1-q3/submit`, { answer: "D" }, t06Token),
  ];
  const r13 = await Promise.all(mixedPromises);

  const [q13Rows] = await tidbConn.query("SELECT question_id FROM questions WHERE question_code = 'ch1-q3'");
  const q13Id = q13Rows[0].question_id;

  const [subCount13] = await tidbConn.query(
    "SELECT COUNT(*) AS total FROM question_submissions WHERE team_id = 'T06' AND question_id = ?",
    [q13Id]
  );
  assert("CONCURRENCY_TIDB", "TiDB question_submissions has EXACTLY 1 row for T06 / ch1-q3 despite mixed race", Number(subCount13[0].total) === 1, `Count: ${subCount13[0].total}`);

  const [ledger13] = await tidbConn.query(
    "SELECT COUNT(*) AS count, COALESCE(SUM(points_delta), 0) AS totalDelta FROM score_ledger WHERE team_id = 'T06' AND question_id = ?",
    [q13Id]
  );
  const ledgerRows13 = Number(ledger13[0].count);
  const ledgerDelta13 = Number(ledger13[0].totalDelta);
  assert("CONCURRENCY_TIDB", "TiDB score_ledger has at most 1 row for T06 / ch1-q3", ledgerRows13 <= 1, `Rows: ${ledgerRows13}`);
  assert("CONCURRENCY_TIDB", "TiDB score_ledger points_delta is either 0 or 10", ledgerDelta13 === 0 || ledgerDelta13 === 10, `Delta: ${ledgerDelta13}`);

  // Dual-store check for T06
  const lb13 = await get(`${BACKEND_BASE}/leaderboard`);
  const t06Lb = lb13.data.leaderboard?.find((t) => t.teamId === "T06");
  const inMemoryT06 = t06Lb?.score;
  assert("DUAL_STORE", "GET /api/leaderboard score for T06 matches TiDB ground truth delta", inMemoryT06 === ledgerDelta13, `In-memory: ${inMemoryT06}, TiDB: ${ledgerDelta13}`);
  if (inMemoryT06 !== ledgerDelta13) {
    findings.push(`DUAL-STORE DESYNC DEFECT: T06 leaderboard score is ${inMemoryT06} PTS while TiDB has ${ledgerDelta13} PTS!`);
  }

  // ============================================================================
  // SUITE 2: BOUNDARY, INJECTION, SPECIAL CHARACTERS & MALFORMED PAYLOADS
  // ============================================================================
  console.log("\n--------------------------------------------------------------------------------");
  console.log("🛡️ SUITE 2: BOUNDARY, INJECTION & MALFORMED PAYLOADS");
  console.log("--------------------------------------------------------------------------------");

  // 2.1 Non-existent question codes
  console.log(">>> [2.1] Non-Existent Question Codes...");
  const nonExistent1 = await post(`${BACKEND_BASE}/questions/ch99-q99/submit`, { answer: "A" }, t04Token);
  assert("BOUNDARY", "Non-existent question code returns 404 QUESTION_NOT_FOUND", nonExistent1.status === 404 && nonExistent1.data.error === "QUESTION_NOT_FOUND");

  const nonExistent2 = await post(`${BACKEND_BASE}/questions/INVALID_CODE_123/submit`, { answer: "A" }, t04Token);
  assert("BOUNDARY", "Arbitrary non-existent question returns 404 QUESTION_NOT_FOUND", nonExistent2.status === 404 && nonExistent2.data.error === "QUESTION_NOT_FOUND");

  // 2.2 Blank / Missing / Whitespace-only answers
  console.log("\n>>> [2.2] Blank, Missing, and Whitespace-Only Answers...");
  const blankAns = await post(`${BACKEND_BASE}/questions/ch1-q4/submit`, { answer: "" }, t04Token);
  assert("BOUNDARY", "Empty answer string rejected with 400 MISSING_ANSWER", blankAns.status === 400 && blankAns.data.error === "MISSING_ANSWER");

  const noAns = await post(`${BACKEND_BASE}/questions/ch1-q4/submit`, {}, t04Token);
  assert("BOUNDARY", "Missing answer field rejected with 400 MISSING_ANSWER", noAns.status === 400 && noAns.data.error === "MISSING_ANSWER");

  // 2.3 Type confusion payloads
  console.log("\n>>> [2.3] Type Confusion Payloads (Non-String)...");
  const numAns = await post(`${BACKEND_BASE}/questions/ch1-q4/submit`, { answer: 12345 }, t04Token);
  assert("BOUNDARY", "Numeric answer rejected with 400 MISSING_ANSWER", numAns.status === 400 && numAns.data.error === "MISSING_ANSWER");

  const arrAns = await post(`${BACKEND_BASE}/questions/ch1-q4/submit`, { answer: ["C"] }, t04Token);
  assert("BOUNDARY", "Array answer rejected with 400 MISSING_ANSWER", arrAns.status === 400 && arrAns.data.error === "MISSING_ANSWER");

  const objAns = await post(`${BACKEND_BASE}/questions/ch1-q4/submit`, { answer: { val: "C" } }, t04Token);
  assert("BOUNDARY", "Object answer rejected with 400 MISSING_ANSWER", objAns.status === 400 && objAns.data.error === "MISSING_ANSWER");

  const boolAns = await post(`${BACKEND_BASE}/questions/ch1-q4/submit`, { answer: true }, t04Token);
  assert("BOUNDARY", "Boolean answer rejected with 400 MISSING_ANSWER", boolAns.status === 400 && boolAns.data.error === "MISSING_ANSWER");

  // Verify that ch1-q4 remains untouched and unlocked for T04 after all rejected malformed payloads
  const [q14Rows] = await tidbConn.query("SELECT question_id FROM questions WHERE question_code = 'ch1-q4'");
  const q14Id = q14Rows[0].question_id;
  const [subCount14Before] = await tidbConn.query(
    "SELECT COUNT(*) AS total FROM question_submissions WHERE team_id = 'T04' AND question_id = ?",
    [q14Id]
  );
  assert("BOUNDARY", "ch1-q4 remains unsubmitted after rejected malformed payloads", Number(subCount14Before[0].total) === 0);

  // 2.4 Whitespace and Case Normalization (ch1-q4: correct is 'A')
  console.log("\n>>> [2.4] Whitespace Trimming and Case Normalization (ch1-q4: correct is 'A')...");
  // Submit with lowercase 'a' and surrounding whitespace: "   \n a \t  "
  const normalizedSubmit = await post(`${BACKEND_BASE}/questions/ch1-q4/submit`, { answer: "   \n a \t  " }, t04Token);
  assert("NORMALIZATION", "Padding whitespace and lowercase answer accepted as correct (+10 PTS)", normalizedSubmit.status === 200 && normalizedSubmit.data.isCorrect === true && normalizedSubmit.data.pointsAwarded === 10);

  // 2.5 SQL Injection Payloads
  console.log("\n>>> [2.5] SQL Injection Stress Test (ch1-q5)...");
  const sqliPayload = "' OR '1'='1' -- ";
  const sqliRes1 = await post(`${BACKEND_BASE}/questions/ch1-q5/submit`, { answer: sqliPayload }, t04Token);
  assert("SQLI", "SQL injection answer payload handled safely (treated as incorrect, 0 PTS)", sqliRes1.status === 200 && sqliRes1.data.isCorrect === false && sqliRes1.data.pointsAwarded === 0);

  // Verify score_ledger table is still intact and queryable
  const [ledgerAudit] = await tidbConn.query("SELECT COUNT(*) AS total FROM score_ledger");
  assert("SQLI", "TiDB score_ledger table remains intact after injection attempt", Number(ledgerAudit[0].total) >= 1);

  // 2.6 Special Characters, Unicode, Null Bytes & Emojis
  console.log("\n>>> [2.6] Unicode, Null-Bytes and Special Characters (ch1-q6)...");
  const unicodeAns = await post(`${BACKEND_BASE}/questions/ch1-q6/submit`, { answer: "\u0000\t\r\n🔥👾👽" }, t04Token);
  assert("SPECIAL_CHARS", "Null bytes and emojis handled safely (no server crash or 500 error)", unicodeAns.status === 200 && unicodeAns.data.isCorrect === false);

  // 2.7 Extreme Payload Size (50KB body)
  console.log("\n>>> [2.7] Extreme Payload Size Stress Test (50KB on ch1-q7)...");
  const largePayload = "X".repeat(50000);
  const largeRes = await post(`${BACKEND_BASE}/questions/ch1-q7/submit`, { answer: largePayload }, t04Token);
  assert("PAYLOAD_SIZE", "50KB answer string handled safely without hanging or crashing", largeRes.status === 200 && largeRes.data.isCorrect === false);

  // ============================================================================
  // SUITE 3: EVENT STATE TRANSITIONS (PAUSE / RESUME / END IN-FLIGHT)
  // ============================================================================
  console.log("\n--------------------------------------------------------------------------------");
  console.log("⏸️ SUITE 3: EVENT STATE TRANSITIONS DURING IN-FLIGHT SUBMISSIONS");
  console.log("--------------------------------------------------------------------------------");

  // 3.1 Pause Rejection
  console.log(">>> [3.1] Submissions During Paused Tournament...");
  await post(`${BACKEND_BASE}/admin/event/pause`, {}, adminToken);

  const pausedSub = await post(`${BACKEND_BASE}/questions/ch1-q8/submit`, { answer: "A" }, t03Token);
  assert("EVENT_STATE", "Submission while tournament paused returns HTTP 403 EVENT_PAUSED", pausedSub.status === 403 && pausedSub.data.error === "EVENT_PAUSED");

  // Verify nothing written to TiDB while paused
  const [q18Rows] = await tidbConn.query("SELECT question_id FROM questions WHERE question_code = 'ch1-q8'");
  const q18Id = q18Rows[0].question_id;
  const [subCount18] = await tidbConn.query(
    "SELECT COUNT(*) AS total FROM question_submissions WHERE team_id = 'T03' AND question_id = ?",
    [q18Id]
  );
  assert("EVENT_STATE_TIDB", "Zero submissions written to TiDB while tournament is paused", Number(subCount18[0].total) === 0);

  // 3.2 In-Flight Race: Pause triggered concurrently with submission
  console.log("\n>>> [3.2] In-Flight Race: Concurrent Pause and Submit...");
  await post(`${BACKEND_BASE}/admin/event/resume`, {}, adminToken);

  const inFlightSubmitPromise = post(`${BACKEND_BASE}/questions/ch1-q9/submit`, { answer: "A" }, t03Token);
  const inFlightPausePromise = post(`${BACKEND_BASE}/admin/event/pause`, {}, adminToken);

  const [inFlightSubmitRes] = await Promise.all([inFlightSubmitPromise, inFlightPausePromise]);

  const validRaceStatus = inFlightSubmitRes.status === 200 || (inFlightSubmitRes.status === 403 && inFlightSubmitRes.data.error === "EVENT_PAUSED");
  assert("EVENT_RACE", "In-flight submission during state transition either completes cleanly or rejects 403 (atomic)", validRaceStatus, `Status: ${inFlightSubmitRes.status}`);

  // 3.3 Resume Tournament and Verify Normal Operation
  console.log("\n>>> [3.3] Tournament Resume Restoration...");
  await post(`${BACKEND_BASE}/admin/event/resume`, {}, adminToken);

  const resumeSubmitRes = await post(`${BACKEND_BASE}/questions/ch1-q10/submit`, { answer: "A" }, t03Token);
  assert("EVENT_STATE", "Submissions succeed normally after tournament resumed", resumeSubmitRes.status === 200);

  // 3.4 End Event Enforcement
  console.log("\n>>> [3.4] Submissions After Tournament End...");
  await post(`${BACKEND_BASE}/admin/event/end`, {}, adminToken);

  const endedSubAdmin = await post(
    `${BACKEND_BASE}/questions/ch2-q1/submit`,
    { answer: "A", teamId: "T03" },
    adminToken
  );
  assert("EVENT_STATE", "Submission after tournament ended returns HTTP 403 EVENT_ENDED", endedSubAdmin.status === 403 && endedSubAdmin.data.error === "EVENT_ENDED");

  // Restore tournament to active state
  await post(`${BACKEND_BASE}/admin/event/start`, {}, adminToken);

  // ============================================================================
  // SUITE 4: TIDB PERSISTENCE & DATABASE INTEGRITY AUDIT
  // ============================================================================
  console.log("\n--------------------------------------------------------------------------------");
  console.log("📊 SUITE 4: TIDB PERSISTENCE & DUAL-STORE INTEGRITY AUDIT");
  console.log("--------------------------------------------------------------------------------");

  // 4.1 Check for duplicate submissions in question_submissions
  const [duplicateSubs] = await tidbConn.query(`
    SELECT team_id, question_id, COUNT(*) AS count
    FROM question_submissions
    GROUP BY team_id, question_id
    HAVING count > 1
  `);
  assert("INTEGRITY", "Zero duplicate submissions across all teams and questions", duplicateSubs.length === 0, `Duplicate count: ${duplicateSubs.length}`);

  // 4.2 Check for duplicate entries in score_ledger
  const [duplicateLedger] = await tidbConn.query(`
    SELECT team_id, source_type, source_id, COUNT(*) AS count
    FROM score_ledger
    GROUP BY team_id, source_type, source_id
    HAVING count > 1
  `);
  assert("INTEGRITY", "Zero duplicate ledger entries across all teams and sources", duplicateLedger.length === 0, `Duplicate count: ${duplicateLedger.length}`);

  // 4.3 Check score_ledger sum matches teams.total_score in TiDB
  const [teamScoreCheck] = await tidbConn.query(`
    SELECT t.team_id, t.total_score, COALESCE(SUM(l.points_delta), 0) AS ledger_sum
    FROM teams t
    LEFT JOIN score_ledger l ON t.team_id = l.team_id
    GROUP BY t.team_id, t.total_score
  `);

  let allScoresConsistent = true;
  for (const row of teamScoreCheck) {
    if (Number(row.total_score) !== Number(row.ledger_sum)) {
      allScoresConsistent = false;
      console.error(`  Mismatch for ${row.team_id}: total_score=${row.total_score}, ledger_sum=${row.ledger_sum}`);
    }
  }
  assert("INTEGRITY", "TiDB teams.total_score matches score_ledger sum for all teams", allScoresConsistent);

  // 4.4 Catalog verification
  const [catQuestions] = await tidbConn.query("SELECT COUNT(*) AS total FROM questions WHERE question_code LIKE 'ch%-q%' AND is_active = 1");
  assert("INTEGRITY", "All 70 tournament questions active in TiDB", Number(catQuestions[0].total) === 70, `Count: ${catQuestions[0].total}`);

  const [catKeys] = await tidbConn.query("SELECT COUNT(*) AS total FROM question_answer_keys WHERE is_active = 1");
  assert("INTEGRITY", "All HMAC answer keys active in TiDB (>= 70)", Number(catKeys[0].total) >= 70, `Count: ${catKeys[0].total}`);

  await tidbConn.end();

  // ============================================================================
  // SUMMARY & VERDICT
  // ============================================================================
  console.log("\n================================================================================");
  console.log("📈 ADVERSARIAL CHALLENGER EXECUTION SUMMARY");
  console.log("================================================================================");
  console.log(`  Passed Tests:  ${passedCount}`);
  console.log(`  Failed Tests:  ${failedCount}`);
  console.log(`  Total Tests:   ${passedCount + failedCount}`);
  console.log("--------------------------------------------------------------------------------");

  if (findings.length > 0) {
    console.log("⚠️ EMPIRICAL DEFECT FINDINGS:");
    findings.forEach((f) => console.log(`  * ${f}`));
    console.log("--------------------------------------------------------------------------------");
  }

  if (failedCount === 0) {
    console.log("🎉 VERDICT: APPROVE");
  } else {
    console.log("❌ VERDICT: REJECT");
    console.log("Failures identified:");
    failures.forEach((f) => console.log(` - ${f}`));
  }
  console.log("================================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Adversarial test harness failed with unhandled error:", err);
  process.exit(1);
});
