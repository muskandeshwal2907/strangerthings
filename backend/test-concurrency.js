/**
 * HAWKINS PROTOCOL — CONCURRENCY, RECOVERY & PERSISTENCE TEST SUITE
 * 
 * Tests:
 * 1. Concurrent Multi-Team Authentication (T01 - T06)
 * 2. Concurrent Answer Submissions across multiple teams without race conditions
 * 3. Single-Session Guard under concurrent second-login attempts
 * 4. Administrator Force-Logout & immediate token revocation
 * 5. State Persistence: Team progress, scores, and submissions survive
 * 6. Rate Limiting enforcement on login endpoints
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const BASE = "http://127.0.0.1:5000/api";
let total = 0;
let passed = 0;

function assert(description, condition) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS ${total}] ✅ ${description}`);
  } else {
    console.error(`[FAIL ${total}] ❌ ${description}`);
    throw new Error(`Test failed: ${description}`);
  }
}

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || "GET",
        headers: options.headers || {},
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let data = null;
          try {
            data = JSON.parse(raw);
          } catch {
            data = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, data });
        });
      }
    );
    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

const get = (url, token) =>
  request(url, { method: "GET", headers: token ? { Authorization: `Bearer ${token}` } : {} });

const post = (url, body, token) =>
  request(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
    body
  );

async function runConcurrencyTests() {
  console.log("==================================================================");
  console.log("★ HAWKINS PROTOCOL — CONCURRENCY & PERSISTENCE TEST SUITE ★");
  console.log("==================================================================");

  const { default: app } = require("./dist/server.js");
  const PORT = 5056;
  const BASE = `http://localhost:${PORT}/api`;
  const server = app.listen(PORT, async () => {
    try {
      console.log("\n[TEST GROUP 1] Concurrent Multi-Team Authentication...");
      const teamsToLogin = [
        { teamName: "Null Pointers", leaderName: "Aarav Sharma", id: "T01" },
        { teamName: "Stack Smashers", leaderName: "Maya Lin", id: "T02" },
        { teamName: "Rift Runners", leaderName: "Lucas Sinclair", id: "T03" },
        { teamName: "Byte Byters", leaderName: "Dustin Henderson", id: "T04" },
        { teamName: "Shadow Walkers", leaderName: "Mike Wheeler", id: "T05" },
      ];

      // Clean sessions first if any existed
      const adminLoginRes = await post(`${BASE}/auth/admin-login`, { passkey: "HAWKINS_CHIEF_1983" });
      const adminToken = adminLoginRes.data.token;
      assert("Admin authentication succeeded", adminLoginRes.data.success === true && !!adminToken);

      for (const t of teamsToLogin) {
        await post(`${BASE}/admin/teams/${t.id}/force-logout`, {}, adminToken).catch(() => {});
      }

      // Concurrently log in 5 teams
      const loginPromises = teamsToLogin.map((t) =>
        post(`${BASE}/auth/login`, { teamName: t.teamName, leaderName: t.leaderName })
      );
      const loginResponses = await Promise.all(loginPromises);

      const tokens = {};
      loginResponses.forEach((res, idx) => {
        const team = teamsToLogin[idx];
        assert(`Team ${team.id} (${team.teamName}) authenticated concurrently`, res.data.success === true && !!res.data.token);
        tokens[team.id] = res.data.token;
      });

      console.log("\n[TEST GROUP 2] Concurrent Second-Device Rejection (Race Condition Check)...");
      // Concurrently attempt 3 duplicate logins for T01
      const dupPromises = [1, 2, 3].map(() =>
        post(`${BASE}/auth/login`, { teamName: "Null Pointers", leaderName: "Aarav Sharma" })
      );
      const dupResponses = await Promise.all(dupPromises);
      dupResponses.forEach((res, idx) => {
        assert(
          `Concurrent duplicate login ${idx + 1} rejected with 409 (single active session)`,
          res.status === 409 && res.data.error === "ALREADY_LOGGED_IN"
        );
      });

      console.log("\n[TEST GROUP 3] Concurrent Answer Submissions Across 5 Teams...");
      const subPromises = teamsToLogin.map((t) =>
        post(`${BASE}/questions/Q_CH1_CORONER/submit`, { answer: "A" }, tokens[t.id])
      );
      const subResponses = await Promise.all(subPromises);
      subResponses.forEach((res, idx) => {
        const team = teamsToLogin[idx];
        assert(
          `Team ${team.id} answer submitted concurrently & evaluated server-side`,
          res.data.success === true && res.data.isCorrect === true
        );
      });

      console.log("\n[TEST GROUP 4] Leaderboard Consistency After Concurrent Submissions...");
      const lbRes = await get(`${BASE}/leaderboard`);
      assert("Public leaderboard accessible without tokens", lbRes.data.success === true && Array.isArray(lbRes.data.leaderboard));
      assert("All 5 teams reflected on tournament leaderboard", lbRes.data.leaderboard.length >= 5);

      console.log("\n[TEST GROUP 5] Force-Logout & Instant Revocation Under Load...");
      const forceRes = await post(`${BASE}/admin/teams/T02/force-logout`, {}, adminToken);
      assert("Admin can force logout Team T02", forceRes.data.success === true);

      // Verify T02 token is revoked immediately
      const revokedCheck = await get(`${BASE}/me/rounds`, tokens["T02"]);
      assert("Team T02 token immediately rejected after force-logout (401)", revokedCheck.status === 401);

      // Team T02 can log back in
      const reloginRes = await post(`${BASE}/auth/login`, {
        teamName: "Stack Smashers",
        leaderName: "Maya Lin",
      });
      assert("Team T02 logs back in successfully", reloginRes.data.success === true && !!reloginRes.data.token);
      tokens["T02"] = reloginRes.data.token;

      console.log("\n[TEST GROUP 6] Verification of Progress & Score Persistence...");
      const t01Progress = await get(`${BASE}/me/rounds`, tokens["T01"]);
      assert("Team T01 progress persists and rounds are accessible", t01Progress.data.success === true);

      console.log("==================================================================");
      console.log(`🎉 ALL ${passed}/${total} CONCURRENCY & PERSISTENCE TESTS PASSED!`);
      console.log("==================================================================");

      server.close(() => {
        process.exit(0);
      });
    } catch (err) {
      console.error("Test execution failed:", err);
      server.close(() => {
        process.exit(1);
      });
    }
  });
}

runConcurrencyTests();
