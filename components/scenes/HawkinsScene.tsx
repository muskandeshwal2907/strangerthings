"use client";
import Particles from "../Particles";
import Skyline from "./Skyline";

const BULBS = Array.from({ length: 30 }, (_, i) => i);
const COLORS = ["#ff4d4d", "#ffd24d", "#4dd2ff", "#5dff8a", "#ff8a3d", "#ff70a6"];

export default function HawkinsScene() {
  return (
    <div className="layer" style={{ background: "linear-gradient(180deg,#050a16 0%,#0d2238 38%,#1d4560 70%,#32646c 100%)" }}>
      <Particles mode="dust" count={90} color="190,220,255" />
      {/* moon with halo */}
      <div style={{ position: "absolute", right: "18%", top: "10%" }}>
        <div style={{ width: 90, height: 90, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%,#f4f9ff,#b8c9dd 60%,#8aa0b8)", boxShadow: "0 0 60px 20px rgba(190,220,255,.25)", opacity: 0.9 }} />
        <div style={{ position: "absolute", inset: -20, borderRadius: "50%", background: "radial-gradient(circle, rgba(190,220,255,.18), transparent 60%)", filter: "blur(8px)" }} />
      </div>
      {/* string lights */}
      <svg viewBox="0 0 1600 160" preserveAspectRatio="none" style={{ position: "absolute", left: 0, right: 0, top: 0, width: "100%", height: 130, opacity: 0.98 }}>
        <path d="M-10 20 Q 200 120 400 30 T 800 30 T 1200 30 T 1610 24" stroke="#1a1a1a" strokeWidth="2.5" fill="none" />
        {BULBS.map((i) => {
          const x = (i / (BULBS.length - 1)) * 1600;
          const sag = Math.sin((i / (BULBS.length - 1)) * Math.PI * 4);
          const y = 30 + Math.abs(sag) * 52 - 10;
          const c = COLORS[i % COLORS.length];
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={9} fill={c} opacity={0.15} />
              <circle className="bulb" cx={x} cy={y} r={6} fill={c} style={{ animationDelay: `${(i * 0.37) % 4}s`, color: c }} />
              <circle cx={x} cy={y} r={12} fill={c} opacity={0.08} style={{ filter: "blur(3px)" }} />
            </g>
          );
        })}
      </svg>
      {/* signal rings from radio tower */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "46%" }}>
        <div className="layer" style={{ opacity: 0.55, transform: "translateY(-6%) scale(1.08)" }}>
          <Skyline fill="#0d2230" win="#e0b86a" seed={21} lit={0.2} tower={false} />
        </div>
        <Skyline fill="#040a10" win="#ffc766" seed={7} lit={0.5} />
      </div>
      <div className="layer" style={{ background: "radial-gradient(circle at 78% 18%, rgba(190,220,255,0.18) 0, transparent 22%)" }} />
      <div className="layer scene-vig" />
    </div>
  );
}
