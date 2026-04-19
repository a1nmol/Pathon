"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { updateCandidateStage } from "@/app/actions/employer";

// ── Types ─────────────────────────────────────────────────────────────────────

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
}

interface PipelineKanbanProps {
  candidates: Candidate[];
}

// ── Stage config ──────────────────────────────────────────────────────────────

const STAGES = [
  { key: "applied",      label: "Applied",      color: "#7c85f5", bg: "rgba(124,133,245,0.08)" },
  { key: "reviewed",     label: "Reviewed",     color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
  { key: "phone_screen", label: "Phone Screen", color: "#c9a86c", bg: "rgba(201,168,108,0.08)" },
  { key: "interview",    label: "Interview",    color: "#5a8a6a", bg: "rgba(90,138,106,0.08)"  },
  { key: "decision",     label: "Decision",     color: "#f59e0b", bg: "rgba(245,158,11,0.08)"  },
  { key: "hired",        label: "Hired",        color: "#22c55e", bg: "rgba(34,197,94,0.08)"   },
];

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "var(--copper)" : "var(--indigo)";
  const r = 12, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: "34px", height: "34px", flexShrink: 0 }}>
      <svg width="34" height="34" style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
        <circle cx="17" cy="17" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
        <motion.circle
          cx="17" cy="17" r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - score / 100) }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Mono', monospace", fontSize: "10px", fontWeight: 700, color,
      }}>
        {score}
      </div>
    </div>
  );
}

function TiltCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const spRX = useSpring(rotX, { stiffness: 280, damping: 24 });
  const spRY = useSpring(rotY, { stiffness: 280, damping: 24 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    rotX.set(-((e.clientY - r.top) / r.height - 0.5) * 8);
    rotY.set(((e.clientX - r.left) / r.width - 0.5) * 8);
  }
  function onLeave() { rotX.set(0); rotY.set(0); }

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ perspective: "600px" }}>
      <motion.div style={{ rotateX: spRX, rotateY: spRY, transformStyle: "preserve-3d", ...style }}>
        {children}
      </motion.div>
    </div>
  );
}

// ── Candidate card ────────────────────────────────────────────────────────────

function CandidateCard({
  candidate,
  stageColor,
  onMove,
  isPending,
}: {
  candidate: Candidate;
  stageColor: string;
  onMove: (id: string, newStage: string) => void;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const initials = candidate.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const otherStages = STAGES.filter((s) => s.key !== candidate.stage);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s ease" }}
    >
      <TiltCard
        style={{
          background: "rgba(255,255,255,0.025)",
          border: `1px solid rgba(255,255,255,0.07)`,
          borderRadius: "14px",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
      {/* Top accent */}
      <div style={{ height: "2px", background: `linear-gradient(90deg, ${stageColor}, transparent)` }} />

      <div style={{ padding: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Avatar */}
          <div
            style={{
              width: "38px", height: "38px", borderRadius: "10px",
              background: `${stageColor}18`, border: `1px solid ${stageColor}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "13px",
              fontWeight: 700, color: stageColor, flexShrink: 0,
              boxShadow: `0 4px 12px ${stageColor}20`,
            }}
          >
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px",
              fontWeight: 600, color: "var(--text-1)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {candidate.name}
            </div>
            {candidate.email && (
              <div style={{
                fontFamily: "'Inter', system-ui, sans-serif", fontSize: "10px",
                color: "var(--text-4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {candidate.email}
              </div>
            )}
          </div>

          {candidate.ai_score !== undefined && candidate.ai_score !== null && (
            <ScoreBadge score={candidate.ai_score} />
          )}
        </div>

        {candidate.job_title && (
          <div style={{
            marginTop: "8px", fontFamily: "'DM Mono', monospace", fontSize: "10px",
            color: `${stageColor}90`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            letterSpacing: "0.02em",
          }}>
            {candidate.job_title}
          </div>
        )}

        {/* Expand toggle */}
        <motion.button
          onClick={() => setExpanded((v) => !v)}
          style={{
            marginTop: "10px", background: "none", border: "none",
            color: "var(--text-4)", fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "11px", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", gap: "4px",
          }}
          whileHover={{ color: stageColor }}
        >
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
          {expanded ? "Collapse" : "Move / Details"}
        </motion.button>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.04)",
                padding: "12px 14px",
              }}
            >
              {candidate.ai_summary && (
                <p
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: "12px",
                    color: "var(--text-3)",
                    lineHeight: 1.6,
                    margin: "0 0 12px",
                  }}
                >
                  {candidate.ai_summary}
                </p>
              )}

              <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-4)", marginBottom: "8px" }}>
                Move to stage:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {otherStages.map((s) => (
                  <motion.button
                    key={s.key}
                    onClick={() => onMove(candidate.id, s.key)}
                    disabled={isPending}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: `1px solid ${s.color}30`,
                      background: `${s.color}10`,
                      color: s.color,
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {s.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </TiltCard>
    </motion.div>
  );
}

// ── Stage column ──────────────────────────────────────────────────────────────

function StageColumn({
  stage,
  candidates,
  onMove,
  pendingId,
}: {
  stage: typeof STAGES[0];
  candidates: Candidate[];
  onMove: (id: string, newStage: string) => void;
  pendingId: string | null;
}) {
  return (
    <div
      style={{
        minWidth: "260px",
        maxWidth: "300px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        flexShrink: 0,
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderRadius: "12px",
          background: `linear-gradient(135deg, ${stage.bg} 0%, rgba(0,0,0,0.2) 100%)`,
          border: `1px solid ${stage.color}25`,
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: stage.color }} />
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-1)",
            }}
          >
            {stage.label}
          </span>
        </div>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            color: stage.color,
            background: `${stage.color}15`,
            padding: "2px 8px",
            borderRadius: "6px",
          }}
        >
          {candidates.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", minHeight: "80px" }}>
        <AnimatePresence mode="popLayout">
          {candidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              stageColor={stage.color}
              onMove={onMove}
              isPending={pendingId === c.id}
            />
          ))}
        </AnimatePresence>

        {candidates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              height: "70px", borderRadius: "12px",
              border: `1px dashed ${stage.color}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `${stage.color}04`,
            }}
          >
            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-4)" }}>
              No candidates yet
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Main Kanban ───────────────────────────────────────────────────────────────

export function PipelineKanban({ candidates: initialCandidates }: PipelineKanbanProps) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function handleMove(candidateId: string, newStage: string) {
    // Optimistic update
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage: newStage } : c))
    );
    setPendingId(candidateId);

    startTransition(async () => {
      try {
        await updateCandidateStage(candidateId, newStage);
      } catch {
        // Revert on error
        setCandidates(initialCandidates);
      } finally {
        setPendingId(null);
      }
    });
  }

  const byStage = (stageKey: string) => candidates.filter((c) => c.stage === stageKey);
  const totalActive = candidates.filter((c) => !["hired", "passed"].includes(c.stage)).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "calc(var(--nav-h, 60px) + 2rem) 3rem 5rem",
        position: "relative",
      }}
    >
      {/* Ambient bg */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(ellipse 60% 40% at 30% 20%, rgba(124,133,245,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <motion.div
          style={{ marginBottom: "32px", paddingRight: "2rem" }}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--indigo)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>
                Candidate Pipeline
              </div>
              <h1
                style={{
                  fontFamily: "'Poppins', system-ui, sans-serif",
                  fontSize: "clamp(20px, 3vw, 28px)",
                  fontWeight: 700,
                  color: "var(--text-1)",
                  margin: 0,
                  letterSpacing: "-0.03em",
                }}
              >
                {totalActive} active candidate{totalActive !== 1 ? "s" : ""}
              </h1>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              {["applied", "reviewed", "interview", "hired"].map((s) => {
                const meta = STAGES.find((st) => st.key === s)!;
                const count = byStage(s).length;
                return (
                  <div
                    key={s}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: `${meta.color}0a`,
                      border: `1px solid ${meta.color}20`,
                    }}
                  >
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: meta.color }} />
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: meta.color }}>
                      {count} {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Kanban board — horizontal scroll */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            overflowX: "auto",
            paddingBottom: "24px",
            paddingRight: "2rem",
            scrollSnapType: "x mandatory",
          }}
        >
          {STAGES.map((stage, i) => (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ scrollSnapAlign: "start" }}
            >
              <StageColumn
                stage={stage}
                candidates={byStage(stage.key)}
                onMove={handleMove}
                pendingId={pendingId}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
