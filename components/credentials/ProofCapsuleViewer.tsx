"use client";

/**
 * ProofCapsuleViewer
 *
 * Read-only display of a completed proof capsule.
 * Sections flow vertically with generous spacing.
 * Revision history appears at the bottom — collapsed by default.
 */

import { useState } from "react";
import type { ProofCapsuleRecord, ProofCapsuleRevision } from "@/types/proof";

// ─── Section display config ───────────────────────────────────────────────────

const SECTION_LABELS: Array<{
  key: keyof Pick<
    ProofCapsuleRecord,
    "context" | "constraints" | "decision_reasoning" | "iterations" | "reflection"
  >;
  label: string;
}> = [
  { key: "context", label: "Situation" },
  { key: "constraints", label: "Conditions" },
  { key: "decision_reasoning", label: "Reasoning" },
  { key: "iterations", label: "What changed" },
  { key: "reflection", label: "Now I know" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function wordCount(text: string | null): number {
  if (!text?.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

// ─── RevisionHistory ──────────────────────────────────────────────────────────

function RevisionHistory({ revisions }: { revisions: ProofCapsuleRevision[] }) {
  const [open, setOpen] = useState(false);

  if (!revisions.length) return null;

  return (
    <div className="mt-20 border-t pt-10" style={{ borderColor: "#252a38" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm"
        style={{ color: "#5c6478", letterSpacing: "0.04em" }}
      >
        {open ? "Hide" : `${revisions.length} revision${revisions.length > 1 ? "s" : ""}`}
      </button>

      {open && (
        <div className="mt-6 space-y-3">
          {revisions.map((rev, i) => {
            const isLatest = i === 0;
            return (
              <div
                key={rev.id}
                className="flex items-baseline justify-between"
              >
                <span
                  className="text-sm"
                  style={{ color: isLatest ? "#9ba3b8" : "#2e2c2b" }}
                >
                  {new Date(rev.saved_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <span
                  className="text-xs tabular-nums"
                  style={{ color: "#2e2c2b" }}
                >
                  {rev.word_count.toLocaleString()} words
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ProofCapsuleViewer ───────────────────────────────────────────────────────

export function ProofCapsuleViewer({
  capsule,
  revisions = [],
  onEdit,
}: {
  capsule: ProofCapsuleRecord;
  revisions?: ProofCapsuleRevision[];
  onEdit?: () => void;
}) {
  const totalWords = [
    capsule.claim,
    capsule.context,
    capsule.constraints,
    capsule.decision_reasoning,
    capsule.iterations,
    capsule.reflection,
  ].reduce((acc, s) => acc + wordCount(s), 0);

  return (
    <div
      className="mx-auto w-full max-w-xl px-6"
      style={{ background: "var(--bg)", minHeight: "100vh", paddingTop: "calc(52px + 4rem)", paddingBottom: "8rem" }}
    >
      {/* ── Page label ────────────────────────────────────────────────── */}
      <p style={{
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "0.58rem",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "#5c6478",
        marginBottom: "2rem",
      }}>
        Proof Capsule
      </p>

      {/* ── Completion bar ────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
        <div style={{ height: "1px", flex: 1, background: `linear-gradient(to right, ${capsule.is_complete ? "#4a6a58" : "#252a38"}, transparent)` }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.08em", color: capsule.is_complete ? "#4a6a58" : "#5c6478", flexShrink: 0 }}>
          {capsule.is_complete ? "complete" : "in progress"}
        </span>
        <div style={{ height: "1px", flex: 1, background: `linear-gradient(to left, ${capsule.is_complete ? "#4a6a58" : "#252a38"}, transparent)` }} />
      </div>

      {/* ── Claim ─────────────────────────────────────────────────────── */}
      <h1
        style={{
          fontFamily: "'Poppins', system-ui, sans-serif",
          fontWeight: 300,
          fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
          lineHeight: 1.35,
          letterSpacing: "-0.025em",
          color: "#f0eff4",
          margin: 0,
        }}
      >
        {capsule.claim || <span style={{ color: "#5c6478" }}>Untitled capsule</span>}
      </h1>

      {/* ── Meta row ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.06em", color: "#5c6478" }}>
          {formatDate(capsule.updated_at)}
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#2e2c2b", letterSpacing: "0.04em" }}>
          {totalWords.toLocaleString()} words
        </span>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{ marginLeft: "auto", fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.72rem", color: "#c9a86c", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.04em", opacity: 0.7, transition: "opacity 0.2s ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.7"; }}
          >
            Edit →
          </button>
        )}
      </div>

      {/* ── Tags ──────────────────────────────────────────────────────── */}
      {capsule.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {capsule.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border px-3 py-0.5 text-xs"
              style={{ borderColor: "#252a38", color: "#9ba3b8" }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Sections ──────────────────────────────────────────────────── */}
      <div style={{ marginTop: "4rem", display: "flex", flexDirection: "column", gap: 0 }}>
        {SECTION_LABELS.map(({ key, label }) => {
          const content = capsule[key];
          if (!content?.trim()) return null;

          return (
            <div key={key} style={{ borderTop: "1px solid #252a38", paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
              <p style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "0.58rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#c9a86c",
                opacity: 0.55,
                marginBottom: "1.25rem",
              }}>
                {label}
              </p>
              {content.split(/\n+/).map((para, i) =>
                para.trim() ? (
                  <p
                    key={i}
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: "0.95rem",
                      lineHeight: 1.85,
                      color: "#9ba3b8",
                      marginBottom: "1rem",
                    }}
                  >
                    {para}
                  </p>
                ) : null,
              )}
            </div>
          );
        })}
      </div>

      {/* ── Revision history ──────────────────────────────────────────── */}
      <RevisionHistory revisions={revisions} />
    </div>
  );
}
