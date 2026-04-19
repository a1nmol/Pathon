"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { saveCompanyProfile } from "@/app/actions/employer";

interface CompanyData {
  name: string;
  industry: string;
  size: string;
  website: string;
  tech_stack: string[];
  culture_tags: string[];
}

const INDUSTRY_OPTIONS = [
  "Technology", "Finance", "Healthcare", "Education", "E-commerce",
  "Media", "Consulting", "Manufacturing", "Real Estate", "Other",
];

const SIZE_OPTIONS = [
  "1–10", "11–50", "51–200", "201–500", "501–1000", "1000+",
];

const CULTURE_SUGGESTIONS = [
  "Remote-first", "Async-friendly", "Move fast", "Work-life balance",
  "Open source", "Diverse team", "Startup energy", "Mission-driven",
];

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
  accent = "var(--indigo)",
  suggestions,
}: {
  label: string;
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder: string;
  accent?: string;
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");

  function add(val: string) {
    const v = val.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
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
        onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}
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
                onClick={(e) => { e.stopPropagation(); onChange(tags.filter((_, j) => j !== i)); }}
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
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); } }}
          onBlur={() => add(input)}
          placeholder={tags.length === 0 ? placeholder : "Add more..."}
          style={{ border: "none", background: "transparent", color: "var(--text-1)", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", outline: "none", minWidth: "120px", flex: 1 }}
        />
      </div>
      {suggestions && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
          {suggestions.filter((s) => !tags.includes(s)).map((s) => (
            <motion.button
              key={s}
              onClick={() => add(s)}
              style={{
                padding: "3px 10px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.03)",
                color: "var(--text-4)",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "11px",
                cursor: "pointer",
              }}
              whileHover={{ color: "var(--text-2)", borderColor: `${accent}30` }}
            >
              + {s}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectPills({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-3)", display: "block", marginBottom: "8px" }}>
        {label}
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {options.map((o) => (
          <motion.button
            key={o}
            onClick={() => onChange(o)}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: `1px solid ${value === o ? "var(--indigo)" : "rgba(255,255,255,0.07)"}`,
              background: value === o ? "rgba(124,133,245,0.1)" : "transparent",
              color: value === o ? "var(--indigo)" : "var(--text-3)",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "12px",
              cursor: "pointer",
            }}
            whileTap={{ scale: 0.95 }}
          >
            {o}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
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

export function CompanyProfileClient({ initial, embedded }: { initial: CompanyData; embedded?: boolean }) {
  const [form, setForm] = useState<CompanyData>(initial);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CompanyData>(key: K, value: CompanyData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await saveCompanyProfile({
          name: form.name,
          industry: form.industry || undefined,
          size: form.size || undefined,
          website: form.website || undefined,
          tech_stack: form.tech_stack,
          culture_tags: form.culture_tags,
        });
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  // When embedded in drawer, render without page chrome
  if (embedded) {
    return (
      <div style={{ padding: "2rem 1.75rem 3rem", display: "flex", flexDirection: "column", gap: "28px" }}>
        <div>
          <label style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-3)", display: "block", marginBottom: "8px" }}>Company Name *</label>
          <Input value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Acme Inc." />
        </div>
        <div>
          <label style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-3)", display: "block", marginBottom: "8px" }}>Website</label>
          <Input value={form.website} onChange={(v) => set("website", v)} placeholder="https://yourcompany.com" />
        </div>
        <SelectPills label="Industry" options={INDUSTRY_OPTIONS} value={form.industry} onChange={(v) => set("industry", v)} />
        <SelectPills label="Company Size" options={SIZE_OPTIONS} value={form.size} onChange={(v) => set("size", v)} />
        <TagInput label="Tech Stack" tags={form.tech_stack} onChange={(v) => set("tech_stack", v)} placeholder="e.g. React, Go, Postgres" accent="var(--indigo)" />
        <TagInput label="Culture" tags={form.culture_tags} onChange={(v) => set("culture_tags", v)} placeholder="e.g. Remote-first" accent="var(--copper)" suggestions={CULTURE_SUGGESTIONS} />
        {error && (
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px" }}>
            {error}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <motion.button
            onClick={handleSave}
            disabled={isPending || !form.name}
            style={{
              padding: "13px 28px", borderRadius: "12px", border: "none",
              background: !form.name ? "rgba(124,133,245,0.3)" : "linear-gradient(135deg, var(--indigo) 0%, #5a63d4 100%)",
              color: "#fff", fontFamily: "'Poppins', system-ui, sans-serif",
              fontWeight: 600, fontSize: "14px",
              cursor: isPending || !form.name ? "not-allowed" : "pointer",
              boxShadow: form.name ? "0 4px 16px rgba(124,133,245,0.25)" : "none",
            }}
            whileHover={form.name ? { scale: 1.02 } : {}}
            whileTap={form.name ? { scale: 0.98 } : {}}
          >
            {isPending ? "Saving..." : "Save Profile"}
          </motion.button>
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                style={{ display: "flex", alignItems: "center", gap: "6px", color: "#22c55e", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Saved
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "calc(var(--nav-h, 60px) + 2rem) 3rem 5rem" }}>
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 50% 30% at 60% 20%, rgba(124,133,245,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "700px", margin: "0 auto" }}>
        <motion.div style={{ marginBottom: "36px" }} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--indigo)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
            Company Profile
          </div>
          <h1 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: "var(--text-1)", margin: 0, letterSpacing: "-0.03em" }}>
            Tell candidates about your company
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "20px",
            padding: "32px",
            backdropFilter: "blur(20px)",
          }}
        >
          <div>
            <label style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-3)", display: "block", marginBottom: "8px" }}>
              Company Name *
            </label>
            <Input value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Acme Inc." />
          </div>

          <div>
            <label style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-3)", display: "block", marginBottom: "8px" }}>
              Website
            </label>
            <Input value={form.website} onChange={(v) => set("website", v)} placeholder="https://yourcompany.com" />
          </div>

          <SelectPills label="Industry" options={INDUSTRY_OPTIONS} value={form.industry} onChange={(v) => set("industry", v)} />
          <SelectPills label="Company Size" options={SIZE_OPTIONS} value={form.size} onChange={(v) => set("size", v)} />

          <TagInput
            label="Tech Stack"
            tags={form.tech_stack}
            onChange={(v) => set("tech_stack", v)}
            placeholder="e.g. React, Go, Postgres"
            accent="var(--indigo)"
          />

          <TagInput
            label="Culture"
            tags={form.culture_tags}
            onChange={(v) => set("culture_tags", v)}
            placeholder="e.g. Remote-first"
            accent="var(--copper)"
            suggestions={CULTURE_SUGGESTIONS}
          />

          {error && (
            <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <motion.button
              onClick={handleSave}
              disabled={isPending || !form.name}
              style={{
                padding: "13px 28px",
                borderRadius: "12px",
                border: "none",
                background: !form.name ? "rgba(124,133,245,0.3)" : "linear-gradient(135deg, var(--indigo) 0%, #5a63d4 100%)",
                color: "#fff",
                fontFamily: "'Poppins', system-ui, sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                cursor: isPending || !form.name ? "not-allowed" : "pointer",
                boxShadow: form.name ? "0 4px 16px rgba(124,133,245,0.25)" : "none",
              }}
              whileHover={form.name ? { scale: 1.02 } : {}}
              whileTap={form.name ? { scale: 0.98 } : {}}
            >
              {isPending ? "Saving..." : "Save Profile"}
            </motion.button>

            <AnimatePresence>
              {saved && (
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ display: "flex", alignItems: "center", gap: "6px", color: "#22c55e", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Saved
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
