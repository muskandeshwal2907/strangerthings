"use client";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { STAGES, STAGE_ORDER } from "@/lib/stages";
import { STORY_TASKS, LocationId, StoryTask } from "@/lib/tasks";
import { sfx } from "@/lib/audio";
import Typewriter from "./Typewriter";
import TaskEngine from "./tasks/TaskEngine";
import Radiometer from "./Radiometer";
import HawkinsMap from "./HawkinsMap";
import VecnaCutscene from "./VecnaCutscene";

// Scene background visualizers
import HawkinsScene from "./scenes/HawkinsScene";
import PoliceScene from "./scenes/PoliceScene";
import ByersScene from "./scenes/ByersScene";
import LabScene from "./scenes/LabScene";
import WillScene from "./scenes/WillScene";
import ForestScene from "./scenes/ForestScene";
import GateScene from "./scenes/GateScene";
import UpsideScene from "./scenes/UpsideScene";
import GatePortal from "./scenes/GatePortal";
import EvidenceBoard from "./scenes/EvidenceBoard";
import BreakProgress from "./scenes/BreakProgress";

function LocationBackground({ loc }: { loc: LocationId }) {
  switch (loc) {
    case "town":
      return <HawkinsScene />;
    case "policeStation":
      return <PoliceScene />;
    case "byersHouse":
      return <ByersScene />;
    case "radioTower":
      return <HawkinsScene />;
    case "lab":
      return <LabScene />;
    case "forest":
      return <ForestScene />;
    case "gate":
      return <GateScene open={false} />;
    case "upsidedown":
      return <UpsideScene />;
    case "mind":
      return <UpsideScene variant="mind" />;
    default:
      return <HawkinsScene />;
  }
}

export default function StageView() {
  const { s, advance, travelTo, setViewMode, vecnaCutscene, dismissVecnaCutscene } = useGame();
  const currentLoc = s.location || "town";
  const viewMode = s.viewMode || "location";

  // Filter tasks belonging to current location
  const locationTasks: StoryTask[] = Object.values(STORY_TASKS).filter(
    (t) => t.location === currentLoc
  );

  // Fallback to stage challenges if location has none
  const currentStage = STAGES[s.stage] || STAGES.hawkins;

  return (
    <div className="screen" style={{ overflowX: "hidden", minHeight: "100vh" }}>
      {/* Vecna Arrival Cutscene Takeover */}
      {vecnaCutscene && <VecnaCutscene onDismiss={dismissVecnaCutscene} />}

      {/* Layer: Atmospheric Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLoc}
          className="layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <LocationBackground loc={currentLoc} />
        </motion.div>
      </AnimatePresence>

      <div className="content stage-wrap" style={{ position: "relative", zIndex: 10, padding: "70px 20px 100px" }}>
        {/* VIEW A: HAWKINS MAP VIEW */}
        {viewMode === "map" && (
          <motion.div
            key="map-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <HawkinsMap
              currentLoc={currentLoc}
              onSelectLocation={(loc) => {
                travelTo(loc);
              }}
            />
          </motion.div>
        )}

        {/* VIEW B: IN-LOCATION GAME SCENE VIEW */}
        {viewMode === "location" && (
          <motion.div
            key={`loc-${currentLoc}`}
            className="stage-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {/* Story & Location Briefing Panel */}
            <div className="panel" style={{ height: "fit-content" }}>
              <div className="panel-head">
                <span className="dot" />
                <span>
                  HAWKINS ARCHIVE · SECTOR {currentLoc.toUpperCase()}
                </span>
                <button
                  type="button"
                  className="btn sm ghost"
                  style={{ marginLeft: "auto", fontSize: 12, padding: "2px 8px" }}
                  onClick={() => setViewMode("map")}
                >
                  🗺 MAP VIEW
                </button>
              </div>

              <div className="panel-body">
                <div className="eyebrow" style={{ color: "var(--accent)", fontSize: 13, marginBottom: 4 }}>
                  {currentStage.chapter}
                </div>
                <h2 className="title-xl" style={{ fontSize: "clamp(26px, 3.5vw, 42px)", marginBottom: 8 }}>
                  {currentLoc === "town"
                    ? "HAWKINS TOWN SQUARE"
                    : currentLoc === "policeStation"
                    ? "POLICE DEPARTMENT"
                    : currentLoc === "byersHouse"
                    ? "BYERS RESIDENCE"
                    : currentLoc === "radioTower"
                    ? "EAST HILL RADIO TOWER"
                    : currentLoc === "lab"
                    ? "HAWKINS NATIONAL LAB"
                    : currentLoc === "forest"
                    ? "THE DEEP FOREST"
                    : currentLoc === "gate"
                    ? "THE GATE RIFT"
                    : "THE UPSIDE DOWN"}
                </h2>

                <Typewriter
                  lines={
                    currentLoc === "town"
                      ? [
                          "The town sleeps under a low autumn mist.",
                          "Public utility transmitters are broadcasting anomalous pulses.",
                          "Decode the carrier frequency to triangulate the source.",
                        ]
                      : currentLoc === "policeStation"
                      ? [
                          "Chief's office. Desk lamp burns in the empty station.",
                          "Incident reports, eyewitness testimonies, and redacted state files.",
                          "Piece together the timeline of disappearances.",
                        ]
                      : currentLoc === "byersHouse"
                      ? [
                          "Living room wall of colored Christmas bulbs and painted letters.",
                          "Something in the electric current is attempting communication.",
                          "Restore Will's scrambled messages.",
                        ]
                      : currentLoc === "radioTower"
                      ? [
                          "The high-altitude repeater tower hums in the cold night wind.",
                          "Its 5-pin Radiometer is scrambled by dimensional interference.",
                          "Restore all 5 pins to generate the Hawkins Lab security passcode.",
                        ]
                      : currentLoc === "lab"
                      ? [
                          "Department of Energy restricted facility. Sublevel 4.",
                          "Security camera grids flicker with static. Mainframe is locked down.",
                          "Restore Power, Security, Comms, and Gate systems.",
                        ]
                      : currentLoc === "forest"
                      ? [
                          "Trail 7 terminates into pitch black pine woods.",
                          "Your flashlight beam cuts through drifting electromagnetic fog.",
                          "Find the carved tree runes.",
                        ]
                      : currentLoc === "gate"
                      ? [
                          "A tear in the fabric of space pulses with incandescent red rift energy.",
                          "Three key sockets await fragments Alpha, Beta, and Gamma.",
                          "Once opened, the path into the Upside Down is irreversible.",
                        ]
                      : [
                          "Reflected reality of Hawkins. Ash falls like winter snow.",
                          "Glowing veins writhe across buildings. Vecna's presence is total.",
                          "Break his mental hold and close the dimensional rupture.",
                        ]
                  }
                  className="term"
                />

                {/* Evidence Board for Origin / Upside Down */}
                {currentLoc === "upsidedown" && <EvidenceBoard />}
                {currentLoc === "mind" && <BreakProgress />}

                {/* Gate portal interactive sockets */}
                {currentLoc === "gate" && (
                  <div style={{ marginTop: 20, textAlign: "center" }}>
                    <GatePortal />
                    <div className="term" style={{ marginTop: 12 }}>
                      {s.gateKeys.length < 3
                        ? `Click glowing sockets to insert Key Fragments (${s.gateKeys.length}/3)`
                        : "THE GATE RIFT IS FULLY STABILIZED."}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Task Area */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* If at Radio Tower: show Tasks + the 5-Pin Radiometer! */}
              {currentLoc === "radioTower" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div className="rm-stage-section">
                    <Radiometer />
                  </div>
                </div>
              )}

              {/* Render Location Tasks via TaskEngine */}
              {locationTasks.map((t) => (
                <TaskEngine
                  key={t.id}
                  task={t}
                  onNavigateLocation={(nextLoc) => {
                    travelTo(nextLoc);
                  }}
                />
              ))}

              {/* Advance CTA when ready */}
              <AnimatePresence>
                {currentLoc === "gate" && s.gateKeys.length >= 3 && (
                  <motion.button
                    className="btn red big pulse-cta"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => {
                      sfx("gate");
                      travelTo("upsidedown");
                    }}
                  >
                    ENTER THE UPSIDE DOWN →
                  </motion.button>
                )}

                {currentLoc === "mind" && s.completedTasks.includes("mind-final") && (
                  <motion.button
                    className="btn big pulse-cta"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => {
                      sfx("boom");
                      advance();
                    }}
                  >
                    CLOSE THE GATE &amp; RESTORE HAWKINS →
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
