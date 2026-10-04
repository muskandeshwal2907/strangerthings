export type StageId =
  | "hawkins"
  | "lab"
  | "will"
  | "forest"
  | "gate"
  | "upsidedown"
  | "origin"
  | "mind"
  | "final"
  | "ending";

export type Category = "tech" | "puzzle" | "clue";

export interface Challenge {
  id: string;
  title: string;
  category: Category;
  points: number;
  prompt: string;
  code?: string; // shown in a code window
  placeholder?: string;
  answer: RegExp; // NOTE: demo only. In production, validate on the server.
  vision: string; // Vision power: reveals hidden info
  signal: string; // Will's power: detects a hidden signal
  force: string; // Eleven's power: one special clue
}

export interface Stage {
  id: StageId;
  chapter: string;
  title: string;
  subtitle: string;
  theme: "normal" | "upside";
  story: string[];
  challenges: Challenge[];
  reward?: string; // inventory item id granted on completion
}

export interface Item {
  id: string;
  name: string;
  glyph: string;
  desc: string;
}

export const ITEMS: Record<string, Item> = {
  "key-alpha": { id: "key-alpha", name: "Key Fragment α", glyph: "α", desc: "Recovered from the Hawkins signal." },
  "key-beta": { id: "key-beta", name: "Key Fragment β", glyph: "β", desc: "Pulled from the Lab's sealed archive." },
  "key-gamma": { id: "key-gamma", name: "Key Fragment γ", glyph: "γ", desc: "Hidden in the forest, near the old trail." },
  "file-will": { id: "file-will", name: "Subject File 003", glyph: "▤", desc: "A file that mentions Will Byers." },
  "note-forest": { id: "note-forest", name: "Trail Marker Notes", glyph: "✎", desc: "Three carved digits: 4 · 1 · 7" },
};

export const STAGE_ORDER: StageId[] = [
  "hawkins", "lab", "will", "forest", "gate", "upsidedown", "origin", "mind", "final", "ending",
];

const ch = (c: Challenge) => c;

export const STAGES: Record<StageId, Stage> = {
  hawkins: {
    id: "hawkins",
    chapter: "CHAPTER I",
    title: "HAWKINS",
    subtitle: "Indiana · Nov 6th · 11:47 PM",
    theme: "normal",
    story: [
      "Welcome to Hawkins. The streetlights are on. The town is asleep.",
      "But the power grid is humming at a frequency it shouldn't.",
      "Something is transmitting. Decode the signal before it stops.",
    ],
    reward: "key-alpha",
    challenges: [
      ch({
        id: "h1", title: "THE SIGNAL", category: "puzzle", points: 100,
        prompt: "A looping binary burst is coming from the radio tower. Decode it to text.",
        code: "01001000 01000001 01010111 01001011 01001001 01001110 01010011",
        placeholder: "decoded word",
        answer: /^hawkins$/i,
        vision: "Each 8-bit group is one ASCII character.",
        signal: "The first group, 01001000, is the letter H.",
        force: "Seven bytes → a seven-letter name. The town you're standing in.",
      }),
      ch({
        id: "h2", title: "BROKEN LOOP", category: "tech", points: 150,
        prompt: "The grid controller crashes on this routine. What does it print?",
        code: `function sum(arr) {\n  let t = 0;\n  for (let i = 0; i <= arr.length; i++) {\n    t += arr[i];\n  }\n  return t;\n}\nconsole.log(sum([1, 2, 3]));`,
        placeholder: "output",
        answer: /^nan$/i,
        vision: "Look at the loop condition: <= instead of <.",
        signal: "arr[3] does not exist.",
        force: "number + undefined = ?",
      }),
      ch({
        id: "h3", title: "THE PATTERN", category: "puzzle", points: 100,
        prompt: "Power draw spikes in a pattern. What is the next value?",
        code: "2, 6, 12, 20, 30, ?",
        placeholder: "next number",
        answer: /^42$/,
        vision: "Each term is n × (n + 1).",
        signal: "Differences: 4, 6, 8, 10 …",
        force: "6 × 7.",
      }),
    ],
  },
  lab: {
    id: "lab",
    chapter: "CHAPTER II",
    title: "HAWKINS LAB",
    subtitle: "Sublevel 4 · Restricted",
    theme: "normal",
    story: [
      "The tower leads you underground. A door that should be sealed is open.",
      "Terminals are still running. Subject files. Experiment logs.",
      "One file is not like the others. It has a name you recognise.",
    ],
    reward: "key-beta",
    challenges: [
      ch({
        id: "l1", title: "ACCESS CIPHER", category: "tech", points: 150,
        prompt: "The door terminal wants a passphrase. The hint file is Caesar-shifted by 3.",
        code: "DFFHVV JUDQWHG",
        placeholder: "plain text",
        answer: /^access\s+granted$/i,
        vision: "Shift each letter back by 3. D → A.",
        signal: "Two words. The second ends in -ED.",
        force: "ACCESS … ?",
      }),
      ch({
        id: "l2", title: "SUBJECT NAME", category: "puzzle", points: 100,
        prompt: "Subject 011's name is stored as hex. Decode it.",
        code: "45 4C 45 56 45 4E",
        placeholder: "name",
        answer: /^eleven$/i,
        vision: "0x45 = E, 0x4C = L.",
        signal: "It is a number, spelled out.",
        force: "One more than ten.",
      }),
      ch({
        id: "l3", title: "FILE 003", category: "tech", points: 150,
        prompt: "File 003 is locked behind a checksum: the sum of the digits of 2 to the power of 15.",
        placeholder: "checksum",
        answer: /^26$/,
        vision: "2^15 = 32768.",
        signal: "3 + 2 + 7 + 6 + 8",
        force: "Twenty-six.",
      }),
    ],
  },
  will: {
    id: "will",
    chapter: "CHAPTER III",
    title: "WILL'S SIGNAL",
    subtitle: "Subject 003 · Byers, W.",
    theme: "normal",
    story: [
      "File 003 is a boy. Frightened, confused. Something speaks through him.",
      "His drawings, his taps on the wall, a hum he can't explain.",
      "He's trying to tell you something. Listen.",
    ],
    challenges: [
      ch({
        id: "w1", title: "THE TAPPING", category: "puzzle", points: 100,
        prompt: "Will taps in Morse code. What is he saying?",
        code: "-.-. .-.. --- ... . .-.",
        placeholder: "word",
        answer: /^closer$/i,
        vision: "-.-. = C, .-.. = L.",
        signal: "He wants you to come ___.",
        force: "Six letters, starts with CL.",
      }),
      ch({
        id: "w2", title: "BACKWARDS", category: "tech", points: 150,
        prompt: "His drawings arrive reversed. Restore the message.",
        code: "NWODEDISPU",
        placeholder: "message",
        answer: /^upsidedown$/i,
        vision: "Read it from the right.",
        signal: "Write a function: s.split('').reverse().join('')",
        force: "UPSIDE…",
      }),
      ch({
        id: "w3", title: "THE COUNT", category: "puzzle", points: 100,
        prompt: "He taps the wall: 1 1 2 3 5 8 … How many taps next?",
        placeholder: "number",
        answer: /^13$/,
        vision: "Each tap count is the sum of the previous two.",
        signal: "5 + 8",
        force: "Thirteen.",
      }),
    ],
  },
  forest: {
    id: "forest",
    chapter: "CHAPTER IV",
    title: "THE FOREST",
    subtitle: "Old trail · No signal",
    theme: "normal",
    story: [
      "The trail ends in the trees. Your flashlight is the only light.",
      "Marks carved into bark. Three of them. Move the light, find them.",
      "The forest remembers where the gate is.",
    ],
    reward: "key-gamma",
    challenges: [
      ch({
        id: "f1", title: "CARVED DIGITS", category: "clue", points: 150,
        prompt: "Find the three glowing marks in the forest (move your flashlight, click them). Enter the digits left to right.",
        placeholder: "3 digits",
        answer: /^417$/,
        vision: "They are carved at different heights, spread across the trees.",
        signal: "The first digit is on the far left, low.",
        force: "Four · One · Seven.",
      }),
      ch({
        id: "f2", title: "BASE64 BARK", category: "tech", points: 150,
        prompt: "A message is scratched into a trunk. Decode the Base64.",
        code: "VVBTSURF",
        placeholder: "decoded",
        answer: /^upside$/i,
        vision: "atob('VVBTSURF')",
        signal: "Six letters. Something Down.",
        force: "UPSIDE.",
      }),
      ch({
        id: "f3", title: "TRAIL LOGIC", category: "tech", points: 100,
        prompt: "What does this print?",
        code: `console.log([..."GATE"].reverse().join(""));`,
        placeholder: "output",
        answer: /^etag$/i,
        vision: "Spread, reverse, join.",
        signal: "Last letter first.",
        force: "E-T-A-G.",
      }),
    ],
  },
  gate: {
    id: "gate",
    chapter: "CHAPTER V",
    title: "THE GATE",
    subtitle: "A wound in the air",
    theme: "normal",
    story: [
      "The air tears open. Three sockets pulse in the dark.",
      "Three key fragments. You have been carrying them all along.",
      "Insert them. There is no coming back from this.",
    ],
    challenges: [],
  },
  upsidedown: {
    id: "upsidedown",
    chapter: "CHAPTER VI",
    title: "THE UPSIDE DOWN",
    subtitle: "Hawkins, 1986. Reflected.",
    theme: "upside",
    story: [
      "The colour drains. Ash falls like snow.",
      "Everything is Hawkins, but wrong. Corrupted. Breathing.",
      "The way out is sealed. Powers stir in you. Use them.",
    ],
    challenges: [
      ch({
        id: "u1", title: "N0DE C0RRUPT", category: "puzzle", points: 150,
        prompt: "The exit lock shows a corrupted sequence. Find the missing number.",
        code: "3, 9, 27, ?, 243",
        placeholder: "missing",
        answer: /^81$/,
        vision: "Each term is multiplied by 3.",
        signal: "3^4.",
        force: "Eighty-one.",
      }),
      ch({
        id: "u2", title: "ARR4Y D00M", category: "tech", points: 200,
        prompt: "Memory is bleeding. What does this log?",
        code: `const a = [1, 2, 3];\na.length = 1;\nconsole.log(a);`,
        placeholder: "e.g. [1, 2]",
        answer: /^\[\s*1\s*\]$/,
        vision: "Setting length truncates the array.",
        signal: "Only the first element survives.",
        force: "[ one ]",
      }),
      ch({
        id: "u3", title: "THE LOCK", category: "puzzle", points: 150,
        prompt: "The final seal asks for the sum of all integers from 1 to 100.",
        placeholder: "sum",
        answer: /^5050$/,
        vision: "n(n+1)/2",
        signal: "100 × 101 ÷ 2",
        force: "Five thousand and fifty.",
      }),
    ],
  },
  origin: {
    id: "origin",
    chapter: "CHAPTER VII",
    title: "THE ORIGIN",
    subtitle: "001 · Who opened the door?",
    theme: "upside",
    story: [
      "On the walls of the Lab, in red: a number, and a name, and a name behind the name.",
      "Reconstruct the story. Pin the evidence to the board.",
      "001. A boy. A monster.",
    ],
    challenges: [
      ch({
        id: "o1", title: "REDACTED NAME", category: "tech", points: 200,
        prompt: "Subject 001's name is ROT13-encoded in the file. Decode it.",
        code: "URAEL PERRY",
        placeholder: "full name",
        answer: /^henry\s+creel$/i,
        vision: "ROT13: shift by 13. U → H.",
        signal: "Two words. First name Henry.",
        force: "H-E-N-R-Y  C-R-E-E-L.",
      }),
      ch({
        id: "o2", title: "ALIAS TABLE", category: "tech", points: 150,
        prompt: "What does this print?",
        code: `const alias = { "001": "Vecna", "011": "Eleven" };\nconsole.log(alias["001"]);`,
        placeholder: "output",
        answer: /^vecna$/i,
        vision: "Object lookup by key.",
        signal: "The key is the string '001'.",
        force: "The name you fear.",
      }),
      ch({
        id: "o3", title: "THE LINK", category: "puzzle", points: 150,
        prompt: "Access key: reverse the word LAB, then append the number of letters in UPSIDEDOWN.",
        placeholder: "key",
        answer: /^bal10$/i,
        vision: "LAB reversed is BAL.",
        signal: "UPSIDEDOWN has ten letters.",
        force: "BAL + 10.",
      }),
    ],
  },
  mind: {
    id: "mind",
    chapter: "CHAPTER VIII",
    title: "VECNA'S MIND",
    subtitle: "He knows you are here.",
    theme: "upside",
    story: [
      "The clock strikes. Vecna has found you.",
      "He doesn't need to touch your machine. He only needs to touch your thoughts.",
      "Stay sharp. Solve fast. He will interfere.",
    ],
    challenges: [
      ch({
        id: "m1", title: "TICK", category: "puzzle", points: 150,
        prompt: "How much is 2 to the power of 10?",
        placeholder: "number",
        answer: /^1024$/,
        vision: "2^5 = 32. Square it.",
        signal: "A kilobyte, in some conventions.",
        force: "1024.",
      }),
      ch({
        id: "m2", title: "TOCK", category: "tech", points: 200,
        prompt: "For i = 15, what does the classic FizzBuzz print?",
        placeholder: "output",
        answer: /^fizzbuzz$/i,
        vision: "15 is divisible by both 3 and 5.",
        signal: "One word, no space.",
        force: "FizzBuzz.",
      }),
      ch({
        id: "m3", title: "CHIME", category: "puzzle", points: 150,
        prompt: "How many times does the digit 1 appear when writing every number from 1 to 20?",
        placeholder: "count",
        answer: /^12$/,
        vision: "11 has two. 10 and 12–19 have one each.",
        signal: "1 + 1 + 2 + 8.",
        force: "Twelve.",
      }),
    ],
  },
  final: {
    id: "final",
    chapter: "FINAL CHAPTER",
    title: "WILL TAKES CONTROL",
    subtitle: "Break the connection.",
    theme: "upside",
    story: [
      "The signal changes. It is not Vecna's. It is Will's.",
      "He is not the prisoner anymore. He is the door, and he holds it.",
      "Decode his signal. Find the weakness. Close the gate.",
    ],
    challenges: [
      ch({
        id: "x1", title: "DECODE THE SIGNAL", category: "tech", points: 200,
        prompt: "Will's signal arrives in hex. Decode it.",
        code: "57 49 4C 4C",
        placeholder: "word",
        answer: /^will$/i,
        vision: "0x57 = W.",
        signal: "Four letters. His own name.",
        force: "W-I-L-L.",
      }),
      ch({
        id: "x2", title: "FIND THE WEAKNESS", category: "puzzle", points: 200,
        prompt: "Vecna's weakness is the clock. A clock chimes the hour. How many chimes in a 24-hour day?",
        placeholder: "chimes",
        answer: /^156$/,
        vision: "1+2+…+12 = 78, twice a day.",
        signal: "78 × 2.",
        force: "One hundred fifty-six.",
      }),
      ch({
        id: "x3", title: "RESTORE THE CONNECTION", category: "tech", points: 200,
        prompt: "What does this print?",
        code: `console.log("5" + 3 - 1);`,
        placeholder: "output",
        answer: /^52$/,
        vision: "+ concatenates, - coerces.",
        signal: '"53" - 1',
        force: "Fifty-two.",
      }),
      ch({
        id: "x4", title: "BREAK HIS CONTROL", category: "tech", points: 250,
        prompt: "What does this evaluate to?",
        code: `[1, 2, 3].map(x => x * x).reduce((a, b) => a + b)`,
        placeholder: "number",
        answer: /^14$/,
        vision: "1 + 4 + 9.",
        signal: "Sum of squares.",
        force: "Fourteen.",
      }),
      ch({
        id: "x5", title: "CLOSE THE GATE", category: "puzzle", points: 300,
        prompt: "The final seal needs 42 in binary.",
        placeholder: "binary",
        answer: /^0*101010$/,
        vision: "32 + 8 + 2.",
        signal: "Six bits.",
        force: "101010.",
      }),
    ],
  },
  ending: {
    id: "ending",
    chapter: "EPILOGUE",
    title: "HAWKINS RESTORED",
    subtitle: "The gate is closed.",
    theme: "normal",
    story: [],
    challenges: [],
  },
};

export const TOTAL_TIME = 90 * 60; // seconds
