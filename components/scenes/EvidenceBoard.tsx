"use client";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";

const CARDS = [
  { id: "a", x: 6, y: 12, label: "SUBJECT", big: "001", need: "o1", rot: -4 },
  { id: "b", x: 56, y: 6, label: "REAL NAME", big: "HENRY CREEL", need: "o1", rot: 3 },
  { id: "c", x: 12, y: 58, label: "ALIAS", big: "VECNA", need: "o2", rot: 2 },
  { id: "d", x: 58, y: 56, label: "THE LINK", big: "LAB ↔ UPSIDE DOWN", need: "o3", rot: -3 },
];
const LINKS: [string, string][] = [["a", "b"], ["a", "c"], ["b", "d"], ["c", "d"]];

export default function EvidenceBoard() {
  const { s } = useGame();
  const by = Object.fromEntries(CARDS.map((c) => [c.id, c]));
  const shown = (id: string) => !!s.solved[by[id].need];
  return (
    <div className="board panel" style={{ position: "relative", height: 360 }}>
      <div className="panel-head"><span className="dot" /> Evidence board</div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 38, width: "calc(100% - 76px)", height: "calc(100% - 76px)" }}>
        {LINKS.map(([a, b], i) => {
          const A = by[a], B = by[b];
          const on = shown(a) && shown(b);
          return (
            <motion.line key={i} x1={A.x + 18} y1={A.y + 14} x2={B.x + 18} y2={B.y + 14}
              stroke="#ff2d3a" strokeWidth="0.7" vectorEffect="non-scaling-stroke" style={{ filter: "drop-shadow(0 0 4px #ff2d3a)" }}
              initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: 1.2 }} />
          );
        })}
      </svg>
      {CARDS.map((c) => {
        const on = shown(c.id);
        return (
          <motion.div key={c.id} className="evi" style={{ left: `${c.x}%`, top: `${c.y + 6}%` }}
            animate={{ rotate: c.rot, scale: on ? 1 : 0.94, opacity: on ? 1 : 0.55 }} transition={{ type: "spring", stiffness: 120 }}>
            <small>{c.label}</small>
            <b>{on ? c.big : "████████"}</b>
          </motion.div>
        );
      })}
    </div>
  );
}
