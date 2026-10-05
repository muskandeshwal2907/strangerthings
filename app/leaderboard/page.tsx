"use client";
import Link from "next/link";
import Leaderboard from "@/components/Leaderboard";
import Glitch from "@/components/Glitch";
import CinematicBackground from "@/components/CinematicBackground";

export default function Page() {
  return (
    <div className="screen" style={{ position: "relative" }}>
      <CinematicBackground src="random" particles="spores" vignette="heavy" overlayOpacity={0.6} />
      <div className="content" style={{ maxWidth: 900, margin: "0 auto", padding: "60px 20px 80px", position: "relative", zIndex: 10 }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div className="eyebrow">The Hawkins Protocol</div>
          <h1 className="title-xl" style={{ fontSize: "clamp(40px,8vw,90px)" }}><Glitch text="LEADERBOARD" /></h1>
        </div>
        <Leaderboard />
        <div style={{ textAlign: "center", marginTop: 30 }}><Link href="/"><button className="btn ghost">← Back to game</button></Link></div>
      </div>
    </div>
  );
}
