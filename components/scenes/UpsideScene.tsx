"use client";
import Particles from "../Particles";
import Skyline from "./Skyline";
import Lightning from "./Lightning";
import Scope from "./Scope";

function Vines({ side }: { side: "l" | "r" }) {
  const paths = [
    "M0 0 C 60 120, -20 220, 70 340 S 10 560, 90 700 S 20 880, 60 1000",
    "M20 0 C 110 150, 30 260, 120 400 S 60 620, 130 760 S 70 920, 100 1000",
    "M0 120 C 90 200, 30 330, 110 450 S 40 640, 100 780",
  ];
  return (
    <svg viewBox="0 0 160 1000" preserveAspectRatio="none" style={{ position: "absolute", top: 0, bottom: 0, [side === "l" ? "left" : "right"]: 0, width: "12vw", minWidth: 90, height: "100%", transform: side === "r" ? "scaleX(-1)" : undefined, opacity: 0.9 }}>
      {paths.map((d, i) => (
        <g key={i} className="sway" style={{ animationDelay: `${i * 1.3}s` }}>
          <path d={d} stroke="#4d0b14" strokeWidth={22 - i * 5} fill="none" strokeLinecap="round" />
          <path d={d} className="vein" stroke="#ff2d3a" strokeWidth={2} fill="none" strokeDasharray="14 160" style={{ animationDelay: `${i * 0.8}s` }} />
        </g>
      ))}
    </svg>
  );
}

export default function UpsideScene({ variant = "default", progress = 0 }: { variant?: "default" | "origin" | "mind" | "final"; progress?: number }) {
  return (
    <div className="layer" style={{ background: "radial-gradient(ellipse at 50% 20%, #3b0810 0%, #1a0408 45%, #060102 100%)" }}>
      <div className="cloud" style={{ left: "-10%", top: "-20%" }} />
      <div className="cloud c2" style={{ right: "-15%", top: "5%" }} />
      <div className="layer" style={{ top: 0, height: "46%", opacity: 0.55 }}>
        <Skyline flip fill="#0b0204" win="#3a0a10" seed={13} lit={0.15} tower={false} />
      </div>
      <Particles mode="spores" count={130} color="255,90,80" />
      <Particles mode="dust" count={50} color="200,160,150" />
      <Vines side="l" />
      <Vines side="r" />
      <Lightning />
      {variant === "mind" && (
        <>
          <div className="heartbeat" />
          <svg viewBox="0 0 600 600" style={{ position: "absolute", left: "50%", top: "50%", width: "min(80vh,90vw)", transform: "translate(-50%,-50%)", opacity: 0.2 }}>
            <circle cx="300" cy="300" r="280" fill="none" stroke="#ff2d3a" strokeWidth="3" />
            <circle cx="300" cy="300" r="262" fill="none" stroke="#ff2d3a" strokeWidth="1" strokeDasharray="4 8" />
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i} x1="300" y1="30" x2="300" y2={i % 3 === 0 ? 70 : 52} stroke="#ff2d3a" strokeWidth={i % 3 === 0 ? 5 : 2} transform={`rotate(${i * 30} 300 300)`} />
            ))}
            <g className="hand-h"><line x1="300" y1="300" x2="300" y2="170" stroke="#ff6a5a" strokeWidth="8" strokeLinecap="round" /></g>
            <g className="hand-m"><line x1="300" y1="300" x2="300" y2="90" stroke="#ff6a5a" strokeWidth="5" strokeLinecap="round" /></g>
            <g className="hand-s"><line x1="300" y1="330" x2="300" y2="60" stroke="#fff" strokeWidth="2" /></g>
            <circle cx="300" cy="300" r="10" fill="#ff2d3a" />
          </svg>
        </>
      )}
      {variant === "final" && (
        <div className="layer" style={{ top: "12%", height: "44%", opacity: 0.35 + progress * 0.6 }}>
          <Scope color="54,224,196" amp={0.12 + progress * 0.28} y={0.5} noise={0.7 - progress * 0.55} />
        </div>
      )}
      <div className="layer scene-vig" />
    </div>
  );
}
