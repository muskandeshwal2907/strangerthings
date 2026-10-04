"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { POWERS, PowerId, useGame } from "@/lib/store";
import { ITEMS, STAGE_ORDER, STAGES, StageId } from "@/lib/stages";
import { LocationId } from "@/lib/tasks";
import { isMuted, setMuted, sfx } from "@/lib/audio";
import { mmss } from "@/lib/results";

export function SoundToggle({ style }: { style?: React.CSSProperties }) {
  const { soundOn, setSoundOn } = useGame();
  return (
    <button
      className="btn sm ghost"
      style={{ position: "fixed", left: 14, bottom: 14, zIndex: 850, ...style }}
      onClick={() => {
        const n = !soundOn;
        setSoundOn(n);
        setMuted(!n);
        sfx("click");
      }}
    >
      {soundOn ? "♪ SOUND ON" : "♪ SOUND OFF"}
    </button>
  );
}

export function Toast() {
  const { toast } = useGame();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast}
          className="toast"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const LOCATION_NAMES: Record<LocationId, string> = {
  town: "HAWKINS TOWN",
  policeStation: "POLICE DEPT",
  byersHouse: "BYERS HOUSE",
  radioTower: "RADIO TOWER",
  lab: "HAWKINS LAB",
  forest: "THE FOREST",
  gate: "THE GATE",
  upsidedown: "UPSIDE DOWN",
  mind: "VECNA'S MIND",
};

export default function Hud() {
  const { s, score, jump, reset, logout, radiometerPinCount, viewMode, setViewMode } = useGame();
  const [dev, setDev] = useState(false);
  const [showClueLog, setShowClueLog] = useState(false);

  useEffect(() => {
    setDev(new URLSearchParams(window.location.search).get("dev") === "1");
  }, []);

  const low = s.timeLeft < 600;
  const progressPercent = Math.min(100, Math.max(5, s.storyProgress || 10));

  return (
    <>
      <div className="hud">
        <div className="brand" style={{ letterSpacing: ".2em" }}>
          THE HAWKINS PROTOCOL
        </div>

        {/* Story Progress Bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, width: 140 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--dim)" }}>
            <span>STORY PROGRESS</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="bar" style={{ height: 6 }}>
            <motion.i animate={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Map / Location View Toggle */}
        <button
          className={`btn sm ${viewMode === "map" ? "ghost" : ""}`}
          style={{
            fontSize: 13,
            padding: "4px 10px",
            borderColor: "var(--accent)",
            color: viewMode === "map" ? "var(--accent)" : "#000",
            background: viewMode === "map" ? "rgba(255,180,84,0.15)" : "var(--accent)",
          }}
          onClick={() => setViewMode(viewMode === "map" ? "location" : "map")}
        >
          {viewMode === "map" ? "◀ RETURN TO SCENE" : "🗺 HAWKINS MAP"}
        </button>

        {/* Current Location Badge */}
        <div
          className="stat"
          style={{ borderColor: "rgba(255,180,84,0.3)" }}
        >
          <small>LOCATION</small>
          <b style={{ color: "var(--accent)", fontSize: 16 }}>
            {LOCATION_NAMES[s.location] || s.location.toUpperCase()}
          </b>
        </div>

        <div className="grow" />

        {/* Dev Mode Stage Jumper */}
        {dev && (
          <select
            value={s.stage}
            onChange={(e) => jump(e.target.value as StageId)}
            style={{
              background: "#000",
              color: "var(--accent)",
              border: "1px solid var(--line)",
              fontFamily: "var(--font-term)",
              fontSize: 15,
              padding: "2px 6px",
            }}
          >
            {STAGE_ORDER.map((id) => (
              <option key={id} value={id}>
                DEV: {id}
              </option>
            ))}
          </select>
        )}

        {/* Team Name, ID & Leader Name */}
        <div className="stat" style={{ minWidth: 150 }}>
          <small>TEAM / LEADER</small>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <b style={{ fontSize: 17 }}>{s.team?.name || "RECON-1"}</b>
            {s.team?.id && (
              <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: "bold" }}>
                [{s.team.id}]
              </span>
            )}
          </div>
          {s.team?.leaderName && (
            <div style={{ fontSize: 11, color: "var(--dim)", letterSpacing: ".06em", marginTop: 1 }}>
              LEADER: <span style={{ color: "#fff" }}>{s.team.leaderName}</span>
            </div>
          )}
        </div>

        {/* Radiometer Readout */}
        <div className="stat" style={{ borderColor: "rgba(54,224,196,0.4)" }}>
          <small>RADIOMETER</small>
          <b style={{ color: "var(--accent2)", fontSize: 16 }}>
            PINS {radiometerPinCount}/5
          </b>
        </div>

        {/* Clue Log Button */}
        <button
          className="btn sm ghost"
          style={{ fontSize: 13, padding: "4px 8px" }}
          onClick={() => {
            sfx("click");
            setShowClueLog(!showClueLog);
          }}
        >
          CLUES ({Object.keys(s.clues || {}).length})
        </button>

        {/* Score & Timer */}
        <div className="stat">
          <small>SCORE</small>
          <b>{String(score).padStart(5, "0")}</b>
        </div>

        <div className={`stat timer ${low ? "low" : ""}`}>
          <small>TIME</small>
          <b>{mmss(s.timeLeft)}</b>
        </div>

        <button
          id="player-logout-btn"
          className="btn sm ghost red"
          onClick={() => {
            if (confirm("Log out of Hawkins Protocol and return to login screen?")) {
              logout();
            }
          }}
        >
          LOGOUT
        </button>
      </div>

      {/* Slide-out Clue Log Drawer */}
      <AnimatePresence>
        {showClueLog && (
          <motion.div
            initial={{ opacity: 0, x: 200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 200 }}
            style={{
              position: "fixed",
              top: 60,
              right: 14,
              width: 340,
              maxHeight: "80vh",
              background: "rgba(10, 14, 20, 0.96)",
              border: "1px solid var(--accent)",
              borderRadius: 6,
              boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
              zIndex: 890,
              padding: "16px 18px",
              fontFamily: "var(--font-term)",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 8 }}>
              <div className="eyebrow" style={{ color: "var(--accent)" }}>
                DISCOVERED INTEL &amp; CLUES
              </div>
              <button
                type="button"
                onClick={() => setShowClueLog(false)}
                style={{ background: "none", border: "none", color: "var(--dim)", cursor: "pointer", fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            {Object.keys(s.clues || {}).length === 0 ? (
              <div className="term dim" style={{ fontSize: 14, padding: "10px 0" }}>
                No clues logged yet. Solve tasks at Hawkins locations to collect evidence.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(s.clues || {}).map(([key, val]) => (
                  <div
                    key={key}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 4,
                      padding: "8px 10px",
                    }}
                  >
                    <div className="eyebrow" style={{ fontSize: 10, color: "var(--accent2)" }}>
                      {key.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 14, color: "#fff", marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const ICON: Record<PowerId, string> = { vision: "◉", will: "≋", eleven: "✦" };
const LABEL: Record<PowerId, string> = { vision: "SIGHT", will: "LINK", eleven: "FORCE" };

export function Dock() {
  const { s, powerUnlocked, castPower, active, say } = useGame();
  const cast = (p: PowerId) => {
    if (!powerUnlocked(p)) return say(`${POWERS[p].name} — LOCKED`);
    if (!active) return say("OPEN A TASK FIRST");
    const r = castPower(p, active);
    if (r === "ALREADY") say("ALREADY USED ON THIS TASK");
  };

  return (
    <div className="dock">
      {(Object.keys(POWERS) as PowerId[]).map((p) => {
        const un = powerUnlocked(p);
        const left = POWERS[p].max - (s.powerUses?.[p] || 0);
        return (
          <button
            key={p}
            className={`slot ${un && left > 0 ? "ready" : "locked"}`}
            onClick={() => cast(p)}
            title={`${POWERS[p].name} — ${POWERS[p].blurb} (-10 pts)`}
          >
            <span className="g">{un ? ICON[p] : "🔒"}</span>
            <small>{LABEL[p]}</small>
            {un && <span className="ch">{left}</span>}
          </button>
        );
      })}

      {s.inventory?.length > 0 && <div className="sep" />}

      {s.inventory?.map((id) => (
        <div key={id} className="slot item" title={`${ITEMS[id]?.name}: ${ITEMS[id]?.desc}`}>
          <span className="g" style={{ color: "var(--accent2)" }}>
            {ITEMS[id]?.glyph || "▤"}
          </span>
        </div>
      ))}
    </div>
  );
}
