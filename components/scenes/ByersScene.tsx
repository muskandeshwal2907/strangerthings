"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const ROWS = [
  { letters: "ABCDEFGH".split(""), y: 130 },
  { letters: "IJKLMNOPQ".split(""), y: 240 },
  { letters: "RSTUVWXYZ".split(""), y: 350 },
];

const BULB_COLORS = ["#ff3b45", "#36e0c4", "#ffb454", "#3df072", "#c965ff", "#ffffff"];

export default function ByersScene() {
  // Animated sequence: spell out "RIGHT HERE"
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  useEffect(() => {
    const sequence = ["R", "U", "N", "", "R", "I", "G", "H", "T", "", "H", "E", "R", "E", ""];
    let step = 0;
    const interval = setInterval(() => {
      setActiveLetter(sequence[step % sequence.length]);
      step++;
    }, 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 40%, #1e1410 0%, #0a0605 90%)",
        zIndex: 0,
      }}
    >
      {/* Retro 80s Wallpaper Pattern */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.12,
          pointerEvents: "none",
        }}
      >
        <pattern id="wallpaperFloral" width="80" height="80" patternUnits="userSpaceOnUse">
          <circle cx="40" cy="40" r="14" fill="none" stroke="#ffb454" strokeWidth="1" />
          <path d="M 40 20 Q 30 30, 40 40 Q 50 30, 40 20 Z" fill="#ffb454" opacity="0.3" />
          <path d="M 40 60 Q 30 50, 40 40 Q 50 50, 40 60 Z" fill="#ffb454" opacity="0.3" />
          <path d="M 20 40 Q 30 30, 40 40 Q 30 50, 20 40 Z" fill="#ffb454" opacity="0.3" />
          <path d="M 60 40 Q 50 30, 40 40 Q 50 50, 60 40 Z" fill="#ffb454" opacity="0.3" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#wallpaperFloral)" />
      </svg>

      {/* Christmas String Lights on the Wall */}
      <div
        style={{
          position: "relative",
          maxWidth: 960,
          margin: "40px auto 0",
          height: 480,
          padding: "20px 30px",
        }}
      >
        {ROWS.map((row, rowIdx) => {
          return (
            <div
              key={rowIdx}
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 44,
              }}
            >
              {/* Black hanging wire cable */}
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: 40,
                  pointerEvents: "none",
                }}
              >
                <path
                  d="M 10 10 Q 250 35, 500 12 T 950 15"
                  fill="none"
                  stroke="#111"
                  strokeWidth="3.5"
                />
              </svg>

              {row.letters.map((char, charIdx) => {
                const isLit = activeLetter === char;
                const bulbColor = BULB_COLORS[(rowIdx * 8 + charIdx) % BULB_COLORS.length];

                return (
                  <div
                    key={char}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      zIndex: 2,
                    }}
                  >
                    {/* Glowing bulb */}
                    <div
                      style={{
                        width: 18,
                        height: 26,
                        borderRadius: "50% 50% 40% 40%",
                        background: isLit ? bulbColor : "rgba(255,255,255,0.18)",
                        boxShadow: "none",
                        border: "1px solid rgba(0,0,0,0.6)",
                        transition: "all .12s ease-out",
                      }}
                    />

                    {/* Hand-painted Alphabet Letter on Wall */}
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: "clamp(26px, 4vw, 42px)",
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontWeight: 900,
                        color: isLit ? "#fff" : "rgba(255, 230, 200, 0.4)",
                        textShadow: "none",
                        transform: `rotate(${(charIdx % 3 - 1) * 4}deg)`,
                        userSelect: "none",
                        transition: "all .12s ease-out",
                      }}
                    >
                      {char}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
