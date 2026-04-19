"use client";

/**
 * CommandPalette
 *
 * Cmd+K (Mac) / Ctrl+K (Windows) opens a quick-navigation modal.
 * Escape or click-outside closes it.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Entry = {
  label: string;
  description: string;
  route: string;
  shortcut?: string;
};

const ENTRIES: Entry[] = [
  { label: "Dashboard",         description: "Mission control — your career at a glance",          route: "/dashboard" },
  { label: "Profile",           description: "How you think, learn, and decide",                   route: "/identity" },
  { label: "Resume & Projects", description: "Upload resume, GitHub, and proof of work",           route: "/credentials" },
  { label: "AI Mentor ✦",       description: "Shadow mentor that challenges your reasoning",       route: "/mentor" },
  { label: "LinkedIn ✦",        description: "Import posts, work history, and connections",        route: "/linkedin" },
  { label: "Tracker ✦",         description: "Kanban board with ghost detection — never lose an app", route: "/tracker" },
  { label: "ATS Scan ✦",        description: "Score your resume vs a JD — find every missing keyword", route: "/ats" },
  { label: "Cover Letter ✦",    description: "AI letter built from your actual data, not templates", route: "/cover-letter" },
  { label: "Mock Interview ✦",  description: "Live AI interviewer — streaming, real-time, scored",  route: "/mock-interview" },
  { label: "Gap Analyzer ✦",    description: "Readiness score + path to close every skill gap",    route: "/gap-analyzer" },
  { label: "Salary ✦",          description: "Market range + practice negotiation with AI hiring manager", route: "/salary" },
  { label: "Network ✦",         description: "Find warm intro paths through your LinkedIn network", route: "/network" },
  { label: "Settings",           description: "Account and preferences",                            route: "/settings" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery("");
        setActive(0);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = ENTRIES.filter(
    (e) =>
      !query ||
      e.label.toLowerCase().includes(query.toLowerCase()) ||
      e.description.toLowerCase().includes(query.toLowerCase()),
  );

  function navigate(route: string) {
    router.push(route as Parameters<typeof router.push>[0]);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((v) => Math.min(v + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((v) => Math.max(v - 1, 0));
    } else if (e.key === "Enter") {
      const entry = filtered[active];
      if (entry) navigate(entry.route);
    }
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "20vh",
        background: "rgba(14, 14, 15, 0.85)",
        backdropFilter: "blur(4px)",
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          width: "min(520px, 90vw)",
          background: "#0c0c0d",
          border: "1px solid #1e1e20",
          borderRadius: "4px",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.9rem 1.25rem",
            borderBottom: "1px solid #1a1a1c",
          }}
        >
          <span style={{ color: "#3a3836", fontSize: "0.8rem", flexShrink: 0, fontFamily: "Georgia, serif" }}>⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            placeholder="Go to..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#c4bfb8",
              fontSize: "0.9rem",
              fontFamily: "Georgia, serif",
              caretColor: "#8a8480",
            }}
          />
          <span
            style={{
              fontSize: "0.6rem",
              color: "#3a3836",
              letterSpacing: "0.1em",
              fontFamily: "Georgia, serif",
            }}
          >
            ESC
          </span>
        </div>

        {/* Results */}
        <div style={{ maxHeight: "320px", overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <p style={{ padding: "1.5rem 1.25rem", color: "#3a3836", fontSize: "0.8rem", fontFamily: "Georgia, serif" }}>
              No results
            </p>
          ) : (
            filtered.map((entry, i) => (
              <button
                key={entry.route}
                onClick={() => navigate(entry.route)}
                onMouseEnter={() => setActive(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "0.75rem 1.25rem",
                  background: i === active ? "#141416" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s ease",
                  gap: "1rem",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: i === active ? "#c4bfb8" : "#8a8480", fontFamily: "Georgia, serif" }}>
                    {entry.label}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "#3a3836", marginTop: "0.1rem" }}>
                    {entry.description}
                  </p>
                </div>
                {i === active && (
                  <span style={{ fontSize: "0.6rem", color: "#3a3836", letterSpacing: "0.08em", flexShrink: 0, fontFamily: "Georgia, serif" }}>
                    ENTER
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: "0.6rem 1.25rem",
            borderTop: "1px solid #1a1a1c",
            display: "flex",
            gap: "1.5rem",
          }}
        >
          {[["↑↓", "navigate"], ["↵", "go"], ["esc", "close"]].map(([key, label]) => (
            <span key={key} style={{ fontSize: "0.6rem", color: "#2a2826", fontFamily: "Georgia, serif" }}>
              {key} <span style={{ color: "#252321" }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
