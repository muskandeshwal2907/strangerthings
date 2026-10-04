"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { saveResult, mmss } from "@/lib/results";
import { TOTAL_TIME } from "@/lib/stages";
import { sfx, setDroneTheme, setRadioStatic } from "@/lib/audio";
import Skyline from "./scenes/Skyline";
import Particles from "./Particles";
import Leaderboard from "./Leaderboard";
import Glitch from "./Glitch";

const WEIGHTS: [keyof import("@/lib/store").Breakdown, string, number][] = [
  ["tech", "Technical / Coding", 30],
  ["puzzle", "Puzzle Solving", 20],
  ["speed", "Speed Bonus", 15],
  ["clue", "Clue Discovery", 15],
  ["story", "Story Progress", 10],
  ["teamwork", "Teamwork Award", 10],
];

function CountUp({ to }: { to: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const f = (t: number) => {
      const k = Math.min(1, (t - t0) / 2400);
      setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{v}</>;
}

export default function Ending() {
  const { s, score, reset } = useGame();
  // Cinematic Ending sequence stages:
  // 0: Pure black -> "CONNECTION LOST."
  // 1: Static burst -> "VECNA DEFEATED."
  // 2: Upside Down dissolves -> Normal Hawkins sunrise with all lights on -> "HAWKINS IS SAFE." -> "MISSION COMPLETE"
  const [step, setStep] = useState(0);

  useEffect(() => {
    setDroneTheme("normal");
    sfx("glitch");

    // Step 0: "CONNECTION LOST."
    const t1 = setTimeout(() => {
      // Step 1: Static burst -> "VECNA DEFEATED."
      setStep(1);
      sfx("staticBurst");
      sfx("alarm");
    }, 2400);

    const t2 = setTimeout(() => {
      // Step 2: Sunrise over Hawkins, all lights on
      setStep(2);
      sfx("boom");
      sfx("ok");
    }, 5500);

    if (s.team) {
      saveResult({
        team: s.team.name,
        score,
        time: s.finishedAt ?? 0,
        when: Date.now(),
      });
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      setRadioStatic(0);
    };
  }, []); // eslint-disable-line

  const max = Math.max(1, ...WEIGHTS.map(([k]) => s.breakdown[k] || 1));

  return (
    <div className="screen" style={{ background: "#000", minHeight: "100vh", overflowX: "hidden" }}>
      {/* ── STEP 0: CONNECTION LOST ── */}
      <AnimatePresence>
        {step === 0 && (
          <motion.div
            key="lost"
            className="layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              background: "#000",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 30,
              fontFamily: "var(--font-term)",
            }}
          >
            <div style={{ fontSize: "clamp(24px, 5vw, 48px)", color: "#ff2d3a", letterSpacing: ".4em" }}>
              [ ! ] CONNECTION LOST . . .
            </div>
            <div className="term dim" style={{ marginTop: 14, fontSize: 18 }}>
              SIGNAL CARRIER COLLAPSED
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STEP 1: STATIC BURST & VECNA DEFEATED ── */}
      <AnimatePresence>
        {step === 1 && (
          <motion.div
            key="defeated"
            className="layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              background: "radial-gradient(circle at 50% 50%, #2b0407 0%, #000 80%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 30,
              fontFamily: "var(--font-term)",
            }}
          >
            <motion.div
              initial={{ scale: 1.4, filter: "blur(10px)" }}
              animate={{ scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.8 }}
            >
              <h1
                className="title-xl"
                style={{
                  fontSize: "clamp(36px, 8vw, 84px)",
                  color: "#ff2d3a",
                  textShadow: "0 0 30px #ff2d3a, 0 0 80px rgba(255,45,58,0.8)",
                  textAlign: "center",
                }}
              >
                <Glitch text="VECNA DEFEATED." hard />
              </h1>
              <div className="term" style={{ textAlign: "center", color: "#fff", fontSize: 22, letterSpacing: ".2em", marginTop: 14 }}>
                THE PSYCHIC LINK HAS SHATTERED
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STEP 2: SUNRISE OVER HAWKINS (HAWKINS IS SAFE) ── */}
      {step === 2 && (
        <>
          <motion.div
            className="layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.2 }}
            style={{
              background: "linear-gradient(180deg, #101c38 0%, #683d5a 35%, #f08b50 70%, #ffdf9e 100%)",
            }}
          >
            {/* Sunrise Orb */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: "22%",
                width: 260,
                height: 260,
                transform: "translateX(-50%)",
                borderRadius: "50%",
                background: "radial-gradient(circle, #fffbee 0%, #ffa542 55%, transparent 72%)",
                filter: "blur(6px)",
                boxShadow: "0 0 100px #ffa542",
              }}
            />
            <Particles mode="dust" count={70} color="255, 235, 180" />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "45%" }}>
              <Skyline fill="#160e1d" win="#ffeaa0" lit={1} seed={11} />
            </div>
            <div className="layer scene-vig" />
          </motion.div>

          <div className="content" style={{ padding: "80px 20px 80px", maxWidth: 1040, margin: "0 auto", position: "relative", zIndex: 10 }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 1 }}
              style={{ textAlign: "center" }}
            >
              <div className="eyebrow" style={{ color: "#ffd596" }}>
                MISSION COMPLETE · {s.team?.name || "RECON-1"}
              </div>
              <h1
                className="title-xl"
                style={{
                  fontSize: "clamp(42px, 8vw, 102px)",
                  margin: "12px 0 6px",
                  color: "#fff",
                  textShadow: "0 0 30px rgba(255,180,84,0.6)",
                }}
              >
                HAWKINS IS SAFE.
              </h1>
              <div className="term" style={{ fontSize: 24, color: "#fff", opacity: 0.9 }}>
                The Gate is sealed. The morning sun returns to Hawkins.
              </div>
            </motion.div>

            {/* Mission Score Breakdown Panel */}
            <motion.div
              className="panel"
              style={{ marginTop: 32, background: "rgba(10, 14, 22, 0.9)", borderColor: "rgba(255,180,84,0.4)" }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <div className="panel-head">
                <span className="dot" />
                <span>OFFICIAL AFTER-ACTION TELEMETRY REPORT</span>
              </div>
              <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "minmax(220px, 0.8fr) 1.6fr", gap: 28 }}>
                <div style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div className="eyebrow" style={{ fontSize: 16 }}>FINAL COMPOSITE SCORE</div>
                  <div className="title-xl" style={{ fontSize: "clamp(56px, 7vw, 84px)", color: "var(--accent)" }}>
                    <CountUp to={score} />
                  </div>
                  <div className="term dim" style={{ fontSize: 16, marginTop: 4 }}>
                    TOTAL TIME · {mmss(s.finishedAt ?? (TOTAL_TIME - s.timeLeft))}
                  </div>
                  <div className="term dim" style={{ fontSize: 15 }}>
                    SUBMISSIONS · {s.attempts || 12}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {WEIGHTS.map(([k, label, w], i) => (
                    <div key={k}>
                      <div className="term" style={{ display: "flex", justifyContent: "space-between", fontSize: 17 }}>
                        <span>
                          {label} <span className="dim">({w}%)</span>
                        </span>
                        <span className="accent">{s.breakdown[k] || 0} PTS</span>
                      </div>
                      <div className="bar" style={{ height: 8, marginTop: 4 }}>
                        <motion.i
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, ((s.breakdown[k] || 0) / max) * 100)}%` }}
                          transition={{ delay: 1.5 + i * 0.12, duration: 1.1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Leaderboard with Podium */}
            <motion.div style={{ marginTop: 36 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
              <Leaderboard highlight={s.team?.name} />
              <div style={{ textAlign: "center", marginTop: 32 }}>
                <button className="btn big" onClick={reset}>
                  ↺ PLAY AGAIN
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
