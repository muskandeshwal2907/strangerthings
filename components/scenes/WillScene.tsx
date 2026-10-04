"use client";
import Particles from "../Particles";
import Scope from "./Scope";

export default function WillScene() {
  return (
    <div className="layer" style={{ background: "radial-gradient(ellipse at 22% 78%, #2a1a0a 0%, #0b0a0c 55%, #020204 100%)" }}>
      <div className="lamp" />
      <div className="layer" style={{ opacity: 0.8, top: "18%", height: "46%" }}>
        <Scope color="255,180,84" amp={0.28} y={0.5} noise={0.5} />
      </div>
      <Particles mode="dust" count={50} color="255,200,140" />
      <div className="layer scene-vig" />
    </div>
  );
}
