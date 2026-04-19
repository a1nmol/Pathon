"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SkillSyllabus, SyllabusDay, SyllabusBlock } from "@/types/gap-analyzer";

// ── Platform icon ─────────────────────────────────────────────────────────────
const PLATFORM_CONFIG: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  YouTube: {
    color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "YouTube",
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>,
  },
  Coursera: {
    color: "#0057b7", bg: "rgba(0,87,183,0.1)", label: "Coursera",
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4d9de0" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>,
  },
  "DeepLearning.ai": {
    color: "#ff6b35", bg: "rgba(255,107,53,0.1)", label: "DL.ai",
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff6b35" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
  },
  Udemy: {
    color: "#a435f0", bg: "rgba(164,53,240,0.1)", label: "Udemy",
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="#a435f0"><path d="M12 0A12 12 0 1 0 12 24A12 12 0 0 0 12 0Z"/></svg>,
  },
  GitHub: {
    color: "#6e7681", bg: "rgba(110,118,129,0.1)", label: "GitHub",
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="#6e7681"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>,
  },
  Other: {
    color: "#7c85f5", bg: "rgba(124,133,245,0.1)", label: "Resource",
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7c85f5" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  },
};

// ── Single block row ──────────────────────────────────────────────────────────
function BlockRow({ block, idx }: { block: SyllabusBlock; idx: number }) {
  const platform = block.resource ? (PLATFORM_CONFIG[block.resource.platform] ?? PLATFORM_CONFIG.Other) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.05 }}
      style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}
    >
      {/* Time indicator */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: "2px" }}>
        <div style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: block.resource ? (platform?.color ?? "#7c85f5") : "rgba(255,255,255,0.15)",
          flexShrink: 0,
        }} />
        {idx < 10 && <div style={{ width: "1px", flex: 1, minHeight: "20px", background: "rgba(255,255,255,0.06)", marginTop: "4px" }} />}
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingBottom: "14px" }}>
        {/* Time label + hours */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "var(--text-4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {block.time_of_day}
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: block.resource ? (platform?.color ?? "#7c85f5") : "var(--text-4)" }}>
            {block.hours}h
          </span>
        </div>

        {/* Activity */}
        <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-2)", lineHeight: 1.55, margin: "0 0 6px" }}>
          {block.activity}
        </p>

        {/* Resource pill */}
        {block.resource && platform && (
          <a
            href={block.resource.search_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            <motion.div
              whileHover={{ scale: 1.02, borderColor: `${platform.color}40` }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                padding: "5px 10px 5px 8px", borderRadius: "8px",
                background: platform.bg, border: `1px solid ${platform.color}25`,
                cursor: "pointer", transition: "border-color 0.2s ease",
              }}
            >
              {platform.icon}
              <div>
                <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", fontWeight: 600, color: "var(--text-1)", lineHeight: 1.3 }}>
                  {block.resource.title}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  {block.resource.creator && (
                    <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "10px", color: "var(--text-4)" }}>
                      {block.resource.creator}
                    </span>
                  )}
                  {block.resource.is_free ? (
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#22c55e", background: "rgba(34,197,94,0.1)", borderRadius: "4px", padding: "0 4px" }}>FREE</span>
                  ) : (
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#f59e0b", background: "rgba(245,158,11,0.1)", borderRadius: "4px", padding: "0 4px" }}>PAID</span>
                  )}
                </div>
              </div>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={platform.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "2px", opacity: 0.5 }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </motion.div>
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ── Day section ───────────────────────────────────────────────────────────────
function DaySection({ day, idx }: { day: SyllabusDay; idx: number }) {
  const [expanded, setExpanded] = useState(idx === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08 }}
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", padding: "12px 16px",
          display: "flex", alignItems: "center", gap: "12px",
          background: expanded ? "rgba(201,168,108,0.06)" : "rgba(255,255,255,0.02)",
          border: "none", cursor: "pointer",
          borderBottom: expanded ? "1px solid rgba(255,255,255,0.05)" : "none",
          transition: "background 0.2s ease",
        }}
      >
        <div style={{
          width: "28px", height: "28px", borderRadius: "8px",
          background: "rgba(201,168,108,0.12)", border: "1px solid rgba(201,168,108,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'DM Mono', monospace", fontSize: "11px", fontWeight: 700, color: "#c9a86c", flexShrink: 0,
        }}>
          {day.day}
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--text-1)" }}>
            Day {day.day}
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#c9a86c", opacity: 0.8 }}>
            {day.total_hours}h · {day.blocks.length} session{day.blocks.length !== 1 ? "s" : ""}
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: "var(--text-4)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "14px 16px 6px" }}>
              {day.blocks.map((block, i) => (
                <BlockRow key={i} block={block} idx={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main SyllabusCard ─────────────────────────────────────────────────────────
const GAP_COLORS = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.2)" },
  moderate: { color: "#c9a86c", bg: "rgba(201,168,108,0.06)", border: "rgba(201,168,108,0.2)" },
  minor:    { color: "#22c55e", bg: "rgba(34,197,94,0.06)",  border: "rgba(34,197,94,0.2)" },
};

interface Props { syllabus: SkillSyllabus; index: number; }

export function SyllabusCard({ syllabus, index }: Props) {
  const [copied, setCopied] = useState(false);
  const cfg = GAP_COLORS[syllabus.gap_level];

  function copyMarkdown() {
    const md = [
      `# ${syllabus.skill} — Learning Schedule`,
      `**Total:** ${syllabus.total_hours}h over ${syllabus.days.length} day(s)`,
      "",
      ...syllabus.days.flatMap((d) => [
        `## Day ${d.day} (${d.total_hours}h)`,
        ...d.blocks.map((b) =>
          `- **${b.time_of_day}** (${b.hours}h): ${b.activity}${b.resource ? ` → [${b.resource.title}](${b.resource.search_url})` : ""}`,
        ),
        "",
      ]),
      `**Milestone:** ${syllabus.milestone}`,
    ].join("\n");

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${cfg.color}`,
        borderRadius: "16px",
        overflow: "hidden",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.border}`, borderRadius: "5px", padding: "2px 7px" }}>
              {syllabus.gap_level}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "var(--text-4)" }}>
              {syllabus.total_hours}h total · {syllabus.days.length} day{syllabus.days.length !== 1 ? "s" : ""}
            </span>
          </div>
          <h3 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "16px", fontWeight: 700, color: "var(--text-1)", margin: 0, letterSpacing: "-0.02em" }}>
            {syllabus.skill}
          </h3>
        </div>

        <motion.button
          onClick={copyMarkdown}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            padding: "6px 12px", borderRadius: "8px", border: `1px solid ${cfg.border}`,
            background: copied ? `${cfg.color}12` : "transparent",
            color: copied ? cfg.color : "var(--text-4)",
            fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.08em",
            textTransform: "uppercase", cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s ease",
          }}
        >
          {copied ? "✓ Copied" : "Export MD"}
        </motion.button>
      </div>

      {/* Days */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {syllabus.days.map((day, i) => (
          <DaySection key={day.day} day={day} idx={i} />
        ))}
      </div>

      {/* Milestone */}
      <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: cfg.color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>
          🎯 Milestone
        </div>
        <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
          {syllabus.milestone}
        </p>
      </div>
    </motion.div>
  );
}
