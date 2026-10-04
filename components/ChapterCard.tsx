"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/lib/store";
import { STAGES } from "@/lib/stages";
import { sfx } from "@/lib/audio";
import Glitch from "./Glitch";

export default function ChapterCard() {
  const { cutscene, endCutscene } = useGame();
  useEffect(() => {
    if (!cutscene) return;
    sfx(cutscene === "upsidedown" ? "gate" : "glitch");
    const t = setTimeout(endCutscene, cutscene === "ending" ? 3200 : 4500);
    return () => clearTimeout(t);
  }, [cutscene, endCutscene]);

  const st = cutscene ? STAGES[cutscene] : null;
  const upside = st?.theme === "upside";
  return (
    <AnimatePresence>
      {st && (
        <motion.div
          key={st.id}
          className="card-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.6 }}
          onClick={endCutscene}
          style={{ background: upside ? "#0a0002" : "#000", cursor: "pointer" }}
        >
          {/* Animated background glow */}
          <motion.div
            style={{
              position: "absolute", inset: 0,
              background: upside
                ? "radial-gradient(ellipse at 50% 50%, rgba(120,0,20,.6), transparent 70%)"
                : "radial-gradient(ellipse at 50% 50%, rgba(40,10,0,.4), transparent 70%)",
            }}
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6] }} transition={{ duration: 2 }}
          />
          {/* Scanline effect on card */}
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0, rgba(0,0,0,0) 2px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0) 4px)", pointerEvents: "none" }} />

          <motion.div className="chap" initial={{ opacity: 0, letterSpacing: "1.4em" }} animate={{ opacity: 1, letterSpacing: "0.6em" }} transition={{ duration: 1.6, delay: 0.3 }}>
            {st.chapter}
          </motion.div>
          <motion.h1
            className="title-xl"
            style={{ ["--accent" as any]: upside ? "#ff2d3a" : "#ff3b45", color: upside ? "#ff2d3a" : "#ff3b45", padding: "0 20px" }}
            initial={{ opacity: 0, scale: 1.25, filter: "blur(18px)" }}
            animate={{ opacity: [0, 1, 0.4, 1, 0.7, 1], scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.8, delay: 0.7 }}
          >
            <Glitch text={st.title} className="ttl" hard={upside} />
          </motion.h1>
          <motion.div className="sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 1 }}>
            {st.subtitle}
          </motion.div>
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.2, duration: 2.2, ease: "easeInOut" }}
            style={{ height: 2, width: "min(520px,70vw)", marginTop: 34, background: `linear-gradient(90deg,transparent,${upside ? "#ff2d3a" : "#ff3b45"},transparent)`, boxShadow: `0 0 18px ${upside ? "#ff2d3a" : "#ff3b45"}`, transformOrigin: "left" }}
          />
          <motion.div
            className="term dim"
            initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 3.2, duration: 0.8 }}
            style={{ position: "absolute", bottom: 28, fontSize: 17, letterSpacing: ".35em" }}
          >
            CLICK TO SKIP
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
