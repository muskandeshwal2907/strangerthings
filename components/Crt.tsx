"use client";
import { useEffect, useRef } from "react";

export default function Crt() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const W = 320, H = 180;
    cv.width = W; cv.height = H;
    const img = ctx.createImageData(W, H);
    let raf = 0, last = 0;
    const draw = (t: number) => {
      if (t - last > 70) {
        last = t;
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = Math.random() * 255;
          d[i] = d[i + 1] = d[i + 2] = v;
          d[i + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="crt" aria-hidden>
      <canvas ref={ref} className="crt-noise" />
      <div className="crt-scan" />
      <div className="crt-roll" />
      <div className="crt-flicker" />
      <div className="crt-vig" />
    </div>
  );
}
