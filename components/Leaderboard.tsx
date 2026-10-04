"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MOCK, Result, loadResults, mmss } from "@/lib/results";

export default function Leaderboard({ highlight }: { highlight?: string }) {
  const [rows, setRows] = useState<Result[]>(MOCK);
  useEffect(() => {
    setRows([...MOCK, ...loadResults()].sort((a, b) => b.score - a.score || a.time - b.time));
  }, []);
  const top = rows.slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean);
  const heights: Record<number, number> = { 0: 150, 1: 190, 2: 120 };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 14, marginBottom: 26 }}>
        {order.map((r, i) => {
          const rank = rows.indexOf(r) + 1;
          return (
            <motion.div key={r.team + r.score} initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.25, type: "spring" }}
              className="panel" style={{ width: "min(180px,30vw)", height: heights[i], padding: 12, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "flex-end", borderColor: rank === 1 ? "var(--accent)" : undefined, boxShadow: rank === 1 ? "var(--glow)" : undefined }}>
              <div className="title-xl" style={{ fontSize: 44 }}>{rank}</div>
              <div className="term" style={{ fontSize: 18, wordBreak: "break-word" }}>{r.team}</div>
              <div className="term accent">{r.score}</div>
            </motion.div>
          );
        })}
      </div>
      <div className="panel">
        <div className="panel-head"><span className="dot" /> Final rankings</div>
        <div className="panel-body" style={{ padding: 0 }}>
          {rows.map((r, i) => (
            <motion.div key={r.team + r.score + i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.07 }}
              style={{ display: "grid", gridTemplateColumns: "50px 1fr 90px 90px", padding: "10px 16px", borderBottom: "1px solid var(--line)", fontFamily: "var(--font-term)", fontSize: 21, letterSpacing: ".08em", background: highlight && r.team === highlight ? "color-mix(in srgb, var(--accent) 14%, transparent)" : undefined, color: highlight && r.team === highlight ? "var(--accent)" : undefined }}>
              <span className="dim">{String(i + 1).padStart(2, "0")}</span>
              <span>{r.team}{!r.mock && " ★"}</span>
              <span className="dim">{mmss(r.time)}</span>
              <span style={{ textAlign: "right" }}>{r.score}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
