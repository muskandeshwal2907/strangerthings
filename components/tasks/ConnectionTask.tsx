"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StoryTask, ConnectionPair } from "@/lib/tasks";
import { sfx } from "@/lib/audio";

interface ConnectionTaskProps {
  task: StoryTask;
  solved: boolean;
  onSolve: (points: number, answerText: string) => void;
  disabled?: boolean;
}

export default function ConnectionTask({ task, solved, onSolve, disabled }: ConnectionTaskProps) {
  const data = task.connectionData;
  if (!data) return null;

  const pairs = data.pairs;
  const isUpside = data.upsideDownSkin;

  // Track connected pairs: map leftId -> rightId
  const [connections, setConnections] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [flashError, setFlashError] = useState<{ leftId: string; rightId: string } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [coords, setCoords] = useState<{ left: Record<string, { x: number; y: number }>; right: Record<string, { x: number; y: number }> }>({
    left: {},
    right: {},
  });

  // Calculate coordinates of node centers relative to container for SVG cables
  const updateCoords = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const newLeft: Record<string, { x: number; y: number }> = {};
    const newRight: Record<string, { x: number; y: number }> = {};

    Object.entries(leftRefs.current).forEach(([id, el]) => {
      if (el) {
        const r = el.getBoundingClientRect();
        newLeft[id] = {
          x: r.right - containerRect.left,
          y: r.top + r.height / 2 - containerRect.top,
        };
      }
    });

    Object.entries(rightRefs.current).forEach(([id, el]) => {
      if (el) {
        const r = el.getBoundingClientRect();
        newRight[id] = {
          x: r.left - containerRect.left,
          y: r.top + r.height / 2 - containerRect.top,
        };
      }
    });

    setCoords({ left: newLeft, right: newRight });
  };

  useEffect(() => {
    updateCoords();
    window.addEventListener("resize", updateCoords);
    return () => window.removeEventListener("resize", updateCoords);
  }, [pairs]);

  // If already solved initially, fill all connections
  useEffect(() => {
    if (solved) {
      const all: Record<string, string> = {};
      pairs.forEach((p) => {
        all[p.leftId] = p.rightId;
      });
      setConnections(all);
    }
  }, [solved, pairs]);

  const handleLeftClick = (leftId: string) => {
    if (disabled || solved) return;
    sfx("click");
    setSelectedLeft(leftId);
    setFlashError(null);
  };

  const handleRightClick = (rightId: string) => {
    if (disabled || solved || !selectedLeft) return;

    // Check if this rightId matches the selectedLeft
    const matchingPair = pairs.find((p) => p.leftId === selectedLeft);
    if (matchingPair && matchingPair.rightId === rightId) {
      // Correct link!
      sfx("snap");
      const next = { ...connections, [selectedLeft]: rightId };
      setConnections(next);
      setSelectedLeft(null);
      setFlashError(null);

      // Check if all pairs are solved
      if (Object.keys(next).length === pairs.length) {
        sfx("ok");
        onSolve(task.points, "ALL CONNECTIONS ESTABLISHED");
      }
    } else {
      // Wrong link! Snap back with red flash
      sfx("err");
      setFlashError({ leftId: selectedLeft, rightId });
      setTimeout(() => {
        setFlashError(null);
        setSelectedLeft(null);
      }, 550);
    }
  };

  const cordColor = isUpside ? "#ff2d3a" : "var(--accent2)";

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        background: isUpside ? "linear-gradient(145deg, #18090a, #0d0405)" : "rgba(13, 18, 26, 0.95)",
        border: `1px solid ${isUpside ? "rgba(255, 45, 58, 0.4)" : "rgba(54, 224, 196, 0.35)"}`,
        borderRadius: 6,
        padding: "24px 20px",
        fontFamily: "var(--font-term)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div className="eyebrow" style={{ color: isUpside ? "var(--danger)" : "var(--accent2)" }}>
            CIRCUIT ROUTER · 2-CHANNEL INTERCONNECT
          </div>
          <div style={{ fontSize: 20, color: "#fff" }}>{task.title}</div>
        </div>
        <div className="term dim" style={{ fontSize: 15 }}>
          {Object.keys(connections).length}/{pairs.length} LINKED
        </div>
      </div>

      <div style={{ fontSize: 16, color: "var(--dim)", marginBottom: 20 }}>
        {task.question} Click a source node on the left, then connect to its matching terminal on the right.
      </div>

      {/* SVG overlay for connection cables */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        <defs>
          <filter id="glow-cord" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Established cables */}
        {Object.entries(connections).map(([leftId, rightId]) => {
          const start = coords.left[leftId];
          const end = coords.right[rightId];
          if (!start || !end) return null;

          const dx = end.x - start.x;
          const cp1x = start.x + dx * 0.45;
          const cp1y = start.y;
          const cp2x = start.x + dx * 0.55;
          const cp2y = end.y;

          return (
            <g key={`${leftId}-${rightId}`}>
              <path
                d={`M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`}
                fill="none"
                stroke={cordColor}
                strokeWidth="3.5"
                filter="url(#glow-cord)"
              />
              <circle cx={start.x} cy={start.y} r="5" fill={cordColor} />
              <circle cx={end.x} cy={end.y} r="5" fill={cordColor} />
            </g>
          );
        })}

        {/* Error flashing cable */}
        {flashError && coords.left[flashError.leftId] && coords.right[flashError.rightId] && (
          <path
            d={`M ${coords.left[flashError.leftId].x} ${coords.left[flashError.leftId].y} L ${coords.right[flashError.rightId].x} ${coords.right[flashError.rightId].y}`}
            fill="none"
            stroke="#ff2d3a"
            strokeWidth="4"
            strokeDasharray="6 4"
            filter="url(#glow-cord)"
          />
        )}
      </svg>

      {/* Two columns: Left Sources & Right Targets */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, position: "relative", zIndex: 10 }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="eyebrow" style={{ color: "var(--dim)" }}>SOURCE ORIGINS</div>
          {pairs.map((p) => {
            const isConnected = !!connections[p.leftId];
            const isSelected = selectedLeft === p.leftId;
            return (
              <button
                key={p.leftId}
                ref={(el) => {
                  leftRefs.current[p.leftId] = el;
                }}
                onClick={() => handleLeftClick(p.leftId)}
                disabled={disabled || solved || isConnected}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  background: isConnected
                    ? "rgba(54, 224, 196, 0.08)"
                    : isSelected
                    ? "rgba(255, 180, 84, 0.2)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${
                    isConnected
                      ? cordColor
                      : isSelected
                      ? "var(--accent)"
                      : "rgba(255,255,255,0.12)"
                  }`,
                  borderRadius: 4,
                  color: isConnected ? cordColor : isSelected ? "#fff" : "var(--dim)",
                  cursor: disabled || solved || isConnected ? "default" : "pointer",
                  fontSize: 16,
                  textAlign: "left",
                  transition: "all .15s",
                }}
              >
                <span>{p.leftLabel}</span>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: isConnected ? cordColor : isSelected ? "var(--accent)" : "rgba(255,255,255,0.2)",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Right Column (shuffled order for challenge) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="eyebrow" style={{ color: "var(--dim)" }}>TARGET CHANNELS</div>
          {[...pairs]
            .reverse() // Reverse order to require actual reasoning
            .map((p) => {
              const isTargetConnected = Object.values(connections).includes(p.rightId);
              return (
                <button
                  key={p.rightId}
                  ref={(el) => {
                    rightRefs.current[p.rightId] = el;
                  }}
                  onClick={() => handleRightClick(p.rightId)}
                  disabled={disabled || solved || isTargetConnected}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    background: isTargetConnected
                      ? "rgba(54, 224, 196, 0.08)"
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${
                      isTargetConnected
                        ? cordColor
                        : flashError?.rightId === p.rightId
                        ? "#ff2d3a"
                        : "rgba(255,255,255,0.12)"
                    }`,
                    borderRadius: 4,
                    color: isTargetConnected ? cordColor : "var(--dim)",
                    cursor: disabled || solved || isTargetConnected ? "default" : "pointer",
                    fontSize: 16,
                    textAlign: "left",
                    transition: "all .15s",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: isTargetConnected ? cordColor : "rgba(255,255,255,0.2)",
                    }}
                  />
                  <span>{p.rightLabel}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Completion message */}
      <AnimatePresence>
        {solved && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 22,
              padding: "14px 18px",
              background: isUpside ? "rgba(255, 45, 58, 0.15)" : "rgba(54, 224, 196, 0.12)",
              border: `1px solid ${cordColor}`,
              borderRadius: 4,
              color: cordColor,
              fontSize: 18,
              letterSpacing: ".1em",
            }}
          >
            <div style={{ fontWeight: "bold" }}>[CONNECTED] CONNECTION ESTABLISHED (+{task.points} PTS)</div>
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
