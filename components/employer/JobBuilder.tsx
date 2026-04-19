"use client";

import React, { useState, useTransition, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  generateJobDescription,
  analyzeJobDescription,
} from "@/app/actions/employer";

// ── Types ─────────────────────────────────────────────────────────────────────

type SidebarTab = "score" | "ai" | "export";

interface JobFormData {
  title: string;
  description: string;
  requirements: string[];
  nice_to_haves: string[];
  salary_min: string;
  salary_max: string;
  location: string;
  remote_ok: boolean;
  employment_type: string;
  status: "draft" | "active";
}

interface AnalysisResult {
  biasIssues: { text: string; suggestion: string }[];
  qualityIssues: string[];
  suggestions: string[];
  salaryFeedback: string;
  overallQuality: "poor" | "fair" | "good" | "excellent";
}

// ── Tag input ─────────────────────────────────────────────────────────────────

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
  accent = "var(--indigo)",
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  accent?: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
      setInput("");
    }
  }

  function remove(idx: number) {
    onChange(tags.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <label style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-3)", display: "block", marginBottom: "8px" }}>
        {label}
      </label>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          padding: "12px 14px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          minHeight: "48px",
          cursor: "text",
        }}
        onClick={(e) => {
          const el = (e.currentTarget as HTMLElement).querySelector("input");
          el?.focus();
        }}
      >
        <AnimatePresence>
          {tags.map((t, i) => (
            <motion.div
              key={t}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                borderRadius: "6px",
                background: `${accent}15`,
                border: `1px solid ${accent}30`,
                color: accent,
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "12px",
              }}
            >
              {t}
              <button
                onClick={(e) => { e.stopPropagation(); remove(i); }}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, lineHeight: 1, opacity: 0.6 }}
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          onBlur={add}
          placeholder={tags.length === 0 ? placeholder : "Add more..."}
          style={{
            border: "none",
            background: "transparent",
            color: "var(--text-1)",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "13px",
            outline: "none",
            minWidth: "120px",
            flex: 1,
          }}
        />
      </div>
      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-4)", marginTop: "4px" }}>
        Press Enter or comma to add
      </div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-3)", display: "block", marginBottom: "8px" }}>
        {label}
      </label>
      {children}
      {hint && (
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-4)", marginTop: "4px" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
        color: "var(--text-1)",
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: "14px",
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.2s ease",
      }}
      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(124,133,245,0.4)"; }}
      onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 6 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
        color: "var(--text-1)",
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: "14px",
        outline: "none",
        boxSizing: "border-box",
        resize: "vertical",
        lineHeight: 1.6,
        transition: "border-color 0.2s ease",
      }}
      onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(124,133,245,0.4)"; }}
      onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
    />
  );
}

// ── Clarity score ─────────────────────────────────────────────────────────────

function ClarityScore({ form }: { form: JobFormData }) {
  const points = [
    !!form.title,
    form.description.length > 80,
    form.requirements.length >= 3,
    !!(form.salary_min && form.salary_max),
    !!form.location || form.remote_ok,
    form.nice_to_haves.length > 0,
  ];
  const score = Math.round((points.filter(Boolean).length / points.length) * 100);
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "var(--copper)" : "var(--indigo)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Radial score */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ position: "relative", width: "72px", height: "72px", flexShrink: 0 }}>
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <motion.circle
              cx="36" cy="36" r="28" fill="none" stroke={color}
              strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - score / 100)}`}
              style={{ transform: "rotate(-90deg)", transformOrigin: "36px 36px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "18px", fontWeight: 700, color,
          }}>
            {score}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--text-1)", marginBottom: "2px" }}>
            {score >= 80 ? "Strong JD" : score >= 50 ? "Getting there" : "Needs work"}
          </div>
          <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-4)" }}>
            {points.filter(Boolean).length}/{points.length} criteria met
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {[
          ["Job title set", points[0]],
          ["Description (80+ chars)", points[1]],
          ["3+ requirements", points[2]],
          ["Salary range", points[3]],
          ["Location or remote", points[4]],
          ["Nice-to-haves", points[5]],
        ].map(([label, done], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <motion.div
              animate={{ background: done ? `${color}20` : "rgba(255,255,255,0.04)", borderColor: done ? color : "rgba(255,255,255,0.08)" }}
              transition={{ duration: 0.3 }}
              style={{
                width: "15px", height: "15px", borderRadius: "4px",
                border: `1px solid rgba(255,255,255,0.08)`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              {done && (
                <svg width="8" height="8" viewBox="0 0 10 8" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4l3 3 5-6" />
                </svg>
              )}
            </motion.div>
            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: done ? "var(--text-2)" : "var(--text-4)" }}>
              {label as string}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Generate button ─────────────────────────────────────────────────────────

function AIGenerateButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      whileHover={!loading ? { scale: 1.02, boxShadow: "0 8px 32px rgba(124,133,245,0.4)" } : {}}
      whileTap={!loading ? { scale: 0.97 } : {}}
      style={{
        width: "100%",
        padding: "13px 20px",
        borderRadius: "12px",
        border: "none",
        background: loading
          ? "rgba(124,133,245,0.2)"
          : "linear-gradient(135deg, #7c85f5 0%, #9b6dff 50%, #7c85f5 100%)",
        color: "#fff",
        fontFamily: "'Poppins', system-ui, sans-serif",
        fontWeight: 600,
        fontSize: "13px",
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "all 0.3s ease",
        boxShadow: loading ? "none" : "0 4px 20px rgba(124,133,245,0.25)",
      }}
    >
      {loading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              width: "14px", height: "14px", borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
            }}
          />
          Generating...
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          Generate with AI
        </>
      )}
    </motion.button>
  );
}

// ── AI Analysis panel ─────────────────────────────────────────────────────────

function AIAnalysisPanel({ form, companyName }: { form: JobFormData; companyName: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis() {
    if (!form.title && !form.description) {
      setError("Add a title and description first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeJobDescription(
        form.title,
        form.description,
        form.requirements,
        form.salary_min ? parseInt(form.salary_min) : undefined,
        form.salary_max ? parseInt(form.salary_max) : undefined,
      );
      setResult(res);
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const qualityColors: Record<string, string> = {
    excellent: "#22c55e",
    good: "#84cc16",
    fair: "var(--copper)",
    poor: "#ef4444",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <motion.button
        onClick={runAnalysis}
        disabled={loading}
        whileHover={!loading ? { scale: 1.01 } : {}}
        whileTap={!loading ? { scale: 0.98 } : {}}
        style={{
          width: "100%",
          padding: "11px 16px",
          borderRadius: "10px",
          border: "1px solid rgba(124,133,245,0.3)",
          background: "rgba(124,133,245,0.08)",
          color: "var(--indigo)",
          fontFamily: "'Inter', system-ui, sans-serif",
          fontWeight: 600,
          fontSize: "12px",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "7px",
          transition: "all 0.2s ease",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ width: "12px", height: "12px", borderRadius: "50%", border: "2px solid rgba(124,133,245,0.3)", borderTopColor: "var(--indigo)" }}
            />
            Analyzing...
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            Analyze my JD
          </>
        )}
      </motion.button>

      {error && (
        <div style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px" }}>
          {error}
        </div>
      )}

      {loading && !result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1,2,3].map((i) => (
            <div key={i} style={{ height: "40px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", animation: "shimmer 1.5s infinite", overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)", animation: "shimmer 1.5s infinite" }} />
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {/* Quality badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-4)" }}>Overall quality</span>
              <span style={{
                padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, fontFamily: "'Poppins', system-ui, sans-serif",
                background: `${qualityColors[result.overallQuality]}15`,
                border: `1px solid ${qualityColors[result.overallQuality]}30`,
                color: qualityColors[result.overallQuality],
                textTransform: "capitalize",
              }}>
                {result.overallQuality}
              </span>
            </div>

            {/* Bias issues */}
            {result.biasIssues.length > 0 && (
              <div>
                <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", fontWeight: 600, color: "#ef4444", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Bias detected ({result.biasIssues.length})
                </div>
                {result.biasIssues.map((b, i) => (
                  <div key={i} style={{ padding: "8px 10px", borderRadius: "8px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", marginBottom: "6px" }}>
                    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "#ef4444", marginBottom: "3px" }}>"{b.text}"</div>
                    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-3)" }}>→ {b.suggestion}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
              <div>
                <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", fontWeight: 600, color: "var(--copper)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Suggestions
                </div>
                {result.suggestions.map((s, i) => (
                  <div key={i} style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-3)", padding: "6px 8px", borderLeft: "2px solid rgba(180,120,60,0.4)", marginBottom: "5px" }}>
                    {s}
                  </div>
                ))}
              </div>
            )}

            {/* Salary feedback */}
            {result.salaryFeedback && (
              <div style={{ padding: "8px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-3)" }}>
                <span style={{ color: "var(--text-4)" }}>Salary: </span>{result.salaryFeedback}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Export panel ──────────────────────────────────────────────────────────────

function ExportPanel({ form, companyName }: { form: JobFormData; companyName: string }) {
  const [copied, setCopied] = useState<"linkedin" | "plain" | null>(null);

  function formatLinkedIn(): string {
    const lines: string[] = [];
    lines.push(`📌 ${form.title}${form.location ? ` | ${form.location}` : ""}${form.remote_ok ? " | Remote" : ""}`);
    if (companyName) lines.push(`🏢 ${companyName}`);
    if (form.employment_type) lines.push(`⏱️ ${form.employment_type.charAt(0).toUpperCase() + form.employment_type.slice(1)}`);
    if (form.salary_min && form.salary_max) lines.push(`💰 $${parseInt(form.salary_min).toLocaleString()} – $${parseInt(form.salary_max).toLocaleString()} / year`);
    lines.push("");
    if (form.description) lines.push(form.description);
    if (form.requirements.length > 0) {
      lines.push(""); lines.push("✅ Requirements:");
      form.requirements.forEach((r) => lines.push(`• ${r}`));
    }
    if (form.nice_to_haves.length > 0) {
      lines.push(""); lines.push("⭐ Nice to have:");
      form.nice_to_haves.forEach((r) => lines.push(`• ${r}`));
    }
    return lines.join("\n");
  }

  function formatPlain(): string {
    const lines: string[] = [];
    lines.push(form.title.toUpperCase());
    lines.push("─".repeat(Math.min(form.title.length, 40)));
    if (companyName) lines.push(`Company: ${companyName}`);
    if (form.location) lines.push(`Location: ${form.location}${form.remote_ok ? " (Remote OK)" : ""}`);
    if (form.employment_type) lines.push(`Type: ${form.employment_type}`);
    if (form.salary_min && form.salary_max) lines.push(`Salary: $${parseInt(form.salary_min).toLocaleString()} – $${parseInt(form.salary_max).toLocaleString()}`);
    lines.push("");
    if (form.description) { lines.push("ABOUT THE ROLE"); lines.push(form.description); }
    if (form.requirements.length > 0) { lines.push(""); lines.push("REQUIREMENTS"); form.requirements.forEach((r) => lines.push(`• ${r}`)); }
    if (form.nice_to_haves.length > 0) { lines.push(""); lines.push("NICE TO HAVE"); form.nice_to_haves.forEach((r) => lines.push(`• ${r}`)); }
    return lines.join("\n");
  }

  async function copy(type: "linkedin" | "plain") {
    const text = type === "linkedin" ? formatLinkedIn() : formatPlain();
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  const exportOptions = [
    { key: "linkedin" as const, label: "LinkedIn / Handshake", icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    )},
    { key: "plain" as const, label: "Plain Text / ATS", icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    )},
  ];

  const hasContent = form.title || form.description;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {!hasContent && (
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-4)", textAlign: "center", padding: "12px 0" }}>
          Complete your JD to export
        </div>
      )}
      {exportOptions.map((opt) => (
        <motion.button
          key={opt.key}
          onClick={() => copy(opt.key)}
          disabled={!hasContent}
          whileHover={hasContent ? { scale: 1.01, background: "rgba(255,255,255,0.06)" } : {}}
          whileTap={hasContent ? { scale: 0.98 } : {}}
          style={{
            width: "100%",
            padding: "11px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: copied === opt.key ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
            color: copied === opt.key ? "#22c55e" : hasContent ? "var(--text-2)" : "var(--text-4)",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 500,
            fontSize: "12px",
            cursor: hasContent ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {opt.icon}
            {opt.label}
          </div>
          <span style={{ fontSize: "10px", opacity: 0.7 }}>
            {copied === opt.key ? "✓ Copied!" : "Copy"}
          </span>
        </motion.button>
      ))}
      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "10px", color: "var(--text-4)", textAlign: "center", paddingTop: "4px" }}>
        Paste directly into job boards
      </div>
    </div>
  );
}

// ── Sidebar tabs ───────────────────────────────────────────────────────────────

function SidebarTabs({ active, onChange }: { active: SidebarTab; onChange: (t: SidebarTab) => void }) {
  const tabs: { key: SidebarTab; label: string }[] = [
    { key: "score", label: "Score" },
    { key: "ai", label: "AI Review" },
    { key: "export", label: "Export" },
  ];

  return (
    <div style={{
      display: "flex",
      background: "rgba(255,255,255,0.04)",
      borderRadius: "10px",
      padding: "3px",
      gap: "2px",
      marginBottom: "20px",
    }}>
      {tabs.map((tab) => (
        <motion.button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            flex: 1,
            padding: "7px 8px",
            borderRadius: "8px",
            border: "none",
            background: active === tab.key ? "rgba(124,133,245,0.15)" : "transparent",
            color: active === tab.key ? "var(--indigo)" : "var(--text-4)",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: active === tab.key ? 600 : 400,
            fontSize: "11px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            position: "relative",
          }}
          whileTap={{ scale: 0.96 }}
        >
          {active === tab.key && (
            <motion.div
              layoutId="sidebarTabHighlight"
              style={{
                position: "absolute", inset: 0, borderRadius: "8px",
                background: "rgba(124,133,245,0.12)",
                border: "1px solid rgba(124,133,245,0.2)",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
            />
          )}
          <span style={{ position: "relative", zIndex: 1 }}>{tab.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

interface JobBuilderProps {
  onSubmit: (data: JobFormData & { status: "draft" | "active" }) => Promise<void>;
  companyName?: string;
}

export function JobBuilder({ onSubmit, companyName = "" }: JobBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitStatus, setSubmitStatus] = useState<"draft" | "active">("draft");
  const [error, setError] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("score");
  const [isGenerating, setIsGenerating] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const isHeroInView = useInView(heroRef, { once: true });

  const [form, setForm] = useState<JobFormData>({
    title: "",
    description: "",
    requirements: [],
    nice_to_haves: [],
    salary_min: "",
    salary_max: "",
    location: "",
    remote_ok: false,
    employment_type: "full-time",
    status: "draft",
  });

  function set<K extends keyof JobFormData>(key: K, value: JobFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(status: "draft" | "active") {
    setSubmitStatus(status);
    setError(null);
    startTransition(async () => {
      try {
        await onSubmit({ ...form, status });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const handleGenerate = useCallback(async () => {
    if (!form.title) {
      setError("Enter a job title first so AI knows what to generate.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateJobDescription(form.title, companyName, form.requirements);
      setForm((f) => ({
        ...f,
        description: result.description,
        requirements: result.requirements.length > 0 ? result.requirements : f.requirements,
        nice_to_haves: result.nice_to_haves.length > 0 ? result.nice_to_haves : f.nice_to_haves,
      }));
    } catch {
      setError("AI generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [form.title, form.requirements, companyName]);

  const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "internship", "freelance"];

  return (
    <div style={{ minHeight: "100vh", padding: "calc(var(--nav-h, 60px) + 2rem) 3rem 5rem", position: "relative" }}>
      {/* Ambient orbs */}
      <div style={{ position: "fixed", top: "10%", right: "5%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,133,245,0.07) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0, animation: "orb 12s ease-in-out infinite" }} />
      <div style={{ position: "fixed", bottom: "15%", left: "3%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(155,109,255,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0, animation: "orb 16s ease-in-out infinite reverse" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "940px" }}>
        {/* Back */}
        <motion.button
          onClick={() => router.back()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: "none", border: "none", color: "var(--text-4)",
            fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px",
            cursor: "pointer", marginBottom: "24px", display: "flex", alignItems: "center", gap: "6px", padding: 0,
          }}
          whileHover={{ color: "var(--text-2)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to jobs
        </motion.button>

        {/* Hero banner */}
        <motion.div
          ref={heroRef}
          initial={{ opacity: 0, y: -16 }}
          animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "linear-gradient(135deg, rgba(124,133,245,0.08) 0%, rgba(155,109,255,0.05) 50%, rgba(124,133,245,0.04) 100%)",
            border: "1px solid rgba(124,133,245,0.15)",
            borderRadius: "20px",
            padding: "28px 32px",
            marginBottom: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Decorative corner */}
          <div style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "200px", background: "radial-gradient(circle at top right, rgba(124,133,245,0.12) 0%, transparent 60%)", pointerEvents: "none" }} />

          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--indigo)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
              AI JD Studio
            </div>
            <h1 style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontSize: "clamp(20px, 2.5vw, 28px)",
              fontWeight: 700,
              color: "var(--text-1)",
              margin: "0 0 10px 0",
              letterSpacing: "-0.03em",
            }}>
              Build a job description that attracts top talent
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {["AI-generated drafts", "Bias detection", "Quality scoring", "1-click export"].map((chip) => (
                <span key={chip} style={{
                  padding: "4px 10px", borderRadius: "20px", fontSize: "11px",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  background: "rgba(124,133,245,0.08)", border: "1px solid rgba(124,133,245,0.15)", color: "var(--indigo)",
                }}>
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Decorative SVG */}
          <div style={{ flexShrink: 0, opacity: 0.5 }}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <rect x="8" y="10" width="48" height="60" rx="6" stroke="rgba(124,133,245,0.6)" strokeWidth="1.5" />
              <line x1="18" y1="24" x2="46" y2="24" stroke="rgba(124,133,245,0.4)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="32" x2="46" y2="32" stroke="rgba(124,133,245,0.3)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="40" x2="38" y2="40" stroke="rgba(124,133,245,0.3)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="48" x2="42" y2="48" stroke="rgba(124,133,245,0.2)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="62" cy="20" r="12" fill="rgba(155,109,255,0.15)" stroke="rgba(155,109,255,0.4)" strokeWidth="1.5" />
              <path d="M58 20l2.5 2.5L66 17" stroke="rgba(155,109,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </motion.div>

        {/* AI generate row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          style={{ marginBottom: "20px" }}
        >
          <AIGenerateButton onClick={handleGenerate} loading={isGenerating} />
          <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-4)", textAlign: "center", marginTop: "6px" }}>
            Enter a job title above, then let AI draft the full description, requirements, and nice-to-haves
          </div>
        </motion.div>

        {/* Two-col layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", alignItems: "start" }}>
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              padding: "32px",
              backdropFilter: "blur(20px)",
            }}
          >
            <Field label="Job Title *">
              <Input
                value={form.title}
                onChange={(v) => set("title", v)}
                placeholder="e.g. Senior Software Engineer"
              />
            </Field>

            <Field label="Job Description *" hint="Describe the role, team, and impact. Markdown supported.">
              <Textarea
                value={form.description}
                onChange={(v) => set("description", v)}
                placeholder="Use 'Generate with AI' above to draft this, or write it yourself..."
                rows={8}
              />
            </Field>

            <TagInput
              label="Requirements"
              tags={form.requirements}
              onChange={(v) => set("requirements", v)}
              placeholder="e.g. 3+ years TypeScript"
            />

            <TagInput
              label="Nice to Have"
              tags={form.nice_to_haves}
              onChange={(v) => set("nice_to_haves", v)}
              placeholder="e.g. Kubernetes experience"
              accent="var(--copper)"
            />

            {/* Salary */}
            <div>
              <label style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-3)", display: "block", marginBottom: "8px" }}>
                Salary Range (USD / year)
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Input value={form.salary_min} onChange={(v) => set("salary_min", v)} placeholder="Min, e.g. 80000" type="number" />
                <Input value={form.salary_max} onChange={(v) => set("salary_max", v)} placeholder="Max, e.g. 120000" type="number" />
              </div>
            </div>

            {/* Location + remote */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "end" }}>
              <Field label="Location">
                <Input value={form.location} onChange={(v) => set("location", v)} placeholder="e.g. San Francisco, CA" />
              </Field>
              <div style={{ paddingBottom: "1px" }}>
                <label style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-3)", display: "block", marginBottom: "8px" }}>
                  Remote
                </label>
                <motion.button
                  onClick={() => set("remote_ok", !form.remote_ok)}
                  style={{
                    width: "48px", height: "28px", borderRadius: "14px",
                    background: form.remote_ok ? "var(--indigo)" : "rgba(255,255,255,0.08)",
                    border: "none", cursor: "pointer", position: "relative",
                    transition: "background 0.2s ease",
                  }}
                >
                  <motion.div
                    style={{
                      position: "absolute", top: "3px", width: "22px", height: "22px",
                      borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }}
                    animate={{ left: form.remote_ok ? "23px" : "3px" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                </motion.button>
              </div>
            </div>

            {/* Employment type */}
            <Field label="Employment Type">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {EMPLOYMENT_TYPES.map((t) => (
                  <motion.button
                    key={t}
                    onClick={() => set("employment_type", t)}
                    style={{
                      padding: "8px 14px", borderRadius: "8px",
                      border: `1px solid ${form.employment_type === t ? "var(--indigo)" : "rgba(255,255,255,0.08)"}`,
                      background: form.employment_type === t ? "rgba(124,133,245,0.12)" : "transparent",
                      color: form.employment_type === t ? "var(--indigo)" : "var(--text-3)",
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: "12px", fontWeight: 500, cursor: "pointer",
                      transition: "all 0.2s ease", textTransform: "capitalize",
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t}
                  </motion.button>
                ))}
              </div>
            </Field>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px" }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
              <motion.button
                onClick={() => handleSubmit("draft")}
                disabled={isPending || !form.title}
                style={{
                  flex: 1, padding: "14px", borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--text-2)",
                  fontFamily: "'Poppins', system-ui, sans-serif",
                  fontWeight: 600, fontSize: "14px",
                  cursor: isPending || !form.title ? "not-allowed" : "pointer",
                  opacity: !form.title ? 0.5 : 1,
                  transition: "all 0.2s ease",
                }}
                whileHover={form.title ? { background: "rgba(255,255,255,0.06)" } : {}}
                whileTap={form.title ? { scale: 0.98 } : {}}
              >
                {isPending && submitStatus === "draft" ? "Saving..." : "Save Draft"}
              </motion.button>

              <motion.button
                onClick={() => handleSubmit("active")}
                disabled={isPending || !form.title}
                style={{
                  flex: 2, padding: "14px", borderRadius: "12px", border: "none",
                  background: !form.title ? "rgba(124,133,245,0.3)" : "linear-gradient(135deg, var(--indigo) 0%, #5a63d4 100%)",
                  color: "#fff",
                  fontFamily: "'Poppins', system-ui, sans-serif",
                  fontWeight: 600, fontSize: "14px",
                  cursor: isPending || !form.title ? "not-allowed" : "pointer",
                  boxShadow: form.title ? "0 4px 20px rgba(124,133,245,0.3)" : "none",
                  transition: "all 0.2s ease",
                }}
                whileHover={form.title ? { scale: 1.02 } : {}}
                whileTap={form.title ? { scale: 0.98 } : {}}
              >
                {isPending && submitStatus === "active" ? "Publishing..." : "Publish Job"}
              </motion.button>
            </div>
          </motion.div>

          {/* Sticky studio sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "sticky",
              top: "calc(var(--nav-h, 60px) + 1rem)",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "18px",
              padding: "20px",
              backdropFilter: "blur(20px)",
            }}
          >
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "var(--text-4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "14px" }}>
              Studio Panel
            </div>

            <SidebarTabs active={sidebarTab} onChange={setSidebarTab} />

            <AnimatePresence mode="wait">
              {sidebarTab === "score" && (
                <motion.div key="score" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                  <ClarityScore form={form} />
                </motion.div>
              )}
              {sidebarTab === "ai" && (
                <motion.div key="ai" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                  <AIAnalysisPanel form={form} companyName={companyName} />
                </motion.div>
              )}
              {sidebarTab === "export" && (
                <motion.div key="export" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                  <ExportPanel form={form} companyName={companyName} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
