"use client";

/**
 * NBACard — Next Best Action card
 *
 * A single, dominant floating object. The entire experience collapses into this.
 * One action. One button. No competing CTAs.
 *
 * Visual layers (bottom → top):
 *   1. Completion ring (conic-gradient border, fills on complete)
 *   2. Card body (slate surface, copper rim top, specular overlay)
 *   3. Stage progress micro-indicator
 *   4. Context text (delayed entry)
 *   5. Action title (last to resolve, with warm pulse)
 *   6. Time · impact meta
 *   7. Start button + Why affordance
 *   8. Why panel (AnimatePresence, slides right)
 *   9. Focus overlay (full-page dim, behind card)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import type { NBAAction } from "@/lib/nba/actions";

// ── Phase machine ──────────────────────────────────────────────────────────────

type Phase =
  | "entering"   // blur → form → text sequence
  | "idle"       // waiting, 3D tilt active
  | "why"        // why panel visible
  | "starting"   // overlay dims, brief pause, navigates
  | "completing" // ring fills, card lifts
  | "done"       // payoff text shown
  | "cooldown";  // 30-90s pause before next

// ── Props ─────────────────────────────────────────────────────────────────────

interface NBACardProps {
  action: NBAAction;
  /** True when the dashboard detects this action's condition was just met */
  justCompleted?: boolean;
  onCooldownEnd?: () => void;
}

// ── Category label map ────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  identity:    "Career Identity",
  credentials: "Credentials",
  paths:       "Career Paths",
  proof:       "Reflection",
  skills:      "Skill Map",
  mentor:      "Mentor",
  interview:   "Interview Prep",
  reflection:  "Weekly Check-in",
  offer:       "Offer Evaluation",
};

// ── Cooldown screen ───────────────────────────────────────────────────────────

function NBACooldown({ payoff, onEnd }: { payoff: string; onEnd: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(interval); onEnd(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onEnd]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
        padding: "3rem 2rem",
        textAlign: "center",
      }}
    >
      {/* Success mark */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4, type: "spring", stiffness: 200 }}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "1.5px solid rgba(90,138,106,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(90,138,106,0.06)",
        }}
      >
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
          <path d="M1 5.5L5 9.5L13 1.5" stroke="#5a8a6a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>

      {/* Payoff text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "0.88rem",
          fontWeight: 500,
          color: "var(--text-2)",
          maxWidth: "320px",
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        {payoff}
      </motion.p>

      {/* Quiet meta */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-4)",
          margin: 0,
        }}
      >
        Next action in {secondsLeft}s
      </motion.p>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function NBACard({ action, justCompleted = false, onCooldownEnd }: NBACardProps) {
  const router = useRouter();
  const prefersReduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const specRef = useRef<HTMLDivElement>(null);

  // Phases
  const [phase, setPhase] = useState<Phase>(justCompleted ? "completing" : "entering");
  const [showWhy, setShowWhy] = useState(false);

  // 3D tilt
  const tiltRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);

  // Entry sequence: blur → form (700ms) → context (400ms, delay 700) → action (500ms, delay 1100) → pulse (delay 1600)
  const [phaseStep, setPhaseStep] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    if (justCompleted) {
      // Skip entry, go straight to completing
      triggerCompletion();
      return;
    }
    const t1 = setTimeout(() => setPhaseStep(1), 80);   // card forms
    const t2 = setTimeout(() => setPhaseStep(2), 760);  // context fades in
    const t3 = setTimeout(() => setPhaseStep(3), 1150); // action resolves
    const t4 = setTimeout(() => setPhase("idle"),  2300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 3D mouse tracking ────────────────────────────────────────────────────────

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);   // -1 → 1
    const dy = (e.clientY - cy) / (rect.height / 2);

    tiltRef.current = { x: dy * -5, y: dx * 5 };

    // Update card transform directly — bypasses React re-render loop for 60fps
    if (cardRef.current) {
      cardRef.current.style.transform =
        `perspective(1000px) rotateX(${tiltRef.current.x}deg) rotateY(${tiltRef.current.y}deg) translateZ(8px)`;
    }

    // Specular highlight follows cursor
    if (specRef.current) {
      const sx = ((e.clientX - rect.left) / rect.width) * 100;
      const sy = ((e.clientY - rect.top) / rect.height) * 100;
      specRef.current.style.background =
        `radial-gradient(circle at ${sx}% ${sy}%, rgba(255,255,255,0.055) 0%, transparent 58%)`;
    }
  }, [prefersReduced]);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    // Spring back smoothly
    cardRef.current.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(8px)";
    if (specRef.current) {
      specRef.current.style.background =
        "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.015) 0%, transparent 58%)";
    }
  }, []);

  // ── Start action ──────────────────────────────────────────────────────────────

  function handleStart() {
    setPhase("starting");
    // Brief pause so the overlay registers, then navigate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setTimeout(() => router.push(action.href as any), 420);
  }

  // ── Completion flow ───────────────────────────────────────────────────────────

  function triggerCompletion() {
    setPhase("completing");
    // Fill the ring
    if (ringRef.current) {
      ringRef.current.style.setProperty("--nba-ring-progress", "1");
      ringRef.current.style.opacity = "1";
    }
    // Card lifts + fades after ring fills
    setTimeout(() => {
      setPhase("done");
    }, 1200);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => { cancelAnimationFrame(animFrameRef.current); };
  }, []);

  // ── Render states ─────────────────────────────────────────────────────────────

  if (phase === "cooldown") {
    return <NBACooldown payoff={action.payoff} onEnd={() => onCooldownEnd?.()} />;
  }

  if (phase === "done") {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        style={{ display: "flex", justifyContent: "center" }}
      >
        <NBACooldown
          payoff={action.payoff}
          onEnd={() => { setPhase("cooldown"); onCooldownEnd?.(); }}
        />
      </motion.div>
    );
  }

  const isEntering = phase === "entering";
  const isStarting = phase === "starting";

  // ── Card entry variants ───────────────────────────────────────────────────────

  const cardVariants: Variants = {
    hidden: prefersReduced
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.94, filter: "blur(18px)", y: 16 },
    visible: prefersReduced
      ? { opacity: 1, transition: { duration: 0.3 } }
      : {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          y: 0,
          transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
        },
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
      }}
    >
      {/* ── Focus overlay — dims the dashboard behind the card ── */}
      <AnimatePresence>
        {isStarting && (
          <motion.div
            key="focus-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 200,
              pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>

      {/* ── 3D perspective wrapper ── */}
      <div
        style={{ perspective: "1000px", width: "100%", maxWidth: "400px" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* ── Completion ring (conic border, fills on complete) ── */}
        <div
          ref={ringRef}
          className="nba-ring"
          style={{
            position: "absolute",
            inset: "-18px",
            borderRadius: "30px",
            border: "1.5px solid transparent",
            backgroundImage: `
              linear-gradient(var(--bg), var(--bg)),
              conic-gradient(
                from -90deg,
                rgba(201,168,108,0.75) calc(var(--nba-ring-progress, 0) * 360deg),
                rgba(201,168,108,0.07) calc(var(--nba-ring-progress, 0) * 360deg)
              )
            `,
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
            pointerEvents: "none",
            opacity: 0,
            transition: "opacity 0.5s ease",
            zIndex: 0,
          }}
        />

        {/* ── Card body ── */}
        <motion.div
          ref={cardRef}
          variants={cardVariants}
          initial="hidden"
          animate={phaseStep >= 1 ? "visible" : "hidden"}
          style={{
            position: "relative",
            background: "var(--surface)",
            borderRadius: "16px",
            padding: "2.25rem 2.5rem 2.5rem",
            minHeight: "300px",
            transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(8px)",
            transition: "transform 0.18s ease-out",
            boxShadow: `
              0 0 0 1px rgba(201,168,108,0.09),
              0 1px 0 0 rgba(201,168,108,0.15) inset,
              0 28px 72px rgba(0,0,0,0.65),
              0 0 100px rgba(201,168,108,0.025)
            `,
            overflow: "hidden",
            willChange: "transform",
            zIndex: isStarting ? 210 : 1,
          }}
        >
          {/* Specular highlight — moves with cursor via JS */}
          <div
            ref={specRef}
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.015) 0%, transparent 58%)",
              borderRadius: "16px",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />

          {/* Copper rim light — top edge only */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "15%",
              right: "15%",
              height: "1px",
              background:
                "linear-gradient(to right, transparent, rgba(201,168,108,0.28), transparent)",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />

          {/* Content — above the overlay layers */}
          <div style={{ position: "relative", zIndex: 3 }}>

            {/* ── Stage progress micro-indicator ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginBottom: "2rem",
              }}
            >
              {["identity", "credentials", "paths", "mentor", "proof"].map((stage) => {
                const isActive = action.category === stage;
                const isDone = false; // would come from context
                return (
                  <div
                    key={stage}
                    style={{
                      height: "2px",
                      width: isActive ? "24px" : "8px",
                      borderRadius: "1px",
                      background: isActive
                        ? "rgba(201,168,108,0.6)"
                        : isDone
                        ? "rgba(90,138,106,0.35)"
                        : "var(--border-2)",
                      transition: "all 0.3s ease",
                    }}
                  />
                );
              })}
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "9px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--text-4)",
                  marginLeft: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                {CATEGORY_LABEL[action.category] ?? action.category}
              </span>
            </div>

            {/* ── Context sentence ── */}
            <motion.p
              initial={{ opacity: prefersReduced ? 1 : 0, y: prefersReduced ? 0 : 5 }}
              animate={phaseStep >= 2 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.42, ease: "easeOut" }}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "10px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--text-3)",
                margin: "0 0 1.25rem",
                lineHeight: 1.6,
              }}
            >
              Right now, the best move is&nbsp;—
            </motion.p>

            {/* ── Action title ── */}
            <motion.p
              initial={{ opacity: prefersReduced ? 1 : 0 }}
              animate={phaseStep >= 3 ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "clamp(1.15rem, 2.4vw, 1.4rem)",
                fontWeight: 600,
                lineHeight: 1.3,
                letterSpacing: "-0.024em",
                color: "var(--text-1)",
                margin: "0 0 2rem",
                animation:
                  phaseStep >= 3 && !prefersReduced
                    ? "nbaActionReveal 0.85s ease-out forwards"
                    : undefined,
              }}
            >
              {action.title}
            </motion.p>

            {/* ── Time · impact meta ── */}
            <motion.div
              initial={{ opacity: prefersReduced ? 1 : 0 }}
              animate={phaseStep >= 3 ? { opacity: 1 } : {}}
              transition={{ duration: 0.35, delay: 0.12 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "2.25rem",
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "10px",
                  letterSpacing: "0.06em",
                  color: "var(--text-4)",
                }}
              >
                {action.timeEstimate}
              </span>
              <span style={{ color: "var(--border-2)", fontSize: "10px", fontFamily: "monospace" }}>
                ·
              </span>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "10px",
                  letterSpacing: "0.06em",
                  color: "var(--text-4)",
                }}
              >
                {action.impactHint}
              </span>
            </motion.div>

            {/* ── CTA row ── */}
            <motion.div
              initial={{ opacity: prefersReduced ? 1 : 0 }}
              animate={phaseStep >= 3 ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.18 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              {/* Primary action — the ONLY button that matters */}
              <button
                onClick={handleStart}
                disabled={isEntering || isStarting}
                style={{
                  background: isStarting
                    ? "rgba(201,168,108,0.7)"
                    : "#c9a86c",
                  border: "none",
                  color: "#1a1410",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  padding: "0.72rem 1.75rem",
                  borderRadius: "8px",
                  cursor: isEntering || isStarting ? "default" : "pointer",
                  transition: "all 0.18s ease",
                  opacity: isEntering ? 0.5 : 1,
                  boxShadow: "0 2px 8px rgba(201,168,108,0.15)",
                }}
                onMouseEnter={(e) => {
                  if (isEntering || isStarting) return;
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = "#d4b87a";
                  el.style.transform = "translateY(-1px)";
                  el.style.boxShadow = "0 6px 20px rgba(201,168,108,0.28)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = "#c9a86c";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "0 2px 8px rgba(201,168,108,0.15)";
                }}
              >
                {isStarting ? "Opening…" : "Start →"}
              </button>

              {/* Why affordance — deliberately quiet */}
              <button
                onClick={() => setShowWhy((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  color: showWhy ? "var(--text-3)" : "var(--text-4)",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "9px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  transition: "color 0.15s ease",
                  padding: "0.5rem 0.25rem",
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#5c6478";
                }}
                onMouseLeave={(e) => {
                  if (!showWhy) {
                    (e.currentTarget as HTMLButtonElement).style.color = "#363d52";
                  }
                }}
                aria-label="Why this action?"
              >
                why ?
              </button>
            </motion.div>

            {/* ── Context sentence for card body (shown in card) ── */}
            <AnimatePresence>
              {showWhy && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    style={{
                      marginTop: "1.75rem",
                      paddingTop: "1.5rem",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "9px",
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "var(--text-4)",
                        margin: "0 0 1rem",
                      }}
                    >
                      Why this?
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                      {action.reasoning.map((r, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07, duration: 0.25 }}
                          style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem" }}
                        >
                          <span
                            style={{
                              fontSize: "11px",
                              flexShrink: 0,
                              marginTop: "1px",
                              opacity: 0.6,
                              lineHeight: 1.5,
                            }}
                          >
                            {r.icon}
                          </span>
                          <span
                            style={{
                              fontFamily: "'Inter', system-ui, sans-serif",
                              fontSize: "12px",
                              color: "var(--text-2)",
                              lineHeight: 1.55,
                            }}
                          >
                            {r.text}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>{/* /content */}
        </motion.div>{/* /card body */}

        {/* ── Completing overlay — success glow ── */}
        <AnimatePresence>
          {phase === "completing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "16px",
                background:
                  "radial-gradient(ellipse at center, rgba(90,138,106,0.08) 0%, transparent 70%)",
                pointerEvents: "none",
                zIndex: 5,
              }}
            />
          )}
        </AnimatePresence>

      </div>{/* /perspective wrapper */}
    </div>
  );
}
