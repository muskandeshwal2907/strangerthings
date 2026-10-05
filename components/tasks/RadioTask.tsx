"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StoryTask } from "@/lib/tasks";
import { sfx, setRadioStatic } from "@/lib/audio";

interface RadioTaskProps {
  task: StoryTask;
  solved: boolean;
  onSolve: (points: number, answerText: string) => void;
  disabled?: boolean;
}

export default function RadioTask({ task, solved, onSolve, disabled }: RadioTaskProps) {
  const data = task.radioData;
  if (!data) return null;

  const target = data.targetFrequency || 87.6;
  const tolerance = data.tolerance || 0.35;

  const [frequency, setFrequency] = useState<number>(solved ? target : 89.4);
  const [inputVal, setInputVal] = useState("");
  const [showHelper, setShowHelper] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDragging = useRef(false);

  // Proximity: 0 (far) to 1 (exact match)
  const diff = Math.abs(frequency - target);
  const proximity = Math.max(0, 1 - diff / 2.5);
  const isTuned = diff <= tolerance;

  // Manage WebAudio radio static volume based on proximity
  useEffect(() => {
    if (disabled) {
      setRadioStatic(0);
      return;
    }
    // High static when far, zero static when fully tuned
    const staticVolume = isTuned ? 0.05 : (1 - proximity) * 0.4;
    setRadioStatic(staticVolume);
    return () => setRadioStatic(0);
  }, [proximity, isTuned, disabled]);

  // Animated Waveform Canvas
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.05;
      const w = cvs.width;
      const h = cvs.height;
      const mid = h / 2;

      ctx.fillStyle = "rgba(10, 15, 20, 0.4)";
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = "rgba(54, 224, 196, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += 30) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += 20) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Waveform line
      ctx.beginPath();
      const waveColor = isTuned ? "#36e0c4" : "#ffb454";
      ctx.strokeStyle = waveColor;
      ctx.lineWidth = isTuned ? 2.5 : 1.5;
      ctx.shadowBlur = isTuned ? 10 : 3;
      ctx.shadowColor = waveColor;

      const noiseAmp = (1 - proximity) * 26;
      const signalAmp = proximity * 28 + 4;

      for (let x = 0; x < w; x += 2) {
        const noise = (Math.random() - 0.5) * noiseAmp;
        const sine = Math.sin((x * 0.04) + t * (isTuned ? 3 : 1)) * signalAmp;
        const y = mid + sine + noise;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [proximity, isTuned]);

  const handleDialChange = (newFreq: number) => {
    if (disabled || solved) return;
    const clamped = Math.min(94.0, Math.max(85.0, Number(newFreq.toFixed(1))));
    setFrequency(clamped);
    sfx("dial");
  };

  const playMorseAudio = () => {
    if (!data.morseCode) return;
    const chars = data.morseCode.split("");
    let delay = 0;
    chars.forEach((c) => {
      if (c === ".") {
        setTimeout(() => sfx("morseDot"), delay);
        delay += 120;
      } else if (c === "-") {
        setTimeout(() => sfx("morseDash"), delay);
        delay += 260;
      } else {
        delay += 180;
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || solved || !inputVal.trim()) return;

    if (!isTuned) {
      sfx("err");
      setErrorShake(true);
      setErrorMsg("RECEIVER UNALIGNED · TUNE TO 87.6 MHz CARRIER");
      setTimeout(() => setErrorShake(false), 600);
      return;
    }

    if (data.answer.test(inputVal.trim())) {
      sfx("ok");
      onSolve(task.points, inputVal.trim());
    } else {
      sfx("err");
      setErrorShake(true);
      setErrorMsg("DECODE MISMATCH · INCORRECT TRANSCRIPT");
      setTimeout(() => setErrorShake(false), 600);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        background: "rgba(10, 14, 20, 0.95)",
        border: "1px solid rgba(54, 224, 196, 0.35)",
        borderRadius: 6,
        padding: "24px 22px",
        fontFamily: "var(--font-term)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent2)" }}>
            RF SPECTRUM MONITOR · VLF RECEIVER
          </div>
          <div style={{ fontSize: 20, color: "#fff" }}>{task.title}</div>
        </div>
        <div
          style={{
            border: `1px solid ${isTuned ? "var(--accent2)" : "rgba(255,255,255,0.2)"}`,
            color: isTuned ? "var(--accent2)" : "var(--dim)",
            padding: "3px 8px",
            fontSize: 13,
            borderRadius: 2,
            letterSpacing: ".1em",
          }}
        >
          {isTuned ? "● CARRIER LOCKED" : "○ SEARCHING"}
        </div>
      </div>

      <div style={{ fontSize: 16, color: "var(--dim)", marginBottom: 16 }}>
        {task.question} Drag the frequency dial to 87.6 MHz, observe the oscilloscope clarify, then decode the message.
      </div>

      {/* Waveform Canvas & Signal Readout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 16, marginBottom: 18 }}>
        <div style={{ position: "relative", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(54,224,196,0.3)" }}>
          <canvas ref={canvasRef} width={480} height={130} style={{ display: "block", width: "100%", height: 130, background: "#06090e" }} />
          <div style={{ position: "absolute", top: 8, left: 10, fontSize: 13, color: "var(--accent2)", letterSpacing: ".1em" }}>
            LIVE RF SPECTRUM · 85–94 MHz
          </div>
        </div>

        {/* Signal Needle Meter */}
        <div
          style={{
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 4,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div className="eyebrow" style={{ fontSize: 11 }}>SIGNAL STRENGTH</div>
            <div style={{ fontSize: 24, color: isTuned ? "var(--accent2)" : "var(--accent)", fontWeight: "bold" }}>
              {(proximity * 100).toFixed(0)}%
            </div>
            <div className="term dim" style={{ fontSize: 12 }}>
              {isTuned ? "SIGNAL: STRONG" : proximity > 0.4 ? "SIGNAL: WEAK" : "SIGNAL: NOISE"}
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ fontSize: 11 }}>TUNED FREQUENCY</div>
            <div style={{ fontSize: 26, color: "#fff", fontFamily: "var(--font-mono)" }}>
              {frequency.toFixed(1)} <span style={{ fontSize: 14, color: "var(--dim)" }}>MHz</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Frequency Dial Slider */}
      <div style={{ background: "rgba(0,0,0,0.35)", padding: "14px 18px", borderRadius: 4, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span className="eyebrow" style={{ fontSize: 12 }}>TUNING DIAL</span>
          <span style={{ color: "var(--accent2)", fontSize: 14 }}>TARGET: 87.6 MHz</span>
        </div>
        <input
          type="range"
          min="85.0"
          max="92.0"
          step="0.1"
          value={frequency}
          onChange={(e) => handleDialChange(parseFloat(e.target.value))}
          disabled={disabled || solved}
          style={{
            width: "100%",
            accentColor: isTuned ? "var(--accent2)" : "var(--accent)",
            cursor: disabled || solved ? "default" : "pointer",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--dim)", marginTop: 4 }}>
          <span>85.0 MHz</span>
          <span>87.6 MHz (BEACON)</span>
          <span>92.0 MHz</span>
        </div>
      </div>

      {/* Broadcast Message to Decode */}
      <div style={{ background: "rgba(54,224,196,0.06)", border: "1px solid rgba(54,224,196,0.25)", borderRadius: 4, padding: "14px 16px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span className="eyebrow" style={{ color: "var(--accent2)" }}>INCOMING TELEMETRY STREAM</span>
          {data.morseCode && (
            <button
              type="button"
              className="btn sm ghost"
              onClick={playMorseAudio}
              style={{ fontSize: 13, padding: "2px 8px" }}
            >
              ▶ PLAY AUDIO TONE
            </button>
          )}
        </div>

        {/* Display Morse or Binary */}
        <div style={{ fontSize: 20, fontFamily: "var(--font-mono)", color: isTuned ? "#fff" : "rgba(255,255,255,0.4)", letterSpacing: ".2em", filter: isTuned ? "none" : "blur(2px)", transition: "filter .3s" }}>
          {data.morseCode ? data.morseCode : data.binaryCode}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <button
            type="button"
            className="term dim"
            onClick={() => setShowHelper(!showHelper)}
            style={{ background: "none", border: "none", color: "var(--accent2)", cursor: "pointer", fontSize: 14 }}
          >
            {showHelper ? "▼ HIDE DECODE CHART" : "▶ SHOW DECODE HELPER CHART"}
          </button>
        </div>

        {/* Expandable Morse / Binary Cheat Sheet */}
        {showHelper && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed rgba(255,255,255,0.1)", fontSize: 13, color: "var(--dim)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 6 }}
          >
            <div><b>H:</b> ....</div>
            <div><b>E:</b> .</div>
            <div><b>L:</b> .-..</div>
            <div><b>P:</b> .--.</div>
            <div><b>W:</b> .--</div>
            <div><b>I:</b> ..</div>
            <div><b>01001000:</b> H</div>
            <div><b>01000101:</b> E</div>
            <div><b>01001100:</b> L</div>
            <div><b>01010000:</b> P</div>
          </motion.div>
        )}
      </div>

      {/* Decode text input */}
      <form onSubmit={handleSubmit} className={errorShake ? "shake" : ""}>
        <label className="lbl">ENTER DECODED TRANSMISSION</label>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="field"
            value={solved ? "HELP WILL" : inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              sfx("type");
            }}
            disabled={disabled || solved}
            placeholder={data.placeholder || "DECODED WORD"}
            style={{ fontSize: 18, fontFamily: "var(--font-mono)" }}
          />
          <button className="btn" disabled={disabled || solved || !inputVal.trim()}>
            TRANSMIT
          </button>
        </div>
      </form>

      {/* Error message */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ color: "var(--danger)", marginTop: 10, fontSize: 15 }}
          >
            [ERROR] {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success banner */}
      {solved && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            marginTop: 18,
            padding: "14px 18px",
            background: "rgba(54, 224, 196, 0.12)",
            border: "1px solid var(--accent2)",
            borderRadius: 4,
            color: "var(--accent2)",
            fontSize: 18,
            letterSpacing: ".1em",
          }}
        >
          <div style={{ fontWeight: "bold" }}>[DECODED] TRANSMISSION LOCKED &amp; DECODED (+{task.points} PTS)</div>
          {task.storyClue && (
            <div style={{ fontSize: 15, color: "#fff", marginTop: 6, opacity: 0.9 }}>
              {task.storyClue}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
