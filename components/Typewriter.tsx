"use client";
import { useEffect, useState } from "react";
import { sfx } from "@/lib/audio";

export default function Typewriter({ lines, speed = 26, onDone, className = "" }: { lines: string[]; speed?: number; onDone?: () => void; className?: string }) {
  const [shown, setShown] = useState<string[]>([]);
  const [cur, setCur] = useState("");
  const [li, setLi] = useState(0);

  useEffect(() => {
    setShown([]); setCur(""); setLi(0);
  }, [lines.join("|")]);

  useEffect(() => {
    if (li >= lines.length) { onDone?.(); return; }
    const full = lines[li];
    if (cur.length < full.length) {
      const t = setTimeout(() => {
        setCur(full.slice(0, cur.length + 1));
        if (cur.length % 3 === 0) sfx("type");
      }, speed);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setShown((s) => [...s, full]);
      setCur("");
      setLi((n) => n + 1);
    }, 520);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, li, lines]);

  return (
    <div className={className}>
      {shown.map((l, i) => (
        <p key={i} style={{ marginBottom: 10 }}>{l}</p>
      ))}
      {li < lines.length && (
        <p>
          {cur}
          <span style={{ animation: "pulse 0.7s infinite" }}>█</span>
        </p>
      )}
    </div>
  );
}
