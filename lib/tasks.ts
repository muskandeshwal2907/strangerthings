/**
 * THE HAWKINS PROTOCOL - TASK ENGINE DATA
 * 
 * Production Security Notice:
 * All answers and regexes here are client-side for demonstration and event simulation.
 * In a production tournament, answer validation MUST be processed via server-side APIs
 * to prevent client code inspection.
 */

export type LocationId =
  | "town"
  | "policeStation"
  | "byersHouse"
  | "radioTower"
  | "lab"
  | "forest"
  | "gate"
  | "upsidedown"
  | "mind";

export type TaskType =
  | "quiz"
  | "connection"
  | "rearrange"
  | "case_study"
  | "series"
  | "radio"
  | "lab_task";

export interface PowerHints {
  vision: string;
  will: string;
  eleven: string;
}

export interface QuizOption {
  id: string;
  label: string;
  isCorrect?: boolean;
}

export interface ConnectionPair {
  leftId: string;
  leftLabel: string;
  rightId: string;
  rightLabel: string;
}

export interface EvidenceCard {
  id: string;
  title: string;
  date: string;
  location: string;
  summary: string;
  tag: string;
  pinned?: boolean;
}

export interface LabSubTask {
  id: string;
  subsystem: "power" | "security" | "communication" | "gate";
  title: string;
  type: "code" | "debug" | "decode" | "series";
  prompt: string;
  codeSnippet?: string;
  answer: RegExp;
  placeholder: string;
  terminalSuccess: string;
}

export interface StoryTask {
  id: string;
  location: LocationId;
  type: TaskType;
  title: string;
  category: "tech" | "puzzle" | "clue";
  points: number;
  question: string;
  storyClue?: string;
  rewardItem?: string;
  unlockCondition?: string;
  nextStoryEvent?: string;
  hints: PowerHints;

  // Type-specific data
  // 1. QUIZ
  quizData?: {
    stampText?: string;
    caseNumber?: string;
    redactedFields?: string[];
    options: QuizOption[];
    correctAnswerId?: string;
    textAnswer?: RegExp;
    isCorrupted?: boolean;
  };

  // 2. CONNECTION
  connectionData?: {
    pairs: ConnectionPair[];
    upsideDownSkin?: boolean;
  };

  // 3. REARRANGE
  rearrangeData?: {
    initialTiles: string[];
    correctOrder: string[];
    highlightIndex?: number;
    upsideDownSkin?: boolean;
  };

  // 4. CASE STUDY
  caseStudyData?: {
    incidentTitle: string;
    reportNumber: string;
    cards: EvidenceCard[];
    correctLocationRoute: LocationId;
    question: string;
  };

  // 5. SERIES
  seriesData?: {
    sequence: (number | string)[];
    missingIndex: number;
    answer: RegExp;
    clueName: string;
    clueValue: string;
    blipSpeedMs?: number;
  };

  // 6. RADIO
  radioData?: {
    targetFrequency: number; // e.g. 87.6
    tolerance: number;       // e.g. 0.3
    morseCode?: string;      // e.g. ".... . .-.. .--."
    binaryCode?: string;     // e.g. "01001000 01000101 01001100 01010000"
    answer: RegExp;
    placeholder: string;
  };

  // 7. LAB TASK
  labData?: {
    subtasks: LabSubTask[];
  };
}

export const STORY_TASKS: Record<string, StoryTask> = {
  // ── 1. TOWN (Intro Task) ──
  "town-1": {
    id: "town-1",
    location: "town",
    type: "radio",
    title: "UNKNOWN BROADCAST",
    category: "puzzle",
    points: 100,
    question: "The power lines are humming. Hawkins public radio has been overridden by an anomalous transmission. Decode the first incoming signal burst.",
    storyClue: "The frequency traces back to the old Hawkins Radio Tower on East Hill, while emergency calls are flooding the Police Station.",
    nextStoryEvent: "Police Station and Radio Tower locations unlocked.",
    hints: {
      vision: "Each 8-bit byte represents one ASCII character. 01001000 = 'H'.",
      will: "Someone is broadcasting a distress call.",
      eleven: "Four letters: H - E - L - P.",
    },
    radioData: {
      targetFrequency: 87.6,
      tolerance: 0.4,
      binaryCode: "01001000 01000101 01001100 01010000",
      morseCode: ".... . .-.. .--.",
      answer: /^help$/i,
      placeholder: "DECODED WORD",
    },
  },

  // ── 2. POLICE STATION ──
  "police-quiz": {
    id: "police-quiz",
    location: "policeStation",
    type: "quiz",
    title: "HAWKINS POLICE FILE: CASE 86-04",
    category: "clue",
    points: 150,
    question: "Chief's desk file: Missing Person report #086. One critical witness testimony regarding the night of November 6 was redacted by state officials. Which detail was suppressed?",
    storyClue: "The Department of Energy confiscated the power station logbook immediately following the report.",
    hints: {
      vision: "Look at the ink bleeding through the black redaction marker.",
      will: "The lights in the house were talking before he vanished.",
      eleven: "Electromagnetic surge at the Byers residence.",
    },
    quizData: {
      stampText: "CONFIDENTIAL / HAWKINS POLICE DEPT",
      caseNumber: "CASE 86-04A · MISSING JUVENILE",
      redactedFields: [
        "SUBJECT: [REDACTED BY STATE DIRECTIVE]",
        "TIME OF SURGE: 23:47 EST",
        "GRID SECTOR: 4-BYERS RESIDENCE",
      ],
      options: [
        { id: "opt1", label: "Car tracks ending at Lake Jordan" },
        { id: "opt2", label: "Massive electromagnetic spike causing Christmas lights to illuminate without power", isCorrect: true },
        { id: "opt3", label: "Report of stray dogs near the quarry" },
        { id: "opt4", label: "A broken telephone line in town center" },
      ],
      correctAnswerId: "opt2",
    },
  },

  "police-incident": {
    id: "police-incident",
    location: "policeStation",
    type: "case_study",
    title: "HAWKINS INCIDENT REPORT BOARD",
    category: "puzzle",
    points: 150,
    question: "Cross-examine the pinned incident cards on the chief's board. Based on the temporal correlation between electromagnetic anomalies and radio signal bursts, which location is the primary source?",
    storyClue: "All anomalies align on an azimuth pointing directly to the Hawkins Radio Tower.",
    nextStoryEvent: "Radio Tower investigation priority confirmed.",
    hints: {
      vision: "Card #3 has matching time stamps with the transmission logs.",
      will: "The tower on the hill... it's listening to the other side.",
      eleven: "The Radio Tower on the eastern ridge.",
    },
    caseStudyData: {
      incidentTitle: "HAWKINS POLICE LOG: INCIDENT CORRELATION",
      reportNumber: "IR-1986-1106",
      correctLocationRoute: "radioTower",
      question: "Which location exhibits the epicenter of the transmission spikes?",
      cards: [
        {
          id: "card-1",
          title: "Missing Juvenile Report",
          date: "Nov 6 · 23:55",
          location: "Byers Residence / Mirkwood",
          summary: "Bicycle found off trail near Cornwallis Rd. High residual electromagnetic charge detected on handlebars.",
          tag: "PERSON OF INTEREST",
          pinned: true,
        },
        {
          id: "card-2",
          title: "Power Substation Tripping",
          date: "Nov 6 · 23:48",
          location: "Hawkins National Laboratory",
          summary: "Internal grid drop of 4.2 megawatts. Auxiliary generators activated behind restricted sector gates.",
          tag: "RESTRICTED",
          pinned: true,
        },
        {
          id: "card-3",
          title: "High-Band RF Interference",
          date: "Nov 7 · 00:15",
          location: "Radio Tower Hill",
          summary: "Continuous 87.6 MHz carrier signal detected. Transmitter operating without staff present. Strange modulation.",
          tag: "SOURCE SPIKE",
          pinned: true,
        },
        {
          id: "card-4",
          title: "Wildlife Disturbance",
          date: "Nov 7 · 01:20",
          location: "Deep Forest / Trail 7",
          summary: "Abnormal temperature drop. Trees marked with strange geometric gouges. No animal tracks present.",
          tag: "ENVIRONMENTAL",
          pinned: false,
        },
      ],
    },
  },

  // ── 3. BYERS HOUSE ──
  "byers-rearrange": {
    id: "byers-rearrange",
    location: "byersHouse",
    type: "rearrange",
    title: "WILL'S SCRAMBLED NOTES",
    category: "puzzle",
    points: 150,
    question: "Torn pages scattered across the living room table. Reconstruct Will's urgent warning message by reordering the scrambled fragments.",
    storyClue: "The drawing underneath depicts a sprawling shadow over Hawkins.",
    hints: {
      vision: "The sentence starts with the negative command 'DO NOT'.",
      will: "He's begging everyone to keep the boundary sealed.",
      eleven: "DO NOT OPEN THE GATE.",
    },
    rearrangeData: {
      initialTiles: ["THE", "OPEN", "GATE", "NOT", "DO"],
      correctOrder: ["DO", "NOT", "OPEN", "THE", "GATE"],
    },
  },

  "byers-connection": {
    id: "byers-connection",
    location: "byersHouse",
    type: "connection",
    title: "CHRISTMAS LIGHTS ALPHABET WALL",
    category: "puzzle",
    points: 150,
    question: "The painted letters and colored bulbs across the floral wallpaper are flickering in tandem. Connect each flashing bulb color to its corresponding alphabet sector.",
    storyClue: "The lights spell out: 'RIGHT HERE' before shorting out.",
    hints: {
      vision: "Red bulbs connect to the first row (A-H).",
      will: "Follow the pulse from left to right.",
      eleven: "Red = A-H, Blue = I-Q, Yellow = R-Z, Green = RUN.",
    },
    connectionData: {
      pairs: [
        { leftId: "c-red", leftLabel: "RED BULB (Sector 1)", rightId: "t-ah", rightLabel: "LETTERS A · B · C · D · E · F · G · H" },
        { leftId: "c-blue", leftLabel: "BLUE BULB (Sector 2)", rightId: "t-iq", rightLabel: "LETTERS I · J · K · L · M · N · O · P · Q" },
        { leftId: "c-yellow", leftLabel: "YELLOW BULB (Sector 3)", rightId: "t-rz", rightLabel: "LETTERS R · S · T · U · V · W · X · Y · Z" },
        { leftId: "c-green", leftLabel: "GREEN BULB (Emergency)", rightId: "t-run", rightLabel: "MESSAGE: R · U · N" },
      ],
    },
  },

  // ── 4. RADIO TOWER ──
  "tower-series": {
    id: "tower-series",
    location: "radioTower",
    type: "series",
    title: "REPEATER BEACON FREQUENCY BLIPS",
    category: "tech",
    points: 150,
    question: "The beacon transmitter oscillates in exponential power bursts. Identify the next burst value to lock in the subterranean telemetry coordinates.",
    storyClue: "Telemetry coordinate 32 locks onto Hawkins Lab Sublevel 4.",
    hints: {
      vision: "Each term is twice the previous: 2, 4, 8, 16, ...",
      will: "Powers of two: 2^5.",
      eleven: "Thirty-two.",
    },
    seriesData: {
      sequence: [2, 4, 8, 16, "?"],
      missingIndex: 4,
      answer: /^32$/,
      clueName: "SUBLEVEL COORDINATE",
      clueValue: "ROOM 32 / SUBLEVEL 4",
      blipSpeedMs: 650,
    },
  },

  "tower-radio": {
    id: "tower-radio",
    location: "radioTower",
    type: "radio",
    title: "HIGH-ALTITUDE TRANSMITTER TUNING",
    category: "tech",
    points: 200,
    question: "Align the receiver dial to the carrier frequency (87.6 MHz) to eliminate harmonic distortion, then decode the second Morse burst.",
    storyClue: "The voice on the frequency repeats: 'HELP WILL... HE IS INSIDE'.",
    rewardItem: "key-alpha",
    hints: {
      vision: "Tune the needle right to 87.6 MHz until static drops.",
      will: "Morse: .... . .-.. .--.   .-- .. .-.. .-..",
      eleven: "HELP WILL",
    },
    radioData: {
      targetFrequency: 87.6,
      tolerance: 0.25,
      morseCode: ".... . .-.. .--.   .-- .. .-.. .-..",
      answer: /^help\s+will$/i,
      placeholder: "DECODED TRANSMISSION",
    },
  },

  // ── 5. HAWKINS LAB ──
  "lab-terminal": {
    id: "lab-terminal",
    location: "lab",
    type: "lab_task",
    title: "HAWKINS LAB TERMINAL: SUBLEVEL 4",
    category: "tech",
    points: 300,
    question: "The lab's central mainframe is in lockdown after an emergency breach. Restore the 4 subsystems (Power, Security, Communication, Gate Control) by debugging and decoding each module.",
    storyClue: "Terminal decrypts Subject 003 file and releases Key Fragment β.",
    rewardItem: "key-beta",
    nextStoryEvent: "Restricted Forest Trail unlocked.",
    hints: {
      vision: "Subtask 1 loop: arr.length bug causes NaN.",
      will: "Subtask 2 cipher: shift back by 3.",
      eleven: "Restore Power -> Security -> Comms -> Gate sequentially.",
    },
    labData: {
      subtasks: [
        {
          id: "sub-pwr",
          subsystem: "power",
          title: "AUXILIARY POWER BUS RESTORATION",
          type: "debug",
          prompt: "The grid generator routine throws an exception. What does this code output when executing with index bounds error?",
          codeSnippet: `function calcPower(cells) {\n  let total = 0;\n  for (let i = 0; i <= cells.length; i++) {\n    total += cells[i];\n  }\n  return total;\n}\nconsole.log(calcPower([10, 20, 30]));`,
          answer: /^nan$/i,
          placeholder: "CONSOLE OUTPUT",
          terminalSuccess: "AUXILIARY POWER AT 100% · BUS VOLTAGE STABLE",
        },
        {
          id: "sub-sec",
          subsystem: "security",
          title: "SECURITY BYPASS PASSPHRASE",
          type: "decode",
          prompt: "Security console requires the emergency clearance passphrase. The encrypted text is Caesar shifted forward by 3: 'DFFHVV JUDQWHG'. Decrypt it.",
          codeSnippet: `CIPHERTEXT: DFFHVV JUDQWHG\nALGORITHM: CAESAR (ROT +3)\nDECODE: SHIFT BACK 3 POSITIONS`,
          answer: /^access\s+granted$/i,
          placeholder: "PLAINTEXT PASSPHRASE",
          terminalSuccess: "SECURITY PROTOCOLS BYPASSED · BULKHEADS OPEN",
        },
        {
          id: "sub-com",
          subsystem: "communication",
          title: "SUBJECT ARCHIVE CHECKSUM",
          type: "code",
          prompt: "Archive File 003 (Will Byers) requires entering the digit sum of 2 to the power of 15 (2^15 = 32768).",
          codeSnippet: `// Checksum formula: sum of digits of Math.pow(2, 15)\n// 2^15 = 32768\n// Checksum = 3 + 2 + 7 + 6 + 8`,
          answer: /^26$/,
          placeholder: "CHECKSUM NUMBER",
          terminalSuccess: "COMMUNICATIONS LINK RESTORED · FILE 003 DECRYPTED",
        },
        {
          id: "sub-gate",
          subsystem: "gate",
          title: "GATE TELEMETRY INITIALIZER",
          type: "series",
          prompt: "Compute the next harmonic frequency in the gate resonance sequence: 2, 6, 12, 20, 30, ?",
          codeSnippet: `// Series: n * (n + 1)\n// 1*2=2, 2*3=6, 3*4=12, 4*5=20, 5*6=30, 6*7=?`,
          answer: /^42$/,
          placeholder: "NEXT HARMONIC",
          terminalSuccess: "GATE CONTROL ONLINE · KEY FRAGMENT β EJECTED",
        },
      ],
    },
  },

  // ── 6. FOREST ──
  "forest-marks": {
    id: "forest-marks",
    location: "forest",
    type: "series",
    title: "CARVED TRAIL RUNES",
    category: "clue",
    points: 150,
    question: "Using your flashlight beam, search the deep woods for three carved digits glowing on the ancient pine trunks. Enter them left to right.",
    storyClue: "The digits 4 · 1 · 7 match the coordinate vector of the Gate rift.",
    rewardItem: "key-gamma",
    hints: {
      vision: "Check the trunks at varying heights from left to right.",
      will: "He carved them while hiding from the demogorgon.",
      eleven: "Four · One · Seven (417).",
    },
    seriesData: {
      sequence: [4, 1, 7],
      missingIndex: -1,
      answer: /^417$/,
      clueName: "FOREST COORDINATES",
      clueValue: "VECTOR 4-1-7",
    },
  },

  // ── 7. THE GATE ──
  "gate-unlock": {
    id: "gate-unlock",
    location: "gate",
    type: "connection",
    title: "THE DIMENSIONAL RIFT",
    category: "puzzle",
    points: 200,
    question: "Insert the three recovered key fragments (Alpha, Beta, Gamma) into the pulsing rift sockets to stabilize the threshold.",
    storyClue: "The boundary between dimensions dissolves. The Upside Down is open.",
    nextStoryEvent: "THE UPSIDE DOWN UNLOCKED · VECNA STATUS ACTIVE",
    hints: {
      vision: "Each key fragment corresponds to one pulsing orbital ring.",
      will: "Don't go in without your team ready.",
      eleven: "Insert Fragment Alpha, Beta, and Gamma.",
    },
    connectionData: {
      pairs: [
        { leftId: "k-alpha", leftLabel: "KEY FRAGMENT α (Radio Tower)", rightId: "s-1", rightLabel: "SOCKET 1: HARMONIC ANCHOR" },
        { leftId: "k-beta", leftLabel: "KEY FRAGMENT β (Lab Archive)", rightId: "s-2", rightLabel: "SOCKET 2: SECURITY OVERRIDE" },
        { leftId: "k-gamma", leftLabel: "KEY FRAGMENT γ (Forest Trail)", rightId: "s-3", rightLabel: "SOCKET 3: SPATIAL VECTOR" },
      ],
    },
  },

  // ── 8. THE UPSIDE DOWN (Re-skinned 7 Task Types) ──
  "ud-quiz": {
    id: "ud-quiz",
    location: "upsidedown",
    type: "quiz",
    title: "CORRUPTED LAB LOG: EXPERIMENT 001",
    category: "clue",
    points: 200,
    question: "A decaying document burned into the dark red soil. The first subject's true identity was scrubbed from lab logs with a ROT13 cipher: 'URAEL PERRY'. What was his birth name?",
    storyClue: "Henry Creel was banished into the abyss by Eleven in 1979.",
    hints: {
      vision: "ROT13: shift letters by 13. U -> H.",
      will: "Creel House... the grandfather clock.",
      eleven: "Henry Creel.",
    },
    quizData: {
      isCorrupted: true,
      stampText: "RESTRICTED // UPSIDE DOWN MEMORY",
      caseNumber: "CLASSIFIED // SUBJECT 001",
      options: [
        { id: "o1", label: "Martin Brenner" },
        { id: "o2", label: "Henry Creel", isCorrect: true },
        { id: "o3", label: "Edward Munson" },
        { id: "o4", label: "Robert Newby" },
      ],
      correctAnswerId: "o2",
      textAnswer: /^henry\s+creel$/i,
    },
  },

  "ud-connection": {
    id: "ud-connection",
    location: "upsidedown",
    type: "connection",
    title: "STRANGE UPSIDE DOWN RUNES",
    category: "puzzle",
    points: 200,
    question: "Glowing eldritch tentacles bind these ancient signs. Connect each dark symbol to its metaphysical meaning before the rift closes.",
    hints: {
      vision: "The clock hand symbol connects to Vecna's Curse.",
      will: "The inverted tree represents the dimension.",
      eleven: "Clock = Curse, Spores = Mind Flayer, Rift = Gate, Rose = Creel.",
    },
    connectionData: {
      upsideDownSkin: true,
      pairs: [
        { leftId: "sym-clock", leftLabel: "⏳ CHIME OF FOUR", rightId: "m-curse", rightLabel: "VECNA'S MENTAL ANCHOR" },
        { leftId: "sym-spore", leftLabel: "✦ CRIMSON SPORE", rightId: "m-hive", rightLabel: "THE HIVE MIND" },
        { leftId: "sym-rift", leftLabel: "⚡ TEAR IN REALITY", rightId: "m-gate", rightLabel: "MOTHER GATE" },
        { leftId: "sym-spider", leftLabel: "🕷 BLACK WIDOW", rightId: "m-creel", rightLabel: "HENRY'S FASCINATION" },
      ],
    },
  },

  "ud-rearrange": {
    id: "ud-rearrange",
    location: "upsidedown",
    type: "rearrange",
    title: "CORRUPTED MEMORY FRAGMENTS",
    category: "puzzle",
    points: 200,
    question: "Jittering, infected tiles float in the crimson ash. Reconstruct the psychic directive Vecna uses to control the hive.",
    hints: {
      vision: "Starts with 'THE'.",
      will: "He commands everyone to bow.",
      eleven: "THE CLOCK CHIMES FOUR TIMES.",
    },
    rearrangeData: {
      upsideDownSkin: true,
      initialTiles: ["CHIMES", "TIMES", "CLOCK", "THE", "FOUR"],
      correctOrder: ["THE", "CLOCK", "CHIMES", "FOUR", "TIMES"],
    },
  },

  // ── 9. VECNA'S MIND (Final 5-Step Escape) ──
  "mind-final": {
    id: "mind-final",
    location: "mind",
    type: "lab_task",
    title: "WILL'S RESISTANCE: 5-STEP ESCAPE",
    category: "tech",
    points: 500,
    question: "Will has turned Vecna's mental connection against him! Complete the 5 critical countermeasures to break Vecna's hold and seal the gateway forever.",
    storyClue: "Vecna's psychic grip shatters. The Gate collapses!",
    nextStoryEvent: "EPILOGUE: HAWKINS RESTORED",
    hints: {
      vision: "Step 1: 12-hour clock chiming 1..12 twice a day = 78 * 2 = 156.",
      will: "Step 2: 57 49 4C 4C in hex is W-I-L-L.",
      eleven: "Step 3: '5' + 3 - 1 = '53' - 1 = 52. Step 4: 1 + 4 + 9 = 14. Step 5: 42 in binary = 101010.",
    },
    labData: {
      subtasks: [
        {
          id: "step-1",
          subsystem: "power",
          title: "STEP 1: FIND VECNA'S WEAKNESS (THE CLOCK)",
          type: "decode",
          prompt: "A grandfather clock chimes its hour number at each hour (1 chime at 1:00, 2 at 2:00, up to 12 at 12:00). How many total chimes in a 24-hour day?",
          codeSnippet: `// 1 to 12 sum = (12 * 13) / 2 = 78\n// Two 12-hour cycles per 24h day\n// Total = 78 * 2`,
          answer: /^156$/,
          placeholder: "TOTAL CHIMES",
          terminalSuccess: "VECNA'S MENTAL CADENCE DISRUPTED",
        },
        {
          id: "step-2",
          subsystem: "security",
          title: "STEP 2: BREAK THE CONNECTION (WILL'S SIGNAL)",
          type: "code",
          prompt: "Will's counter-signal broadcasts in hexadecimal bytes: '57 49 4C 4C'. Decode his name to verify transmission authenticity.",
          codeSnippet: `0x57 = 'W'\n0x49 = 'I'\n0x4C = 'L'\n0x4C = 'L'`,
          answer: /^will$/i,
          placeholder: "DECODED IDENTITY",
          terminalSuccess: "WILL ESTABLISHES BI-DIRECTIONAL FEEDBACK",
        },
        {
          id: "step-3",
          subsystem: "communication",
          title: "STEP 3: DISABLE VECNA'S CONTROL",
          type: "debug",
          prompt: "What does this JavaScript expression evaluate to?",
          codeSnippet: `console.log("5" + 3 - 1);`,
          answer: /^52$/,
          placeholder: "EVALUATION RESULT",
          terminalSuccess: "HIVE MIND TELEMETRY CORRUPTED",
        },
        {
          id: "step-4",
          subsystem: "gate",
          title: "STEP 4: COLLAPSE THE PSYCHIC RIFT",
          type: "code",
          prompt: "Calculate the exact result of the functional reduction:",
          codeSnippet: `[1, 2, 3].map(x => x * x).reduce((acc, curr) => acc + curr, 0);`,
          answer: /^14$/,
          placeholder: "INTEGER RESULT",
          terminalSuccess: "PSYCHIC RIFT CRACKING",
        },
      ],
    },
  },
};
