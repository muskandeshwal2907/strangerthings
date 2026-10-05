"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StoryTask } from "@/lib/tasks";
import { sfx } from "@/lib/audio";

interface SeriesTaskProps {
  task: StoryTask;
  solved: boolean;
  onSolve: (points: number, answerText: string) => void;
  disabled?: boolean;
}

export default function SeriesTask({ task, solved, onSolve, disabled }: SeriesTaskProps) {
  const data = task.seriesData;
  if (!data) return null;

  const [inputVal, setInputVal] = useState("");
  const [activeBlip, setActiveBlip] = useState<number>(0);
  const [errorShake, setErrorShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const speed = data.blipSpeedMs || 700;
  const seq = data.sequence;

  // Pulse animation cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBlip((curr) => {
        const next = (curr + 1) % seq.length;
        if (typeof seq[next] === "number") {
          // Play subtle blip tone
          sfx("blip");
        }
        return next;
      });
    }, speed);
    return () => clearInterval(timer);
  }, [seq, speed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || solved || !inputVal.trim()) return;

    if (data.answer.test(inputVal.trim())) {
      sfx("ok");
      onSolve(task.points, inputVal.trim());
    } else {
      sfx("err");
      setErrorShake(true);
      setErrorMsg("SIGNAL DISCORDANCE · INVALID VALUE");
      setTimeout(() => setErrorShake(false), 600);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        background: "rgba(10, 14, 20, 0.95)",
        border: "1px solid rgba(54, 224, 196, 0.35)",
        borderRadius: 6,
        padding: "24px 22px",
        fontFamily: "var(--font-term)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent2)" }}>
            TELEMETRY BEACON · HARMONIC SERIES
          </div>
          <div style={{ fontSize: 20, color: "#fff" }}>{task.title}</div>
        </div>
        <div className="term" style={{ color: "var(--accent2)", fontSize: 14 }}>
          RADAR HARMONICS ACTIVE
        </div>
      </div>

      <div style={{ fontSize: 16, color: "var(--dim)", marginBottom: 18 }}>
        {task.question} Observe the periodic signal blips below and enter the missing component.
      </div>

      {/* Rhythmic Pulsing Signal Blip Display */}
      <div
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(54, 224, 196, 0.08), rgba(0,0,0,0.6))",
          border: "1px solid rgba(54, 224, 196, 0.2)",
          borderRadius: 4,
          padding: "24px 18px",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        {seq.map((val, idx) => {
          const isPulse = activeBlip === idx;
          const isMissing = val === "?";
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              {/* Visual radar blip light */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: isPulse
                    ? isMissing
                      ? "#ffb454"
                      : "var(--accent2)"
                    : "rgba(255, 255, 255, 0.08)",
                  boxShadow: "none",
                  border: `2px solid ${isMissing ? "#ffb454" : "var(--accent2)"}`,
                  transition: "all .12s ease-out",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  color: isPulse ? "#000" : "var(--dim)",
                  fontWeight: "bold",
                }}
              >
                {isPulse ? "●" : "○"}
              </div>

              {/* Number reading */}
              <div
                style={{
                  fontSize: 22,
                  fontFamily: "var(--font-mono)",
                  color: isMissing ? "#ffb454" : isPulse ? "#fff" : "var(--accent2)",
                  fontWeight: "bold",
                  letterSpacing: ".05em",
                }}
              >
                {val}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input submission */}
      <form onSubmit={handleSubmit} className={errorShake ? "shake" : ""} style={{ marginBottom: 16 }}>
        <label className="lbl">ENTER PREDICTED TELEMETRY VALUE</label>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="field"
            value={solved ? data.clueValue : inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              sfx("type");
            }}
            disabled={disabled || solved}
            placeholder="MISSING VALUE"
            autoFocus
            style={{ fontSize: 18, fontFamily: "var(--font-mono)" }}
          />
          <button className="btn" disabled={disabled || solved || !inputVal.trim()}>
            TRANSMIT
          </button>
        </div>
      </form>

      {/* Error feedback */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ color: "var(--danger)", marginBottom: 12, fontSize: 15 }}
          >
            [ERROR] {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success banner with clue storage */}
      {solved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: "14px 18px",
            background: "rgba(54, 224, 196, 0.12)",
            border: "1px solid var(--accent2)",
            borderRadius: 4,
            color: "var(--accent2)",
            fontSize: 18,
            letterSpacing: ".1em",
          }}
        >
          <div style={{ fontWeight: "bold" }}>[RESOLVED] TELEMETRY VALUE RESOLVED (+{task.points} PTS)</div>
          <div style={{ fontSize: 15, color: "#fff", marginTop: 6 }}>
            CLUE UNLOCKED: <b>{data.clueName}</b> → <span style={{ color: "var(--accent2)" }}>{data.clueValue}</span>
          </div>
          {task.storyClue && (
            <div style={{ fontSize: 14, color: "var(--dim)", marginTop: 4 }}>
              {task.storyClue}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
