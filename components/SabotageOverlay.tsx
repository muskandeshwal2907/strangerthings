"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { mmss } from "@/lib/results";
import { sfx } from "@/lib/audio";
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
    if (sabotage.kind === "MESSAGE") {
      try {
        sfx("vecnaCurse");
      } catch {}
    }
    const sticky = sabotage.kind === "LOCK" || sabotage.kind === "CORRUPT";
    const durMs =
      sabotage.kind === "GLITCH"
        ? 2400
        : sabotage.kind === "WATCH"
        ? 0
        : sabotage.kind === "MESSAGE"
        ? 7500
        : 4200;
    const t = setTimeout(() => {
      if (!sticky) {
        setHide(true);
        if (sabotage.kind === "GLITCH" || sabotage.kind === "MESSAGE") clearSabotage();
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

  const isHawkinsOnly =
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/vecna") &&
    !window.location.pathname.startsWith("/admin");

  // Dedicated Top-Left Vecna Telepathic Message Popup (Requirement 7)
  if (sabotage && sabotage.kind === "MESSAGE" && !hide && isHawkinsOnly) {
    return (
      <AnimatePresence>
        {/* Disturbing Full-Screen Telepathic Crimson Aura */}
        <motion.div
          key="vecna-vignette"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.65, 0.3] }}
          exit={{ opacity: 0 }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 99990,
            boxShadow:
              "inset 0 0 100px rgba(220, 20, 35, 0.65), inset 0 0 220px rgba(120, 0, 15, 0.5)",
            backgroundImage:
              "radial-gradient(ellipse at center, transparent 40%, rgba(180, 0, 20, 0.2) 100%)",
          }}
        />

        {/* The Vecna Telepathic Card with Red Glowing Demonic Hands */}
        <motion.div
          key={sabotage.id}
          initial={{ opacity: 0, x: -70, y: -20, scale: 0.88 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: -60, scale: 0.9, filter: "blur(6px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            top: "28px",
            left: "28px",
            zIndex: 99999,
            width: "min(440px, 90vw)",
            pointerEvents: "auto",
          }}
        >
          {/* Detailed SVG: Red Glowing Demonic Vecna Hands Grasping Card From Behind */}
          <svg
            viewBox="0 0 520 280"
            style={{
              position: "absolute",
              top: "-52px",
              left: "-48px",
              width: "calc(100% + 96px)",
              height: "calc(100% + 94px)",
              pointerEvents: "none",
              zIndex: 10,
              filter: "drop-shadow(0 0 16px rgba(255, 20, 35, 0.95)) drop-shadow(0 0 35px rgba(200, 0, 20, 0.65))",
            }}
          >
            <defs>
              <linearGradient id="vecna-flesh-left" x1="0%" y1="100%" x2="60%" y2="0%">
                <stop offset="0%" stopColor="#1a0204" />
                <stop offset="40%" stopColor="#4a080e" />
                <stop offset="75%" stopColor="#8c121d" />
                <stop offset="100%" stopColor="#ff2a3a" />
              </linearGradient>
              <linearGradient id="vecna-flesh-right" x1="100%" y1="100%" x2="40%" y2="0%">
                <stop offset="0%" stopColor="#1a0204" />
                <stop offset="40%" stopColor="#4a080e" />
                <stop offset="75%" stopColor="#8c121d" />
                <stop offset="100%" stopColor="#ff2a3a" />
              </linearGradient>
              <linearGradient id="vecna-vein" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b76" />
                <stop offset="50%" stopColor="#ff1f30" />
                <stop offset="100%" stopColor="#a30915" />
              </linearGradient>
              <filter id="hand-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ────────── LEFT VECNA HAND & CLAWS ────────── */}
            {/* Left Forearm & Palm creeping from bottom-left */}
            <path
              d="M 12,280 C 18,220 28,170 48,135 C 60,115 78,102 98,92 C 112,85 130,88 128,110 C 122,135 105,175 88,225 C 78,255 70,280 62,280 Z"
              fill="url(#vecna-flesh-left)"
              stroke="#ff2a3a"
              strokeWidth="1.5"
            />
            {/* Left Hand Veins */}
            <path
              d="M 32,260 Q 48,190 68,145 T 102,105"
              fill="none"
              stroke="url(#vecna-vein)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M 52,210 Q 72,175 88,140"
              fill="none"
              stroke="#ff4d58"
              strokeWidth="1.4"
            />

            {/* Left Finger 1 (Index Finger curling tightly over top-left card border) */}
            <path
              d="M 85,95 C 80,72 88,48 108,32 C 122,22 138,20 148,32 C 154,42 152,58 142,70 C 135,78 120,86 105,92 Z"
              fill="url(#vecna-flesh-left)"
              stroke="#ff2d3a"
              strokeWidth="1.5"
            />
            {/* Sharp razor claw tip pressing down over top edge */}
            <path
              d="M 148,32 C 158,36 166,48 162,62 C 156,58 152,48 148,32 Z"
              fill="#260307"
              stroke="#ff4d58"
              strokeWidth="1.6"
            />

            {/* Left Finger 2 (Middle Demonic Finger — longest, reaching high over card) */}
            <path
              d="M 102,88 C 105,58 122,25 148,10 C 168,-2 188,4 195,18 C 202,32 198,52 182,68 C 168,82 145,90 120,95 Z"
              fill="url(#vecna-flesh-left)"
              stroke="#ff2d3a"
              strokeWidth="1.5"
            />
            {/* Middle Claw razor talon */}
            <path
              d="M 195,18 C 208,25 214,40 206,56 C 199,50 196,36 195,18 Z"
              fill="#1f0205"
              stroke="#ff3b47"
              strokeWidth="1.8"
            />
            {/* Middle Finger Knuckle Vein */}
            <path
              d="M 125,75 Q 148,42 172,25"
              fill="none"
              stroke="url(#vecna-vein)"
              strokeWidth="1.8"
            />

            {/* Left Finger 3 (Ring Finger curling over top edge) */}
            <path
              d="M 118,98 C 135,75 160,52 188,44 C 206,38 222,46 225,60 C 228,74 218,88 198,96 C 178,104 150,105 130,102 Z"
              fill="url(#vecna-flesh-left)"
              stroke="#ff2d3a"
              strokeWidth="1.5"
            />
            {/* Ring Finger Claw */}
            <path
              d="M 225,60 C 235,68 238,82 228,95 C 224,88 222,76 225,60 Z"
              fill="#240206"
              stroke="#ff4d58"
              strokeWidth="1.5"
            />

            {/* Left Thumb (Curling tightly around the left side border) */}
            <path
              d="M 68,138 C 55,148 45,165 48,185 C 50,198 62,206 75,200 C 88,194 92,176 88,158 C 85,145 78,138 68,138 Z"
              fill="url(#vecna-flesh-left)"
              stroke="#ff2d3a"
              strokeWidth="1.5"
            />
            <path
              d="M 48,185 C 40,195 44,212 58,214 C 54,204 50,194 48,185 Z"
              fill="#1a0204"
              stroke="#ff3b47"
              strokeWidth="1.6"
            />

            {/* ────────── RIGHT VECNA HAND & CLAWS ────────── */}
            {/* Right Forearm & Palm creeping from bottom-right */}
            <path
              d="M 508,280 C 502,220 492,170 472,135 C 460,115 442,102 422,92 C 408,85 390,88 392,110 C 398,135 415,175 432,225 C 442,255 450,280 458,280 Z"
              fill="url(#vecna-flesh-right)"
              stroke="#ff2a3a"
              strokeWidth="1.5"
            />
            {/* Right Hand Veins */}
            <path
              d="M 488,260 Q 472,190 452,145 T 418,105"
              fill="none"
              stroke="url(#vecna-vein)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Right Finger 1 (Index Finger curling over top-right card border) */}
            <path
              d="M 435,95 C 440,72 432,48 412,32 C 398,22 382,20 372,32 C 366,42 368,58 378,70 C 385,78 400,86 415,92 Z"
              fill="url(#vecna-flesh-right)"
              stroke="#ff2d3a"
              strokeWidth="1.5"
            />
            {/* Right Index Claw talon */}
            <path
              d="M 372,32 C 362,36 354,48 358,62 C 364,58 368,48 372,32 Z"
              fill="#260307"
              stroke="#ff4d58"
              strokeWidth="1.6"
            />

            {/* Right Finger 2 (Middle Finger — reaching over top right) */}
            <path
              d="M 418,88 C 415,58 398,25 372,10 C 352,-2 332,4 325,18 C 318,32 322,52 338,68 C 352,82 375,90 400,95 Z"
              fill="url(#vecna-flesh-right)"
              stroke="#ff2d3a"
              strokeWidth="1.5"
            />
            {/* Right Middle Claw talon */}
            <path
              d="M 325,18 C 312,25 306,40 314,56 C 321,50 324,36 325,18 Z"
              fill="#1f0205"
              stroke="#ff3b47"
              strokeWidth="1.8"
            />
            <path
              d="M 395,75 Q 372,42 348,25"
              fill="none"
              stroke="url(#vecna-vein)"
              strokeWidth="1.8"
            />

            {/* Right Thumb (Curling tightly around the right side border) */}
            <path
              d="M 452,138 C 465,148 475,165 472,185 C 470,198 458,206 445,200 C 432,194 428,176 432,158 C 435,145 442,138 452,138 Z"
              fill="url(#vecna-flesh-right)"
              stroke="#ff2d3a"
              strokeWidth="1.5"
            />
            <path
              d="M 472,185 C 480,195 476,212 462,214 C 466,204 470,194 472,185 Z"
              fill="#1a0204"
              stroke="#ff3b47"
              strokeWidth="1.6"
            />

            {/* Creeping Crimson Tendrils & Roots along bottom & perimeter */}
            <path
              d="M 25,270 Q 70,260 140,268 T 280,264 Q 400,270 495,268"
              fill="none"
              stroke="#8c0e18"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 120,268 Q 180,250 240,265 T 380,255"
              fill="none"
              stroke="#ff2a3a"
              strokeWidth="1.8"
            />
          </svg>

          {/* The Content Card Held by the Hands */}
          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(14, 2, 5, 0.98) 0%, rgba(28, 3, 7, 0.98) 55%, rgba(10, 1, 3, 0.99) 100%)",
              border: "2px solid #ff2a3a",
              borderRadius: "8px",
              padding: "20px 22px",
              boxShadow:
                "0 0 35px rgba(255, 30, 45, 0.85), 0 0 75px rgba(180, 0, 20, 0.5), inset 0 0 25px rgba(255, 45, 58, 0.3)",
              position: "relative",
              overflow: "hidden",
              zIndex: 5,
            }}
          >
            {/* Ambient Eldritch Pulse Overlay inside Card */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(255, 45, 58, 0.18) 0%, transparent 75%)",
                pointerEvents: "none",
              }}
            />

            {/* Header with Glowing Vecna Alarm & Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1.5px solid rgba(255, 45, 58, 0.4)",
                paddingBottom: "10px",
                marginBottom: "12px",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#ff2a3a",
                    boxShadow: "0 0 14px #ff2a3a, 0 0 24px #ff2a3a",
                    animation: "pulse 1.2s infinite",
                  }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: '"Share Tech Mono", monospace',
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "#ff4d58",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      lineHeight: 1.1,
                      textShadow: "0 0 10px rgba(255, 77, 88, 0.8)",
                    }}
                  >
                    VECNA PSYCHIC TRANSMISSION
                  </div>
                  <div
                    style={{
                      fontFamily: '"Share Tech Mono", monospace',
                      fontSize: "9.5px",
                      color: "#ff8a93",
                      letterSpacing: "0.14em",
                      marginTop: "2px",
                    }}
                  >
                    HENRY CREEL // DEMONIC TELEPATHY
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSabotage}
                style={{
                  background: "rgba(255, 45, 58, 0.15)",
                  border: "1px solid rgba(255, 45, 58, 0.45)",
                  color: "#ff99a0",
                  fontSize: "11px",
                  fontWeight: "bold",
                  padding: "3px 8px",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontFamily: '"Share Tech Mono", monospace',
                  letterSpacing: "0.08em",
                }}
              >
                ✕ DISMISS
              </button>
            </div>

            {/* Disturbing Transmission Message Body */}
            <div
              style={{
                fontFamily: '"Share Tech Mono", monospace',
                fontSize: "15px",
                color: "#ffffff",
                lineHeight: 1.5,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textShadow: "0 0 10px rgba(255, 45, 58, 0.65), 0 0 20px rgba(255, 20, 30, 0.35)",
                wordBreak: "break-word",
                position: "relative",
                zIndex: 2,
                padding: "4px 2px",
              }}
            >
              &ldquo;{sabotage.message || "I KNOW WHERE YOU ARE."}&rdquo;
            </div>

            {/* Operator and Audio Status Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "12px",
                paddingTop: "8px",
                borderTop: "1px dashed rgba(255, 45, 58, 0.25)",
                fontSize: "10px",
                fontFamily: '"Share Tech Mono", monospace',
                color: "#ff8088",
                letterSpacing: "0.08em",
                position: "relative",
                zIndex: 2,
              }}
            >
              <span>🔊 DEEP SUB-FREQUENCY ACTIVE</span>
              <span>EXPIRES IN ~7S</span>
            </div>

            {/* Disappearing Progress Bar (7.5 seconds) */}
            <div
              style={{
                marginTop: "8px",
                height: "3px",
                background: "rgba(255, 45, 58, 0.25)",
                borderRadius: "2px",
                overflow: "hidden",
                position: "relative",
                zIndex: 2,
              }}
            >
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 7.5, ease: "linear" }}
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #ff2a3a 0%, #ff6b76 100%)",
                  boxShadow: "0 0 12px #ff2a3a",
                }}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

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
            [ALERT] PSYCHIC TRANSMISSION INTERFERENCE
          </div>
          <h1
            className="title-xl glitch-text-burst"
            style={{
              fontSize: "clamp(42px, 8vw, 86px)",
              color: "#ff2d3a",
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
        {overlay && sabotage.kind !== "MESSAGE" && (
          <motion.div className="sab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="sab-box" style={{ maxWidth: 620 }}>
              <div className="term" style={{ color: "var(--danger)", fontSize: 24, letterSpacing: ".3em" }}>
                [ALERT] SYSTEM COMPROMISED
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
          [ALERT]{" "}
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
