// backend/scripts/forensic_m1_audit.mjs
// INDEPENDENT FORENSIC AUDIT SUITE FOR MILESTONE 1
// Executed by Forensic Integrity Auditor
import mysql from "mysql2/promise";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const BACKEND_BASE = "http://localhost:5000/api";
const ADMIN_PASSKEY = "HAWKINS_CHIEF_1983";
const HMAC_SECRET = process.env.ANSWER_HMAC_SECRET || "HAWKINS_SECRET_HMAC_KEY_1983";

let auditPassed = 0;
let auditTotal = 0;
const findings = [];

function check(title, condition, detail = "") {
  auditTotal++;
  if (condition) {
    auditPassed++;
    console.log(`[FORENSIC PASS ${auditPassed}] ✅ ${title} ${detail ? `| ${detail}` : ""}`);
  } else {
    const msg = `[FORENSIC VIOLATION ${auditTotal}] ❌ ${title} | ${detail}`;
    console.error(msg);
    findings.push(msg);
    throw new Error(msg);
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

async function runForensicAudit() {
  console.log("================================================================================");
  console.log("🕵️ FORENSIC INTEGRITY AUDIT: MILESTONE 1");
  console.log("================================================================================");

  // ---------------------------------------------------------------------------
  // SECTION 1: Direct TiDB Catalog & HMAC Cryptographic Integrity
  // ---------------------------------------------------------------------------
  console.log("\n[SECTION 1] TiDB Catalog & Cryptographic Seeding Verification");
  const conn = await mysql.createConnection({
    host: process.env.TIDB_HOST,
    port: parseInt(process.env.TIDB_PORT || "4000", 10),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: { rejectUnauthorized: true },
  });

  // Check 1.1: Total tournament questions
  const [qCount] = await conn.query(
    "SELECT COUNT(1) AS count FROM questions WHERE question_code LIKE 'ch%-q%'"
  );
  check("Exactly 70 tournament questions exist in TiDB", qCount[0].count === 70, `Observed: ${qCount[0].count}`);

  // Check 1.2: Round distribution 1..7 (10 questions per round)
  const [roundDist] = await conn.query(
    "SELECT round_id, COUNT(1) AS count FROM questions WHERE question_code LIKE 'ch%-q%' GROUP BY round_id ORDER BY round_id ASC"
  );
  check("Tournament spans exactly 7 rounds", roundDist.length === 7, `Rounds count: ${roundDist.length}`);
  for (const r of roundDist) {
    check(
      `Round ${r.round_id} has exactly 10 questions`,
      r.count === 10,
      `Round ${r.round_id} count: ${r.count}`
    );
  }

  // Check 1.3: Total HMAC keys in question_answer_keys
  const [kCount] = await conn.query(
    "SELECT COUNT(1) AS count FROM question_answer_keys WHERE question_id IN (SELECT question_id FROM questions WHERE question_code LIKE 'ch%-q%')"
  );
  check("At least 70 HMAC keys exist for tournament questions", kCount[0].count >= 70, `Keys count: ${kCount[0].count}`);

  // Check 1.4: Format of all stored HMAC keys
  const [keys] = await conn.query(
    "SELECT accepted_answer_hmac FROM question_answer_keys WHERE question_id IN (SELECT question_id FROM questions WHERE question_code LIKE 'ch%-q%')"
  );
  let allHexValid = true;
  for (const k of keys) {
    const hmac = String(k.accepted_answer_hmac || "").trim();
    if (!/^[0-9a-f]{64}$/i.test(hmac)) {
      allHexValid = false;
      break;
    }
  }
  check("All stored HMAC keys are valid 64-character SHA-256 hex digests", allHexValid);

  // Check 1.5: Cryptographic Match with Independent Calculation on ALL 70 Questions
  const { RAW_CHAPTER_QUESTIONS } = await import("../dist/config/vault.js");
  let all70Match = true;
  const mismatchDetails = [];

  for (let ch = 1; ch <= 7; ch++) {
    const chQuestions = RAW_CHAPTER_QUESTIONS[ch] || [];
    for (const q of chQuestions) {
      const canonicalAns = (q.correctAnswerId || "A").trim().toLowerCase();
      const expectedHmac = crypto.createHmac("sha256", HMAC_SECRET).update(canonicalAns).digest("hex");

      const [storedKeys] = await conn.query(
        `SELECT accepted_answer_hmac FROM question_answer_keys 
         WHERE question_id = (SELECT question_id FROM questions WHERE question_code = ?)`,
        [q.id]
      );
      const keyList = storedKeys.map(row => String(row.accepted_answer_hmac || "").trim().toLowerCase());
      if (!keyList.includes(expectedHmac)) {
        all70Match = false;
        mismatchDetails.push(`${q.id} (expected HMAC for '${canonicalAns}': ${expectedHmac})`);
      }
    }
  }
  check(
    "All 70 tournament questions contain authentic independently-verified HMAC hashes in TiDB",
    all70Match,
    mismatchDetails.length > 0 ? `Mismatches: ${mismatchDetails.join(", ")}` : "100% of 70 questions verified"
  );

  // ---------------------------------------------------------------------------
  // SECTION 2: Timing-Safe Comparison Runtime Unit Verification
  // ---------------------------------------------------------------------------
  console.log("\n[SECTION 2] Timing-Safe Comparison Empirical Verification");
  const hash1 = crypto.createHmac("sha256", HMAC_SECRET).update("test_answer").digest("hex");
  const hash2 = crypto.createHmac("sha256", HMAC_SECRET).update("test_answer").digest("hex");
  const hash3 = crypto.createHmac("sha256", HMAC_SECRET).update("wrong_answer").digest("hex");

  const buf1 = Buffer.from(hash1, "hex");
  const buf2 = Buffer.from(hash2, "hex");
  const buf3 = Buffer.from(hash3, "hex");

  check("crypto.timingSafeEqual returns true for identical hashes", crypto.timingSafeEqual(buf1, buf2) === true);
  check("crypto.timingSafeEqual returns false for different hashes of same length", crypto.timingSafeEqual(buf1, buf3) === false);

  // ---------------------------------------------------------------------------
  // SECTION 3: Authoritative Endpoint Adversarial & Security Testing
  // ---------------------------------------------------------------------------
  console.log("\n[SECTION 3] Authoritative Endpoint Adversarial Evaluation");

  // Authenticate Admin and Start Tournament
  const adminLogin = await post(`${BACKEND_BASE}/auth/admin-login`, { passkey: ADMIN_PASSKEY });
  check("Admin authentication succeeds", adminLogin.status === 200 && adminLogin.data.success);
  const adminToken = adminLogin.data.token;
  await post(`${BACKEND_BASE}/admin/event/start`, {}, adminToken);

  // Authenticate Test Team T02 (Stack Smashers) to avoid test collision with T01
  const playerLogin = await post(`${BACKEND_BASE}/auth/login`, {
    teamName: "Stack Smashers",
    leaderName: "Maya Lin",
  });
  check("Player authentication for T02 succeeds", playerLogin.status === 200 && playerLogin.data.token);
  const playerToken = playerLogin.data.token;
  const testTeamId = playerLogin.data.team?.teamId || "T02";

  // Clean test rows for T02 on target questions: ch1-q7, ch1-q8, ch1-q9
  await conn.query(
    `DELETE FROM question_submissions WHERE team_id = ? AND question_id IN (
      SELECT question_id FROM questions WHERE question_code IN ('ch1-q7', 'ch1-q8', 'ch1-q9')
    )`,
    [testTeamId]
  );
  await conn.query(
    `DELETE FROM score_ledger WHERE team_id = ? AND question_id IN (
      SELECT question_id FROM questions WHERE question_code IN ('ch1-q7', 'ch1-q8', 'ch1-q9')
    )`,
    [testTeamId]
  );

  // Initial score of T02
  const [t02ScoreRow] = await conn.query(
    "SELECT COALESCE(SUM(points_delta), 0) AS total FROM score_ledger WHERE team_id = ?",
    [testTeamId]
  );
  const startScore = Number(t02ScoreRow[0].total || 0);

  // Check 3.1: Non-existent question returns 404 QUESTION_NOT_FOUND
  const notFoundRes = await post(`${BACKEND_BASE}/questions/non_existent_code_999/submit`, { answer: "A" }, playerToken);
  check("Submitting to non-existent question yields HTTP 404", notFoundRes.status === 404);
  check("Submitting to non-existent question returns QUESTION_NOT_FOUND", notFoundRes.data.error === "QUESTION_NOT_FOUND");

  // Check 3.2: Empty answer or missing payload returns 400 MISSING_ANSWER
  const missingAnsRes = await post(`${BACKEND_BASE}/questions/ch1-q7/submit`, {}, playerToken);
  check("Missing answer yields HTTP 400", missingAnsRes.status === 400);
  check("Missing answer returns MISSING_ANSWER", missingAnsRes.data.error === "MISSING_ANSWER");

  // Check 3.3: Client-side tampering attempt (injecting fake pointsAwarded / isCorrect)
  // ch1-q7: canonical answer is "A". We submit wrong answer "Z" with forged parameters
  const tamperedRes = await post(
    `${BACKEND_BASE}/questions/ch1-q7/submit`,
    { answer: "Z", isCorrect: true, pointsAwarded: 9999, currentScore: 9999 },
    playerToken
  );
  check("Tampered submission returns HTTP 200", tamperedRes.status === 200);
  check("Backend authoritative evaluation rejects wrong answer despite forged body", tamperedRes.data.isCorrect === false);
  check("Backend awards strictly 0 points for wrong answer", tamperedRes.data.pointsAwarded === 0);
  check("Backend permanently locks question (isLocked: true)", tamperedRes.data.isLocked === true);

  // Check 3.4: TiDB Database State after wrong answer
  await wait(300);
  const [wrongSub] = await conn.query(
    `SELECT * FROM question_submissions WHERE team_id = ? AND question_id = (
      SELECT question_id FROM questions WHERE question_code = 'ch1-q7'
    )`,
    [testTeamId]
  );
  check("question_submissions records wrong attempt with is_correct = 0", wrongSub.length === 1 && wrongSub[0].is_correct === 0);
  check("question_submissions records points_awarded = 0", Number(wrongSub[0].points_awarded) === 0);

  const [wrongLedger] = await conn.query(
    `SELECT COUNT(1) AS count FROM score_ledger WHERE team_id = ? AND question_id = (
      SELECT question_id FROM questions WHERE question_code = 'ch1-q7'
    )`,
    [testTeamId]
  );
  check("score_ledger contains 0 rows for incorrect submission (no ledger pollution)", wrongLedger[0].count === 0);

  // Check 3.5: Idempotency & Permanently Locked Re-Attempt on Wrong Question
  const retryLockedRes = await post(
    `${BACKEND_BASE}/questions/ch1-q7/submit`,
    { answer: "A" }, // Submitting the correct answer now that it's locked
    playerToken
  );
  check("Retrying locked question returns idempotentRecovery: true", retryLockedRes.data.idempotentRecovery === true);
  check("Retrying locked question awards 0 points", retryLockedRes.data.pointsAwarded === 0);

  // Check 3.6: Correct answer submission on fresh question ch1-q8
  // ch1-q8 canonical answer is "A" (Three Musketeers)
  const correctRes = await post(
    `${BACKEND_BASE}/questions/ch1-q8/submit`,
    { answer: "  a  " }, // whitespace and case sensitivity test
    playerToken
  );
  check("Correct submission returns HTTP 200", correctRes.status === 200);
  check("Correct submission returns isCorrect: true", correctRes.data.isCorrect === true, `Response: ${JSON.stringify(correctRes.data)}`);
  check("Correct submission awards strictly 10 points", correctRes.data.pointsAwarded === 10);
  check("Correct submission sets isLocked: true", correctRes.data.isLocked === true);
  check("Correct submission updates currentScore accurately", correctRes.data.currentScore === startScore + 10);

  // Check 3.7: TiDB Database State after correct answer
  await wait(300);
  const [correctSub] = await conn.query(
    `SELECT * FROM question_submissions WHERE team_id = ? AND question_id = (
      SELECT question_id FROM questions WHERE question_code = 'ch1-q8'
    )`,
    [testTeamId]
  );
  check("question_submissions has 1 row with is_correct = 1", correctSub.length === 1 && correctSub[0].is_correct === 1);
  check("question_submissions has points_awarded = 10", Number(correctSub[0].points_awarded) === 10);

  const [correctLedger] = await conn.query(
    `SELECT * FROM score_ledger WHERE team_id = ? AND question_id = (
      SELECT question_id FROM questions WHERE question_code = 'ch1-q8'
    )`,
    [testTeamId]
  );
  check("score_ledger has exactly 1 entry for correct submission", correctLedger.length === 1);
  check("score_ledger points_delta is exactly 10.00", Number(correctLedger[0].points_delta) === 10);
  check("score_ledger source_type is 'QUESTION_SUBMISSION'", correctLedger[0].source_type === "QUESTION_SUBMISSION");

  // Check 3.8: Idempotent duplicate submission on correct question
  const duplicateCorrect = await post(
    `${BACKEND_BASE}/questions/ch1-q8/submit`,
    { answer: "C" },
    playerToken
  );
  check("Duplicate correct submission returns idempotentRecovery: true", duplicateCorrect.data.idempotentRecovery === true);
  check("Duplicate correct submission returns isLocked: true", duplicateCorrect.data.isLocked === true);
  const [duplicateLedger] = await conn.query(
    `SELECT COUNT(1) AS count FROM score_ledger WHERE team_id = ? AND question_id = (
      SELECT question_id FROM questions WHERE question_code = 'ch1-q8'
    )`,
    [testTeamId]
  );
  check("Score ledger entry count remains strictly 1 (no duplicate award)", duplicateLedger[0].count === 1);

  // Check 3.9: Dual-Store Synchronization (In-memory DB vs TiDB score_ledger)
  const [dbScoreRow] = await conn.query(
    "SELECT COALESCE(SUM(points_delta), 0) AS total FROM score_ledger WHERE team_id = ?",
    [testTeamId]
  );
  const tidbCalculatedScore = Number(dbScoreRow[0].total || 0);

  const lbRes = await get(`${BACKEND_BASE}/leaderboard`);
  check("GET /api/leaderboard returns 200", lbRes.status === 200);
  const memTeam = (lbRes.data.leaderboard || []).find(t => t.teamId === testTeamId);
  check(
    "In-memory cached score matches TiDB score_ledger sum exactly",
    memTeam && memTeam.score === tidbCalculatedScore,
    `Memory: ${memTeam?.score}, TiDB: ${tidbCalculatedScore}`
  );

  // Check 3.10: Event Paused & Event Ended Rejection
  await post(`${BACKEND_BASE}/admin/event/pause`, {}, adminToken);
  const pausedRes = await post(`${BACKEND_BASE}/questions/ch1-q9/submit`, { answer: "B" }, playerToken);
  check("Submission when paused returns HTTP 403 EVENT_PAUSED", pausedRes.status === 403 && pausedRes.data.error === "EVENT_PAUSED");

  await post(`${BACKEND_BASE}/admin/event/resume`, {}, adminToken);

  await post(`${BACKEND_BASE}/admin/event/end`, {}, adminToken);
  const endedRes = await post(`${BACKEND_BASE}/questions/ch1-q9/submit`, { answer: "B" }, playerToken);
  check("Submission when ended is rejected (HTTP 401 or 403)", endedRes.status === 401 || endedRes.status === 403);

  // Restore event start
  await post(`${BACKEND_BASE}/admin/event/start`, {}, adminToken);

  // Clean up T02 test submissions
  await conn.query(
    `DELETE FROM question_submissions WHERE team_id = ? AND question_id IN (
      SELECT question_id FROM questions WHERE question_code IN ('ch1-q7', 'ch1-q8', 'ch1-q9')
    )`,
    [testTeamId]
  );
  await conn.query(
    `DELETE FROM score_ledger WHERE team_id = ? AND question_id IN (
      SELECT question_id FROM questions WHERE question_code IN ('ch1-q7', 'ch1-q8', 'ch1-q9')
    )`,
    [testTeamId]
  );

  await conn.end();

  console.log("\n================================================================================");
  console.log(`🎉 FORENSIC INTEGRITY AUDIT PASSED: ${auditPassed}/${auditTotal} CHECKS VERIFIED CLEAN`);
  console.log("================================================================================");
}

runForensicAudit().catch(err => {
  console.error("\n❌ FORENSIC AUDIT FAILED:", err);
  process.exit(1);
});
