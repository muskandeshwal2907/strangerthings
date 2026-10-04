"use client";
import React, { useEffect, useMemo, useRef } from "react";
import Particles from "../Particles";
import { useGame } from "@/lib/store";

const MARKS = [
  { n: 1, x: 6, y: 74, d: "4" },
  { n: 2, x: 50, y: 20, d: "1" },
  { n: 3, x: 92, y: 62, d: "7" },
];

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function Pines({ seed, count, fill, hMin, hMax }: { seed: number; count: number; fill: string; hMin: number; hMax: number }) {
  const trees = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => {
      const x = (i / count) * 1700 - 40 + r() * 60;
      const h = hMin + r() * (hMax - hMin);
      const w = h * (0.28 + r() * 0.08);
      return { x, h, w };
    });
  }, [seed, count, hMin, hMax]);
  return (
    <svg viewBox="0 0 1600 700" preserveAspectRatio="none" style={{ width: "112%", height: "100%", position: "absolute", left: "-6%", bottom: 0 }}>
      {trees.map((t, i) => (
        <g key={i} fill={fill}>
          <rect x={t.x - 4} y={700 - t.h * 0.15} width={8} height={t.h * 0.15} />
          {[0, 1, 2, 3].map((k) => {
            const top = 700 - t.h + k * (t.h * 0.2);
            const ww = t.w * (0.45 + k * 0.2);
            return <polygon key={k} points={`${t.x},${top} ${t.x - ww},${top + t.h * 0.34} ${t.x + ww},${top + t.h * 0.34}`} />;
          })}
        </g>
      ))}
    </svg>
  );
}

export default function ForestScene() {
  const { s, findMark } = useGame();
  const root = useRef<HTMLDivElement>(null);
  const markRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const found = s.marks;

  useEffect(() => {
    const el = root.current!;
    const layers = Array.from(el.querySelectorAll<HTMLElement>("[data-p]"));
    const update = (x: number, y: number) => {
      el.style.setProperty("--mx", x + "px");
      el.style.setProperty("--my", y + "px");
      const W = window.innerWidth;
      layers.forEach((l) => (l.style.transform = `translate3d(${-(x / W - 0.5) * parseFloat(l.dataset.p!)}px,0,0)`));
      markRefs.current.forEach((b, i) => {
        if (!b) return;
        const r = b.getBoundingClientRect();
        const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
        const v = Math.max(0, 1 - d / 200);
        b.style.opacity = String(found.includes(MARKS[i].n) ? 1 : Math.max(0.1, v));
      });
    };
    const mv = (e: PointerEvent) => update(e.clientX, e.clientY);
    update(window.innerWidth * 0.5, window.innerHeight * 0.55);
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerdown", mv);
    return () => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerdown", mv);
    };
  }, [found]);

  return (
    <div ref={root} className="layer" style={{ background: "linear-gradient(180deg,#06161b 0%,#12363a 55%,#1c4a40 100%)" }}>
      <div className="layer" data-p="8"><Pines seed={3} count={34} fill="#164642" hMin={300} hMax={520} /></div>
      <div className="fog" style={{ top: "30%" }} />
      <div className="layer" data-p="18"><Pines seed={11} count={22} fill="#0c2c2a" hMin={380} hMax={640} /></div>
      <Particles mode="fireflies" count={34} color="200,255,170" />
      <div className="fog f2" style={{ top: "52%" }} />
      <div className="layer" data-p="34"><Pines seed={29} count={12} fill="#041514" hMin={520} hMax={700} /></div>
      {/* flashlight */}
      <div className="layer" style={{ zIndex: 3, background: "radial-gradient(circle 240px at var(--mx,50%) var(--my,55%), rgba(0,0,0,0) 0, rgba(0,0,0,.2) 55%, rgba(0,0,0,.86) 100%)" }} />
      <div className="layer" style={{ zIndex: 3, mixBlendMode: "screen", background: "radial-gradient(circle 280px at var(--mx,50%) var(--my,55%), rgba(255,214,140,.16), transparent 70%)" }} />
      {/* hidden marks (above UI, only visible in the light) */}
      <div style={{ position: "fixed", inset: 0, zIndex: 700, pointerEvents: "none" }}>
        {MARKS.map((m, i) => {
          const done = found.includes(m.n);
          return (
            <button
              key={m.n}
              ref={(el) => { markRefs.current[i] = el; }}
              onClick={() => findMark(m.n)}
              aria-label={`Hidden mark ${m.n}`}
              disabled={done}
              className={`mark ${done ? "found" : ""}`}
              style={{ left: `${m.x}%`, top: `${m.y}%`, opacity: done ? 1 : 0.1 }}
            >
              <span>{done ? m.d : "◈"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
