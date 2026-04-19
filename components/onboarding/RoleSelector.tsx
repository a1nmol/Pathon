"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { setUserType } from "@/app/actions/onboarding";

// ── 3D tilt card hook ─────────────────────────────────────────────────────────

function useTilt(strength = 12) {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const spRX = useSpring(rotX, { stiffness: 260, damping: 24 });
  const spRY = useSpring(rotY, { stiffness: 260, damping: 24 });

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    rotX.set(-ny * strength);
    rotY.set(nx * strength);
  }, [rotX, rotY, strength]);

  const onMouseLeave = useCallback(() => {
    rotX.set(0);
    rotY.set(0);
  }, [rotX, rotY]);

  return { ref, spRX, spRY, onMouseMove, onMouseLeave };
}

// ── Particle field background ─────────────────────────────────────────────────

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  dur: Math.random() * 8 + 6,
  delay: Math.random() * -8,
  opacity: Math.random() * 0.3 + 0.05,
}));

// ── Role card ─────────────────────────────────────────────────────────────────

type Role = "applicant" | "employer";

interface RoleCardProps {
  role: Role;
  title: string;
  subtitle: string;
  features: string[];
  accentColor: string;
  accentDim: string;
  glowColor: string;
  icon: React.ReactNode;
  selected: boolean;
  loading: boolean;
  onSelect: () => void;
}

function RoleCard({
  title,
  subtitle,
  features,
  accentColor,
  accentDim,
  glowColor,
  icon,
  selected,
  loading,
  onSelect,
}: RoleCardProps) {
  const { ref, spRX, spRY, onMouseMove, onMouseLeave } = useTilt(10);
  const [hovered, setHovered] = useState(false);

  const glowOpacity = useTransform(spRX, [-10, 0, 10], [0.6, 0.15, 0.6]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={() => { onMouseLeave(); setHovered(false); }}
      onMouseEnter={() => setHovered(true)}
      onClick={onSelect}
      style={{
        perspective: "1000px",
        cursor: loading ? "not-allowed" : "pointer",
        flex: 1,
        maxWidth: "380px",
        opacity: loading && !selected ? 0.5 : 1,
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        style={{
          rotateX: spRX,
          rotateY: spRY,
          transformStyle: "preserve-3d",
          borderRadius: "24px",
          position: "relative",
          padding: "36px 32px",
          background: selected
            ? `linear-gradient(145deg, ${accentDim} 0%, rgba(13,14,18,0.95) 100%)`
            : hovered
            ? "rgba(255,255,255,0.04)"
            : "rgba(255,255,255,0.02)",
          border: `1px solid ${selected ? accentColor : hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
          boxShadow: selected
            ? `0 0 0 1px ${accentColor}40, 0 24px 80px rgba(0,0,0,0.5), 0 0 60px ${glowColor}`
            : hovered
            ? `0 16px 60px rgba(0,0,0,0.4), 0 0 20px ${glowColor}`
            : "0 8px 40px rgba(0,0,0,0.25)",
          transition: "background 0.3s ease, border-color 0.3s ease",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Ambient glow overlay */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "24px",
            background: `radial-gradient(ellipse at 50% 0%, ${glowColor} 0%, transparent 70%)`,
            opacity: glowOpacity,
            pointerEvents: "none",
          }}
        />

        {/* Corner brackets */}
        {[
          { top: "12px", left: "12px", borderTop: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}` },
          { top: "12px", right: "12px", borderTop: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}` },
          { bottom: "12px", left: "12px", borderBottom: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}` },
          { bottom: "12px", right: "12px", borderBottom: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}` },
        ].map((s, i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              width: "16px",
              height: "16px",
              borderRadius: "2px",
              opacity: selected || hovered ? 0.8 : 0.2,
              transition: "opacity 0.3s ease",
              ...s,
            }}
          />
        ))}

        {/* Icon badge */}
        <motion.div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "18px",
            background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}0a 100%)`,
            border: `1px solid ${accentColor}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
            position: "relative",
            transformStyle: "preserve-3d",
            transform: "translateZ(20px)",
          }}
          animate={{ rotateY: selected ? [0, 360] : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {icon}
          {selected && (
            <motion.div
              style={{
                position: "absolute",
                inset: "-4px",
                borderRadius: "20px",
                border: `1px solid ${accentColor}50`,
              }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* Text — lifted in 3D */}
        <div style={{ position: "relative", transformStyle: "preserve-3d", transform: "translateZ(10px)" }}>
          <h2
            style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontSize: "26px",
              fontWeight: 700,
              color: selected ? accentColor : "var(--text-1)",
              margin: "0 0 8px",
              letterSpacing: "-0.03em",
              transition: "color 0.3s ease",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "14px",
              color: "var(--text-3)",
              margin: "0 0 24px",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: accentColor,
                    flexShrink: 0,
                    opacity: 0.7,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: "13px",
                    color: "var(--text-2)",
                  }}
                >
                  {f}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA button */}
        <motion.button
          onClick={onSelect}
          disabled={loading}
          style={{
            marginTop: "32px",
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: `1px solid ${selected ? accentColor : accentColor + "40"}`,
            background: selected
              ? `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}0a 100%)`
              : "transparent",
            color: selected ? accentColor : "var(--text-2)",
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            letterSpacing: "-0.01em",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.25s ease",
            position: "relative",
            overflow: "hidden",
            transformStyle: "preserve-3d",
            transform: "translateZ(15px)",
          }}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
        >
          {loading && selected ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <motion.div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  border: `2px solid ${accentColor}40`,
                  borderTopColor: accentColor,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              Setting up...
            </span>
          ) : (
            `Continue as ${title}`
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

function OrDivider() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        padding: "0 8px",
        flexShrink: 0,
      }}
    >
      <div style={{ width: "1px", height: "60px", background: "var(--border)" }} />
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "11px",
          color: "var(--text-4)",
          letterSpacing: "0.1em",
        }}
      >
        OR
      </span>
      <div style={{ width: "1px", height: "60px", background: "var(--border)" }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RoleSelector() {
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  async function handleSelect(role: Role) {
    if (loading) return;
    setSelected(role);
    setLoading(true);
    try {
      await setUserType(role);
    } catch (e) {
      // Next.js redirect() throws a special error with a digest — re-throw it so
      // the framework can handle the navigation. Only reset state for real errors.
      if (e && typeof e === "object" && "digest" in e) throw e;
      setLoading(false);
      setSelected(null);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient particles — client-only to avoid SSR/hydration mismatch from Math.random() */}
      {mounted && <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: "50%",
              background: p.id % 2 === 0 ? "var(--copper)" : "var(--indigo)",
              opacity: p.opacity,
            }}
            animate={{ y: [-20, 20, -20], opacity: [p.opacity, p.opacity * 2, p.opacity] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
          />
        ))}
      </div>}

      {/* Ambient gradient blobs */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          left: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,108,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-20%",
          right: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,133,245,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "900px" }}>
        {/* Header */}
        <motion.div
          style={{ textAlign: "center", marginBottom: "56px" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo mark */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, var(--copper) 0%, var(--copper-dark) 100%)",
              marginBottom: "24px",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontWeight: 700,
                fontFamily: "'DM Mono', monospace",
                color: "#1a1410",
              }}
            >
              P
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: 700,
              color: "var(--text-1)",
              margin: "0 0 12px",
              letterSpacing: "-0.04em",
            }}
          >
            How are you using Pathon?
          </h1>
          <p
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "16px",
              color: "var(--text-3)",
              maxWidth: "480px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Choose your role. You can always switch later from settings.
          </p>
        </motion.div>

        {/* Cards row */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "stretch",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <RoleCard
            role="applicant"
            title="Job Seeker"
            subtitle="AI-powered career intelligence that understands you over time."
            accentColor="var(--copper)"
            accentDim="rgba(201,168,108,0.06)"
            glowColor="rgba(201,168,108,0.12)"
            selected={selected === "applicant"}
            loading={loading}
            onSelect={() => handleSelect("applicant")}
            features={[
              "Identity & thinking style mapping",
              "AI career path generation",
              "Shadow mentor & mock interviews",
              "Skills gap analyzer",
              "Application tracker",
            ]}
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--copper)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
              </svg>
            }
          />

          <OrDivider />

          <RoleCard
            role="employer"
            title="Hiring"
            subtitle="Mission control for talent — post jobs, score candidates, build your pipeline."
            accentColor="var(--indigo)"
            accentDim="rgba(124,133,245,0.06)"
            glowColor="rgba(124,133,245,0.12)"
            selected={selected === "employer"}
            loading={loading}
            onSelect={() => handleSelect("employer")}
            features={[
              "AI-assisted job description builder",
              "Candidate pipeline & Kanban",
              "AI resume screening & scoring",
              "Interview workflow automation",
              "Company profile & branding",
            ]}
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="15" rx="2" />
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <line x1="10" y1="14" x2="14" y2="14" />
              </svg>
            }
          />
        </div>

        {/* Footer note */}
        <motion.p
          style={{
            textAlign: "center",
            marginTop: "48px",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "12px",
            color: "var(--text-4)",
            letterSpacing: "0.02em",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Your choice shapes your experience. Both sides share the same account.
        </motion.p>
      </div>
    </div>
  );
}
