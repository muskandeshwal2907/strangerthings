/**
 * RADIOMETER CONFIG — THE HAWKINS PROTOCOL
 *
 * Edit this file to change any task question, answer, digit value or the
 * final 5-digit access code.
 *
 * NOTE: In production, move answer validation server-side. The RegExp
 *    answers here are visible to the client. See store.tsx for the
 *    submit() function where server validation would be wired in.
 *
 * HOW THE CODE WORKS:
 *   Each pin.digit is the single character that pin contributes.
 *   FINAL_CODE = pin[0].digit + pin[1].digit + ... + pin[4].digit  (left to right)
 *   The player must type this exact string in the keypad to open the Lab.
 */

export type RadiometerTaskType =
  | "radio"       // Tuning dial + Morse decode
  | "series"      // Pattern blip series
  | "connection"  // Wire patch-bay
  | "rearrange"   // Scrambled log tiles
  | "debug";      // Code snippet – what does it print?

export interface RadiometerPin {
  /** Which task unlocks this pin (0-indexed, matches RADIOMETER_TASKS order) */
  taskIndex: number;
  /** The digit this pin reveals on correct solve */
  digit: string;
  /** Short label shown on the instrument face */
  label: string;
}

export interface RadiometerTask {
  id: string;
  type: RadiometerTaskType;
  /** In-world name shown on the clickable object */
  objectLabel: string;
  /** Short flavour blurb shown in the modal header */
  storyContext: string;
  /** Points awarded on solve */
  points: number;
  /** The main question / prompt */
  prompt: string;
  /** Optional code block (shown with line numbers) */
  code?: string;
  /** Placeholder text for the answer field */
  placeholder: string;
  /** Answer validation — regex tested against trimmed input */
  answer: RegExp;
  /** Hint shown by Vision power */
  vision: string;
  /** Hint shown by Will's power */
  signal: string;
  /** Hint shown by Eleven's Force power */
  force: string;
  // ── Connection task extras ──────────────────────────────────────────────
  pairs?: Array<{ from: string; to: string }>;
  // ── Rearrange task extras ───────────────────────────────────────────────
  tiles?: string[];
  correctOrder?: string[];
  // ── Radio task extras ───────────────────────────────────────────────────
  frequency?: string;          // e.g. "87.6"
  morseMessage?: string;       // dots & dashes to display
  morseTranslation?: string;   // full decoded string (shown after solve)
}

// ─────────────────────────────────────────────────────────────────────────────
//  5 TASKS  (edit freely; answer is always the pin digit)
// ─────────────────────────────────────────────────────────────────────────────
export const RADIOMETER_TASKS: RadiometerTask[] = [
  // PIN 0 — Radio / Tuning dial
  {
    id: "rm0",
    type: "radio",
    objectLabel: "TUNING DIAL",
    storyContext: "A weak carrier wave. Tune to the right frequency.",
    points: 120,
    prompt:
      "Tune the dial to 87.6 MHz. A burst of Morse code emerges from the static. Decode it to reveal the first pin digit.",
    placeholder: "decoded digit (0-9)",
    frequency: "87.6",
    morseMessage: "---.. ",   // Morse for "8"  →  digit 8
    morseTranslation: "8",
    answer: /^8$/,
    vision: "Morse '----..' — count the dashes. Three and then two.",
    signal: "The carrier broadcasts a single digit. It is between 7 and 9.",
    force: "Eight.",
  },
  // PIN 1 — Series / Blip pattern
  {
    id: "rm1",
    type: "series",
    objectLabel: "BLIP PANEL",
    storyContext: "Pulses arrive in a pattern. Find what comes next.",
    points: 100,
    prompt: "The transmitter fires blips in this sequence: 2, 4, 8, 16, ?",
    placeholder: "next number",
    answer: /^32$/,
    vision: "Each value is the previous doubled.",
    signal: "Powers of two: 2¹ 2² 2³ 2⁴ …",
    force: "Thirty-two.",
  },
  // PIN 2 — Connection / Wire patch-bay
  {
    id: "rm2",
    type: "connection",
    objectLabel: "PATCH BAY",
    storyContext: "Four cables. Four ports. Wrong patch, wrong signal.",
    points: 130,
    prompt:
      "Connect each SOURCE cable to its matching PORT. When all four are correct the third pin digit is decoded.",
    placeholder: "type the decoded digit shown after patching",
    pairs: [
      { from: "TOWER",  to: "ANTENNA" },
      { from: "POWER",  to: "GRID" },
      { from: "SIGNAL", to: "RELAY" },
      { from: "DATA",   to: "BUFFER" },
    ],
    answer: /^4$/,
    vision: "TOWER→ANTENNA · POWER→GRID · SIGNAL→RELAY · DATA→BUFFER",
    signal: "The decoded digit appears at the top of the panel after all four wires connect.",
    force: "Four.",
  },
  // PIN 3 — Rearrange / Scrambled log
  {
    id: "rm3",
    type: "rearrange",
    objectLabel: "TORN LOG",
    storyContext: "A transmission log, shredded. Piece it back together.",
    points: 110,
    prompt:
      "The log segments are out of order. Drag them into the correct sequence. The highlighted number in the restored message is pin four.",
    tiles: ["FREQUENCY", "IS", "LOCKED", "AT", "CHANNEL", "SEVEN"],
    correctOrder: ["FREQUENCY", "IS", "LOCKED", "AT", "CHANNEL", "SEVEN"],
    placeholder: "the highlighted number in the restored message",
    answer: /^7$/,
    vision: "The restored message reads: FREQUENCY IS LOCKED AT CHANNEL SEVEN.",
    signal: "The final word is the digit.",
    force: "Seven.",
  },
  // PIN 4 — Debug terminal / code snippet
  {
    id: "rm4",
    type: "debug",
    objectLabel: "DEBUG TERMINAL",
    storyContext: "The terminal crashed. Read what it would have printed.",
    points: 140,
    prompt: "The backup process dumps this snippet before dying. What does it print?",
    code: `let x = 0;\nfor (let i = 1; i <= 5; i++) {\n  if (i % 2 !== 0) x += i;\n}\nconsole.log(x);`,
    placeholder: "output",
    answer: /^9$/,
    vision: "The loop picks odd numbers: 1, 3, 5. Their sum is the digit.",
    signal: "1 + 3 + 5 = ?",
    force: "Nine.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  5 PINS  (each mapped to a task by taskIndex)
// ─────────────────────────────────────────────────────────────────────────────
export const RADIOMETER_PINS: RadiometerPin[] = [
  { taskIndex: 0, digit: "8", label: "FREQ" },
  { taskIndex: 1, digit: "3", label: "SEQN" },   // 32 → tens digit dropped, 3 used for variation
  { taskIndex: 2, digit: "4", label: "WIRE" },
  { taskIndex: 3, digit: "7", label: "LOG" },
  { taskIndex: 4, digit: "9", label: "SYS" },
];

/**
 * The 5-digit code the player must type at the keypad.
 * Must equal RADIOMETER_PINS[0..4].digit concatenated.
 * Keep in sync manually if you edit the digits above.
 */
export const FINAL_CODE = "83479";

/** Approximate placement angle (degrees, 0 = right, CCW) for each task object
 *  around the instrument face — used by the scene to position click targets. */
export const TASK_ANGLES = [200, 250, 310, 130, 70] as const;
