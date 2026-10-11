# Organizer Inputs, Blockers & Configuration Checklist

**Event**: The Hawkins Protocol — Stranger Things Tournament  
**Document Status**: Planning Only — Genuinely Necessary Inputs Catalog  

---

## 1. Decisions that Block Implementation (Action Required Before Implementation)

The following two items are the **only** blocking decisions required before code execution begins:

### Blocker 1: Official Approval of the Remediation Plan & Architecture
- **Question**: Do you approve unifying the application exclusively on the **Standalone Express + TiDB + Socket.IO backend (Port 5000)** while maintaining the strict **Frontend Design Freeze** on the Next.js UI?
- **Options**:
  - **Option A (Recommended)**: **Approve Unification & Design Freeze**. Proceed with minimal surgical wiring of `lib/api.ts` and `lib/realtime.ts` to Port 5000 without altering any frontend layouts, styling, or animations.
  - **Option B**: Keep Next.js App Router API routes with Supabase (requires re-writing Supabase API routes and giving up Socket.IO room features).

### Blocker 2: Confirmation of Secret Stripping & Demo Auto-Solve Removal
- **Question**: Do you confirm stripping all secret answer keys from client bundles (`lib/chapterQuestions.ts`, `lib/tasks.ts`, `lib/radiometer.ts`) and removing the non-production `[DEMO AUTO-SOLVE]` button from the quiz card?
- **Options**:
  - **Option A (Recommended)**: **Yes, Strip All Client Keys & Remove Demo Solve**. All answer validation will happen cryptographically on the backend.
  - **Option B**: Keep client answers for local demo testing.

---

## 2. Operational Details that Can Be Configured Later (Non-Blocking)

These items do **not** block code remediation and can be adjusted anytime before tournament day:

1. **Final Squad Roster & Credentials**:
   - Initial seed list contains 8 squads (`T01`–`T08`). Additional teams (up to ~90 squads) can be imported via CSV or database seed script closer to event day.
2. **Custom Vecna Message Canned Templates**:
   - 4 default templates are pre-configured. Additional lore messages (<= 150 chars) can be inserted into the database anytime.
3. **Event Start / End Timing**:
   - Total game duration defaults to 90 minutes (5400s) and can be adjusted in the environment variable `TOTAL_GAME_TIME`.
4. **Admin Clearances**:
   - 3–5 tournament administrators share the master passkey (`ADMIN_PASSKEY`). Additional named admin accounts can be configured if desired.

---

## 3. Deployment Credentials & Secrets (Required Only at Deployment Time)

When deploying to production (Render/Railway and Vercel), the organizer will supply these values privately via cloud dashboard environment variables:

| Environment Variable | Target Service | Description / Source | Sensitivity |
|---|---|---|---|
| `TIDB_HOST` | Backend (Render/Railway) | Hostname from TiDB Cloud Console (e.g. `gateway01.xxx.prod.aws.tidbcloud.com`) | Secret |
| `TIDB_PORT` | Backend (Render/Railway) | `4000` (Default TiDB port) | Public |
| `TIDB_USER` | Backend (Render/Railway) | Username from TiDB Cloud Console (e.g. `xxx.root`) | Secret |
| `TIDB_PASSWORD` | Backend (Render/Railway) | Password generated during TiDB cluster creation | High Secret |
| `TIDB_DATABASE` | Backend (Render/Railway) | Database name (`stranger_thinks` or `hawkins_protocol`) | Standard |
| `TIDB_SSL` | Backend (Render/Railway) | `true` | Standard |
| `JWT_SECRET` | Backend (Render/Railway) | Random 64-character hex string for signing session tokens | High Secret |
| `ANSWER_HMAC_SECRET` | Backend (Render/Railway) | Random 64-character hex string for HMAC answer keys | High Secret |
| `SESSION_TOKEN_PEPPER` | Backend (Render/Railway) | Random 64-character hex string for session token hashing | High Secret |
| `ADMIN_PASSKEY` | Backend & Next.js | Secure organizer passkey for Chief Admin clearance | High Secret |
| `NEXT_PUBLIC_API_URL` | Frontend (Vercel) | Public HTTPS URL of the deployed Express backend (e.g. `https://api.hawkinsprotocol.com/api`) | Public |
| `NEXT_PUBLIC_SOCKET_URL`| Frontend (Vercel) | Public WebSocket URL of the deployed Express backend (e.g. `wss://api.hawkinsprotocol.com`) | Public |

*Note: Never paste real secret values into chat prompts or repository files.*

---

## 4. Decisions Already Established & Settled (Do Not Ask Again)

The following requirements have been firmly decided and are locked in the plan:

1. **Frontend Visual Design**: Strictly frozen. No restyling, new buttons, layout changes, or component replacements.
2. **Database Engine**: TiDB Serverless Distributed SQL (50M free RU/mo).
3. **Realtime Engine**: Socket.IO with authenticated room isolation (`team:<teamId>`, `admins`, `role:vecna`).
4. **Single Active Session**: Strictly enforced. Second concurrent login returns HTTP 409 `ALREADY_LOGGED_IN`.
5. **No Inactivity Timeout**: Logged-in sessions remain active across page reloads and browser closures unless explicitly forced out by an admin.
6. **No Participant Password Changes**: Squad passwords are fixed and managed by tournament organizers.
7. **Sequential Round Progression**: Teams cannot skip unanswered questions to advance; previous unlocked rounds can be revisited.
8. **Single Submission per Question**: Questions can be submitted only once; wrong answers earn 0 marks and lock the question.
9. **Persistent Hint Deductions**: Hint penalties persist even if the subsequent answer is incorrect.
10. **Server-Side Scoring**: All points and penalties calculated authoritatively on the backend; administrators cannot manually edit team scores.
11. **Vecna 2-Step Approval Queue**: All Vecna messages (<= 150 chars) require administrator approval before delivery to squad rooms; no automatic triggers.
