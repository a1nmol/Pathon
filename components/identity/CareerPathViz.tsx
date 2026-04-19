"use client";

/**
 * CareerPathViz — Scroll-driven career path narrative.
 *
 * Structure:
 *   Section 1 — Intro: alignment pills + title (100vh)
 *   Section 2 — Divergence: SVG lines fan out as you scroll (200vh sticky)
 *   Section 3 — Per-path chapters: one full section per path
 *   Section 4 — Observations & missing context
 */

import {
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import type { CareerPath, CareerPathAnalysis } from "@/types/decisions";
import type { PathResponseAction } from "@/types/memory";
import { recordResponse } from "@/app/actions/paths";
import { RegretModal } from "./RegretModal";

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  aligned:     "var(--text-2)",
  partial:     "var(--text-3)",
  misaligned:  "var(--text-4)",
} as const;

function pathColor(a: CareerPath["alignment"]) {
  return a === "aligned" ? C.aligned : a === "partial" ? C.partial : C.misaligned;
}

// ─── Hook: IntersectionObserver reveal ────────────────────────────────────────

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Section 1: Intro ─────────────────────────────────────────────────────────

function IntroSection({ paths }: { paths: CareerPath[] }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "var(--bg)",
      }}
    >
      {/* Alignment pills */}
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          marginBottom: "3rem",
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.9s ease 0.1s, transform 0.9s ease 0.1s",
        }}
      >
        {paths.map((p, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              opacity: show ? 1 : 0,
              transform: show ? "translateY(0)" : "translateY(8px)",
              transition: `opacity 0.7s ease ${0.3 + i * 0.15}s, transform 0.7s ease ${0.3 + i * 0.15}s`,
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: pathColor(p.alignment),
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "0.62rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: pathColor(p.alignment),
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {p.alignment}
            </span>
          </div>
        ))}
      </div>

      {/* Title */}
      <h1
        style={{
          fontFamily: "'Poppins', system-ui, sans-serif",
          fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
          fontWeight: 300,
          color: "var(--text-1)",
          letterSpacing: "-0.035em",
          margin: "0 0 1rem",
          textAlign: "center",
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 1s ease 0.5s, transform 1s ease 0.5s",
        }}
      >
        {paths.length === 1 ? "one path" : paths.length === 2 ? "two paths" : "three paths"}
      </h1>
      <p
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "0.8rem",
          color: "var(--text-3)",
          margin: "0 0 2rem",
          letterSpacing: "0.04em",
          opacity: show ? 1 : 0,
          transition: "opacity 0.8s ease 0.9s",
          textAlign: "center",
        }}
      >
        based on your identity, credentials, and behavioral signals
      </p>

      <p
        style={{
          fontSize: "0.72rem",
          letterSpacing: "0.08em",
          color: "var(--text-4)",
          marginTop: "2rem",
          opacity: show ? 1 : 0,
          transition: "opacity 1s ease 1.2s",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        scroll to explore
      </p>

      {/* Scroll indicator line */}
      <div
        style={{
          position: "absolute",
          bottom: "2.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          width: "1px",
          height: "40px",
          background: `linear-gradient(to bottom, var(--text-4), transparent)`,
          opacity: show ? 0.6 : 0,
          transition: "opacity 1s ease 1.5s",
        }}
      />
    </section>
  );
}

// ─── Section 2: SVG Divergence ────────────────────────────────────────────────

function DivergenceSection({ paths }: { paths: CareerPath[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [labelsVisible, setLabelsVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / scrollable));
      setProgress(p);
      setLabelsVisible(p > 0.75);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Compute SVG endpoints
  const W = 1000;
  const H = 500;
  const originX = W / 2;
  const originY = H - 20;

  const maxSpread = 340;
  const n = paths.length;

  const endpoints = paths.map((_, i) => {
    if (n === 1) return { x: W / 2, y: 60 };
    const fraction = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2;
    return {
      x: W / 2 + fraction * maxSpread * progress,
      y: 60 + (1 - progress) * 180,
    };
  });

  // Control points for bezier
  const curves = endpoints.map((ep) => {
    const cp1x = originX + (ep.x - originX) * 0.1;
    const cp1y = originY - 80;
    const cp2x = ep.x;
    const cp2y = ep.y + 100;
    return `M ${originX} ${originY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${ep.x} ${ep.y}`;
  });

  return (
    <div
      ref={containerRef}
      style={{ height: "220vh", position: "relative" }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <p
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--text-4)",
            marginBottom: "1.5rem",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          paths diverge
        </p>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{
            width: "min(80vw, 700px)",
            height: "auto",
            overflow: "visible",
          }}
        >
          {curves.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={pathColor(paths[i]!.alignment)}
              strokeWidth={progress < 0.05 ? 0.5 : 1.2}
              strokeOpacity={0.6 + progress * 0.3}
              style={{ transition: "stroke-opacity 0.3s ease" }}
            />
          ))}

          {/* Path name labels at endpoints */}
          {paths.map((p, i) => {
            const ep = endpoints[i]!;
            return (
              <text
                key={i}
                x={ep.x}
                y={ep.y - 14}
                textAnchor="middle"
                fontSize="13"
                fill={pathColor(p.alignment)}
                fontFamily="Inter, system-ui, sans-serif"
                letterSpacing="0.5"
                opacity={labelsVisible ? 0.85 : 0}
                style={{ transition: `opacity 0.8s ease ${i * 0.15}s` }}
              >
                {p.name.length > 38 ? p.name.slice(0, 38) + "…" : p.name}
              </text>
            );
          })}

          {/* Origin dot */}
          <circle
            cx={originX}
            cy={originY}
            r="3"
            fill="var(--text-3)"
            opacity="0.6"
          />
        </svg>
      </div>
    </div>
  );
}

// ─── Section 3: Per-path detail ───────────────────────────────────────────────

// ─── Path response buttons ────────────────────────────────────────────────────

const RESPONSE_OPTIONS: { action: PathResponseAction; label: string }[] = [
  { action: "pursuing", label: "pursuing" },
  { action: "considering", label: "considering" },
  { action: "deferred", label: "defer" },
  { action: "dismissed", label: "not this" },
];

function PathResponseButtons({
  snapshotId,
  pathName,
}: {
  snapshotId: string;
  pathName: string;
}) {
  const [selected, setSelected] = useState<PathResponseAction | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showRegret, setShowRegret] = useState(false);

  function handleSelect(action: PathResponseAction) {
    if (isPending) return;
    // Intercept "pursuing" with regret simulation before committing
    if (action === "pursuing" && selected !== "pursuing") {
      setShowRegret(true);
      return;
    }
    commitAction(action);
  }

  function commitAction(action: PathResponseAction) {
    setSelected(action);
    startTransition(async () => {
      await recordResponse(snapshotId, pathName, action);
    });
  }

  return (
    <>
      <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
        {RESPONSE_OPTIONS.map(({ action, label }) => {
          const isSelected = selected === action;
          return (
            <button
              key={action}
              onClick={() => handleSelect(action)}
              disabled={isPending}
              className={[
                "path-response-btn",
                isSelected ? "path-response-btn--selected" : "",
              ].filter(Boolean).join(" ")}
              style={{
                opacity: isPending && !isSelected ? 0.35 : 1,
                cursor: isPending ? "default" : "pointer",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {showRegret && (
        <RegretModal
          pathName={pathName}
          onConfirm={() => {
            setShowRegret(false);
            commitAction("pursuing");
          }}
          onClose={() => setShowRegret(false)}
        />
      )}
    </>
  );
}

// ─── Time to readiness → runway width ────────────────────────────────────────

function runwayWidth(time: string): number {
  const lower = time.toLowerCase();
  if (lower.includes("month") || lower.includes("< 3") || lower.includes("1–3") || lower.includes("3 mo")) return 22;
  if (lower.includes("6 mo") || lower.includes("6–9") || lower.includes("6 month")) return 38;
  if (lower.includes("1 year") || lower.includes("1–1.5") || lower.includes("12")) return 55;
  if (lower.includes("1.5") || lower.includes("18")) return 68;
  if (lower.includes("2 year") || lower.includes("2–3")) return 82;
  if (lower.includes("3 year") || lower.includes("3+")) return 100;
  return 45; // default mid
}

function PathSection({ path, index: _index, snapshotId }: { path: CareerPath; index: number; snapshotId?: string }) {
  const { ref, visible } = useReveal(0.1);
  const color = pathColor(path.alignment);
  const rw = runwayWidth(path.time_to_readiness ?? "");

  return (
    <section
      ref={ref}
      style={{
        minHeight: "100vh",
        padding: "8rem 5vw 6rem",
        background: "var(--bg)",
        borderTop: `1px solid var(--border)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        maxWidth: "940px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Alignment chip + explicit framing */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.75rem",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s ease",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.3rem 0.85rem",
            border: `1px solid ${color}30`,
            background: `${color}08`,
          }}
        >
          <div
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "0.62rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color,
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {path.alignment}
          </span>
        </div>
        {path.alignment === "aligned" && (
          <span
            style={{
              fontSize: "0.62rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#c9a86c",
              fontFamily: "Inter, system-ui, sans-serif",
              opacity: 0.8,
            }}
          >
            strongest direction
          </span>
        )}
        {path.alignment === "misaligned" && (
          <span
            style={{
              fontSize: "0.62rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#8a4a42",
              fontFamily: "Inter, system-ui, sans-serif",
              opacity: 0.7,
            }}
          >
            worth examining — friction likely
          </span>
        )}
      </div>

      {/* Path name */}
      <h2
        style={{
          fontFamily: "'Poppins', system-ui, sans-serif",
          fontSize: "clamp(1.9rem, 4.5vw, 3rem)",
          fontWeight: 300,
          color: "var(--text-1)",
          lineHeight: 1.25,
          marginBottom: "2.5rem",
          maxWidth: "760px",
          letterSpacing: "-0.025em",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(18px)",
          transition: "opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s",
        }}
      >
        {path.name}
      </h2>

      {/* Pull quote — fit_reasoning */}
      <blockquote
        className="pull-quote"
        style={{
          borderLeft: `2px solid ${color}`,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s",
        }}
      >
        {path.fit_reasoning}
      </blockquote>

      <div style={{ display: "flex", gap: "4rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Left column */}
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          {/* Time to readiness + runway */}
          <div
            style={{
              marginBottom: "2.5rem",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(10px)",
              transition: "opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s",
            }}
          >
            <p style={{ fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "0.5rem", fontFamily: "Inter, system-ui, sans-serif" }}>
              time to readiness
            </p>
            <p style={{ fontSize: "0.95rem", color: "var(--text-3)", lineHeight: 1.5, margin: 0 }}>
              {path.time_to_readiness}
            </p>
            {/* Runway bar */}
            <div className="runway-track" style={{ width: "140px", marginTop: "0.75rem" }}>
              <div
                className="runway-fill"
                style={{ width: `${rw}%` }}
              />
            </div>
          </div>

          {/* Risk */}
          <div
            style={{
              marginBottom: "2.5rem",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(10px)",
              transition: "opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s",
            }}
          >
            <p style={{ fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "0.5rem", fontFamily: "Inter, system-ui, sans-serif" }}>
              risk
            </p>
            <p style={{ fontSize: "0.92rem", color: "var(--text-3)", lineHeight: 1.75, margin: 0, fontStyle: "italic", fontFamily: "Inter, system-ui, sans-serif" }}>
              {path.risk_assessment}
            </p>
          </div>

          {/* What to avoid */}
          {path.what_to_avoid.length > 0 && (
            <div
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 0.7s ease 0.5s, transform 0.7s ease 0.5s",
              }}
            >
              <p style={{ fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "0.6rem", fontFamily: "Inter, system-ui, sans-serif" }}>
                avoid
              </p>
              {path.what_to_avoid.map((item, i) => (
                <p key={i} style={{ fontSize: "0.88rem", color: "var(--text-4)", lineHeight: 1.7, margin: 0, marginBottom: "0.3rem", fontStyle: "italic", fontFamily: "Inter, system-ui, sans-serif" }}>
                  — {item}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Right column — gaps as chips */}
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          {path.gaps.length > 0 && (
            <div
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 0.7s ease 0.35s, transform 0.7s ease 0.35s",
              }}
            >
              <p style={{ fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: "0.9rem", fontFamily: "Inter, system-ui, sans-serif" }}>
                gaps to close
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {path.gaps.map((gap, i) => (
                  <span key={i} className="path-chip">
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Response buttons */}
      {snapshotId && (
        <div
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.7s ease 0.65s",
            marginTop: "3.5rem",
          }}
        >
          <PathResponseButtons snapshotId={snapshotId} pathName={path.name} />
        </div>
      )}
    </section>
  );
}

// ─── Section 4: Observations ──────────────────────────────────────────────────

function ObservationsSection({
  observations,
  missing,
}: {
  observations: string[];
  missing: string[];
}) {
  const { ref, visible } = useReveal(0.1);

  const all = [
    ...observations.map((o) => ({ text: o, type: "observation" as const })),
    ...missing.map((m) => ({ text: m, type: "missing" as const })),
  ];

  if (!all.length) return null;

  return (
    <section
      ref={ref}
      style={{
        minHeight: "60vh",
        padding: "7rem 5vw 8rem",
        background: "var(--bg)",
        borderTop: `1px solid var(--border)`,
        maxWidth: "680px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <p
        style={{
          fontSize: "0.6rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--text-4)",
          marginBottom: "2.5rem",
          fontFamily: "Inter, system-ui, sans-serif",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      >
        what the system noticed
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {all.map((item, i) => (
          <p
            key={i}
            style={{
              fontSize: "0.82rem",
              color: item.type === "observation" ? "var(--text-3)" : "var(--text-4)",
              lineHeight: 1.8,
              margin: 0,
              paddingLeft: "1.2rem",
              borderLeft: `1px solid ${item.type === "observation" ? "var(--border)" : "var(--border)"}`,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(8px)",
              transition: `opacity 0.6s ease ${0.1 + i * 0.08}s, transform 0.6s ease ${0.1 + i * 0.08}s`,
            }}
          >
            {item.text}
          </p>
        ))}
      </div>
    </section>
  );
}

// ─── Section 5: Anti-Recommendations ─────────────────────────────────────────

function AntiRecommendationSection({
  items,
}: {
  items: { path: string; reason: string }[];
}) {
  const { ref, visible } = useReveal(0.1);

  if (!items.length) return null;

  return (
    <section
      ref={ref}
      style={{
        minHeight: "50vh",
        padding: "7rem 5vw 8rem",
        background: "var(--bg)",
        borderTop: `1px solid var(--border)`,
        maxWidth: "680px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2.75rem",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      >
        <div style={{ width: "24px", height: "1px", background: "var(--red-dim)" }} />
        <p
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--red-dim)",
            fontFamily: "Inter, system-ui, sans-serif",
            margin: 0,
          }}
        >
          what the system recommends against
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              paddingLeft: "1.25rem",
              borderLeft: "1px solid var(--red-dim)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(10px)",
              transition: `opacity 0.7s ease ${0.1 + i * 0.12}s, transform 0.7s ease ${0.1 + i * 0.12}s`,
            }}
          >
            <p
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "0.92rem",
                fontStyle: "normal",
                color: "var(--red)",
                lineHeight: 1.5,
                margin: "0 0 0.6rem",
                letterSpacing: "-0.01em",
              }}
            >
              {item.path}
            </p>
            <p
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "0.82rem",
                color: "var(--red-dim)",
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              {item.reason}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── CareerPathViz ────────────────────────────────────────────────────────────

export function CareerPathViz({ paths, analysis, snapshotId }: { paths: CareerPath[]; analysis?: CareerPathAnalysis; snapshotId?: string }) {
  if (!paths.length) return null;

  return (
    <div style={{ background: "var(--bg)" }}>
      <IntroSection paths={paths} />
      <DivergenceSection paths={paths} />
      {paths.map((path, i) => (
        <PathSection key={i} path={path} index={i} snapshotId={snapshotId} />
      ))}
      <ObservationsSection
        observations={analysis?.observations ?? []}
        missing={analysis?.missing_context ?? []}
      />
      {analysis?.anti_recommendations?.length ? (
        <AntiRecommendationSection items={analysis.anti_recommendations} />
      ) : null}
    </div>
  );
}
