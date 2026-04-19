"use client";

/**
 * /story — Career Story Generator
 *
 * Generates a first-person narrative from all available user data.
 * One button. One essay. One reading experience.
 */

import { useState, useTransition } from "react";
import { getCareerStory } from "@/app/actions/story";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StoryPage() {
  const [story, setStory] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [generated, setGenerated] = useState(false);

  function generate() {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await getCareerStory();
      if (result.ok) {
        setStory(result.story);
        setWordCount(result.wordCount);
        setGenerated(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingLeft: "var(--sidebar-w, 60px)" }}>
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "calc(56px + 5rem) 5vw 10rem",
        }}
      >
      {/* Ceremonial header */}
      <div style={{ textAlign: "center", marginBottom: "5rem" }}>
        <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "1rem", color: "#c9a86c", opacity: 0.4, display: "block", marginBottom: "1.5rem" }}>✦</span>
        <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.58rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: "1rem" }}>
          CAREER STORY
        </p>
        <h1 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 300, color: "var(--text-1)", margin: "0 0 1rem", letterSpacing: "-0.025em" }}>
          Every decision. Every pivot.
          <br />
          The version of you that exists today.
        </h1>
      </div>

      {!generated ? (
        <div>
          {error && (
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--text-4)",
                fontFamily: "Inter, system-ui, sans-serif",
                lineHeight: 1.6,
                marginBottom: "2rem",
                paddingLeft: "1.25rem",
                borderLeft: `1px solid var(--border)`,
              }}
            >
              {error}
            </p>
          )}

          <button
            onClick={generate}
            disabled={isPending}
            style={{
              background: "none",
              border: `1px solid ${isPending ? "var(--border)" : "var(--border-2)"}`,
              color: isPending ? "var(--text-4)" : "var(--text-3)",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              textTransform: "lowercase",
              fontFamily: "Inter, system-ui, sans-serif",
              padding: "0.6rem 1.6rem",
              cursor: isPending ? "default" : "pointer",
              transition: "border-color 0.2s ease, color 0.2s ease",
            }}
          >
            {isPending ? (
              <span style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <span className="thinking-dot" style={{ animationDelay: "0s" }} />
                <span className="thinking-dot" style={{ animationDelay: "0.18s" }} />
                <span className="thinking-dot" style={{ animationDelay: "0.36s" }} />
              </span>
            ) : (
              "generate →"
            )}
          </button>
        </div>
      ) : (
        story && (
          <div>
            {/* Word count */}
            <p
              style={{
                fontSize: "0.6rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--text-4)",
                fontFamily: "Inter, system-ui, sans-serif",
                marginBottom: "3rem",
              }}
            >
              {wordCount} words
            </p>

            {/* Story paragraphs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {story.split(/\n\n+/).map((paragraph, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: "'Poppins', system-ui, sans-serif",
                    fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
                    fontWeight: 300,
                    color: i === 0 ? "var(--text-3)" : "var(--text-4)",
                    lineHeight: 2.0,
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Divider */}
            <div
              style={{
                margin: "4rem 0",
                height: "1px",
                background: "var(--border)",
              }}
            />

            {/* Actions */}
            <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
              <button
                onClick={() => {
                  setGenerated(false);
                  setStory(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  color: "var(--text-4)",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                ← regenerate
              </button>

              <button
                onClick={() => {
                  if (story) navigator.clipboard.writeText(story).catch(() => {});
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  color: "var(--text-4)",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                copy text
              </button>
            </div>
          </div>
        )
      )}
      </div>
    </div>
  );
}
