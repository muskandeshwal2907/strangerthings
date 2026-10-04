"use client";
import { useEffect, useState } from "react";

export default function Lightning({ color = "255,60,70" }: { color?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let t: any;
    const loop = () => {
      t = setTimeout(() => { setN((v) => v + 1); loop(); }, 3500 + Math.random() * 7500);
    };
    loop();
    return () => clearTimeout(t);
  }, []);
  if (!n) return null;
  return <div key={n} className="layer lightning" style={{ background: `radial-gradient(ellipse at ${20 + Math.random() * 60}% 0%, rgba(${color},.55), rgba(${color},.08) 55%, transparent 80%)` }} />;
}
