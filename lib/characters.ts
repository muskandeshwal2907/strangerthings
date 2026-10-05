/**
 * THE HAWKINS PROTOCOL - CHARACTER SYSTEM
 * 
 * Central registry of chapter characters, portraits, and sprite assets.
 * Chapter 1: Hawkins Town (Callahan)
 * Chapter 2: Police Station (Hopper)
 * Chapter 3: Byers House (Joyce & Will)
 * Chapter 4: Hawkins Lab (Dr. Brenner)
 * Chapter 5: Forest (Park Ranger)
 * Chapter 6: Radio Tower (Pip - "The Radio Kid" with /characters/radiokid.png sprite)
 * Chapter 7: Upside Down (Vecna)
 */

export interface CharacterDef {
  id: string;
  name: string;
  nameTag: string; // Display name tag, e.g. "PIP"
  title: string;
  location: string;
  chapterId: number;
  sprite?: string; // Path to sprite image (e.g. "/characters/radiokid.png")
  themeColor: string;
  badgeBg: string;
  silhouetteSvg: string; // Procedural SVG silhouette for characters without sprites
}

export const CHARACTERS: Record<string, CharacterDef> = {
  dot: {
    id: "dot",
    name: "Dot",
    nameTag: "DOT",
    title: "MUNICIPAL DISPATCHER · EMERGENCY TELEMETRY",
    location: "town",
    chapterId: 1,
    sprite: "/characters/dot.png",
    themeColor: "#ffb454",
    badgeBg: "rgba(255, 180, 84, 0.2)",
    silhouetteSvg: "",
  },
  callahan: {
    id: "callahan",
    name: "Officer Callahan",
    nameTag: "CALLAHAN",
    title: "PATROL OFFICER · PRECINCT 2",
    location: "town",
    chapterId: 1,
    themeColor: "#4f98ca",
    badgeBg: "rgba(79, 152, 202, 0.2)",
    silhouetteSvg: `
      <svg viewBox="0 0 32 48" fill="currentColor" style="shape-rendering: crispEdges;">
        <rect x="10" y="4" width="12" height="4" />
        <rect x="8" y="8" width="16" height="3" />
        <rect x="6" y="11" width="20" height="2" />
        <rect x="11" y="13" width="10" height="8" />
        <rect x="10" y="21" width="12" height="4" />
        <rect x="7" y="25" width="18" height="12" />
        <rect x="5" y="27" width="3" height="8" />
        <rect x="24" y="27" width="3" height="8" />
        <rect x="9" y="37" width="6" height="11" />
        <rect x="17" y="37" width="6" height="11" />
      </svg>
    `,
  },
  hopper: {
    id: "hopper",
    name: "Chief Hopper",
    nameTag: "HOPPER",
    title: "CHIEF OF POLICE",
    location: "policeStation",
    chapterId: 2,
    themeColor: "#c28859",
    badgeBg: "rgba(194, 136, 89, 0.2)",
    silhouetteSvg: `
      <svg viewBox="0 0 32 48" fill="currentColor" style="shape-rendering: crispEdges;">
        <rect x="11" y="4" width="10" height="4" />
        <rect x="6" y="8" width="20" height="3" />
        <rect x="4" y="11" width="24" height="2" />
        <rect x="10" y="13" width="12" height="9" />
        <rect x="9" y="22" width="14" height="4" />
        <rect x="6" y="26" width="20" height="12" />
        <rect x="4" y="28" width="3" height="9" />
        <rect x="25" y="28" width="3" height="9" />
        <rect x="8" y="38" width="7" height="10" />
        <rect x="17" y="38" width="7" height="10" />
      </svg>
    `,
  },
  byers: {
    id: "byers",
    name: "Joyce Byers",
    nameTag: "JOYCE",
    title: "RESIDENTIAL TELECOMMUNICATIONS",
    location: "byersHouse",
    chapterId: 3,
    themeColor: "#e6a15c",
    badgeBg: "rgba(230, 161, 92, 0.2)",
    silhouetteSvg: `
      <svg viewBox="0 0 32 48" fill="currentColor" style="shape-rendering: crispEdges;">
        <rect x="10" y="5" width="12" height="6" />
        <rect x="8" y="9" width="16" height="12" />
        <rect x="11" y="11" width="10" height="8" />
        <rect x="10" y="21" width="12" height="4" />
        <rect x="8" y="25" width="16" height="13" />
        <rect x="6" y="27" width="3" height="8" />
        <rect x="23" y="27" width="3" height="8" />
        <rect x="10" y="38" width="5" height="10" />
        <rect x="17" y="38" width="5" height="10" />
      </svg>
    `,
  },
  brenner: {
    id: "brenner",
    name: "Dr. Brenner",
    nameTag: "BRENNER",
    title: "DIRECTOR · HAWKINS LAB",
    location: "lab",
    chapterId: 4,
    themeColor: "#26a69a",
    badgeBg: "rgba(38, 166, 154, 0.2)",
    silhouetteSvg: `
      <svg viewBox="0 0 32 48" fill="currentColor" style="shape-rendering: crispEdges;">
        <rect x="11" y="4" width="10" height="5" />
        <rect x="10" y="9" width="12" height="9" />
        <rect x="11" y="18" width="10" height="4" />
        <rect x="7" y="22" width="18" height="16" />
        <rect x="5" y="24" width="3" height="10" />
        <rect x="24" y="24" width="3" height="10" />
        <rect x="9" y="38" width="6" height="10" />
        <rect x="17" y="38" width="6" height="10" />
      </svg>
    `,
  },
  ranger: {
    id: "ranger",
    name: "Ranger Miller",
    nameTag: "RANGER",
    title: "FOREST PATROL · ROANE COUNTY",
    location: "forest",
    chapterId: 5,
    themeColor: "#81c784",
    badgeBg: "rgba(129, 199, 132, 0.2)",
    silhouetteSvg: `
      <svg viewBox="0 0 32 48" fill="currentColor" style="shape-rendering: crispEdges;">
        <rect x="11" y="5" width="10" height="4" />
        <rect x="5" y="9" width="22" height="3" />
        <rect x="10" y="12" width="12" height="8" />
        <rect x="9" y="20" width="14" height="4" />
        <rect x="7" y="24" width="18" height="13" />
        <rect x="5" y="26" width="3" height="9" />
        <rect x="24" y="26" width="3" height="9" />
        <rect x="9" y="37" width="6" height="11" />
        <rect x="17" y="37" width="6" height="11" />
      </svg>
    `,
  },
  radiokid: {
    id: "radiokid",
    name: "Pip",
    nameTag: "PIP",
    title: "RADIO OPERATOR · AV CLUB",
    location: "radioTower",
    chapterId: 6,
    sprite: "/characters/radiokid.png",
    themeColor: "#ff7c85",
    badgeBg: "rgba(255, 45, 58, 0.2)",
    silhouetteSvg: "",
  },
  vecna: {
    id: "vecna",
    name: "Vecna",
    nameTag: "VECNA",
    title: "UNKNOWN ENTITY · PARALLEL ABYSS",
    location: "upsidedown",
    chapterId: 7,
    themeColor: "#ff2d3a",
    badgeBg: "rgba(255, 45, 58, 0.3)",
    silhouetteSvg: `
      <svg viewBox="0 0 32 48" fill="currentColor" style="shape-rendering: crispEdges;">
        <rect x="11" y="3" width="10" height="11" />
        <rect x="8" y="7" width="3" height="12" />
        <rect x="21" y="7" width="3" height="12" />
        <rect x="7" y="18" width="18" height="18" />
        <rect x="4" y="20" width="4" height="16" />
        <rect x="24" y="20" width="4" height="16" />
        <rect x="9" y="36" width="6" height="12" />
        <rect x="17" y="36" width="6" height="12" />
      </svg>
    `,
  },
};

/**
 * Get active character by location identifier
 */
export function getCharacterForLocation(locationId: string): CharacterDef {
  if (locationId === "radioTower") return CHARACTERS.radiokid;
  if (locationId === "town") return CHARACTERS.dot;
  if (locationId === "policeStation") return CHARACTERS.hopper;
  if (locationId === "byersHouse") return CHARACTERS.byers;
  if (locationId === "lab") return CHARACTERS.brenner;
  if (locationId === "forest") return CHARACTERS.ranger;
  if (locationId === "upsidedown") return CHARACTERS.vecna;
  return CHARACTERS.dot;
}

/**
 * Get active character by chapter number
 */
export function getCharacterForChapter(chapterId: number): CharacterDef {
  if (chapterId === 1) return CHARACTERS.dot;
  if (chapterId === 2) return CHARACTERS.hopper;
  if (chapterId === 3) return CHARACTERS.byers;
  if (chapterId === 4) return CHARACTERS.brenner;
  if (chapterId === 5) return CHARACTERS.ranger;
  if (chapterId === 6) return CHARACTERS.radiokid;
  if (chapterId === 7) return CHARACTERS.vecna;
  return CHARACTERS.dot;
}
