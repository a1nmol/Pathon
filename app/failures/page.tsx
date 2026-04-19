"use client";

/**
 * /failures — Failure Archive
 *
 * A private record of failures, mistakes, and dead ends.
 * Each entry has: what happened, what it cost, what it taught.
 * The system reads these as evidence — not as identity.
 *
 * Storage: localStorage for now (no additional DB migration).
 * These are surfaced to the mentor on request, not automatically.
 */

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FailureEntry = {
  id: string;
  what_happened: string;
  what_it_cost: string;
  what_it_taught: string;
  created_at: string;
};

const STORAGE_KEY = "pathon_failures";

function loadEntries(): FailureEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FailureEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: FailureEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ─── Empty form ───────────────────────────────────────────────────────────────

const EMPTY = { what_happened: "", what_it_cost: "", what_it_taught: "" };

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  prompt,
  value,
  onChange,
}: {
  label: string;
  prompt: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: "1.75rem" }}>
      <p style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif", margin: "0 0 0.4rem" }}>
        {label}
      </p>
      <p style={{ fontSize: "0.78rem", color: "var(--text-3)", fontFamily: "Inter, system-ui, sans-serif", lineHeight: 1.6, margin: "0 0 0.7rem" }}>
        {prompt}
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…"
        style={{
          width: "100%",
          minHeight: "80px",
          background: "var(--surface-2)",
          border: `1px solid var(--border)`,
          color: "var(--text-3)",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "0.82rem",
          lineHeight: 1.7,
          padding: "0.8rem",
          resize: "vertical",
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--border-2)"; }}
        onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--border)"; }}
      />
    </div>
  );
}

// ─── Entry card ───────────────────────────────────────────────────────────────

function EntryCard({ entry, onDelete }: { entry: FailureEntry; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const date = new Date(entry.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div
      style={{
        paddingLeft: "1.25rem",
        borderLeft: "1px solid var(--red-dim)",
        marginBottom: "1.75rem",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", cursor: "pointer" }}
        onClick={() => setOpen((v) => !v)}
      >
        <p
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "0.88rem",
            fontStyle: "italic",
            color: "var(--red)",
            lineHeight: 1.5,
            margin: "0 0 0.3rem",
            fontWeight: 300,
          }}
        >
          {entry.what_happened.length > 100 ? entry.what_happened.slice(0, 100) + "…" : entry.what_happened}
        </p>
        <span style={{ fontSize: "0.6rem", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif", flexShrink: 0, marginTop: "2px" }}>
          {open ? "−" : "+"}
        </span>
      </div>

      <p style={{ fontSize: "0.62rem", letterSpacing: "0.08em", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif", margin: 0 }}>
        {date}
      </p>

      {open && (
        <div style={{ marginTop: "1rem" }}>
          {entry.what_it_cost && (
            <div style={{ marginBottom: "0.85rem" }}>
              <p style={{ fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif", margin: "0 0 0.3rem" }}>cost</p>
              <p style={{ fontSize: "0.82rem", color: "var(--red-dim)", lineHeight: 1.7, margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>{entry.what_it_cost}</p>
            </div>
          )}
          {entry.what_it_taught && (
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif", margin: "0 0 0.3rem" }}>taught</p>
              <p style={{ fontSize: "0.82rem", color: "var(--text-4)", lineHeight: 1.7, margin: 0, fontFamily: "Inter, system-ui, sans-serif", fontStyle: "italic" }}>{entry.what_it_taught}</p>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif" }}
          >
            delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FailuresPage() {
  const [entries, setEntries] = useState<FailureEntry[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [adding, setAdding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
    setMounted(true);
  }, []);

  function handleSave() {
    if (!form.what_happened.trim()) return;
    const newEntry: FailureEntry = {
      id: Date.now().toString(),
      ...form,
      created_at: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveEntries(updated);
    setForm(EMPTY);
    setAdding(false);
  }

  function handleDelete(id: string) {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  }

  if (!mounted) return null;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingLeft: "var(--sidebar-w, 60px)" }}>
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "calc(56px + 4rem) 5vw 8rem",
        }}
      >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.58rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "1rem" }}>
          FAILURE ARCHIVE
        </p>
        <h1 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 300, color: "var(--text-3)", margin: "0 0 0.75rem", letterSpacing: "-0.02em" }}>
          Private. Permanent. Yours.
        </h1>
        <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.85rem", color: "var(--text-4)", margin: 0 }}>
          Failures become evidence when you name them.
        </p>
      </div>

      {/* Add button / form */}
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          style={{
            background: "none",
            border: `1px solid var(--border)`,
            color: "var(--text-4)",
            fontSize: "0.65rem",
            letterSpacing: "0.1em",
            fontFamily: "Inter, system-ui, sans-serif",
            padding: "0.55rem 1.25rem",
            cursor: "pointer",
            marginBottom: entries.length ? "3.5rem" : "0",
            transition: "border-color 0.2s ease",
          }}
        >
          + record a failure
        </button>
      ) : (
        <div style={{ marginBottom: "3.5rem", padding: "1.5rem", background: "var(--surface)", border: `1px solid var(--border)` }}>
          <Field
            label="what happened"
            prompt="Describe the failure or mistake. Be specific — not 'I failed at X' but what actually happened."
            value={form.what_happened}
            onChange={(v) => setForm((f) => ({ ...f, what_happened: v }))}
          />
          <Field
            label="what it cost"
            prompt="What did you lose? Time, money, trust, opportunity, confidence?"
            value={form.what_it_cost}
            onChange={(v) => setForm((f) => ({ ...f, what_it_cost: v }))}
          />
          <Field
            label="what it taught"
            prompt="What do you know now that you didn't know before this happened?"
            value={form.what_it_taught}
            onChange={(v) => setForm((f) => ({ ...f, what_it_taught: v }))}
          />

          <div style={{ display: "flex", gap: "1.5rem" }}>
            <button
              onClick={handleSave}
              disabled={!form.what_happened.trim()}
              style={{
                background: "none",
                border: `1px solid ${form.what_happened.trim() ? "var(--border-2)" : "var(--border)"}`,
                color: form.what_happened.trim() ? "var(--text-3)" : "var(--text-4)",
                fontSize: "0.65rem",
                letterSpacing: "0.1em",
                fontFamily: "Inter, system-ui, sans-serif",
                padding: "0.5rem 1.2rem",
                cursor: form.what_happened.trim() ? "pointer" : "default",
              }}
            >
              record →
            </button>
            <button
              onClick={() => { setAdding(false); setForm(EMPTY); }}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "0.65rem", letterSpacing: "0.1em", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif" }}
            >
              cancel
            </button>
          </div>
        </div>
      )}

      {/* Entries list */}
      {entries.length > 0 ? (
        <div>
          <p style={{ fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif", marginBottom: "2rem" }}>
            {entries.length} recorded
          </p>
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onDelete={() => handleDelete(entry.id)} />
          ))}
        </div>
      ) : !adding ? (
        <p style={{ fontSize: "0.8rem", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif", fontStyle: "italic", lineHeight: 1.7, marginTop: "3rem" }}>
          Nothing recorded yet. The absence of recorded failures is its own data point.
        </p>
      ) : null}
      </div>
    </div>
  );
}
