"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import type { MarketOracleResult } from "@/types/gap-analyzer";

// ── Animated number counter ───────────────────────────────────────────────────
function AnimCounter({ to, prefix = "", suffix = "", decimals = 0, duration = 1.6 }: {
  to: number; prefix?: string; suffix?: string; decimals?: number; duration?: number;
}) {
  const [val, setVal] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const prog = Math.min((ts - startRef.current) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      setVal(parseFloat((eased * to).toFixed(decimals)));
      if (prog < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [to, duration, decimals]);

  return <>{prefix}{val.toLocaleString()}{suffix}</>;
}

// ── 3D tilt card wrapper ──────────────────────────────────────────────────────
function TiltCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 250, damping: 22 });
  const sry = useSpring(ry, { stiffness: 250, damping: 22 });

  return (
    <div ref={ref}
      style={{ perspective: "700px" }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * 10);
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 10);
      }}
      onMouseLeave={() => { rx.set(0); ry.set(0); }}
    >
      <motion.div style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d", ...style }}>
        {children}
      </motion.div>
    </div>
  );
}

// ── Demand signal bar ─────────────────────────────────────────────────────────
const DEMAND_CONFIG = {
  "very high": { pct: 95, color: "#22c55e", label: "Very High" },
  high:        { pct: 72, color: "#84cc16", label: "High" },
  moderate:    { pct: 48, color: "#f59e0b", label: "Moderate" },
  low:         { pct: 20, color: "#64748b", label: "Low" },
};

// ── Main Component ────────────────────────────────────────────────────────────
interface Props { oracle: MarketOracleResult | null; loading: boolean; }

export function MarketOraclePanel({ oracle, loading }: Props) {
  const demand = oracle ? DEMAND_CONFIG[oracle.demand_signal] : null;
  const [expandEmergingIdx, setExpandEmergingIdx] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "linear-gradient(145deg, rgba(14,165,233,0.06) 0%, rgba(13,14,18,0.95) 100%)",
        border: "1px solid rgba(14,165,233,0.2)",
        borderRadius: "20px",
        overflow: "hidden",
        backdropFilter: "blur(24px)",
        position: "relative",
      }}
    >
      {/* Top glow bar */}
      <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, #0ea5e9, transparent)" }} />

      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(14,165,233,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <motion.div
            animate={{ opacity: loading ? [0.4, 1, 0.4] : 1 }}
            transition={{ duration: 1.5, repeat: loading ? Infinity : 0 }}
            style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: loading ? "#f59e0b" : oracle ? "#22c55e" : "#64748b",
              boxShadow: loading ? "0 0 8px #f59e0b" : oracle ? "0 0 8px #22c55e" : "none",
            }}
          />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#0ea5e9" }}>
            Market Oracle
          </span>
          {oracle && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "rgba(14,165,233,0.5)", marginLeft: "auto" }}>
              {oracle.data_freshness === "estimated" ? "Est. from training" : `Live · ${oracle.data_freshness}`}
            </span>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && !oracle && (
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {[80, 60, 90, 50].map((w, i) => (
            <motion.div
              key={i}
              style={{ height: "14px", borderRadius: "7px", background: "rgba(14,165,233,0.08)", width: `${w}%`, overflow: "hidden", position: "relative" }}
            >
              <motion.div
                style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(14,165,233,0.15), transparent)" }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear", delay: i * 0.1 }}
              />
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {oracle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Salary band */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(14,165,233,0.08)" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "rgba(14,165,233,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
                Compensation Range · {oracle.salary_currency}
              </div>
              <TiltCard>
                <div style={{
                  background: "rgba(14,165,233,0.05)", borderRadius: "14px", padding: "16px 20px",
                  border: "1px solid rgba(14,165,233,0.12)", display: "flex", alignItems: "baseline", gap: "8px",
                }}>
                  <span style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "28px", fontWeight: 700, color: "#0ea5e9", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    $<AnimCounter to={oracle.salary_min / 1000} suffix="k" />
                  </span>
                  <span style={{ color: "rgba(14,165,233,0.4)", fontFamily: "'DM Mono', monospace", fontSize: "14px" }}>–</span>
                  <span style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "28px", fontWeight: 700, color: "#0ea5e9", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    $<AnimCounter to={oracle.salary_max / 1000} suffix="k" />
                  </span>
                  <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "rgba(14,165,233,0.5)", marginLeft: "4px" }}>/yr</span>
                </div>
              </TiltCard>
            </div>

            {/* Demand signal */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(14,165,233,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "rgba(14,165,233,0.6)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Market Demand
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", fontWeight: 700, color: demand!.color }}>
                    {demand!.label}
                  </span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: "10px",
                    color: oracle.demand_growth_pct >= 0 ? "#22c55e" : "#ef4444",
                    background: oracle.demand_growth_pct >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${oracle.demand_growth_pct >= 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                    borderRadius: "6px", padding: "2px 6px",
                  }}>
                    {oracle.demand_growth_pct >= 0 ? "+" : ""}{oracle.demand_growth_pct}% YoY
                  </span>
                </div>
              </div>
              <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${demand!.pct}%` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  style={{ height: "100%", background: `linear-gradient(90deg, ${demand!.color}80, ${demand!.color})`, borderRadius: "3px", boxShadow: `0 0 8px ${demand!.color}60` }}
                />
              </div>
            </div>

            {/* Hot skills */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(14,165,233,0.08)" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "rgba(14,165,233,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>
                🔥 Hot Skills Right Now
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {oracle.hot_skills.map((skill, i) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * i, type: "spring", stiffness: 300 }}
                    style={{
                      padding: "4px 10px", borderRadius: "20px", fontSize: "11px",
                      fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500,
                      background: "rgba(14,165,233,0.08)",
                      border: "1px solid rgba(14,165,233,0.2)",
                      color: "#7dd3fc",
                    }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Emerging roles */}
            {oracle.emerging_roles?.length > 0 && (
              <div style={{ padding: "16px 24px", borderBottom: oracle.company_intel ? "1px solid rgba(14,165,233,0.08)" : "none" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "rgba(14,165,233,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>
                  🌱 Emerging Adjacent Roles
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {oracle.emerging_roles.map((role, i) => (
                    <motion.div
                      key={role.title}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i }}
                      onClick={() => setExpandEmergingIdx(expandEmergingIdx === i ? null : i)}
                      style={{
                        padding: "10px 12px", borderRadius: "10px", cursor: "pointer",
                        background: expandEmergingIdx === i ? "rgba(14,165,233,0.08)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${expandEmergingIdx === i ? "rgba(14,165,233,0.2)" : "rgba(255,255,255,0.05)"}`,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", fontWeight: 600, color: "var(--text-1)" }}>
                          {role.title}
                        </span>
                        <span style={{
                          fontFamily: "'DM Mono', monospace", fontSize: "10px", fontWeight: 700,
                          color: role.growth_pct >= 0 ? "#22c55e" : "#ef4444",
                          background: role.growth_pct >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          border: `1px solid ${role.growth_pct >= 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                          borderRadius: "6px", padding: "2px 6px",
                        }}>
                          +{role.growth_pct}%
                        </span>
                      </div>
                      <AnimatePresence>
                        {expandEmergingIdx === i && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-4)", lineHeight: 1.6, margin: "6px 0 0", overflow: "hidden" }}
                          >
                            {role.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Company intel */}
            {oracle.company_intel && (
              <div style={{ padding: "16px 24px" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "rgba(14,165,233,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Company Intel
                </div>
                <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-3)", lineHeight: 1.7, margin: 0 }}>
                  {oracle.company_intel}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
