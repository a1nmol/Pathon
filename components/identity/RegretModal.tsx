"use client";

/**
 * RegretModal
 *
 * Intercepts "pursuing" clicks with an 18-month simulation.
 * Shows the user a realistic first-person account of their future
 * self 18 months into the commitment, then gives them the choice
 * to proceed or cancel.
 */

import { useState, useTransition } from "react";
import { runRegretSimulation } from "@/app/actions/regret";

// ─── Types ────────────────────────────────────────────────────────────────────

type SimState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "ready"; simulation: string; honest_question: string }
  | { phase: "error"; message: string };

// ─── RegretModal ──────────────────────────────────────────────────────────────

export function RegretModal({
  pathName,
  onConfirm,
  onClose,
}: {
  pathName: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [sim, setSim] = useState<SimState>({ phase: "idle" });
  const [isPending, startTransition] = useTransition();

  // Start simulation on mount
  useState(() => {
    startTransition(async () => {
      setSim({ phase: "loading" });
      const result = await runRegretSimulation(pathName);
      if (result.ok) {
        setSim({ phase: "ready", simulation: result.simulation, honest_question: result.honest_question });
      } else {
        setSim({ phase: "error", message: result.error });
      }
    });
  });

  const isLoading = sim.phase === "loading" || isPending;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          zIndex: 200,
          cursor: "pointer",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 201,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          width: "min(640px, 90vw)",
          maxHeight: "80vh",
          overflowY: "auto",
          padding: "2.5rem",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p
            style={{
              fontSize: "0.58rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--text-4)",
              fontFamily: "Georgia, serif",
              marginBottom: "0.5rem",
            }}
          >
            18 months later
          </p>
          <p
            style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontSize: "0.9rem",
              fontWeight: 300,
              color: "var(--text-4)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {"\u201c"}{pathName}{"\u201d"}
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "2rem 0" }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="thinking-dot"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
        ) : sim.phase === "ready" ? (
          <>
            {/* Simulation paragraphs */}
            <div style={{ marginBottom: "2rem" }}>
              {sim.simulation.split(/\n\n+/).map((para, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: "0.85rem",
                    color: "var(--text-3)",
                    lineHeight: 1.85,
                    margin: "0 0 1rem",
                    paddingLeft: "1.25rem",
                    borderLeft: `1px solid var(--border)`,
                  }}
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Honest question */}
            <div
              style={{
                padding: "1.25rem",
                background: "var(--surface-2)",
                borderLeft: `2px solid var(--border)`,
                marginBottom: "2.5rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.6rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--text-4)",
                  fontFamily: "Georgia, serif",
                  marginBottom: "0.6rem",
                }}
              >
                before you decide
              </p>
              <p
                style={{
                  fontFamily: "'Poppins', system-ui, sans-serif",
                  fontSize: "0.9rem",
                  color: "#7a7470",
                  lineHeight: 1.7,
                  margin: 0,
                  fontWeight: 300,
                }}
              >
                {sim.honest_question}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
              <button
                onClick={onConfirm}
                style={{
                  background: "none",
                  border: `1px solid var(--border-2)`,
                  color: "var(--text-3)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  textTransform: "lowercase",
                  fontFamily: "Georgia, serif",
                  padding: "0.55rem 1.4rem",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                }}
              >
                pursue it →
              </button>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  color: "var(--text-4)",
                  fontFamily: "Georgia, serif",
                }}
              >
                not yet
              </button>
            </div>
          </>
        ) : sim.phase === "error" ? (
          <>
            <p style={{ fontSize: "0.8rem", color: "var(--text-4)", fontFamily: "Georgia, serif", marginBottom: "2rem", lineHeight: 1.6 }}>
              Simulation unavailable: {sim.message}
            </p>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <button
                onClick={onConfirm}
                style={{
                  background: "none",
                  border: `1px solid var(--border-2)`,
                  color: "var(--text-3)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  fontFamily: "Georgia, serif",
                  padding: "0.55rem 1.4rem",
                  cursor: "pointer",
                }}
              >
                pursue anyway →
              </button>
              <button
                onClick={onClose}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "0.65rem", color: "var(--text-4)", fontFamily: "Georgia, serif" }}
              >
                cancel
              </button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
