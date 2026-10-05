/**
 * THE HAWKINS PROTOCOL - DIALOGUE & LORE LINES
 * 
 * Pip (the RADIO KID) speaks in a fast, energetic, enthusiastic voice,
 * obsessed with carrier frequencies, RF harmonics, Morse code, and antenna tuning.
 */

export interface PipDialogue {
  intro: string[];
  correct: string[];
  wrong: string[];
  hint: string[];
  powerUsed: string[];
  taskComplete: string[];
  idleNudge: string[];
  reactions: {
    signalJam: string[];
    corrupt: string[];
    glitch: string[];
    lock: string[];
  };
}

export const PIP_DIALOGUE: PipDialogue = {
  intro: [
    "Whoa, hey! You made it up East Hill! I'm Pip—I've been monitoring these wild 14.3 MHz harmonics all night on my rig!",
    "Listen! The carrier wave is totally scrambled by dimensional interference. We have to restore all 5 pins on this radiometer to decode the Lab security cipher!",
    "Grab the controls! Start with the VLF dial—sweep the band until the carrier whistle drops pitch. I'll call out the signal strength!",
  ],
  correct: [
    "YES! Did you hear that frequency lock? Perfect resonance! That pin is locked in!",
    "BULLSEYE! The standing wave ratio just flattened out! Digit confirmed on the readout!",
    "Haha! That's it! Carrier lock engaged! The phosphor needle stopped jittering!",
    "Outstanding! The RF pre-amp just decoded the harmonic! We're burning through these pins!",
    "Boom! Crystal filter locked in! The relay clicked—that's another digit for the cipher!",
  ],
  wrong: [
    "Static! Whoa, that's not the right band. Check your frequency math and sweep the dial again!",
    "Scratch that! We're picking up phase noise. Back off the dial and re-align the carrier!",
    "Nope, that gave us impedance mismatch! Listen to the pitch of the tone—it's drifting!",
    "Oof, false harmonic! Don't worry, even Marconi made miscalculations. Try another value!",
  ],
  hint: [
    "Tune to 87.6. Slowly! You'll hear it fade in. When you get close, the carrier whistle drops pitch!",
    "Remember: radio waves travel at the speed of light, but Morse code travels at the speed of your ears! Dots are short, dashes are three times longer!",
    "For the binary sequence: each byte is 8 bits. Powers of two double each step: 1, 2, 4, 8, 16, 32!",
    "Watch the oscilloscope trace! When the sine wave aligns without distortion, that's your sweet spot!",
    "The 5-digit security code for Hawkins Lab is generated directly by these 5 pins. Keep tuning!",
  ],
  powerUsed: [
    "WHOA! Did Eleven just amplify the RF stage?! The noise floor dropped 20 decibels—the carrier is crystal clear!",
    "My headset is tingling! Whatever power you just cast, it bypassed the atmospheric attenuation completely!",
    "Look at the phosphor scope! The trace just locked into a perfect Lissajous pattern! Use that hint fast!",
  ],
  taskComplete: [
    "WE GOT ALL FIVE PINS! Look at the display: 8-3-4-7-9! That's the master Lab security passcode!",
    "Unbelievable! All 5 pins calibrated! Punch 8-3-4-7-9 into the Hawkins Lab Sublevel 4 mainframe and we're IN!",
    "Signal fully restored across all Roane County repeaters! You're a natural on the radio rig!",
  ],
  idleNudge: [
    "Hey, you still with me? The repeater beacon pulses every three seconds—keep sweeping the dial!",
    "Don't let the signal fade into the noise floor! Try adjusting the fine-tuning knob!",
    "I'm keeping watch on the dipole antenna. Whenever you're ready, let's lock in the next pin!",
  ],
  reactions: {
    signalJam: [
      "GAH! A massive RF surge just overloaded my antenna preamp! My meter's pegged at maximum distortion—hang on, let me recalibrate!",
      "Signal jammed! The atmospheric noise is screaming through my cans! Vecna's flooding the band with psychic static!",
    ],
    corrupt: [
      "What the heck?! Something is bleeding through the carrier wave with eldritch noise! The characters are scrambling on the readout!",
      "Corrupted packets detected! The telemetry runes are twisting—focus on the core carrier frequency!",
    ],
    glitch: [
      "WHOA! Did you see that spark across the CRT? The line transformer just jumped—Vecna knows we're on this frequency!",
      "Glitch spike! My oscilloscope trace just fractured into chromatic static! Keep your hands on the dials!",
    ],
    lock: [
      "Blast it! The inputs just locked up under an access denied override! We're under targeted counter-surveillance!",
      "Access denied! The servo motors in the radiometer just jammed solid—he's locking us out of the circuit!",
    ],
  },
};

export const CHARACTER_DIALOGUES: Record<string, { intro: string[]; hint: string[]; correct: string[]; wrong: string[] }> = {
  dot: {
    intro: [
      "Hawkins Municipal Dispatch. I've been tracking these anomalous telemetry spikes across Roane County all evening.",
      "All public utility repeaters are oscillating out of band. Verify your Department of Energy clearance code so I can unlock the classified grid.",
    ],
    hint: [
      "Check the 1983 incident records: Project MKUltra was conducted deep down in Sublevel 04 of Hawkins Lab.",
    ],
    correct: [
      "Clearance confirmed! The dispatch logs match. Passing Chief Hopper's incident board to your terminal now.",
    ],
    wrong: [
      "Access denied on that clearance code. The Hawkins town archive rejected that file.",
    ],
  },
  callahan: {
    intro: [
      "Officer Callahan here. Keep your eyes sharp—utility transformers blew across the county square.",
      "Verify your Department of Energy clearance code so we can cross into the classified records.",
    ],
    hint: [
      "Check the 1983 incident records. Project MKUltra was conducted deep down in Sublevel 04.",
    ],
    correct: [
      "Clearance verified! That matches precinct dispatch records. Good work, recon.",
    ],
    wrong: [
      "Negative, that clearance code doesn't match the state police archive. Try another file.",
    ],
  },
  brenner: {
    intro: [
      "Dr. Brenner. The Sublevel 3 telemetry buffer has suffered a parity logic overflow.",
      "Trace the accumulator routine and calculate the loop's output integer to stabilize the gateway.",
    ],
    hint: [
      "Trace each step through the register. Watch how the parity accumulator adds and shifts.",
    ],
    correct: [
      "Precise calculation. Mainframe telemetry buffer stabilized.",
    ],
    wrong: [
      "Incorrect output integer. The parity checksum failed. Recalculate the loop.",
    ],
  },
  hopper: {
    intro: [
      "Chief Hopper. We've got transformer explosions and RF spikes heading straight for Hawkins Lab.",
      "Correlate the evidence timestamps and find the epicenter before the perimeter is locked down.",
    ],
    hint: [
      "Compare the East Hill RF repeater spike at 23:15 with the diner sighting. All vectors converge on one site.",
    ],
    correct: [
      "Deduction confirmed! All evidence points straight at Hawkins National Laboratory.",
    ],
    wrong: [
      "That location doesn't fit the telemetry vectors. Check the dispatch timeline again.",
    ],
  },
  byers: {
    intro: [
      "He's talking through the walls! The Christmas lights... they pulse when Will tries to speak!",
      "Reconstruct the scrambled warning fragments before the interference cuts him off!",
    ],
    hint: [
      "The message starts with an urgent warning: DO NOT OPEN...",
    ],
    correct: [
      "The lights flashed in sequence! You decoded Will's message!",
    ],
    wrong: [
      "The bulbs flickered erratically. That order isn't matching his rhythm.",
    ],
  },
  ranger: {
    intro: [
      "Ranger patrol reporting deep in the Roane County woods. Temperature dropped 20 degrees in seconds.",
      "Strange geometric glyphs and digits are carved into the ancient pines. Find the coordinate vector!",
    ],
    hint: [
      "Three digits carved along the tree trunks from left to right: 4 · 1 · 7.",
    ],
    correct: [
      "Coordinates verified! Vector 4-1-7 points directly toward the rift perimeter.",
    ],
    wrong: [
      "That vector leads into deep marshland. Look for the three glowing pine runes.",
    ],
  },
  vecna: {
    intro: [
      "You have journeyed far into the dark, little flies...",
      "The grandfather clock ticks for Hawkins. The dimensional veil belongs to me.",
    ],
    hint: [
      "The first subject was cast into the abyss in 1979. Shift the ROT13 cipher back 13 steps.",
    ],
    correct: [
      "A momentary disruption... but the gateway remains bound to the clock!",
    ],
    wrong: [
      "Flesh and bone crumble before the truth. Try again, recon.",
    ],
  },
};

/**
 * Return a random line from Pip's dialogue category
 */
export function getPipLine(
  category: keyof PipDialogue,
  subKey?: keyof PipDialogue["reactions"]
): string {
  if (category === "reactions" && subKey) {
    const list = PIP_DIALOGUE.reactions[subKey] || PIP_DIALOGUE.reactions.glitch;
    return list[Math.floor(Math.random() * list.length)];
  }
  const list = PIP_DIALOGUE[category] as string[];
  if (!list || list.length === 0) return PIP_DIALOGUE.intro[0];
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Return dialogue line for any character by character ID
 */
export function getCharacterLine(
  charId: string,
  category: "intro" | "hint" | "correct" | "wrong"
): string {
  if (charId === "radiokid") {
    return getPipLine(category as keyof PipDialogue);
  }
  const charDef = CHARACTER_DIALOGUES[charId];
  if (charDef && charDef[category] && charDef[category].length > 0) {
    const list = charDef[category];
    return list[Math.floor(Math.random() * list.length)];
  }
  return "STANDBY... TELEMETRY CHANNEL ACTIVE.";
}
