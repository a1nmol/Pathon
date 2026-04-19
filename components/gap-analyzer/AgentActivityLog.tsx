"use client";

import { motion } from "framer-motion";
import type { GapAnalysisPhase } from "@/types/gap-analyzer";

interface Step {
  phase: GapAnalysisPhase;
  label: string;
  sublabel: string;
  color: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    phase: "oracle_running",
    label: "Market Oracle",
    sublabel: "Fetching live salary & demand data",
    color: "#0ea5e9",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    phase: "agent_a_running",
    label: "Gap Planner",
    sublabel: "Mapping your skill gaps against market demand",
    color: "#7c85f5",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    phase: "syllabus_running",
    label: "Syllabus Builder",
    sublabel: "Finding real courses & building your schedule",
    color: "#c9a86c",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
];

const PHASE_ORDER: GapAnalysisPhase[] = [
  "oracle_running", "oracle_done",
  "agent_a_running", "agent_a_done",
  "syllabus_running", "complete",
];

function phaseIndex(p: GapAnalysisPhase) {
  return PHASE_ORDER.indexOf(p);
}

function getStepStatus(step: Step, currentPhase: GapAnalysisPhase): "done" | "active" | "pending" {
  const donePhaseMap: Record<string, GapAnalysisPhase> = {
    oracle_running:  "oracle_done",
    agent_a_running: "agent_a_done",
    syllabus_running: "complete",
  };
  const donePhase = donePhaseMap[step.phase];
  if (phaseIndex(currentPhase) > phaseIndex(donePhase)) return "done";
  if (currentPhase === step.phase) return "active";
  return "pending";
}

interface Props {
  phase: GapAnalysisPhase;
}

export function AgentActivityLog({ phase }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
        padding: "20px 24px",
        backdropFilter: "blur(16px)",
      }}
    >
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "16px" }}>
        Agent Activity Log
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {STEPS.map((step, idx) => {
          const status = getStepStatus(step, phase);
          return (
            <motion.div
              key={step.phase}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: status === "pending" ? 0.35 : 1, x: 0 }}
              transition={{ delay: idx * 0.07 }}
              style={{
                display: "flex", alignItems: "flex-start", gap: "12px",
                padding: "10px 12px", borderRadius: "10px",
                background: status === "active" ? `${step.color}08` : "transparent",
                border: `1px solid ${status === "active" ? `${step.color}20` : "transparent"}`,
                transition: "all 0.3s ease",
              }}
            >
              {/* Status icon */}
              <div style={{
                width: "26px", height: "26px", borderRadius: "8px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: status === "done"
                  ? `${step.color}18`
                  : status === "active"
                  ? `${step.color}18`
                  : "rgba(255,255,255,0.04)",
                border: `1px solid ${status === "pending" ? "rgba(255,255,255,0.06)" : `${step.color}30`}`,
                color: status === "pending" ? "var(--text-4)" : step.color,
                transition: "all 0.3s ease",
              }}>
                {status === "done" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : status === "active" ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    style={{ width: "12px", height: "12px", borderRadius: "50%", border: `2px solid ${step.color}40`, borderTopColor: step.color }}
                  />
                ) : step.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", fontWeight: 600,
                    color: status === "pending" ? "var(--text-4)" : "var(--text-1)",
                  }}>
                    {step.label}
                  </span>
                  {status === "done" && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        fontFamily: "'DM Mono', monospace", fontSize: "9px",
                        color: step.color, background: `${step.color}12`,
                        border: `1px solid ${step.color}20`, borderRadius: "5px", padding: "1px 6px",
                      }}
                    >
                      DONE
                    </motion.span>
                  )}
                </div>
                <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-4)", marginTop: "2px" }}>
                  {step.sublabel}
                </div>

              </div>

              {/* Elapsed time placeholder */}
              {status === "done" && (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "var(--text-4)", flexShrink: 0, marginTop: "2px" }}>
                  ✓
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
