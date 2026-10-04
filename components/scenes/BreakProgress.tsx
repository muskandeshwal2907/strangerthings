"use client";
import { useGame } from "@/lib/store";

const NODES = [["x1", "DECODE"], ["x2", "WEAKNESS"], ["x3", "RESTORE"], ["x4", "BREAK"], ["x5", "CLOSE"]];

export default function BreakProgress() {
  const { s } = useGame();
  const n = NODES.filter(([id]) => s.solved[id]).length;
  return (
    <div className="panel" style={{ padding: "14px 18px" }}>
      <div className="eyebrow" style={{ fontSize: 16, marginBottom: 12 }}>CONNECTION · {Math.round((n / 5) * 100)}%</div>
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between" }}>
        <div className="bar" style={{ position: "absolute", left: 18, right: 18, top: 14, height: 3 }}><i style={{ width: `${(n / 5) * 100}%`, transition: "width 1s" }} /></div>
        {NODES.map(([id, l]) => (
          <div key={id} style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div className={`node ${s.solved[id] ? "on" : ""}`} />
            <small style={{ fontFamily: "var(--font-term)", fontSize: 15, letterSpacing: ".12em", color: s.solved[id] ? "var(--accent2)" : "var(--dim)" }}>{l}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
