"use client";

/**
 * SkillConstellation — 2D SVG rewrite
 *
 * Three concentric zones:
 *   Center   → Owned skills     (copper, filled, large)
 *   Middle   → Exploring skills (indigo, medium)
 *   Outer    → Gaps             (muted red, hollow/dashed)
 *
 * Node size  = leverage (bigger = more leverage)
 * Edges      = transferability connections (dim unless hovered)
 * Labels     = always visible via SVG text (proper alignment)
 * Hover      = edge highlights + right-side detail panel
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SkillNode } from "@/types/skills";

// ─── Palette (matches design system) ─────────────────────────────────────────

const P = {
  bg:          "#0d0e12",
  surface:     "#13151c",
  surface2:    "#191d27",
  border:      "#252a38",
  owned:       "#c9a86c",
  ownedDim:    "rgba(201,168,108,0.12)",
  exploring:   "#7c85f5",
  exploringDim:"rgba(124,133,245,0.10)",
  gap:         "rgba(196,84,90,0.75)",
  gapSolid:    "#c45454",
  edge:        "rgba(255,255,255,0.04)",
  edgeHov:     "rgba(201,168,108,0.4)",
  text1:       "#f0eff4",
  text2:       "#9ba3b8",
  text3:       "#5c6478",
  text4:       "#363d52",
} as const;

// ─── Deterministic hash ───────────────────────────────────────────────────────

function hashLabel(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Vec2 = { x: number; y: number };

type PlacedNode = SkillNode & {
  pos:    Vec2;
  radius: number;
};

// ─── Layout — concentric rings ────────────────────────────────────────────────

function buildLayout(nodes: SkillNode[]): PlacedNode[] {
  const owned     = nodes.filter(n => n.status === "owned");
  const exploring = nodes.filter(n => n.status === "exploring");
  const gaps      = nodes.filter(n => n.status === "gap");

  const placed: PlacedNode[] = [];

  function placeGroup(
    group: SkillNode[],
    rBase: number,
    rSpread: number,
    angleOffset = 0,
  ) {
    const count = group.length;
    group.forEach((node, i) => {
      const h = hashLabel(node.label);
      // Evenly distribute angle within group, small hash jitter so it feels organic
      const evenAngle = (i / Math.max(1, count)) * Math.PI * 2;
      const jitter = (hashLabel(node.label + "j") - 0.5) * (0.6 / Math.max(1, count));
      const angle = evenAngle + jitter + angleOffset;
      // Higher leverage → pulled toward inner edge of ring
      const r = rBase + rSpread * (1 - node.leverage * 0.55) * h;
      // Node radius 7–20px by leverage
      const radius = 7 + node.leverage * 13;

      placed.push({
        ...node,
        pos: {
          x: r * Math.cos(angle),
          y: r * Math.sin(angle) * 0.68, // flatten Y axis slightly
        },
        radius,
      });
    });
  }

  placeGroup(owned,     80,  90,  0);
  placeGroup(exploring, 210, 75,  0.4);
  placeGroup(gaps,      340, 100, 0.8);

  return placed;
}

// ─── Edge builder ─────────────────────────────────────────────────────────────

type Edge = { a: Vec2; b: Vec2; key: string };

function buildEdges(nodes: PlacedNode[]): Edge[] {
  const byLabel = new Map(nodes.map(n => [n.label, n]));
  const seen = new Set<string>();
  const edges: Edge[] = [];
  for (const node of nodes) {
    for (const rel of node.related) {
      const other = byLabel.get(rel);
      if (!other) continue;
      const key = [node.label, rel].sort().join("‖");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a: node.pos, b: other.pos, key });
    }
  }
  return edges;
}

// Quadratic bezier curved toward origin (gives nice arc shape)
function curvePath(a: Vec2, b: Vec2): string {
  const cpx = (a.x + b.x) * 0.18;
  const cpy = (a.y + b.y) * 0.18;
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

// ─── Label positioning ────────────────────────────────────────────────────────

function getLabelProps(pos: Vec2, radius: number): {
  x: number; y: number;
  anchor: "start" | "end" | "middle";
} {
  const angle = Math.atan2(pos.y, pos.x);
  const offset = radius + 13;
  const lx = pos.x + Math.cos(angle) * offset;
  const ly = pos.y + Math.sin(angle) * offset;

  // Text anchor based on which side of the circle
  const anchor =
    Math.abs(angle) < 0.35 || Math.abs(angle) > Math.PI - 0.35
      ? (pos.x >= 0 ? "start" : "end")
      : pos.x > 30 ? "start"
      : pos.x < -30 ? "end"
      : "middle";

  return { x: lx, y: ly + 4, anchor };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatChip({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "18px",
        fontWeight: 500,
        color,
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}>
        {count}
      </span>
      <span style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: "11px",
        color: P.text3,
        letterSpacing: "0.04em",
      }}>
        {label}
      </span>
    </div>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
        <circle
          cx="6" cy="6" r="4.5"
          fill={dashed ? "transparent" : color}
          fillOpacity={dashed ? 0 : 0.85}
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={dashed ? "2 2" : undefined}
        />
      </svg>
      <span style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: "11px",
        color: P.text3,
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SkillConstellation({ nodes: rawNodes }: { nodes: SkillNode[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const nodes = useMemo(() => buildLayout(rawNodes), [rawNodes]);
  const edges = useMemo(() => buildEdges(nodes), [nodes]);
  const byLabel = useMemo(() => new Map(nodes.map(n => [n.label, n])), [nodes]);

  const hoveredNode = hovered ? byLabel.get(hovered) ?? null : null;

  // Which edges are active (connected to hovered node)
  const activeEdgeKeys = useMemo<Set<string>>(() => {
    if (!hovered) return new Set();
    const h = byLabel.get(hovered);
    if (!h) return new Set();
    const s = new Set<string>();
    for (const rel of h.related) s.add([hovered, rel].sort().join("‖"));
    return s;
  }, [hovered, byLabel]);

  // Labels of nodes connected to hovered
  const connectedSet = useMemo<Set<string>>(() => {
    if (!hoveredNode) return new Set();
    return new Set(hoveredNode.related);
  }, [hoveredNode]);

  // Stats
  const stats = useMemo(() => ({
    owned:     rawNodes.filter(n => n.status === "owned").length,
    exploring: rawNodes.filter(n => n.status === "exploring").length,
    gaps:      rawNodes.filter(n => n.status === "gap").length,
  }), [rawNodes]);

  if (!nodes.length) return null;

  // ViewBox: fit all nodes with padding
  const PAD = 140;
  const allX = nodes.map(n => n.pos.x);
  const allY = nodes.map(n => n.pos.y);
  const vx = Math.min(...allX) - PAD;
  const vy = Math.min(...allY) - PAD;
  const vw = Math.max(...allX) - Math.min(...allX) + PAD * 2;
  const vh = Math.max(...allY) - Math.min(...allY) + PAD * 2;
  const viewBox = `${vx.toFixed(0)} ${vy.toFixed(0)} ${vw.toFixed(0)} ${vh.toFixed(0)}`;

  // Ring radii — visual guide circles
  const rings = [
    { r: 172, label: "OWNED",     color: P.owned,     opacity: 0.25 },
    { r: 300, label: "EXPLORING", color: P.exploring, opacity: 0.2  },
    { r: 440, label: "GAPS",      color: P.gapSolid,  opacity: 0.18 },
  ];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 56px)",
        background: "var(--bg)",
        overflow: "hidden",
      }}
    >
      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "1.75rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "2.5rem",
          zIndex: 20,
          pointerEvents: "none",
          background: "var(--surface-glass, rgba(13,14,18,0.7))",
          backdropFilter: "blur(8px)",
          padding: "0.65rem 1.75rem",
          border: `1px solid ${P.border}`,
          borderRadius: "100px",
        }}
      >
        <StatChip count={stats.owned}     label="owned"     color={P.owned}     />
        <div style={{ width: "1px", background: P.border, alignSelf: "stretch" }} />
        <StatChip count={stats.exploring} label="exploring" color={P.exploring} />
        <div style={{ width: "1px", background: P.border, alignSelf: "stretch" }} />
        <StatChip count={stats.gaps}      label="gaps"      color={P.gapSolid}  />
      </div>

      {/* ── SVG canvas ──────────────────────────────────────────────────────── */}
      <svg
        viewBox={viewBox}
        style={{ width: "100%", height: "100%", display: "block" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Radial gradient for background glow */}
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(201,168,108,0.04)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          {/* Glow filter for owned nodes */}
          <filter id="ownedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="hovGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Subtle center glow */}
        <ellipse cx="0" cy="0" rx="200" ry="150" fill="url(#bgGlow)" opacity="0.6" />

        {/* Zone guide rings */}
        {rings.map(ring => (
          <g key={ring.label}>
            <circle
              cx="0" cy="0"
              r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeWidth="1"
              strokeDasharray="3 9"
              opacity={ring.opacity}
            />
            {/* Zone label at top of ring */}
            <text
              x="0"
              y={-(ring.r + 10)}
              textAnchor="middle"
              fill={ring.color}
              opacity={ring.opacity * 1.5}
              fontSize="9"
              fontFamily="DM Mono, monospace"
              letterSpacing="0.18em"
            >
              {ring.label}
            </text>
          </g>
        ))}

        {/* ── Edges ───────────────────────────────────────────────────────── */}
        <g>
          {edges.map(edge => {
            const isActive = activeEdgeKeys.has(edge.key);
            const opacity =
              !hovered    ? 0.45 :
              isActive    ? 1    :
              0.04;
            return (
              <path
                key={edge.key}
                d={curvePath(edge.a, edge.b)}
                fill="none"
                stroke={isActive ? P.edgeHov : P.edge}
                strokeWidth={isActive ? 1.5 : 0.8}
                opacity={opacity}
                style={{ transition: "opacity 0.22s ease, stroke 0.22s ease" }}
              />
            );
          })}
        </g>

        {/* ── Nodes ───────────────────────────────────────────────────────── */}
        {nodes.map(node => {
          const isHov = hovered === node.label;
          const isConn = connectedSet.has(node.label);
          const isDim = hovered !== null && !isHov && !isConn;
          const scale = isHov ? 1.35 : 1;

          const fill =
            node.status === "owned"     ? P.owned     :
            node.status === "exploring" ? P.exploring :
            "transparent";

          const stroke =
            node.status === "owned"     ? P.owned     :
            node.status === "exploring" ? P.exploring :
            P.gap;

          const fillOpacity =
            node.status === "gap" ? 0 :
            isDim ? 0.18 :
            node.status === "owned" ? 0.88 : 0.72;

          const strokeOpacity =
            node.status === "gap"
              ? (isDim ? 0.18 : 0.7)
              : (isHov ? 1 : isDim ? 0.15 : 0.5);

          const lp = getLabelProps(node.pos, node.radius);

          const labelColor =
            isHov     ? P.text1    :
            isConn    ? P.text2    :
            isDim     ? P.text4    :
            node.status === "owned"     ? P.owned     :
            node.status === "exploring" ? P.exploring :
            P.gapSolid;

          const labelOpacity =
            isHov  ? 1    :
            isDim  ? 0.15 :
            node.status === "owned"     ? 0.72 :
            node.status === "exploring" ? 0.62 :
            0.5;

          return (
            <g
              key={node.label}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(node.label)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Glow halo for owned or hovered */}
              {(node.status === "owned" || isHov) && (
                <circle
                  cx={node.pos.x}
                  cy={node.pos.y}
                  r={node.radius * (isHov ? 3 : 2.2)}
                  fill={
                    node.status === "owned"     ? P.ownedDim :
                    node.status === "exploring" ? P.exploringDim :
                    "rgba(196,84,90,0.06)"
                  }
                  opacity={isDim ? 0.2 : isHov ? 1 : 0.7}
                  style={{ transition: "all 0.3s ease", pointerEvents: "none" }}
                />
              )}

              {/* Main circle */}
              <circle
                cx={node.pos.x}
                cy={node.pos.y}
                r={node.radius * scale}
                fill={fill}
                fillOpacity={fillOpacity}
                stroke={stroke}
                strokeWidth={node.status === "gap" ? 1.5 : isHov ? 2 : 0}
                strokeDasharray={node.status === "gap" ? "3 2.5" : undefined}
                strokeOpacity={strokeOpacity}
                style={{ transition: "all 0.2s ease" }}
              />

              {/* Inner accent for exploring nodes */}
              {node.status === "exploring" && (
                <circle
                  cx={node.pos.x}
                  cy={node.pos.y}
                  r={3}
                  fill="white"
                  fillOpacity={isDim ? 0.06 : 0.35}
                  style={{ pointerEvents: "none", transition: "all 0.2s ease" }}
                />
              )}

              {/* Label */}
              <text
                x={lp.x}
                y={lp.y}
                textAnchor={lp.anchor}
                fill={labelColor}
                fillOpacity={labelOpacity}
                fontSize={isHov ? "12" : "10"}
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight={isHov ? "500" : "400"}
                style={{
                  transition: "all 0.22s ease",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Hover detail panel ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            key={hoveredNode.label}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute",
              bottom: "2.5rem",
              right: "2rem",
              background: P.surface,
              border: `1px solid ${P.border}`,
              borderLeft: `3px solid ${
                hoveredNode.status === "owned"     ? P.owned     :
                hoveredNode.status === "exploring" ? P.exploring :
                P.gapSolid
              }`,
              borderRadius: "10px",
              padding: "1.25rem 1.5rem",
              width: "240px",
              pointerEvents: "none",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            {/* Status badge */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              marginBottom: "0.6rem",
            }}>
              <div style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background:
                  hoveredNode.status === "owned"     ? P.owned     :
                  hoveredNode.status === "exploring" ? P.exploring :
                  P.gapSolid,
              }} />
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "9px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: P.text3,
              }}>
                {hoveredNode.status === "owned"     ? "owned skill"   :
                 hoveredNode.status === "exploring" ? "in progress"   :
                 "skill gap"}
              </span>
            </div>

            {/* Skill name */}
            <p style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              color: P.text1,
              margin: "0 0 1.1rem",
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
            }}>
              {hoveredNode.label}
            </p>

            {/* Leverage bar */}
            <div style={{ marginBottom: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: P.text3 }}>
                  leverage
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: P.text3 }}>
                  {Math.round(hoveredNode.leverage * 100)}%
                </span>
              </div>
              <div style={{ height: "3px", background: P.border, borderRadius: "2px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.round(hoveredNode.leverage * 100)}%`,
                  background:
                    hoveredNode.status === "owned"     ? P.owned     :
                    hoveredNode.status === "exploring" ? P.exploring :
                    P.gapSolid,
                  borderRadius: "2px",
                }} />
              </div>
            </div>

            {/* Connections */}
            {hoveredNode.related.length > 0 && (
              <div>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: P.text3, margin: "0 0 0.4rem" }}>
                  transfers to
                </p>
                <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: P.text2, margin: 0, lineHeight: 1.5 }}>
                  {hoveredNode.related.slice(0, 4).join(" · ")}
                  {hoveredNode.related.length > 4 && ` +${hoveredNode.related.length - 4} more`}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "calc(var(--sidebar-w, 60px) + 1.5rem)",
          display: "flex",
          gap: "1.25rem",
          alignItems: "center",
          pointerEvents: "none",
          background: "var(--surface-glass, rgba(13,14,18,0.6))",
          backdropFilter: "blur(8px)",
          padding: "0.55rem 1rem",
          border: `1px solid ${P.border}`,
          borderRadius: "100px",
        }}
      >
        <LegendDot color={P.owned}    label="Owned"     />
        <LegendDot color={P.exploring} label="Exploring" />
        <LegendDot color={P.gapSolid} label="Gap"       dashed />
        <div style={{ width: "1px", background: P.border, alignSelf: "stretch" }} />
        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "10px", color: P.text3 }}>
          size = leverage
        </span>
      </div>

      {/* ── Idle hint ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!hovered && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            style={{
              position: "absolute",
              bottom: "2.15rem",
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: P.text2,
              margin: 0,
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            hover a skill to see connections
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
