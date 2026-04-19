"use client";

/**
 * ModeSelector
 *
 * A minimal mode picker that persists the user's career mode to localStorage.
 * Can be embedded on the dashboard or any client-rendered context.
 * The mode adjusts mentor tone without changing the underlying AI reasoning.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CAREER_MODES, DEFAULT_MODE, MODE_STORAGE_KEY, type CareerMode } from "@/types/mode";

// ─── Palette ──────────────────────────────────────────────────────────────────

const MODE_ACCENT: Record<CareerMode, string> = {
  explore:  "#6a8aaa",
  build:    "#5a9a5a",
  recover:  "#c9a86c",
  reflect:  "#8a7aaa",
};

// ─── ModeSelector ─────────────────────────────────────────────────────────────

export function ModeSelector({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<CareerMode>(DEFAULT_MODE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY) as CareerMode | null;
    if (stored && stored in CAREER_MODES) setMode(stored);
    setMounted(true);
  }, []);

  function selectMode(m: CareerMode) {
    setMode(m);
    localStorage.setItem(MODE_STORAGE_KEY, m);
  }

  if (!mounted) return null;

  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-4)", fontFamily: "Inter, system-ui, sans-serif" }}>
          mode
        </span>
        <span style={{ fontSize: "0.65rem", letterSpacing: "0.1em", color: MODE_ACCENT[mode], fontFamily: "Inter, system-ui, sans-serif" }}>
          {CAREER_MODES[mode].label.toLowerCase()}
        </span>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-3)", fontFamily: "Inter, system-ui, sans-serif", marginBottom: "1rem" }}>
        Career mode
      </p>
      <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.75rem", color: "var(--text-3)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
        Changes how the mentor approaches you — the AI reasoning stays the same.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--border)", borderRadius: "10px", overflow: "hidden" }}>
        {(Object.entries(CAREER_MODES) as [CareerMode, typeof CAREER_MODES[CareerMode]][]).map(([key, cfg]) => {
          const isActive = mode === key;
          const accent = MODE_ACCENT[key];
          return (
            <motion.button
              key={key}
              onClick={() => selectMode(key)}
              whileTap={{ scale: 0.98 }}
              style={{
                background: isActive ? `${accent}0f` : "var(--surface)",
                border: "none",
                padding: "1.25rem 1.5rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.2s ease",
                borderLeft: isActive ? `2px solid ${accent}` : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)";
              }}
            >
              <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.75rem", letterSpacing: "0.1em", color: isActive ? accent : "var(--text-3)", margin: "0 0 0.3rem", transition: "color 0.2s ease", textTransform: "uppercase" }}>
                {cfg.label}
              </p>
              <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.7rem", color: isActive ? "var(--text-2)" : "var(--text-4)", margin: 0, lineHeight: 1.5, transition: "color 0.2s ease" }}>
                {cfg.description}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
