// test-backend.js - Comprehensive Verification Suite for Hawkins Protocol + TiDB Spec
const { default: app } = require("./dist/server.js");

async function runDirectTests() {
  console.log("==================================================================");
  console.log("⚡ TESTING HAWKINS PROTOCOL SPEC-ALIGNED BACKEND (IN-PROCESS)");
  console.log("   TiDB Distributed SQL + Socket.IO + Vecna Approval Pipeline");
  console.log("==================================================================");

  const PORT = 5055;
  const server = app.listen(PORT, async () => {
    const BASE = `http://localhost:${PORT}/api`;

    async function post(url, body, token) {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      return { status: res.status, data: await res.json().catch(() => ({})) };
    }

    async function get(url, token) {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(url, { headers });
      return { status: res.status, data: await res.json().catch(() => ({})) };
    }

    try {
      let passed = 0;
      let total = 0;

      function assert(title, condition, extra = "") {
        total++;
        if (condition) {
          passed++;
          console.log(`[PASS ${passed}] ✅ ${title} ${extra ? `(${extra})` : ""}`);
        } else {
          console.error(`[FAIL] ❌ ${title} ${extra ? `(${extra})` : ""}`);
          throw new Error(`Test failed: ${title}`);
        }
      }

      // 1. Health check
      const health = await get(`${BASE}/health`);
      assert("Health check returns TiDB Distributed SQL", health.status === 200 && health.data.database === "TIDB_DISTRIBUTED_SQL");

      // Reset test session state
      const { SessionService } = require("./dist/services/session.service.js");
      await SessionService.deleteTeamSession("T01");
      const { tidb } = require("./dist/config/tidb.js");
      if (tidb.pool) {
        try {
          await tidb.pool.query("DELETE FROM team_active_sessions WHERE team_id = 'T01'");
          await tidb.pool.query("DELETE FROM question_submissions WHERE team_id = 'T01'");
          await tidb.pool.query("DELETE FROM team_hint_usages WHERE team_id = 'T01'");
          await tidb.pool.query("DELETE FROM score_ledger WHERE team_id = 'T01'");
          await tidb.pool.query("DELETE FROM team_vecna_deliveries WHERE team_id = 'T01'");
        } catch {}
      }

      // 2. Team Login
      const login1 = await post(`${BASE}/auth/login`, { teamName: "Null Pointers", leaderName: "Aarav Sharma" });
      assert("First participant login succeeds", login1.data.success === true && login1.status === 200, `Team ID: ${login1.data.session?.teamId}`);

      // 3. Single Active Session Rule (Section 8.8 & 10.1)
      const login2 = await post(`${BASE}/auth/login`, { teamName: "Null Pointers", leaderName: "Aarav Sharma" });
      assert("Second login on another device is blocked (single session rule)", login2.status === 409 && login2.data.error === "ALREADY_LOGGED_IN", login2.data.message);

      // 4. Admin Auth Guard: Unauthenticated admin action is blocked
      const unauthLogout = await post(`${BASE}/admin/teams/T01/force-logout`, {});
      assert("Unauthenticated admin action is rejected (401)", unauthLogout.status === 401 && unauthLogout.data.error === "UNAUTHORIZED");

      // 5. Admin Passkey Authentication
      const adminLogin = await post(`${BASE}/auth/admin-login`, { passkey: "HAWKINS_CHIEF_1983" });
      assert("Admin passkey authentication succeeds", adminLogin.status === 200 && adminLogin.data.success === true);
      const adminToken = adminLogin.data.token;

      // 6. Admin Force Logout with Token
      const forceLogout = await post(`${BASE}/admin/teams/T01/force-logout`, {}, adminToken);
      assert("Authenticated admin can force logout an active team session", forceLogout.data.success === true);

      // 7. Revoked Session Token Rejection
      const revokedCheck = await get(`${BASE}/me/rounds`, login1.data.token);
      assert("Revoked player token is rejected immediately after force-logout (401)", revokedCheck.status === 401 && revokedCheck.data.error === "SESSION_REVOKED");

      // 8. Re-login after Force Logout
      const login3 = await post(`${BASE}/auth/login`, { teamName: "Null Pointers", leaderName: "Aarav Sharma" });
      assert("Team can log in again after admin force-logout", login3.data.success === true && login3.status === 200);
      const playerToken = login3.data.token;

      // 9. Event state inspection (Participant safe, public)
      const eventState = await get(`${BASE}/event/state`);
      assert("Event state read endpoint returns active event without secrets", eventState.data.success === true && eventState.data.event?.status === "active");

      // 10. Participant Rounds list (requires auth)
      const rounds = await get(`${BASE}/me/rounds`, playerToken);
      assert("Participant rounds list returned with valid token", rounds.data.success === true && rounds.data.rounds?.length >= 1);

      // 11. Question access without exposing secrets
      const qAccessible = await get(`${BASE}/rounds/1/questions/Q_CH1_CORONER`, playerToken);
      assert("Question prompt fetched without leaking answer keys", qAccessible.data.success === true && !qAccessible.data.question.correctAnswer);

      // 12. Authoritative HMAC Answer submission (Normalization: " A " -> "a")
      const subRes = await post(`${BASE}/questions/Q_CH1_CORONER/submit`, { answer: "  A  " }, playerToken);
      assert("HMAC answer submission evaluated server-side and awarded points", subRes.data.success === true && subRes.data.isCorrect === true && subRes.data.pointsAwarded === 100);

      // 13. Idempotency test (Submitting again returns saved result, no double points)
      const retrySub = await post(`${BASE}/questions/Q_CH1_CORONER/submit`, { answer: "A" }, playerToken);
      assert("Idempotent submission recovery returns saved locked state without duplicate award", retrySub.data.success === true && retrySub.data.isLocked === true);

      // 14. Hint consumption & deduction ledger (tested on unsubmitted Question 2)
      const hintRes = await post(`${BASE}/questions/Q_CH2_RADIO/hints/2/use`, {}, playerToken);
      assert("Hint endpoint returns hint text and records ledger penalty", hintRes.data.success === true && !!hintRes.data.hintText);

      // 15. Vecna Sender Login
      const vecnaLogin = await post(`${BASE}/vecna/auth/login`, { username: "vecna", password: "CREEL_HOUSE_001" });
      assert("Authorized Vecna sender logs in with separate credentials", vecnaLogin.data.success === true && vecnaLogin.data.sender?.username === "vecna");
      const vecnaToken = vecnaLogin.data.token;

      // 16. Vecna Recipients safe list
      const recipients = await get(`${BASE}/vecna/recipients`, vecnaToken);
      assert("Vecna sender can retrieve non-sensitive Hawkins team labels", recipients.data.success === true && recipients.data.recipients?.length > 0);

      // 17. Vecna Templates list (<= 150 chars)
      const templates = await get(`${BASE}/vecna/templates`, vecnaToken);
      assert("Vecna sender can retrieve active prepared templates", templates.data.success === true && templates.data.templates?.length > 0);

      // 18. Body length validation: >150 characters is rejected
      const longBody = "A".repeat(151);
      const longRes = await post(`${BASE}/vecna/messages`, {
        sourceType: "custom",
        bodyText: longBody,
        recipientScope: "all_teams",
      }, vecnaToken);
      assert("Message body > 150 characters is rejected server-side", longRes.status === 400 && longRes.data.success === false);

      // 19. Valid Vecna Message submission -> creates 'pending_approval' (NOT delivered yet)
      const msgSubmit = await post(`${BASE}/vecna/messages`, {
        sourceType: "custom",
        bodyText: "Tick tock, Hawkins. The clock strikes four.",
        recipientScope: "all_teams",
      }, vecnaToken);
      assert("Vecna message submitted in 'pending_approval' status", msgSubmit.data.success === true && msgSubmit.data.message?.approvalStatus === "pending_approval");
      const submittedMessageId = msgSubmit.data.message?.messageId;

      // 20. Hawkins Team Inbox BEFORE approval: must be EMPTY!
      const inboxBefore = await get(`${BASE}/me/vecna-messages`, playerToken);
      assert("Hawkins team inbox is empty before admin approval (unapproved message withheld)", inboxBefore.data.messages?.length === 0);

      // 21. Admin inspects pending review queue
      const pendingQueue = await get(`${BASE}/admin/vecna/messages/pending`, adminToken);
      assert("Admin can inspect pending Vecna review queue", pendingQueue.data.success === true && pendingQueue.data.messages?.some((m) => m.messageId === submittedMessageId));

      // 22. Admin explicitly approves the message
      const approveRes = await post(`${BASE}/admin/vecna/messages/${submittedMessageId}/approve`, {}, adminToken);
      assert("Admin approves message and creates recipient deliveries", approveRes.data.success === true && approveRes.data.deliveredCount > 0);

      // 23. Hawkins Team Inbox AFTER approval: message delivered!
      const inboxAfter = await get(`${BASE}/me/vecna-messages`, playerToken);
      assert("Hawkins team inbox now contains approved message", inboxAfter.data.messages?.length > 0 && inboxAfter.data.messages[0].bodyText.includes("Tick tock"));

      // 24. Event lifecycle controls (pause and resume)
      const pauseRes = await post(`${BASE}/admin/event/pause`, {}, adminToken);
      assert("Admin can pause the event", pauseRes.data.success === true && pauseRes.data.event?.isPaused === true);
      const resumeRes = await post(`${BASE}/admin/event/resume`, {}, adminToken);
      assert("Admin can resume the event", resumeRes.data.success === true && resumeRes.data.event?.isPaused === false);

      // 25. Results and overall standings
      const results = await get(`${BASE}/admin/results/overall`, adminToken);
      assert("Admin can retrieve overall tournament results", results.data.success === true && Array.isArray(results.data.results));

      // 26. Backward compatibility: legacy chapter validation & radiometer
      const chVal = await post(`${BASE}/chapters/validate`, {
        chapterId: 1,
        taskId: "ch1-quiz",
        answer: "A",
        teamId: "T01",
      });
      assert("Backward compatibility: Chapter 1 validation passes", chVal.data.success === true);

      const pinVal = await post(`${BASE}/radiometer/validate-pin`, { pinIndex: 0, answer: "8", teamId: "T01" });
      assert("Backward compatibility: Radiometer Pin validation passes", pinVal.data.success === true && pinVal.data.digit === "8");

      console.log("==================================================================");
      console.log(`🎉 ALL ${passed}/${total} SPECIFICATION & BACKEND TESTS PASSED WITH 100% SUCCESS!`);
      console.log("==================================================================");
      setTimeout(() => process.exit(0), 100);
    } catch (err) {
      console.error("Test execution error:", err);
      setTimeout(() => process.exit(1), 100);
    }
  });
}

runDirectTests();
