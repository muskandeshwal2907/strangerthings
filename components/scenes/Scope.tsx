"use client";
import { useEffect, useRef } from "react";

export default function Scope({ color = "54,224,196", amp = 0.25, y = 0.5, noise = 0.35, height = 1, className = "" }: { color?: string; amp?: number; y?: number; noise?: number; height?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef({ amp, noise });
  live.current = { amp, noise };
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    let w = 0, h = 0, raf = 0;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener("resize", resize);
    const loop = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      // grid
      ctx.strokeStyle = `rgba(${color},0.07)`;
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 48) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
      for (let gy = 0; gy < h; gy += 48) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
      const { amp: A, noise: N } = live.current;
      const mid = h * y;
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const k = x / w;
          const env = Math.sin(k * Math.PI);
          const v =
            Math.sin(k * 14 + t / (420 + layer * 140)) * 0.6 +
            Math.sin(k * 41 - t / 260) * 0.25 * (1 + N) +
            (Math.random() - 0.5) * N * 0.7;
          const yy = mid + v * env * h * A * height * (1 - layer * 0.25);
          x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.strokeStyle = `rgba(${color},${0.85 - layer * 0.3})`;
        ctx.lineWidth = 2 - layer * 0.5;
        ctx.shadowColor = `rgba(${color},1)`;
        ctx.shadowBlur = 14;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, [color, y, height]);
  return <canvas ref={ref} className={`layer ${className}`} style={{ width: "100%", height: "100%" }} />;
}
