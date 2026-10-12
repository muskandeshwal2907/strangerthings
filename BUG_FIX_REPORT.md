# HAWKINS PROTOCOL — COMPREHENSIVE BUG FIX REPORT

**Date:** October 12, 2026  
**Status:** ALL ISSUES FIXED & FULLY VERIFIED  
**Architecture:** Node.js + Express + TiDB Distributed SQL + Socket.IO + Next.js (CRT Retro Aesthetic)

---

## EXECUTIVE SUMMARY

A rigorous code-level investigation and systematic remediation was conducted across the Stranger Things-themed "Hawkins Protocol" tournament application. All visual, presence, scoring, and event lifecycle defects have been resolved with targeted, surgical fixes. The 1980s retro CRT aesthetic, scanline overlays, ambient sound design, and player experience were strictly preserved.

---

## DETAILED FIX BREAKDOWN BY SCOPE

### 1. Team Dispatch Visuals & Vecna Telepathy Overlay
- **Defects Identified:**
  1. An oversized Vecna graphic (hands, arms, razor talons) dominated the screen and overlapped dispatch cards.
  2. Recurring 1–2 second red glow vignette flashed continuously due to an infinite Framer Motion loop (`animate={{ opacity: [0.3, 0.65, 0.3] }}`).
  3. Dispatch cards overflowed on small viewports and duplicate socket listeners caused multiple audio/visual bursts per message.
- **Root Cause:**
  - `components/SabotageOverlay.tsx` contained high-detail demonic hands SVGs positioned across bottom/sides and an ambient full-screen red pulsating vignette.
  - `backend/src/services/socket.service.ts` emitted both `sabotage` and `sabotage:received` events to both `public:broadcast` and `team:<id>` rooms, triggering 4 duplicate callbacks in `lib/realtime.ts`.
- **Changes Applied:**
  - **Replaced Hands with Subtle Vines:** Completely removed the Vecna claws, forearms, and talons SVGs from `components/SabotageOverlay.tsx`. Implemented subtle, understated Stranger Things atmospheric crimson vines framing the message card perimeter with non-interfering `pointerEvents: "none"`.
  - **Eliminated Infinite Vignette:** Removed the recurring pulsating full-screen red glow vignette.
  - **Responsive Sizing & Text Wrapping:** Set card container to `width: min(480px, 92vw)` with `wordBreak: "break-word"` and `whiteSpace: "normal"`, ensuring full dispatch text (e.g. `"THE GATE IS OPEN. YOU CANNOT STOP WHAT IS COMING."`) is completely visible without clipping or overlap.
  - **Deduplicated Sockets:** Removed duplicate `sabotage:received` emissions from `backend/src/services/socket.service.ts` and added payload `id` deduplication in `lib/realtime.ts`.

---

### 2. Online/Offline Status (Hawkins & Vecna)
- **Defects Identified:**
  1. Teams with inactive DB sessions were marked "Online" despite having zero active WebSocket connections.
  2. Browser refreshes occasionally flipped teams to "Offline" temporarily.
  3. Teams assigned the Vecna role (e.g. `TEAM04`) had their usernames forcibly overwritten to `VECNA-001`, preventing the display of `TEAM04 — VECNA — Online`.
- **Root Cause:**
  - `backend/src/controllers/admin.controller.ts` computed `isOnline` as `isSocketOnline || hasActiveSession`, trusting database records over real-time socket connections.
  - `admin.controller.ts` hardcoded `username: isVecna ? "VECNA-001" : ...`, which replaced squad usernames like `TEAM04` with `VECNA-001`.
  - `backend/src/services/socket.service.ts` did not track socket IDs per team, meaning stale disconnect events could prematurely clear a team's online state.
- **Changes Applied:**
  - **Socket-Driven Presence:** Presence in `admin.controller.ts` is now determined strictly by verified socket connections via `socketService.isTeamOnline(...)`. DB session records alone do not grant "Online" status.
  - **Connection Pooling (`teamSockets`):** Added `private teamSockets = new Map<string, Set<string>>()` in `SocketService`. Disconnect events only mark a team offline when all active socket connections for that team have closed.
  - **Canonical Team Matching:** Added canonical matching in `SocketService.isTeamOnline` supporting both `T04` and `TEAM04`.
  - **Squad Username Preservation:** In `admin.controller.ts`, preserved team squad usernames: only the root `VECNA-001` account displays `VECNA-001`; any squad assigned the Vecna role displays their proper squad username (e.g. `TEAM04 — VECNA — Online`).

---

### 3. Unified Scoring & Intel Clue Rules
- **Defects Identified:**
  1. Single-answer validation awarded 50 points plus speed bonuses instead of the unified +10 PTS rule.
  2. Clues/hints could be purchased even when teams had fewer than 5 points.
  3. Client-side store clamped scores to `0` via `Math.max(0, ...)`.
  4. Vecna Psychic Question trial display showed `+5 PTS` instead of `+10 PTS`.
- **Changes Applied:**
  - **+10 PTS Per Correct Answer:** Updated `backend/src/services/validation.service.ts` Case B to award strictly 10 points (`basePoints = 10`, `speedBonus = 0`, `totalAwarded = 10`), matching Case A and the unified tournament rules.
  - **Permanent Lock on Wrong Answer:** Wrong submissions award 0 PTS, permanently lock the question, and unlock sequential progression.
  - **Minimum 5-Point Balance Check for Intel Clues:**
    - In `backend/src/controllers/tasks.controller.ts`: checks `team.totalScore >= 5` before deducting penalty. Rejects with 400 `INSUFFICIENT_BALANCE` if score is under 5.
    - In `backend/src/services/question.service.ts`: checks available balance before deducting points for hints.
    - In `lib/store.tsx`: `unlockHint` verifies `currentScore >= cost` before applying penalty.
  - **Exact Confirmation Modal Text:** In `components/chapters/HopperPoliceReportQuiz.tsx` and `components/chapters/ChapterManager.tsx`, added double-click protection and the exact confirmation text:
    `"Use this Intel Clue? It will deduct 5 points from your current score."`
  - **No Clamp to 0:** Removed `Math.max(0, ...)` from `totalScore` in `lib/store.tsx`.
  - **Vecna Bounty Display:** Updated `app/vecna/page.tsx` line 1027 from `+5 PTS` to `+10 PTS`.

---

### 4. End Event Lifecycle & Session Invalidation
- **Defects Identified:**
  - The End Event confirmation prompt did not match tournament specifications.
  - In some flows, starting after ending attempted to resume rather than start a fresh event.
- **Changes Applied:**
  - **Exact Confirmation Prompt:** In `app/admin/page.tsx`, configured the exact prompt:
    `"End this event? All active Hawkins and Vecna teams will be logged out. Final scores and history will be preserved."`
  - **Terminal State Enforcement:** When an event ends:
    - Status is set to `'ended'`, `login_open = 0`, `submissions_open = 0`, `ended_at = NOW()`.
    - All active Hawkins and Vecna sessions are terminated in TiDB and local cache.
    - All sockets are disconnected and revoked (`event:ended`).
    - Final scores, solve histories, and submission ledgers remain preserved for admin inspection and CSV export.
    - Subsequent mutation attempts return 403 `EVENT_ENDED`.

---

### 5. Start Event & New Event Lifecycle
- **Defects Identified:**
  - Toggling event status to `active` after an event was ended called `/admin/event/resume`, resulting in a `Cannot resume an event that has permanently ended` error.
- **Changes Applied:**
  - In `app/api/admin/event/state/route.ts`: if `currentEvData?.event?.status === "ended"` or `"not_started"`, the route handler dispatches to `/admin/event/start`.
  - In `backend/src/services/eventControl.service.ts`: `startEvent` sets `started_at = NOW(3)` and clears `ended_at = NULL`, resets team scores and active progressions to 0, while preserving registered team accounts and audit history.

---

### 6. Deployment Readiness
- **Changes Applied:**
  - Dynamic API Base in `lib/api.ts`: checks `NEXT_PUBLIC_API_URL` first, falling back to `http://${host}:5000/api`.
  - Dynamic Backend Base in `lib/realtime.ts`: checks `NEXT_PUBLIC_BACKEND_URL`, then `NEXT_PUBLIC_API_URL`, falling back to `http://${host}:5000`.
  - Consistent Port in `backend/src/config/env.ts`: defaults `PORT` to `5000`.
  - Host binding: `backend/src/server.ts` binds to `0.0.0.0` for containerized environments on Render.
  - Created `.env.example` documenting all frontend and backend production configuration keys.
