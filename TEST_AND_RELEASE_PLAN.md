# Test, Verification & Release Plan — The Hawkins Protocol

**Document Status**: Planning Only — Pre-Launch Quality Assurance & Release Criteria  
**Target Tournament Scale**: ~90 Squads (360+ Simultaneous Participants)  
**Objective**: Explicit test cases with deterministic Pass/Fail criteria covering security, data integrity, concurrency, and real-time reliability.

---

## 1. Test Suite Directory & Coverage Matrix

```
+----------------------------------------------------------------------------------------------------+
| Suite ID | Test Domain                           | Runner / Script            | Assertions / Tests |
+----------------------------------------------------------------------------------------------------+
| TS-01    | Authentication, Passwords & Sessions | backend/test-backend.js    | 6 Assertions       |
| TS-02    | Answer Secrecy & Anti-Cheat          | Automated Client Bundle Scan| 4 Assertions      |
| TS-03    | Submissions, Deductions & Ledger     | backend/test-backend.js    | 7 Assertions       |
| TS-04    | Vecna 2-Step Queue & Deliveries      | backend/test-backend.js    | 5 Assertions       |
| TS-05    | Socket.IO Rooms & Authorization      | Node WS Test Client        | 4 Assertions       |
| TS-06    | Concurrency & 90-Team Load Test      | backend/concurrency-test.js| 90 Sockets / 500 Q |
| TS-07    | Persistence & Reconnect Recovery     | Integration Script         | 4 Assertions       |
| TS-08    | Free-Tier Quota & Host Limits        | Cloud Telemetry Check      | 3 Metrics          |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Detailed Test Suites & Explicit Pass/Fail Criteria

### TS-01: Authentication, Passwords & Single-Session Enforcement
- **Objective**: Verify squad login, single active session enforcement, admin force-logout, and immediate token revocation.
- **Test Steps**:
  1. Login as Squad `T01` with valid credentials -> Expect HTTP 200 with JWT session token.
  2. Attempt simultaneous login as `T01` from a secondary device/session -> **Pass Criteria**: Server returns HTTP 409 `ALREADY_LOGGED_IN`.
  3. Chief Admin issues `POST /api/admin/teams/T01/force-logout` with valid admin token -> **Pass Criteria**: `team_active_sessions` row is deleted; Socket.IO emits `session:revoked` to `team:T01`.
  4. Attempt API request using the old revoked JWT -> **Pass Criteria**: Server returns HTTP 401 `SESSION_REVOKED`.
  5. Attempt login with Squad Leader name as password -> **Pass Criteria**: Server returns HTTP 401 `INVALID_CREDENTIALS` (Leader name is not accepted as password).
  6. Attempt admin login with `"1234567"` bypass -> **Pass Criteria**: Server returns HTTP 401 `INVALID_PASSKEY`.

---

### TS-02: Answer Secrecy & Client-Side Anti-Cheat Scan
- **Objective**: Verify that 100% of question answers, regex patterns, and cheat buttons are eliminated from client bundles.
- **Test Steps**:
  1. Build production Next.js frontend (`npm run build`).
  2. Run static analysis grep over `.next/static/` and `lib/`:
     ```bash
     grep -rn "correctAnswerId" .next/ lib/
     grep -rn "FINAL_CODE" .next/ lib/
     grep -rn "DEMO AUTO-SOLVE" .next/ components/
     ```
  3. **Pass Criteria**: Zero matches found across all client bundles.
  4. Query `GET /api/rounds/1/questions/Q01` with player token -> **Pass Criteria**: Returned JSON contains `prompt`, `points`, `options`, but **no `correctAnswer` or `correctAnswerId` field**.

---

### TS-03: Submissions, Idempotency, Hints & Score Ledger
- **Objective**: Verify that answer checking is cryptographic, hint deductions persist regardless of answer correctness, and scores match the immutable ledger.
- **Test Steps**:
  1. Submit correct answer for Question `Q01` -> **Pass Criteria**: Server returns `{ correct: true, pointsAwarded: 100 }`; `score_ledger` records `+100`.
  2. Re-submit the same Question `Q01` -> **Pass Criteria**: Server returns HTTP 200 with previous submission snapshot; **0 duplicate points added to ledger**.
  3. Unlock Hint 1 on Question `Q02` (penalty: 10) -> **Pass Criteria**: Server returns hint text; `score_ledger` records `-10`.
  4. Re-request Hint 1 on Question `Q02` -> **Pass Criteria**: Server returns hint text with `alreadyUnlocked: true`; **0 additional penalty deducted**.
  5. Submit wrong answer for Question `Q02` -> **Pass Criteria**: Server returns `{ correct: false, pointsAwarded: 0 }`; Question `Q02` is locked; **Hint deduction of -10 remains in ledger**.
  6. Verify Total Score query -> **Pass Criteria**: `SUM(score_ledger.delta)` equals exactly $100 - 10 = 90$.

---

### TS-04: Vecna 2-Step Approval Queue & Offline Deliveries
- **Objective**: Verify mandatory admin approval, 150-char validation, and offline squad recovery.
- **Test Steps**:
  1. Vecna submits message of 151 characters -> **Pass Criteria**: Server rejects with HTTP 400 `MESSAGE_TOO_LONG`.
  2. Vecna submits message of 140 characters targeting `T01` -> **Pass Criteria**: Inserted with status `pending_approval`; emitted to `admins` room; **not emitted to `team:T01`**.
  3. Admin issues `POST /api/admin/vecna/messages/:id/reject` -> **Pass Criteria**: Message marked `rejected`; sender notified; `T01` receives nothing.
  4. Vecna submits another message; Admin issues `POST /api/admin/vecna/messages/:id/approve` while `T01` is offline -> **Pass Criteria**: Message marked `approved`; snapshot created in `team_vecna_deliveries`.
  5. Squad `T01` connects and queries `GET /api/me/vecna-messages` -> **Pass Criteria**: Backlogged approved message is retrieved successfully.

---

### TS-05: Socket.IO Handshake, Room Authorization & Event Flow
- **Objective**: Verify WebSocket authentication and room boundary isolation.
- **Test Steps**:
  1. Connect WebSocket client with unauthenticated query `?role=ADMIN` -> **Pass Criteria**: Connection rejected or assigned only to `public:broadcast`; denied access to `admins` room.
  2. Connect WebSocket with valid Player JWT for `T01` -> **Pass Criteria**: Automatically joined to `team:T01` and `public:broadcast`; denied access to `team:T02`.
  3. Emit message to `team:T02` -> **Pass Criteria**: Client `T01` receives 0 events.
  4. Emit admin announcement to `public:broadcast` -> **Pass Criteria**: All connected sockets receive the announcement simultaneously.

---

### TS-06: 90-Team High Concurrency & Stress Testing
- **Objective**: Simulate tournament load with 90 squads making simultaneous submissions and score queries.
- **Test Configuration**:
  - Script: `backend/concurrency-test.js`
  - Concurrency: 90 concurrent virtual team sockets.
  - Operations: Simultaneous login, question fetch, hint unlock, and answer submission within a 5-second burst window.
- **Pass Criteria**:
  - **Success Rate**: 100% of valid requests return HTTP 200/400 (0 HTTP 500 internal server errors).
  - **Zero Duplicate Ledger Entries**: Exactly 90 submission records and 90 ledger entries created in TiDB.
  - **Response Latency**: 95th percentile response time $< 150\text{ms}$.
  - **Process Stability**: Zero unhandled promise rejections or Node.js process crashes.

---

### TS-07: Persistence & Backend Restart Recovery
- **Objective**: Ensure that a server restart or database reconnection causes zero loss of tournament progress.
- **Test Steps**:
  1. Complete Chapter 1 across 10 teams.
  2. Restart the Express backend process (`kill -9` -> restart).
  3. Refresh participant browser windows -> **Pass Criteria**:
     - Sessions remain authenticated.
     - Investigation board displays unlocked Chapter 2 and solved Chapter 1 questions.
     - Total scores, hint usages, and leaderboard standings remain 100% intact.

---

### TS-08: Free-Tier Quota & Operational Boundaries
- **TiDB Serverless Limits**:
  - Quota: 5 GB storage / 50 Million Request Units (RU)/month.
  - **Pass Criteria**: 90-team stress test generates $< 500,000$ RUs ($< 1\%$ of monthly free tier).
- **Vercel Frontend Bandwidth**:
  - Quota: 100 GB/month.
  - **Pass Criteria**: Static assets cached on edge CDN; total tournament bandwidth $< 10\text{ GB}$.
- **Persistent Backend Memory (Render/Railway Free/Starter)**:
  - Quota: 512 MB RAM.
  - **Pass Criteria**: Express + Socket.IO process memory footprint stays $< 180\text{ MB}$ under 90 connected sockets.

---

## 3. Pre-Flight Release Checklist

Before tournament commencement, the lead organizer and engineer must verify:

- [ ] All 8 test suites (TS-01 through TS-08) executed with 100% **PASS** status.
- [ ] Production frontend build verified with zero `correctAnswerId` occurrences.
- [ ] TiDB Serverless cluster initialized with `backend/database/tidb_schema.sql` and seeded with HMAC answer keys via `seed_data.mjs`.
- [ ] Admin passkey securely set in production environment variables (`ADMIN_PASSKEY`).
- [ ] Express server running on persistent host with keepalive tuning (`server.maxConnections = 5000`).
- [ ] Squad credentials exported to private organizer CSV for distribution.
- [ ] Backup snapshot created in TiDB Cloud Console prior to event kickoff.
