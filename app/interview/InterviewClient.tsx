"use client";

import { useState, useTransition } from "react";
import type { STARStory, RoleFitResult } from "@/lib/ai/interview";
import { getRoleFit } from "@/app/actions/interview";

// ─── STAR Card ────────────────────────────────────────────────────────────────

function STARCard({ story, index: _index }: { story: STARStory; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        borderBottom: `1px solid var(--surface-2)`,
        paddingBottom: "2rem",
        marginBottom: "2rem",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-4)",
              fontFamily: "Inter, system-ui, sans-serif",
              marginBottom: "0.4rem",
            }}
          >
            {story.best_for}
          </p>
          <p
            style={{
              fontSize: "0.9rem",
              color: expanded ? "var(--text-2)" : "var(--text-3)",
              fontFamily: "Inter, system-ui, sans-serif",
              lineHeight: 1.5,
              margin: 0,
              transition: "color 0.2s ease",
            }}
          >
            {story.capsule_claim}
          </p>
        </div>
        <span
          style={{
            color: "var(--text-4)",
            fontSize: "0.75rem",
            flexShrink: 0,
            marginTop: "0.15rem",
            transition: "transform 0.2s ease",
            transform: expanded ? "rotate(45deg)" : "none",
            display: "inline-block",
          }}
        >
          +
        </span>
      </button>

      {expanded && (
        <div style={{ marginTop: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {[
            { label: "S — Situation", text: story.situation },
            { label: "T — Task", text: story.task },
            { label: "A — Action", text: story.action },
            { label: "R — Result", text: story.result },
          ].map(({ label, text }) => (
            <div key={label}>
              <p
                style={{
                  fontSize: "0.58rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--text-4)",
                  fontFamily: "Inter, system-ui, sans-serif",
                  marginBottom: "0.4rem",
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-3)",
                  lineHeight: 1.75,
                  margin: 0,
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                {text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STAR Tab ─────────────────────────────────────────────────────────────────

function STARTab({ stories, gaps }: { stories: STARStory[]; gaps: string[] }) {
  if (stories.length === 0) {
    return (
      <p
        style={{
          fontSize: "0.82rem",
          color: "var(--text-4)",
          fontFamily: "Inter, system-ui, sans-serif",
          lineHeight: 1.7,
        }}
      >
        No proof capsules found. Complete at least one proof capsule to generate STAR stories.
      </p>
    );
  }

  return (
    <div>
      <div>
        {stories.map((story, i) => (
          <STARCard key={i} story={story} index={i} />
        ))}
      </div>

      {gaps.length > 0 && (
        <div style={{ marginTop: "3rem" }}>
          <p
            style={{
              fontSize: "0.58rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--text-4)",
              fontFamily: "Inter, system-ui, sans-serif",
              marginBottom: "1.25rem",
            }}
          >
            coverage gaps
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {gaps.map((gap, i) => (
              <p
                key={i}
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-4)",
                  lineHeight: 1.6,
                  margin: 0,
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                — {gap}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Role Fit Tab ─────────────────────────────────────────────────────────────

function RoleFitTab() {
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<RoleFitResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAnalyze() {
    if (!jd.trim() || isPending) return;
    startTransition(async () => {
      const res = await getRoleFit(jd.trim());
      setResult(res);
    });
  }

  const scoreColor = (s: string) =>
    s === "strong" ? "var(--green)" : s === "partial" ? "var(--text-3)" : "var(--text-4)";

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <p
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-4)",
            fontFamily: "Inter, system-ui, sans-serif",
            marginBottom: "0.75rem",
          }}
        >
          paste job description
        </p>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the full job description here…"
          style={{
            width: "100%",
            minHeight: "180px",
            background: "var(--surface-2)",
            border: `1px solid var(--border)`,
            color: "var(--text-3)",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "0.82rem",
            lineHeight: 1.7,
            padding: "1rem",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--border-2)")}
          onBlur={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--border)")}
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!jd.trim() || isPending}
        style={{
          background: "none",
          border: `1px solid ${jd.trim() && !isPending ? "var(--border-2)" : "var(--border)"}`,
          color: jd.trim() && !isPending ? "var(--text-3)" : "var(--text-4)",
          fontSize: "0.65rem",
          letterSpacing: "0.1em",
          textTransform: "lowercase",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: "0.5rem 1.25rem",
          cursor: jd.trim() && !isPending ? "pointer" : "default",
          transition: "border-color 0.2s ease, color 0.2s ease",
        }}
      >
        {isPending ? "analyzing…" : "analyze fit →"}
      </button>

      {result && (
        <div style={{ marginTop: "3rem" }}>
          {result.ok ? (
            <div>
              {/* Score */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: scoreColor(result.alignment_score),
                  }}
                />
                <span
                  style={{
                    fontSize: "0.65rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: scoreColor(result.alignment_score),
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  {result.alignment_score} fit
                </span>
              </div>

              {/* Verdict */}
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-3)",
                  lineHeight: 1.75,
                  fontFamily: "Inter, system-ui, sans-serif",
                  marginBottom: "2.5rem",
                  paddingLeft: "1rem",
                  borderLeft: `1px solid var(--surface-2)`,
                }}
              >
                {result.verdict}
              </p>

              {/* Details */}
              <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 220px" }}>
                  {result.what_fits.length > 0 && (
                    <div style={{ marginBottom: "2rem" }}>
                      <p style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif", marginBottom: "0.75rem" }}>
                        what fits
                      </p>
                      {result.what_fits.map((item, i) => (
                        <p key={i} style={{ fontSize: "0.78rem", color: "var(--text-3)", lineHeight: 1.6, margin: 0, marginBottom: "0.4rem", fontFamily: "Inter, system-ui, sans-serif" }}>
                          — {item}
                        </p>
                      ))}
                    </div>
                  )}

                  {result.relevant_capsules.length > 0 && (
                    <div>
                      <p style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif", marginBottom: "0.75rem" }}>
                        relevant proof
                      </p>
                      {result.relevant_capsules.map((item, i) => (
                        <p key={i} style={{ fontSize: "0.78rem", color: "var(--text-4)", lineHeight: 1.6, margin: 0, marginBottom: "0.4rem", fontFamily: "Inter, system-ui, sans-serif" }}>
                          — {item}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ flex: "1 1 220px" }}>
                  {result.gaps_for_role.length > 0 && (
                    <div style={{ marginBottom: "2rem" }}>
                      <p style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif", marginBottom: "0.75rem" }}>
                        gaps
                      </p>
                      {result.gaps_for_role.map((item, i) => (
                        <p key={i} style={{ fontSize: "0.78rem", color: "var(--text-4)", lineHeight: 1.6, margin: 0, marginBottom: "0.4rem", fontFamily: "Inter, system-ui, sans-serif" }}>
                          — {item}
                        </p>
                      ))}
                    </div>
                  )}

                  {result.red_flags.length > 0 && (
                    <div>
                      <p style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif", marginBottom: "0.75rem" }}>
                        red flags
                      </p>
                      {result.red_flags.map((item, i) => (
                        <p key={i} style={{ fontSize: "0.78rem", color: "var(--text-4)", lineHeight: 1.6, margin: 0, marginBottom: "0.4rem", fontFamily: "Inter, system-ui, sans-serif" }}>
                          — {item}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: "0.82rem", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif" }}>
              {result.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── InterviewClient ──────────────────────────────────────────────────────────

type Tab = "star" | "fit";

export function InterviewClient({
  stories,
  gaps,
  error,
}: {
  stories: STARStory[];
  gaps: string[];
  error?: string;
}) {
  const [tab, setTab] = useState<Tab>("star");

  const tabStyle = (t: Tab) => ({
    background: "none",
    border: "none",
    padding: "0 0 0.5rem",
    cursor: "pointer",
    fontSize: "0.65rem",
    letterSpacing: "0.1em",
    textTransform: "lowercase" as const,
    fontFamily: "Inter, system-ui, sans-serif",
    color: tab === t ? "var(--text-3)" : "var(--text-4)",
    borderBottom: tab === t ? "1px solid var(--text-4)" : "1px solid transparent",
    transition: "color 0.2s ease, border-color 0.2s ease",
  });

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "2rem", marginBottom: "3rem", borderBottom: `1px solid var(--surface-2)`, paddingBottom: "0" }}>
        <button style={tabStyle("star")} onClick={() => setTab("star")}>
          star stories
        </button>
        <button style={tabStyle("fit")} onClick={() => setTab("fit")}>
          role fit
        </button>
      </div>

      {/* Content */}
      {tab === "star" ? (
        error ? (
          <p style={{ fontSize: "0.82rem", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif" }}>{error}</p>
        ) : (
          <STARTab stories={stories} gaps={gaps} />
        )
      ) : (
        <RoleFitTab />
      )}
    </div>
  );
}
