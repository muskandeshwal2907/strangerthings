"use client";
import { motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { ITEMS } from "@/lib/stages";

const KEYS = ["key-alpha", "key-beta", "key-gamma"];

export default function GatePortal() {
  const { s, insertKey } = useGame();
  const open = s.gateKeys.length >= 3;
  const R = 158;
  return (
    <div className="portal" style={{ width: "min(460px, 86vw)", aspectRatio: "1", position: "relative", margin: "0 auto" }}>
      <svg viewBox="0 0 460 460" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
        <defs>
          <radialGradient id="rift" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fff" stopOpacity=".95" />
            <stop offset=".25" stopColor="#ff5a4a" stopOpacity=".9" />
            <stop offset=".7" stopColor="#7a0612" stopOpacity=".7" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className={open ? "spin-fast" : "spin-slow"} style={{ transformOrigin: "230px 230px" }}>
          <circle cx="230" cy="230" r="206" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="3 10" opacity=".7" />
          <circle cx="230" cy="230" r="190" fill="none" stroke="var(--accent)" strokeWidth="1" opacity=".5" />
        </g>
        <g className="spin-rev" style={{ transformOrigin: "230px 230px" }}>
          <circle cx="230" cy="230" r="124" fill="none" stroke="var(--accent2)" strokeWidth="2" strokeDasharray="30 12 4 12" opacity=".7" />
        </g>
        <motion.ellipse
          cx="230" cy="230" rx={open ? 80 : 26} ry={open ? 150 : 100} fill="url(#rift)"
          animate={{ rx: open ? [80, 92, 80] : [24, 30, 24], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: open ? 1.2 : 2.6, repeat: Infinity }}
          style={{ filter: "blur(2px)" }}
        />
        <path d="M230 90 L222 150 L240 190 L220 240 L242 290 L226 340 L232 380" stroke="#fff" strokeWidth="2" fill="none" opacity={open ? 1 : 0.5} className="flick" />
      </svg>
      {KEYS.map((k, i) => {
        const a = (-90 + i * 120) * (Math.PI / 180);
        const x = 230 + R * Math.cos(a), y = 230 + R * Math.sin(a);
        const inserted = s.gateKeys.includes(k);
        const have = s.inventory.includes(k);
        return (
          <button
            key={k}
            disabled={inserted || !have}
            onClick={() => insertKey(k)}
            className={`socket ${inserted ? "on" : have ? "ready" : ""}`}
            style={{ left: `${(x / 460) * 100}%`, top: `${(y / 460) * 100}%` }}
            title={ITEMS[k].name}
          >
            <span>{have || inserted ? ITEMS[k].glyph : "?"}</span>
          </button>
        );
      })}
    </div>
  );
}
