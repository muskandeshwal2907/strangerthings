"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { mmss } from "@/lib/results";
import Glitch from "./Glitch";

const QS: [string, RegExp][] = [
  ["Binary of 5?", /^101$/],
  ["7 × 8 = ?", /^56$/],
  ["Letters in VECNA?", /^5$/],
  ["Hex of 255 (2 chars)?", /^ff$/i],
  ["15 mod 4 = ?", /^3$/],
  ["Decimal of binary 1100?", /^12$/],
];

const NAME: Record<string, string> = {
  CORRUPT: "CHALLENGE CORRUPTED",
  TIME_FREEZE: "TIME FREEZE · -02:00",
  LOCK: "CHALLENGE LOCKED",
  DISTORT: "CLUE DISTORTED",
  SIGNAL_JAM: "SIGNAL JAMMED",
  WATCH: "VECNA IS WATCHING",
  MESSAGE: "INCOMING PSYCHIC TRANSMISSION",
  GLITCH: "DIMENSIONAL REALITY GLITCH",
};

export default function SabotageOverlay() {
  const { sabotage, clearSabotage } = useGame();
  const [val, setVal] = useState("");
  const [hide, setHide] = useState(false);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    setVal("");
    setHide(false);
    if (!sabotage) return;
    const sticky = sabotage.kind === "LOCK" || sabotage.kind === "CORRUPT";
    const durMs =
      sabotage.kind === "GLITCH"
        ? 2400
        : sabotage.kind === "WATCH"
        ? 0
        : sabotage.kind === "MESSAGE"
        ? 6000
        : 4200;
    const t = setTimeout(() => {
      if (!sticky) {
        setHide(true);
        if (sabotage.kind === "GLITCH") clearSabotage();
      }
    }, durMs);
    return () => clearTimeout(t);
  }, [sabotage?.id]); // eslint-disable-line

  useEffect(() => {
    if (!sabotage) return;
    const i = setInterval(() => setLeft(Math.max(0, Math.round((sabotage.until - Date.now()) / 1000))), 250);
    return () => clearInterval(i);
  }, [sabotage]);

  const q = sabotage ? QS[sabotage.id % QS.length] : null;
  const overlay = sabotage && !hide && sabotage.kind !== "WATCH";

  // Dedicated Visual Glitch Burst (Requirement 3)
  if (sabotage && sabotage.kind === "GLITCH" && !hide) {
    return (
      <div
        className="glitch-burst-screen"
        onClick={clearSabotage}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(20, 2, 4, 0.94)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          overflow: "hidden",
        }}
      >
        {/* Animated Chromatic Split Scanlines */}
        <div
          className="glitch-noise-layer"
          style={{
            position: "absolute",
            inset: 0,
            background: "repeating-linear-gradient(0deg, rgba(255,45,58,0.2) 0px, transparent 2px, rgba(0,0,0,0.6) 4px)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 24, maxWidth: 640 }}>
          <div className="eyebrow" style={{ color: "var(--danger)", fontSize: 18, letterSpacing: ".3em", marginBottom: 12 }}>
            ⚠ PSYCHIC TRANSMISSION INTERFERENCE
          </div>
          <h1
            className="title-xl glitch-text-burst"
            style={{
              fontSize: "clamp(42px, 8vw, 86px)",
              color: "#ff2d3a",
              textShadow: "-3px 0 #36e0c4, 3px 0 #ff2d3a, 0 0 40px rgba(255,45,58,0.9)",
              lineHeight: 1.1,
            }}
          >
            <Glitch text="REALITY DISTORTION" hard />
          </h1>
          <div className="term" style={{ color: "#fff", fontSize: 20, letterSpacing: ".2em", marginTop: 16 }}>
            {sabotage.operatorName ? `DISPATCHED BY ${sabotage.operatorName.toUpperCase()}` : "VECNA'S MIND SURGE DETECTED"}
          </div>
          <div className="term dim" style={{ fontSize: 14, marginTop: 12 }}>
            [CLICK ANYWHERE TO RECALIBRATE FREQUENCY]
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {overlay && (
          <motion.div className="sab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="sab-box" style={{ maxWidth: 620 }}>
              <div className="term" style={{ color: "var(--danger)", fontSize: 24, letterSpacing: ".3em" }}>
                ⚠ {sabotage.kind === "MESSAGE" ? "PSYCHIC BROADCAST" : "SYSTEM COMPROMISED"}
              </div>

              <h2 className="title-xl" style={{ fontSize: 44, margin: "14px 0", color: "#ff2d3a" }}>
                <Glitch text={sabotage.message || "VECNA HAS FOUND YOU."} hard />
              </h2>

              <div className="eyebrow" style={{ marginBottom: 18 }}>
                {sabotage.kind === "LOCK" && sabotage.pinIndex !== undefined
                  ? `PIN ${sabotage.pinIndex + 1} LOCKED BY VECNA`
                  : NAME[sabotage.kind]}
                {sabotage.operatorName && (
                  <span className="dim" style={{ marginLeft: 8 }}>
                    · DISPATCHED BY {sabotage.operatorName.toUpperCase()}
                  </span>
                )}
              </div>

              {sabotage.kind === "MESSAGE" && (
                <div style={{ margin: "14px 0" }}>
                  <button className="btn red sm" onClick={clearSabotage}>
                    DISMISS TRANSMISSION
                  </button>
                </div>
              )}

              {(sabotage.kind === "LOCK" || sabotage.kind === "CORRUPT") && q && (
                <>
                  <div className="term dim" style={{ marginBottom: 14 }}>
                    Solve the challenge to restore access.
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (q[1].test(val.trim())) clearSabotage();
                      else setVal("");
                    }}
                  >
                    <div className="term" style={{ marginBottom: 8 }}>
                      {q[0]}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <input
                        className="field"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        autoFocus
                        placeholder="answer"
                      />
                      <button className="btn red sm" style={{ whiteSpace: "nowrap", flex: "0 0 auto" }}>
                        RESTORE
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {sabotage && (hide || sabotage.kind === "WATCH") && (
        <div className="sab-banner">
          ⚠{" "}
          {sabotage.kind === "LOCK" && sabotage.pinIndex !== undefined
            ? `PIN ${sabotage.pinIndex + 1} LOCKED`
            : NAME[sabotage.kind]}
          {sabotage.operatorName ? ` [${sabotage.operatorName.toUpperCase()}]` : ""}{" "}
          · {mmss(left)}
        </div>
      )}
    </>
  );
}
