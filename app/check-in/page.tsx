"use client";

import { useState, useTransition } from "react";
import { submitCheckIn } from "@/app/actions/checkin";
import type { CheckInAnswers } from "@/lib/ai/checkin";

// ─── Question ─────────────────────────────────────────────────────────────────

function Question({
  label,
  prompt,
  value,
  onChange,
  disabled,
}: {
  label: string;
  prompt: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <p
        style={{
          fontSize: "0.58rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--text-4)",
          fontFamily: "Inter, system-ui, sans-serif",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "0.88rem",
          color: "var(--text-3)",
          fontFamily: "Inter, system-ui, sans-serif",
          lineHeight: 1.6,
          marginBottom: "0.85rem",
        }}
      >
        {prompt}
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="…"
        style={{
          width: "100%",
          minHeight: "90px",
          background: "var(--surface-2)",
          border: `1px solid var(--border)`,
          color: "var(--text-3)",
          fontFamily: "Inter, system-ui, sans-serif",
          fontStyle: "italic",
          fontSize: "clamp(1rem, 2vw, 1.15rem)",
          lineHeight: 1.7,
          padding: "0.85rem",
          resize: "vertical",
          outline: "none",
          boxSizing: "border-box",
          opacity: disabled ? 0.5 : 1,
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--border-2)";
          (e.currentTarget as HTMLTextAreaElement).style.boxShadow = "0 0 0 1px rgba(196,168,130,0.25)";
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLTextAreaElement).style.boxShadow = "none";
        }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckInPage() {
  const [answers, setAnswers] = useState<CheckInAnswers>({
    what_happened: "",
    energy: "",
    next: "",
  });
  const [response, setResponse] = useState<{ text: string; question: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const isReady =
    answers.what_happened.trim().length > 10 &&
    answers.energy.trim().length > 10 &&
    answers.next.trim().length > 10;

  function handleSubmit() {
    if (!isReady || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await submitCheckIn(answers);
      if (result.ok) {
        setResponse({ text: result.response, question: result.sharpening_question });
        setSubmitted(true);
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
          padding: "calc(56px + 4rem) 5vw 8rem",
        }}
      >
      {/* Ceremonial heading */}
      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "1.2rem", color: "#c9a86c", opacity: 0.4, display: "block", marginBottom: "1.5rem" }}>✦</span>
        <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.58rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: "1rem" }}>
          WEEKLY CHECK-IN
        </p>
        <h1 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 300, color: "var(--text-2)", margin: 0, letterSpacing: "-0.02em" }}>
          Three questions. Honest answers.
        </h1>
      </div>

      {!submitted ? (
        <>
          <Question
            label="01"
            prompt="What was the most significant thing that happened this week — at work or in your career thinking?"
            value={answers.what_happened}
            onChange={(v) => setAnswers((a) => ({ ...a, what_happened: v }))}
            disabled={isPending}
          />
          <Question
            label="02"
            prompt="What gave you energy this week? What drained it?"
            value={answers.energy}
            onChange={(v) => setAnswers((a) => ({ ...a, energy: v }))}
            disabled={isPending}
          />
          <Question
            label="03"
            prompt="What's the one thing you want to move forward on next week?"
            value={answers.next}
            onChange={(v) => setAnswers((a) => ({ ...a, next: v }))}
            disabled={isPending}
          />

          {error && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-4)",
                fontFamily: "Inter, system-ui, sans-serif",
                marginBottom: "1.5rem",
              }}
            >
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isReady || isPending}
            style={{
              background: "none",
              border: `1px solid ${isReady && !isPending ? "var(--border-2)" : "var(--border)"}`,
              color: isReady && !isPending ? "var(--text-3)" : "var(--text-4)",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              textTransform: "lowercase",
              fontFamily: "Inter, system-ui, sans-serif",
              padding: "0.55rem 1.4rem",
              cursor: isReady && !isPending ? "pointer" : "default",
              transition: "border-color 0.2s ease, color 0.2s ease",
            }}
          >
            {isPending ? "thinking…" : "submit →"}
          </button>
        </>
      ) : (
        response && (
          <div>
            {/* AI response */}
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-3)",
                fontFamily: "Inter, system-ui, sans-serif",
                lineHeight: 1.85,
                marginBottom: "3rem",
                paddingLeft: "1.25rem",
                borderLeft: `1px solid var(--surface-2)`,
              }}
            >
              {response.text}
            </p>

            {/* Sharpening question */}
            <div style={{ marginBottom: "3rem" }}>
              <p
                style={{
                  fontSize: "0.58rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--text-4)",
                  fontFamily: "Inter, system-ui, sans-serif",
                  marginBottom: "0.75rem",
                }}
              >
                carry this question into next week
              </p>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "var(--text-3)",
                  fontFamily: "Inter, system-ui, sans-serif",
                  lineHeight: 1.75,
                  fontStyle: "italic",
                }}
              >
                {response.question}
              </p>
            </div>

            {/* Reset */}
            <button
              onClick={() => {
                setSubmitted(false);
                setResponse(null);
                setAnswers({ what_happened: "", energy: "", next: "" });
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
                textDecoration: "none",
              }}
            >
              ← start over
            </button>
          </div>
        )
      )}
      </div>
    </div>
  );
}
