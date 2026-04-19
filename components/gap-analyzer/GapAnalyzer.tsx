"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { MarketOraclePanel } from "./MarketOraclePanel";
import { AgentActivityLog } from "./AgentActivityLog";
import { SyllabusCard } from "./SyllabusCard";
import type {
  GapItem,
  GapAnalysisPhase,
  MarketOracleResult,
  FullGapAnalysisSession,
  UserConstraints,
} from "@/types/gap-analyzer";

// ── Constraint Chip ────────────────────────────────────────────────────────────

function Chip({
  label,
  active,
  onClick,
  color = "var(--indigo)",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      style={{
        padding: "6px 14px",
        borderRadius: "20px",
        fontSize: "11px",
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 500,
        cursor: "pointer",
        border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`,
        background: active ? `${color}15` : "rgba(255,255,255,0.03)",
        color: active ? color : "var(--text-4)",
        transition: "all 0.18s ease",
        letterSpacing: "0.01em",
        userSelect: "none",
      }}
    >
      {label}
    </motion.button>
  );
}

// ── Time Budget Chip Row ───────────────────────────────────────────────────────

const TIME_OPTIONS: Array<{ label: string; value: UserConstraints["time_budget"] }> = [
  { label: "48 Hours", value: "48-hours" },
  { label: "1 Week", value: "1-week" },
  { label: "1 Month", value: "1-month" },
  { label: "3 Months", value: "3-months" },
];

const SITUATION_FLAGS = [
  { label: "Part-time learner", value: "part_time" },
  { label: "No CS degree", value: "no_cs_degree" },
  { label: "Zero budget", value: "zero_budget" },
  { label: "Career switching", value: "career_switching" },
  { label: "Currently employed", value: "currently_employed" },
];

// ── Brain Loading Animation ────────────────────────────────────────────────────

const BRAIN_NODES = [
  { cx: 100, cy: 60 }, { cx: 180, cy: 45 }, { cx: 240, cy: 90 },
  { cx: 60, cy: 120 }, { cx: 145, cy: 130 }, { cx: 220, cy: 150 },
  { cx: 90, cy: 185 }, { cx: 170, cy: 195 }, { cx: 250, cy: 170 },
];
const BRAIN_EDGES = [
  [0, 1], [1, 2], [0, 3], [0, 4], [1, 4], [2, 5],
  [3, 6], [4, 6], [4, 7], [5, 8], [6, 7], [7, 8],
];

const PHASE_MESSAGES: Record<string, string> = {
  oracle_running: "Fetching live market data & salary benchmarks…",
  oracle_done: "Market intelligence captured.",
  agent_a_running: "Sub-Agent A drafting your personalized gap plan…",
  agent_a_done: "Initial gap analysis ready.",
  agent_b_running: "Sub-Agent B reviewing for feasibility issues…",
  agent_b_done: "Critique complete.",
  agent_revised_running: "Sub-Agent A applying critique, refining the plan…",
  agent_revised_done: "Plan revised and strengthened.",
  syllabus_running: "Building your 48-hour learning syllabus…",
  idle: "Spinning up intelligence layer…",
};

function BrainLoading({ phase, role }: { phase: GapAnalysisPhase; role: string }) {
  const msg = PHASE_MESSAGES[phase] ?? `Analyzing gaps for ${role}…`;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", padding: "2.5rem 1.5rem" }}
    >
      <svg width="310" height="240" viewBox="0 0 310 240" style={{ overflow: "visible" }}>
        {BRAIN_EDGES.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={BRAIN_NODES[a].cx} y1={BRAIN_NODES[a].cy}
            x2={BRAIN_NODES[b].cx} y2={BRAIN_NODES[b].cy}
            stroke="rgba(124,133,245,0.25)" strokeWidth="1.5"
            animate={{ opacity: [0.12, 0.5, 0.12] }}
            transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
          />
        ))}
        {BRAIN_NODES.map((n, i) => (
          <motion.circle
            key={i} cx={n.cx} cy={n.cy} r="6"
            fill="rgba(124,133,245,0.8)"
            animate={{ scale: [1, 1.45, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
            style={{ filter: "drop-shadow(0 0 6px rgba(124,133,245,0.8))" }}
          />
        ))}
      </svg>
      <AnimatePresence mode="wait">
        <motion.p
          key={msg}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          style={{
            fontFamily: "'Inter', system-ui, sans-serif", fontSize: "0.88rem",
            color: "var(--text-3)", textAlign: "center", maxWidth: "280px", lineHeight: 1.6, margin: 0,
          }}
        >
          {msg}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

// ── Score Circle ───────────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const radius = 72;
  const circumference = 2 * Math.PI * radius;

  const color = score >= 75 ? "#22c55e" : score >= 50 ? "var(--copper)" : "#ef4444";
  const glowColor = score >= 75 ? "rgba(34,197,94,0.4)" : score >= 50 ? "rgba(201,168,108,0.4)" : "rgba(239,68,68,0.4)";
  const label = score >= 75 ? "Strong candidate" : score >= 50 ? "Getting there" : score >= 30 ? "Significant work needed" : "Not yet ready";
  const offset = circumference - (score / 100) * circumference;

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    const duration = 1800;
    let raf: number;
    const tick = (now: number) => {
      const prog = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      setDisplayed(Math.round(eased * score));
      if (prog < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, score]);

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.1 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}
    >
      <div style={{ position: "relative", width: 164, height: 164 }}>
        <div style={{
          position: "absolute", inset: "-10px", borderRadius: "50%",
          boxShadow: `0 0 40px ${glowColor}, 0 0 80px ${glowColor}50`,
          pointerEvents: "none",
        }} />
        <svg width="164" height="164" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="82" cy="82" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
          <motion.circle
            cx="82" cy="82" r={radius} fill="none"
            stroke={color} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={inView ? { strokeDashoffset: offset } : {}}
            transition={{ duration: 1.6, ease: "easeOut", delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}>
          <span style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontWeight: 300, fontSize: "2.6rem", color, lineHeight: 1, letterSpacing: "-0.02em" }}>
            {displayed}
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-4)" }}>
            Readiness
          </span>
        </div>
      </div>
      <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "0.8rem", color, fontWeight: 600, letterSpacing: "0.03em" }}>
        {label}
      </span>
    </motion.div>
  );
}

// ── Gap Card ──────────────────────────────────────────────────────────────────

function GapCard({ gap, index }: { gap: GapItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const configs = {
    critical: { bg: "rgba(239,68,68,0.05)", border: "rgba(239,68,68,0.25)", borderL: "#ef4444", text: "#ef4444", bar: "#ef4444", pct: 22 },
    moderate: { bg: "rgba(201,168,108,0.05)", border: "rgba(201,168,108,0.2)", borderL: "var(--copper)", text: "var(--copper)", bar: "var(--copper)", pct: 48 },
    minor:    { bg: "rgba(34,197,94,0.04)", border: "rgba(34,197,94,0.18)", borderL: "#22c55e", text: "#22c55e", bar: "#22c55e", pct: 74 },
  };
  const c = configs[gap.gap_level];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.45, type: "spring", stiffness: 160 }}
      style={{
        background: c.bg, border: `1px solid ${c.border}`, borderLeft: `3px solid ${c.borderL}`,
        borderRadius: "14px", padding: "1.25rem 1.5rem",
        backdropFilter: "blur(12px)",
        display: "flex", flexDirection: "column", gap: "1rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <h4 style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "0.95rem", fontWeight: 600, color: "var(--text-1)", margin: 0 }}>
          {gap.skill}
        </h4>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.1em",
            textTransform: "uppercase", color: c.text, background: `${c.borderL}15`,
            border: `1px solid ${c.border}`, borderRadius: "6px", padding: "2px 8px",
          }}>
            {gap.gap_level}
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "var(--text-4)",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "6px", padding: "2px 8px",
          }}>
            {gap.timeline_weeks}w
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden", marginBottom: "10px" }}>
          <motion.div
            initial={{ width: "10%" }}
            animate={inView ? { width: `${c.pct}%` } : {}}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: index * 0.07 + 0.2 }}
            style={{ height: "100%", background: `linear-gradient(90deg, ${c.bar}70, ${c.bar})`, borderRadius: "2px", boxShadow: `0 0 6px ${c.bar}60` }}
          />
        </div>
        {/* Current → Target stacked to avoid overlap */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>Now</span>
            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "0.8rem", color: "var(--text-3)", lineHeight: 1.5, wordBreak: "break-word" }}>{gap.current_level}</span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: c.text, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>Goal</span>
            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "0.8rem", color: c.text, lineHeight: 1.5, wordBreak: "break-word" }}>{gap.target_level}</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          textAlign: "left", display: "flex", alignItems: "center", gap: "6px", color: c.text,
        }}
      >
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase" }}>How to close</span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: "0.7rem", display: "inline-block", lineHeight: 1 }}
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <p style={{
              fontFamily: "'Inter', system-ui, sans-serif", fontSize: "0.84rem",
              color: "var(--text-3)", lineHeight: 1.75, margin: 0,
              paddingTop: "0.75rem", borderTop: `1px solid ${c.border}`,
            }}>
              {gap.how_to_close}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Gap Group ─────────────────────────────────────────────────────────────────

function GapGroup({ level, gaps }: { level: "critical" | "moderate" | "minor"; gaps: GapItem[] }) {
  const [minorExpanded, setMinorExpanded] = useState(false);
  if (gaps.length === 0) return null;

  const config = {
    critical: { label: "Critical Gaps", color: "#ef4444", icon: "⚠" },
    moderate: { label: "Moderate Gaps", color: "var(--copper)", icon: "◆" },
    minor: { label: "Minor Gaps", color: "#22c55e", icon: "·" },
  }[level];

  const isExpanded = level === "minor" ? minorExpanded : true;

  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <span style={{ color: config.color, fontSize: "0.9rem" }}>{config.icon}</span>
        <h3 style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "0.68rem", fontWeight: 700, color: config.color, letterSpacing: "0.16em", textTransform: "uppercase", margin: 0 }}>
          {config.label}
        </h3>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "var(--text-4)" }}>({gaps.length})</span>
        {level === "minor" && (
          <button
            onClick={() => setMinorExpanded(!minorExpanded)}
            style={{
              marginLeft: "auto", background: "none", border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: "8px", padding: "3px 10px", cursor: "pointer",
              fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#22c55e", letterSpacing: "0.08em",
            }}
          >
            {minorExpanded ? "Collapse ▴" : "Show all ▾"}
          </button>
        )}
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={level === "minor" ? { opacity: 0, height: 0 } : false}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: "10px", overflow: "hidden" }}
          >
            {gaps.map((gap, i) => <GapCard key={gap.skill + i} gap={gap} index={i} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function GapAnalyzer() {
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [timeBudget, setTimeBudget] = useState<UserConstraints["time_budget"]>("1-week");
  const [situation, setSituation] = useState<string[]>([]);

  const [phase, setPhase] = useState<GapAnalysisPhase>("idle");
  const [oracle, setOracle] = useState<MarketOracleResult | null>(null);
  const [session, setSession] = useState<FullGapAnalysisSession | null>(null);
  const [syllabusLoading, setSyllabusLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"gaps" | "syllabus">("gaps");

  // "analyzing" = still running the main pipeline (oracle + planner), before results appear
  const isRunning = phase !== "idle" && phase !== "complete" && phase !== "error";
  const abortRef = useRef<AbortController | null>(null);

  const toggleSituation = useCallback((val: string) => {
    setSituation((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  }, []);

  async function handleAnalyze() {
    if (!targetRole.trim() || isRunning) return;
    setPhase("oracle_running");
    setOracle(null);
    setSession(null);
    setSyllabusLoading(true);
    setError(null);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: targetRole.trim(),
          targetCompany: targetCompany.trim() || undefined,
          constraints: { time_budget: timeBudget, situation },
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() ?? "";

        for (const chunk of lines) {
          const dataLine = chunk.split("\n").find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          try {
            const event = JSON.parse(dataLine.slice(5));
            switch (event.type) {
              case "oracle_start":    setPhase("oracle_running"); break;
              case "oracle_result":   setOracle(event.data); setPhase("oracle_done"); break;
              case "agent_a_start":   setPhase("agent_a_running"); break;
              case "agent_a_draft":   setPhase("agent_a_done"); break;
              // complete fires right after planner — show results immediately
              case "complete":        setSession(event.data); setPhase("complete"); break;
              // syllabus builds in background after results are visible
              case "syllabus_start":  setSyllabusLoading(true); break;
              case "syllabus_result":
                setSyllabusLoading(false);
                setSession((prev) => prev ? { ...prev, syllabus: event.data } : prev);
                break;
              case "error":           setSyllabusLoading(false); throw new Error(event.message);
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setPhase("error");
    }
  }

  const criticalGaps = session?.gaps.filter((g) => g.gap_level === "critical") ?? [];
  const moderateGaps = session?.gaps.filter((g) => g.gap_level === "moderate") ?? [];
  const minorGaps    = session?.gaps.filter((g) => g.gap_level === "minor") ?? [];

  const inputBase: React.CSSProperties = {
    background: "rgba(19,21,28,0.6)", backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px",
    color: "var(--text-2)", fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: "0.9rem", padding: "0.875rem 1.25rem",
    outline: "none", boxSizing: "border-box" as const,
    transition: "border-color 0.2s, box-shadow 0.2s", width: "100%",
  };

  // ── Setup view ─────────────────────────────────────────────────────────────
  const showSetup = !isRunning && !session && phase !== "complete";
  const showAnalyzing = isRunning;
  const showResults = !!session && phase === "complete";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* ── Setup form ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {showSetup && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: "rgba(19,21,28,0.7)", backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: "22px",
              padding: "2.5rem",
              boxShadow: "0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
              display: "flex", flexDirection: "column", gap: "2rem",
            }}
          >
            {/* Role + Company inputs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Target role — e.g. Staff ML Engineer, Product Manager, AI Researcher"
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                style={inputBase}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(124,133,245,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,133,245,0.08)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <input
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="Target company — e.g. Google, Stripe, OpenAI (optional)"
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                style={inputBase}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(124,133,245,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,133,245,0.08)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {/* Time budget */}
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "10px" }}>
                How long can you focus on closing gaps?
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {TIME_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    active={timeBudget === opt.value}
                    onClick={() => setTimeBudget(opt.value)}
                    color="var(--indigo)"
                  />
                ))}
              </div>
            </div>

            {/* Situation flags */}
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "10px" }}>
                Your situation — select all that apply
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {SITUATION_FLAGS.map((flag) => (
                  <Chip
                    key={flag.value}
                    label={flag.label}
                    active={situation.includes(flag.value)}
                    onClick={() => toggleSituation(flag.value)}
                    color="#f59e0b"
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif", fontSize: "0.84rem", color: "#ef4444",
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "10px", padding: "0.75rem 1rem", margin: 0,
                }}
              >
                {error}
              </motion.p>
            )}

            {/* CTA */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <motion.button
                onClick={handleAnalyze}
                disabled={!targetRole.trim()}
                whileHover={targetRole.trim() ? { scale: 1.02, boxShadow: "0 0 50px rgba(124,133,245,0.35)" } : {}}
                whileTap={targetRole.trim() ? { scale: 0.97 } : {}}
                style={{
                  background: targetRole.trim()
                    ? "linear-gradient(135deg, rgba(124,133,245,0.95) 0%, rgba(100,108,220,0.95) 100%)"
                    : "rgba(255,255,255,0.04)",
                  border: "none", borderRadius: "12px", padding: "0.9rem 2rem",
                  fontFamily: "'Inter', system-ui, sans-serif", fontSize: "0.9rem", fontWeight: 600,
                  color: targetRole.trim() ? "#fff" : "var(--text-4)",
                  cursor: targetRole.trim() ? "pointer" : "not-allowed",
                  boxShadow: targetRole.trim() ? "0 4px 28px rgba(124,133,245,0.28)" : "none",
                  transition: "all 0.2s",
                }}
              >
                Run gap analysis →
              </motion.button>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "var(--text-4)", lineHeight: 1.6 }}>
                Market Oracle · Gap Planner · Syllabus Builder
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Analyzing: two-column layout ──────────────────────────────────── */}
      <AnimatePresence>
        {showAnalyzing && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 340px",
              gap: "20px",
              alignItems: "start",
            }}
          >
            {/* Left: brain + activity log */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <motion.div
                style={{
                  background: "rgba(19,21,28,0.7)", backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", overflow: "hidden",
                }}
              >
                <BrainLoading phase={phase} role={targetRole} />
              </motion.div>
              <AgentActivityLog phase={phase} />
            </div>

            {/* Right: market oracle panel */}
            <div>
              <MarketOraclePanel oracle={oracle} loading={phase === "oracle_running"} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showResults && session && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Top strip: Score + Oracle side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "20px", alignItems: "start" }}>
              {/* Score card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 160, damping: 18 }}
                style={{
                  background: "rgba(19,21,28,0.8)", backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px",
                  padding: "2rem 1.75rem",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem",
                  minWidth: "200px",
                }}
              >
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-4)", margin: 0, textAlign: "center" }}>
                  {session.target_role}{session.target_company ? ` · ${session.target_company}` : ""}
                </p>
                <ScoreCircle score={session.readiness_score} />
                <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "0.82rem", color: "var(--text-3)", lineHeight: 1.7, textAlign: "center", maxWidth: "200px", margin: 0 }}>
                  {session.readiness_summary}
                </p>
              </motion.div>

              {/* Oracle panel */}
              {session.oracle && (
                <MarketOraclePanel oracle={session.oracle} loading={false} />
              )}
            </div>

            {/* Tabs: Gap Analysis | 48-Hour Syllabus */}
            <div>
              <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "4px", width: "fit-content" }}>
                {[
                  { id: "gaps" as const, label: "Gap Analysis" },
                  { id: "syllabus" as const, label: "48-Hour Syllabus" },
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: "8px 20px", borderRadius: "9px", border: "none", cursor: "pointer",
                      fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", fontWeight: 500,
                      background: activeTab === tab.id ? "rgba(124,133,245,0.18)" : "transparent",
                      color: activeTab === tab.id ? "var(--indigo)" : "var(--text-4)",
                      transition: "all 0.2s",
                    }}
                  >
                    {tab.label}
                  </motion.button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "gaps" && (
                  <motion.div
                    key="gaps"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GapGroup level="critical" gaps={criticalGaps} />
                    <GapGroup level="moderate" gaps={moderateGaps} />
                    <GapGroup level="minor" gaps={minorGaps} />
                  </motion.div>
                )}

                {activeTab === "syllabus" && (
                  <motion.div
                    key="syllabus"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                  >
                    {syllabusLoading ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center",
                          gap: "16px", padding: "3rem",
                          background: "rgba(201,168,108,0.04)",
                          border: "1px solid rgba(201,168,108,0.12)",
                          borderRadius: "16px",
                        }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                          style={{
                            width: "28px", height: "28px", borderRadius: "50%",
                            border: "2px solid rgba(201,168,108,0.2)",
                            borderTopColor: "#c9a86c",
                          }}
                        />
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--text-4)", letterSpacing: "0.1em", margin: 0 }}>
                          Building your learning syllabus…
                        </p>
                      </motion.div>
                    ) : session.syllabus.length === 0 ? (
                      <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "0.88rem", color: "var(--text-4)", textAlign: "center", padding: "3rem" }}>
                        No syllabus generated — all gaps were minor.
                      </p>
                    ) : (
                      session.syllabus.map((skill, i) => (
                        <motion.div
                          key={skill.skill}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1, type: "spring", stiffness: 140 }}
                        >
                          <SyllabusCard syllabus={skill} index={i} />
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Re-analyze button */}
            <motion.button
              onClick={() => {
                setSession(null);
                setOracle(null);
                setPhase("idle");
                setError(null);
                setSyllabusLoading(true);
                setActiveTab("gaps");
              }}
              whileHover={{ borderColor: "rgba(124,133,245,0.4)", color: "var(--indigo)" }}
              style={{
                background: "none", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px", padding: "0.75rem 1.5rem",
                fontFamily: "'Inter', system-ui, sans-serif", fontSize: "0.84rem",
                color: "var(--text-4)", cursor: "pointer", alignSelf: "flex-start",
                transition: "border-color 0.2s, color 0.2s",
              }}
            >
              ← Analyze a different role
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
