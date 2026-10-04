"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { setMuted, sfx } from "@/lib/audio";

interface IntroCutsceneProps {
  onComplete: () => void;
}

const LINES = [
  "HAWKINS, INDIANA",
  "1986",
  "Something strange has been happening in Hawkins.",
  "Radio signals have been detected across Roane County.",
  "People have started disappearing.",
  "And something is coming back.",
];

export default function IntroCutscene({ onComplete }: IntroCutsceneProps) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (lineIdx >= LINES.length) {
      setIsFinished(true);
      return;
    }

    const currentFullLine = LINES[lineIdx];

    if (charIdx < currentFullLine.length) {
      const timer = setTimeout(() => {
        setCharIdx((c) => c + 1);
        if (Math.random() > 0.4) {
          sfx("type");
        }
      }, 42);
      return () => clearTimeout(timer);
    } else {
      // Completed line, wait and move to next
      const pause = setTimeout(() => {
        setDisplayedLines((prev) => [...prev, currentFullLine]);
        setLineIdx((l) => l + 1);
        setCharIdx(0);
      }, lineIdx < 2 ? 650 : 850);
      return () => clearTimeout(pause);
    }
  }, [lineIdx, charIdx]);

  const handleEnter = () => {
    setMuted(false);
    sfx("boom");
    onComplete();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
        fontFamily: "var(--font-term)",
      }}
    >
      <div style={{ maxWidth: 680, width: "100%" }}>
        {/* Render already-finished lines */}
        {displayedLines.map((line, idx) => (
          <div
            key={idx}
            style={{
              fontSize: idx === 0 ? "clamp(24px, 4vw, 38px)" : idx === 1 ? "clamp(18px, 3vw, 26px)" : "clamp(18px, 2.5vw, 24px)",
              color: idx === 0 ? "#ff3b45" : idx === 1 ? "var(--accent)" : "rgba(255,255,255,0.85)",
              letterSpacing: idx < 2 ? ".25em" : ".08em",
              marginBottom: idx === 1 ? 28 : 14,
              fontWeight: idx < 2 ? "bold" : "normal",
            }}
          >
            {line}
          </div>
        ))}

        {/* Currently typing line */}
        {lineIdx < LINES.length && (
          <div
            style={{
              fontSize: lineIdx === 0 ? "clamp(24px, 4vw, 38px)" : lineIdx === 1 ? "clamp(18px, 3vw, 26px)" : "clamp(18px, 2.5vw, 24px)",
              color: lineIdx === 0 ? "#ff3b45" : lineIdx === 1 ? "var(--accent)" : "rgba(255,255,255,0.85)",
              letterSpacing: lineIdx < 2 ? ".25em" : ".08em",
              marginBottom: lineIdx === 1 ? 28 : 14,
              fontWeight: lineIdx < 2 ? "bold" : "normal",
            }}
          >
            {LINES[lineIdx].slice(0, charIdx)}
            <span className="blinker">_</span>
          </div>
        )}

        {/* Enter Hawkins CTA */}
        <AnimatePresence>
          {isFinished && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{ marginTop: 44 }}
            >
              <button
                className="btn big pulse-cta"
                onClick={handleEnter}
                style={{ width: "100%", fontSize: 24, padding: "18px 24px" }}
              >
                ENTER HAWKINS →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip button in corner */}
        <div style={{ position: "absolute", bottom: 20, right: 24 }}>
          <button
            type="button"
            className="term dim"
            onClick={handleEnter}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.3)",
              cursor: "pointer",
              fontSize: 14,
              letterSpacing: ".15em",
            }}
          >
            [SKIP INTRO]
          </button>
        </div>
      </div>
    </div>
  );
}
