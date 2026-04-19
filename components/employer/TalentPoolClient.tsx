"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

interface Candidate {
  id: string;
  name: string;
  email?: string;
  stage: string;
  ai_score?: number;
  ai_summary?: string;
  notes?: string;
  created_at: string;
  job_id: string;
  job_title?: string;
  has_resume?: boolean;
}

function parseFitSummary(raw?: string): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed.fit_summary ?? null;
  } catch {
    return raw.length > 200 ? null : raw;
  }
}

function TiltCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const spRX = useSpring(rotX, { stiffness: 260, damping: 22 });
  const spRY = useSpring(rotY, { stiffness: 260, damping: 22 });
  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    rotX.set(-((e.clientY - r.top) / r.height - 0.5) * 7);
    rotY.set(((e.clientX - r.left) / r.width - 0.5) * 7);
  }
  function onLeave() { rotX.set(0); rotY.set(0); }
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ perspective: "700px" }}>
      <motion.div style={{ rotateX: spRX, rotateY: spRY, transformStyle: "preserve-3d", ...style }}>
        {children}
      </motion.div>
    </div>
  );
}

const STAGE_COLOR: Record<string, string> = {
  applied:      "#7c85f5",
  reviewed:     "#a78bfa",
  phone_screen: "#c9a86c",
  interview:    "#5a8a6a",
  decision:     "#f59e0b",
  hired:        "#22c55e",
  passed:       "#64748b",
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "var(--copper)" : "var(--indigo)";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: "36px", height: "36px", borderRadius: "10px",
      background: `${color}15`, border: `1px solid ${color}30`,
      fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "13px",
      fontWeight: 700, color, flexShrink: 0,
    }}>
      {score}
    </div>
  );
}

function CandidateCard({ candidate, index }: { candidate: Candidate; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const initials = candidate.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const stageColor = STAGE_COLOR[candidate.stage] ?? "var(--indigo)";
  const fitSummary = parseFitSummary(candidate.ai_summary);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <TiltCard
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {/* Top accent */}
        <div style={{ height: "2px", background: `linear-gradient(90deg, ${stageColor}, transparent)` }} />

        <div style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Avatar */}
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: `${stageColor}18`, border: `1px solid ${stageColor}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "14px",
              fontWeight: 700, color: stageColor, flexShrink: 0,
              boxShadow: `0 4px 16px ${stageColor}20`,
            }}>
              {initials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "15px",
                fontWeight: 600, color: "var(--text-1)", overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {candidate.name}
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "3px", flexWrap: "wrap", alignItems: "center" }}>
                {candidate.email && (
                  <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-4)" }}>
                    {candidate.email}
                  </span>
                )}
                {candidate.job_title && (
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: "10px",
                    color: `${stageColor}90`, letterSpacing: "0.04em",
                  }}>
                    {candidate.job_title}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              {candidate.has_resume && (
                <div style={{
                  padding: "3px 8px", borderRadius: "5px",
                  background: "rgba(124,133,245,0.08)", color: "var(--indigo)",
                  fontFamily: "'DM Mono', monospace", fontSize: "9px",
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  border: "1px solid rgba(124,133,245,0.15)",
                }}>
                  Resume
                </div>
              )}
              {candidate.ai_score !== undefined && <ScoreBadge score={candidate.ai_score} />}
              <div style={{
                padding: "3px 10px", borderRadius: "6px",
                background: `${stageColor}12`, color: stageColor,
                fontFamily: "'DM Mono', monospace", fontSize: "10px",
                letterSpacing: "0.06em", textTransform: "capitalize",
                border: `1px solid ${stageColor}20`,
              }}>
                {candidate.stage.replace("_", " ")}
              </div>
            </div>
          </div>

          {fitSummary && (
            <>
              <motion.button
                onClick={() => setExpanded((v) => !v)}
                style={{
                  marginTop: "12px", background: "none", border: "none",
                  color: "var(--text-4)", fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: "11px", cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", gap: "4px",
                }}
                whileHover={{ color: "var(--indigo)" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
                {expanded ? "Hide AI summary" : "View AI verdict"}
              </motion.button>

              <AnimatePresence>
                {expanded && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px",
                      color: "var(--text-3)", lineHeight: 1.7, margin: "10px 0 0",
                      overflow: "hidden", padding: "12px 14px",
                      background: "rgba(255,255,255,0.02)", borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    {fitSummary}
                  </motion.p>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </TiltCard>
    </motion.div>
  );
}

export function TalentPoolClient({ candidates }: { candidates: Candidate[] }) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const filtered = candidates.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.job_title ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || c.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const stages = ["all", ...Array.from(new Set(candidates.map((c) => c.stage)))];

  return (
    <div style={{ minHeight: "100vh", padding: "calc(var(--nav-h, 56px) + 2rem) 2rem 5rem", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 50% 30% at 60% 20%, rgba(124,133,245,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "860px", margin: "0 auto" }}>
        {/* Header */}
        <motion.div style={{ marginBottom: "32px" }} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--indigo)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>
            Talent Pool
          </div>
          <h1 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: "var(--text-1)", margin: 0, letterSpacing: "-0.03em" }}>
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
          </h1>
        </motion.div>

        {/* Search + filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or role..."
            style={{
              flex: 1, minWidth: "200px", padding: "10px 14px", borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)",
              color: "var(--text-1)", fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "13px", outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {stages.map((s) => (
              <motion.button
                key={s}
                onClick={() => setStageFilter(s)}
                style={{
                  padding: "8px 14px", borderRadius: "8px",
                  border: `1px solid ${stageFilter === s ? "var(--indigo)" : "rgba(255,255,255,0.07)"}`,
                  background: stageFilter === s ? "rgba(124,133,245,0.1)" : "transparent",
                  color: stageFilter === s ? "var(--indigo)" : "var(--text-3)",
                  fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px",
                  cursor: "pointer", textTransform: "capitalize",
                }}
                whileTap={{ scale: 0.95 }}
              >
                {s === "all" ? `All (${candidates.length})` : s.replace("_", " ")}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* List */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "14px", color: "var(--text-4)" }}>
              {candidates.length === 0 ? "No candidates yet. Start reviewing your pipeline." : "No matches found."}
            </div>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map((c, i) => (
              <CandidateCard key={c.id} candidate={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
