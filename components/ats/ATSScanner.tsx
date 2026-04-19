"use client";

/**
 * ATSScanner — cinematic redesign
 * Keeps all logic (scanResume action, state management) intact.
 */

import { useState, useTransition, useId, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView, type Variants } from "framer-motion";
import { scanResume } from "@/app/actions/ats";
import type { ATSScanResult } from "@/types/ats";

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── PDF report download ─────────────────────────────────────────────────────
function downloadATSReport(result: ATSScanResult) {
  const color = result.score >= 76 ? "#2d6e45" : result.score >= 50 ? "#8a6a30" : "#8a3030";
  const label = result.score >= 76 ? "Strong Match" : result.score >= 50 ? "Partial Match" : "Weak Match";

  const keywordChips = result.keyword_hits.map((k) => `<span style="display:inline-block;padding:3px 9px;margin:2px;border-radius:4px;background:rgba(45,110,69,0.12);border:1px solid rgba(45,110,69,0.3);color:#2d6e45;font-size:12px">${k}</span>`).join("");
  const hardChips = result.hard_skills_missing.map((k) => `<span style="display:inline-block;padding:3px 9px;margin:2px;border-radius:4px;background:rgba(138,48,48,0.1);border:1px solid rgba(138,48,48,0.25);color:#8a3030;font-size:12px">${k}</span>`).join("");
  const softChips = result.soft_skills_missing.map((k) => `<span style="display:inline-block;padding:3px 9px;margin:2px;border-radius:4px;background:#f5f5f5;border:1px solid #ddd;color:#666;font-size:12px">${k}</span>`).join("");
  const fixes = result.fixes.map((f, i) => `<div style="margin-bottom:12px;padding:12px 14px;border:1px solid #e8e8e8;border-radius:8px"><div style="font-size:13px;color:#c0392b;margin-bottom:6px">${String(i+1).padStart(2,"0")}. ${f.issue}</div><div style="font-size:13px;color:#27ae60">${f.fix}</div></div>`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ATS Scan Report</title><style>
    *{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:#111;padding:56px 72px;max-width:820px;margin:0 auto}
    .score-row{display:flex;align-items:center;gap:20px;padding:20px 24px;border:1px solid ${color}30;border-radius:12px;background:${color}08;margin-bottom:32px}
    .score-num{font-size:52px;font-weight:300;color:${color};line-height:1}
    .score-label{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${color};background:${color}18;border:1px solid ${color}30;border-radius:100px;padding:3px 12px;display:inline-block;margin-top:6px}
    h2{font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#888;margin:28px 0 10px;padding-bottom:6px;border-bottom:1px solid #eee}
    .headline{font-size:15px;line-height:1.7;color:#333;padding:14px 18px;border-left:3px solid #c9a86c;background:#fafaf7;border-radius:0 8px 8px 0;margin-bottom:28px}
    p.summary{font-size:14px;line-height:1.8;color:#555}
    @media print{body{padding:40px 48px}@page{margin:0}}
  </style></head><body>
  <div class="score-row"><div><div class="score-num">${result.score}<span style="font-size:20px;color:#aaa">/100</span></div><div class="score-label">${label}</div></div><div style="flex:1;font-size:14px;color:#555;line-height:1.7">${result.headline}</div></div>
  <div class="headline">${result.summary}</div>
  ${keywordChips ? `<h2>Keyword Hits (${result.keyword_hits.length})</h2><div style="margin-bottom:28px">${keywordChips}</div>` : ""}
  ${hardChips ? `<h2>Missing Hard Skills</h2><div style="margin-bottom:16px">${hardChips}</div>` : ""}
  ${softChips ? `<h2>Missing Soft Skills</h2><div style="margin-bottom:28px">${softChips}</div>` : ""}
  ${fixes ? `<h2>Suggested Fixes</h2>${fixes}` : ""}
  </body></html>`;

  const win = window.open("", "_blank", "width=900,height=750");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 400);
}

// ── Score color helper ──────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 76) return "#5a8a6a";
  if (score >= 50) return "#c9a86c";
  return "#e05c5c";
}

function scoreLabel(score: number): string {
  if (score >= 76) return "Strong Match";
  if (score >= 50) return "Partial Match";
  return "Weak Match";
}

// ── Count-up hook ───────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200, enabled = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, enabled]);
  return count;
}

// ── Animated score circle (SVG arc fills in dramatically) ──────────────────
function ScoreCircle({ score }: { score: number }) {
  const [arcReady, setArcReady] = useState(false);
  const [countEnabled, setCountEnabled] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const color = scoreColor(score);
  const displayScore = useCountUp(score, 1200, countEnabled);

  const size = 160;
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  const gap = circ - dash;

  useEffect(() => {
    const t1 = setTimeout(() => setArcReady(true), 200);
    const t2 = setTimeout(() => setCountEnabled(true), 600);
    const t3 = setTimeout(() => { if (score > 75) setShowParticles(true); }, 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [score]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "1rem",
      marginBottom: "3rem",
      position: "relative",
    }}>
      {/* Particle burst */}
      <AnimatePresence>
        {showParticles && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * 360;
              const dist = 80 + Math.random() * 40;
              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos((angle * Math.PI) / 180) * dist,
                    y: Math.sin((angle * Math.PI) / 180) * dist,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: color,
                    top: 0,
                    left: 0,
                  }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Outer glow ring */}
      <motion.div
        animate={arcReady ? { boxShadow: [`0 0 20px ${color}30`, `0 0 50px ${color}50`, `0 0 20px ${color}30`] } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circ}`, opacity: 0 }}
            animate={
              arcReady
                ? { strokeDasharray: `${dash} ${gap}`, opacity: 1 }
                : { strokeDasharray: `0 ${circ}`, opacity: 0.3 }
            }
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          />
        </svg>

        {/* Score number */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: countEnabled ? 1 : 0, scale: countEnabled ? 1 : 0.6 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontWeight: 300,
              fontSize: "2.8rem",
              color,
              lineHeight: 1,
              display: "block",
            }}
          >
            {displayScore}
          </motion.span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
          }}>
            / 100
          </span>
        </div>
      </motion.div>

      {/* Score label */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5, ease: EASE_OUT }}
      >
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color,
          background: `${color}15`,
          border: `1px solid ${color}35`,
          borderRadius: "100px",
          padding: "3px 14px",
        }}>
          {scoreLabel(score)}
        </span>
      </motion.div>
    </div>
  );
}

// ── Loading visualization ───────────────────────────────────────────────────
const SCAN_LABELS = [
  "Reading job description…",
  "Analyzing keywords…",
  "Scoring match…",
];

function ScanningLoader() {
  const [labelIdx, setLabelIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLabelIdx((i) => (i + 1) % SCAN_LABELS.length), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      style={{
        padding: "2.5rem",
        background: "rgba(19,21,28,0.7)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
        backdropFilter: "blur(24px)",
        marginBottom: "2rem",
        textAlign: "center",
      }}
    >
      {/* Bouncing scan line */}
      <div style={{
        width: "100%",
        height: "2px",
        background: "rgba(255,255,255,0.06)",
        borderRadius: "100px",
        overflow: "hidden",
        marginBottom: "2rem",
        position: "relative",
      }}>
        <motion.div
          animate={{ x: ["0%", "100%", "0%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "40%",
            height: "100%",
            background: "linear-gradient(90deg, transparent, var(--copper), transparent)",
            borderRadius: "100px",
          }}
        />
      </div>

      {/* Cycling label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={labelIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            letterSpacing: "0.1em",
            color: "rgba(201,168,108,0.7)",
            margin: 0,
          }}
        >
          {SCAN_LABELS[labelIdx]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

// ── Stagger chip ────────────────────────────────────────────────────────────
function AnimatedChip({
  label,
  variant,
  index,
}: {
  label: string;
  variant: "green" | "red" | "muted";
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const styles = {
    green: {
      background: "rgba(90,138,106,0.12)",
      border: "1px solid rgba(90,138,106,0.3)",
      color: "#5a8a6a",
    },
    red: {
      background: "rgba(224,92,92,0.08)",
      border: "1px solid rgba(224,92,92,0.25)",
      color: "#e05c5c",
    },
    muted: {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      color: "rgba(255,255,255,0.35)",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", damping: 18, stiffness: 280 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{ position: "relative", display: "inline-block" }}
    >
      <span style={{
        display: "inline-block",
        fontFamily: "'DM Mono', monospace",
        fontSize: "10px",
        letterSpacing: "0.04em",
        padding: "4px 10px",
        borderRadius: "5px",
        cursor: variant === "red" ? "pointer" : "default",
        transition: "background 0.15s",
        ...styles[variant],
      }}>
        {label}
      </span>
      {/* "Add to resume" tooltip for red chips */}
      <AnimatePresence>
        {variant === "red" && hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.92 }}
            animate={{ opacity: 1, y: -2, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 6px)",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(13,14,18,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              padding: "4px 10px",
              fontFamily: "'DM Mono', monospace",
              fontSize: "9px",
              letterSpacing: "0.06em",
              color: "rgba(255,255,255,0.6)",
              whiteSpace: "nowrap",
              zIndex: 10,
              backdropFilter: "blur(8px)",
              pointerEvents: "none",
            }}
          >
            Add to resume →
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Fix card ────────────────────────────────────────────────────────────────
function FixCard({ issue, fix, index }: { issue: string; fix: string; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, type: "spring", damping: 22, stiffness: 220 }}
      onClick={() => setExpanded((v) => !v)}
      whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
      style={{
        background: "rgba(19,21,28,0.8)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "14px",
        padding: "1.25rem 1.4rem",
        marginBottom: "0.75rem",
        cursor: "pointer",
        backdropFilter: "blur(20px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        {/* Number */}
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "11px",
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.06em",
          flexShrink: 0,
          marginTop: "1px",
        }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            color: "rgba(224,92,92,0.8)",
            lineHeight: 1.6,
            margin: "0 0 0.6rem",
          }}>
            {issue}
          </p>
          <AnimatePresence>
            {expanded && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "13px",
                  color: "rgba(90,138,106,0.9)",
                  lineHeight: 1.6,
                  margin: 0,
                  overflow: "hidden",
                }}
              >
                {fix}
              </motion.p>
            )}
          </AnimatePresence>
          {!expanded && (
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              color: "rgba(90,138,106,0.6)",
              margin: 0,
              lineHeight: 1.5,
            }}>
              {fix.length > 80 ? fix.slice(0, 80) + "…" : fix}
            </p>
          )}
        </div>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "9px",
          color: "rgba(255,255,255,0.2)",
          flexShrink: 0,
          marginTop: "2px",
        }}>
          {expanded ? "−" : "+"}
        </span>
      </div>
    </motion.div>
  );
}

// ── Section label ───────────────────────────────────────────────────────────
function SectionLabel({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
      {accent && (
        <div style={{
          width: "16px",
          height: "1px",
          background: accent,
          opacity: 0.6,
        }} />
      )}
      <p style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "9px",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.3)",
        margin: 0,
      }}>
        {children}
      </p>
    </div>
  );
}

// ── Container variants ──────────────────────────────────────────────────────
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

// ── ResultView — two-column layout ─────────────────────────────────────────
function ResultView({ result, onReset }: { result: ATSScanResult; onReset: () => void }) {
  const color = scoreColor(result.score);

  return (
    <motion.div
      className="ats-result-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: "3rem",
        alignItems: "start",
      }}
    >
      {/* ── Left panel — score + summary (sticky) ─────────────────── */}
      <motion.div
        className="ats-sticky-left"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: EASE_OUT }}
        style={{ position: "sticky", top: "calc(56px + 2rem)", display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        {/* Score card */}
        <div style={{
          background: "rgba(19,21,28,0.8)",
          border: `1px solid ${color}25`,
          borderRadius: "20px",
          padding: "2rem 1.5rem",
          backdropFilter: "blur(20px)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "2px",
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }} />
          <ScoreCircle score={result.score} />
        </div>

        {/* Summary card */}
        <div style={{
          background: "rgba(19,21,28,0.6)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          padding: "1.25rem 1.35rem",
          backdropFilter: "blur(16px)",
        }}>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.2)",
            margin: "0 0 0.75rem",
          }}>
            Summary
          </p>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.75,
            margin: 0,
          }}>
            {result.summary}
          </p>
        </div>

        {/* Download PDF */}
        <motion.button
          onClick={() => downloadATSReport(result)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
            padding: "9px 14px", borderRadius: "10px",
            background: "rgba(201,168,108,0.08)",
            border: "1px solid rgba(201,168,108,0.25)",
            color: "rgba(201,168,108,0.8)",
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace",
            fontSize: "10px", letterSpacing: "0.08em",
            transition: "all 0.2s ease",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v8M5 7l3 3 3-3"/><path d="M2 12h12"/>
          </svg>
          Download Report
        </motion.button>

        {/* Scan another */}
        <motion.button
          whileHover={{ x: -3 }}
          onClick={onReset}
          style={{
            background: "none", border: "none", padding: 0, cursor: "pointer",
            fontSize: "12px", letterSpacing: "0.06em",
            color: "rgba(255,255,255,0.22)",
            fontFamily: "'DM Mono', monospace",
            display: "flex", alignItems: "center", gap: "0.4rem",
          }}
        >
          ← scan another role
        </motion.button>
      </motion.div>

      {/* ── Right panel — detailed analysis ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: EASE_OUT }}
        style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
      >
        {/* Headline */}
        <div style={{
          background: "rgba(19,21,28,0.5)",
          border: "1px solid rgba(201,168,108,0.12)",
          borderLeft: "3px solid rgba(201,168,108,0.4)",
          borderRadius: "0 12px 12px 0",
          padding: "1.25rem 1.5rem",
          backdropFilter: "blur(12px)",
        }}>
          <p style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontWeight: 300,
            fontSize: "clamp(0.95rem, 1.8vw, 1.2rem)",
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.65,
            margin: 0,
            letterSpacing: "-0.01em",
          }}>
            {result.headline}
          </p>
        </div>

        {/* Keyword hits */}
        {result.keyword_hits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: EASE_OUT }}
            style={{
              background: "rgba(90,138,106,0.04)",
              border: "1px solid rgba(90,138,106,0.15)",
              borderRadius: "16px",
              padding: "1.5rem 1.75rem",
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <SectionLabel accent="#5a8a6a">Keyword Hits</SectionLabel>
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: "10px",
                color: "#5a8a6a", background: "rgba(90,138,106,0.12)",
                border: "1px solid rgba(90,138,106,0.25)",
                borderRadius: "100px", padding: "2px 10px",
              }}>
                {result.keyword_hits.length} found
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {result.keyword_hits.map((kw, i) => (
                <AnimatedChip key={kw} label={kw} variant="green" index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Missing skills */}
        {(result.hard_skills_missing.length > 0 || result.soft_skills_missing.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: EASE_OUT }}
            style={{
              background: "rgba(224,92,92,0.03)",
              border: "1px solid rgba(224,92,92,0.12)",
              borderRadius: "16px",
              padding: "1.5rem 1.75rem",
              backdropFilter: "blur(12px)",
            }}
          >
            <SectionLabel accent="#e05c5c">Missing Skills</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: result.hard_skills_missing.length > 0 && result.soft_skills_missing.length > 0 ? "1fr 1fr" : "1fr", gap: "1.5rem", marginTop: "0.5rem" }}>
              {result.hard_skills_missing.length > 0 && (
                <div>
                  <p style={{
                    fontFamily: "'DM Mono', monospace", fontSize: "9px",
                    letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)",
                    textTransform: "uppercase", marginBottom: "0.75rem", marginTop: 0,
                  }}>
                    Hard Skills
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {result.hard_skills_missing.map((skill, i) => (
                      <AnimatedChip key={skill} label={skill} variant="red" index={i} />
                    ))}
                  </div>
                </div>
              )}
              {result.soft_skills_missing.length > 0 && (
                <div>
                  <p style={{
                    fontFamily: "'DM Mono', monospace", fontSize: "9px",
                    letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)",
                    textTransform: "uppercase", marginBottom: "0.75rem", marginTop: 0,
                  }}>
                    Soft Skills
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {result.soft_skills_missing.map((skill, i) => (
                      <AnimatedChip key={skill} label={skill} variant="muted" index={i} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Fixes */}
        {result.fixes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5, ease: EASE_OUT }}
          >
            <SectionLabel accent="rgba(255,255,255,0.2)">Suggested Fixes</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
              {result.fixes.map((fix, i) => (
                <FixCard key={i} issue={fix.issue} fix={fix.fix} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── ATSScanner (main export) ────────────────────────────────────────────────
export function ATSScanner() {
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<ATSScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [jdFocused, setJdFocused] = useState(false);
  const textareaId = useId();

  const isReady = jd.trim().length >= 30 && !isPending;

  function handleScan() {
    if (!isReady) return;
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const res = await scanResume(jd);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="mobile-page-wrap" style={{
      background: "var(--bg)",
      minHeight: "100vh",
      paddingLeft: "var(--sidebar-w, 60px)",
    }}>
      <div style={{
        maxWidth: result ? "1100px" : "720px",
        margin: "0 auto",
        padding: "calc(56px + 4rem) 5vw 8rem",
        transition: "max-width 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
      }}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          style={{ marginBottom: "3rem" }}
        >
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(201,168,108,0.5)",
            margin: "0 0 0.75rem",
          }}>
            ATS Scanner
          </p>
          <h1 style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 300,
            color: "rgba(255,255,255,0.92)",
            margin: "0 0 0.75rem",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}>
            ATS Score
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
            color: "rgba(255,255,255,0.35)",
            lineHeight: 1.7,
            margin: 0,
          }}>
            See exactly how your resume ranks — and what to fix.
          </p>
        </motion.div>

        {/* ── Form / Result ──────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              {/* JD Textarea */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
                style={{
                  background: jdFocused
                    ? "rgba(19,21,28,0.9)"
                    : "rgba(19,21,28,0.6)",
                  border: jdFocused
                    ? "1px solid rgba(201,168,108,0.35)"
                    : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "16px",
                  transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s",
                  boxShadow: jdFocused ? "0 0 0 3px rgba(201,168,108,0.08), 0 8px 32px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.15)",
                  backdropFilter: "blur(20px)",
                  overflow: "hidden",
                  marginBottom: "1.5rem",
                }}
              >
                <label
                  htmlFor={textareaId}
                  style={{
                    display: "block",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "9px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: jdFocused ? "rgba(201,168,108,0.6)" : "rgba(255,255,255,0.2)",
                    padding: "1.1rem 1.25rem 0",
                    transition: "color 0.25s",
                  }}
                >
                  Job Description
                </label>
                <textarea
                  id={textareaId}
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  disabled={isPending}
                  onFocus={() => setJdFocused(true)}
                  onBlur={() => setJdFocused(false)}
                  placeholder="Paste the full job description here…"
                  style={{
                    width: "100%",
                    minHeight: "240px",
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.75)",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "14px",
                    lineHeight: 1.75,
                    padding: "0.75rem 1.25rem 1.25rem",
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                    opacity: isPending ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}
                />
              </motion.div>

              {/* Loading visualizer */}
              <AnimatePresence>
                {isPending && <ScanningLoader />}
              </AnimatePresence>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    fontSize: "13px",
                    color: "#e05c5c",
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: "1.25rem",
                    marginTop: 0,
                    padding: "0.75rem 1rem",
                    background: "rgba(224,92,92,0.08)",
                    border: "1px solid rgba(224,92,92,0.2)",
                    borderRadius: "10px",
                  }}
                >
                  {error}
                </motion.p>
              )}

              {/* Scan button */}
              {!isPending && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  whileHover={isReady ? {
                    scale: 1.02,
                    boxShadow: "0 12px 40px rgba(201,168,108,0.35)",
                  } : {}}
                  whileTap={isReady ? { scale: 0.98 } : {}}
                  onClick={handleScan}
                  disabled={!isReady}
                  style={{
                    width: "100%",
                    background: isReady
                      ? "linear-gradient(135deg, #c9a86c 0%, #a8834e 100%)"
                      : "rgba(255,255,255,0.04)",
                    border: isReady ? "none" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding: "1rem",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: isReady ? "#1a1208" : "rgba(255,255,255,0.2)",
                    cursor: isReady ? "pointer" : "default",
                    transition: "background 0.3s, color 0.3s",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Animated scan line on the button */}
                  {isReady && (
                    <motion.div
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  Scan Resume →
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
            >
              <ResultView result={result} onReset={() => { setResult(null); setJd(""); }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
