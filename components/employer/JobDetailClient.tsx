"use client";

import React, { useState, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { bulkScreenResumes, generateCandidateEmail, type EmailType } from "@/app/actions/screening";
import { updateCandidateStage, updateJobStatus, deleteCandidate, generateInterviewKit } from "@/app/actions/employer";

// ── Export helpers ────────────────────────────────────────────────────────────

function buildJobHTML(job: { title: string; description: string; requirements: string[]; nice_to_haves: string[]; salary_min?: number | null; salary_max?: number | null; location?: string | null; remote_ok: boolean; employment_type: string }) {
  const salary = job.salary_min && job.salary_max
    ? `$${job.salary_min.toLocaleString()}–$${job.salary_max.toLocaleString()}`
    : job.salary_min ? `From $${job.salary_min.toLocaleString()}` : null;

  const meta = [job.employment_type, job.location ?? (job.remote_ok ? "Remote" : ""), job.remote_ok ? "Remote OK" : "", salary ?? ""].filter(Boolean).join(" · ");
  const reqRows = job.requirements.map((r) => `<li>${r}</li>`).join("");
  const niceRows = job.nice_to_haves.map((r) => `<li>${r}</li>`).join("");

  return `
    <h1 style="font-size:26px;font-weight:700;margin:0 0 8px;letter-spacing:-0.5px">${job.title}</h1>
    <p style="font-size:13px;color:#666;margin:0 0 32px">${meta}</p>
    ${job.description ? `<h2 style="font-size:14px;font-weight:600;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #e8e8e8">Description</h2><p style="font-size:14px;line-height:1.8;white-space:pre-wrap;margin:0 0 28px;color:#333">${job.description}</p>` : ""}
    ${reqRows ? `<h2 style="font-size:14px;font-weight:600;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #e8e8e8">Requirements</h2><ul style="padding-left:20px;margin:0 0 28px">${reqRows}</ul>` : ""}
    ${niceRows ? `<h2 style="font-size:14px;font-weight:600;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid #e8e8e8">Nice to Have</h2><ul style="padding-left:20px;margin:0 0 28px">${niceRows}</ul>` : ""}
  `;
}

function downloadJobPDF(job: { title: string; description: string; requirements: string[]; nice_to_haves: string[]; salary_min?: number | null; salary_max?: number | null; location?: string | null; remote_ok: boolean; employment_type: string }) {
  const body = buildJobHTML(job);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${job.title} — Job Description</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;color:#111;padding:60px 72px;max-width:820px;margin:0 auto}
    li{font-size:14px;line-height:1.75;color:#333;margin-bottom:4px}
    @media print{body{padding:40px 48px}@page{margin:0}}
  </style></head><body>${body}</body></html>`;
  const win = window.open("", "_blank", "width=900,height=750");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 400);
}

function downloadJobWord(job: { title: string; description: string; requirements: string[]; nice_to_haves: string[]; salary_min?: number | null; salary_max?: number | null; location?: string | null; remote_ok: boolean; employment_type: string }) {
  const body = buildJobHTML(job);
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${job.title}</title><style>body{font-family:Calibri,Arial,sans-serif}h1{font-size:20pt}h2{font-size:13pt}p,li{font-size:11pt;line-height:1.6}</style></head><body>${body}</body></html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${job.title.replace(/[^a-z0-9]/gi, "_")}_job_description.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Job {
  id: string; title: string; description: string;
  requirements: string[]; nice_to_haves: string[];
  salary_min?: number | null; salary_max?: number | null;
  location?: string | null; remote_ok: boolean;
  employment_type: string; status: string; created_at: string;
}

interface Candidate {
  id: string; name: string; email?: string; stage: string;
  ai_score?: number; ai_summary?: string;
  created_at: string; has_resume: boolean;
}

interface ParsedSummary {
  fit_summary?: string;
  strengths?: string[];
  gaps?: string[];
  interview_questions?: string[];
  technical_fit?: number;
  experience_match?: number;
  culture_signals?: number;
  growth_trajectory?: number;
  recommendation?: string;
}

interface ResumeBlock {
  id: string;
  name: string;
  email: string;
  text: string;
  charCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseSummary(raw?: string): ParsedSummary {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return { fit_summary: raw }; }
}

function recommendationMeta(rec?: string) {
  if (rec === "strong_yes") return { label: "Strong Yes", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
  if (rec === "yes")        return { label: "Yes",        color: "#5a8a6a", bg: "rgba(90,138,106,0.1)" };
  if (rec === "maybe")      return { label: "Maybe",      color: "var(--copper)", bg: "rgba(201,168,108,0.1)" };
  return                           { label: "No",         color: "#64748b", bg: "rgba(100,116,139,0.1)" };
}

function ScoreRing({ value, size = 56, label }: { value: number; size?: number; label?: string }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const color = value >= 80 ? "#22c55e" : value >= 65 ? "var(--copper)" : value >= 50 ? "var(--indigo)" : "#64748b";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
          <motion.circle
            cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - value / 100) }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", fontFamily: "'Poppins', system-ui, sans-serif",
          fontSize: size > 48 ? "16px" : "11px", fontWeight: 700, color,
        }}>
          {value}
        </div>
      </div>
      {label && <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "10px", color: "var(--text-4)", textAlign: "center" }}>{label}</div>}
    </div>
  );
}

// ── Resume Block (drag-drop upload area) ──────────────────────────────────────

function ResumeBlockCard({
  block, index, onUpdate, onRemove,
}: {
  block: ResumeBlock; index: number;
  onUpdate: (id: string, field: keyof ResumeBlock, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      style={{
        border: `1px solid ${dragOver ? "var(--indigo)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: "14px",
        background: dragOver ? "rgba(124,133,245,0.05)" : "rgba(255,255,255,0.02)",
        overflow: "hidden",
        transition: "border-color 0.2s ease, background 0.2s ease",
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragOver(false);
        const text = e.dataTransfer.getData("text/plain");
        if (text) onUpdate(block.id, "text", text);
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderBottom: block.text ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
        <div style={{
          width: "28px", height: "28px", borderRadius: "8px",
          background: "rgba(124,133,245,0.12)", border: "1px solid rgba(124,133,245,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--indigo)", flexShrink: 0,
        }}>
          {String(index + 1).padStart(2, "0")}
        </div>

        <input
          value={block.name}
          onChange={(e) => onUpdate(block.id, "name", e.target.value)}
          placeholder="Candidate name"
          style={{
            flex: 1, background: "none", border: "none", color: "var(--text-1)",
            fontFamily: "'Inter', system-ui, sans-serif", fontSize: "14px",
            fontWeight: 500, outline: "none",
          }}
        />
        <input
          value={block.email}
          onChange={(e) => onUpdate(block.id, "email", e.target.value)}
          placeholder="Email (optional)"
          style={{
            width: "180px", background: "none", border: "none", color: "var(--text-3)",
            fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", outline: "none",
          }}
        />

        {block.text && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--green)", background: "rgba(90,138,106,0.1)", padding: "3px 8px", borderRadius: "5px", flexShrink: 0 }}>
            {block.charCount.toLocaleString()} chars
          </div>
        )}

        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", padding: "4px", fontSize: "18px", lineHeight: 1 }}
        >
          {expanded ? "↑" : "↓"}
        </button>
        <button
          onClick={() => onRemove(block.id)}
          style={{ background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", padding: "4px", fontSize: "16px", lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Paste area */}
      <AnimatePresence>
        {(expanded || !block.text) && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <textarea
              value={block.text}
              onChange={(e) => onUpdate(block.id, "text", e.target.value)}
              placeholder="Paste resume text here, or drag a .txt file onto this card…"
              rows={block.text ? 6 : 4}
              style={{
                width: "100%", padding: "14px 16px", background: "rgba(0,0,0,0.2)",
                border: "none", color: "var(--text-2)", fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "12px", lineHeight: 1.6, outline: "none", resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Screened candidate card ───────────────────────────────────────────────────

function ScreenedCard({ candidate, index, onMove, onEmail, onDelete }: {
  candidate: Candidate; index: number;
  onMove: (id: string, stage: string) => void;
  onEmail: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const summary = parseSummary(candidate.ai_summary);
  const rec = recommendationMeta(summary.recommendation);
  const initials = candidate.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${index === 0 ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: "16px", overflow: "hidden",
      }}
    >
      {/* Top bar — rank + score */}
      <div style={{
        height: "2px",
        background: index === 0
          ? "linear-gradient(90deg, #22c55e, transparent)"
          : index <= 2
          ? "linear-gradient(90deg, var(--indigo), transparent)"
          : "linear-gradient(90deg, rgba(255,255,255,0.06), transparent)",
      }} />

      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Rank */}
          <div style={{
            width: "28px", fontFamily: "'DM Mono', monospace", fontSize: "11px",
            color: index === 0 ? "#22c55e" : "var(--text-4)", textAlign: "center", flexShrink: 0,
          }}>
            #{index + 1}
          </div>

          {/* Avatar */}
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: index === 0 ? "rgba(34,197,94,0.12)" : "rgba(124,133,245,0.1)",
            border: `1px solid ${index === 0 ? "rgba(34,197,94,0.2)" : "rgba(124,133,245,0.15)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "13px",
            fontWeight: 700, color: index === 0 ? "#22c55e" : "var(--indigo)", flexShrink: 0,
          }}>
            {initials}
          </div>

          {/* Name + email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "15px", fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {candidate.name}
              {index === 0 && <span style={{ marginLeft: "8px", fontSize: "10px", color: "#22c55e", fontWeight: 400, fontFamily: "'DM Mono', monospace" }}>TOP PICK</span>}
            </div>
            {candidate.email && (
              <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-4)" }}>
                {candidate.email}
              </div>
            )}
          </div>

          {/* Recommendation badge */}
          <div style={{ padding: "4px 12px", borderRadius: "8px", background: rec.bg, color: rec.color, fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "12px", fontWeight: 600, flexShrink: 0 }}>
            {rec.label}
          </div>

          {/* Overall score ring */}
          {candidate.ai_score !== undefined && (
            <ScoreRing value={candidate.ai_score} size={52} />
          )}

          <button onClick={() => setExpanded((v) => !v)} style={{ background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", padding: "8px", marginLeft: "4px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        {/* Score breakdown — always visible */}
        {summary.technical_fit !== undefined && (
          <div style={{ display: "flex", gap: "16px", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.04)", flexWrap: "wrap" }}>
            {[
              { label: "Technical", val: summary.technical_fit },
              { label: "Experience", val: summary.experience_match },
              { label: "Culture", val: summary.culture_signals },
              { label: "Growth", val: summary.growth_trajectory },
            ].map(({ label, val }) => val !== undefined && (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "80px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-4)" }}>{label}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: val >= 70 ? "var(--green)" : "var(--text-3)" }}>{val}</span>
                </div>
                <div style={{ height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <motion.div
                    style={{ height: "100%", borderRadius: "2px", background: val >= 80 ? "#22c55e" : val >= 60 ? "var(--copper)" : "var(--indigo)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${val}%` }}
                    transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Verdict */}
              {summary.fit_summary && (
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--indigo)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>AI Verdict</div>
                  <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-2)", lineHeight: 1.7, margin: 0 }}>
                    {summary.fit_summary}
                  </p>
                </div>
              )}

              {/* Strengths + Gaps */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {summary.strengths && summary.strengths.length > 0 && (
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#22c55e", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Strengths</div>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {summary.strengths.map((s, i) => (
                        <li key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", flexShrink: 0, marginTop: "6px" }} />
                          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-2)", lineHeight: 1.5 }}>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {summary.gaps && summary.gaps.length > 0 && (
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--copper)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Gaps</div>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {summary.gaps.map((g, i) => (
                        <li key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--copper)", flexShrink: 0, marginTop: "6px" }} />
                          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-2)", lineHeight: 1.5 }}>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Interview questions */}
              {summary.interview_questions && summary.interview_questions.length > 0 && (
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--indigo)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Tailored Interview Questions</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {summary.interview_questions.map((q, i) => (
                      <div key={i} style={{
                        padding: "10px 14px", borderRadius: "10px",
                        background: "rgba(124,133,245,0.05)", border: "1px solid rgba(124,133,245,0.1)",
                        display: "flex", gap: "10px",
                      }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--indigo)", flexShrink: 0 }}>Q{i + 1}</span>
                        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6 }}>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Move to stage */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "4px" }}>
                <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-4)", alignSelf: "center" }}>Move to:</span>
                {[
                  { key: "phone_screen", label: "Phone Screen", color: "var(--copper)" },
                  { key: "interview",    label: "Interview",    color: "var(--green)"  },
                  { key: "hired",        label: "Hire",         color: "#22c55e"       },
                  { key: "passed",       label: "Pass",         color: "#64748b"       },
                ].filter((s) => s.key !== candidate.stage).map((s) => (
                  <motion.button
                    key={s.key}
                    onClick={() => onMove(candidate.id, s.key)}
                    style={{
                      padding: "6px 14px", borderRadius: "8px",
                      border: `1px solid ${s.color}30`, background: `${s.color}0a`,
                      color: s.color, fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: "12px", fontWeight: 500, cursor: "pointer",
                    }}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  >
                    {s.label}
                  </motion.button>
                ))}
              </div>

              {/* Actions row */}
              <div style={{ display: "flex", gap: "8px", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <motion.button
                  onClick={() => onEmail(candidate.id, candidate.name)}
                  style={{
                    padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(124,133,245,0.25)",
                    background: "rgba(124,133,245,0.06)", color: "var(--indigo)",
                    fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px",
                    fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                  }}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 7l10 7 10-7"/></svg>
                  Draft Email
                </motion.button>
                <motion.button
                  onClick={() => onDelete(candidate.id)}
                  style={{
                    padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(100,116,139,0.2)",
                    background: "transparent", color: "var(--text-4)",
                    fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px",
                    fontWeight: 400, cursor: "pointer",
                  }}
                  whileHover={{ scale: 1.03, color: "#ef4444" }} whileTap={{ scale: 0.97 }}
                >
                  Remove
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function JobDetailClient({ job, candidates: initialCandidates }: {
  job: Job;
  candidates: Candidate[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "screen" | "candidates" | "kit">(
    initialCandidates.length === 0 ? "screen" : "candidates"
  );

  // Interview kit
  const [kitLoading, setKitLoading] = useState(false);
  const [kitData, setKitData] = useState<{
    behavioral: string[]; technical: string[]; cultureAndTeam: string[];
    roleSpecific: string[]; redFlags: string[];
  } | null>(null);
  const [kitError, setKitError] = useState<string | null>(null);
  const [kitCopied, setKitCopied] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<ResumeBlock[]>([]);
  const [candidates, setCandidates] = useState(initialCandidates);
  const [isPending, startTransition] = useTransition();
  const [screeningError, setScreeningError] = useState<string | null>(null);
  const [screeningDone, setScreeningDone] = useState(false);
  const blockIdRef = useRef(0);

  // Job status
  const [jobStatus, setJobStatus] = useState<"draft" | "active" | "closed">(
    job.status as "draft" | "active" | "closed"
  );
  const [statusPending, startStatusTransition] = useTransition();

  // Email modal
  const [emailModal, setEmailModal] = useState<{
    candidateId: string; candidateName: string;
  } | null>(null);
  const [emailType, setEmailType] = useState<EmailType>("interview_invite");
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  function addBlock() {
    const id = String(++blockIdRef.current);
    setBlocks((b) => [...b, { id, name: "", email: "", text: "", charCount: 0 }]);
  }

  function updateBlock(id: string, field: keyof ResumeBlock, value: string) {
    setBlocks((b) => b.map((bl) =>
      bl.id === id
        ? { ...bl, [field]: value, charCount: field === "text" ? value.length : bl.charCount }
        : bl
    ));
  }

  function removeBlock(id: string) {
    setBlocks((b) => b.filter((bl) => bl.id !== id));
  }

  function handleScreen() {
    const ready = blocks.filter((b) => b.name.trim() && b.text.trim());
    if (ready.length === 0) return;
    setScreeningError(null);

    startTransition(async () => {
      try {
        const results = await bulkScreenResumes(
          job.id,
          ready.map((b) => ({ name: b.name.trim(), email: b.email.trim(), resumeText: b.text.trim() })),
        );
        // Refresh candidates
        const newCandidates = results.map((r) => ({
          id: r.candidateId ?? "",
          name: r.name,
          email: r.email || undefined,
          stage: "applied",
          ai_score: r.overall_score,
          ai_summary: JSON.stringify({
            fit_summary: r.fit_summary, strengths: r.strengths, gaps: r.gaps,
            interview_questions: r.interview_questions, technical_fit: r.technical_fit,
            experience_match: r.experience_match, culture_signals: r.culture_signals,
            growth_trajectory: r.growth_trajectory, recommendation: r.recommendation,
          }),
          created_at: new Date().toISOString(),
          has_resume: true,
        }));
        setCandidates((prev) => [
          ...newCandidates,
          ...prev.filter((c) => !newCandidates.some((n) => n.name === c.name)),
        ].sort((a, b) => (b.ai_score ?? 0) - (a.ai_score ?? 0)));
        setBlocks([]);
        setScreeningDone(true);
        setTab("candidates");
      } catch (e) {
        setScreeningError(e instanceof Error ? e.message : "Screening failed");
      }
    });
  }

  function handleMove(candidateId: string, newStage: string) {
    setCandidates((prev) => prev.map((c) => c.id === candidateId ? { ...c, stage: newStage } : c));
    startTransition(async () => {
      try { await updateCandidateStage(candidateId, newStage); } catch { /* optimistic */ }
    });
  }

  function handleDelete(candidateId: string) {
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    startTransition(async () => {
      try { await deleteCandidate(candidateId); } catch { /* optimistic */ }
    });
  }

  async function handleGenerateKit() {
    setKitLoading(true);
    setKitError(null);
    try {
      const kit = await generateInterviewKit(job.id);
      setKitData(kit);
    } catch {
      setKitError("Failed to generate interview kit. Please try again.");
    } finally {
      setKitLoading(false);
    }
  }

  function copyKitSection(title: string, questions: string[]) {
    const text = `${title}\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setKitCopied(title);
    setTimeout(() => setKitCopied(null), 2000);
  }

  function handleStatusChange(newStatus: "draft" | "active" | "closed") {
    setJobStatus(newStatus);
    startStatusTransition(async () => {
      try { await updateJobStatus(job.id, newStatus); } catch { setJobStatus(jobStatus); }
    });
  }

  function openEmailModal(candidateId: string, candidateName: string) {
    setEmailModal({ candidateId, candidateName });
    setGeneratedEmail(null);
    setEmailType("interview_invite");
  }

  async function handleGenerateEmail() {
    if (!emailModal) return;
    setEmailLoading(true);
    try {
      const result = await generateCandidateEmail(emailModal.candidateId, job.id, emailType);
      setGeneratedEmail(result);
    } catch (e) {
      setGeneratedEmail({ subject: "Error", body: e instanceof Error ? e.message : "Failed to generate email" });
    } finally {
      setEmailLoading(false);
    }
  }

  function handleCopyEmail() {
    if (!generatedEmail) return;
    navigator.clipboard.writeText(`Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  }

  const readyCount = blocks.filter((b) => b.name.trim() && b.text.trim()).length;
  const avgScore = candidates.length > 0 && candidates.some((c) => c.ai_score !== undefined)
    ? Math.round(candidates.filter((c) => c.ai_score !== undefined).reduce((s, c) => s + (c.ai_score ?? 0), 0) / candidates.filter((c) => c.ai_score !== undefined).length)
    : null;

  function formatSalary() {
    if (!job.salary_min && !job.salary_max) return null;
    const fmt = (n: number) => `$${Math.round(n / 1000)}k`;
    if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`;
    return job.salary_min ? `From ${fmt(job.salary_min)}` : `Up to ${fmt(job.salary_max!)}`;
  }

  const salary = formatSalary();
  const statusColor = jobStatus === "active" ? "#22c55e" : jobStatus === "draft" ? "var(--text-4)" : "#64748b";

  return (
    <div style={{ minHeight: "100vh", padding: "calc(var(--nav-h, 56px) + 2rem) 3rem 6rem", position: "relative" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 60% 40% at 70% 10%, rgba(124,133,245,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "980px", margin: "0 auto" }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "32px" }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--text-4)", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6" /></svg>
            All Jobs
          </button>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <h1 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: "var(--text-1)", margin: 0, letterSpacing: "-0.03em" }}>
                  {job.title}
                </h1>
                {/* Status toggle */}
                <div style={{ display: "flex", gap: "2px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "2px", border: "1px solid rgba(255,255,255,0.06)", opacity: statusPending ? 0.6 : 1 }}>
                  {(["draft", "active", "closed"] as const).map((s) => {
                    const c = s === "active" ? "#22c55e" : s === "draft" ? "var(--text-3)" : "#64748b";
                    return (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        disabled={statusPending}
                        style={{
                          padding: "3px 10px", borderRadius: "6px", border: "none",
                          background: jobStatus === s ? `${c}18` : "transparent",
                          color: jobStatus === s ? c : "var(--text-4)",
                          fontFamily: "'DM Mono', monospace", fontSize: "10px",
                          letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
                          fontWeight: jobStatus === s ? 700 : 400,
                          boxShadow: jobStatus === s ? `0 0 0 1px ${c}30` : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                {(job.location || job.remote_ok) && (
                  <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-4)" }}>
                    {job.location}{job.remote_ok ? (job.location ? " · Remote OK" : "Remote") : ""}
                  </span>
                )}
                <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-4)", textTransform: "capitalize" }}>{job.employment_type}</span>
                {salary && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "var(--copper)" }}>{salary}</span>}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "16px" }}>
              {[
                { label: "Candidates", value: candidates.length, color: "var(--indigo)" },
                { label: "Avg Score", value: avgScore !== null ? avgScore : "—", color: avgScore && avgScore >= 70 ? "var(--green)" : "var(--text-3)" },
                { label: "Screened", value: candidates.filter((c) => c.ai_score !== undefined).length, color: "var(--copper)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: "center", padding: "10px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "22px", fontWeight: 700, color, letterSpacing: "-0.02em" }}>{value}</div>
                  <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-4)" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: "2px", marginBottom: "28px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "4px", border: "1px solid rgba(255,255,255,0.06)", width: "fit-content" }}>
          {([
            { key: "candidates",   label: `Candidates (${candidates.length})` },
            { key: "screen",       label: "Screen Resumes" },
            { key: "kit",          label: "Interview Kit" },
            { key: "overview",     label: "Job Details" },
          ] as const).map(({ key, label }) => (
            <motion.button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: "8px 18px", borderRadius: "9px", border: "none",
                background: tab === key ? "var(--surface-2)" : "transparent",
                color: tab === key ? "var(--text-1)" : "var(--text-4)",
                fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px",
                fontWeight: tab === key ? 600 : 400, cursor: "pointer",
                boxShadow: tab === key ? "0 1px 8px rgba(0,0,0,0.2)" : "none",
                transition: "all 0.18s ease",
              }}
            >
              {label}
            </motion.button>
          ))}
        </div>

        {/* ── Tab: Screen Resumes ── */}
        <AnimatePresence mode="wait">
          {tab === "screen" && (
            <motion.div key="screen" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>

              {/* Explainer */}
              <div style={{
                padding: "20px 24px", borderRadius: "16px", marginBottom: "24px",
                background: "linear-gradient(135deg, rgba(124,133,245,0.07) 0%, rgba(13,14,18,0.95) 100%)",
                border: "1px solid rgba(124,133,245,0.15)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(124,133,245,0.12)", border: "1px solid rgba(124,133,245,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "15px", fontWeight: 600, color: "var(--text-1)", marginBottom: "4px" }}>
                      AI Resume Screening
                    </div>
                    <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>
                      Add one block per candidate. Paste their resume text. The AI scores every candidate against <strong style={{ color: "var(--text-2)" }}>{job.title}</strong> across 4 dimensions — then stack-ranks them with tailored interview questions for each.
                    </p>
                  </div>
                </div>
              </div>

              {/* Blocks */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                <AnimatePresence>
                  {blocks.map((b, i) => (
                    <ResumeBlockCard key={b.id} block={b} index={i} onUpdate={updateBlock} onRemove={removeBlock} />
                  ))}
                </AnimatePresence>
              </div>

              {/* Add block */}
              <motion.button
                onClick={addBlock}
                style={{
                  width: "100%", padding: "16px", borderRadius: "14px",
                  border: "1px dashed rgba(124,133,245,0.25)", background: "rgba(124,133,245,0.03)",
                  color: "var(--indigo)", fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: "14px", fontWeight: 500, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
                whileHover={{ background: "rgba(124,133,245,0.06)", borderColor: "rgba(124,133,245,0.4)" }}
                whileTap={{ scale: 0.99 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add candidate block
              </motion.button>

              {blocks.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px" }}>
                  <motion.button
                    onClick={handleScreen}
                    disabled={isPending || readyCount === 0}
                    style={{
                      padding: "14px 32px", borderRadius: "12px", border: "none",
                      background: readyCount === 0 ? "rgba(124,133,245,0.3)" : "linear-gradient(135deg, var(--indigo) 0%, #5a63d4 100%)",
                      color: "#fff", fontFamily: "'Poppins', system-ui, sans-serif",
                      fontWeight: 600, fontSize: "15px", cursor: readyCount === 0 || isPending ? "not-allowed" : "pointer",
                      boxShadow: readyCount > 0 ? "0 4px 20px rgba(124,133,245,0.3)" : "none",
                    }}
                    whileHover={readyCount > 0 && !isPending ? { scale: 1.02 } : {}}
                    whileTap={readyCount > 0 && !isPending ? { scale: 0.98 } : {}}
                  >
                    {isPending ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <motion.div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                        Screening {readyCount} resume{readyCount !== 1 ? "s" : ""}…
                      </span>
                    ) : `Screen ${readyCount} resume${readyCount !== 1 ? "s" : ""}`}
                  </motion.button>

                  <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-4)" }}>
                    {readyCount === 0 ? "Fill in at least one name + resume" : `${readyCount} of ${blocks.length} ready`}
                  </span>
                </div>
              )}

              {screeningError && (
                <div style={{ marginTop: "16px", padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px" }}>
                  {screeningError}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Tab: Candidates ── */}
          {tab === "candidates" && (
            <motion.div key="candidates" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              {screeningDone && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: "14px 20px", borderRadius: "12px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  Screening complete. Candidates ranked below by AI score.
                </motion.div>
              )}

              {candidates.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "14px", color: "var(--text-4)", marginBottom: "16px" }}>No candidates yet</div>
                  <motion.button onClick={() => setTab("screen")} style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid rgba(124,133,245,0.3)", background: "rgba(124,133,245,0.06)", color: "var(--indigo)", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", cursor: "pointer" }} whileHover={{ scale: 1.02 }}>
                    Screen resumes →
                  </motion.button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {candidates.map((c, i) => (
                    <ScreenedCard key={c.id} candidate={c} index={i} onMove={handleMove} onEmail={openEmailModal} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Tab: Interview Kit ── */}
          {tab === "kit" && (
            <motion.div key="kit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              {/* Explainer banner */}
              <div style={{
                padding: "20px 24px", borderRadius: "16px", marginBottom: "24px",
                background: "linear-gradient(135deg, rgba(155,109,255,0.08) 0%, rgba(13,14,18,0.95) 100%)",
                border: "1px solid rgba(155,109,255,0.15)",
                display: "flex", alignItems: "flex-start", gap: "14px",
              }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(155,109,255,0.12)", border: "1px solid rgba(155,109,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(155,109,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "15px", fontWeight: 600, color: "var(--text-1)", marginBottom: "4px" }}>
                    AI Interview Kit
                  </div>
                  <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-3)", lineHeight: 1.6, margin: 0 }}>
                    Generate a complete question bank tailored to <strong style={{ color: "var(--text-2)" }}>{job.title}</strong>. Covers behavioral, technical, culture, role-specific scenarios, and red-flag detection questions.
                  </p>
                </div>
              </div>

              {!kitData && !kitLoading && (
                <motion.button
                  onClick={handleGenerateKit}
                  whileHover={{ scale: 1.01, boxShadow: "0 8px 32px rgba(155,109,255,0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: "14px 32px", borderRadius: "12px", border: "none",
                    background: "linear-gradient(135deg, #9b6dff 0%, #7c85f5 100%)",
                    color: "#fff", fontFamily: "'Poppins', system-ui, sans-serif",
                    fontWeight: 600, fontSize: "15px", cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(155,109,255,0.25)",
                    display: "flex", alignItems: "center", gap: "10px",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  Generate Interview Kit
                </motion.button>
              )}

              {kitLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} style={{ height: "120px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", position: "relative" }}>
                      <motion.div
                        style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)" }}
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  ))}
                  <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-4)", textAlign: "center" }}>
                    Crafting questions tailored to {job.title}…
                  </div>
                </div>
              )}

              {kitError && (
                <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", marginTop: "16px" }}>
                  {kitError}
                </div>
              )}

              {kitData && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                >
                  {/* Regenerate button */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <motion.button
                      onClick={handleGenerateKit}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      style={{
                        padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(155,109,255,0.25)",
                        background: "rgba(155,109,255,0.06)", color: "rgba(155,109,255,0.9)",
                        fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px",
                        fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                      </svg>
                      Regenerate
                    </motion.button>
                  </div>

                  {[
                    { key: "behavioral",    title: "Behavioral Questions",       color: "var(--indigo)",         icon: "👥" },
                    { key: "technical",     title: "Technical Questions",         color: "#22c55e",               icon: "⚙️" },
                    { key: "cultureAndTeam",title: "Culture & Team Fit",          color: "var(--copper)",         icon: "🌱" },
                    { key: "roleSpecific",  title: "Role-Specific Scenarios",     color: "rgba(155,109,255,0.9)", icon: "🎯" },
                    { key: "redFlags",      title: "Red Flag Detection",          color: "#ef4444",               icon: "🚩" },
                  ].map(({ key, title, color, icon }) => {
                    const questions = kitData[key as keyof typeof kitData] as string[];
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: `1px solid ${color}20`,
                          borderRadius: "16px",
                          overflow: "hidden",
                        }}
                      >
                        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${color}15`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "16px" }}>{icon}</span>
                            <span style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "14px", fontWeight: 600, color: "var(--text-1)" }}>{title}</span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color, padding: "2px 8px", borderRadius: "10px", background: `${color}10`, border: `1px solid ${color}20` }}>
                              {questions.length}
                            </span>
                          </div>
                          <motion.button
                            onClick={() => copyKitSection(title, questions)}
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            style={{
                              padding: "5px 12px", borderRadius: "7px",
                              border: `1px solid ${color}25`, background: `${color}08`,
                              color: kitCopied === title ? "#22c55e" : color,
                              fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px",
                              fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px",
                              transition: "all 0.2s ease",
                            }}
                          >
                            {kitCopied === title ? "✓ Copied" : "Copy all"}
                          </motion.button>
                        </div>
                        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                          {questions.map((q, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              style={{
                                display: "flex", gap: "12px", alignItems: "flex-start",
                                padding: "10px 14px", borderRadius: "10px",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.04)",
                              }}
                            >
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color, flexShrink: 0, marginTop: "2px", opacity: 0.7 }}>
                                Q{i + 1}
                              </span>
                              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-2)", lineHeight: 1.65 }}>
                                {q}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Tab: Overview ── */}
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>

              {/* Export row */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px", justifyContent: "flex-end" }}>
                {[
                  {
                    label: "Export PDF", icon: "M8 2v8M5 7l3 3 3-3M2 12h12",
                    onClick: () => downloadJobPDF(job),
                    accent: "rgba(201,168,108,0.15)", border: "rgba(201,168,108,0.3)", color: "rgba(201,168,108,0.85)",
                  },
                  {
                    label: "Export Word", icon: "M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1zM12 2v4h4",
                    onClick: () => downloadJobWord(job),
                    accent: "rgba(124,133,245,0.12)", border: "rgba(124,133,245,0.3)", color: "var(--indigo)",
                  },
                ].map(({ label, icon, onClick, accent, border, color }) => (
                  <motion.button
                    key={label}
                    onClick={onClick}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "8px 14px", borderRadius: "8px",
                      background: accent, border: `1px solid ${border}`,
                      color, cursor: "pointer",
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: "12px", fontWeight: 500,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={icon} />
                    </svg>
                    {label}
                  </motion.button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", alignItems: "start" }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", padding: "28px", backdropFilter: "blur(16px)" }}>
                <h2 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "16px", fontWeight: 600, color: "var(--text-1)", margin: "0 0 16px", letterSpacing: "-0.02em" }}>Description</h2>
                <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "14px", color: "var(--text-2)", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>{job.description || "No description added."}</p>

                {job.requirements.length > 0 && (
                  <>
                    <h3 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "14px", fontWeight: 600, color: "var(--text-1)", margin: "24px 0 12px", letterSpacing: "-0.01em" }}>Requirements</h3>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {job.requirements.map((r, i) => (
                        <li key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--indigo)", flexShrink: 0, marginTop: "7px" }} />
                          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-2)" }}>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {job.nice_to_haves.length > 0 && (
                  <>
                    <h3 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "14px", fontWeight: 600, color: "var(--text-1)", margin: "24px 0 12px", letterSpacing: "-0.01em" }}>Nice to Have</h3>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {job.nice_to_haves.map((r, i) => (
                        <li key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--copper)", flexShrink: 0, marginTop: "7px" }} />
                          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-2)" }}>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  { label: "Status", value: job.status, highlight: true },
                  { label: "Type", value: job.employment_type },
                  { label: "Location", value: job.location ?? (job.remote_ok ? "Remote" : "Not specified") },
                  { label: "Remote", value: job.remote_ok ? "Yes" : "No" },
                  { label: "Salary", value: salary ?? "Not specified" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: "14px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-4)" }}>{label}</span>
                    <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-2)", fontWeight: 500, textTransform: "capitalize" }}>{value}</span>
                  </div>
                ))}
              </div>
              </div>{/* end grid */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Email Draft Modal ── */}
      <AnimatePresence>
        {emailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "24px",
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setEmailModal(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: "100%", maxWidth: "600px", maxHeight: "85vh", overflow: "auto",
                background: "var(--surface-1, #0d0e12)", borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
              }}
            >
              {/* Modal header */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "16px", fontWeight: 700, color: "var(--text-1)" }}>
                    Draft Email
                  </div>
                  <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-4)", marginTop: "2px" }}>
                    {emailModal.candidateName}
                  </div>
                </div>
                <button
                  onClick={() => setEmailModal(null)}
                  style={{ background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", padding: "8px", fontSize: "20px", lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: "24px" }}>
                {/* Email type selector */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--text-4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>Email Type</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {([
                      { key: "interview_invite", label: "Interview Invite" },
                      { key: "move_forward",     label: "Move Forward"    },
                      { key: "rejection",        label: "Rejection"       },
                      { key: "offer",            label: "Job Offer"       },
                    ] as const).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => { setEmailType(key); setGeneratedEmail(null); }}
                        style={{
                          padding: "7px 14px", borderRadius: "8px", cursor: "pointer",
                          border: `1px solid ${emailType === key ? "rgba(124,133,245,0.4)" : "rgba(255,255,255,0.08)"}`,
                          background: emailType === key ? "rgba(124,133,245,0.1)" : "transparent",
                          color: emailType === key ? "var(--indigo)" : "var(--text-3)",
                          fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", fontWeight: emailType === key ? 600 : 400,
                          transition: "all 0.15s ease",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate button */}
                {!generatedEmail && (
                  <motion.button
                    onClick={handleGenerateEmail}
                    disabled={emailLoading}
                    style={{
                      width: "100%", padding: "12px", borderRadius: "12px",
                      border: "1px solid rgba(124,133,245,0.3)",
                      background: "rgba(124,133,245,0.08)",
                      color: "var(--indigo)", fontFamily: "'Poppins', system-ui, sans-serif",
                      fontSize: "14px", fontWeight: 600, cursor: emailLoading ? "wait" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      opacity: emailLoading ? 0.7 : 1,
                    }}
                    whileHover={!emailLoading ? { scale: 1.01 } : {}}
                    whileTap={!emailLoading ? { scale: 0.99 } : {}}
                  >
                    {emailLoading ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                        Generating…
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        Generate with AI
                      </>
                    )}
                  </motion.button>
                )}

                {/* Generated email */}
                {generatedEmail && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--text-4)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Subject</div>
                      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "14px", fontWeight: 600, color: "var(--text-1)" }}>{generatedEmail.subject}</div>
                    </div>
                    <div style={{ padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--text-4)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Body</div>
                      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-2)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                        {generatedEmail.body}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <motion.button
                        onClick={handleCopyEmail}
                        style={{
                          flex: 1, padding: "10px", borderRadius: "10px",
                          border: `1px solid ${emailCopied ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
                          background: emailCopied ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                          color: emailCopied ? "#22c55e" : "var(--text-2)",
                          fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px",
                          fontWeight: 500, cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      >
                        {emailCopied ? "Copied!" : "Copy to Clipboard"}
                      </motion.button>
                      <motion.button
                        onClick={() => { setGeneratedEmail(null); }}
                        style={{
                          padding: "10px 16px", borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.06)",
                          background: "transparent", color: "var(--text-4)",
                          fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px",
                          cursor: "pointer",
                        }}
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      >
                        Regenerate
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
