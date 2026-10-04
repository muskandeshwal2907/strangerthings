"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/store";
import { RADIOMETER_PINS, RADIOMETER_TASKS, TASK_ANGLES } from "@/lib/radiometer";

/* ─── tiny canvas noise texture ─────────────────────────────────────── */
function NoiseCanvas({ opacity = 0.12 }: { opacity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let frame = 0;
    let id: number;
    const draw = () => {
      const w = c.width, h = c.height;
      const img = ctx.createImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      frame++;
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <canvas
      ref={ref}
      width={80}
      height={80}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, imageRendering: "pixelated", mixBlendMode: "screen", pointerEvents: "none" }}
    />
  );
}

/* ─── oscilloscope waveform (canvas) ────────────────────────────────── */
function OscilloscopeCanvas({ clarity }: { clarity: number }) {
  // clarity 0=chaotic 1=clean
  const ref = useRef<HTMLCanvasElement>(null);
  const clarityRef = useRef(clarity);
  clarityRef.current = clarity;
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let t = 0, id: number;
    const draw = () => {
      const w = c.width, h = c.height;
      ctx.clearRect(0, 0, w, h);
      const cl = clarityRef.current;
      // background glow
      ctx.fillStyle = "rgba(0,20,10,0.85)";
      ctx.fillRect(0, 0, w, h);
      // grid lines
      ctx.strokeStyle = "rgba(54,224,196,0.12)";
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx <= w; gx += w / 8) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
      for (let gy = 0; gy <= h; gy += h / 4) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
      // waveform
      ctx.beginPath();
      ctx.strokeStyle = cl > 0.8
        ? "rgba(54,224,196,0.95)"
        : cl > 0.4
        ? "rgba(100,220,180,0.8)"
        : "rgba(255,140,80,0.75)";
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = cl > 0.6 ? 8 : 2;
      ctx.shadowColor = cl > 0.6 ? "#36e0c4" : "#ff8050";
      for (let x = 0; x < w; x++) {
        const freq = cl > 0.7 ? 1 : 3 + (1 - cl) * 5;
        const noise = (1 - cl) * (Math.random() - 0.5) * h * 0.7;
        const y = h / 2
          + Math.sin((x / w) * Math.PI * 2 * freq + t) * (h * 0.3 * (0.3 + cl * 0.7))
          + noise;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      t += 0.05 + cl * 0.02;
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <canvas ref={ref} width={280} height={90}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

/* ─── single pin readout window ─────────────────────────────────────── */
const GLYPHS = "▓▒░01101010101▓X?#@";
function PinReadout({ solved, digit, label, distorted }: { solved: boolean; digit: string; label: string; distorted: boolean }) {
  const [glyph, setGlyph] = useState("▓");
  useEffect(() => {
    if (solved) return;
    const t = setInterval(() => setGlyph(GLYPHS[Math.floor(Math.random() * GLYPHS.length)]), 120);
    return () => clearInterval(t);
  }, [solved]);

  return (
    <div className={`rm-pin ${solved ? "rm-pin--solved" : distorted ? "rm-pin--distorted" : "rm-pin--idle"}`}>
      <div className="rm-pin__window" aria-label={solved ? `PIN: ${digit}` : "PIN: LOCKED"}>
        {solved
          ? <span className="rm-pin__digit glitch" data-text={digit}>{digit}</span>
          : <span className="rm-pin__glyph">{glyph}</span>
        }
      </div>
      <div className="rm-pin__led" aria-hidden />
      <div className="rm-pin__label">{label}</div>
    </div>
  );
}

/* ─── task node hotspot around the instrument ────────────────────────── */
function TaskNode({
  angleRad, label, solved, jammed, onClick,
}: { angleRad: number; label: string; solved: boolean; jammed: boolean; onClick: () => void }) {
  const R = 46; // % radius from center
  const cx = 50 + R * Math.cos(angleRad);
  const cy = 50 + R * Math.sin(angleRad);
  return (
    <motion.button
      className={`rm-tasknode ${solved ? "rm-tasknode--done" : jammed ? "rm-tasknode--jammed" : "rm-tasknode--active"}`}
      style={{ left: `${cx}%`, top: `${cy}%`, position: "absolute", transform: "translate(-50%,-50%)" }}
      whileHover={!solved && !jammed ? { scale: 1.15 } : undefined}
      whileTap={!solved && !jammed ? { scale: 0.95 } : undefined}
      onClick={!solved && !jammed ? onClick : undefined}
      disabled={solved || jammed}
      aria-label={`${label}${solved ? " – SOLVED" : jammed ? " – JAMMED" : ""}`}
    >
      <span className="rm-tasknode__icon">{solved ? "✔" : jammed ? "✖" : "◎"}</span>
      <span className="rm-tasknode__label">{label}</span>
    </motion.button>
  );
}

/* ─── main instrument SVG ────────────────────────────────────────────── */
export default function RadiometerScene() {
  const { s, sabotage, radiometerPinCount } = useGame();
  const rm = s.radiometer;
  const clarity = radiometerPinCount / 5;            // 0=noisy, 1=clean
  const jammed = sabotage?.kind === "SIGNAL_JAM";
  const [rotation, setRotation] = useState(0);

  // Inner dial rotation – speed tied to clarity
  useEffect(() => {
    let raf: number;
    const tick = () => {
      setRotation((r) => (r + 0.15 + clarity * 0.4) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clarity]);

  // Needle jitter (more stable as pins are solved)
  const jitter = jammed ? 30 : (5 - radiometerPinCount) * 12;
  const needleAngle = 45 + clarity * 90 + (Math.sin(Date.now() / 300) * jitter);

  return (
    <div className="rm-scene-wrap" role="img" aria-label="Radiometer instrument">
      {/* background phosphor glow */}
      <div className="rm-bg-glow" />

      {/* ── task hotspot nodes (positioned absolutely around instrument) */}
      {RADIOMETER_TASKS.map((task, i) => {
        const angleDeg = TASK_ANGLES[i];
        const angleRad = (angleDeg * Math.PI) / 180;
        return (
          <TaskNode
            key={task.id}
            angleRad={angleRad}
            label={task.objectLabel}
            solved={rm.pinsSolved[RADIOMETER_PINS[i]?.taskIndex ?? i]}
            jammed={jammed && task.type === "radio"}
            onClick={() => {/* handled by parent via prop */}}
          />
        );
      })}

      {/* ── main SVG instrument ── */}
      <svg
        viewBox="0 0 600 600"
        xmlns="http://www.w3.org/2000/svg"
        className="rm-svg"
        aria-hidden
      >
        <defs>
          <radialGradient id="rmFaceGrad" cx="50%" cy="45%" r="55%">
            <stop offset="0%"  stopColor="#0a1e14" />
            <stop offset="70%" stopColor="#040c08" />
            <stop offset="100%" stopColor="#020606" />
          </radialGradient>
          <radialGradient id="rmGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor={jammed ? "#ff3b45" : "#36e0c4"} stopOpacity="0.25" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="rmBlur"><feGaussianBlur stdDeviation="3" /></filter>
          <filter id="rmGlowF"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <clipPath id="rmFaceClip"><circle cx="300" cy="280" r="230" /></clipPath>
        </defs>

        {/* outer chassis ring */}
        <circle cx="300" cy="280" r="272" fill="#0a1010" stroke="#1e3830" strokeWidth="4" />
        <circle cx="300" cy="280" r="268" fill="none" stroke="#36e0c4" strokeWidth="1" opacity="0.3" />
        {/* outer glow halo */}
        <circle cx="300" cy="280" r="260" fill="url(#rmGlow)" filter="url(#rmBlur)" />

        {/* instrument face */}
        <circle cx="300" cy="280" r="230" fill="url(#rmFaceGrad)" />

        {/* tick marks (36 marks around face) */}
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i / 36) * 2 * Math.PI - Math.PI / 2;
          const r1 = i % 9 === 0 ? 192 : i % 3 === 0 ? 196 : 200;
          const r2 = 210;
          return (
            <line key={i}
              x1={300 + r1 * Math.cos(a)} y1={280 + r1 * Math.sin(a)}
              x2={300 + r2 * Math.cos(a)} y2={280 + r2 * Math.sin(a)}
              stroke={i % 9 === 0 ? "#36e0c4" : "#36e0c430"}
              strokeWidth={i % 9 === 0 ? 2 : 1}
            />
          );
        })}

        {/* frequency arc labels */}
        {["80", "84", "87.6", "92", "96", "100"].map((f, i) => {
          const a = (-0.6 + i * 0.24) * Math.PI;
          return (
            <text key={f}
              x={300 + 175 * Math.cos(a)} y={280 + 175 * Math.sin(a)}
              textAnchor="middle" dominantBaseline="middle"
              fill={f === "87.6" ? "#36e0c4" : "#36e0c455"}
              fontSize={f === "87.6" ? 14 : 11}
              fontFamily="'VT323', monospace"
            >{f}</text>
          );
        })}

        {/* rotating inner dial */}
        <g transform={`rotate(${rotation} 300 280)`} clipPath="url(#rmFaceClip)">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * 2 * Math.PI;
            return (
              <line key={i}
                x1={300} y1={280}
                x2={300 + 140 * Math.cos(a)} y2={280 + 140 * Math.sin(a)}
                stroke="#36e0c415" strokeWidth="1"
              />
            );
          })}
          <circle cx="300" cy="280" r="70" fill="none" stroke="#36e0c420" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="300" cy="280" r="110" fill="none" stroke="#36e0c412" strokeWidth="1" />
        </g>

        {/* tuning needle */}
        <g transform={`rotate(${needleAngle} 300 420)`}>
          <line x1="300" y1="420" x2="300" y2="130"
            stroke="#ffb454" strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#rmGlowF)"
            opacity={jammed ? 0.4 : 1}
          />
          <polygon points="300,118 294,138 306,138" fill="#ffb454" />
        </g>

        {/* needle pivot */}
        <circle cx="300" cy="420" r="10" fill="#0a1e14" stroke="#36e0c4" strokeWidth="2" />
        <circle cx="300" cy="420" r="4"  fill="#36e0c4" />

        {/* oscilloscope viewport */}
        <rect x="160" y="310" width="280" height="90" rx="4"
          fill="#020e06" stroke="#36e0c440" strokeWidth="1" />

        {/* instrument label */}
        <text x="300" y="176" textAnchor="middle"
          fill="#36e0c4" fontSize="13" fontFamily="'VT323', monospace" letterSpacing="4">
          HAWKINS TOWER RADIOMETER
        </text>
        <text x="300" y="192" textAnchor="middle"
          fill={jammed ? "#ff3b45" : "#ffb454"} fontSize="11" fontFamily="'VT323', monospace" letterSpacing="3">
          {jammed ? "── SIGNAL JAMMED ──" : `FREQ  ${(87.3 + clarity * 0.3 + (jammed ? 0 : Math.sin(Date.now() / 600) * 0.1)).toFixed(1)} MHz`}
        </text>

        {/* signal quality arc */}
        <path
          d={`M 110 420 A 200 200 0 0 1 490 420`}
          fill="none" stroke="#36e0c420" strokeWidth="16" strokeLinecap="round"
        />
        <path
          d={`M 110 420 A 200 200 0 0 1 490 420`}
          fill="none"
          stroke={jammed ? "#ff3b45" : "#36e0c4"}
          strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${clarity * 565} 565`}
          opacity={0.7}
          filter="url(#rmGlowF)"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />

        {/* bolt decorations */}
        {[[50,50],[550,50],[50,510],[550,510]].map(([bx, by], i) => (
          <g key={i}>
            <circle cx={bx} cy={by} r="8" fill="#0a1010" stroke="#36e0c440" strokeWidth="1" />
            <line x1={bx-4} y1={by} x2={bx+4} y2={by} stroke="#36e0c450" strokeWidth="1" />
            <line x1={bx} y1={by-4} x2={bx} y2={by+4} stroke="#36e0c450" strokeWidth="1" />
          </g>
        ))}

        {/* corner bracket decorations */}
        {([[22,22],[578,22],[22,558],[578,558]] as [number,number][]).map(([bx,by], i) => {
          const sx = i % 2 === 0 ? 1 : -1, sy = i < 2 ? 1 : -1;
          return (
            <g key={i} stroke="#36e0c460" strokeWidth="2" fill="none">
              <line x1={bx} y1={by} x2={bx + sx*22} y2={by} />
              <line x1={bx} y1={by} x2={bx} y2={by + sy*22} />
            </g>
          );
        })}
      </svg>

      {/* oscilloscope canvas layer (overlaid on the SVG viewport) */}
      <div className="rm-scope-overlay">
        <OscilloscopeCanvas clarity={jammed ? 0 : clarity} />
        {jammed && <div className="rm-scope-jammed">SIGNAL LOST</div>}
      </div>

      {/* noise layer on full face when jammed */}
      {jammed && <div className="rm-jam-noise"><NoiseCanvas opacity={0.25} /></div>}

      {/* pin readout strip */}
      <div className="rm-pins" role="group" aria-label="Access code pins">
        {RADIOMETER_PINS.map((pin, i) => (
          <PinReadout
            key={i}
            solved={rm.pinsSolved[pin.taskIndex]}
            digit={pin.digit}
            label={pin.label}
            distorted={jammed && rm.pinsSolved[pin.taskIndex]}
          />
        ))}
      </div>

      {/* "SIGNAL JAM" banner */}
      <AnimatePresence>
        {jammed && (
          <motion.div
            className="rm-jam-banner"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            ⚡ SIGNAL JAMMED — TUNING DIAL OFFLINE ⚡
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
