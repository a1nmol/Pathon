"use client";

/**
 * ProofList
 *
 * Lists proof capsules. Shows an explanatory first-visit state when empty.
 * Each capsule shows a completeness arc, tags, and truncated claim.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ProofCapsuleRecord } from "@/types/proof";

// ─── Completeness ring ────────────────────────────────────────────────────────

const SECTIONS = [
  "claim",
  "context",
  "constraints",
  "decision_reasoning",
  "iterations",
  "reflection",
] as const;

function completeness(c: ProofCapsuleRecord): number {
  const filled = SECTIONS.filter((s) => {
    const v = c[s];
    return typeof v === "string" && v.trim().length > 0;
  }).length;
  return filled / SECTIONS.length;
}

function CompletenessRing({ pct }: { pct: number }) {
  const r = 7;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const gap = circ - dash;

  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      {/* Track */}
      <circle cx="9" cy="9" r={r} fill="none" stroke="#1e2535" strokeWidth="1.5" />
      {/* Fill */}
      <circle
        cx="9"
        cy="9"
        r={r}
        fill="none"
        stroke={pct === 1 ? "#5c6478" : "#2a3040"}
        strokeWidth="1.5"
        strokeDasharray={`${dash} ${gap}`}
        strokeLinecap="round"
        transform="rotate(-90 9 9)"
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
    </svg>
  );
}

function wordCount(s: string | null | undefined) {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Empty / first-visit state ────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  const WHAT = [
    { label: "claim", desc: "What decision did you make, or are you facing?" },
    { label: "context", desc: "What was the situation that made this hard?" },
    { label: "constraints", desc: "What couldn't you change?" },
    { label: "reasoning", desc: "Why did you decide the way you did?" },
    { label: "iterations", desc: "What did you try that didn't work?" },
    { label: "reflection", desc: "What would you do differently?" },
  ];

  return (
    <div
      style={{
        maxWidth: "560px",
        margin: "0 auto",
        padding: "6rem 2rem 8rem",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      {/* Empty state header */}
      <div style={{ textAlign: "center", padding: "0 0 3rem" }}>
        <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontStyle: "italic", fontSize: "1.1rem", color: "#2a3040", margin: "0 0 2rem" }}>
          Your decisions deserve structure.
        </p>
        <button
          onClick={onNew}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#8a8480",
            fontSize: "0.78rem",
            letterSpacing: "0.08em",
            fontFamily: "Inter, system-ui, sans-serif",
            padding: 0,
            textAlign: "center",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9ba3b8")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#8a8480")}
        >
          Record your first decision →
        </button>
      </div>

      {/* Explanation */}
      <p
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "0.65rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#2a3040",
          marginBottom: "2rem",
        }}
      >
        reflection
      </p>

      <h1
        style={{
          fontFamily: "'Poppins', system-ui, sans-serif",
          fontSize: "clamp(1.1rem, 3vw, 1.5rem)",
          fontWeight: 400,
          color: "#9ba3b8",
          lineHeight: 1.5,
          marginBottom: "1.25rem",
        }}
      >
        A proof capsule is a structured record of a decision.
      </h1>

      <p
        style={{
          fontSize: "0.82rem",
          color: "#5c6478",
          lineHeight: 1.8,
          marginBottom: "3rem",
        }}
      >
        Not a portfolio. Not a highlight reel. Evidence — the kind that shows
        how you actually think when things are hard.
      </p>

      {/* Section breakdown */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.9rem",
          marginBottom: "3.5rem",
          padding: "1.5rem 0",
          borderTop: "1px solid #1e2535",
          borderBottom: "1px solid #1e2535",
        }}
      >
        {WHAT.map((item, i) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              gap: "1.25rem",
              alignItems: "baseline",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(6px)",
              transition: `opacity 0.6s ease ${0.2 + i * 0.07}s, transform 0.6s ease ${0.2 + i * 0.07}s`,
            }}
          >
            <span
              style={{
                fontSize: "0.6rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#2a3040",
                minWidth: "5.5rem",
                fontFamily: "Inter, system-ui, sans-serif",
                flexShrink: 0,
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontSize: "0.78rem",
                color: "#5c6478",
                lineHeight: 1.6,
              }}
            >
              {item.desc}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onNew}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#8a8480",
          fontSize: "0.78rem",
          letterSpacing: "0.08em",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: 0,
          textAlign: "left",
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9ba3b8")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#8a8480")}
      >
        Start your first capsule →
      </button>
    </div>
  );
}

// ─── ProofList ────────────────────────────────────────────────────────────────

export function ProofList({
  userId: _userId,
  capsules,
}: {
  userId: string;
  capsules: ProofCapsuleRecord[];
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (capsules.length === 0) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <EmptyState onNew={() => router.push("/proof/new")} />
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#0f1219",
        minHeight: "100vh",
        padding: "5rem 5vw 8rem",
        maxWidth: "680px",
        margin: "0 auto",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: "3rem" }}>
        <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#5c6478", marginBottom: "0.75rem" }}>
          REFLECTION
        </p>
        <h1 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 300, color: "#8892a4", margin: 0, letterSpacing: "-0.02em" }}>
          Proof of your best decisions.
        </h1>
      </div>

      {/* Bridge to Interview Prep */}
      {capsules && capsules.length >= 2 && (
        <div style={{
          padding: "0.85rem 1.25rem",
          background: "rgba(196,168,130,0.04)",
          border: "1px solid rgba(196,168,130,0.1)",
          borderLeft: "3px solid #c9a86c",
          marginBottom: "2.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}>
          <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.8rem", color: "#8a7a68", margin: 0, lineHeight: 1.5 }}>
            <span style={{ color: "#c9a86c", marginRight: "0.4rem" }}>✦</span>
            {capsules.length} capsule{capsules.length !== 1 ? "s" : ""} ready — your STAR stories have been updated.
          </p>
          <a href="/interview" style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.72rem", color: "#c9a86c", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
            view interview prep →
          </a>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "3.5rem",
        }}
      >
        <p
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "0.65rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#2a3040",
            margin: 0,
          }}
        >
          reflection · {capsules.length} capsule{capsules.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => router.push("/proof/new")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#2a3040",
            fontSize: "0.65rem",
            letterSpacing: "0.1em",
            fontFamily: "Inter, system-ui, sans-serif",
            transition: "color 0.2s ease",
            padding: 0,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#8a8480")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#2a3040")}
        >
          + new
        </button>
      </div>

      {/* Capsule list */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {capsules.map((c, i) => {
          const pct = completeness(c);
          const words = wordCount(c.claim) + wordCount(c.reflection);

          return (
            <li
              key={c.id}
              onClick={() => router.push(`/proof/${c.id}`)}
              style={{
                cursor: "pointer",
                padding: "1.25rem 0.5rem",
                borderBottom: "1px solid #1e2535",
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(8px)",
                transition: `opacity 0.5s ease ${i * 0.06}s, transform 0.5s ease ${i * 0.06}s, background 0.2s ease`,
                borderRadius: "2px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLLIElement).style.background = "rgba(196,168,130,0.03)";
                const arrow = e.currentTarget.querySelector(".capsule-arrow") as HTMLElement | null;
                if (arrow) arrow.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLLIElement).style.background = "transparent";
                const arrow = e.currentTarget.querySelector(".capsule-arrow") as HTMLElement | null;
                if (arrow) arrow.style.opacity = "0";
              }}
            >
              {/* Completeness ring */}
              <div style={{ paddingTop: "2px" }}>
                <CompletenessRing pct={pct} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontStyle: "normal",
                    fontWeight: 300,
                    fontSize: "0.92rem",
                    color: pct === 1 ? "#9ba3b8" : "#5c6478",
                    margin: 0,
                    lineHeight: 1.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.claim || "(untitled)"}
                </p>

                {c.tags && c.tags.length > 0 && (
                  <p
                    style={{
                      fontSize: "0.65rem",
                      letterSpacing: "0.06em",
                      color: "#2a3040",
                      margin: "0.3rem 0 0",
                    }}
                  >
                    {c.tags.join(" · ")}
                  </p>
                )}

                {c.created_at && (
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.58rem",
                      letterSpacing: "0.04em",
                      color: "#2a3040",
                      margin: "0.25rem 0 0",
                    }}
                  >
                    {new Date(c.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                )}
              </div>

              {/* Word count + arrow */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0, paddingTop: "2px" }}>
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "#2a3040",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  {words > 0 ? `${words}w` : ""}
                </span>
                <span
                  className="capsule-arrow"
                  style={{
                    fontSize: "0.7rem",
                    color: "rgba(196,168,130,0.5)",
                    opacity: 0,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  →
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
