"use client";
import React, { useState, useEffect } from "react";
import { useGame } from "@/lib/store";
import VecnaCutscene from "./VecnaCutscene";
import ChapterManager, { ChapterId } from "./chapters/ChapterManager";
import InvestigationBoard from "./InvestigationBoard";
import EventStandby from "./EventStandby";

export default function StageView() {
  const { vecnaCutscene, dismissVecnaCutscene, setActiveChapterId, viewMode, setViewMode } = useGame();
  const [eventStatus, setEventStatus] = useState<string>("active");

  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/admin/event/state?_t=${Date.now()}`);
        const data = await res.json();
        if (active && data.success && data.eventState) {
          setEventStatus(data.eventState.status || "active");
        }
      } catch {}
    };
    fetchStatus();
    return () => {
      active = false;
    };
  }, []);

  const handleSelectChapter = (chapterId: number) => {
    if (chapterId >= 1 && chapterId <= 7) {
      setActiveChapterId(chapterId as ChapterId);
    }
    setViewMode("location");
  };

  if (eventStatus === "not_started") {
    return <EventStandby onEventStarted={() => setEventStatus("active")} />;
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Vecna Arrival Cutscene Takeover */}
      {vecnaCutscene && <VecnaCutscene onDismiss={dismissVecnaCutscene} />}

      {/* Main Game Mode: Investigation Board (Default) or Active Chapter Console */}
      {viewMode === "board" ? (
        <InvestigationBoard onSelectChapter={handleSelectChapter} />
      ) : (
        <ChapterManager onBackToBoard={() => setViewMode("board")} />
      )}
    </div>
  );
}
