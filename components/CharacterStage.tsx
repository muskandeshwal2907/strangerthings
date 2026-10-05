"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { CharacterDef, CHARACTERS } from "@/lib/characters";
import { PIP_DIALOGUE, getPipLine, getCharacterLine, CHARACTER_DIALOGUES } from "@/lib/dialogue";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/audio";

export type ReactionType = "idle" | "talking" | "happy" | "wrong" | "alarm" | "shock" | "thinking";

interface CharacterStageProps {
  character?: CharacterDef;
  overrideText?: string;
  reaction?: ReactionType;
  onHintClick?: () => void;
  dialogueLines?: string[];
  compact?: boolean;
}

export default function CharacterStage({
  character = CHARACTERS.dot || CHARACTERS.radiokid,
  overrideText,
  reaction = "idle",
  onHintClick,
  dialogueLines,
  compact = false,
}: CharacterStageProps) {
  const { s, sabotage } = useGame();
  const isPip = character.id === "radiokid";

  // Build the initial set of dialogue lines
  const initialLines = useMemo(() => {
    if (overrideText) return [overrideText];
    if (dialogueLines && dialogueLines.length > 0) return dialogueLines;
    if (isPip) return PIP_DIALOGUE.intro;
    const charData = CHARACTER_DIALOGUES[character.id];
    if (charData && charData.intro && charData.intro.length > 0) {
      return charData.intro;
    }
    return [getCharacterLine(character.id, "intro")];
  }, [overrideText, dialogueLines, isPip, character.id]);

  const [lines, setLines] = useState<string[]>(initialLines);
  const [lineIdx, setLineIdx] = useState<number>(0);
  const [displayedChars, setDisplayedChars] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [activeReaction, setActiveReaction] = useState<ReactionType>(reaction);

  const prevSabotageRef = useRef<number | null>(null);
  const prevPowerUsesRef = useRef<number>(0);
  const lastActivityTimeRef = useRef<number>(Date.now());

  // Reset activity tracker
  const touchActivity = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
  }, []);

  // Update lines if overrideText or dialogueLines change
  useEffect(() => {
    if (overrideText) {
      setLines([overrideText]);
      setLineIdx(0);
      setDisplayedChars(0);
      setIsTyping(true);
      setActiveReaction(reaction || "talking");
      touchActivity();
    } else if (dialogueLines && dialogueLines.length > 0) {
      setLines(dialogueLines);
      setLineIdx(0);
      setDisplayedChars(0);
      setIsTyping(true);
      setActiveReaction("talking");
      touchActivity();
    }
  }, [overrideText, dialogueLines, reaction, touchActivity]);

  // Handle character switch
  useEffect(() => {
    if (!overrideText && !dialogueLines) {
      const defaultLines = isPip
        ? PIP_DIALOGUE.intro
        : CHARACTER_DIALOGUES[character.id]?.intro || [getCharacterLine(character.id, "intro")];
      setLines(defaultLines);
      setLineIdx(0);
      setDisplayedChars(0);
      setIsTyping(true);
      setActiveReaction("idle");
    }
  }, [character.id, isPip, overrideText, dialogueLines]);

  const currentLine = lines[lineIdx] || "";

  // React live to Vecna sabotages (SIGNAL_JAM, CORRUPT, GLITCH, LOCK)
  useEffect(() => {
    if (sabotage && sabotage.id !== prevSabotageRef.current) {
      prevSabotageRef.current = sabotage.id;
      touchActivity();
      let reactLine = "";
      if (sabotage.kind === "SIGNAL_JAM") {
        reactLine = isPip
          ? getPipLine("reactions", "signalJam")
          : "ALERT! HIGH-ENERGY FREQUENCY JAM DETECTED ACROSS ALL REPEATERS!";
        setActiveReaction("alarm");
      } else if (sabotage.kind === "CORRUPT") {
        reactLine = isPip
          ? getPipLine("reactions", "corrupt")
          : "WARNING: PACKET DATA CORRUPTED BY HOSTILE PSYCHIC PHASING!";
        setActiveReaction("shock");
      } else if (sabotage.kind === "GLITCH") {
        reactLine = isPip
          ? getPipLine("reactions", "glitch")
          : "VOLTAGE SURGE! TERMINAL TRANSFORMER EXPERIENCING ARCING!";
        setActiveReaction("alarm");
      } else if (sabotage.kind === "LOCK") {
        reactLine = isPip
          ? getPipLine("reactions", "lock")
          : "ACCESS DENIED OVERRIDE DETECTED! HOSTILE LOCK ENGAGED!";
        setActiveReaction("shock");
      }
      if (reactLine) {
        setLines([reactLine]);
        setLineIdx(0);
        setDisplayedChars(0);
        setIsTyping(true);
      }
    }
  }, [sabotage, isPip, touchActivity]);

  // React live to player powers used
  useEffect(() => {
    const totalUses = Object.values(s.powerUses || {}).reduce((acc, curr) => acc + (curr || 0), 0);
    if (totalUses > prevPowerUsesRef.current) {
      prevPowerUsesRef.current = totalUses;
      touchActivity();
      const line = isPip ? getPipLine("powerUsed") : "ELEVEN'S FREQUENCY DETECTED! ANOMALOUS TELEPATHIC BOOST ENGAGED!";
      setLines([line]);
      setLineIdx(0);
      setDisplayedChars(0);
      setIsTyping(true);
      setActiveReaction("happy");
    }
  }, [s.powerUses, isPip, touchActivity]);

  // 45s Inactivity idle nudge
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityTimeRef.current;
      if (elapsed >= 45000 && !isTyping) {
        lastActivityTimeRef.current = now;
        const nudge = isPip ? getPipLine("idleNudge") : getCharacterLine(character.id, "hint");
        setLines((prev) => [...prev, nudge]);
        setLineIdx((prev) => prev + 1);
        setDisplayedChars(0);
        setIsTyping(true);
        setActiveReaction("talking");
        sfx("morseDot");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPip, isTyping, character.id]);

  // Typewriter effect
  useEffect(() => {
    if (!isTyping) return;
    if (displayedChars < currentLine.length) {
      const timer = setTimeout(() => {
        setDisplayedChars((c) => c + 1);
        if (Math.random() > 0.6) {
          sfx("morseDot");
        }
      }, 18);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
      const timer = setTimeout(() => {
        setActiveReaction("idle");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [displayedChars, isTyping, currentLine]);

  // Advance or finish line
  const handleAdvance = useCallback(() => {
    touchActivity();
    if (isTyping) {
      // Finish typing immediately
      setDisplayedChars(currentLine.length);
      setIsTyping(false);
      sfx("type");
    } else {
      // Advance to next line
      sfx("click");
      if (lineIdx < lines.length - 1) {
        setLineIdx((i) => i + 1);
        setDisplayedChars(0);
        setIsTyping(true);
        setActiveReaction("talking");
      } else {
        // Offer fresh hint/insight line
        const nextHint = isPip ? getPipLine("hint") : getCharacterLine(character.id, "hint");
        setLines((prev) => [...prev, nextHint]);
        setLineIdx((i) => i + 1);
        setDisplayedChars(0);
        setIsTyping(true);
        setActiveReaction("talking");
      }
    }
  }, [isTyping, currentLine.length, lineIdx, lines.length, isPip, character.id, touchActivity]);

  // Global Keyboard listener for Enter and Space (ignores if focused on input/textarea)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.code !== "Space") return;
      const tag = (document.activeElement?.tagName || "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA" || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }
      e.preventDefault();
      handleAdvance();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAdvance]);

  const handleAskHint = (e: React.MouseEvent) => {
    e.stopPropagation();
    touchActivity();
    sfx("clue");
    const hint = isPip ? getPipLine("hint") : getCharacterLine(character.id, "hint");
    setLines((prev) => [...prev, hint]);
    setLineIdx((i) => i + 1);
    setDisplayedChars(0);
    setIsTyping(true);
    setActiveReaction("thinking");
    if (onHintClick) onHintClick();
  };

  // No bouncing - stationary grounded sprite with subtle horizontal flinch on alarms only
  const getSpriteAnimation = () => {
    if (activeReaction === "alarm" || activeReaction === "shock") {
      return {
        x: [-6, 6, -4, 4, -2, 2, 0],
        y: 0,
        transition: { duration: 0.35, ease: "easeOut" },
      };
    }
    if (activeReaction === "wrong") {
      return {
        x: [-4, 4, -3, 3, 0],
        y: 0,
        transition: { duration: 0.3, ease: "easeInOut" },
      };
    }
    // Fully grounded, zero bouncing
    return {
      x: 0,
      y: 0,
    };
  };

  const themeCol = character.themeColor || "var(--accent)";

  return (
    <div
      className="character-bottom-strip"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        width: "100vw",
        zIndex: 850,
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "flex-start",
        padding: "0 clamp(10px, 2vw, 24px) 0 clamp(6px, 1.2vw, 16px)",
        pointerEvents: "none",
        boxSizing: "border-box",
        gap: "clamp(10px, 1.6vw, 20px)",
      }}
    >
      {/* ── 1. CHARACTER SPRITE (ANCHORED AT BOTTOM-LEFT) ── */}
      <div
        className="character-sprite-anchor"
        onClick={handleAdvance}
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          alignSelf: "flex-end",
          lineHeight: 0,
          marginBottom: 0,
          paddingBottom: 0,
          pointerEvents: "auto",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {character.sprite ? (
          <motion.img
            src={character.sprite}
            alt={character.name}
            animate={getSpriteAnimation()}
            className="character-sprite-img"
            style={{
              height: "clamp(110px, 22vh, 220px)",
              width: "auto",
              display: "block",
              objectFit: "contain",
              objectPosition: "bottom left",
              marginBottom: 0,
              verticalAlign: "bottom",
              imageRendering: "pixelated",
              filter:
                activeReaction === "alarm" || activeReaction === "shock"
                  ? "drop-shadow(0 0 14px #ff2d3a)"
                  : activeReaction === "happy"
                  ? "drop-shadow(0 0 12px #36e0c4)"
                  : "drop-shadow(0 4px 16px rgba(0,0,0,0.85))",
            }}
          />
        ) : (
          /* Procedural Pixel-Silhouette Placeholder for characters without sprite files */
          <motion.div
            animate={getSpriteAnimation()}
            className="character-silhouette-wrap"
            style={{
              height: "clamp(110px, 22vh, 220px)",
              width: "clamp(70px, 15vh, 150px)",
              color: themeCol,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              marginBottom: 0,
              lineHeight: 0,
              filter: `drop-shadow(0 0 16px ${themeCol}44)`,
              background: "radial-gradient(ellipse at bottom, rgba(0,0,0,0.5) 0%, transparent 70%)",
            }}
            dangerouslySetInnerHTML={{
              __html:
                character.silhouetteSvg ||
                `<svg viewBox="0 0 32 48" fill="currentColor" style="shape-rendering: crispEdges; width: 100%; height: 100%;">
                  <rect x="10" y="6" width="12" height="12" />
                  <rect x="8" y="18" width="16" height="16" />
                  <rect x="6" y="20" width="2" height="10" />
                  <rect x="24" y="20" width="2" height="10" />
                  <rect x="9" y="34" width="6" height="14" />
                  <rect x="17" y="34" width="6" height="14" />
                </svg>`,
            }}
          />
        )}
      </div>

      {/* ── 2. RETRO RPG DIALOGUE BOX (RIGHT OF SPRITE) ── */}
      <div
        className="character-dialogue-box"
        onClick={handleAdvance}
        style={{
          flex: 1,
          minWidth: 0,
          alignSelf: "flex-end",
          marginBottom: "clamp(4px, 0.8vh, 8px)",
          marginRight: "clamp(8px, 1.5vw, 24px)",
          position: "relative",
          pointerEvents: "auto",
          cursor: "pointer",
          // Retro RPG style: thick double border in the theme color
          background: "linear-gradient(180deg, rgba(14, 5, 9, 0.97) 0%, rgba(6, 2, 4, 0.99) 100%)",
          border: `4px double ${themeCol}`,
          borderRadius: 6,
          boxShadow: `0 8px 24px rgba(0, 0, 0, 0.92), inset 0 0 16px rgba(0, 0, 0, 0.8), 0 0 12px ${themeCol}28`,
          padding: "clamp(10px, 1.3vh, 15px) clamp(14px, 1.8vw, 20px)",
          boxSizing: "border-box",
          userSelect: "none",
        }}
      >
        {/* Name Tag Tab on Top-Left Edge */}
        <div
          style={{
            position: "absolute",
            top: -14,
            left: 14,
            background: themeCol,
            color: "#000000",
            fontFamily: "var(--font-term), 'VT323', monospace",
            fontWeight: "bold",
            fontSize: "clamp(13px, 1.6vh, 16px)",
            letterSpacing: ".15em",
            padding: "1px 10px",
            borderRadius: "4px 4px 0 0",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            borderBottom: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>{character.nameTag || character.name.toUpperCase()}</span>
        </div>

        {/* Top-Right Status & Controls */}
        <div
          style={{
            position: "absolute",
            top: -12,
            right: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            className="term dim"
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: isTyping ? "#36e0c4" : "rgba(255,255,255,0.4)",
              letterSpacing: ".1em",
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(0,0,0,0.75)",
              padding: "2px 6px",
              borderRadius: 3,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isTyping ? "#36e0c4" : "#888",
                animation: isTyping ? "flicker 0.4s infinite" : "none",
              }}
            />
            {isTyping ? "TRANSMITTING" : "READY"}
          </span>

          <button
            type="button"
            onClick={handleAskHint}
            className="btn sm ghost"
            style={{
              fontSize: 10,
              padding: "1px 8px",
              letterSpacing: ".1em",
              borderColor: "rgba(255, 255, 255, 0.3)",
              color: "var(--accent)",
              background: "rgba(0,0,0,0.85)",
              borderRadius: 3,
            }}
          >
            💡 {isPip ? "ASK PIP" : "HINT"}
          </button>
        </div>

        {/* VT323 Text with CRT Glow */}
        <div
          className="character-dialogue-text crt-glow"
          style={{
            fontFamily: "var(--font-term), 'VT323', monospace",
            fontSize: "clamp(17px, 2.2vh, 23px)",
            lineHeight: 1.35,
            color: "#ffffff",
            textShadow: `0 0 5px rgba(255,255,255,0.7), 0 0 12px ${themeCol}`,
            letterSpacing: ".04em",
            wordBreak: "break-word",
            minHeight: "clamp(34px, 4.2vh, 50px)",
            paddingRight: 80,
          }}
        >
          <span>{currentLine.slice(0, displayedChars)}</span>
          {isTyping && (
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 16,
                background: themeCol,
                marginLeft: 4,
                verticalAlign: "middle",
                animation: "flicker 0.4s infinite",
              }}
            />
          )}
        </div>

        {/* Blinking Red Triangle at Bottom-Right When Complete */}
        <div
          style={{
            position: "absolute",
            bottom: 8,
            right: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--font-term)",
              color: "rgba(255, 255, 255, 0.45)",
              letterSpacing: ".1em",
            }}
          >
            {isTyping ? "[CLICK / SPACE TO SKIP]" : "[SPACE / CLICK]"}
          </span>

          {!isTyping && (
            <motion.div
              animate={{
                opacity: [1, 0.2, 1],
                y: [0, 2, 0],
              }}
              transition={{ repeat: Infinity, duration: 0.65, ease: "easeInOut" }}
              style={{
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "8px solid #ff2d3a",
                filter: "drop-shadow(0 0 6px #ff2d3a)",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
