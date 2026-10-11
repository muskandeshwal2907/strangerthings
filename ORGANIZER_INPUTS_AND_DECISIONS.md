# Organizer Inputs & Tournament Decisions Catalog

**Event**: The Hawkins Protocol — Stranger Things Tournament  
**Audience**: Student Event Leads, Tech Coordinators & Decision Makers  
**Document Status**: Proposal & Decision Questionnaire (Read-Only Audit Phase)  

---

## 1. Overview & Purpose

This document catalogs the **7 key architectural, gameplay, and security decisions** that must be officially decided by the tournament organizers before development begins on fixes or migrations.

Each item below provides the **Context**, the **Options Available**, the **Trade-offs**, and the **Auditor Committee Recommendation**.

---

## 2. Decision Catalog

### Decision 1: Backend Architecture Unification

* **Current Reality**: The project currently has two parallel backends:
  - **Option A (Next.js + Supabase)**: Running on Port 3000, using Supabase PostgreSQL and Realtime broadcasts.
  - **Option B (Standalone Express + TiDB + Socket.IO)**: Built on Port 5000 according to the new backend specification, using TiDB Serverless, Socket.IO rooms, and cryptographic HMAC answer checking.
* **Problem**: Having both causes out-of-sync player scores, duplicated logic, and confusion.
* **Choices**:
  - **Choice 1 (Recommended)**: **Unify on Standalone Express + TiDB + Socket.IO (Port 5000)**. Point the Next.js frontend to Port 5000. TiDB provides 50M free queries/month and Socket.IO provides true low-latency room isolation.
  - **Choice 2**: Keep Next.js + Supabase on Port 3000 and discard the TiDB backend. (Lacks Socket.IO rooms and requires fixing all Supabase API routes).
* **Organizer Decision Needed**: Approve unifying the frontend exclusively to the Express + TiDB + Socket.IO backend.

---

### Decision 2: Question Secrecy & Client-Side Anti-Cheat

* **Current Reality**: `lib/chapterQuestions.ts` currently embeds all 70 question answers and decrypt codes inside the browser JavaScript bundle. In addition, demo auto-solve buttons exist in the quiz UI.
* **Problem**: Any participant who presses `F12` (Inspect Element) can view 100% of tournament answers in less than 30 seconds.
* **Choices**:
  - **Choice 1 (Recommended)**: **Strict Server-Side Validation**. Strip all `correctAnswerId`, `correctOrder`, and solutions from the frontend bundle. Have the frontend receive only prompts/options from the server and validate answers via HMAC on the backend.
  - **Choice 2**: Keep client-side checking for offline demo mode and trust participants on an honor code.
* **Organizer Decision Needed**: Confirm stripping all answers and demo auto-solve buttons from the client code.

---

### Decision 3: Vecna Messaging & Sabotage Approval Workflow

* **Current Reality**: The backend spec requires a **2-step approval workflow** where Vecna submits messages (max 150 chars) to an admin queue, and an admin must click "Approve" before any squad receives it. However, the frontend currently allows Vecna to broadcast 200-char sabotages directly to all squads without admin approval.
* **Choices**:
  - **Choice 1 (Recommended)**: **Strict 2-Step Admin Approval**. Vecna messages and sabotages enter a pending queue in the Admin Dashboard. Admin clicks Approve/Reject. Messages strictly capped at 150 chars.
  - **Choice 2**: **Unmoderated Instant Sabotages**. Allow the Vecna actor to trigger visual glitches/freezes directly, but route text lore messages through admin approval.
* **Organizer Decision Needed**: Choose between strict 2-step moderation for all Vecna actions vs instant visual sabotages with moderated lore text.

---

### Decision 4: Scoring Formula & Speed Bonus Calibration

* **Current Reality**: The spec defines a weighted composite score formula:
  $$\text{Total Score} = 0.30 \cdot \text{Tech} + 0.20 \cdot \text{Puzzle} + 0.15 \cdot \text{Speed} + 0.15 \cdot \text{Clues} + 0.10 \cdot \text{Story} + 0.10 \cdot \text{Teamwork} - \text{Penalties}$$
  Meanwhile, the legacy frontend uses simple raw point addition (100 pts per question minus 10 pts per hint).
* **Choices**:
  - **Choice 1 (Recommended)**: **Adopt the Weighted Composite Score Formula** with speed bonuses calculated dynamically based on remaining tournament time.
  - **Choice 2**: **Simple Integer Point Addition** (Base Points awarded immediately, fixed penalty deductions).
* **Organizer Decision Needed**: Confirm whether the leaderboard and final results should use the weighted composite formula or simple point sums.

---

### Decision 5: Squad Password Security & Roster Provisioning

* **Current Reality**: Squad passwords are currently stored in plaintext in the database, and the login system allows squads to log in using their Squad Leader's name as a password. Furthermore, the admin panel displays all plaintext passwords publicly.
* **Choices**:
  - **Choice 1 (Recommended)**: **Strong Password Hashing (bcrypt / Argon2id)**. Passwords hashed in database; remove squad leader name as a password fallback; mask passwords in the admin dashboard. Provide a pre-event CSV export of generated squad credentials for organizers to distribute privately.
  - **Choice 2**: Keep plaintext passwords in admin dashboard for easy emergency lookup during the event, but remove the squad leader name fallback.
* **Organizer Decision Needed**: Decide on password hashing vs plaintext organizer lookup.

---

### Decision 6: Dead Component & Prototype Cleanup

* **Current Reality**: 18 unused legacy components (`components/scenes/*`, `components/tasks/*`, `HawkinsMap.tsx`, `LoginScreen.tsx`, `app/todos/page.tsx`) remain in the repository from earlier prototypes.
* **Choices**:
  - **Choice 1 (Recommended)**: **Archive / Delete Dead Components**. Remove all 18 unmounted prototype components to reduce bundle weight, eliminate build errors, and maintain a clean repository.
  - **Choice 2**: Retain all legacy files in a `legacy_archive/` subfolder.
* **Organizer Decision Needed**: Approve the deletion or archiving of legacy components.

---

### Decision 7: Cloud Hosting & Infrastructure Setup

* **Current Reality**: The application requires hosting that supports:
  1. **Next.js Web UI** (Static assets & React interface)
  2. **Standalone Node.js Server** (Socket.IO WebSocket connections, in-memory rate limiting, sliding windows)
  3. **TiDB Serverless Database** (MySQL-compatible distributed SQL)
* **Hosting Analysis**:
  - Next.js frontend can be hosted for free on **Vercel**.
  - The standalone backend cannot run on Vercel serverless functions (due to persistent WebSocket requirements) and should be hosted on a free/low-cost persistent Node.js host such as **Render**, **Railway**, or **Fly.io**.
  - TiDB Serverless Free Tier provides **5 GB storage** and **50 Million Request Units (RU)/month** at $0 cost.
* **Organizer Decision Needed**: Approve deploying the frontend to Vercel and the Express/Socket.IO backend to Render/Railway connected to TiDB Serverless.

---

## 3. Organizer Sign-Off Questionnaire

Please review the recommended choices and confirm your selections:

| Decision Item | Topic | Recommended Selection | Organizer Choice (Confirmed / Alternate) |
|---|---|---|---|
| **D-1** | Backend Stack | **Choice 1**: Unify on Express + TiDB + Socket.IO | `[ ] Choice 1  [ ] Choice 2` |
| **D-2** | Answer Secrecy | **Choice 1**: Strict Server-Side HMAC Check (Strip all client keys) | `[ ] Choice 1  [ ] Choice 2` |
| **D-3** | Vecna Moderation | **Choice 1**: Strict 2-Step Admin Approval (<= 150 chars) | `[ ] Choice 1  [ ] Choice 2` |
| **D-4** | Scoring System | **Choice 1**: Weighted Composite Formula with Speed Bonus | `[ ] Choice 1  [ ] Choice 2` |
| **D-5** | Password Security | **Choice 1**: bcrypt/Argon2id Hashing + Masked Admin UI | `[ ] Choice 1  [ ] Choice 2` |
| **D-6** | Dead Code Cleanup | **Choice 1**: Delete 18 Unmounted Legacy Components | `[ ] Choice 1  [ ] Choice 2` |
| **D-7** | Hosting Target | **Choice 1**: Vercel (Frontend) + Render/Railway (Backend) + TiDB | `[ ] Choice 1  [ ] Choice 2` |

---

*This document is ready to be shared with student organizers and technical leads for alignment before any implementation steps.*
