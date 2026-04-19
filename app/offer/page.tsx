"use client";

/**
 * /offer — Job Offer Evaluator
 *
 * Paste a job offer. Get a deep analysis vs your paths and values.
 * Verdict: take / negotiate / decline / unclear.
 */

import { useState, useTransition } from "react";
import { evaluateJobOffer } from "@/app/actions/offer";
import type { OfferEvalResult } from "@/lib/ai/offer";

// ─── Verdict config (semantic accent colors — intentional, keep as-is) ─────────

const VERDICT_CONFIG = {
  take:      { label: "take it",    color: "#3a5a3a", accent: "#2a4a2a" },
  negotiate: { label: "negotiate",  color: "#5a5a2a", accent: "#4a4a1a" },
  decline:   { label: "decline",    color: "#5a2a2a", accent: "#4a1a1a" },
  unclear:   { label: "unclear",    color: "#3a3836", accent: "#252a38" },
};

// ─── Result view ──────────────────────────────────────────────────────────────

type EvalOk = Extract<OfferEvalResult, { ok: true }>;

function ResultSection({ label, items, color }: { label: string; items: string[]; color?: string }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <p style={{ fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif", marginBottom: "1rem" }}>
        {label}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {items.map((item, i) => (
          <p
            key={i}
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "0.85rem",
              color: color ?? "var(--text-3)",
              lineHeight: 1.7,
              margin: 0,
              paddingLeft: "1rem",
              borderLeft: `1px solid ${color ?? "var(--border)"}`,
            }}
          >
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function EvalResult({ result }: { result: EvalOk }) {
  const vc = VERDICT_CONFIG[result.verdict];
  return (
    <div>
      {/* Verdict */}
      <div
        style={{
          padding: "1.75rem",
          background: "var(--surface)",
          border: `1px solid ${vc.accent}`,
          borderLeft: `3px solid ${vc.color}`,
          marginBottom: "3rem",
        }}
      >
        <p style={{ fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: vc.color, fontFamily: "Inter, system-ui, sans-serif", margin: "0 0 0.75rem" }}>
          {vc.label}
        </p>
        <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.88rem", color: "var(--text-3)", lineHeight: 1.75, margin: "0 0 1.25rem" }}>
          {result.verdict_reason}
        </p>
        <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontStyle: "italic", fontSize: "0.8rem", color: "var(--text-4)", lineHeight: 1.6, margin: 0 }}>
          {result.path_alignment}
        </p>
      </div>

      <ResultSection label="what fits" items={result.what_fits} color="#3a5a3a" />
      <ResultSection label="what conflicts" items={result.what_conflicts} color="#5a2a2a" />
      {result.negotiation_points.length > 0 && (
        <ResultSection label="negotiation points" items={result.negotiation_points} color="#5a5a2a" />
      )}
      {result.red_flags.length > 0 && (
        <ResultSection label="red flags" items={result.red_flags} color="#5a3a2a" />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfferPage() {
  const [offerText, setOfferText] = useState("");
  const [result, setResult] = useState<EvalOk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isReady = offerText.trim().length >= 50;

  function handleSubmit() {
    if (!isReady || isPending) return;
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await evaluateJobOffer(offerText);
      if (res.ok) {
        setResult(res);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingLeft: "var(--sidebar-w, 60px)" }}>
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "calc(56px + 4rem) 5vw 8rem",
        }}
      >
      {/* Header */}
      <div style={{ marginBottom: "3rem" }}>
        <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: "0.75rem" }}>
          OFFER EVALUATOR
        </p>
        <h1 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontStyle: "italic", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 300, color: "var(--text-2)", margin: 0, letterSpacing: "-0.02em" }}>
          Should you take it?
        </h1>
      </div>
      <p style={{ fontSize: "0.78rem", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif", lineHeight: 1.7, marginBottom: "3.5rem" }}>
        Paste the job description or offer details below. The system evaluates against your paths, values, and behavioral history.
      </p>

      {/* Input */}
      {!result && (
        <>
          <textarea
            value={offerText}
            onChange={(e) => setOfferText(e.target.value)}
            disabled={isPending}
            placeholder="Paste the job offer or description here…"
            style={{
              width: "100%",
              minHeight: "220px",
              background: "var(--surface-2)",
              border: `1px solid var(--border)`,
              color: "var(--text-3)",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "0.82rem",
              lineHeight: 1.7,
              padding: "1.1rem",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: "1.5rem",
              opacity: isPending ? 0.5 : 1,
            }}
            onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--border-2)"; }}
            onBlur={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = "var(--border)"; }}
          />

          {error && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif", marginBottom: "1.25rem" }}>
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
            {isPending ? "evaluating…" : "evaluate →"}
          </button>
        </>
      )}

      {/* Result */}
      {result && (
        <>
          <EvalResult result={result} />
          <button
            onClick={() => { setResult(null); setOfferText(""); }}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              color: "var(--text-4)",
              fontFamily: "Inter, system-ui, sans-serif",
              marginTop: "1rem",
            }}
          >
            ← evaluate another
          </button>
        </>
      )}
      </div>
    </div>
  );
}
