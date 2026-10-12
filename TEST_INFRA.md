# E2E Test Infra: Hawkins Protocol Tournament System

## Test Philosophy
- Opaque-box, requirement-driven derived directly from `ORIGINAL_REQUEST.md` and `PROJECT.md`.
- No reliance on internal module implementation details; verifies through REST APIs and real-time Socket.IO events.
- Systematic 4-tier methodology:
  - **Tier 1**: Feature Coverage (Happy-path verification of each feature in isolation, >=5 per feature area).
  - **Tier 2**: Boundary & Corner Cases (Limits, edge cases, error-prone inputs, zero values, double-submissions, bad tokens).
  - **Tier 3**: Cross-Feature Combinations (Pairwise interactions: score update + presence update, pause event + submission attempt, reconnect during active event).
  - **Tier 4**: Real-World Application Scenarios (End-to-end full tournament flow: admin starts fresh event -> squads connect online -> answer questions -> submit incorrect answers -> admin pauses -> player attempts submission -> admin resumes -> final score calculation -> admin ends event).

## Feature Inventory Coverage Matrix
| # | Feature | Requirement Source | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|-------------------|:------:|:------:|:------:|:------:|
| F1 | TiDB 70-Question Catalog & HMAC Key Seeding | ORIGINAL_REQUEST § R1 | 5 | 5 | ✓ | ✓ |
| F2 | Backend Authoritative Question Evaluation | ORIGINAL_REQUEST § R1 | 5 | 5 | ✓ | ✓ |
| F3 | Atomic Persistence to Ledger & Submissions | ORIGINAL_REQUEST § R1 | 5 | 5 | ✓ | ✓ |
| F4 | Dual-Store (TiDB + Memory) Synchronization | ORIGINAL_REQUEST § R1, R3 | 5 | 5 | ✓ | ✓ |
| F5 | Client Data Sanitization (Zero Leakage) | ORIGINAL_REQUEST § R1 | 5 | 5 | ✓ | ✓ |
| F6 | Elimination of Client Evaluation Shortcuts | ORIGINAL_REQUEST § R1 | 5 | 5 | ✓ | ✓ |
| F7 | Explicit Offline/Unreachable Error Alerts | ORIGINAL_REQUEST § R1 | 5 | 5 | ✓ | ✓ |
| F8 | Rock-Solid Socket Presence Lifecycle | ORIGINAL_REQUEST § R2 | 5 | 5 | ✓ | ✓ |
| F9 | False 409 Session Lockout Remediation | ORIGINAL_REQUEST § R2 | 5 | 5 | ✓ | ✓ |
| F10| Admin Passkey Clearance Hardening | ORIGINAL_REQUEST § R2 | 5 | 5 | ✓ | ✓ |
| F11| TiDB Connection Resilience & Error Recovery | ORIGINAL_REQUEST § R3 | 5 | 5 | ✓ | ✓ |
| F12| Comprehensive Admin Controls Hardening | ORIGINAL_REQUEST § R3 | 5 | 5 | ✓ | ✓ |
| F13| Real-Time Broadcast Matrix Alignment | ORIGINAL_REQUEST § R3 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test Runner: Node.js test script `scripts/e2e-tournament-suite.mjs`
- Invocation: `node scripts/e2e-tournament-suite.mjs`
- Pass/Fail Semantics: Process exit code 0 on all tests passing, exit code 1 on any failure.
- Output: Structured report with per-tier and per-feature counts.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Target Behavior |
|---|----------|--------------------|-----------------|
| S1 | Multi-Squad Concurrent Login & Realtime Presence | F8, F9, F10 | Both T01 and T02 log in; Admin receives `presence:update` ONLINE within 1s; tab reloads reconnect cleanly without 409 lockout. |
| S2 | High-Stakes Answer Submission & Ledger Audit | F1, F2, F3, F4 | T01 submits correct answer (+10 PTS, ledger row created, standings updated); T02 submits wrong answer (0 PTS, locked). Duplicate submissions return idempotent locked state. |
| S3 | Tournament Emergency Freeze & Re-engagement | F12, F13, F2 | Admin pauses event; T01 submission receives HTTP 403 `EVENT_PAUSED`; Admin resumes event; T01 submission succeeds. |
| S4 | Event Start & Fresh Reset Lifecycle | F12, F13, F3 | Admin triggers Start Event; active squad scores reset to 0 PTS, active sessions cleared, sockets receive `event:state_changed`, HUD scores update. |
| S5 | Complete Tournament Conclusion & Lockout | F12, F8, F2 | Admin triggers End Event; active participants logged out, further submissions rejected, final standings preserved. |
