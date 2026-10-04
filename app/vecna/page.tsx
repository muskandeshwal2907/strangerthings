"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { STAGES, StageId } from "@/lib/stages";
import { mmss } from "@/lib/results";
import {
  CONFIG,
  PLAYER_TEAMS,
  getStoredSession,
  clearSession,
  AuthSession,
} from "@/lib/config";
import {
  publish,
  subscribe,
  RealtimeMessage,
  StoryEventType,
} from "@/lib/realtime";
import UpsideScene from "@/components/scenes/UpsideScene";
import Glitch from "@/components/Glitch";
import { sfx } from "@/lib/audio";

type Kind = "CORRUPT" | "TIME_FREEZE" | "LOCK" | "DISTORT" | "SIGNAL_JAM" | "WATCH" | "MESSAGE" | "GLITCH";

const ACTIONS: { kind: Kind; cost: number; desc: string }[] = [
  { kind: "GLITCH",      cost: 10, desc: "Trigger visual glitch burst + static on target screen" },
  { kind: "CORRUPT",     cost: 20, desc: "Scramble the current challenge text with glitch runes" },
  { kind: "TIME_FREEZE", cost: 35, desc: "Remove 2 minutes of game time" },
  { kind: "LOCK",        cost: 25, desc: "Lock task inputs with Access Denied banner" },
  { kind: "DISTORT",     cost: 30, desc: "Transform challenge text into leetspeak & blur" },
  { kind: "SIGNAL_JAM",  cost: 20, desc: "Re-distort radiometer + disable radio tuning for 30s" },
  { kind: "WATCH",       cost: 5,  desc: "Monitor progress, mark team screen with eye icon" },
  { kind: "MESSAGE",     cost: 15, desc: "Broadcast a sinister full-screen warning message" },
];

const ALL_CHALLENGES = [
  { id: "town-1", name: "Town Square: Unknown Broadcast (Radio)" },
  { id: "police-quiz", name: "Police Station: Police File Case 86-04" },
  { id: "police-incident", name: "Police Station: Incident Report Board" },
  { id: "byers-rearrange", name: "Byers House: Will's Scrambled Notes" },
  { id: "byers-connection", name: "Byers House: Christmas Lights Wall" },
  { id: "tower-series", name: "Radio Tower: Beacon Frequency Blips" },
  { id: "tower-radio", name: "Radio Tower: VLF Tuning Dial" },
  { id: "lab-terminal", name: "Hawkins Lab: Sublevel 4 Mainframe" },
  { id: "forest-marks", name: "Forest Trail: Carved Tree Runes" },
  { id: "gate-unlock", name: "The Gate: Dimensional Rift Keys" },
  { id: "ud-quiz", name: "Upside Down: Experiment 001 File" },
  { id: "ud-connection", name: "Upside Down: Eldritch Runes" },
  { id: "ud-rearrange", name: "Upside Down: Corrupted Directive" },
  { id: "mind-final", name: "Vecna's Mind: 5-Step Escape" },
];

interface Presence {
  team: string;
  teamId?: string;
  location?: string;
  stage: StageId;
  storyProgress?: number;
  score: number;
  timeLeft: number;
  solved: number;
  completedTasks?: string[];
  vecnaStatus?: string;
  ts: number;
  sim?: boolean;
  radiometerPins?: number;
  radiometer?: {
    pins: (string | null)[];
    solved: boolean[];
    codeSolved?: boolean;
  };
}

const FALLBACK_SIM: Presence[] = [
  {
    team: "NULL POINTERS",
    teamId: "T01",
    location: "mind",
    stage: "mind",
    storyProgress: 88,
    score: 2100,
    timeLeft: 1900,
    solved: 20,
    vecnaStatus: "ACTIVE",
    ts: 0,
    sim: true,
    radiometerPins: 5,
    radiometer: { pins: ["8", "3", "4", "7", "9"], solved: [true, true, true, true, true], codeSolved: true },
  },
  {
    team: "STACK SMASHERS",
    teamId: "T02",
    location: "lab",
    stage: "lab",
    storyProgress: 52,
    score: 1760,
    timeLeft: 2400,
    solved: 14,
    vecnaStatus: "INACTIVE",
    ts: 0,
    sim: true,
    radiometerPins: 3,
    radiometer: { pins: ["8", "3", "4", null, null], solved: [true, true, true, false, false], codeSolved: false },
  },
  {
    team: "RIFT RUNNERS",
    teamId: "T03",
    location: "radioTower",
    stage: "hawkins",
    storyProgress: 24,
    score: 850,
    timeLeft: 3100,
    solved: 7,
    vecnaStatus: "INACTIVE",
    ts: 0,
    sim: true,
    radiometerPins: 1,
    radiometer: { pins: ["8", null, null, null, null], solved: [true, false, false, false, false], codeSolved: false },
  },
];

export default function VecnaDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Teams & Realtime
  const [live, setLive] = useState<Record<string, Presence>>({});
  const [sim, setSim] = useState<Presence[]>(FALLBACK_SIM);

  // Mind Energy Meter
  const [energy, setEnergy] = useState<number>(100);
  const [target, setTarget] = useState("all");
  const [lockPin, setLockPin] = useState<number | "all">("all");
  const [customMsg, setCustomMsg] = useState("I KNOW WHERE YOU ARE.");
  const [targetChallengeId, setTargetChallengeId] = useState<string>(ALL_CHALLENGES[0].id);
  const [log, setLog] = useState<string[]>([]);

  // ═════════════════════════════════════════════════════════════════════════
  // ROUTE GUARD: Check Vecna Session
  // ═════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const currentSession = getStoredSession();
    if (!currentSession) {
      // Visiting /vecna without a Vecna session redirects to login screen
      router.replace("/");
      return;
    }

    if (currentSession.role !== "VECNA") {
      // Logged-in player who opens /vecna must be redirected back to their game
      router.replace("/");
      return;
    }

    setSession(currentSession);
    setCheckingAuth(false);
  }, [router]);

  // Realtime subscription
  useEffect(() => {
    if (checkingAuth || !session) return;

    const unsub = subscribe((m: RealtimeMessage) => {
      if (m.type === "presence") {
        setLive((p) => ({ ...p, [m.team.toUpperCase()]: m }));
      }
    });

    // Energy regeneration timer
    const regen = setInterval(() => {
      setEnergy((cur) => Math.min(100, cur + 3));
    }, 1000);

    // Fallback simulated timer and live prune
    const tick = setInterval(() => {
      setSim((arr) =>
        arr.map((t) => ({
          ...t,
          timeLeft: Math.max(0, t.timeLeft - 1),
          score: t.score + (Math.random() > 0.97 ? 50 : 0),
        }))
      );
      const now = Date.now();
      setLive((p) => Object.fromEntries(Object.entries(p).filter(([, v]) => now - v.ts < 9000)));
    }, 1000);

    return () => {
      unsub();
      clearInterval(regen);
      clearInterval(tick);
    };
  }, [checkingAuth, session]);

  if (checkingAuth || !session || session.role !== "VECNA") {
    return <div style={{ minHeight: "100vh", background: "#050102" }} />;
  }

  const operatorName = session.leaderName || "Henry Creel";

  const handleLogout = () => {
    clearSession();
    sfx("click");
    router.push("/");
  };

  const stamp = () => new Date().toLocaleTimeString();

  // Sabotage dispatcher
  const fire = (kind: Kind, cost: number) => {
    if (energy < cost) {
      alert("Insufficient Mind Energy. Allow energy to regenerate.");
      return;
    }

    // Deduct energy
    setEnergy((cur) => Math.max(0, cur - cost));

    const pinIndex = kind === "LOCK" && lockPin !== "all" ? lockPin : undefined;
    const message = kind === "MESSAGE" ? customMsg : undefined;

    publish({
      type: "sabotage",
      kind,
      target,
      pinIndex,
      message,
      operatorId: "op-vecna",
      operatorName,
    });

    const pinSuffix = pinIndex !== undefined ? ` [PIN ${pinIndex + 1}]` : "";
    const msgSuffix = message ? ` "${message}"` : "";
    setLog((l) => [
      `${stamp()} [${operatorName}] ${kind}${pinSuffix}${msgSuffix} → ${target === "all" ? "ALL TEAMS" : target}`,
      ...l,
    ].slice(0, 40));
  };

  // Story event trigger
  const fireStoryTrigger = (event: StoryEventType, label: string) => {
    publish({
      type: "story_event",
      event,
      target,
      operatorId: "op-vecna",
      operatorName,
    });

    setLog((l) => [
      `${stamp()} [${operatorName}] STORY TRIGGER: ${label.toUpperCase()} → ${target === "all" ? "ALL TEAMS" : target}`,
      ...l,
    ].slice(0, 40));
  };

  // Specific challenge lock/unlock
  const toggleChallengeLock = (locked: boolean) => {
    publish({
      type: "challenge_lock",
      challengeId: targetChallengeId,
      locked,
      target,
      operatorId: "op-vecna",
      operatorName,
    });

    setLog((l) => [
      `${stamp()} [${operatorName}] CHALLENGE ${locked ? "LOCKED" : "UNLOCKED"}: ${targetChallengeId} → ${target === "all" ? "ALL TEAMS" : target}`,
      ...l,
    ].slice(0, 40));
  };

  // Teamwork Award
  const award = (pts: number) => {
    if (target === "all") {
      alert("Select a specific team to award teamwork points.");
      return;
    }

    publish({
      type: "award",
      target,
      points: pts,
      operatorId: "op-vecna",
      operatorName,
    });

    setLog((l) => [
      `${stamp()} [${operatorName}] AWARD +${pts} TEAMWORK → ${target}`,
      ...l,
    ].slice(0, 40));
  };

  // ═════════════════════════════════════════════════════════════════════════
  // REGISTERED TEAMS FROM PLAYER_TEAMS (LIVE vs OFFLINE)
  // ═════════════════════════════════════════════════════════════════════════
  const registeredTeams = PLAYER_TEAMS.map((pt) => {
    const liveEntry = Object.values(live).find(
      (l) =>
        l.team.trim().toLowerCase() === pt.teamName.trim().toLowerCase() ||
        (l.teamId && l.teamId.trim().toLowerCase() === pt.id.trim().toLowerCase())
    );

    const isActive = Boolean(liveEntry);

    return {
      team: pt.teamName,
      teamId: pt.id,
      leaderName: pt.leaderName,
      status: (isActive ? "ACTIVE" : "OFFLINE") as "ACTIVE" | "OFFLINE",
      location: liveEntry?.location || "OFFLINE",
      stage: liveEntry?.stage || ("hawkins" as StageId),
      storyProgress: liveEntry?.storyProgress ?? 0,
      score: liveEntry?.score ?? 0,
      timeLeft: liveEntry?.timeLeft ?? CONFIG.TOTAL_GAME_TIME,
      solved: liveEntry?.solved ?? 0,
      radiometerPins: liveEntry?.radiometerPins ?? 0,
      radiometer: liveEntry?.radiometer,
      ts: liveEntry?.ts ?? 0,
      sim: false,
    };
  });

  const displayTeams = PLAYER_TEAMS.length > 0 ? registeredTeams : (Object.values(live).length ? Object.values(live) : sim);

  return (
    <div className="screen" style={{ minHeight: "100vh", overflowX: "hidden" }}>
      <UpsideScene />

      <div className="content" style={{ maxWidth: 1220, margin: "0 auto", padding: "34px 20px 80px" }}>
        {/* Header with Vecna Operator Identity & Logout */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--danger)", fontSize: 13 }}>
              VECNA CONTROL · 1986 TOURNAMENT OPERATIONS
            </div>
            <h1 className="title-xl" style={{ fontSize: "clamp(30px, 5vw, 58px)", color: "#ff2d3a", margin: 0 }}>
              <Glitch text="VECNA CONTROL" hard />
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Operator Badge with Logged-in Name */}
            <div
              style={{
                background: "rgba(255, 45, 58, 0.12)",
                border: "1px solid var(--danger)",
                padding: "6px 14px",
                borderRadius: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <span style={{ fontSize: 11, color: "var(--dim)", letterSpacing: ".1em" }}>ACTIVE OPERATOR</span>
              <b style={{ color: "#fff", fontSize: 16 }}>
                {operatorName} <span style={{ color: "var(--danger)" }}>[VECNA CONTROL]</span>
              </b>
            </div>

            <button
              id="vecna-logout-btn"
              className="btn sm ghost red"
              onClick={handleLogout}
              style={{ letterSpacing: ".1em" }}
            >
              LOGOUT
            </button>
          </div>
        </div>

        {/* Mind Energy Meter */}
        <div className="panel" style={{ marginBottom: 18, borderColor: "rgba(255,45,58,0.4)" }}>
          <div className="panel-body">
            <div className="term" style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#ff7c85" }}>
                {operatorName.toUpperCase()} · MIND ENERGY METER
              </span>
              <span style={{ color: "var(--danger)", fontWeight: "bold" }}>
                {energy}/100
              </span>
            </div>
            <div className="bar" style={{ height: 12, marginTop: 6, background: "rgba(255,45,58,0.15)" }}>
              <motion.i
                animate={{ width: `${energy}%` }}
                style={{ background: "var(--danger)" }}
              />
            </div>
          </div>
        </div>

        {/* Main Grid: Teams Monitor & Controls */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 18 }}>
          {/* ── PANEL 1: TEAMS MONITOR (Lists all teams from PLAYER_TEAMS) ── */}
          <div className="panel">
            <div className="panel-head">
              <span className="dot" style={{ background: "var(--danger)" }} />
              <span>
                REGISTERED TEAMS ({displayTeams.length}) · {PLAYER_TEAMS.length > 0 ? "LIVE VIA BROADCAST CHANNEL" : "SIMULATED PREVIEWS"}
              </span>
            </div>

            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                className={`ch-item ${target === "all" ? "active" : ""}`}
                onClick={() => setTarget("all")}
                style={{ textAlign: "left" }}
              >
                ◎ ALL PLAYER TEAMS
              </button>

              {displayTeams.map((t) => {
                const isOnline = t.status === "ACTIVE";
                const isSelected = target === t.team;

                return (
                  <button
                    key={t.team}
                    className={`ch-item ${isSelected ? "active" : ""}`}
                    onClick={() => setTarget(t.team)}
                    style={{
                      textAlign: "left",
                      borderColor: isSelected ? "var(--danger)" : undefined,
                      cursor: "pointer",
                      opacity: isOnline ? 1 : 0.72,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                      <div>
                        <b style={{ color: "#fff", fontSize: 16 }}>{t.team}</b>
                        {t.teamId && <span className="dim" style={{ fontSize: 12, marginLeft: 6 }}>[{t.teamId}]</span>}
                        {"leaderName" in t && t.leaderName && (
                          <span className="dim" style={{ fontSize: 12, marginLeft: 8, color: "var(--accent)" }}>
                            ({t.leaderName})
                          </span>
                        )}
                      </div>
                      <span className="p" style={{ fontSize: 13 }}>
                        {isOnline
                          ? `${t.location ? t.location.toUpperCase() : STAGES[t.stage]?.title} · ${t.score} pts · ${mmss(t.timeLeft)}`
                          : "OFFLINE"}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 5 }}>
                      <span
                        style={{
                          fontSize: 11,
                          letterSpacing: ".08em",
                          padding: "2px 8px",
                          borderRadius: 3,
                          background: isOnline ? "rgba(54, 224, 196, 0.15)" : "rgba(255, 255, 255, 0.05)",
                          color: isOnline ? "var(--accent2)" : "var(--dim)",
                          border: `1px solid ${isOnline ? "rgba(54, 224, 196, 0.4)" : "rgba(255, 255, 255, 0.1)"}`,
                          fontWeight: "bold",
                        }}
                      >
                        {isOnline ? "● ACTIVE (LIVE DATA)" : "○ OFFLINE (NOT LOGGED IN)"}
                      </span>

                      <span style={{ fontSize: 12, color: isOnline ? "var(--accent)" : "var(--dim)" }}>
                        STORY: {t.storyProgress || 0}%
                      </span>
                    </div>

                    {/* Radiometer Pins */}
                    {isOnline && t.radiometer?.pins && (
                      <div style={{ display: "flex", gap: 5, marginTop: 6, alignItems: "center", width: "100%" }}>
                        <span className="dim" style={{ fontSize: 11, letterSpacing: ".1em" }}>RM PINS:</span>
                        {t.radiometer.pins.map((p, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: "inline-block",
                              padding: "1px 6px",
                              borderRadius: 2,
                              fontSize: 12,
                              fontFamily: "var(--font-mono)",
                              background: p !== null ? "rgba(54,224,196,0.15)" : "rgba(255,255,255,0.05)",
                              border: `1px solid ${p !== null ? "var(--accent2)" : "rgba(255,255,255,0.1)"}`,
                              color: p !== null ? "var(--accent2)" : "var(--dim)",
                            }}
                          >
                            {p !== null ? p : "·"}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── PANEL 2: SABOTAGE CONSOLE ── */}
          <div className="panel">
            <div className="panel-head">
              <span className="dot" style={{ background: "var(--danger)" }} />
              <span>
                Sabotage Console · Target: {target === "all" ? "ALL TEAMS" : target}
              </span>
            </div>

            <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {ACTIONS.map((a) => (
                <button
                  key={a.kind}
                  className="btn red sm"
                  style={{ textAlign: "left", fontSize: 16 }}
                  disabled={energy < a.cost}
                  onClick={() => fire(a.kind, a.cost)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{a.kind.replace("_", " ")}</span>
                    <span className="dim">{a.cost}</span>
                  </div>
                  <div className="dim" style={{ fontSize: 12, textTransform: "none", marginTop: 4, lineHeight: 1.3 }}>
                    {a.desc}
                  </div>
                </button>
              ))}

              {/* Targeted Pin Selector for LOCK */}
              <div style={{ gridColumn: "1 / -1", padding: "8px 12px", background: "rgba(255,59,69,0.07)", border: "1px solid rgba(255,59,69,0.25)", borderRadius: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span className="eyebrow" style={{ fontSize: 11, color: "var(--danger)" }}>LOCK TARGET PIN</span>
                  <span className="dim" style={{ fontSize: 11 }}>Target: {lockPin === "all" ? "ALL CHALLENGES" : `PIN ${lockPin + 1}`}</span>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <button
                    className={`btn sm ${lockPin === "all" ? "red" : "ghost"}`}
                    style={{ fontSize: 11, padding: "2px 6px" }}
                    onClick={() => setLockPin("all")}
                  >
                    ALL
                  </button>
                  {["P1 (FREQ)", "P2 (SEQN)", "P3 (WIRE)", "P4 (LOG)", "P5 (SYS)"].map((lbl, idx) => (
                    <button
                      key={idx}
                      className={`btn sm ${lockPin === idx ? "red" : "ghost"}`}
                      style={{ fontSize: 11, padding: "2px 6px" }}
                      onClick={() => setLockPin(idx)}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Warning Message Input */}
              <div style={{ gridColumn: "1 / -1", padding: "10px 12px", background: "rgba(0,0,0,0.4)", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)" }}>
                <span className="eyebrow" style={{ fontSize: 11, marginBottom: 4 }}>CUSTOM BROADCAST MESSAGE</span>
                <input
                  className="field"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="I KNOW WHERE YOU ARE."
                  style={{ fontSize: 14 }}
                />
              </div>

              {/* Teamwork Award */}
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
                <span className="eyebrow" style={{ fontSize: 13 }}>Teamwork award:</span>
                {[25, 50, 100].map((p) => (
                  <button
                    key={p}
                    className="btn sm"
                    disabled={target === "all"}
                    onClick={() => award(p)}
                  >
                    +{p}
                  </button>
                ))}
                {target === "all" && <span className="dim" style={{ fontSize: 11 }}>(Select specific team first)</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── PANEL 3: STORY CONTROL & CHALLENGE LOCK ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 18, marginTop: 18 }}>
          <div className="panel" style={{ borderColor: "rgba(255,45,58,0.5)" }}>
            <div className="panel-head">
              <span className="dot" style={{ background: "var(--danger)" }} />
              <span>STORY CONTROL · EVENT TRIGGERS (ALL CONTROLS ACTIVE)</span>
            </div>

            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="term dim" style={{ fontSize: 13 }}>
                Target: <b>{target === "all" ? "ALL TEAMS" : target}</b>. Trigger major story transitions live across player screens.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button
                  className="btn sm red"
                  onClick={() => fireStoryTrigger("gate_open", "The Gate Opens")}
                >
                  ⚡ OPEN THE GATE
                </button>
                <button
                  className="btn sm red"
                  onClick={() => fireStoryTrigger("upsidedown_activate", "Upside Down Activation")}
                >
                  🌌 ACTIVATE UPSIDE DOWN
                </button>
                <button
                  className="btn sm red"
                  onClick={() => fireStoryTrigger("vecna_appear", "Vecna Appearance Cutscene")}
                >
                  👁 VECNA TAKEOVER
                </button>
                <button
                  className="btn sm red"
                  onClick={() => fireStoryTrigger("will_signal", "Will's Emergency Signal")}
                >
                  📻 TRANSMIT WILL&apos;S SIGNAL
                </button>
                <button
                  className="btn sm red"
                  style={{ gridColumn: "1 / -1" }}
                  onClick={() => fireStoryTrigger("final_stage", "Final Mind Showdown")}
                >
                  ⏳ TRIGGER FINAL SHOWDOWN IN VECNA&apos;S MIND
                </button>
              </div>

              {/* Specific Challenge Lock/Unlock */}
              <div style={{ marginTop: 8, padding: "10px 12px", background: "rgba(0,0,0,0.4)", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="eyebrow" style={{ fontSize: 11, marginBottom: 6 }}>
                  LOCK / UNLOCK SPECIFIC CHALLENGE
                </div>
                <select
                  className="field"
                  value={targetChallengeId}
                  onChange={(e) => setTargetChallengeId(e.target.value)}
                  style={{ fontSize: 14, marginBottom: 8, background: "#0a0d14", color: "#fff" }}
                >
                  {ALL_CHALLENGES.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name}
                    </option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn sm red"
                    style={{ flex: 1 }}
                    onClick={() => toggleChallengeLock(true)}
                  >
                    🔒 LOCK CHALLENGE
                  </button>
                  <button
                    className="btn sm ghost"
                    style={{ flex: 1 }}
                    onClick={() => toggleChallengeLock(false)}
                  >
                    🔓 UNLOCK CHALLENGE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── PANEL 4: ACTIVITY LOG ── */}
          <div className="panel">
            <div className="panel-head">
              <span className="dot" />
              <span>Tournament Activity Log</span>
            </div>
            <div className="panel-body term scroll" style={{ maxHeight: 280, overflowY: "auto", fontSize: 14 }}>
              {log.length === 0 ? (
                <span className="dim">No organizer actions dispatched yet.</span>
              ) : (
                log.map((l, i) => <div key={i}>{l}</div>)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
