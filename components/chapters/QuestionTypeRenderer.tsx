"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { sfx } from "@/lib/audio";
import { QuizQuestion, StageQuestionType } from "@/lib/chapterQuestions";

interface QuestionTypeRendererProps {
  question: QuizQuestion;
  selectedAnswer: string | undefined;
  onSelectOption: (optionId: string) => void;
  isVecnaMode?: boolean;
  disabled?: boolean;
}

export default function QuestionTypeRenderer({
  question,
  selectedAnswer,
  onSelectOption,
  isVecnaMode = false,
  disabled = false,
}: QuestionTypeRendererProps) {
  const stageType: StageQuestionType = question.stageType || "quiz";

  // Reorder state for Stage 3
  const [reorderedTokens, setReorderedTokens] = useState<string[]>([]);
  // Connection state for Stage 2: leftId -> rightId
  const [activeConnections, setActiveConnections] = useState<Record<string, string>>({});
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);

  // SVG String rendering coordinates
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftPinsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const rightPinsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const [lines, setLines] = useState<Array<{ key: string; x1: number; y1: number; x2: number; y2: number }>>([]);

  // Initialize state when question changes
  useEffect(() => {
    if (question.rearrangeData) {
      const initialTokens = [...question.rearrangeData.tokens];
      setReorderedTokens(initialTokens);
      // Check if already in correct order initially (unlikely)
      const isInitialMatch =
        initialTokens.length === question.rearrangeData.correctOrder.length &&
        initialTokens.every((tok, idx) => tok === question.rearrangeData!.correctOrder[idx]);
      if (isInitialMatch) {
        onSelectOption(question.correctAnswerId);
      } else {
        onSelectOption("__UNSOLVED_REARRANGE__");
      }
    }
    setActiveConnections({});
    setSelectedLeftId(null);
  }, [question.id]);

  // Recalculate SVG string coordinates for Stage 2
  const updateStringCoordinates = useCallback(() => {
    if (!containerRef.current || stageType !== "connection") return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines: Array<{ key: string; x1: number; y1: number; x2: number; y2: number }> = [];

    Object.entries(activeConnections).forEach(([leftId, rightId]) => {
      const leftEl = leftPinsRef.current[leftId];
      const rightEl = rightPinsRef.current[rightId];
      if (leftEl && rightEl) {
        const lRect = leftEl.getBoundingClientRect();
        const rRect = rightEl.getBoundingClientRect();
        newLines.push({
          key: `${leftId}-${rightId}`,
          x1: lRect.left + lRect.width / 2 - containerRect.left,
          y1: lRect.top + lRect.height / 2 - containerRect.top,
          x2: rRect.left + rRect.width / 2 - containerRect.left,
          y2: rRect.top + rRect.height / 2 - containerRect.top,
        });
      }
    });

    setLines(newLines);
  }, [activeConnections, stageType]);

  useEffect(() => {
    updateStringCoordinates();
    window.addEventListener("resize", updateStringCoordinates);
    const timer = setTimeout(updateStringCoordinates, 60);
    return () => {
      window.removeEventListener("resize", updateStringCoordinates);
      clearTimeout(timer);
    };
  }, [updateStringCoordinates, activeConnections]);

  // Handle Stage 2 Connection logic
  const handleConnect = (leftId: string, rightId: string) => {
    if (disabled) return;
    sfx("click");
    const updated = { ...activeConnections, [leftId]: rightId };
    setActiveConnections(updated);
    setSelectedLeftId(null);

    // Verify answers if all pairs connected
    const totalPairs = question.connectionData?.pairs.length || 0;
    if (Object.keys(updated).length === totalPairs && totalPairs > 0) {
      const isAllCorrect = question.connectionData!.pairs.every(
        (p) => updated[p.leftId]?.toLowerCase() === p.rightId.toLowerCase()
      );
      if (isAllCorrect) {
        onSelectOption(question.correctAnswerId);
      } else {
        onSelectOption("__WRONG_CONNECTION__");
      }
    } else {
      onSelectOption("");
    }
  };

  const handleResetConnections = () => {
    if (disabled) return;
    sfx("click");
    setActiveConnections({});
    setSelectedLeftId(null);
    onSelectOption("");
  };

  // Stage 3 Reorder Logic
  const handleMoveToken = (index: number, direction: "up" | "down") => {
    if (disabled) return;
    sfx("click");
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= reorderedTokens.length) return;
    const updated = [...reorderedTokens];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setReorderedTokens(updated);

    // Verify if assembled correctly
    if (question.rearrangeData) {
      const isMatch =
        updated.length === question.rearrangeData.correctOrder.length &&
        updated.every((tok, idx) => tok === question.rearrangeData!.correctOrder[idx]);
      if (isMatch) {
        onSelectOption(question.correctAnswerId);
      } else {
        onSelectOption("__WRONG_REARRANGE__");
      }
    }
  };

  // Theme tokens for Old Classic Paper
  const paperBorder = isVecnaMode ? "1.5px solid #a82028" : "1.5px solid #c9bda4";
  const paperAccent = isVecnaMode ? "#b81d24" : "#8b2500";
  const textColor = "#1f1812";
  const mutedText = "#5c4f42";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ──────────────────────────────────────────────────────────
          STAGE 1: QUIZ-TYPE QUESTIONS (SERIES TRIVIA)
          ────────────────────────────────────────────────────────── */}
      {stageType === "quiz" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              fontSize: "clamp(14px, 1.35vw, 16px)",
              lineHeight: 1.6,
              color: textColor,
              fontWeight: 700,
              fontFamily: "'Courier New', Courier, monospace",
              background: "rgba(255, 255, 255, 0.55)",
              padding: "14px 18px",
              border: paperBorder,
              borderRadius: "2px",
              boxShadow: "inset 0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            &quot;{question.question}&quot;
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          STAGE 2: CONNECTION QUESTIONS (DRAG-AND-DROP & RED STRINGS)
          ────────────────────────────────────────────────────────── */}
      {stageType === "connection" && question.connectionData && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              fontSize: "14px",
              lineHeight: 1.5,
              color: textColor,
              fontWeight: 700,
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            {question.question}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11px",
              fontFamily: "'Courier New', monospace",
              fontWeight: 800,
              color: mutedText,
              letterSpacing: ".08em",
            }}
          >
            <span>DRAG OR CLICK ITEMS IN COLUMN A TO CONNECT WITH COLUMN B:</span>
            {Object.keys(activeConnections).length > 0 && (
              <button
                type="button"
                onClick={handleResetConnections}
                style={{
                  background: "#e4dac4",
                  border: "1px solid #b8a691",
                  borderRadius: "2px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: "10.5px",
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 900,
                  color: "#8f231e",
                }}
              >
                ✕ RESET STRINGS
              </button>
            )}
          </div>

          {/* Interactive Dual-Column Connection Board with SVG Strings */}
          <div
            ref={containerRef}
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "28px",
              padding: "18px 16px",
              background: "rgba(255, 255, 255, 0.5)",
              border: paperBorder,
              borderRadius: "3px",
              boxShadow: "inset 0 1px 6px rgba(0,0,0,0.05)",
            }}
          >
            {/* SVG Overlay for Red Investigation Strings */}
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              {lines.map((line) => {
                const midX = (line.x1 + line.x2) / 2;
                return (
                  <g key={line.key}>
                    {/* Shadow / Glow */}
                    <path
                      d={`M ${line.x1} ${line.y1} C ${midX} ${line.y1 + 14}, ${midX} ${line.y2 + 14}, ${line.x2} ${line.y2}`}
                      stroke="rgba(255, 45, 58, 0.4)"
                      strokeWidth="6"
                      fill="none"
                    />
                    {/* Main Red String */}
                    <path
                      d={`M ${line.x1} ${line.y1} C ${midX} ${line.y1 + 14}, ${midX} ${line.y2 + 14}, ${line.x2} ${line.y2}`}
                      stroke="#c41e24"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
                    {/* Anchor Pin Knots */}
                    <circle cx={line.x1} cy={line.y1} r="5" fill="#8f1218" stroke="#fff" strokeWidth="1.5" />
                    <circle cx={line.x2} cy={line.y2} r="5" fill="#8f1218" stroke="#fff" strokeWidth="1.5" />
                  </g>
                );
              })}
            </svg>

            {/* Left Column (Column A) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", zIndex: 12 }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 900,
                  letterSpacing: ".12em",
                  color: paperAccent,
                  borderBottom: "1px solid #d4c4a8",
                  paddingBottom: "4px",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                COLUMN A (SCENARIOS & VALUES)
              </div>
              {question.connectionData.pairs.map((p, idx) => {
                const isSelected = selectedLeftId === p.leftId;
                const isConnected = !!activeConnections[p.leftId];
                const connectedRight = activeConnections[p.leftId];

                return (
                  <div
                    key={p.leftId}
                    draggable={!disabled}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", p.leftId);
                      setSelectedLeftId(p.leftId);
                    }}
                    onClick={() => {
                      if (disabled) return;
                      sfx("click");
                      setSelectedLeftId(isSelected ? null : p.leftId);
                    }}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      padding: "10px 12px",
                      background: isSelected
                        ? "rgba(184, 29, 36, 0.12)"
                        : isConnected
                        ? "#fdf7f4"
                        : "#ffffff",
                      border: isSelected
                        ? "2px solid #b81d24"
                        : isConnected
                        ? "1.5px solid #c48a80"
                        : "1px solid #d4c4a8",
                      borderRadius: "3px",
                      fontSize: "12.5px",
                      fontFamily: "'Courier New', monospace",
                      lineHeight: 1.4,
                      cursor: "grab",
                      boxShadow: isSelected
                        ? "0 2px 8px rgba(184, 29, 36, 0.25)"
                        : "0 1px 3px rgba(0,0,0,0.05)",
                      transition: "all 0.15s ease",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", flex: 1 }}>
                      <span
                        style={{
                          fontWeight: 900,
                          color: paperAccent,
                          flexShrink: 0,
                        }}
                      >
                        [{idx + 1}]
                      </span>
                      <div>
                        <span style={{ color: textColor }}>{p.leftText}</span>
                        {connectedRight && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#8f1218",
                              fontWeight: 800,
                              marginTop: "2px",
                            }}
                          >
                            STRING CONNECTED ➔ ({connectedRight})
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Connection Pin Socket */}
                    <div
                      ref={(el) => {
                        leftPinsRef.current[p.leftId] = el;
                      }}
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: isConnected ? "#c41e24" : isSelected ? "#ff2d3a" : "#d4c4a8",
                        border: "2px solid #fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                        flexShrink: 0,
                      }}
                      title="Drag from here to Column B"
                    />
                  </div>
                );
              })}
            </div>

            {/* Right Column (Column B) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", zIndex: 12 }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 900,
                  letterSpacing: ".12em",
                  color: "#184070",
                  borderBottom: "1px solid #d4c4a8",
                  paddingBottom: "4px",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                COLUMN B (MATCH TARGETS)
              </div>
              {question.connectionData.pairs.map((p) => {
                // Find if any left item connects to this right item
                const connectedFromLeft = Object.entries(activeConnections).find(
                  ([, rId]) => rId === p.rightId
                )?.[0];

                return (
                  <div
                    key={p.rightId}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const leftId = e.dataTransfer.getData("text/plain") || selectedLeftId;
                      if (leftId) handleConnect(leftId, p.rightId);
                    }}
                    onClick={() => {
                      if (selectedLeftId) {
                        handleConnect(selectedLeftId, p.rightId);
                      }
                    }}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      background: connectedFromLeft ? "#fdf7f4" : "#fdfbf7",
                      border: connectedFromLeft
                        ? "1.5px solid #c48a80"
                        : selectedLeftId
                        ? "1.5px dashed #205080"
                        : "1px solid #c9bda4",
                      borderRadius: "3px",
                      fontSize: "12.5px",
                      fontFamily: "'Courier New', monospace",
                      lineHeight: 1.4,
                      cursor: selectedLeftId ? "pointer" : "default",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      transition: "all 0.15s ease",
                      userSelect: "none",
                    }}
                  >
                    {/* Left Connection Pin Socket */}
                    <div
                      ref={(el) => {
                        rightPinsRef.current[p.rightId] = el;
                      }}
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: connectedFromLeft ? "#c41e24" : "#c9bda4",
                        border: "2px solid #fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                        flexShrink: 0,
                      }}
                      title="Drop target socket"
                    />

                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", flex: 1 }}>
                      <span
                        style={{
                          fontWeight: 900,
                          color: "#184070",
                          flexShrink: 0,
                        }}
                      >
                        ({p.rightId})
                      </span>
                      <div>
                        <span style={{ color: textColor }}>{p.rightText}</span>
                        {connectedFromLeft && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#8f1218",
                              fontWeight: 800,
                              marginTop: "2px",
                            }}
                          >
                            CONNECTED FROM [{connectedFromLeft}]
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connection Summary Bar */}
          <div
            style={{
              padding: "8px 12px",
              background: "#e9dfcb",
              borderRadius: "2px",
              borderLeft: `3px solid ${paperAccent}`,
              fontSize: "12px",
              fontFamily: "'Courier New', Courier, monospace",
              color: "#2b1c11",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <b>CONNECTED STRINGS:</b>{" "}
              {Object.keys(activeConnections).length === 0
                ? "NONE (CONNECT ALL 4 PAIRS BEFORE SUBMITTING)"
                : Object.entries(activeConnections)
                    .map(([l, r]) => `${l}–${r}`)
                    .join("  |  ")}
            </div>
            <div>
              [{Object.keys(activeConnections).length} / {question.connectionData.pairs.length} STRINGS TIED]
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          STAGE 3: REARRANGE QUESTIONS (TARGET & ▲ ▼ WORKBENCH ONLY)
          ────────────────────────────────────────────────────────── */}
      {stageType === "rearrange" && question.rearrangeData && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              fontSize: "14px",
              lineHeight: 1.5,
              color: textColor,
              fontWeight: 700,
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            {question.question}
          </div>

          {/* Interactive Reordering Workbench */}
          <div
            style={{
              padding: "16px 18px",
              background: "rgba(255, 255, 255, 0.55)",
              border: paperBorder,
              borderRadius: "3px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 900,
                color: mutedText,
                letterSpacing: ".1em",
                fontFamily: "'Courier New', monospace",
              }}
            >
              TARGET: {question.rearrangeData.targetDescription.toUpperCase()}
            </div>

            {/* Token letter tray with ▲ and ▼ buttons */}
            <div
              style={{
                display: "flex",
                flexDirection:
                  question.rearrangeData.category === "code" ||
                  question.rearrangeData.category === "steps"
                    ? "column"
                    : "row",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {reorderedTokens.map((tok, idx) => (
                <div
                  key={`${tok}-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    padding: "8px 12px",
                    background: "#fff",
                    border: "1.5px solid #c9bda4",
                    borderRadius: "2px",
                    fontSize: "13px",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontWeight: 800,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <span style={{ color: textColor }}>{tok}</span>
                  <div style={{ display: "flex", gap: "3px" }}>
                    <button
                      type="button"
                      onClick={() => handleMoveToken(idx, "up")}
                      disabled={idx === 0 || disabled}
                      style={{
                        background: "#e4dac5",
                        border: "none",
                        borderRadius: "2px",
                        cursor: idx === 0 || disabled ? "default" : "pointer",
                        opacity: idx === 0 || disabled ? 0.3 : 1,
                        padding: "3px 6px",
                        fontSize: "10px",
                        fontWeight: 900,
                      }}
                      title="Move Up / Left"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveToken(idx, "down")}
                      disabled={idx === reorderedTokens.length - 1 || disabled}
                      style={{
                        background: "#e4dac5",
                        border: "none",
                        borderRadius: "2px",
                        cursor: idx === reorderedTokens.length - 1 || disabled ? "default" : "pointer",
                        opacity: idx === reorderedTokens.length - 1 || disabled ? 0.3 : 1,
                        padding: "3px 6px",
                        fontSize: "10px",
                        fontWeight: 900,
                      }}
                      title="Move Down / Right"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Assembled Preview */}
            <div
              style={{
                padding: "10px 14px",
                background: "#e9dfcb",
                borderRadius: "2px",
                borderLeft: `3px solid ${paperAccent}`,
                fontSize: "12.5px",
                fontFamily: "'Courier New', Courier, monospace",
                color: "#2b1c11",
              }}
            >
              <b>ASSEMBLED:</b>{" "}
              {question.rearrangeData.category === "words"
                ? reorderedTokens.join(" ")
                : reorderedTokens.join(" → ")}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          STAGE 4: CASE STUDY QUESTIONS (EVIDENCE REPORTS)
          ────────────────────────────────────────────────────────── */}
      {stageType === "case_study" && question.caseStudyData && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Forensic Case Dossier Box */}
          <div
            style={{
              padding: "16px 18px",
              background: "#faf4e8",
              border: "2px solid #b81d24",
              borderRadius: "2px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #d4c4a8",
                paddingBottom: "6px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Benguiat Bold', Georgia, serif",
                  fontSize: "13px",
                  color: "#b81d24",
                  fontWeight: 900,
                  letterSpacing: ".1em",
                }}
              >
                {question.caseStudyData.caseTitle}
              </span>
              <span
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: "11px",
                  color: mutedText,
                  fontWeight: 800,
                }}
              >
                [{question.caseStudyData.caseDocket}]
              </span>
            </div>

            <div
              style={{
                fontSize: "12.5px",
                lineHeight: 1.55,
                color: textColor,
                fontFamily: "'Courier New', Courier, monospace",
                fontStyle: "italic",
                background: "rgba(255,255,255,0.7)",
                padding: "8px 12px",
                borderLeft: "3px solid #8b2500",
              }}
            >
              &quot;{question.caseStudyData.incidentBrief}&quot;
            </div>

            <div style={{ marginTop: "4px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 900,
                  color: paperAccent,
                  letterSpacing: ".1em",
                  marginBottom: "4px",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                LOGGED FIELD EVIDENCE:
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "18px",
                  fontSize: "12px",
                  lineHeight: 1.5,
                  color: textColor,
                  fontFamily: "'Courier New', Courier, monospace",
                }}
              >
                {question.caseStudyData.evidence.map((ev, i) => (
                  <li key={i} style={{ marginBottom: "4px" }}>
                    {ev}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              lineHeight: 1.5,
              color: textColor,
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            {question.question}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          STAGE 5: RADIO TRANSMISSION (DECIPHERS & CIPHERS)
          ────────────────────────────────────────────────────────── */}
      {stageType === "radio" && question.radioData && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Retro Receiver Console Box */}
          <div
            style={{
              padding: "14px 18px",
              background: "#181410",
              color: "#f0e6d2",
              border: "2px solid #5a483a",
              borderRadius: "3px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              boxShadow: "inset 0 0 10px rgba(0,0,0,0.8)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #3d2f25",
                paddingBottom: "4px",
                fontSize: "11px",
                color: "#ff8a80",
                fontFamily: "'Courier New', monospace",
                fontWeight: 900,
              }}
            >
              <span>HAWKINS RADIO RELAY // {question.radioData.frequency}</span>
              <span>TUNED</span>
            </div>

            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "13px",
                letterSpacing: ".12em",
                color: "#ffcc80",
                padding: "8px 12px",
                background: "rgba(0,0,0,0.5)",
                border: "1px dashed #7a5e4a",
                borderRadius: "2px",
              }}
            >
              SIGNAL PAYLOAD: <b>{question.radioData.rawSignal}</b>
            </div>

            <div
              style={{
                fontSize: "11px",
                color: "#d7ccc8",
                fontFamily: "'Courier New', monospace",
              }}
            >
              <b>CIPHER METHOD:</b> {question.radioData.cipherHint || question.radioData.signalType.toUpperCase()}
            </div>
          </div>

          <div
            style={{
              fontSize: "14px",
              lineHeight: 1.5,
              color: textColor,
              fontWeight: 700,
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            {question.question}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          STAGE 6: LAB-TYPE TASKS (SYSTEM OPS, LOGIC & CODE)
          ────────────────────────────────────────────────────────── */}
      {stageType === "lab_task" && question.labTaskData && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Terminal / Code / Simulation Box */}
          <div
            style={{
              padding: "14px 16px",
              background: "#121417",
              color: "#a4e6a8",
              border: "1.5px solid #2d3e33",
              borderRadius: "3px",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: "12.5px",
              lineHeight: 1.5,
              boxShadow: "inset 0 0 12px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#7e9683",
                borderBottom: "1px solid #233428",
                paddingBottom: "4px",
                marginBottom: "8px",
                fontSize: "10.5px",
              }}
            >
              <span>HAWKINS LAB EXPERIMENTAL TERMINAL [SUBLEVEL 04]</span>
              <span>ONLINE</span>
            </div>

            {question.labTaskData.terminalPrompt && (
              <div style={{ color: "#ffb74d", marginBottom: "6px" }}>
                {question.labTaskData.terminalPrompt}
              </div>
            )}

            {question.labTaskData.codeSnippet && (
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  color: "#e8f5e9",
                  background: "rgba(0,0,0,0.35)",
                  padding: "8px 10px",
                  borderRadius: "2px",
                }}
              >
                {question.labTaskData.codeSnippet}
              </pre>
            )}

            {question.labTaskData.labHint && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "11px",
                  color: "#b0bec5",
                  borderTop: "1px dashed #2a3a30",
                  paddingTop: "6px",
                }}
              >
                <b>CALCULATION GUIDE:</b> {question.labTaskData.labHint}
              </div>
            )}
          </div>

          <div
            style={{
              fontSize: "14px",
              lineHeight: 1.5,
              color: textColor,
              fontWeight: 700,
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            {question.question}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          UNIVERSAL OPTIONS GRID (ONLY FOR STAGES 1, 4, 5, 6)
          REMOVED FOR CHAPTER 2 (CONNECTIONS) AND CHAPTER 3 (REARRANGE)
          ────────────────────────────────────────────────────────── */}
      {stageType !== "connection" && stageType !== "rearrange" && (
        <div style={{ marginTop: "4px" }}>
          <div
            style={{
              fontSize: "11px",
              color: mutedText,
              letterSpacing: ".12em",
              marginBottom: "10px",
              fontFamily: "'Courier New', monospace",
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            [SELECT DIAGNOSTIC ANSWER ENTRY BELOW]:
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {question.options.map((opt) => {
              const isSelected = selectedAnswer === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    sfx("click");
                    onSelectOption(opt.id);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 16px",
                    background: isSelected
                      ? isVecnaMode
                        ? "rgba(184, 29, 36, 0.15)"
                        : "rgba(220, 180, 130, 0.35)"
                      : "rgba(255, 255, 255, 0.7)",
                    border: isSelected
                      ? `2px solid ${paperAccent}`
                      : "1.5px solid #d4c4a8",
                    borderRadius: "3px",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.8 : 1,
                    textAlign: "left",
                    width: "100%",
                    boxSizing: "border-box",
                    boxShadow: isSelected
                      ? "0 2px 8px rgba(0,0,0,0.12)"
                      : "0 1px 3px rgba(0,0,0,0.04)",
                    transition: "all 0.12s ease",
                  }}
                >
                  {/* Stamp Checkbox */}
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isSelected ? paperAccent : "#faf6ee",
                      border: `1.5px solid ${isSelected ? paperAccent : "#8c7b68"}`,
                      color: isSelected ? "#fff" : "#4a3c2c",
                      fontFamily: "'Courier New', monospace",
                      fontSize: "12px",
                      fontWeight: 900,
                      flexShrink: 0,
                      borderRadius: "2px",
                      marginTop: "1px",
                    }}
                  >
                    {isSelected ? "X" : opt.id}
                  </span>

                  {/* Option Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: "clamp(12.5px, 1.25vw, 14.5px)",
                        color: isSelected ? "#000" : textColor,
                        fontWeight: isSelected ? 800 : 600,
                        lineHeight: 1.45,
                        wordBreak: "break-word",
                      }}
                    >
                      {opt.text}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
