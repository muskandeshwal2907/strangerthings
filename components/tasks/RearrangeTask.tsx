"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StoryTask } from "@/lib/tasks";
import { sfx } from "@/lib/audio";

interface RearrangeTaskProps {
  task: StoryTask;
  solved: boolean;
  onSolve: (points: number, answerText: string) => void;
  disabled?: boolean;
}

export default function RearrangeTask({ task, solved, onSolve, disabled }: RearrangeTaskProps) {
  const data = task.rearrangeData;
  if (!data) return null;

  const [tiles, setTiles] = useState<string[]>(data.initialTiles);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [errorShake, setErrorShake] = useState(false);
  const isUpside = data.upsideDownSkin;

  useEffect(() => {
    if (solved) {
      setTiles(data.correctOrder);
    }
  }, [solved, data.correctOrder]);

  const swapTiles = (i: number, j: number) => {
    if (i < 0 || i >= tiles.length || j < 0 || j >= tiles.length) return;
    sfx("type");
    const arr = [...tiles];
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
    setTiles(arr);
    setSelectedIdx(j);
  };

  const handleTileClick = (idx: number) => {
    if (disabled || solved) return;
    sfx("click");
    if (selectedIdx === null) {
      setSelectedIdx(idx);
    } else if (selectedIdx === idx) {
      setSelectedIdx(null);
    } else {
      swapTiles(selectedIdx, idx);
      setSelectedIdx(null);
    }
  };

  const handleMoveLeft = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || solved || idx <= 0) return;
    swapTiles(idx, idx - 1);
  };

  const handleMoveRight = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || solved || idx >= tiles.length - 1) return;
    swapTiles(idx, idx + 1);
  };

  const checkSolution = () => {
    if (disabled || solved) return;
    const isCorrect = tiles.every((tile, i) => tile === data.correctOrder[i]);
    if (isCorrect) {
      sfx("ok");
      onSolve(task.points, tiles.join(" "));
    } else {
      sfx("err");
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 600);
    }
  };

  const currentSentence = tiles.join(" ");

  return (
    <div
      style={{
        position: "relative",
        background: isUpside ? "linear-gradient(145deg, #1b090a, #0c0304)" : "rgba(13, 18, 26, 0.95)",
        border: `1px solid ${isUpside ? "rgba(255, 45, 58, 0.45)" : "rgba(255, 180, 84, 0.35)"}`,
        borderRadius: 6,
        padding: "24px 22px",
        fontFamily: "var(--font-term)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div className="eyebrow" style={{ color: isUpside ? "var(--danger)" : "var(--accent)" }}>
            ANOMALOUS TEXT RESTORATION · TILE SEQUENCER
          </div>
          <div style={{ fontSize: 20, color: "#fff" }}>{task.title}</div>
        </div>
        <div className="term dim" style={{ fontSize: 14 }}>
          {tiles.length} TILES
        </div>
      </div>

      <div style={{ fontSize: 16, color: "var(--dim)", marginBottom: 18 }}>
        {task.question} Click a tile to select, then click another to swap positions, or use the arrows.
      </div>

      {/* Interactive Tile Ribbon */}
      <div
        className={errorShake ? "shake" : ""}
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          padding: "16px 14px",
          background: "rgba(0, 0, 0, 0.45)",
          borderRadius: 4,
          border: `1px dashed ${isUpside ? "rgba(255, 45, 58, 0.3)" : "rgba(255, 180, 84, 0.25)"}`,
          marginBottom: 18,
          justifyContent: "center",
        }}
      >
        {tiles.map((tile, idx) => {
          const isSelected = selectedIdx === idx;
          return (
            <motion.div
              key={`${tile}-${idx}`}
              layout
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              onClick={() => handleTileClick(idx)}
              style={{
                position: "relative",
                padding: "14px 18px",
                background: isSelected
                  ? isUpside
                    ? "rgba(255, 45, 58, 0.35)"
                    : "rgba(255, 180, 84, 0.3)"
                  : isUpside
                  ? "rgba(255, 45, 58, 0.1)"
                  : "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${
                  isSelected
                    ? isUpside
                      ? "var(--danger)"
                      : "var(--accent)"
                    : isUpside
                    ? "rgba(255, 45, 58, 0.4)"
                    : "rgba(255, 180, 84, 0.3)"
                }`,
                borderRadius: 4,
                color: isSelected ? "#fff" : isUpside ? "#ff7c85" : "var(--accent)",
                fontSize: 20,
                letterSpacing: ".1em",
                fontWeight: "bold",
                cursor: disabled || solved ? "default" : "pointer",
                userSelect: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: "none",
              }}
            >
              <span>{tile}</span>

              {/* Arrow adjustment controls */}
              {!solved && !disabled && (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={(e) => handleMoveLeft(idx, e)}
                    disabled={idx === 0}
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "var(--dim)",
                      fontSize: 12,
                      padding: "1px 5px",
                      borderRadius: 2,
                      cursor: idx === 0 ? "default" : "pointer",
                    }}
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleMoveRight(idx, e)}
                    disabled={idx === tiles.length - 1}
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "var(--dim)",
                      fontSize: 12,
                      padding: "1px 5px",
                      borderRadius: 2,
                      cursor: idx === tiles.length - 1 ? "default" : "pointer",
                    }}
                  >
                    ▶
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Preview reading banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="term" style={{ fontSize: 16 }}>
          <span className="dim">CURRENT SEQUENCE: </span>
          <span style={{ color: "#fff" }}>&quot;{currentSentence}&quot;</span>
        </div>
        <button
          className="btn"
          onClick={checkSolution}
          disabled={disabled || solved}
        >
          {solved ? "[VERIFIED] MESSAGE RESTORED" : "VERIFY ORDER →"}
        </button>
      </div>

      {/* Completion feedback */}
      <AnimatePresence>
        {solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              padding: "14px 18px",
              background: isUpside ? "rgba(255, 45, 58, 0.15)" : "rgba(54, 224, 196, 0.12)",
              border: `1px solid ${isUpside ? "var(--danger)" : "var(--accent2)"}`,
              borderRadius: 4,
              color: isUpside ? "var(--danger)" : "var(--accent2)",
              fontSize: 18,
              letterSpacing: ".1em",
            }}
          >
            <div style={{ fontWeight: "bold" }}>[VERIFIED] MESSAGE RESTORED (+{task.points} PTS)</div>
            {task.storyClue && (
              <div style={{ fontSize: 15, color: "#fff", marginTop: 6, opacity: 0.9 }}>
                {task.storyClue}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
