"use client";
import Particles from "../Particles";

export default function GateScene({ open = false }: { open?: boolean }) {
  return (
    <div className="layer" style={{ background: "radial-gradient(ellipse at 50% 55%, #3a0a10 0%, #14070a 40%, #030203 100%)" }}>
      <div className="fog" style={{ top: "40%", opacity: 0.6 }} />
      <Particles mode="embers" count={70} color="255,90,70" />
      <div className="layer" style={{ background: open ? "radial-gradient(circle at 50% 50%, rgba(255,40,50,.35), transparent 60%)" : "radial-gradient(circle at 50% 50%, rgba(255,40,50,.12), transparent 55%)", transition: "background 1.4s" }} />
      <div className="layer scene-vig" />
    </div>
  );
}
