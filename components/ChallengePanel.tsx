"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { POWERS, PowerId, useGame } from "@/lib/store";
import { STAGES, StageId } from "@/lib/stages";
import { sfx } from "@/lib/audio";

function scramble(str: string, seed: number) {
  const sym = "▓▒░#@%&?§¥";
  return str
    .split("")
    .map((c, i) => {
      if (!/[a-z0-9]/i.test(c)) return c;
      const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
      return v - Math.floor(v) < 0.33 ? sym[(i + seed) % sym.length] : c;
    })
    .join("");
}
const leet = (s: string) => s.replace(/a/gi, "4").replace(/e/gi, "3").replace(/i/gi, "1").replace(/o/gi, "0").replace(/s/gi, "5");

function CodeWin({ code, cls }: { code: string; cls?: string }) {
  const lines = code.split("\n");
  return (
    <div className={`codewin ${cls || ""}`}>
      <div className="gut">{lines.map((_, i) => <div key={i}>{i + 1}</div>)}</div>
      <pre>{code}</pre>
    </div>
  );
}

export default function ChallengePanel({ stageId }: { stageId: StageId }) {
  const { s, submit, sabotage, setActive, say } = useGame();
  const st = STAGES[stageId];
  const list = st.challenges;
  const firstOpen = list.find((c) => !s.solved[c.id])?.id ?? list[0]?.id;
  const [sel, setSel] = useState(firstOpen);
  const [val, setVal] = useState("");
  const [bad, setBad] = useState(0);
  const [tick, setTick] = useState(0);
  const [fails, setFails] = useState(0);

  useEffect(() => { setSel(firstOpen); setVal(""); setFails(0); }, [stageId]); // eslint-disable-line
  useEffect(() => { setActive(sel); return () => setActive(null); }, [sel, setActive]);
  useEffect(() => {
    if (sabotage?.kind !== "CORRUPT") return;
    const t = setInterval(() => setTick((n) => n + 1), 420);
    return () => clearInterval(t);
  }, [sabotage]);

  const ch = list.find((c) => c.id === sel) ?? list[0];
  if (!ch) return null;
  const solved = !!s.solved[ch.id];
  const kind = sabotage?.kind;
  const locked = kind === "LOCK";

  const prompt = useMemo(() => {
    if (kind === "CORRUPT") return scramble(ch.prompt, tick + (sabotage?.id ?? 0) % 97);
    if (kind === "DISTORT") return leet(ch.prompt);
    return ch.prompt;
  }, [kind, ch.prompt, tick, sabotage]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || solved || !val.trim()) return;
    if (submit(ch.id, val)) {
      setVal(""); setFails(0);
      const next = list.find((c) => c.id !== ch.id && !s.solved[c.id]);
      if (next) setTimeout(() => setSel(next.id), 900);
    } else {
      setBad((n) => n + 1); setFails((n) => n + 1);
    }
  };

  const hints = (Object.keys(POWERS) as PowerId[]).filter((p) => s.revealed[ch.id]?.[p]);

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="dot" />
        <span>Challenge {list.indexOf(ch) + 1}/{list.length}</span>
        <span style={{ marginLeft: "auto", color: "var(--dim)" }}>{ch.points} PTS · {ch.category.toUpperCase()}</span>
      </div>
      <div className="panel-body">
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {list.map((c, i) => (
            <button key={c.id} className={`chip ${s.solved[c.id] ? "done" : ""}`} style={{ background: c.id === ch.id ? "color-mix(in srgb, var(--accent) 16%, transparent)" : "transparent", color: c.id === ch.id ? "var(--accent)" : undefined, borderColor: c.id === ch.id ? "var(--accent)" : undefined, cursor: "pointer" }} onClick={() => { setSel(c.id); setVal(""); sfx("click"); }}>
              {s.solved[c.id] ? "[OK]" : i + 1} {c.title}
            </button>
          ))}
        </div>

        <motion.div key={ch.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="title-xl" style={{ fontSize: 30, marginBottom: 10 }}>{kind === "CORRUPT" ? scramble(ch.title, tick) : ch.title}</h3>
          <p className="term" style={{ marginBottom: 14, color: kind ? "var(--danger)" : "var(--ink)" }}>{prompt}</p>
          {ch.code && <CodeWin code={ch.code} cls={kind === "DISTORT" ? "distort" : ""} />}
          {ch.id === "f1" && (
            <div className="hint"><b>MARKS FOUND {s.marks.length}/3</b><br />Move the flashlight. Click the glowing runes in the trees.</div>
          )}

          <form onSubmit={onSubmit} key={bad} className={bad && fails ? "shake" : ""} style={{ marginTop: 16, position: "relative" }}>
            <label className="lbl">{solved ? "ACCESS GRANTED" : "ENTER ANSWER"}</label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                className="field" value={solved ? "[COMPLETE]" : val} disabled={locked || solved}
                onChange={(e) => { setVal(e.target.value); sfx("type"); }}
                placeholder={locked ? "[LOCKED BY VECNA]" : ch.placeholder || "answer"} autoComplete="off" spellCheck={false}
              />
              <button className="btn" disabled={locked || solved || !val.trim()}>SEND</button>
            </div>
            {fails > 0 && !solved && <div className="term" style={{ color: "var(--danger)", marginTop: 8 }}>ACCESS DENIED · ATTEMPT {fails}</div>}
            {solved && <div className="term" style={{ color: "var(--accent2)", marginTop: 8 }}>+{ch.points} POINTS</div>}
          </form>

          {hints.map((p) => (
            <motion.div key={p} className="hint" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <b>{POWERS[p].name}</b><br />{ch[POWERS[p].field]}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
