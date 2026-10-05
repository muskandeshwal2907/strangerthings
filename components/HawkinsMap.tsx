"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LocationId } from "@/lib/tasks";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/audio";

interface MapLocation {
  id: LocationId;
  name: string;
  category: string;
  coords: { x: number; y: number }; // Percentage 0-100
  desc: string;
  unlockCondition: string;
}

const MAP_LOCATIONS: MapLocation[] = [
  {
    id: "town",
    name: "HAWKINS TOWN SQUARE",
    category: "CIVIC DISTRICT",
    coords: { x: 38, y: 52 },
    desc: "Downtown Hawkins. Streetlights flicker as anomalous binary transmissions override police radios.",
    unlockCondition: "Unlocked by default.",
  },
  {
    id: "policeStation",
    name: "POLICE DEPARTMENT",
    category: "INVESTIGATION",
    coords: { x: 48, y: 44 },
    desc: "Chief Hopper's precinct. Incident report board and classified missing persons files.",
    unlockCondition: "Unlocked after decoding the initial town broadcast.",
  },
  {
    id: "byersHouse",
    name: "BYERS RESIDENCE",
    category: "RESIDENTIAL / MIRKWOOD",
    coords: { x: 24, y: 68 },
    desc: "Isolated woodland home. Wall of Christmas lights and Will's torn drawings.",
    unlockCondition: "Unlocked after discovering electromagnetic clues.",
  },
  {
    id: "radioTower",
    name: "EAST HILL RADIO TOWER",
    category: "TELECOMMUNICATIONS",
    coords: { x: 74, y: 32 },
    desc: "High-altitude relay station. Houses the old scrambled 5-pin Radiometer instrument.",
    unlockCondition: "Unlocked after town transmission analysis.",
  },
  {
    id: "lab",
    name: "HAWKINS NATIONAL LAB",
    category: "RESTRICTED / DEPT OF ENERGY",
    coords: { x: 80, y: 65 },
    desc: "Heavily guarded government facility. Sublevel 4 terminal controls the security perimeter.",
    unlockCondition: "LOCKED · Requires the 5-digit code from the Radio Tower Radiometer.",
  },
  {
    id: "forest",
    name: "DEEP WOODS / TRAIL 7",
    category: "WILDERNESS",
    coords: { x: 55, y: 78 },
    desc: "Dense dark pines where flashlights reveal hidden glowing runes on tree bark.",
    unlockCondition: "Unlocked after accessing Lab Sublevel 4 files.",
  },
  {
    id: "gate",
    name: "THE GATE RIFT",
    category: "DIMENSIONAL TEAR",
    coords: { x: 86, y: 82 },
    desc: "A pulsing rift between worlds. Requires 3 Key Fragments (α, β, γ) to stabilize.",
    unlockCondition: "LOCKED · Requires 3 Key Fragments (Alpha, Beta, Gamma).",
  },
  {
    id: "upsidedown",
    name: "UNKNOWN / VECNA'S MIND",
    category: "PARALLEL ABYSS",
    coords: { x: 88, y: 18 },
    desc: "Corrupted reflection of Hawkins. Red lightning, spores, ticking grandfather clock.",
    unlockCondition: "LOCKED · Unlocks upon entering the Gate.",
  },
];

interface HawkinsMapProps {
  onSelectLocation: (loc: LocationId) => void;
  currentLoc: LocationId;
}

export default function HawkinsMap({ onSelectLocation, currentLoc }: HawkinsMapProps) {
  const { s } = useGame();
  const [hovered, setHovered] = useState<MapLocation | null>(null);

  // Determine unlocked status based on central game state
  const isUnlocked = (locId: LocationId): boolean => {
    if (locId === "town") return true;
    if (s.unlocked && s.unlocked[locId] !== undefined) {
      return !!s.unlocked[locId];
    }
    // Fallback logic from story state:
    if (locId === "policeStation" || locId === "radioTower" || locId === "byersHouse") {
      return true; // Unlocked after intro
    }
    if (locId === "lab") {
      return s.radiometer.codeSolved || !!s.unlocked?.lab;
    }
    if (locId === "forest") {
      return !!s.inventory.includes("key-beta") || !!s.unlocked?.forest;
    }
    if (locId === "gate") {
      return (s.inventory.length >= 3 && s.inventory.includes("key-gamma")) || !!s.unlocked?.gate;
    }
    if (locId === "upsidedown" || locId === "mind") {
      return s.gateKeys.length >= 3 || s.stage === "upsidedown" || s.stage === "origin" || s.stage === "mind" || s.stage === "final";
    }
    return false;
  };

  const handleLocationClick = (loc: MapLocation) => {
    if (!isUnlocked(loc.id)) {
      sfx("err");
      return;
    }
    sfx("ok");
    onSelectLocation(loc.id);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 1100,
        margin: "0 auto",
        background: "radial-gradient(ellipse at 50% 50%, #0d141e, #06080d)",
        border: "1px solid rgba(54, 224, 196, 0.35)",
        borderRadius: 8,
        boxShadow: "0 12px 40px rgba(0,0,0,0.8), inset 0 0 60px rgba(0,0,0,0.6)",
        overflow: "hidden",
        fontFamily: "var(--font-term)",
      }}
    >
      {/* Map Header Overlay */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 20,
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <div className="eyebrow" style={{ color: "var(--accent2)" }}>
          ROANE COUNTY · TOPOGRAPHIC CARTOGRAPHY
        </div>
        <h2 className="title-xl" style={{ fontSize: "clamp(24px, 3.5vw, 36px)", margin: "4px 0", color: "#fff" }}>
          HAWKINS SECTOR GRID
        </h2>
        <div className="term dim" style={{ fontSize: 13, letterSpacing: ".1em" }}>
          SCALE 1:24,000 · COORDINATE SYSTEM: NAD83 · ELEVATION 840 FT
        </div>
      </div>

      {/* Return / Status badge */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 20,
          zIndex: 20,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(54,224,196,0.3)",
            padding: "4px 10px",
            borderRadius: 4,
            fontSize: 14,
            color: "var(--accent2)",
          }}
        >
          CURRENT: <b style={{ color: "#fff" }}>{MAP_LOCATIONS.find((m) => m.id === currentLoc)?.name || currentLoc.toUpperCase()}</b>
        </div>
      </div>

      {/* Illustrated SVG Map Canvas */}
      <svg
        viewBox="0 0 1000 650"
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          aspectRatio: "1000 / 650",
        }}
      >
        <defs>
          <radialGradient id="lakeGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#142c38" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0a171f" stopOpacity="0.4" />
          </radialGradient>
          <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(54, 224, 196, 0.05)" strokeWidth="1" />
          </pattern>
          <filter id="markerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Cartographic Coordinate Grid */}
        <rect width="1000" height="650" fill="url(#gridPattern)" />

        {/* Topographic Contour Lines */}
        <path
          d="M 50 150 Q 250 80, 500 130 T 950 110"
          fill="none"
          stroke="rgba(255, 180, 84, 0.08)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M 20 280 Q 280 200, 520 260 T 980 220"
          fill="none"
          stroke="rgba(255, 180, 84, 0.06)"
          strokeWidth="1.5"
        />
        <path
          d="M 40 450 Q 320 380, 600 420 T 960 410"
          fill="none"
          stroke="rgba(255, 180, 84, 0.07)"
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />

        {/* Lake Jordan (Water body) */}
        <path
          d="M 120 180 C 180 140, 310 160, 340 230 C 370 290, 290 360, 200 350 C 130 340, 80 280, 90 230 Z"
          fill="url(#lakeGrad)"
          stroke="rgba(54, 224, 196, 0.3)"
          strokeWidth="1.5"
        />
        <text x="180" y="260" fill="rgba(54, 224, 196, 0.4)" fontSize="13" letterSpacing="3" fontFamily="monospace">
          LAKE JORDAN
        </text>

        {/* Mirkwood Forest Silhouette Area */}
        <path
          d="M 420 480 Q 560 410, 720 460 T 920 540 L 950 630 L 380 630 Z"
          fill="rgba(10, 25, 20, 0.35)"
          stroke="rgba(54, 224, 196, 0.15)"
          strokeWidth="1"
          strokeDasharray="5 3"
        />
        <text x="560" y="560" fill="rgba(54, 224, 196, 0.3)" fontSize="14" letterSpacing="4" fontFamily="monospace">
          MIRKWOOD FOREST
        </text>

        {/* Railway Line */}
        <path
          d="M 30 580 L 980 580"
          fill="none"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="3"
          strokeDasharray="8 8"
        />
        <text x="80" y="600" fill="rgba(255, 255, 255, 0.25)" fontSize="11" letterSpacing="2" fontFamily="monospace">
          INDIANA RAILROAD
        </text>

        {/* High-voltage Power Grid Lines from Lab to Town */}
        <path
          d="M 780 430 L 480 340 L 380 340"
          fill="none"
          stroke="rgba(255, 180, 84, 0.25)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        {/* Radio Tower Transmit Rings */}
        <circle cx="740" cy="208" r="30" fill="none" stroke="rgba(255, 45, 58, 0.3)" strokeWidth="1">
          <animate attributeName="r" from="15" to="65" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.8" to="0" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="740" cy="208" r="45" fill="none" stroke="rgba(255, 45, 58, 0.2)" strokeWidth="1">
          <animate attributeName="r" from="25" to="85" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.8" to="0" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
        </circle>

        {/* County Roads */}
        <path
          d="M 120 540 Q 320 480, 380 340 T 740 210"
          fill="none"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="2"
        />
        <path
          d="M 380 340 L 480 286 L 780 430"
          fill="none"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="2"
        />
        <text x="320" y="440" fill="rgba(255, 255, 255, 0.2)" fontSize="10" transform="rotate(-20 320 440)">
          ROUTE 4 EAST
        </text>
      </svg>

      {/* Interactive Location Markers Overlay */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}>
        {MAP_LOCATIONS.map((loc) => {
          const unlocked = isUnlocked(loc.id);
          const isCurrent = currentLoc === loc.id;
          const isHovered = hovered?.id === loc.id;

          const markerColor =
            loc.id === "upsidedown" || loc.id === "gate"
              ? "#ff2d3a"
              : loc.id === "lab"
              ? "#36e0c4"
              : "#ffb454";

          return (
            <div
              key={loc.id}
              onClick={() => handleLocationClick(loc)}
              onMouseEnter={() => {
                sfx("click");
                setHovered(loc);
              }}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: "absolute",
                left: `${loc.coords.x}%`,
                top: `${loc.coords.y}%`,
                transform: "translate(-50%, -50%)",
                cursor: unlocked ? "pointer" : "not-allowed",
                zIndex: isCurrent ? 15 : isHovered ? 14 : 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Outer pulsing ring for unlocked locations */}
              {unlocked && (
                <div
                  style={{
                    position: "absolute",
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: `1px solid ${markerColor}`,
                    opacity: 0.6,
                    animation: "pulse 2s infinite ease-out",
                  }}
                />
              )}

              {/* Main Node Icon */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: unlocked
                    ? isCurrent
                      ? "#fff"
                      : "rgba(10, 16, 24, 0.9)"
                    : "rgba(15, 15, 20, 0.7)",
                  border: `2px solid ${
                    unlocked ? markerColor : "rgba(255, 255, 255, 0.2)"
                  }`,
                  boxShadow: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: unlocked ? (isCurrent ? "#000" : markerColor) : "#666",
                  fontSize: 16,
                  fontWeight: "bold",
                  transition: "transform .2s ease-out",
                  transform: isHovered ? "scale(1.25)" : "scale(1)",
                }}
              >
                {unlocked ? (isCurrent ? "◉" : "●") : "■"}
              </div>

              {/* Pin Label */}
              <div
                style={{
                  marginTop: 6,
                  padding: "2px 8px",
                  borderRadius: 3,
                  background: isCurrent ? markerColor : "rgba(0, 0, 0, 0.75)",
                  color: isCurrent ? "#000" : unlocked ? "#fff" : "var(--dim)",
                  border: `1px solid ${unlocked ? markerColor : "rgba(255,255,255,0.15)"}`,
                  fontSize: 12,
                  letterSpacing: ".1em",
                  whiteSpace: "nowrap",
                  fontWeight: isCurrent ? "bold" : "normal",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
                }}
              >
                {loc.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Inspector Preview Card */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              bottom: 20,
              left: 20,
              maxWidth: 380,
              background: "rgba(8, 12, 18, 0.94)",
              border: `1px solid ${isUnlocked(hovered.id) ? "var(--accent)" : "rgba(255,255,255,0.2)"}`,
              borderRadius: 6,
              padding: "16px 18px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
              zIndex: 30,
              pointerEvents: "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span className="eyebrow" style={{ fontSize: 11 }}>{hovered.category}</span>
              <span
                style={{
                  fontSize: 12,
                  padding: "2px 6px",
                  borderRadius: 2,
                  background: isUnlocked(hovered.id) ? "rgba(54,224,196,0.15)" : "rgba(255,45,58,0.15)",
                  color: isUnlocked(hovered.id) ? "var(--accent2)" : "var(--danger)",
                }}
              >
                {isUnlocked(hovered.id) ? "ACCESS AUTHORIZED" : "RESTRICTED / SEALED"}
              </span>
            </div>

            <div style={{ fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 6 }}>
              {hovered.name}
            </div>

            <div style={{ fontSize: 14, color: "var(--dim)", lineHeight: 1.4, marginBottom: 10 }}>
              {hovered.desc}
            </div>

            {!isUnlocked(hovered.id) && (
              <div style={{ fontSize: 12, color: "var(--danger)", borderTop: "1px dashed rgba(255,45,58,0.3)", paddingTop: 6 }}>
                [RESTRICTED] {hovered.unlockCondition}
              </div>
            )}
            {isUnlocked(hovered.id) && (
              <div style={{ fontSize: 12, color: "var(--accent2)", borderTop: "1px dashed rgba(54,224,196,0.3)", paddingTop: 6 }}>
                CLICK TO TRAVEL →
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
