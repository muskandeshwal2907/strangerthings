# File-by-File Fix Matrix — The Hawkins Protocol

**Document Status**: Planning Only — Strict Frontend Design Freeze Maintained  
**Objective**: Comprehensive catalog of all surgical, minimal code changes proposed across the repository.  
**Rule**: No visual, layout, color, typography, or spacing modifications to approved frontend screens.

---

## 1. File Modification Catalog

```
+----------------------------------------------------------------------------------------------------+
| ID     | File Path                                        | Priority | Affects UI Appearance? | Approval Req? |
+----------------------------------------------------------------------------------------------------+
| FIX-01 | lib/chapterQuestions.ts                          | P1       | NO (Data Only)         | NO            |
| FIX-02 | components/chapters/HopperPoliceReportQuiz.tsx   | P1       | NO (Preserves Layout)  | NO            |
| FIX-03 | components/chapters/QuestionTypeRenderer.tsx     | P1       | NO (Removes Dev Btn)   | YES (Confirm) |
| FIX-04 | lib/tasks.ts                                     | P1       | NO (Data Only)         | NO            |
| FIX-05 | lib/radiometer.ts                                | P1       | NO (Data Only)         | NO            |
| FIX-06 | backend/src/services/answerValidation.service.ts | P1       | NO                     | NO            |
| FIX-07 | backend/src/routes/admin.routes.ts               | P1       | NO                     | NO            |
| FIX-08 | backend/src/routes/specGame.routes.ts            | P1       | NO                     | NO            |
| FIX-09 | backend/src/services/socket.service.ts           | P1       | NO                     | NO            |
| FIX-10 | backend/src/middleware/auth.middleware.ts        | P1       | NO                     | NO            |
| FIX-11 | backend/src/services/question.service.ts         | P2       | NO                     | NO            |
| FIX-12 | backend/src/services/vecna.service.ts            | P2       | NO                     | NO            |
| FIX-13 | backend/src/services/eventControl.service.ts     | P2       | NO                     | NO            |
| FIX-14 | backend/src/controllers/tasks.controller.ts      | P2       | NO                     | NO            |
| FIX-15 | backend/src/middleware/rateLimiter.middleware.ts | P2       | NO                     | NO            |
| FIX-16 | backend/src/routes/auth.routes.ts                | P2       | NO                     | NO            |
| FIX-17 | components/vecna/VecnaMessagePanel.tsx           | P3       | NO (150 Char Limit)    | NO            |
| FIX-18 | lib/api.ts                                       | P3       | NO (Network Target)    | NO            |
| FIX-19 | lib/realtime.ts                                   | P3       | NO (Socket.IO Bind)    | NO            |
| FIX-20 | lib/store.tsx                                    | P3       | NO (Data Binding)      | NO            |
| FIX-21 | app/admin/page.tsx                               | P3       | MINIMAL (Password Mask)| YES (Confirm) |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Detailed Fix Specifications

### FIX-01: Client Question Vault Sanitization
- **File Path**: `lib/chapterQuestions.ts`
- **Priority**: P1 (Critical Security)
- **Current Behaviour**: Exports 70 questions containing plaintext `correctAnswerId` (e.g. `"A"`), `correctOrder`, and full decryption answer keys bundled into client JavaScript.
- **Expected Behaviour**: Exports sanitized questions omitting all secret answers and solution orders.
- **Proposed Minimal Change**:
  - Define `export interface SanitizedQuestion` without `correctAnswerId` or `correctOrder`.
  - Strip answer values from `CHAPTER_QUESTIONS`.
- **Dependencies**: None.
- **Regression Risks**: Any component relying directly on `q.correctAnswerId` for client evaluation will need to rely on API submission responses.
- **Required Tests**: Verify `grep -rn "correctAnswerId" lib/` returns zero occurrences.
- **Affects UI Appearance?**: **NO**. Card layout, prompts, and option choices remain 100% identical.
- **Approval Required?**: NO.

---

### FIX-02: Quiz Auto-Fill Fallback Removal
- **File Path**: `components/chapters/HopperPoliceReportQuiz.tsx`
- **Priority**: P1 (Critical Anti-Cheat)
- **Current Behaviour**: Line 154 contains:
  ```typescript
  if (!completeAnswers[i]) {
    completeAnswers[i] = questions[i]?.correctAnswerId || "A";
  }
  ```
  Auto-supplies the correct answer if the player leaves a field empty.
- **Expected Behaviour**: Unanswered selections remain empty and fail validation without secret injection.
- **Proposed Minimal Change**: Remove line 154 and prompt the user to select an answer before submitting.
- **Dependencies**: FIX-01.
- **Regression Risks**: None.
- **Required Tests**: Submit blank quiz and verify server returns HTTP 400 validation error.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-03: Demo Auto-Solve Button Removal
- **File Path**: `components/chapters/QuestionTypeRenderer.tsx`
- **Priority**: P1 (Critical Anti-Cheat)
- **Current Behaviour**: Line 88 renders a visible `[DEMO AUTO-SOLVE]` button in non-production modes that reveals/selects correct answers.
- **Expected Behaviour**: No cheat buttons rendered on tournament screens.
- **Proposed Minimal Change**: Remove the `[DEMO AUTO-SOLVE]` button JSX block (Lines 88–96).
- **Dependencies**: None.
- **Regression Risks**: None.
- **Required Tests**: Inspect quiz cards in browser; verify clean render without developer debug buttons.
- **Affects UI Appearance?**: **YES (Minor - Removes Dev Button)**. Removes an unapproved development button; retains 100% of the quiz widget design.
- **Approval Required?**: YES (Organizer confirmation to remove debug button).

---

### FIX-04: Story Task Secrets Sanitization
- **File Path**: `lib/tasks.ts`
- **Priority**: P1 (Critical Anti-Cheat)
- **Current Behaviour**: Contains client-side regular expressions and power hints containing plaintext answers (e.g. `eleven: "Thirty-two"`, `/^417$/`).
- **Expected Behaviour**: Answers validated exclusively on backend; client stores only task prompts and character hint lore.
- **Proposed Minimal Change**: Remove solution regexes and answer spoilers from `lib/tasks.ts`.
- **Dependencies**: None.
- **Regression Risks**: None.
- **Required Tests**: Verify client bundle contains no task solution regexes.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-05: Radiometer Pin Answers Sanitization
- **File Path**: `lib/radiometer.ts`
- **Priority**: P1 (Critical Anti-Cheat)
- **Current Behaviour**: Exports `FINAL_CODE = "83479"` and pin answer arrays `[8, 32, 4, 7, 9]` in client JavaScript.
- **Expected Behaviour**: Client sends input to `/api/radiometer/validate-*`; server validates code.
- **Proposed Minimal Change**: Remove exported plaintext answer constants.
- **Dependencies**: None.
- **Regression Risks**: None.
- **Required Tests**: Test radio frequency validator against backend API.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-06: Answer Validation Fallback Removal
- **File Path**: `backend/src/services/answerValidation.service.ts`
- **Priority**: P1 (Critical Security)
- **Current Behaviour**: Lines 78–81 accept `"a"` or `"run"` unconditionally if TiDB is offline.
- **Expected Behaviour**: Cryptographic HMAC-SHA256 matching only against `question_answer_keys`. Returns false on errors.
- **Proposed Minimal Change**: Remove permissive fallback block.
- **Dependencies**: None.
- **Regression Risks**: If database is offline, submissions fail gracefully rather than auto-passing.
- **Required Tests**: Unit test `validateAnswer` with wrong answers; verify `false` returned.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-07: Admin Route Authorization Enforcement
- **File Path**: `backend/src/routes/admin.routes.ts`
- **Priority**: P1 (Critical Authorization)
- **Current Behaviour**: Routes mounted without `requireAuth(["ADMIN"])`. Unauthenticated callers can dump questions, update scores, and toggle event state.
- **Expected Behaviour**: All admin routes return HTTP 401/403 for unauthenticated or non-admin requests.
- **Proposed Minimal Change**: Add `router.use(requireAuth(["ADMIN"]))` at the top of `admin.routes.ts` (except `/login`).
- **Dependencies**: FIX-10.
- **Regression Risks**: Admin dashboard must attach Bearer token to requests.
- **Required Tests**: Query `/api/admin/teams` without token; assert HTTP 401 returned.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-08: Participant Endpoint BOLA Protection
- **File Path**: `backend/src/routes/specGame.routes.ts` & `backend/src/controllers/specGame.controller.ts`
- **Priority**: P1 (Critical Authorization)
- **Current Behaviour**: Endpoints accept `req.query.teamId` or `req.body.teamId` without authentication, allowing cross-team answer submission and hint deduction spoofing.
- **Expected Behaviour**: Routes require `requireAuth(["PLAYER"])`. Squad identity is derived strictly from `req.user.teamId`.
- **Proposed Minimal Change**: Add `router.use(requireAuth(["PLAYER"]))` and replace `req.query.teamId` fallbacks with `req.user.teamId`.
- **Dependencies**: FIX-10.
- **Regression Risks**: None.
- **Required Tests**: Send submission with spoofed `teamId` in body; verify submission credited strictly to token's `teamId`.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-09: Socket.IO Handshake & Room Authorization
- **File Path**: `backend/src/services/socket.service.ts`
- **Priority**: P1 (Critical Authorization)
- **Current Behaviour**: Sockets join `admins` and `role:admin` based on unverified `socket.handshake.query?.role === "ADMIN"`.
- **Expected Behaviour**: Socket middleware validates JWT token. Sockets join privileged rooms only if the verified token contains `role: "ADMIN"` or matching `teamId`.
- **Proposed Minimal Change**: Implement `io.use()` token verification middleware; restrict room joins to verified identity. Restrict `socket.on("award")` to admins.
- **Dependencies**: FIX-10.
- **Regression Risks**: Client must pass token in `io(url, { auth: { token } })`.
- **Required Tests**: Connect socket without token; verify rejected or restricted to `public:broadcast`.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-10: Stateful Session Check in Auth Middleware
- **File Path**: `backend/src/middleware/auth.middleware.ts`
- **Priority**: P1 (Critical Session Security)
- **Current Behaviour**: Verifies JWT signature statelessly. A force-logged-out team holding a JWT can continue accessing APIs until token expiry.
- **Expected Behaviour**: Checks `team_active_sessions` table / active session map to verify session has not been revoked.
- **Proposed Minimal Change**: Add `SessionService.isSessionActive(session.teamId)` check inside `requireAuth()`.
- **Dependencies**: None.
- **Regression Risks**: Minor database read overhead per authenticated request (cached in memory).
- **Required Tests**: Trigger admin force-logout; verify subsequent request with old JWT returns HTTP 401.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-11: SQL Database Transactions in QuestionService
- **File Path**: `backend/src/services/question.service.ts`
- **Priority**: P2 (Data Integrity)
- **Current Behaviour**: `submitAnswer` and `useHint` execute multiple SQL statements sequentially without `beginTransaction()`.
- **Expected Behaviour**: Atomic transaction ensures submission, ledger entry, and round advancement succeed or fail together.
- **Proposed Minimal Change**: Acquire pool connection and wrap operations in `try { await conn.beginTransaction(); ... await conn.commit(); } catch { await conn.rollback(); }`.
- **Dependencies**: None.
- **Regression Risks**: None.
- **Required Tests**: Simulate error during ledger insert; verify submission record is rolled back cleanly.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-12: SQL Database Transactions in VecnaService
- **File Path**: `backend/src/services/vecna.service.ts`
- **Priority**: P2 (Data Integrity)
- **Current Behaviour**: `approveMessage` updates message status and inserts delivery snapshots without a transaction.
- **Expected Behaviour**: Atomic approval and delivery record snapshot.
- **Proposed Minimal Change**: Wrap approval and snapshot queries in a database transaction.
- **Dependencies**: None.
- **Regression Risks**: None.
- **Required Tests**: Approve Vecna message; verify message status and delivery snapshots match atomically.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-13: Results Aggregation Cartesian Join Fix
- **File Path**: `backend/src/services/eventControl.service.ts`
- **Priority**: P2 (Data Integrity)
- **Current Behaviour**: `getOverallResults` performs multi-table `LEFT JOIN` on `score_ledger`, `question_submissions`, and `team_hint_usages`, creating a Cartesian product that multiplies scores.
- **Expected Behaviour**: Independent subquery aggregations joined with `teams`.
- **Proposed Minimal Change**: Rewrite SQL query to calculate `SUM(sl.delta)` and submission counts via subqueries.
- **Dependencies**: None.
- **Regression Risks**: None.
- **Required Tests**: Export CSV with known submissions and hint penalties; verify total score matches exact math.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-14: Tasks Controller Server-Side Penalty Calculation
- **File Path**: `backend/src/controllers/tasks.controller.ts`
- **Priority**: P2 (Security / Anti-Tamper)
- **Current Behaviour**: `const penaltyCost = cost !== undefined ? Number(cost) : 10;` allows clients to supply `cost: 0` to bypass hint penalties.
- **Expected Behaviour**: Penalty cost looked up strictly from server configuration.
- **Proposed Minimal Change**: Replace client `cost` parameter with authoritative server constant.
- **Dependencies**: None.
- **Regression Risks**: None.
- **Required Tests**: Call `unlockHint` passing `cost: 0`; verify server deducts configured penalty.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-15: Authentication Rate Limiting
- **File Path**: `backend/src/middleware/rateLimiter.middleware.ts` & `backend/src/routes/auth.routes.ts`
- **Priority**: P2 (Anti-Brute-Force)
- **Current Behaviour**: No rate limiting on login routes.
- **Expected Behaviour**: Limits login attempts to 5 requests per minute per IP.
- **Proposed Minimal Change**: Create `loginRateLimiter` and attach to `POST /api/auth/login`, `POST /api/auth/admin-login`, and `POST /api/vecna/auth/login`.
- **Dependencies**: None.
- **Regression Risks**: Legitimate users entering wrong password 5 times in 1 min will wait 60s.
- **Required Tests**: Send 6 rapid login requests; verify 6th returns HTTP 429.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-16: Vecna Message Length Validation
- **File Path**: `components/vecna/VecnaMessagePanel.tsx`
- **Priority**: P3 (Spec Compliance)
- **Current Behaviour**: Enforces a 200-character limit in frontend UI, whereas backend rejects messages over 150 characters.
- **Expected Behaviour**: UI enforces 150-character limit with character counter indicator (`maxLength={150}`).
- **Proposed Minimal Change**: Update `maxLength={150}` and character counter formula in `VecnaMessagePanel.tsx`.
- **Dependencies**: None.
- **Regression Risks**: None.
- **Required Tests**: Type 151 characters into Vecna message box; verify typing stops at 150.
- **Affects UI Appearance?**: **NO (Layout Preserved)**. Keeps exact same text area, font, and colors.
- **Approval Required?**: NO.

---

### FIX-17: Frontend API Client Binding
- **File Path**: `lib/api.ts`
- **Priority**: P3 (Integration)
- **Current Behaviour**: Targets Next.js API routes or legacy mock paths.
- **Expected Behaviour**: Centralized HTTP client targeting Express backend on Port 5000 (`process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"`), attaching JWT Bearer tokens.
- **Proposed Minimal Change**: Update API base URL and request wrappers in `lib/api.ts`.
- **Dependencies**: FIX-07, FIX-08.
- **Regression Risks**: None.
- **Required Tests**: Test login and question retrieval via `lib/api.ts`.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-18: Frontend Realtime Socket.IO Connection
- **File Path**: `lib/realtime.ts`
- **Priority**: P3 (Integration)
- **Current Behaviour**: `getSocket()` returns `null`; uses Supabase broadcast.
- **Expected Behaviour**: Initializes Socket.IO client connection to Port 5000 with JWT authentication payload.
- **Proposed Minimal Change**: Implement `io(SERVER_URL, { auth: { token } })` singleton in `lib/realtime.ts`.
- **Dependencies**: FIX-09.
- **Regression Risks**: None.
- **Required Tests**: Emit test event; verify received in browser console.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-19: Frontend Store Unification
- **File Path**: `lib/store.tsx`
- **Priority**: P3 (Integration)
- **Current Behaviour**: Dispatches submissions and hint unlocks to Next.js Supabase API routes.
- **Expected Behaviour**: Dispatches actions via `lib/api.ts` to Express backend and updates local React state from Socket.IO events.
- **Proposed Minimal Change**: Update action handlers in `GameProvider` to call `lib/api.ts` and listen to `lib/realtime.ts`.
- **Dependencies**: FIX-17, FIX-18.
- **Regression Risks**: None.
- **Required Tests**: Play through Chapter 1; verify question completion and score update smoothly.
- **Affects UI Appearance?**: **NO**.
- **Approval Required?**: NO.

---

### FIX-20: Admin Dashboard Password Display & Score Inputs
- **File Path**: `app/admin/page.tsx`
- **Priority**: P3 (Security / Policy)
- **Current Behaviour**: Displays raw plaintext squad passwords in team tables and includes manual score override inputs.
- **Expected Behaviour**: Passwords masked by default (`••••••••`) with reveal toggle; manual score override inputs disabled in accordance with tournament anti-tampering rules.
- **Proposed Minimal Change**: Mask password table cell with standard password dots and disable manual score inputs.
- **Dependencies**: FIX-07.
- **Regression Risks**: None.
- **Required Tests**: View admin squad list; verify passwords render masked.
- **Affects UI Appearance?**: **MINIMAL (Security Masking)**. Table layout and styles remain identical.
- **Approval Required?**: YES (Organizer confirmation for password masking).
