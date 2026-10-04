"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/audio";
import { authenticateCredentials, saveSession } from "@/lib/config";
import Typewriter from "./Typewriter";
import HawkinsScene from "./scenes/HawkinsScene";
import Crt from "./Crt";

export default function LoginScreen() {
  const router = useRouter();
  const { loginPlayer } = useGame();

  const [teamName, setTeamName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [error, setError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [bootReady, setBootReady] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const authResult = authenticateCredentials(teamName, leaderName);

    if (authResult.success) {
      setError(false);
      sfx("boom");

      if (authResult.session.role === "VECNA") {
        saveSession(authResult.session);
        router.push("/vecna");
      } else {
        // Player credentials -> go to player game (cinematic intro, then map)
        loginPlayer({
          id: authResult.session.teamId || "T01",
          teamName: authResult.session.teamName,
          leaderName: authResult.session.leaderName,
        });
      }
    } else {
      setError(true);
      setShakeKey((k) => k + 1);
      sfx("err");
    }
  };

  return (
    <div
      className="screen"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Crt />
      <div className="layer">
        <HawkinsScene />
      </div>

      {/* Atmospheric dark red/noir vignette overlay */}
      <div
        className="layer"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(255, 30, 45, 0.16), transparent 65%), linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(5,2,4,0.4) 40%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      <motion.div
        key={shakeKey}
        className="panel content"
        style={{
          width: "min(560px, 100%)",
          background: "rgba(10, 6, 10, 0.94)",
          border: error ? "1px solid var(--danger)" : "1px solid rgba(255, 45, 58, 0.35)",
          boxShadow: error
            ? "0 0 35px rgba(255, 45, 58, 0.45)"
            : "0 0 30px rgba(0, 0, 0, 0.9)",
          zIndex: 10,
        }}
        initial={{ opacity: 0, y: 25 }}
        animate={
          error
            ? { x: [-14, 14, -10, 10, -6, 6, -2, 2, 0], opacity: 1, y: 0 }
            : { opacity: 1, y: 0 }
        }
        transition={{ duration: 0.45 }}
      >
        <div
          className="panel-head"
          style={{
            borderBottomColor: error ? "rgba(255,45,58,0.4)" : "rgba(255,255,255,0.12)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="dot" style={{ background: error ? "var(--danger)" : "#ff3b45" }} />
            <span style={{ letterSpacing: ".15em", fontSize: 13 }}>
              HAWKINS NATIONAL LABORATORY · SECURE TERMINAL
            </span>
          </div>
          <span className="term dim" style={{ fontSize: 12 }}>
            1986 // V2.4
          </span>
        </div>

        <div className="panel-body" style={{ padding: "26px 24px" }}>
          {/* Header Title with CRT Glow */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div
              className="eyebrow"
              style={{
                letterSpacing: ".45em",
                color: "var(--accent)",
                fontSize: 12,
                marginBottom: 6,
              }}
            >
              CLASSIFIED ACCESS GATEWAY
            </div>
            <h1
              className="title-xl"
              style={{
                fontSize: "clamp(26px, 5.5vw, 42px)",
                color: "#ff3b45",
                margin: 0,
                textShadow:
                  "0 0 4px rgba(255,255,255,0.5), 0 0 16px #ff3b45, 0 0 40px #ff1f2d",
              }}
            >
              THE HAWKINS PROTOCOL
            </h1>
          </div>

          {/* Typewriter boot lines */}
          <Typewriter
            className="term dim"
            speed={14}
            onDone={() => setBootReady(true)}
            lines={[
              "> INITIALIZING GRID TELEMETRY ........ OK",
              "> SECURE FREQUENCY TUNED TO 14.3 MHz",
              "> ENTER ASSIGNED CREDENTIALS TO ACCESS SYSTEM:",
            ]}
          />

          <form
            onSubmit={handleSubmit}
            style={{
              marginTop: 18,
              opacity: bootReady ? 1 : 0.85,
              transition: "opacity 0.4s",
            }}
          >
            <div>
              <label
                className="lbl"
                htmlFor="team-name-input"
                style={{ letterSpacing: ".15em", fontSize: 13 }}
              >
                1. TEAM NAME
              </label>
              <input
                id="team-name-input"
                className="field"
                value={teamName}
                onChange={(e) => {
                  setTeamName(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="ENTER TEAM NAME..."
                maxLength={40}
                autoFocus
                autoComplete="off"
                style={{
                  fontSize: 18,
                  borderColor: error ? "var(--danger)" : undefined,
                  letterSpacing: ".1em",
                }}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <label
                className="lbl"
                htmlFor="leader-name-input"
                style={{ letterSpacing: ".15em", fontSize: 13 }}
              >
                2. TEAM LEADER NAME
              </label>
              <input
                id="leader-name-input"
                className="field"
                value={leaderName}
                onChange={(e) => {
                  setLeaderName(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="ENTER TEAM LEADER NAME..."
                maxLength={40}
                autoComplete="off"
                style={{
                  fontSize: 18,
                  borderColor: error ? "var(--danger)" : undefined,
                  letterSpacing: ".1em",
                }}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  id="login-error-msg"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  style={{
                    color: "var(--danger)",
                    marginTop: 16,
                    padding: "10px 14px",
                    background: "rgba(255, 45, 58, 0.12)",
                    border: "1px solid var(--danger)",
                    borderRadius: 4,
                    fontSize: 15,
                    fontFamily: "var(--font-term)",
                    textAlign: "center",
                    letterSpacing: ".15em",
                    fontWeight: "bold",
                  }}
                >
                  ⚠ ACCESS DENIED / UNKNOWN TEAM
                </motion.div>
              )}
            </AnimatePresence>

            <button
              id="login-enter-btn"
              type="submit"
              className="btn big pulse-cta"
              style={{
                marginTop: 22,
                width: "100%",
                fontSize: 20,
                padding: "14px 20px",
                letterSpacing: ".2em",
              }}
              disabled={!teamName.trim() || !leaderName.trim()}
            >
              ENTER PROTOCOL →
            </button>
          </form>

          {/* Footer public link & note */}
          <div
            style={{
              marginTop: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
              color: "var(--dim)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: 12,
            }}
          >
            <span>CASE-INSENSITIVE EXACT MATCH REQUIRED</span>
            <Link href="/leaderboard">
              <button
                type="button"
                id="public-leaderboard-link"
                className="btn sm ghost"
                style={{ fontSize: 12, padding: "3px 8px" }}
              >
                PUBLIC LEADERBOARD →
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
