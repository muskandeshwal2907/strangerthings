"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/audio";
import CinematicBackground from "../CinematicBackground";

export type ChapterId = 1 | 2 | 3 | 4;

interface ChapterDef {
  id: ChapterId;
  label: string;
  tag: string;
  archiveSector: string;
  archiveTitle: string;
  archiveSubtitle: string;
  archiveLines: string[];
  completionLoreTitle: string;
  completionLoreText: string;
  completionLines: string[];
  bgSrc: string;
  taskId: string;
  points: number;
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: 1,
    label: "CHAPTER 1",
    tag: "QUIZ TYPE",
    archiveSector: "TOWN ARCHIVE",
    archiveTitle: "HAWKINS TOWN SQUARE",
    archiveSubtitle: "1986 · EMERGENCY TELEMETRY",
    archiveLines: [
      "The town sleeps under a low autumn mist.",
      "Public utility transmitters are broadcasting anomalous pulses across Roane County.",
      "Verify your classified security clearance to access the emergency telemetry network.",
    ],
    completionLoreTitle: "SECURITY CLEARANCE VERIFIED · RECORDS DECRYPTED",
    completionLoreText:
      "Project MKUltra records confirmed: psychic experimentation breached the dimensional veil beneath Hawkins Lab. Sublevel 3 mainframe has suffered telemetry parity overflow.",
    completionLines: [
      "CLEARANCE CONFIRMED. Access granted to Hawkins National Laboratory archives.",
      "Project MKUltra records confirm psychic trials breached the dimensional veil in November 1983.",
      "Sublevel 3 data relay has suffered parity overflow. Stabilize the routine to continue.",
    ],
    bgSrc: "/hawkins-town-bg.jpg",
    taskId: "ch1-quiz",
    points: 100,
  },
  {
    id: 2,
    label: "CHAPTER 2",
    tag: "CODING",
    archiveSector: "GRID MAINFRAME",
    archiveTitle: "SUBLEVEL 3 DATA RELAY",
    archiveSubtitle: "TELEMETRY BUFFER OVERFLOW",
    archiveLines: [
      "Sublevel 3 automated relay terminal accessed.",
      "The telemetry packet router crashed due to an unhandled parity logic routine.",
      "Inspect the routine, trace the data loop, and enter the output to restore transmission.",
    ],
    completionLoreTitle: "MAINFRAME TELEMETRY BUFFER RESTORED",
    completionLoreText:
      "Parity routine stabilized. Intercepted Hawkins police dispatches report cascading transformer explosions along North Elm heading toward Hawkins Lab.",
    completionLines: [
      "TELEMETRY BUFFER RESTORED · ROUTINE EXECUTION SUCCESSFUL.",
      "Parity logic stabilized, unmasking intercepted Hawkins Police radio dispatches.",
      "Transformer explosions reported across county lines. Cross-examine the evidence dossier.",
    ],
    bgSrc: "/hawkins-lab-bg.jpg",
    taskId: "ch2-coding",
    points: 150,
  },
  {
    id: 3,
    label: "CHAPTER 3",
    tag: "CASE STUDY",
    archiveSector: "POLICE DEPT",
    archiveTitle: "INCIDENT REPORT 86-04",
    archiveSubtitle: "CHIEF'S DESK EVIDENCE DOSSIER",
    archiveLines: [
      "Chief Hopper's office, Hawkins Police Department.",
      "Eyewitness reports, dispatch audio logs, and sensor telemetry have been recovered.",
      "Correlate the timestamps and radio recordings to identify the epicenter of the breach.",
    ],
    completionLoreTitle: "ANOMALY EPICENTER CONFIRMED",
    completionLoreText:
      "All field reports and sensor vectors converge directly on Hawkins National Laboratory Sublevel 4. Lockdown protocol Level 5 active.",
    completionLines: [
      "ANOMALY EPICENTER CONFIRMED · GROUND ZERO IDENTIFIED.",
      "All telemetry vectors and field reports converge on Hawkins National Laboratory Sublevel 4.",
      "Sector sealed under Level 5 protocol. Awaiting classified tournament release.",
    ],
    bgSrc: "/hawkins-police-bg.jpg",
    taskId: "ch3-case-study",
    points: 200,
  },
  {
    id: 4,
    label: "CHAPTER 4",
    tag: "TRANSMISSION & LAB",
    archiveSector: "HAWKINS LAB",
    archiveTitle: "TRANSMISSION & LAB MAINFRAME",
    archiveSubtitle: "RESTRICTED ACCESS · LEVEL 5",
    archiveLines: [
      "Hawkins National Laboratory. Sublevel 4 containment blast doors.",
      "High-voltage dimensional gateway transmitters are sealed under emergency protocol.",
      "Sector status: OFFLINE. Awaiting authorized clearance release.",
    ],
    completionLoreTitle: "HAWKINS PROTOCOL LEVEL 5 · SYSTEM LOCKED",
    completionLoreText:
      "Sublevel 4 blast doors remain sealed shut. Transmission arrays and gateway mainframe hardware are offline. This sector will become accessible in the next phase of the tournament.",
    completionLines: [
      "SECTOR SEALED · LEVEL 5 CLASSIFICATION ACTIVE.",
      "Containment blast doors remain locked under emergency government protocol.",
    ],
    bgSrc: "/hawkins-gate-bg.jpg",
    taskId: "ch4-transmission-lab",
    points: 300,
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Pokemon FireRed Style Bottom Dialogue Box (Strict Red/Black, Zero Glow, Centered)
   ───────────────────────────────────────────────────────────────────────────── */
function PokemonFireRedBottomDialog({
  chapter,
  mode = "intro",
  onComplete,
  onNextEpisode,
}: {
  chapter: ChapterDef;
  mode?: "intro" | "completion";
  onComplete: () => void;
  onNextEpisode?: () => void;
}) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  const lines = mode === "completion" ? chapter.completionLines : chapter.archiveLines;
  const currentLine = lines[lineIdx] || "";

  useEffect(() => {
    setCharCount(0);
    setIsTyping(true);
  }, [lineIdx, chapter.id, mode]);

  useEffect(() => {
    if (!isTyping) return;
    if (charCount < currentLine.length) {
      const timer = setTimeout(() => {
        setCharCount((c) => c + 1);
        if (Math.random() > 0.45) sfx("type");
      }, 22);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [charCount, isTyping, currentLine]);

  const handleAdvance = useCallback(() => {
    if (isTyping) {
      setCharCount(currentLine.length);
      setIsTyping(false);
      sfx("type");
    } else {
      if (lineIdx < lines.length - 1) {
        setLineIdx((i) => i + 1);
        sfx("click");
      } else {
        if (mode === "completion" && onNextEpisode) {
          sfx("ok");
          onNextEpisode();
        } else {
          sfx("ok");
          onComplete();
        }
      }
    }
  }, [isTyping, lineIdx, lines.length, currentLine.length, mode, onNextEpisode, onComplete]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
      if (e.key === "Escape") {
        onComplete();
      } else {
        handleAdvance();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAdvance, onComplete]);

  const isFinalLine = lineIdx === lines.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 900,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 22,
        boxSizing: "border-box",
      }}
    >
      {/* Fullscreen Blur Backdrop: Blurs entire main screen behind the lore */}
      <motion.div
        key="lore-blur-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleAdvance}
        style={{
          position: "absolute",
          inset: 0,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          background: "rgba(4, 2, 6, 0.84)",
          pointerEvents: "auto",
          cursor: "pointer",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 35 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={handleAdvance}
        style={{
          position: "relative",
          zIndex: 10,
          pointerEvents: "auto",
          width: "min(1100px, 94vw)",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div
          style={{
            position: "relative",
            background: "linear-gradient(180deg, #100407 0%, #060103 100%)",
            border: "3px solid #ff2d3a",
            borderRadius: 8,
            padding: "20px 28px 18px",
            boxShadow: "0 16px 45px rgba(0, 0, 0, 0.95)",
          }}
        >
          {/* Side End Caps */}
          <div
            style={{
              position: "absolute",
              left: -4,
              top: "50%",
              transform: "translateY(-50%)",
              width: 7,
              height: 48,
              borderRadius: 2,
              background: "#ff2d3a",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -4,
              top: "50%",
              transform: "translateY(-50%)",
              width: 7,
              height: 48,
              borderRadius: 2,
              background: "#ff2d3a",
            }}
          />

          {/* Top Header Strip inside Dialog */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid rgba(255, 45, 58, 0.3)",
              paddingBottom: 8,
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#ff2d3a",
                }}
              />
              <span
                className="eyebrow"
                style={{
                  fontSize: 12.5,
                  letterSpacing: ".22em",
                  color: "#ff2d3a",
                  fontWeight: "bold",
                }}
              >
                {mode === "completion"
                  ? `EPILOGUE LORE ARCHIVE · ${chapter.archiveSector}`
                  : `ARCHIVE TRANSMISSION · ${chapter.archiveSector}`}
              </span>
              <span style={{ fontSize: 12.5, color: "rgba(255, 255, 255, 0.65)", fontFamily: "var(--font-mono)" }}>
                [{chapter.label}]
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.55)", fontFamily: "var(--font-mono)" }}>
                LOG {lineIdx + 1} / {lines.length}
              </span>
              {mode === "completion" && onNextEpisode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sfx("ok");
                    onNextEpisode();
                  }}
                  style={{
                    fontSize: 12,
                    padding: "4px 12px",
                    letterSpacing: ".12em",
                    borderRadius: 3,
                    border: "1px solid #ff2d3a",
                    background: "#ff2d3a",
                    color: "#000000",
                    fontWeight: "bold",
                    fontFamily: "var(--font-term)",
                  }}
                >
                  NEXT EPISODE →
                </button>
              )}
            </div>
          </div>

          {/* Text Area */}
          <div
            style={{
              minHeight: 60,
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(16.5px, 2.2vw, 19.5px)",
              lineHeight: 1.65,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
            }}
          >
            <div style={{ flex: 1 }}>
              <span style={{ color: "#ffffff", fontWeight: 500, letterSpacing: ".02em" }}>
                {currentLine.slice(0, charCount)}
              </span>
              {isTyping && (
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 18,
                    background: "#ff2d3a",
                    marginLeft: 4,
                    verticalAlign: "middle",
                  }}
                />
              )}
            </div>

            {/* Continuation indicator */}
            {!isTyping && (
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {isFinalLine && mode === "completion" && onNextEpisode ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-term)",
                      letterSpacing: ".15em",
                      color: "#000000",
                      background: "#ff2d3a",
                      padding: "3px 8px",
                      borderRadius: 3,
                      fontWeight: "bold",
                    }}
                  >
                    NEXT EPISODE →
                  </span>
                ) : isFinalLine && mode === "intro" ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-term)",
                      letterSpacing: ".15em",
                      color: "#ff2d3a",
                      border: "1px solid #ff2d3a",
                      background: "rgba(255, 45, 58, 0.18)",
                      padding: "3px 8px",
                      borderRadius: 3,
                      fontWeight: "bold",
                    }}
                  >
                    ACCESS QUESTION →
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-term)",
                      letterSpacing: ".12em",
                      color: "rgba(255, 255, 255, 0.55)",
                    }}
                  >
                    CLICK TO ADVANCE
                  </span>
                )}
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: "7px solid transparent",
                    borderRight: "7px solid transparent",
                    borderTop: "9px solid #ff2d3a",
                  }}
                />
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Chapter Completion View (Pure Red and Black, No Glow, Lore Briefing)
   ───────────────────────────────────────────────────────────────────────────── */
function ChapterCompletionView({
  chapter,
  onNextEpisode,
  isLastEpisode,
  onViewDossier,
}: {
  chapter: ChapterDef;
  onNextEpisode: () => void;
  isLastEpisode?: boolean;
  onViewDossier: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: "42px 46px",
        background: "linear-gradient(180deg, #0d0306 0%, #050103 100%)",
        color: "#ffffff",
        justifyContent: "center",
      }}
    >
      {/* Clean Status Badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 45, 58, 0.3)",
          paddingBottom: 16,
          marginBottom: 26,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "#ff2d3a",
            }}
          />
          <span
            style={{
              fontSize: 15,
              fontFamily: "var(--font-term)",
              letterSpacing: ".22em",
              color: "#ff2d3a",
              fontWeight: "bold",
            }}
          >
            CHAPTER {chapter.id} COMPLETED
          </span>
        </div>

        <span
          style={{
            background: "#ff2d3a",
            color: "#000000",
            fontWeight: "bold",
            fontSize: 13,
            padding: "4px 12px",
            borderRadius: 3,
            fontFamily: "var(--font-mono)",
            letterSpacing: ".15em",
          }}
        >
          +{chapter.points} PTS
        </span>
      </div>

      {/* Main Lore Brief Box (Simple, relevant, concise) */}
      <div
        style={{
          background: "#080204",
          border: "2px solid #ff2d3a",
          borderRadius: 4,
          padding: "26px 28px",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            fontSize: 13.5,
            fontFamily: "var(--font-term)",
            letterSpacing: ".2em",
            color: "#ff2d3a",
            fontWeight: "bold",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          {chapter.completionLoreTitle}
        </div>

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(16px, 2.1vw, 18.5px)",
            lineHeight: 1.65,
            color: "#ffffff",
            margin: 0,
            letterSpacing: ".02em",
          }}
        >
          {chapter.completionLoreText}
        </p>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        {!isLastEpisode ? (
          <button
            type="button"
            onClick={() => {
              sfx("ok");
              onNextEpisode();
            }}
            style={{
              background: "#ff2d3a",
              color: "#000000",
              fontWeight: 900,
              fontSize: 17,
              letterSpacing: ".18em",
              padding: "14px 40px",
              border: "2px solid #ff2d3a",
              borderRadius: 4,
              cursor: "pointer",
              fontFamily: "var(--font-term)",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#000000";
              e.currentTarget.style.color = "#ff2d3a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ff2d3a";
              e.currentTarget.style.color = "#000000";
            }}
          >
            NEXT EPISODE →
          </button>
        ) : (
          <div
            style={{
              padding: "12px 22px",
              border: "1px dashed #ff2d3a",
              background: "rgba(255, 45, 58, 0.1)",
              color: "#ff2d3a",
              fontSize: 14,
              letterSpacing: ".15em",
              fontFamily: "var(--font-term)",
              borderRadius: 4,
              textAlign: "center",
            }}
          >
            [CHAPTER 4 LOCKED UNDER LEVEL 5 EMERGENCY PROTOCOL]
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            sfx("click");
            onViewDossier();
          }}
          style={{
            background: "#050103",
            color: "#ffffff",
            fontSize: 14,
            letterSpacing: ".14em",
            padding: "13px 26px",
            border: "1px solid rgba(255, 45, 58, 0.5)",
            borderRadius: 4,
            cursor: "pointer",
            fontFamily: "var(--font-term)",
            textTransform: "uppercase",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#ff2d3a";
            e.currentTarget.style.color = "#ff2d3a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 45, 58, 0.5)";
            e.currentTarget.style.color = "#ffffff";
          }}
        >
          [VIEW ALL CHAPTERS]
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Chapter Manager
   ───────────────────────────────────────────────────────────────────────────── */
export default function ChapterManager() {
  const {
    s,
    submitTask,
    activeChapterId,
    setActiveChapterId,
    chapterModalOpen,
    setChapterModalOpen,
  } = useGame();

  // Solved states
  const ch1Solved = !!s.completedTasks?.includes("ch1-quiz") || !!s.solved?.["ch1-quiz"];
  const ch2Solved = !!s.completedTasks?.includes("ch2-coding") || !!s.solved?.["ch2-coding"];
  const ch3Solved = !!s.completedTasks?.includes("ch3-case-study") || !!s.solved?.["ch3-case-study"];

  // Narration track: plays once per chapter, then is GONE!
  const [seenNarrations, setSeenNarrations] = useState<Record<number, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("hawkins_seen_narrations");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem("hawkins_seen_narrations", JSON.stringify(seenNarrations));
    } catch (e) {}
  }, [seenNarrations]);

  const [replayingNarration, setReplayingNarration] = useState(false);
  const isNarrationActive = !seenNarrations[activeChapterId] || replayingNarration;
  const [completionStoryChapterId, setCompletionStoryChapterId] = useState<number | null>(null);
  const isLoreActive = isNarrationActive || completionStoryChapterId !== null;

  // Progressive unlock check
  const isChapterUnlocked = useCallback((id: ChapterId) => {
    if (id === 1) return true;
    if (id === 2) return ch1Solved;
    if (id === 3) return ch2Solved;
    if (id === 4) return false; // Strictly locked
    return false;
  }, [ch1Solved, ch2Solved]);

  // Ensure active chapter is valid on refresh or unlock changes
  useEffect(() => {
    if (!isChapterUnlocked(activeChapterId as ChapterId)) {
      if (ch2Solved) setActiveChapterId(3);
      else if (ch1Solved) setActiveChapterId(2);
      else setActiveChapterId(1);
    }
  }, [activeChapterId, ch1Solved, ch2Solved, isChapterUnlocked, setActiveChapterId]);

  const currentChapter = CHAPTERS.find((c) => c.id === activeChapterId) || CHAPTERS[0];

  // Chapter 1 Quiz State
  const [q1Selected, setQ1Selected] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hawkins_q1_selected") || null;
    }
    return null;
  });
  const [q1Error, setQ1Error] = useState(false);

  useEffect(() => {
    if (q1Selected) {
      localStorage.setItem("hawkins_q1_selected", q1Selected);
    }
  }, [q1Selected]);

  const Q1_OPTIONS = [
    { id: "A", text: "Project MKUltra / Sublevel 04", isCorrect: true },
    { id: "B", text: "Operation Paperclip / Echo Division", isCorrect: false },
    { id: "C", text: "Stargate Surveillance Protocol", isCorrect: false },
    { id: "D", text: "Project Blue Book Sub-Archive", isCorrect: false },
  ];

  const handleQ1Submit = () => {
    if (!q1Selected || ch1Solved) return;
    const opt = Q1_OPTIONS.find((o) => o.id === q1Selected);
    if (opt?.isCorrect) {
      sfx("ok");
      setQ1Error(false);
      submitTask("ch1-quiz", 100, opt.text);
      setCompletionStoryChapterId(1);
    } else {
      sfx("err");
      setQ1Error(true);
      setTimeout(() => setQ1Error(false), 900);
    }
  };

  // Chapter 2 Coding State
  const [codeAnswer, setCodeAnswer] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hawkins_code_answer") || "";
    }
    return "";
  });
  const [codeError, setCodeError] = useState(false);

  useEffect(() => {
    localStorage.setItem("hawkins_code_answer", codeAnswer);
  }, [codeAnswer]);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeAnswer.trim() || ch2Solved) return;
    if (codeAnswer.trim() === "68") {
      sfx("ok");
      setCodeError(false);
      submitTask("ch2-coding", 150, "68");
      setCompletionStoryChapterId(2);
    } else {
      sfx("err");
      setCodeError(true);
      setTimeout(() => setCodeError(false), 900);
    }
  };

  // Chapter 3 Case Study State
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hawkins_evidence_tab");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return 0;
  });

  useEffect(() => {
    localStorage.setItem("hawkins_evidence_tab", activeEvidenceTab.toString());
  }, [activeEvidenceTab]);

  const [caseSelected, setCaseSelected] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hawkins_case_selected") || null;
    }
    return null;
  });
  const [caseError, setCaseError] = useState(false);

  useEffect(() => {
    if (caseSelected) {
      localStorage.setItem("hawkins_case_selected", caseSelected);
    }
  }, [caseSelected]);

  const EVIDENCE_LOGS = [
    {
      title: "DISPATCH LOG 22:42",
      badge: "AUDIO TRANSCRIPT",
      time: "22:42:15",
      content:
        "Deputies report high-voltage transformers blew along North Elm. An anomalous 3.5 GHz harmonic wave was detected traveling northeast toward the Department of Energy perimeter line.",
    },
    {
      title: "WITNESS 22:58",
      badge: "BENNY'S DINER",
      time: "22:58:00",
      content:
        "Individual in hospital gown spotted fleeing south from woods bordering the government facility. Witness reported lights flickered violently when subject walked near electrical lines.",
    },
    {
      title: "RF SENSOR 23:15",
      badge: "EAST HILL REPEATER",
      time: "23:15:30",
      content:
        "Electromagnetic radiation spike registered at 14.8 MHz. Triangulated vector points directly at Hawkins National Laboratory Sublevel 4 Containment Zone.",
    },
  ];

  const CASE_OPTIONS = [
    { id: "A", text: "Hawkins National Laboratory (Sublevel 4)", isCorrect: true },
    { id: "B", text: "Cornwallis Municipal Substation", isCorrect: false },
    { id: "C", text: "Roane County Water Tower Reservoir", isCorrect: false },
    { id: "D", text: "Sattler Quarry Abandoned Basin", isCorrect: false },
  ];

  const handleCaseSubmit = () => {
    if (!caseSelected || ch3Solved) return;
    const opt = CASE_OPTIONS.find((o) => o.id === caseSelected);
    if (opt?.isCorrect) {
      sfx("ok");
      setCaseError(false);
      submitTask("ch3-case-study", 200, opt.text);
      setCompletionStoryChapterId(3);
    } else {
      sfx("err");
      setCaseError(true);
      setTimeout(() => setCaseError(false), 900);
    }
  };

  return (
    <div
      className="screen"
      style={{
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "66px 20px 20px",
        boxSizing: "border-box",
      }}
    >
      {/* Photorealistic Cinematic Background */}
      <CinematicBackground
        key={`bg-${currentChapter.id}`}
        src={currentChapter.bgSrc}
        particles="spores"
        vignette="heavy"
        overlayOpacity={0.65}
      />

      {/* Pokemon FireRed Style Bottom Overlay Dialog (On bottom overlay on question) */}
      <AnimatePresence>
        {isNarrationActive && (
          <PokemonFireRedBottomDialog
            key={`dialog-${currentChapter.id}-${replayingNarration}`}
            chapter={currentChapter}
            mode="intro"
            onComplete={() => {
              setSeenNarrations((prev) => ({ ...prev, [activeChapterId]: true }));
              setReplayingNarration(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Completion Epilogue Dialogue */}
      <AnimatePresence>
        {completionStoryChapterId !== null && (
          <PokemonFireRedBottomDialog
            key={`completion-dialog-${completionStoryChapterId}`}
            chapter={CHAPTERS.find((c) => c.id === completionStoryChapterId) || CHAPTERS[0]}
            mode="completion"
            onComplete={() => setCompletionStoryChapterId(null)}
            onNextEpisode={
              completionStoryChapterId < 3
                ? () => {
                    const nextId = (completionStoryChapterId + 1) as ChapterId;
                    setCompletionStoryChapterId(null);
                    setActiveChapterId(nextId);
                  }
                : () => {
                    setCompletionStoryChapterId(null);
                    setChapterModalOpen(true);
                  }
            }
          />
        )}
      </AnimatePresence>

      {/* Chapters Gallery Modal (Triggered from [CHAPTERS] in the Top Navbar) */}
      <AnimatePresence>
        {chapterModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(3, 1, 4, 0.92)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              zIndex: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px 20px",
            }}
            onClick={() => setChapterModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(1100px, 98vw)",
                background: "rgba(10, 5, 10, 0.98)",
                border: "1px solid rgba(255, 45, 58, 0.4)",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.98)",
                borderRadius: 6,
                padding: "30px 28px 32px",
                maxHeight: "92vh",
                overflowY: "auto",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                  paddingBottom: 16,
                  marginBottom: 24,
                }}
              >
                <div>
                  <div
                    className="eyebrow"
                    style={{ color: "var(--accent)", fontSize: 12, letterSpacing: ".25em" }}
                  >
                    HAWKINS TOURNAMENT · SECTOR ARCHIVE
                  </div>
                  <h2
                    className="title-xl"
                    style={{
                      fontSize: "clamp(24px, 3.8vw, 36px)",
                      color: "#ff3b45",
                      margin: 0,
                    }}
                  >
                    THE HAWKINS CHAPTERS
                  </h2>
                </div>

                <button
                  type="button"
                  className="btn sm ghost"
                  onClick={() => {
                    sfx("click");
                    setChapterModalOpen(false);
                  }}
                  style={{
                    fontSize: 13,
                    padding: "8px 18px",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    letterSpacing: ".12em",
                    borderRadius: 4,
                  }}
                >
                  [CLOSE]
                </button>
              </div>

              {/* Cards Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 18,
                }}
              >
                {CHAPTERS.map((ch) => {
                  const unlocked = isChapterUnlocked(ch.id);
                  const isCurrent = ch.id === activeChapterId;
                  const isSolved =
                    (ch.id === 1 && ch1Solved) ||
                    (ch.id === 2 && ch2Solved) ||
                    (ch.id === 3 && ch3Solved);

                  let lockReason = "";
                  if (!unlocked) {
                    if (ch.id === 2) lockReason = "REQUIRES CHAPTER 1 COMPLETION";
                    else if (ch.id === 3) lockReason = "REQUIRES CHAPTER 2 COMPLETION";
                    else if (ch.id === 4) lockReason = "CLASSIFIED · LEVEL 5 LOCKDOWN";
                  }

                  return (
                    <div
                      key={ch.id}
                      style={{
                        background: isCurrent
                          ? "rgba(255, 180, 84, 0.12)"
                          : "rgba(20, 10, 20, 0.8)",
                        border: isCurrent
                          ? "2px solid var(--accent)"
                          : unlocked
                          ? "1px solid rgba(255, 255, 255, 0.18)"
                          : "1px dashed rgba(255, 45, 58, 0.3)",
                        borderRadius: 6,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        opacity: unlocked ? 1 : 0.62,
                        transition: "all 0.2s ease",
                        position: "relative",
                      }}
                    >
                      {/* Cover Image Thumbnail */}
                      <div
                        style={{
                          height: 130,
                          width: "100%",
                          backgroundImage: `url(${ch.bgSrc})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          position: "relative",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(to top, rgba(10,5,10,0.95) 0%, rgba(10,5,10,0.2) 100%)",
                          }}
                        />

                        {/* Top Status Pill */}
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            padding: "3px 8px",
                            borderRadius: 3,
                            fontSize: 10,
                            letterSpacing: ".15em",
                            fontWeight: "bold",
                            background: isSolved
                              ? "#ff2d3a"
                              : unlocked
                              ? "#ff8a4c"
                              : "rgba(255, 45, 58, 0.25)",
                            border: isSolved
                              ? "1px solid #ff2d3a"
                              : unlocked
                              ? "1px solid #ff8a4c"
                              : "1px dashed rgba(255, 45, 58, 0.6)",
                            color: isSolved
                              ? "#000000"
                              : unlocked
                              ? "#000000"
                              : "#ff2d3a",
                          }}
                        >
                          {isSolved ? "[COMPLETE]" : unlocked ? "[UNLOCKED]" : "[LOCKED]"}
                        </div>

                        {/* Chapter ID Pill */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: 8,
                            left: 10,
                            fontSize: 12,
                            fontFamily: "var(--font-term)",
                            color: "var(--accent)",
                            letterSpacing: ".2em",
                            fontWeight: "bold",
                          }}
                        >
                          {ch.label}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div
                        style={{
                          padding: "16px 14px",
                          display: "flex",
                          flexDirection: "column",
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            letterSpacing: ".15em",
                            color: "var(--accent)",
                            fontWeight: "bold",
                            marginBottom: 4,
                          }}
                        >
                          [{ch.tag}]
                        </div>

                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: "bold",
                            color: "#fff",
                            marginBottom: 6,
                            fontFamily: "var(--font-term)",
                            letterSpacing: ".06em",
                          }}
                        >
                          {ch.archiveTitle}
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--dim)",
                            marginBottom: 14,
                            lineHeight: 1.4,
                            flex: 1,
                          }}
                        >
                          {ch.archiveSubtitle}
                        </div>

                        {/* Card Button */}
                        {unlocked ? (
                          <button
                            type="button"
                            className={`btn sm ${isCurrent ? "" : "ghost"}`}
                            onClick={() => {
                              setActiveChapterId(ch.id);
                              setChapterModalOpen(false);
                              sfx("ok");
                            }}
                            style={{
                              width: "100%",
                              fontSize: 13,
                              padding: "8px 12px",
                              letterSpacing: ".12em",
                              borderRadius: 4,
                            }}
                          >
                            {isCurrent ? "[CURRENT CHAPTER]" : "ACCESS SECTOR →"}
                          </button>
                        ) : (
                          <div style={{ textAlign: "center" }}>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--danger)",
                                letterSpacing: ".1em",
                                border: "1px dashed rgba(255, 45, 58, 0.4)",
                                background: "rgba(255, 45, 58, 0.1)",
                                padding: "6px 12px",
                                borderRadius: 3,
                              }}
                            >
                              {lockReason}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Single Centered Challenge Console (Non-scrolling viewport) */}
      <motion.div
        key={`task-${currentChapter.id}`}
        className="panel"
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          width: "min(1180px, 94vw)",
          maxHeight: "calc(100vh - 84px)",
          background: "rgba(10, 5, 10, 0.95)",
          backdropFilter: isLoreActive ? "none" : "blur(14px)",
          WebkitBackdropFilter: isLoreActive ? "none" : "blur(14px)",
          filter: isLoreActive ? "blur(14px)" : "none",
          opacity: isLoreActive ? 0.22 : 1,
          pointerEvents: isLoreActive ? "none" : "auto",
          userSelect: isLoreActive ? "none" : "auto",
          transition: "filter 0.35s ease, opacity 0.35s ease",
          border: "1px solid rgba(255, 45, 58, 0.35)",
          boxShadow: "0 0 45px rgba(0,0,0,0.92)",
          borderRadius: 6,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        {/* CHAPTER 1: QUIZ */}
        {currentChapter.id === 1 && (
          ch1Solved ? (
            <ChapterCompletionView
              chapter={CHAPTERS[0]}
              onNextEpisode={() => {
                sfx("ok");
                setActiveChapterId(2);
              }}
              onViewDossier={() => setChapterModalOpen(true)}
            />
          ) : (
            <>
              <div className="panel-head" style={{ padding: "16px 26px", display: "flex", alignItems: "center" }}>
                <span className="dot" style={{ width: 9, height: 9, background: "#ff3b45" }} />
                <span style={{ fontSize: 16, letterSpacing: ".16em" }}>CHAPTER 1 : QUIZ CHALLENGE</span>

                <button
                  type="button"
                  className="btn sm ghost"
                  onClick={() => setReplayingNarration(true)}
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    padding: "5px 12px",
                    letterSpacing: ".1em",
                    borderRadius: 3,
                  }}
                  title="Replay chapter intro story"
                >
                  [LORE BRIEFING]
                </button>

                <span className="term dim" style={{ marginLeft: 16, fontSize: 14, color: "var(--accent)" }}>
                  +100 PTS
                </span>
              </div>

              <div className="panel-body" style={{ padding: "26px 32px", overflowY: "auto", flex: 1 }}>
                <div
                  style={{
                    fontSize: 18,
                    lineHeight: 1.6,
                    marginBottom: 20,
                    color: "#fff",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  During the covert November 1983 incident at Hawkins National Laboratory, which
                  classified Department of Energy project resulted in the initial psychokinetic rift
                  and the escape of test subjects?
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
                  {Q1_OPTIONS.map((opt) => {
                    const isSelected = q1Selected === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isLoreActive}
                        onClick={() => {
                          if (isLoreActive) return;
                          sfx("click");
                          setQ1Selected(opt.id);
                        }}
                        style={{
                          padding: "15px 18px",
                          textAlign: "left",
                          background: isSelected
                            ? "rgba(255, 45, 58, 0.18)"
                            : "rgba(0, 0, 0, 0.6)",
                          border: isSelected
                            ? "1px solid #ff2d3a"
                            : "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 4,
                          cursor: "pointer",
                          color: isSelected ? "#ff2d3a" : "rgba(255,255,255,0.85)",
                          fontSize: 15.5,
                          fontFamily: "var(--font-mono)",
                          letterSpacing: ".05em",
                          transition: "all 0.18s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <span
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 3,
                            border: isSelected
                              ? "2px solid #ff2d3a"
                              : "1px solid rgba(255,255,255,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: "bold",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {q1Error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{
                        marginTop: 16,
                        padding: "12px 16px",
                        background: "rgba(255, 45, 58, 0.15)",
                        border: "1px solid var(--danger)",
                        borderRadius: 4,
                        color: "var(--danger)",
                        fontSize: 13.5,
                        letterSpacing: ".1em",
                        textAlign: "center",
                        fontFamily: "var(--font-term)",
                      }}
                    >
                      [ACCESS DENIED] INCORRECT PROJECT DESIGNATION
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  className="btn big"
                  onClick={handleQ1Submit}
                  disabled={isLoreActive || !q1Selected}
                  style={{
                    marginTop: 20,
                    width: "100%",
                    fontSize: 16.5,
                    padding: "14px 22px",
                    letterSpacing: ".15em",
                    borderRadius: 4,
                  }}
                >
                  VERIFY SECURITY CLEARANCE →
                </button>
              </div>
            </>
          )
        )}

        {/* CHAPTER 2: CODING */}
        {currentChapter.id === 2 && (
          ch2Solved ? (
            <ChapterCompletionView
              chapter={CHAPTERS[1]}
              onNextEpisode={() => {
                sfx("ok");
                setActiveChapterId(3);
              }}
              onViewDossier={() => setChapterModalOpen(true)}
            />
          ) : (
            <>
              <div className="panel-head" style={{ padding: "16px 26px", display: "flex", alignItems: "center" }}>
                <span className="dot" style={{ width: 9, height: 9, background: "#ff3b45" }} />
                <span style={{ fontSize: 16, letterSpacing: ".16em" }}>CHAPTER 2 : CODING CHALLENGE</span>

                <button
                  type="button"
                  className="btn sm ghost"
                  onClick={() => setReplayingNarration(true)}
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    padding: "5px 12px",
                    letterSpacing: ".1em",
                    borderRadius: 3,
                  }}
                  title="Replay chapter intro story"
                >
                  [LORE BRIEFING]
                </button>

                <span className="term dim" style={{ marginLeft: 16, fontSize: 14, color: "var(--accent)" }}>
                  +150 PTS
                </span>
              </div>

              <div className="panel-body" style={{ padding: "26px 32px", overflowY: "auto", flex: 1 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
                    gap: 28,
                    alignItems: "stretch",
                  }}
                >
                  {/* Left Column: Code Logic + Diagnostic Simulation */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                      className="eyebrow"
                      style={{ color: "#ff2d3a", fontSize: 12, letterSpacing: ".2em", marginBottom: 8, fontWeight: "bold" }}
                    >
                      SUBLEVEL 3 TELEMETRY ROUTINE
                    </div>

                    <div
                      style={{
                        background: "rgba(5, 5, 8, 0.95)",
                        border: "1px solid rgba(255, 45, 58, 0.35)",
                        borderRadius: 4,
                        padding: "18px 20px",
                        fontFamily: "var(--font-mono)",
                        fontSize: 15,
                        lineHeight: 1.65,
                        color: "#ffffff",
                        flex: 1,
                        overflowX: "auto",
                      }}
                    >
                      <div>
                        <span style={{ color: "#ff8a4c" }}>function</span>{" "}
                        <span style={{ color: "#ff3b45" }}>parseTelemetry</span>(signals) {"{"}
                      </div>
                      <div style={{ paddingLeft: 18 }}>
                        <span style={{ color: "#ff8a4c" }}>let</span> paritySum ={" "}
                        <span style={{ color: "#ffd24d" }}>0</span>;
                      </div>
                      <div style={{ paddingLeft: 18 }}>
                        <span style={{ color: "#ff8a4c" }}>for</span> (
                        <span style={{ color: "#ff8a4c" }}>let</span> i = 0; i &lt; signals.length; i++) {"{"}
                      </div>
                      <div style={{ paddingLeft: 34, color: "var(--dim)" }}>
                        {"# Even numbers multiplied by 2; odd numbers added directly"}
                      </div>
                      <div style={{ paddingLeft: 34 }}>
                        <span style={{ color: "#ff8a4c" }}>if</span> (signals[i] % 2 === 0) {"{"}
                      </div>
                      <div style={{ paddingLeft: 50 }}>
                        paritySum += signals[i] * <span style={{ color: "#ffd24d" }}>2</span>;
                      </div>
                      <div style={{ paddingLeft: 34 }}>
                        {"}"} <span style={{ color: "#ff8a4c" }}>else</span> {"{"}
                      </div>
                      <div style={{ paddingLeft: 50 }}>paritySum += signals[i];</div>
                      <div style={{ paddingLeft: 34 }}>{"}"}</div>
                      <div style={{ paddingLeft: 18 }}>{"}"}</div>
                      <div style={{ paddingLeft: 18 }}>
                        <span style={{ color: "#ff8a4c" }}>return</span> paritySum;
                      </div>
                      <div>{"}"}</div>
                      <div style={{ marginTop: 12, color: "#ffd24d" }}>
                        console.log(parseTelemetry([12, 5, 8, 3, 10]));
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Mission Objective & Answer Submission */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div
                        className="eyebrow"
                        style={{ color: "var(--accent)", fontSize: 12, letterSpacing: ".2em", marginBottom: 8, fontWeight: "bold" }}
                      >
                        ANALYSIS OBJECTIVE
                      </div>

                      <div
                        style={{
                          fontSize: 16,
                          lineHeight: 1.65,
                          color: "rgba(255, 255, 255, 0.9)",
                          fontFamily: "var(--font-mono)",
                          background: "rgba(0, 0, 0, 0.4)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          padding: "18px 20px",
                          borderRadius: 4,
                          marginBottom: 20,
                        }}
                      >
                        Inspect the accumulator loop routine. Trace the parity logic when given telemetry signals{" "}
                        <code style={{ color: "#ff2d3a", fontWeight: "bold" }}>[12, 5, 8, 3, 10]</code>. Enter the calculated output to restore the telemetry router.
                      </div>
                    </div>

                    {/* Answer Form */}
                    <form onSubmit={handleCodeSubmit} style={{ marginTop: "auto" }}>
                      <label
                        className="lbl"
                        style={{ fontSize: 13, letterSpacing: ".15em", marginBottom: 8, display: "block" }}
                        htmlFor="ch2-code-input"
                      >
                        ENTER EVALUATED NUMERIC OUTPUT:
                      </label>
                      <input
                        id="ch2-code-input"
                        className="field"
                        value={codeAnswer}
                        disabled={isLoreActive}
                        onChange={(e) => {
                          if (isLoreActive) return;
                          setCodeAnswer(e.target.value);
                          if (codeError) setCodeError(false);
                        }}
                        placeholder="e.g. 68"
                        autoComplete="off"
                        style={{
                          fontSize: 18,
                          padding: "13px 18px",
                          borderColor: codeError ? "var(--danger)" : undefined,
                          borderRadius: 4,
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      />

                      <AnimatePresence>
                        {codeError && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                              marginTop: 12,
                              padding: "10px 14px",
                              background: "rgba(255, 45, 58, 0.15)",
                              border: "1px solid var(--danger)",
                              borderRadius: 4,
                              color: "var(--danger)",
                              fontSize: 13,
                              textAlign: "center",
                              fontFamily: "var(--font-term)",
                            }}
                          >
                            [LOGIC ERROR] CALCULATION DOES NOT MATCH ROUTINE OUTPUT
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        type="submit"
                        className="btn big"
                        disabled={isLoreActive || !codeAnswer.trim()}
                        style={{
                          marginTop: 16,
                          width: "100%",
                          fontSize: 16.5,
                          padding: "14px 22px",
                          letterSpacing: ".15em",
                          borderRadius: 4,
                        }}
                      >
                        SUBMIT EVALUATED OUTPUT →
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )
        )}

        {/* CHAPTER 3: CASE STUDY */}
        {currentChapter.id === 3 && (
          ch3Solved ? (
            <ChapterCompletionView
              chapter={CHAPTERS[2]}
              isLastEpisode={true}
              onNextEpisode={() => {}}
              onViewDossier={() => setChapterModalOpen(true)}
            />
          ) : (
            <>
              <div className="panel-head" style={{ padding: "16px 26px", display: "flex", alignItems: "center" }}>
                <span className="dot" style={{ width: 9, height: 9, background: "#ff3b45" }} />
                <span style={{ fontSize: 16, letterSpacing: ".16em" }}>CHAPTER 3 : CASE STUDY DOSSIER</span>

                <button
                  type="button"
                  className="btn sm ghost"
                  onClick={() => setReplayingNarration(true)}
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                    padding: "5px 12px",
                    letterSpacing: ".1em",
                    borderRadius: 3,
                  }}
                  title="Replay chapter intro story"
                >
                  [LORE BRIEFING]
                </button>

                <span className="term dim" style={{ marginLeft: 16, fontSize: 14, color: "var(--accent)" }}>
                  +200 PTS
                </span>
              </div>

              <div className="panel-body" style={{ padding: "26px 32px", overflowY: "auto", flex: 1 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                    gap: 26,
                    alignItems: "start",
                  }}
                >
                  {/* Left Column: Recovered Dossier Logs */}
                  <div>
                    <div
                      className="eyebrow"
                      style={{ color: "#ff2d3a", fontSize: 12, letterSpacing: ".2em", marginBottom: 10, fontWeight: "bold" }}
                    >
                      FIELD TELEMETRY DOSSIER
                    </div>

                    {/* Dossier Tabs */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                      {EVIDENCE_LOGS.map((item, idx) => {
                        const isActive = activeEvidenceTab === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              sfx("click");
                              setActiveEvidenceTab(idx);
                            }}
                            style={{
                              padding: "8px 15px",
                              background: isActive
                                ? "rgba(255, 45, 58, 0.25)"
                                : "rgba(0, 0, 0, 0.5)",
                              border: isActive
                                ? "1px solid #ff2d3a"
                                : "1px solid rgba(255, 255, 255, 0.15)",
                              color: isActive ? "#ff2d3a" : "rgba(255, 255, 255, 0.7)",
                              fontSize: 12,
                              fontFamily: "var(--font-mono)",
                              letterSpacing: ".1em",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          >
                            [FILE 0{idx + 1}] {item.badge}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Dossier Content Card */}
                    <div
                      style={{
                        background: "rgba(0, 0, 0, 0.65)",
                        border: "1px solid rgba(255, 45, 58, 0.35)",
                        borderRadius: 4,
                        padding: "18px 20px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: "#ff2d3a", fontSize: 13.5, fontWeight: "bold" }}>
                          {EVIDENCE_LOGS[activeEvidenceTab].title}
                        </span>
                        <span className="term dim" style={{ fontSize: 12 }}>
                          TIME: {EVIDENCE_LOGS[activeEvidenceTab].time}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          color: "rgba(255,255,255,0.9)",
                          lineHeight: 1.65,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {EVIDENCE_LOGS[activeEvidenceTab].content}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Question & Deductions */}
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: "bold",
                        color: "#ff2d3a",
                        marginBottom: 14,
                        letterSpacing: ".06em",
                        lineHeight: 1.5,
                      }}
                    >
                      WHICH FACILITY SERVES AS THE CONFIRMED EPICENTER OF THE RIFT?
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {CASE_OPTIONS.map((opt) => {
                        const isSelected = caseSelected === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={isLoreActive}
                            onClick={() => {
                              if (isLoreActive) return;
                              sfx("click");
                              setCaseSelected(opt.id);
                            }}
                            style={{
                              padding: "13px 18px",
                              textAlign: "left",
                              background: isSelected
                                ? "rgba(255, 45, 58, 0.18)"
                                : "rgba(0, 0, 0, 0.6)",
                              border: isSelected
                                ? "1px solid #ff2d3a"
                                : "1px solid rgba(255,255,255,0.12)",
                              borderRadius: 4,
                              cursor: "pointer",
                              color: isSelected ? "#ff2d3a" : "rgba(255,255,255,0.85)",
                              fontSize: 14.5,
                              fontFamily: "var(--font-mono)",
                              letterSpacing: ".04em",
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <span
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 3,
                                border: isSelected
                                  ? "2px solid #ff2d3a"
                                  : "1px solid rgba(255,255,255,0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: "bold",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {opt.id}
                            </span>
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {caseError && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          style={{
                            marginTop: 12,
                            padding: "10px 14px",
                            background: "rgba(255, 45, 58, 0.15)",
                            border: "1px solid var(--danger)",
                            borderRadius: 4,
                            color: "var(--danger)",
                            fontSize: 13,
                            letterSpacing: ".1em",
                            textAlign: "center",
                            fontFamily: "var(--font-term)",
                          }}
                        >
                          [DEDUCTION REJECTED] INCONSISTENT WITH VECTOR TELEMETRY
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="button"
                      className="btn big"
                      onClick={handleCaseSubmit}
                      disabled={isLoreActive || !caseSelected}
                      style={{
                        marginTop: 16,
                        width: "100%",
                        fontSize: 16.5,
                        padding: "14px 22px",
                        letterSpacing: ".15em",
                        borderRadius: 4,
                      }}
                    >
                      SUBMIT CASE DEDUCTION →
                    </button>
                  </div>
                </div>
              </div>
            </>
          )
        )}

        {/* CHAPTER 4: TRANSMISSION & LAB (Strictly Locked) */}
        {currentChapter.id === 4 && (
          <>
            <div className="panel-head" style={{ padding: "16px 26px", display: "flex", alignItems: "center" }}>
              <span className="dot" style={{ width: 9, height: 9, background: "var(--danger)" }} />
              <span style={{ fontSize: 16, letterSpacing: ".16em", color: "var(--danger)" }}>
                CHAPTER 4 : TRANSMISSION &amp; LAB [RESTRICTED]
              </span>

              <button
                type="button"
                className="btn sm ghost"
                onClick={() => setReplayingNarration(true)}
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  padding: "5px 12px",
                  letterSpacing: ".1em",
                  borderColor: "rgba(255,45,58,0.3)",
                  color: "var(--danger)",
                  borderRadius: 3,
                }}
                title="Replay chapter intro story"
              >
                [LORE BRIEFING]
              </button>

              <span className="term dim" style={{ marginLeft: 16, fontSize: 14, color: "var(--danger)" }}>
                +300 PTS
              </span>
            </div>

            <div
              className="panel-body"
              style={{
                padding: "44px 34px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
              }}
            >
              <div
                style={{
                  padding: "10px 22px",
                  borderRadius: 4,
                  background: "rgba(255, 45, 58, 0.16)",
                  border: "1px solid var(--danger)",
                  color: "var(--danger)",
                  fontSize: 15,
                  letterSpacing: ".25em",
                  fontWeight: "bold",
                  marginBottom: 20,
                  display: "inline-block",
                }}
              >
                [RESTRICTED ACCESS · LEVEL 5]
              </div>

              <h3
                className="title-xl"
                style={{
                  fontSize: "clamp(28px, 4.2vw, 40px)",
                  color: "#ff2d3a",
                  marginBottom: 16,
                }}
              >
                SECTOR LOCKED BY HAWKINS PROTOCOL
              </h3>

              <div
                style={{
                  maxWidth: 680,
                  fontSize: 16.5,
                  color: "rgba(255, 255, 255, 0.8)",
                  lineHeight: 1.65,
                  fontFamily: "var(--font-mono)",
                  padding: "20px 26px",
                  background: "rgba(0, 0, 0, 0.6)",
                  borderRadius: 4,
                  border: "1px dashed rgba(255, 45, 58, 0.35)",
                }}
              >
                Sublevel 4 blast doors remain sealed shut. Transmission arrays and gateway mainframe
                hardware are offline. This sector will become accessible in the next phase of the tournament.
              </div>

              <div
                className="term dim"
                style={{
                  marginTop: 26,
                  fontSize: 14,
                  letterSpacing: ".15em",
                  color: "rgba(255, 255, 255, 0.4)",
                }}
              >
                STATUS: RESTRICTED ACCESS · SYSTEM SEALED
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
