"use client";
import React from "react";
import { motion } from "framer-motion";

export default function PoliceScene() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 30%, #151821 0%, #07090d 85%)",
        zIndex: 0,
      }}
    >
      {/* Flickering Overhead Fluorescent Tube */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 380,
          height: 8,
          background: "#e8f4f8",
          borderRadius: "0 0 4px 4px",
          boxShadow: "0 0 45px rgba(232, 244, 248, 0.45), 0 0 90px rgba(54, 224, 196, 0.2)",
          animation: "flicker 4s infinite",
        }}
      />

      {/* Desk Lamp Ambient Warm Cone Glow */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "22%",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255, 180, 84, 0.16) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Background Investigation Case Wall Silhouette */}
      <svg
        viewBox="0 0 1200 600"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.18,
          pointerEvents: "none",
        }}
      >
        {/* Corkboard Grid Outline */}
        <rect x="150" y="80" width="900" height="420" fill="none" stroke="rgba(255, 180, 84, 0.4)" strokeWidth="2" strokeDasharray="10 10" />
        {/* Pinned Photos and Red Correlation Strings */}
        <rect x="220" y="140" width="100" height="120" fill="rgba(255,255,255,0.08)" stroke="#fff" strokeWidth="1" />
        <rect x="420" y="120" width="120" height="90" fill="rgba(255,255,255,0.08)" stroke="#fff" strokeWidth="1" />
        <rect x="720" y="160" width="110" height="130" fill="rgba(255,255,255,0.08)" stroke="#fff" strokeWidth="1" />
        <rect x="580" y="300" width="130" height="90" fill="rgba(255,255,255,0.08)" stroke="#fff" strokeWidth="1" />

        {/* Red Threads connecting pins */}
        <line x1="270" y1="200" x2="480" y2="165" stroke="#ff2d3a" strokeWidth="1.8" />
        <line x1="480" y1="165" x2="775" y2="225" stroke="#ff2d3a" strokeWidth="1.8" />
        <line x1="480" y1="165" x2="645" y2="345" stroke="#ff2d3a" strokeWidth="1.8" />
        <line x1="270" y1="200" x2="645" y2="345" stroke="#ff2d3a" strokeWidth="1.8" />

        {/* Pin Heads */}
        <circle cx="270" cy="200" r="4" fill="#ff2d3a" />
        <circle cx="480" cy="165" r="4" fill="#ff2d3a" />
        <circle cx="775" cy="225" r="4" fill="#ff2d3a" />
        <circle cx="645" cy="345" r="4" fill="#ff2d3a" />

        {/* Police Badge Watermark */}
        <path
          d="M 600 80 L 670 120 L 660 210 Q 600 270, 600 280 Q 600 270, 540 210 L 530 120 Z"
          fill="none"
          stroke="rgba(255, 180, 84, 0.25)"
          strokeWidth="2"
        />
        <text x="600" y="195" fill="rgba(255, 180, 84, 0.3)" fontSize="16" letterSpacing="4" textAnchor="middle" fontFamily="monospace">
          HAWKINS POLICE
        </text>
      </svg>
    </div>
  );
}
