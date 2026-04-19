"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { NBACard } from "@/components/nba/NBACard";
import { useTheme } from "@/context/theme";
import type { NBAAction } from "@/lib/nba/actions";

// ── Types ──────────────────────────────────────────────────────────────────────

interface DashboardBlock {
  stage: string;
  route: string;
  label: string;
  status: "complete" | "pending" | "open";
  summary: string;
  detail?: string;
  pct: number;
  cta?: string;
}

interface ActivePursuit { path_name: string; }
interface Pattern { description: string; }

interface DashboardClientProps {
  nbaAction: NBAAction;
  blocks: DashboardBlock[];
  nextIncompleteIdx: number;
  activePursuits: ActivePursuit[];
  patterns: Pattern[];
  careerDirection?: string;
  careerStage?: string;
  thinkingStyle?: string;
  primaryPathName?: string;
  linkedInPostCount?: number;
  linkedInPositionCount?: number;
  trackerTotal?: number;
  trackerInFlight?: number;
  trackerOffers?: number;
}

// ── Keyframe styles ────────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @keyframes nba-pulse {
    0%, 100% { opacity: 0.7; }
    50%       { opacity: 1; }
  }
  @keyframes ambient-drift-1 {
    0%   { transform: translate(0px, 0px) scale(1); }
    33%  { transform: translate(30px, -20px) scale(1.05); }
    66%  { transform: translate(-15px, 25px) scale(0.97); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  @keyframes ambient-drift-2 {
    0%   { transform: translate(0px, 0px) scale(1); }
    33%  { transform: translate(-25px, 15px) scale(0.96); }
    66%  { transform: translate(20px, -30px) scale(1.04); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  @keyframes tile-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes counter-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ── Ambient Background ─────────────────────────────────────────────────────────

function MissionBackground() {
  const { theme } = useTheme();
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      if (blob1Ref.current) {
        blob1Ref.current.style.transform = `translate(calc(-50% + ${nx * -24}px), calc(-50% + ${ny * -18}px))`;
      }
      if (blob2Ref.current) {
        blob2Ref.current.style.transform = `translate(${nx * 16}px, ${ny * 12}px)`;
      }
      if (blob3Ref.current) {
        blob3Ref.current.style.transform = `translate(${nx * -10}px, ${ny * 14}px)`;
      }
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const isLight = theme === "light";

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {/* Grain */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: isLight ? 0.025 : 0.018,
      }} />

      {/* Copper blob — top center, parallax */}
      <div
        ref={blob1Ref}
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          width: "900px",
          height: "600px",
          borderRadius: "50%",
          background: isLight
            ? "radial-gradient(ellipse, rgba(160,134,80,0.1) 0%, transparent 65%)"
            : "radial-gradient(ellipse, rgba(201,168,108,0.07) 0%, transparent 65%)",
          transform: "translate(-50%, -50%)",
          transition: "transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
          animation: "ambient-drift-1 18s ease-in-out infinite",
        }}
      />

      {/* Indigo blob — lower left */}
      <div
        ref={blob2Ref}
        style={{
          position: "absolute",
          bottom: "5%",
          left: "10%",
          width: "600px",
          height: "420px",
          borderRadius: "50%",
          background: isLight
            ? "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 65%)"
            : "radial-gradient(ellipse, rgba(124,133,245,0.05) 0%, transparent 65%)",
          transition: "transform 1.5s cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
          animation: "ambient-drift-2 22s ease-in-out infinite",
        }}
      />

      {/* Green blob — upper right */}
      <div
        ref={blob3Ref}
        style={{
          position: "absolute",
          top: "10%",
          right: "5%",
          width: "480px",
          height: "340px",
          borderRadius: "50%",
          background: isLight
            ? "radial-gradient(ellipse, rgba(61,112,80,0.05) 0%, transparent 65%)"
            : "radial-gradient(ellipse, rgba(90,138,106,0.04) 0%, transparent 65%)",
          transition: "transform 1.8s cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
        }}
      />

      {/* Vignette */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: isLight
          ? "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 30%, rgba(200,198,210,0.25) 100%)"
          : "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 30%, rgba(0,0,0,0.45) 100%)",
      }} />
    </div>
  );
}

// ── Animated Copper Border (NBA Card wrapper) ─────────────────────────────────

function GlowingBorderCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "relative",
        borderRadius: "20px",
        border: "1px solid rgba(201,168,108,0.25)",
        boxShadow: "0 0 0 1px rgba(201,168,108,0.06), 0 8px 40px rgba(0,0,0,0.35), 0 0 60px rgba(201,168,108,0.04)",
      }}
    >
      {/* Subtle copper corner accents */}
      {(["tl", "tr", "bl", "br"] as const).map((corner) => (
        <div key={corner} style={{
          position: "absolute",
          width: "20px",
          height: "20px",
          ...(corner === "tl" ? { top: -1, left: -1, borderTop: "2px solid rgba(201,168,108,0.5)", borderLeft: "2px solid rgba(201,168,108,0.5)", borderRadius: "20px 0 0 0" } : {}),
          ...(corner === "tr" ? { top: -1, right: -1, borderTop: "2px solid rgba(201,168,108,0.5)", borderRight: "2px solid rgba(201,168,108,0.5)", borderRadius: "0 20px 0 0" } : {}),
          ...(corner === "bl" ? { bottom: -1, left: -1, borderBottom: "2px solid rgba(201,168,108,0.3)", borderLeft: "2px solid rgba(201,168,108,0.3)", borderRadius: "0 0 0 20px" } : {}),
          ...(corner === "br" ? { bottom: -1, right: -1, borderBottom: "2px solid rgba(201,168,108,0.3)", borderRight: "2px solid rgba(201,168,108,0.3)", borderRadius: "0 0 20px 0" } : {}),
          pointerEvents: "none",
          zIndex: 1,
        }} />
      ))}
      {children}
    </motion.div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  color,
  icon,
  delay = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  delay?: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        position: "relative",
        background: hovered
          ? "rgba(25,29,39,0.9)"
          : "rgba(19,21,28,0.7)",
        border: "1px solid var(--border)",
        borderTop: `1px solid ${hovered ? color : "var(--border)"}`,
        borderRadius: "16px",
        padding: "1.75rem",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        transition: "background 0.3s ease, border-top-color 0.3s ease, box-shadow 0.3s ease",
        boxShadow: hovered
          ? `0 16px 48px rgba(0,0,0,0.4), 0 0 24px rgba(0,0,0,0.2)`
          : "0 4px 16px rgba(0,0,0,0.25)",
        overflow: "hidden",
        cursor: "default",
      }}
    >
      {/* Gradient overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at top left, ${color}0d 0%, transparent 60%)`,
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.4s ease",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.58rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--text-3)",
            margin: 0,
          }}>
            {label}
          </p>
          <span style={{ color, opacity: 0.8 }}>{icon}</span>
        </div>

        <p style={{
          fontFamily: "'Poppins', system-ui, sans-serif",
          fontWeight: 300,
          fontSize: "2.2rem",
          color: "var(--text-1)",
          margin: "0 0 0.3rem",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}>
          {value}
        </p>

        {sub && (
          <p style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "0.78rem",
            color: "var(--text-3)",
            margin: 0,
          }}>
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Tool Tile ─────────────────────────────────────────────────────────────────

// ── Tool Tile SVG Icons ────────────────────────────────────────────────────────

function IcoTracker() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="4" height="13" rx="1" />
      <rect x="8" y="7" width="4" height="10" rx="1" />
      <rect x="14" y="2" width="4" height="15" rx="1" />
    </svg>
  );
}
function IcoInterview() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2" width="5" height="7" rx="2.5" />
      <path d="M4 8a6 6 0 0012 0" />
      <line x1="10" y1="14" x2="10" y2="17" />
      <line x1="7" y1="17" x2="13" y2="17" />
    </svg>
  );
}
function IcoATS() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="14" height="16" rx="1.5" />
      <path d="M6 7l2.5 2.5L13 5" />
      <line x1="6" y1="12" x2="14" y2="12" />
      <line x1="6" y1="15" x2="11" y2="15" />
    </svg>
  );
}
function IcoGap() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 2.5v7.5l4 2" />
    </svg>
  );
}
function IcoSalary() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6v1.5M10 12.5V14" />
      <path d="M7.5 8.5a2.5 1.5 0 015 0c0 1-1 1.5-2.5 2s-2.5 1-2.5 2a2.5 1.5 0 005 0" />
    </svg>
  );
}
function IcoNetwork() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2" fill="currentColor" />
      <circle cx="3"  cy="5"  r="1.5" />
      <circle cx="17" cy="5"  r="1.5" />
      <circle cx="3"  cy="15" r="1.5" />
      <circle cx="17" cy="15" r="1.5" />
      <line x1="10" y1="10" x2="3"  y2="5"  />
      <line x1="10" y1="10" x2="17" y2="5"  />
      <line x1="10" y1="10" x2="3"  y2="15" />
      <line x1="10" y1="10" x2="17" y2="15" />
    </svg>
  );
}

const TOOL_TILES = [
  {
    Icon: IcoTracker,
    label: "Tracker",
    sublabel: "Applications",
    color: "var(--copper)",
    glow: "rgba(201,168,108,0.12)",
    route: "/tracker",
  },
  {
    Icon: IcoInterview,
    label: "Mock Interview",
    sublabel: "Voice AI",
    color: "var(--green)",
    glow: "rgba(90,138,106,0.12)",
    route: "/mock-interview",
  },
  {
    Icon: IcoATS,
    label: "ATS Scan",
    sublabel: "Resume score",
    color: "var(--indigo)",
    glow: "rgba(124,133,245,0.12)",
    route: "/ats",
  },
  {
    Icon: IcoGap,
    label: "Gap Analyzer",
    sublabel: "Skill gaps",
    color: "var(--copper)",
    glow: "rgba(201,168,108,0.12)",
    route: "/gap-analyzer",
  },
  {
    Icon: IcoSalary,
    label: "Salary",
    sublabel: "Market data",
    color: "var(--green)",
    glow: "rgba(90,138,106,0.12)",
    route: "/salary",
  },
  {
    Icon: IcoNetwork,
    label: "Network",
    sublabel: "Warm paths",
    color: "var(--indigo)",
    glow: "rgba(124,133,245,0.12)",
    route: "/network",
  },
];

function ToolTile({
  tile,
  subLabel,
  index,
}: {
  tile: (typeof TOOL_TILES)[0];
  subLabel: string;
  index: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px) translateZ(8px)`;
  }, []);

  const onMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(600px) rotateY(0deg) rotateX(0deg) translateY(0px) translateZ(0px)";
    setHovered(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.6 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        ref={ref}
        href={tile.route as Parameters<typeof Link>[0]["href"]}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onMouseEnter={() => setHovered(true)}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: "176px",
          background: hovered
            ? "rgba(25,29,39,0.95)"
            : "rgba(19,21,28,0.65)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "1.5rem",
          textDecoration: "none",
          cursor: "pointer",
          transition: "background 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
          transformStyle: "preserve-3d",
          willChange: "transform",
          boxShadow: hovered
            ? `0 20px 50px rgba(0,0,0,0.5), 0 0 30px ${tile.glow}`
            : "0 4px 16px rgba(0,0,0,0.25)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Top copper accent */}
        <div style={{
          position: "absolute",
          top: 0,
          left: "1rem",
          right: "1rem",
          height: "1.5px",
          background: `linear-gradient(90deg, ${tile.color}, transparent)`,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease",
          borderRadius: "0 0 2px 2px",
        }} />

        {/* Glow overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at top, ${tile.glow} 0%, transparent 65%)`,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.35s ease",
          pointerEvents: "none",
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{
            color: tile.color,
            display: "block",
            marginBottom: "0.75rem",
            filter: hovered ? `drop-shadow(0 0 6px ${tile.glow})` : "none",
            transition: "filter 0.3s ease",
          }}>
            <tile.Icon />
          </span>
          <span style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "var(--text-1)",
            letterSpacing: "-0.01em",
            display: "block",
          }}>
            {tile.label}
          </span>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.62rem",
            color: hovered ? tile.color : "var(--text-4)",
            letterSpacing: "0.05em",
            transition: "color 0.25s ease",
          }}>
            {subLabel}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Main DashboardClient ───────────────────────────────────────────────────────

export function DashboardClient({
  nbaAction,
  blocks: _blocks,
  nextIncompleteIdx: _nextIncompleteIdx,
  activePursuits: _activePursuits,
  patterns: _patterns,
  careerDirection: _careerDirection,
  careerStage,
  linkedInPostCount,
  linkedInPositionCount,
  trackerTotal,
  trackerInFlight,
  trackerOffers,
}: DashboardClientProps) {

  const tileSubLabels = [
    trackerTotal !== undefined
      ? trackerTotal > 0
        ? `${trackerTotal} application${trackerTotal !== 1 ? "s" : ""}`
        : "Start tracking"
      : "Track applications",
    "Start a session",
    "Scan your resume",
    "Check readiness",
    "Market data",
    "Find warm paths",
  ];

  return (
    <div
      className="dash-outer"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "calc(var(--nav-h) + 3rem) 2.5rem 6rem",
      }}
    >
      <style>{GLOBAL_STYLES}</style>

      {/* Ambient environment */}
      <MissionBackground />

      {/* Bento grid */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "1160px",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        {/* ── Row 1: NBA Card (full width) ── */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <GlowingBorderCard>
            <div style={{
              padding: "2.5rem",
              background: "rgba(19,21,28,0.85)",
              borderRadius: "20px",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}>
              {/* Mission control header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--copper)",
                    boxShadow: "0 0 10px rgba(201,168,108,0.7), 0 0 20px rgba(201,168,108,0.3)",
                    animation: "nba-pulse 2.5s ease-in-out infinite",
                  }} />
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.58rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--copper)",
                  }}>
                    Next best action
                  </span>
                </div>

                {careerStage && (
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.58rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-3)",
                    padding: "0.25rem 0.7rem",
                    border: "1px solid var(--border)",
                    borderRadius: "100px",
                    background: "var(--surface-2)",
                  }}>
                    {careerStage.replace(/_/g, " ")}
                  </span>
                )}
              </div>

              <NBACard action={nbaAction} />
            </div>
          </GlowingBorderCard>
        </motion.div>

        {/* ── Row 2: Metric cards ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.5rem",
        }}>
          <MetricCard
            label="Applications"
            value={trackerTotal ?? 0}
            sub={
              (trackerInFlight ?? 0) > 0
                ? `${trackerInFlight} active · ${trackerOffers ?? 0} offer${(trackerOffers ?? 0) !== 1 ? "s" : ""}`
                : "Start tracking"
            }
            color="var(--copper)"
            icon={<IcoTracker />}
            delay={0.25}
          />
          <MetricCard
            label="Network"
            value={linkedInPositionCount ?? 0}
            sub={
              (linkedInPositionCount ?? 0) > 0
                ? `${linkedInPostCount ?? 0} posts imported`
                : "Import LinkedIn"
            }
            color="var(--indigo)"
            icon={<IcoNetwork />}
            delay={0.32}
          />
          <MetricCard
            label="Warm paths"
            value={(linkedInPositionCount ?? 0) > 0 ? "Active" : "—"}
            sub={
              (linkedInPositionCount ?? 0) > 0
                ? "Network mapped"
                : "Import LinkedIn to unlock"
            }
            color="var(--green)"
            icon={<IcoGap />}
            delay={0.39}
          />
        </div>

        {/* ── Row 3: Tool tiles (2x3 grid) ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.58rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--text-3)",
            margin: "0 0 0.9rem",
          }}>
            Quick launch
          </p>
        </motion.div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "1.25rem",
        }}>
          {TOOL_TILES.map((tile, i) => (
            <ToolTile
              key={tile.route}
              tile={tile}
              subLabel={tileSubLabels[i]}
              index={i}
            />
          ))}
        </div>

        {/* ── LinkedIn import prompt (if not connected) ── */}
        {(linkedInPositionCount === undefined || linkedInPositionCount === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/linkedin"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.25rem 1.75rem",
                background: "rgba(201,168,108,0.04)",
                border: "1px solid rgba(201,168,108,0.18)",
                borderRadius: "14px",
                textDecoration: "none",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                transition: "background 0.25s ease, border-color 0.25s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "rgba(201,168,108,0.07)";
                el.style.borderColor = "rgba(201,168,108,0.35)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background = "rgba(201,168,108,0.04)";
                el.style.borderColor = "rgba(201,168,108,0.18)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "1.1rem", color: "var(--copper)" }}>⊞</span>
                <div>
                  <p style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    color: "var(--text-1)",
                    margin: "0 0 0.2rem",
                  }}>
                    Import your LinkedIn data
                  </p>
                  <p style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: "0.78rem",
                    color: "var(--text-3)",
                    margin: 0,
                  }}>
                    Unlock network mapping, context-aware tools, and AI reasoning
                  </p>
                </div>
              </div>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.68rem",
                color: "var(--copper)",
                letterSpacing: "0.06em",
                flexShrink: 0,
              }}>
                Import →
              </span>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
