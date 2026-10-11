# Frontend Feature & Component Audit — The Hawkins Protocol

**Audited Repository**: `c:\Users\nilot\OneDrive\Desktop\STRANGERS THING NIL`  
**Audit Date**: October 10, 2026  
**Auditor**: Specialized Frontend Auditor Subagent  
**Status**: Strictly Read-Only Inspection  

---

## 1. Executive Summary: Frontend Architecture & Health

The frontend is a **Next.js 15.5.24** application utilizing React 18, TypeScript, Framer Motion, and Tailwind CSS/CSS modules. It renders a retro 1980s Hawkins / Stranger Things themed tournament UI featuring CRT scanlines, glitch effects, neon glow typography, and an interactive corkboard investigation interface.

### Key Architectural Findings:
1. **Dual State & Backend Integration Split**:
   - The application contains two competing data layers: `lib/supabaseService.ts` (polling/subscribing to Supabase PostgreSQL) and `lib/tidbService.ts` / `lib/api.ts` (targeting the Express/TiDB backend on port 5000).
   - Currently, `lib/store.tsx` actively communicates with Next.js App Router API routes (`/api/auth/*`, `/api/questions/*`, `/api/hints/*`, `/api/vecna/*`) backed by Supabase, while `lib/realtime.ts` has Socket.io disabled (`getSocket()` returns `null`), falling back to Supabase Realtime and `BroadcastChannel`.
2. **Critical Client-Side Vulnerability (Answer Key Exposure)**:
   - `lib/chapterQuestions.ts` contains all 70 multiple-choice questions with plaintext `correctAnswerId`, `correctOrder`, and `hint` fields bundled directly into client-side JavaScript.
   - `components/chapters/QuestionTypeRenderer.tsx` and `components/chapters/HopperPoliceReportQuiz.tsx` feature active "DEMO AUTO-SOLVE" buttons and fallback auto-fill logic that automatically supplies correct answers.
3. **Admin Page Password Exposure**:
   - `app/admin/page.tsx` renders raw plaintext squad passwords (`item.password`) in a table with single-click "Copy" buttons.
4. **Dead / Legacy Scenes**:
   - Multiple unmounted legacy components exist in `components/scenes/` (`PoliceScene.tsx`, `LabScene.tsx`, `UpsideScene.tsx`, `WillScene.tsx`, `RadiometerScene.tsx`, `Scope.tsx`, `Skyline.tsx`, `Lightning.tsx`) alongside deprecated task components in `components/tasks/`.

---

## 2. Page & Route Audit Matrix

| Route Path | File Location | Intended Role | State / Backend Connection | Classification | Detailed Audit & Observations |
|---|---|---|---|---|---|
| `/` | `app/page.tsx` | Public / Participant / Vecna | `lib/store.tsx` (`useGame`) | `[COMPLETE / WORKING]` | Master orchestrator. Conditionally renders `LandingPage` (if unauthenticated), `VecnaEntryScreen` (if role is `VECNA`), `IntroCutscene` (first login), or active game views (`StageView` / `Ending`, `Hud`, `SabotageOverlay`, `ChapterCard`, `Toast`). Query param `?landing=1` forces landing page display. |
| `/admin` | `app/admin/page.tsx` | Organizer / Admin | `lib/api.ts` & `lib/supabaseService.ts` | `[SECURITY / INTEGRITY RISK]` `[CONFUSING / CONFLICTING]` | 3,171-line dashboard. Contains 3 tabs: Dashboard, Questions, Logs. Accepts passkey `"HAWKINS_CHIEF_1983"` or `"1234567"`. Exposes plaintext squad passwords in team tables. Contains manual point override inputs violating anti-tampering rules. Displays both TiDB status badges and Supabase real-time telemetry. |
| `/leaderboard` | `app/leaderboard/page.tsx` | Public / Spectator | `components/Leaderboard.tsx` -> `lib/supabaseService.ts` | `[COMPLETE / WORKING]` | Renders high-fidelity full-page leaderboard with animated `CinematicBackground` (spores), glitch titles, ranked squad table, live score progress bars, and stage indicators. Includes button returning to `/`. |
| `/vecna` | `app/vecna/page.tsx` | Vecna Actor | `lib/store.tsx` & `lib/supabaseService.ts` | `[PARTIAL / IN PROGRESS]` `[SECURITY / INTEGRITY RISK]` | Vecna command interface. Guards route by checking `session.role === "VECNA"` in `lib/store.tsx`. Contains quick sabotage triggers (GLITCH, LIGHTS_OUT, TIME_FREEZE) and custom message broadcast. **Gap**: Enforces 200-char limit instead of 150-char limit; broadcasts sabotages immediately to Supabase without requiring admin approval. |
| `/radio` | `app/radio/page.tsx` | Participant (Mini-game) | Local React state | `[PARTIAL / IN PROGRESS]` `[NEEDS ORGANIZER INPUT]` | Radio tuning challenge interface with frequency dial and audio wave feedback. Unconnected to global game progression state in `lib/store.tsx`. |
| `/radiotower` | `app/radiotower/page.tsx` | Participant (Mini-game) | Local React state | `[UNUSED / DEAD / REDUNDANT]` | Duplicate / alternate radio tower terminal interface with 5-digit frequency code verification. Superceded by Chapter 6 in `lib/chapterQuestions.ts`. |
| `/todos` | `app/todos/page.tsx` | Developer / Internal | Direct Supabase client | `[SAFE TO DELETE / REMOVE CANDIDATE]` | Generic Supabase test table reader (`supabase.from('todos').select()`). Leftover developer boilerplate. |

---

## 3. Core Component Inventory & Health

### 3.1 Landing & Authentication Components

#### `components/LandingPage.tsx`
- **Visibility**: Public / Pre-login.
- **Functionality**: Renders neon Stranger Things title, animated subtitle, team login form (Team ID / Username and Password / Leader Name), cinematic background video/canvas, audio ambient toggle, and Vecna entry portal button.
- **Connected State**: Calls `login(username, password)` from `lib/store.tsx`, targeting `/api/auth/login`.
- **Classification**: `[COMPLETE / WORKING]` `[DO NOT TOUCH / UNTOUCHED / KEEP]`
- **Observations**: Handles loading states, validation error banners, and smooth sound effects (`sfx.play("click")`).

#### `components/LoginScreen.tsx`
- **Visibility**: Standalone legacy component.
- **Functionality**: Alternate retro terminal login box with green CRT scanlines.
- **Connected State**: Local state only.
- **Classification**: `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]`
- **Observations**: Replaced by `LandingPage.tsx`. Not imported in `app/page.tsx`.

#### `components/VecnaEntryScreen.tsx`
- **Visibility**: Vecna role gate.
- **Functionality**: Fullscreen red-tinged atmospheric warning screen ("VECNA PROTOCOL DETECTED - ENTER THE UPSIDE DOWN") with audio drones and enter button redirecting to `/vecna`.
- **Classification**: `[COMPLETE / WORKING]`

---

### 3.2 Main Gameplay & Investigation Board Components

#### `components/StageView.tsx`
- **Visibility**: Authenticated Player.
- **Functionality**: Dynamically renders the active stage. If `s.currentChapter` or `s.stage` is Chapter 1-7, mounts `InvestigationBoard.tsx` with stage-specific props. Handles stage navigation tabs.
- **Classification**: `[COMPLETE / WORKING]`

#### `components/InvestigationBoard.tsx`
- **Visibility**: Main gameplay board.
- **Functionality**: Large corkboard investigation board with Polaroid photos, pushpins, red string connections between clues, newspaper clippings, audio tapes, and stage dossier cards.
- **Connected State**: Reads `s.currentChapter`, `s.solvedQuestions`, `s.unlockedHints` from `lib/store.tsx`.
- **Classification**: `[COMPLETE / WORKING]` `[DO NOT TOUCH / UNTOUCHED / KEEP]`
- **Observations**: High visual polish, fully responsive drag/scroll corkboard canvas with authentic 1983 Hawkins lore artifacts.

#### `components/chapters/ChapterManager.tsx`
- **Visibility**: Chapter modal overlay.
- **Functionality**: Renders chapter introduction modal, story dockets, question sequences, and launches question solvers (`HopperPoliceReportQuiz` or `QuestionTypeRenderer`).
- **Classification**: `[COMPLETE / WORKING]`

#### `components/chapters/HopperPoliceReportQuiz.tsx`
- **Visibility**: Question answering interface.
- **Functionality**: Hawkins Police Department Incident Report themed quiz card. Displays question prompt, multiple choice options (A, B, C, D), hint unlock button with score deduction warning, and submit button.
- **Connected State**: Dispatches `submitAnswer(questionId, answer)` and `unlockHint(questionId)` to `lib/store.tsx`.
- **Classification**: `[COMPLETE / WORKING]` `[SECURITY / INTEGRITY RISK]`
- **Critical Flaw**: Contains fallback auto-solve logic on line 154:
  ```typescript
  if (!completeAnswers[i]) {
    completeAnswers[i] = questions[i]?.correctAnswerId || "A";
  }
  ```
  If a player submits an empty selection, it auto-fills the correct answer from `lib/chapterQuestions.ts`.

#### `components/chapters/QuestionTypeRenderer.tsx`
- **Visibility**: Question type selector (MCQ, Terminal, Decryption, Audio).
- **Functionality**: Renders rich interactive question widgets based on `question.type`.
- **Classification**: `[COMPLETE / WORKING]` `[SECURITY / INTEGRITY RISK]`
- **Critical Flaw**: Line 88 contains a visible `[DEMO AUTO-SOLVE]` button in non-production or demo modes that selects the correct answer key and reveals decrypt text.

---

### 3.3 HUD, Realtime Overlays & Audio

#### `components/Hud.tsx`
- **Visibility**: Persistent in-game HUD.
- **Functionality**: Top status bar displaying Squad Name, Total Points, Active Stage / Chapter Badge, Real-time Countdown Timer (90:00 synchronized with server), Connection Status Indicator (Green = Online, Red = Offline), Audio Mute Toggle, and Sign Out button.
- **Connected State**: Connected to `lib/store.tsx` and `useGame()`.
- **Classification**: `[COMPLETE / WORKING]` `[DO NOT TOUCH / UNTOUCHED / KEEP]`

#### `components/SabotageOverlay.tsx`
- **Visibility**: Conditional overlay triggered during Vecna sabotages.
- **Functionality**: Fullscreen visual disruption when a sabotage is broadcast:
  - `GLITCH`: Screen shake, RGB split, chromatic aberration.
  - `LIGHTS_OUT`: Pitch black canvas with flickering flashlight beam.
  - `TIME_FREEZE`: Red digital countdown locking all inputs for 30–60 seconds.
- **Connected State**: Listens to `s.activeSabotage` in `lib/store.tsx` via Supabase Realtime channel.
- **Classification**: `[COMPLETE / WORKING]` `[DO NOT TOUCH / UNTOUCHED / KEEP]`

#### `components/Ending.tsx`
- **Visibility**: Game completion.
- **Functionality**: Victory / defeat epilogue screen displaying final squad score breakdown (Tech, Puzzle, Speed, Clues, Story, Teamwork, Penalties), rank badge, and cinematic epilogue credits.
- **Classification**: `[COMPLETE / WORKING]`

---

### 3.4 Vecna Control Components (`components/vecna/*`)

| Component | File Path | Functionality | Classification |
|---|---|---|---|
| `VecnaScreen.tsx` | `components/vecna/VecnaScreen.tsx` | Master Vecna control dashboard: tab navigation (Live Feed, Sabotage Console, Message Terminal, Squad Telemetry). | `[COMPLETE / WORKING]` |
| `VecnaTriggerPanel.tsx` | `components/vecna/VecnaTriggerPanel.tsx` | Sabotage trigger buttons (Glitch, Lights Out, Invert, Audio Jam, Time Freeze) with cooldown timers. | `[COMPLETE / WORKING]` |
| `VecnaMessagePanel.tsx` | `components/vecna/VecnaMessagePanel.tsx` | Custom message compose box and canned template selector. **Flaw**: 200 char limit vs 150 char backend spec. | `[PARTIAL / IN PROGRESS]` `[CONFUSING / CONFLICTING]` |
| `VecnaTeamTable.tsx` | `components/vecna/VecnaTeamTable.tsx` | Squad live monitoring table showing real-time stage, points, and frozen status. | `[COMPLETE / WORKING]` |
| `VecnaTacticalMap.tsx` | `components/vecna/VecnaTacticalMap.tsx` | Hawkins map with animated corruption pulse spreading across locations. | `[COMPLETE / WORKING]` |
| `VecnaTerminal.tsx` | `components/vecna/VecnaTerminal.tsx` | Command-line interface emulator for entering raw Vecna curse codes. | `[COMPLETE / WORKING]` |
| `VecnaStoryDialog.tsx` | `components/vecna/VecnaStoryDialog.tsx` | Narrative dialogue modal for Creel House lore entries. | `[COMPLETE / WORKING]` |
| `VecnaChaptersModal.tsx`| `components/vecna/VecnaChaptersModal.tsx` | Administrative chapter overview modal inside Vecna panel. | `[UNUSED / DEAD / REDUNDANT]` |

---

### 3.5 Legacy & Dead Component Inventory

The following components are **not imported or rendered** in the current main gameplay loop (`app/page.tsx` or `app/admin/page.tsx`):

| Component Path | Original Purpose | Replacement / Current Status | Recommendation |
|---|---|---|---|
| `components/HawkinsMap.tsx` | Interactive vector SVG Hawkins town map | Superceded by `InvestigationBoard.tsx` | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/ChallengePanel.tsx` | Generic sidebar challenge accordion | Superceded by `ChapterManager.tsx` & `HopperPoliceReportQuiz.tsx` | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/LoginScreen.tsx` | Legacy CRT terminal login box | Superceded by `LandingPage.tsx` | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/CharacterStage.tsx` | 2D pixel character stage selector | Superceded by `StageView.tsx` | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/scenes/PoliceScene.tsx` | Police station canvas scene | Legacy visual scene | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/scenes/LabScene.tsx` | Hawkins Lab canvas scene | Legacy visual scene | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/scenes/UpsideScene.tsx` | Upside Down canvas scene | Legacy visual scene | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/scenes/WillScene.tsx` | Byers house / Christmas lights scene | Legacy visual scene | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/scenes/RadiometerScene.tsx` | Radiometer frequency scene | Legacy visual scene | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/scenes/Scope.tsx` | Oscilloscope canvas widget | Legacy visual widget | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/scenes/Skyline.tsx` | Hawkins town skyline background | Legacy visual scene | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/scenes/Lightning.tsx` | Basic lightning canvas | Superceded by `RedLightningCanvas.tsx` & `IntroLightning.tsx` | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/tasks/QuizTask.tsx` | Generic quiz task runner | Superceded by `HopperPoliceReportQuiz.tsx` | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/tasks/LabTerminalTask.tsx`| Lab terminal code input | Superceded by `QuestionTypeRenderer.tsx` | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/tasks/CaseStudyTask.tsx` | Longform case study widget | Superceded by `ChapterManager.tsx` | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/tasks/RadioTask.tsx` | Radio frequency tuner task | Superceded by `app/radio/page.tsx` | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/tasks/ConnectionTask.tsx` | Wire connection mini-game | Unconnected prototype | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |
| `components/tasks/RearrangeTask.tsx` | Sequence sorting mini-game | Unconnected prototype | `[UNUSED / DEAD / REDUNDANT]` `[SAFE TO DELETE / REMOVE CANDIDATE]` |

---

## 4. Frontend Data Layer & State Management Audit

### 4.1 `lib/store.tsx` (`GameProvider` & `useGame`)
- **State Properties**:
  - `session`: `TeamSession | null` (teamId, teamName, leaderName, role, token).
  - `s`: Game progression state (stage, score, totalScore, currentChapter, solvedQuestions, unlockedHints, activeSabotage, timeRemaining, isFrozen).
  - `introSeen`: Boolean tracking cinematic typewriter playback.
- **Heartbeat & Polling**:
  - Sets up a 10-second polling interval calling `GET /api/auth/session` to sync server score, freeze duration, and submission status.
- **Submission Handlers**:
  - `submitAnswer(questionId, answer)`: Dispatches `POST /api/questions/submit`. Updates score and solved question map on HTTP 200; handles HTTP 423 `VECNA_FREEZE` by locking UI.
  - `unlockHint(questionId)`: Dispatches `POST /api/hints/use`. Adds revealed hint text and deducts points.
- **Classification**: `[COMPLETE / WORKING]` `[DO NOT TOUCH / UNTOUCHED / KEEP]`

### 4.2 `lib/chapterQuestions.ts`
- **Data Content**:
  - Exports `CHAPTER_QUESTIONS`: Array of 7 chapters, each containing 10 questions (70 total).
  - Fields include: `id`, `chapterId`, `title`, `prompt`, `type`, `options`, `points`, `hint`, `deduction`, **`correctAnswerId`**, **`correctOrder`**.
- **Classification**: `[SECURITY / INTEGRITY RISK]` `[CRITICAL ISSUE]`
- **Remediation**: The frontend must consume a **sanitized question interface** (`SanitizedQuestion`) where `correctAnswerId`, `correctOrder`, and secret hints are completely omitted.

---

## 5. Summary of Frontend Action Items (For Organizer Review)

1. **Delete Demo Auto-Solve & Clear Answer Keys**:
   - Remove lines containing `correctAnswerId` fallbacks in `HopperPoliceReportQuiz.tsx` and demo solve buttons in `QuestionTypeRenderer.tsx`.
   - Strip answer keys from `lib/chapterQuestions.ts`.
2. **Standardize Vecna Messaging Rules**:
   - Align `VecnaMessagePanel.tsx` with backend 150-character limit and route messages through the admin approval queue.
3. **Clean Up 18 Dead / Legacy Components**:
   - Safely archive or remove legacy components in `components/scenes/*`, `components/tasks/*`, `HawkinsMap.tsx`, and `app/todos/page.tsx` to reduce bundle size and maintenance overhead.
4. **Secure Admin Dashboard View**:
   - Mask plaintext passwords in `app/admin/page.tsx` and disable arbitrary manual score inputs.
