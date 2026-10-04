"use client";
import { useEffect, useRef } from "react";

export default function DataRain({ color = "54,224,196", size = 16, opacity = 0.5 }: { color?: string; size?: number; opacity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    let w = 0, h = 0, cols = 0, drops: number[] = [], raf = 0, last = 0;
    const chars = "0123456789ABCDEF<>/\\[]{}#$%".split("");
    const resize = () => {
      w = cv.width = cv.clientWidth; h = cv.height = cv.clientHeight;
      cols = Math.ceil(w / size);
      drops = Array.from({ length: cols }, () => Math.random() * -50);
    };
    resize();
    addEventListener("resize", resize);
    const loop = (t: number) => {
      if (t - last > 55) {
        last = t;
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(0, 0, w, h);
        ctx.font = `${size}px 'Share Tech Mono', monospace`;
        for (let i = 0; i < cols; i++) {
          const ch = chars[(Math.random() * chars.length) | 0];
          const x = i * size, y = drops[i] * size;
          ctx.fillStyle = `rgba(${color},${opacity})`;
          ctx.fillText(ch, x, y);
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          if (Math.random() > 0.97) ctx.fillText(ch, x, y);
          if (y > h && Math.random() > 0.975) drops[i] = 0;
          drops[i] += 1;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, [color, size, opacity]);
  return <canvas ref={ref} className="layer" style={{ width: "100%", height: "100%" }} />;
}
