"use client";
import React, { useMemo } from "react";

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export default function Skyline({
  flip = false, fill = "#04070a", win = "#ffb454", seed = 7, lit = 0.45, tower = true, className = "",
}: { flip?: boolean; fill?: string; win?: string; seed?: number; lit?: number; tower?: boolean; className?: string }) {
  const shapes = useMemo(() => {
    const r = rng(seed);
    const out: React.ReactNode[] = [];
    let x = -20;
    let i = 0;
    while (x < 1640) {
      const w = 64 + r() * 84;
      const h = 58 + r() * 96;
      const roof = 24 + r() * 30;
      const y = 300 - h;
      const gable = r() > 0.35;
      out.push(
        <g key={i}>
          {gable ? (
            <polygon points={`${x - 6},${y} ${x + w / 2},${y - roof} ${x + w + 6},${y}`} fill={fill} />
          ) : (
            <rect x={x - 3} y={y - 8} width={w + 6} height={8} fill={fill} />
          )}
          <rect x={x} y={y} width={w} height={h + 2} fill={fill} />
          {Array.from({ length: 1 + Math.floor(r() * 3) }).map((_, k) => {
            const on = r() < lit;
            return (
              <rect
                key={k}
                className={on ? "win" : ""}
                x={x + 12 + k * ((w - 24) / 3)}
                y={y + 16 + (k % 2) * 22}
                width={11}
                height={14}
                fill={on ? win : "#0b1218"}
                opacity={on ? 0.95 : 0.6}
                style={{ animationDelay: `${(r() * 6).toFixed(2)}s` }}
              />
            );
          })}
        </g>
      );
      x += w + 6 + r() * 26;
      i++;
    }
    return out;
  }, [seed, fill, win, lit]);

  return (
    <svg
      className={className}
      viewBox="0 0 1600 300"
      preserveAspectRatio="xMidYMax slice"
      style={{ width: "100%", height: "100%", transform: flip ? "scaleY(-1)" : undefined }}
    >
      {shapes}
      {tower && (
        <g>
          {/* water tower */}
          <g fill={fill}>
            <rect x={300} y={92} width={86} height={58} rx={6} />
            <polygon points="296,92 343,66 390,92" />
            <rect x={306} y={150} width={4} height={150} />
            <rect x={376} y={150} width={4} height={150} />
            <rect x={340} y={150} width={4} height={150} />
          </g>
          {/* radio tower */}
          <g stroke={fill} strokeWidth={4} fill="none">
            <path d="M1250 300 L1286 20 L1322 300" />
            <path d="M1260 240 L1312 240 M1268 180 L1304 180 M1274 130 L1298 130 M1256 270 L1316 210 M1316 270 L1256 210 M1268 200 L1304 150 M1304 200 L1268 150" strokeWidth={3} />
          </g>
          <circle className="beacon" cx={1286} cy={18} r={7} fill="#ff3b45" />
          {[0, 1.2, 2.4].map((d) => <circle key={d} className="sigring" cx={1286} cy={18} r={7} style={{ animationDelay: `${d}s` }} />)}
        </g>
      )}
    </svg>
  );
}
