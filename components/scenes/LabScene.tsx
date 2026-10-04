"use client";
import DataRain from "./DataRain";

export default function LabScene() {
  return (
    <div className="layer" style={{ background: "radial-gradient(ellipse at 50% 30%, #0d2a2e 0%, #061215 55%, #02070a 100%)" }}>
      <div className="layer" style={{ opacity: 0.55, maskImage: "linear-gradient(90deg,#000 0,transparent 28%,transparent 72%,#000 100%)", WebkitMaskImage: "linear-gradient(90deg,#000 0,transparent 28%,transparent 72%,#000 100%)" }}>
        <DataRain color="54,224,196" size={15} opacity={0.55} />
      </div>
      <div className="lab-floor" />
      {/* radar */}
      <div className="radar">
        <div className="sweep" />
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          {[95, 70, 45, 20].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="rgba(54,224,196,.35)" />)}
          <line x1="5" y1="100" x2="195" y2="100" stroke="rgba(54,224,196,.25)" />
          <line x1="100" y1="5" x2="100" y2="195" stroke="rgba(54,224,196,.25)" />
          <circle className="blip" cx="130" cy="62" r="3" fill="#ffb454" />
          <circle className="blip" style={{ animationDelay: "1.4s" }} cx="68" cy="124" r="3" fill="#ff3b45" />
        </svg>
      </div>
      <div className="hazard" />
      <div className="layer scene-vig" />
    </div>
  );
}
