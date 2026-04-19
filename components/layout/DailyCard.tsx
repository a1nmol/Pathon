"use client";

/**
 * DailyCard
 *
 * Fetches and displays the user's daily micro-action.
 * Lazy-loaded so dashboard renders first; action populates after.
 * Reads career mode from localStorage and passes it to the action.
 */

import { useEffect, useState, useTransition } from "react";
import { getDailyAction } from "@/app/actions/daily";
import { MODE_STORAGE_KEY, DEFAULT_MODE, type CareerMode } from "@/types/mode";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; action: string; context: string }
  | { status: "none"; message: string }
  | { status: "error"; message: string };

export function DailyCard() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const mode = (localStorage.getItem(MODE_STORAGE_KEY) ?? DEFAULT_MODE) as CareerMode;
    setState({ status: "loading" });
    startTransition(async () => {
      const result = await getDailyAction(mode);
      if (result.ok) {
        setState({ status: "ready", action: result.action, context: result.context });
      } else {
        if (result.error.includes("No active pursuit")) {
          setState({ status: "none", message: result.error });
        } else {
          setState({ status: "error", message: result.error });
        }
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.status === "idle" || state.status === "none") return null;

  return (
    <div style={{ marginBottom: "5rem" }}>
      <p style={{ fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif", marginBottom: "1.25rem" }}>
        today
      </p>

      <div style={{ padding: "1.5rem 1.75rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", position: "relative" }}>
        {/* Left accent */}
        <div style={{ position: "absolute", left: 0, top: "1.25rem", bottom: "1.25rem", width: "2px", background: "var(--green)", borderRadius: "0 1px 1px 0" }} />

        {state.status === "loading" || isPending ? (
          <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", padding: "0.75rem 0" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="wave-bar" style={{ background: "var(--green)", opacity: 0.4, animationDelay: `${(i - 1) * 0.15}s` }} />
            ))}
          </div>
        ) : state.status === "ready" ? (
          <>
            <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "1rem", fontWeight: 300, color: "var(--green)", lineHeight: 1.6, margin: "0 0 0.85rem", letterSpacing: "-0.01em" }}>
              {state.action}
            </p>
            <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.75rem", color: "var(--text-4)", lineHeight: 1.6, margin: 0 }}>
              {state.context}
            </p>
          </>
        ) : (
          <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.78rem", color: "var(--text-4)", margin: 0 }}>
            {state.message}
          </p>
        )}
      </div>
    </div>
  );
}
