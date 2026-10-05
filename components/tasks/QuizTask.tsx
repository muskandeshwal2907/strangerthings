"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StoryTask } from "@/lib/tasks";
import { sfx } from "@/lib/audio";

interface QuizTaskProps {
  task: StoryTask;
  solved: boolean;
  onSolve: (points: number, answerText: string) => void;
  disabled?: boolean;
}

export default function QuizTask({ task, solved, onSolve, disabled }: QuizTaskProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textVal, setTextVal] = useState("");
  const [errorShake, setErrorShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const data = task.quizData;
  if (!data) return null;

  const isCorrupted = data.isCorrupted;

  const handleOptionClick = (optId: string) => {
    if (disabled || solved) return;
    sfx("click");
    setSelectedId(optId);
    setErrorMsg(null);
  };

  const handleOptionSubmit = () => {
    if (disabled || solved || !selectedId) return;
    const opt = data.options.find((o) => o.id === selectedId);
    if (opt?.isCorrect) {
      sfx("ok");
      onSolve(task.points, opt.label);
    } else {
      sfx("err");
      setErrorShake(true);
      setErrorMsg("ACCESS DENIED · INCONSISTENT TESTIMONY");
      setTimeout(() => setErrorShake(false), 600);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || solved || !textVal.trim()) return;
    if (data.textAnswer && data.textAnswer.test(textVal.trim())) {
      sfx("ok");
      onSolve(task.points, textVal.trim());
    } else {
      sfx("err");
      setErrorShake(true);
      setErrorMsg("ACCESS DENIED · UNVERIFIED IDENTITY");
      setTimeout(() => setErrorShake(false), 600);
    }
  };

  return (
    <div
      className={`quiz-file-container ${isCorrupted ? "corrupted-file" : ""}`}
      style={{
        position: "relative",
        background: isCorrupted
          ? "linear-gradient(145deg, #18090a, #0d0405)"
          : "linear-gradient(145deg, #14171d, #0b0d12)",
        border: `1px solid ${isCorrupted ? "rgba(255, 45, 58, 0.45)" : "rgba(255, 180, 84, 0.35)"}`,
        borderRadius: 6,
        padding: "24px 28px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
        fontFamily: "var(--font-term)",
      }}
    >
      {/* Decorative Paperclip / File Stamp */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, borderBottom: "1px dashed rgba(255,255,255,0.15)", paddingBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* SVG Paperclip */}
          <svg width="22" height="34" viewBox="0 0 24 38" fill="none" stroke="var(--dim)" strokeWidth="2.2">
            <path d="M7 11V26C7 29.866 10.134 33 14 33C17.866 33 21 29.866 21 26V8C21 4.68629 18.3137 2 15 2C11.6863 2 9 4.68629 9 8V24C9 25.6569 10.3431 27 12 27C13.6569 27 15 25.6569 15 24V11" />
          </svg>
          <div>
            <div className="eyebrow" style={{ color: isCorrupted ? "var(--danger)" : "var(--accent)" }}>
              {data.caseNumber || "HAWKINS POLICE DEPT · ARCHIVE"}
            </div>
            <div style={{ fontSize: 20, color: "#fff", letterSpacing: ".1em" }}>
              {task.title}
            </div>
          </div>
        </div>

        {/* Confidential Stamp */}
        <div
          style={{
            border: `2px solid ${isCorrupted ? "#ff2d3a" : "var(--accent)"}`,
            color: isCorrupted ? "#ff2d3a" : "var(--accent)",
            padding: "4px 10px",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: ".2em",
            textTransform: "uppercase",
            transform: "rotate(-3deg)",
            borderRadius: 3,
            background: isCorrupted ? "rgba(255,45,58,0.1)" : "rgba(255,180,84,0.08)",
          }}
        >
          {data.stampText || "CONFIDENTIAL"}
        </div>
      </div>

      {/* Redacted fields block */}
      {data.redactedFields && (
        <div style={{ marginBottom: 18, background: "rgba(0,0,0,0.4)", padding: "10px 14px", borderRadius: 4 }}>
          {data.redactedFields.map((field, idx) => (
            <div key={idx} style={{ fontSize: 16, color: "var(--dim)", margin: "4px 0" }}>
              {field.replace(/\[REDACTED(.*?)\]/g, "██████████")}
            </div>
          ))}
        </div>
      )}

      {/* Question prompt */}
      <div style={{ fontSize: 18, lineHeight: 1.5, color: "#e0e6ed", marginBottom: 20 }}>
        {task.question}
      </div>

      {/* Multiple-choice options */}
      {data.options && data.options.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {data.options.map((opt) => {
            const isSelected = selectedId === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleOptionClick(opt.id)}
                disabled={disabled || solved}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textAlign: "left",
                  background: isSelected
                    ? isCorrupted
                      ? "rgba(255,45,58,0.2)"
                      : "rgba(255,180,84,0.15)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${
                    isSelected
                      ? isCorrupted
                        ? "var(--danger)"
                        : "var(--accent)"
                      : "rgba(255,255,255,0.1)"
                  }`,
                  padding: "12px 16px",
                  borderRadius: 4,
                  color: isSelected ? "#fff" : "var(--dim)",
                  cursor: disabled || solved ? "default" : "pointer",
                  fontSize: 16,
                  transition: "all .15s",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: `1px solid ${isSelected ? (isCorrupted ? "var(--danger)" : "var(--accent)") : "var(--dim)"}`,
                    background: isSelected ? (isCorrupted ? "var(--danger)" : "var(--accent)") : "transparent",
                    textAlign: "center",
                    lineHeight: "18px",
                    color: "#000",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  {isSelected ? "X" : ""}
                </span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Text input alternative for classified decrypt */}
      {data.textAnswer && (
        <form onSubmit={handleTextSubmit} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="field"
              value={textVal}
              onChange={(e) => {
                setTextVal(e.target.value);
                sfx("type");
              }}
              disabled={disabled || solved}
              placeholder="ENTER DECRYPTED IDENTITY..."
              style={{ fontSize: 18 }}
            />
            <button className="btn" disabled={disabled || solved || !textVal.trim()}>
              VERIFY
            </button>
          </div>
        </form>
      )}

      {/* Submit button for options */}
      {data.options && data.options.length > 0 && !data.textAnswer && (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            className={`btn ${errorShake ? "shake" : ""}`}
            onClick={handleOptionSubmit}
            disabled={disabled || solved || !selectedId}
          >
            {solved ? "[INFORMATION UNLOCKED]" : "CONFIRM EVIDENCE →"}
          </button>
        </div>
      )}

      {/* Error feedback */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ color: "var(--danger)", marginTop: 12, fontSize: 16 }}
          >
            [ERROR] {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

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
          <div style={{ fontWeight: "bold" }}>[UNLOCKED] INFORMATION UNLOCKED (+{task.points} PTS)</div>
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
