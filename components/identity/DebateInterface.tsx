"use client";

/**
 * DebateInterface
 *
 * Two AI advisor personas argue about a career dilemma.
 * Turns reveal sequentially — one side at a time, with thinking dots
 * while the other side "prepares" their response.
 *
 * The Architect — warm amber — long-horizon strategic
 * The Challenger — cool slate — market-reality direct
 * The Mirror — full width below — reflects user's own patterns
 */

import { useState, useTransition, useEffect, useRef } from "react";
import { runDebate } from "@/app/actions/debate";
import type { DebateTurn } from "@/lib/ai/debate";

// ─── Persona config ────────────────────────────────────────────────────────────

const PERSONA = {
  architect: {
    name: "The Architect",
    tagline: "Long horizon · strategic lens",
    color: "#c9a86c",      // warm amber
    dimColor: "#3a2e1e",
    dotColor: "#c9a86c",
  },
  challenger: {
    name: "The Challenger",
    tagline: "Market reality · execution lens",
    color: "#7a9aaa",      // cool slate
    dimColor: "#1e2a30",
    dotColor: "#7a9aaa",
  },
} as const;

const TURN_DELAY_MS = 900;   // wait before revealing next turn

// ─── ThinkingDots ─────────────────────────────────────────────────────────────

function ThinkingDots({ color: _color }: { color: string }) {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", padding: "1rem 0" }}>
      <div className="wave-bar" />
      <div className="wave-bar" />
      <div className="wave-bar" />
      <div className="wave-bar" />
      <div className="wave-bar" />
    </div>
  );
}

// ─── TurnCard ─────────────────────────────────────────────────────────────────

function TurnCard({ turn, index }: { turn: DebateTurn; index: number }) {
  const persona = PERSONA[turn.speaker];
  return (
    <div
      className="debate-turn"
      style={{
        animationDelay: `${index * 0.06}s`,
        marginBottom: "1.75rem",
        paddingLeft: "1rem",
        borderLeft: `1px solid ${persona.dimColor}`,
      }}
    >
      <p
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "0.95rem",
          color: "#8a8480",
          lineHeight: 1.85,
          margin: 0,
          letterSpacing: "0.01em",
        }}
      >
        {turn.content}
      </p>
    </div>
  );
}

// ─── DebateView ───────────────────────────────────────────────────────────────

function DebateView({
  allTurns,
  mirror,
  dilemma,
}: {
  allTurns: DebateTurn[];
  mirror: string;
  dilemma: string;
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [mirrorVisible, setMirrorVisible] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reveal turns one by one
  useEffect(() => {
    if (visibleCount >= allTurns.length) {
      // After last turn, show mirror
      const t = setTimeout(() => setMirrorVisible(true), TURN_DELAY_MS * 1.5);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleCount((v) => v + 1), TURN_DELAY_MS);
    return () => clearTimeout(t);
  }, [visibleCount, allTurns.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleCount, mirrorVisible]);

  const architectTurns = allTurns
    .map((t, i) => ({ ...t, idx: i }))
    .filter((t) => t.speaker === "architect");
  const challengerTurns = allTurns
    .map((t, i) => ({ ...t, idx: i }))
    .filter((t) => t.speaker === "challenger");

  // Which turns are visible
  const visibleArchitect = architectTurns.filter((t) => t.idx < visibleCount);
  const visibleChallenger = challengerTurns.filter((t) => t.idx < visibleCount);

  // Who is "thinking" next
  const nextSpeaker = visibleCount < allTurns.length ? allTurns[visibleCount]?.speaker : null;

  return (
    <div>
      {/* Dilemma recap */}
      <p
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: "clamp(0.95rem, 1.8vw, 1.15rem)",
          color: "#2a3040",
          lineHeight: 1.7,
          marginBottom: "3rem",
          maxWidth: "640px",
          paddingLeft: "1rem",
          borderLeft: "1px solid #252a38",
        }}
      >
        {"\u201c"}{dilemma}{"\u201d"}
      </p>

      {/* Two-column debate arena */}
      <div
        className="debate-arena"
        style={{
          display: "flex",
          gap: "1px",
          background: "var(--border)",
          border: "1px solid var(--border)",
          marginBottom: "0",
        }}
      >
        {/* Architect column */}
        <div
          className="debate-col"
          style={{ borderTop: `2px solid ${PERSONA.architect.color}`, background: "var(--bg)" }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <p
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "0.65rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: PERSONA.architect.color,
                marginBottom: "0.25rem",
              }}
            >
              {PERSONA.architect.name}
            </p>
            <p
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "0.68rem",
                color: PERSONA.architect.dimColor,
                letterSpacing: "0.04em",
              }}
            >
              {PERSONA.architect.tagline}
            </p>
          </div>

          {visibleArchitect.map((turn, i) => (
            <TurnCard key={turn.idx} turn={turn} index={i} />
          ))}

          {nextSpeaker === "architect" && (
            <ThinkingDots color={PERSONA.architect.color} />
          )}
        </div>

        {/* Challenger column */}
        <div
          className="debate-col"
          style={{ borderTop: `2px solid ${PERSONA.challenger.color}`, background: "var(--bg)" }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <p
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "0.65rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: PERSONA.challenger.color,
                marginBottom: "0.25rem",
              }}
            >
              {PERSONA.challenger.name}
            </p>
            <p
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "0.68rem",
                color: PERSONA.challenger.dimColor,
                letterSpacing: "0.04em",
              }}
            >
              {PERSONA.challenger.tagline}
            </p>
          </div>

          {visibleChallenger.map((turn, i) => (
            <TurnCard key={turn.idx} turn={turn} index={i} />
          ))}

          {nextSpeaker === "challenger" && (
            <ThinkingDots color={PERSONA.challenger.color} />
          )}
        </div>
      </div>

      {/* Mirror section */}
      <div
        className="mirror-section"
        style={{
          opacity: mirrorVisible ? 1 : 0,
          transform: mirrorVisible ? "translateY(0)" : "translateY(12px)",
          transition: `opacity 0.8s ease, transform 0.8s ease`,
          pointerEvents: mirrorVisible ? "all" : "none",
          padding: "2.5rem 0 1rem",
        }}
      >
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.58rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#2a3040",
            marginBottom: "1.5rem",
          }}
        >
          ✦ THE MIRROR
        </p>
        {mirror && (
          <p
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "#5c6478",
              lineHeight: 1.8,
              maxWidth: "520px",
              margin: "0 auto",
              letterSpacing: "-0.01em",
              paddingLeft: "1.25rem",
              borderLeft: "2px solid rgba(201,168,108,0.2)",
            }}
          >
            {mirror}
          </p>
        )}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}

// ─── DebateInterface ──────────────────────────────────────────────────────────

export function DebateInterface() {
  const [dilemma, setDilemma] = useState("");
  const [result, setResult] = useState<{ turns: DebateTurn[]; mirror: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = dilemma.trim();
    if (!trimmed || isPending) return;
    setError(null);
    startTransition(async () => {
      const res = await runDebate(trimmed);
      if (res.ok) {
        setResult({ turns: res.turns, mirror: res.mirror });
      } else {
        setError(res.error);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // Auto-resize textarea
  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  const isReady = dilemma.trim().length > 20 && !isPending;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingTop: "48px" }}>
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "5rem 5vw 8rem",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "5rem" }}>
          <h1
            style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontWeight: 300,
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              color: "#f0eff4",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              margin: "0 0 1rem",
            }}
          >
            the debate
          </h1>
          <p
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "0.85rem",
              color: "#2a3040",
              lineHeight: 1.7,
              letterSpacing: "0.02em",
            }}
          >
            Two advisors. One dilemma. Genuine disagreement.
          </p>
        </div>

        {/* Persona preview — before debate */}
        {!result && !isPending && (
          <div
            style={{
              display: "flex",
              gap: "1px",
              background: "var(--border)",
              border: "1px solid var(--border)",
              marginBottom: "3.5rem",
            }}
          >
            {(["architect", "challenger"] as const).map((key) => {
              const p = PERSONA[key];
              return (
                <div
                  key={key}
                  style={{
                    flex: 1,
                    padding: "1.5rem",
                    borderTop: `1px solid ${p.dimColor}`,
                    background: "var(--bg)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: "0.65rem",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: p.color,
                      marginBottom: "0.4rem",
                      opacity: 0.5,
                    }}
                  >
                    {p.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: "0.75rem",
                      color: "#2a3040",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {p.tagline}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Dilemma input */}
        {!result && (
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.58rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#5c6478", marginBottom: "1rem" }}>
                ✦ THE DEBATE CHAMBER ✦
              </p>
              <h1 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 300, color: "#8892a4", margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
                Two voices. One dilemma.
              </h1>
              <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.82rem", color: "#2a3040", margin: 0 }}>
                No comfortable answers.
              </p>
            </div>
            <p
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "0.68rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#2a3040",
                marginBottom: "1.25rem",
              }}
            >
              your dilemma
            </p>

            <textarea
              ref={textareaRef}
              className="debate-textarea"
              value={dilemma}
              onChange={(e) => setDilemma(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              disabled={isPending}
              placeholder="Describe the career decision you're wrestling with…"
              rows={3}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "1.5rem",
              }}
            >
              <p
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: "0.65rem",
                  color: "#1e2535",
                  letterSpacing: "0.06em",
                }}
              >
                ⌘↵ to convene
              </p>

              <button
                onClick={handleSubmit}
                disabled={!isReady}
                style={{
                  background: "none",
                  border: `1px solid ${isReady ? "#2a3040" : "#1e2535"}`,
                  color: isReady ? "#5c6478" : "#2a3040",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                  padding: "0.55rem 1.5rem",
                  cursor: isReady ? "pointer" : "default",
                  transition: "border-color 0.2s ease, color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (isReady) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#5c6478";
                    (e.currentTarget as HTMLButtonElement).style.color = "#8a8480";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isReady) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a3040";
                    (e.currentTarget as HTMLButtonElement).style.color = "#5c6478";
                  }
                }}
              >
                convene the debate →
              </button>
            </div>

            {error && (
              <p
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: "0.8rem",
                  color: "#5a3a3a",
                  marginTop: "1rem",
                }}
              >
                {error}
              </p>
            )}
          </div>
        )}

        {/* Generating state */}
        {isPending && (
          <div
            style={{
              display: "flex",
              gap: "1px",
              background: "var(--border)",
              border: "1px solid var(--border)",
              marginBottom: "3rem",
            }}
          >
            {(["architect", "challenger"] as const).map((key) => {
              const p = PERSONA[key];
              return (
                <div
                  key={key}
                  style={{
                    flex: 1,
                    padding: "2rem 1.75rem",
                    borderTop: `2px solid ${p.color}`,
                    background: "var(--bg)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: "0.65rem",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: p.color,
                      marginBottom: "1.5rem",
                    }}
                  >
                    {p.name}
                  </p>
                  <ThinkingDots color={p.color} />
                </div>
              );
            })}
          </div>
        )}

        {/* Debate result */}
        {result && (
          <DebateView
            allTurns={result.turns}
            mirror={result.mirror}
            dilemma={dilemma}
          />
        )}

        {/* Reset after debate */}
        {result && (
          <div style={{ marginTop: "4rem", textAlign: "center" }}>
            <button
              onClick={() => {
                setResult(null);
                setDilemma("");
                setError(null);
              }}
              style={{
                background: "none",
                border: "none",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
                color: "#2a3040",
                cursor: "pointer",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#2a3040")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#2a3040")
              }
            >
              ← new dilemma
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
