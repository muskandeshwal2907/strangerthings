"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StoryTask, LabSubTask } from "@/lib/tasks";
import { sfx } from "@/lib/audio";

interface LabTerminalTaskProps {
  task: StoryTask;
  solved: boolean;
  onSolve: (points: number, answerText: string) => void;
  disabled?: boolean;
}

export default function LabTerminalTask({ task, solved, onSolve, disabled }: LabTerminalTaskProps) {
  const data = task.labData;
  if (!data || !data.subtasks) return null;

  const subtasks = data.subtasks;

  const [activeSubtaskIdx, setActiveSubtaskIdx] = useState<number>(0);
  const [completedSubs, setCompletedSubs] = useState<Record<string, boolean>>({});
  const [inputVal, setInputVal] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "HAWKINS MAINFRAME V4.2.1986 ONLINE",
    "CRITICAL ALERT: SUBLEVEL 4 SEAL BREACHED",
    "SUBSYSTEM RESTORATION SEQUENCE INITIATED...",
  ]);
  const [errorShake, setErrorShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already solved, mark all subtasks complete
  useEffect(() => {
    if (solved) {
      const all: Record<string, boolean> = {};
      subtasks.forEach((st) => (all[st.id] = true));
      setCompletedSubs(all);
    }
  }, [solved, subtasks]);

  const currentSubtask: LabSubTask = subtasks[activeSubtaskIdx] || subtasks[0];
  const isPowerRestored = !!completedSubs[subtasks[0]?.id];
  const isSecurityBypassed = !!completedSubs[subtasks[1]?.id];
  const isCommsOnline = !!completedSubs[subtasks[2]?.id];
  const isGateAccessible = !!completedSubs[subtasks[3]?.id];

  const handleSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || solved || !inputVal.trim()) return;

    if (currentSubtask.answer.test(inputVal.trim())) {
      sfx("ok");
      const nextSubs = { ...completedSubs, [currentSubtask.id]: true };
      setCompletedSubs(nextSubs);
      setTerminalLogs((prev) => [
        `> EXECUTE MODULE [${currentSubtask.subsystem.toUpperCase()}]: SUCCESS`,
        `> ${currentSubtask.terminalSuccess}`,
        ...prev,
      ]);
      setInputVal("");
      setErrorMsg(null);

      // Check if all subtasks completed
      if (Object.keys(nextSubs).length === subtasks.length) {
        onSolve(task.points, "ALL LAB SUBSYSTEMS ONLINE");
      } else {
        // Advance to next uncompleted subtask
        const nextIdx = subtasks.findIndex((s) => !nextSubs[s.id]);
        if (nextIdx !== -1) setActiveSubtaskIdx(nextIdx);
      }
    } else {
      sfx("err");
      setErrorShake(true);
      setErrorMsg("ACCESS DENIED · INSUFFICIENT CLEARANCE");
      setTerminalLogs((prev) => [
        `> EXECUTE MODULE [${currentSubtask.subsystem.toUpperCase()}]: REJECTED`,
        ...prev,
      ]);
      setTimeout(() => setErrorShake(false), 600);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        background: "rgba(10, 14, 20, 0.96)",
        border: "1px solid rgba(54, 224, 196, 0.4)",
        borderRadius: 6,
        padding: "24px 22px",
        fontFamily: "var(--font-term)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent2)" }}>
            LAB MAINFRAME · SUBLEVEL 4 CONTROLLER
          </div>
          <div style={{ fontSize: 20, color: "#fff" }}>{task.title}</div>
        </div>
        <div className="term" style={{ color: "var(--accent2)", fontSize: 14 }}>
          {Object.keys(completedSubs).length}/{subtasks.length} MODULES ONLINE
        </div>
      </div>

      {/* Live Status Gauges / Indicator Panel */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 10,
          background: "rgba(0, 0, 0, 0.45)",
          padding: "12px 14px",
          borderRadius: 4,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          marginBottom: 18,
        }}
      >
        {/* Gauge 1: Power */}
        <div style={{ padding: "6px 8px" }}>
          <div className="eyebrow" style={{ fontSize: 11 }}>AUX POWER</div>
          <div style={{ fontSize: 18, color: isPowerRestored ? "var(--accent2)" : "#ffb454", fontWeight: "bold" }}>
            {isPowerRestored ? "100% ONLINE" : "32% CRITICAL"}
          </div>
          <div className="bar" style={{ height: 6, marginTop: 4 }}>
            <motion.i animate={{ width: isPowerRestored ? "100%" : "32%" }} />
          </div>
        </div>

        {/* Gauge 2: Security */}
        <div style={{ padding: "6px 8px" }}>
          <div className="eyebrow" style={{ fontSize: 11 }}>SECURITY</div>
          <div style={{ fontSize: 18, color: isSecurityBypassed ? "var(--accent2)" : "var(--danger)", fontWeight: "bold" }}>
            {isSecurityBypassed ? "BYPASSED" : "LOCKED"}
          </div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>
            {isSecurityBypassed ? "BULKHEADS OPEN" : "DEFCON 1 ACTIVE"}
          </div>
        </div>

        {/* Gauge 3: Comms */}
        <div style={{ padding: "6px 8px" }}>
          <div className="eyebrow" style={{ fontSize: 11 }}>COMMS ARRAY</div>
          <div style={{ fontSize: 18, color: isCommsOnline ? "var(--accent2)" : "var(--danger)", fontWeight: "bold" }}>
            {isCommsOnline ? "ONLINE" : "OFFLINE"}
          </div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>
            {isCommsOnline ? "FILE 003 READY" : "ENCRYPTED"}
          </div>
        </div>

        {/* Gauge 4: Gate */}
        <div style={{ padding: "6px 8px" }}>
          <div className="eyebrow" style={{ fontSize: 11 }}>GATE ACCESS</div>
          <div style={{ fontSize: 18, color: isGateAccessible ? "var(--accent2)" : "#ffb454", fontWeight: "bold" }}>
            {isGateAccessible ? "READY" : "SEALED"}
          </div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>
            {isGateAccessible ? "OVERRIDE EJECTED" : "PORTAL CLOSED"}
          </div>
        </div>
      </div>

      {/* Subtask Module Selector Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {subtasks.map((st, i) => {
          const isDone = !!completedSubs[st.id];
          const isCurr = activeSubtaskIdx === i;
          return (
            <button
              key={st.id}
              onClick={() => {
                sfx("click");
                setActiveSubtaskIdx(i);
                setErrorMsg(null);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: isCurr ? "rgba(54, 224, 196, 0.15)" : "transparent",
                border: `1px solid ${isCurr ? "var(--accent2)" : isDone ? "rgba(54, 224, 196, 0.3)" : "rgba(255,255,255,0.12)"}`,
                borderRadius: 4,
                color: isDone ? "var(--accent2)" : isCurr ? "#fff" : "var(--dim)",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              <span>{isDone ? "[OK]" : i + 1}</span>
              <span>{st.title.split(":")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Active Subtask Details */}
      <div style={{ background: "rgba(0,0,0,0.35)", padding: "16px 18px", borderRadius: 4, marginBottom: 18 }}>
        <div className="eyebrow" style={{ color: "var(--accent2)", marginBottom: 6 }}>
          {currentSubtask.title}
        </div>
        <div style={{ fontSize: 16, color: "#fff", lineHeight: 1.5, marginBottom: 12 }}>
          {currentSubtask.prompt}
        </div>

        {/* Code Editor with Line Numbers */}
        {currentSubtask.codeSnippet && (
          <div className="codewin" style={{ marginBottom: 14 }}>
            <div className="gut">
              {currentSubtask.codeSnippet.split("\n").map((_, lineIdx) => (
                <div key={lineIdx}>{lineIdx + 1}</div>
              ))}
            </div>
            <pre style={{ margin: 0 }}>{currentSubtask.codeSnippet}</pre>
          </div>
        )}

        {/* Input submission */}
        <form onSubmit={handleSubtaskSubmit} className={errorShake ? "shake" : ""}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="field"
              value={completedSubs[currentSubtask.id] ? "[RESTORED] SUBMODULE RESTORED" : inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                sfx("type");
              }}
              disabled={disabled || solved || !!completedSubs[currentSubtask.id]}
              placeholder={currentSubtask.placeholder}
              style={{ fontSize: 18, fontFamily: "var(--font-mono)" }}
            />
            <button className="btn" disabled={disabled || solved || !!completedSubs[currentSubtask.id] || !inputVal.trim()}>
              EXECUTE
            </button>
          </div>
        </form>

        <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: "var(--danger)", marginTop: 10, fontSize: 15 }}>
              [ERROR] {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Terminal Telemetry Log */}
      <div style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "10px 14px" }}>
        <div className="eyebrow" style={{ fontSize: 11, marginBottom: 6 }}>SYSTEM TELEMETRY STREAM</div>
        <div className="term scroll" style={{ maxHeight: 85, overflowY: "auto", fontSize: 13, color: "var(--accent2)" }}>
          {terminalLogs.map((log, idx) => (
            <div key={idx}>{log}</div>
          ))}
        </div>
      </div>

      {/* Solved celebration banner */}
      {solved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            marginTop: 18,
            padding: "14px 18px",
            background: "rgba(54, 224, 196, 0.12)",
            border: "1px solid var(--accent2)",
            borderRadius: 4,
            color: "var(--accent2)",
            fontSize: 18,
            letterSpacing: ".1em",
          }}
        >
          <div style={{ fontWeight: "bold" }}>[RESTORED] ALL LAB SUBSYSTEMS RESTORED (+{task.points} PTS)</div>
          {task.storyClue && (
            <div style={{ fontSize: 15, color: "#fff", marginTop: 6, opacity: 0.9 }}>
              {task.storyClue}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
