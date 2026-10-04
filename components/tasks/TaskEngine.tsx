"use client";
import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StoryTask, LocationId } from "@/lib/tasks";
import { useGame, POWERS, PowerId } from "@/lib/store";
import QuizTask from "./QuizTask";
import ConnectionTask from "./ConnectionTask";
import RearrangeTask from "./RearrangeTask";
import CaseStudyTask from "./CaseStudyTask";
import SeriesTask from "./SeriesTask";
import RadioTask from "./RadioTask";
import LabTerminalTask from "./LabTerminalTask";
import { sfx } from "@/lib/audio";

interface TaskEngineProps {
  task: StoryTask;
  onNavigateLocation?: (loc: LocationId) => void;
}

function scramble(str: string, seed: number) {
  const sym = "▓▒░#@%&?§¥!><";
  return str
    .split("")
    .map((c, i) => {
      if (!/[a-z0-9]/i.test(c)) return c;
      const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
      return v - Math.floor(v) < 0.33 ? sym[(i + seed) % sym.length] : c;
    })
    .join("");
}

const leet = (s: string) =>
  s
    .replace(/a/gi, "4")
    .replace(/e/gi, "3")
    .replace(/i/gi, "1")
    .replace(/o/gi, "0")
    .replace(/s/gi, "5");

export default function TaskEngine({ task, onNavigateLocation }: TaskEngineProps) {
  const { s, sabotage, submitTask, setActive } = useGame();
  const [tick, setTick] = useState(0);

  const isSolved = !!s.completedTasks?.includes(task.id) || !!s.solved[task.id];
  const isLockedByAdmin = !!s.lockedChallenges?.[task.id];
  const isLockedByVecna = sabotage?.kind === "LOCK" || isLockedByAdmin;
  const isJammed = sabotage?.kind === "SIGNAL_JAM" && task.type === "radio";

  useEffect(() => {
    setActive(task.id);
    return () => setActive(null);
  }, [task.id, setActive]);

  useEffect(() => {
    if (sabotage?.kind !== "CORRUPT") return;
    const t = setInterval(() => setTick((n) => n + 1), 380);
    return () => clearInterval(t);
  }, [sabotage]);

  // Transform task prompt if corrupted or distorted
  const displayQuestion = useMemo(() => {
    if (sabotage?.kind === "CORRUPT") {
      return scramble(task.question, tick + (sabotage?.id ?? 0) % 97);
    }
    if (sabotage?.kind === "DISTORT") {
      return leet(task.question);
    }
    return task.question;
  }, [task.question, sabotage, tick]);

  const activeTask: StoryTask = {
    ...task,
    question: displayQuestion,
  };

  const handleSolve = (points: number, answerText: string) => {
    submitTask(task.id, points, answerText);
    if (task.type === "case_study" && onNavigateLocation && task.caseStudyData?.correctLocationRoute) {
      setTimeout(() => {
        onNavigateLocation(task.caseStudyData!.correctLocationRoute);
      }, 1200);
    }
  };

  // Revealed powers for this task
  const activeHints = (Object.keys(POWERS) as PowerId[]).filter(
    (p) => s.revealed[task.id]?.[p]
  );

  return (
    <div style={{ position: "relative" }}>
      {/* Jammed overlay for radio */}
      {isJammed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(20, 0, 0, 0.85)",
            backdropFilter: "blur(4px)",
            zIndex: 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--danger)",
            borderRadius: 6,
            border: "2px solid var(--danger)",
            textAlign: "center",
            padding: 20,
          }}
        >
          <div style={{ fontSize: 32, fontWeight: "bold", letterSpacing: ".2em" }}>⚠ SIGNAL JAMMED</div>
          <div className="term" style={{ marginTop: 8, color: "#fff" }}>
            VECNA HAS FLOODED THIS FREQUENCY WITH PSYCHIC NOISE.
          </div>
        </div>
      )}

      {/* Locked overlay */}
      {isLockedByVecna && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(25, 0, 5, 0.85)",
            backdropFilter: "blur(3px)",
            zIndex: 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--danger)",
            borderRadius: 6,
            border: "2px solid var(--danger)",
            textAlign: "center",
            padding: 20,
          }}
        >
          <div style={{ fontSize: 30, fontWeight: "bold", letterSpacing: ".2em" }}>ACCESS DENIED</div>
          <div className="eyebrow" style={{ color: "#fff", marginTop: 8 }}>
            VECNA HAS SEALED THIS PATH
          </div>
          <div className="term dim" style={{ marginTop: 6 }}>
            Restore system access via the override challenge.
          </div>
        </div>
      )}

      {/* Re-skinned Task Renderer */}
      {task.type === "quiz" && (
        <QuizTask task={activeTask} solved={isSolved} onSolve={handleSolve} disabled={isLockedByVecna} />
      )}
      {task.type === "connection" && (
        <ConnectionTask task={activeTask} solved={isSolved} onSolve={handleSolve} disabled={isLockedByVecna} />
      )}
      {task.type === "rearrange" && (
        <RearrangeTask task={activeTask} solved={isSolved} onSolve={handleSolve} disabled={isLockedByVecna} />
      )}
      {task.type === "case_study" && (
        <CaseStudyTask task={activeTask} solved={isSolved} onSolve={handleSolve} disabled={isLockedByVecna} />
      )}
      {task.type === "series" && (
        <SeriesTask task={activeTask} solved={isSolved} onSolve={handleSolve} disabled={isLockedByVecna} />
      )}
      {task.type === "radio" && (
        <RadioTask task={activeTask} solved={isSolved} onSolve={handleSolve} disabled={isLockedByVecna || isJammed} />
      )}
      {task.type === "lab_task" && (
        <LabTerminalTask task={activeTask} solved={isSolved} onSolve={handleSolve} disabled={isLockedByVecna} />
      )}

      {/* Revealed Power Hints */}
      <AnimatePresence>
        {activeHints.length > 0 && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {activeHints.map((p) => {
              const hintText = task.hints[p === "eleven" ? "eleven" : p === "will" ? "will" : "vision"];
              return (
                <motion.div
                  key={p}
                  className="hint"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    borderLeft: `3px solid ${p === "eleven" ? "var(--danger)" : "var(--accent)"}`,
                    padding: "10px 14px",
                    background: "rgba(0,0,0,0.5)",
                    borderRadius: 3,
                  }}
                >
                  <b style={{ color: p === "eleven" ? "var(--danger)" : "var(--accent)", fontSize: 13, letterSpacing: ".1em" }}>
                    {POWERS[p].name} · PSYCHIC REVELATION
                  </b>
                  <div style={{ fontSize: 15, color: "#fff", marginTop: 4 }}>{hintText}</div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
