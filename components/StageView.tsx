"use client";
import React from "react";
import { useGame } from "@/lib/store";
import VecnaCutscene from "./VecnaCutscene";
import ChapterManager from "./chapters/ChapterManager";

export default function StageView() {
  const { vecnaCutscene, dismissVecnaCutscene } = useGame();

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Vecna Arrival Cutscene Takeover */}
      {vecnaCutscene && <VecnaCutscene onDismiss={dismissVecnaCutscene} />}

      {/* Main Minimal Chapter Gameplay View */}
      <ChapterManager />
    </div>
  );
}
