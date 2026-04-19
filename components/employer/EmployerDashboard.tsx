"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CompanyProfileClient } from "@/components/employer/CompanyProfileClient";

// ── Types ─────────────────────────────────────────────────────────────────────

interface JobPosting {
  id: string;
  title: string;
  status: "draft" | "active" | "closed";
  location?: string;
  created_at: string;
  candidate_count?: number;
}

interface PipelineStage {
  stage: string;
  count: number;
}

interface CompanyData {
  name: string;
  industry: string;
  size: string;
  website: string;
  tech_stack: string[];
  culture_tags: string[];
}

interface EmployerDashboardProps {
  companyName?: string;
  companyInitial: CompanyData;
  jobPostings: JobPosting[];
  pipelineStages: PipelineStage[];
  totalCandidates: number;
  activeJobs: number;
  newThisWeek: number;
  hiresTotal: number;
}

// ── Animated counter ──────────────────────────────────────────────────────────

function Counter({ to, duration = 1.4 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  useEffect(() => {
    start.current = null;
    function step(ts: number) {
      if (!start.current) start.current = ts;
      const elapsed = (ts - start.current) / (duration * 1000);
      const prog = Math.min(elapsed, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      setVal(Math.round(eased * to));
      if (prog < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [to, duration]);

  return <>{val}</>;
}

// ── 3D tilt card ──────────────────────────────────────────────────────────────

function TiltCard({ children, style = {}, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const spRX = useSpring(rotX, { stiffness: 300, damping: 28 });
  const spRY = useSpring(rotY, { stiffness: 300, damping: 28 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    rotX.set(-ny * 6);
    rotY.set(nx * 6);
  }
  function onLeave() { rotX.set(0); rotY.set(0); }

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ perspective: "800px" }}>
      <motion.div
        style={{ rotateX: spRX, rotateY: spRY, transformStyle: "preserve-3d", ...style }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sublabel,
  accent,
  icon,
  delay = 0,
}: {
  label: string;
  value: number;
  sublabel?: string;
  accent: string;
  icon: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <TiltCard
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "28px 24px",
          position: "relative",
          overflow: "hidden",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Accent glow top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: `${accent}15`,
              border: `1px solid ${accent}25`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accent,
            }}
          >
            {icon}
          </div>
        </div>

        <div
          style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontSize: "36px",
            fontWeight: 700,
            color: "var(--text-1)",
            letterSpacing: "-0.04em",
            lineHeight: 1,
            marginBottom: "6px",
          }}
        >
          <Counter to={value} />
        </div>

        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-3)", marginBottom: sublabel ? "4px" : 0 }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: accent, opacity: 0.7 }}>
            {sublabel}
          </div>
        )}
      </TiltCard>
    </motion.div>
  );
}

// ── Pipeline bar ──────────────────────────────────────────────────────────────

const STAGE_META: Record<string, { label: string; color: string }> = {
  applied:       { label: "Applied",      color: "#7c85f5" },
  reviewed:      { label: "Reviewed",     color: "#a78bfa" },
  phone_screen:  { label: "Phone Screen", color: "#c9a86c" },
  interview:     { label: "Interview",    color: "#5a8a6a" },
  decision:      { label: "Decision",     color: "#f59e0b" },
  hired:         { label: "Hired",        color: "#22c55e" },
  passed:        { label: "Passed",       color: "#64748b" },
};

function PipelineBar({ stages, total }: { stages: PipelineStage[]; total: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {stages.map((s, i) => {
        const meta = STAGE_META[s.stage] ?? { label: s.stage, color: "#7c85f5" };
        const pct = total > 0 ? (s.count / total) * 100 : 0;
        return (
          <motion.div
            key={s.stage}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-2)" }}>
                {meta.label}
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: meta.color }}>
                {s.count}
              </span>
            </div>
            <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <motion.div
                style={{ height: "100%", borderRadius: "2px", background: meta.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.4 + i * 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Job row ───────────────────────────────────────────────────────────────────

function JobRow({ job, index }: { job: JobPosting; index: number }) {
  const statusColor = job.status === "active" ? "var(--green)" : job.status === "draft" ? "var(--text-4)" : "var(--text-3)";
  const statusBg = job.status === "active" ? "var(--green-dim)" : job.status === "draft" ? "var(--surface-2)" : "rgba(255,255,255,0.04)";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Link href={`/employer/jobs/${job.id}` as any} style={{ textDecoration: "none" }}>
        <motion.div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "14px 16px",
            borderRadius: "12px",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            cursor: "pointer",
          }}
          whileHover={{
            background: "rgba(124,133,245,0.05)",
            borderColor: "rgba(124,133,245,0.18)",
            x: 4,
            transition: { duration: 0.15 },
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--text-1)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {job.title}
            </div>
            {job.location && (
              <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-4)", marginTop: "2px" }}>
                {job.location}
              </div>
            )}
          </div>

          {job.candidate_count !== undefined && (
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--indigo)", flexShrink: 0 }}>
              {job.candidate_count} candidates
            </div>
          )}

          <div
            style={{
              padding: "3px 10px",
              borderRadius: "6px",
              background: statusBg,
              color: statusColor,
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            {job.status}
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ── Quick action button ───────────────────────────────────────────────────────

function QuickAction({ href, label, icon, accent }: { href: string; label: string; icon: React.ReactNode; accent: string }) {
  return (
    <Link href={href as Parameters<typeof Link>[0]["href"]} style={{ textDecoration: "none" }}>
      <motion.div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 16px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          cursor: "pointer",
          color: "var(--text-2)",
        }}
        whileHover={{
          background: `${accent}0a`,
          borderColor: `${accent}30`,
          color: accent,
        }}
        transition={{ duration: 0.2 }}
      >
        <div style={{ color: "inherit", flexShrink: 0 }}>{icon}</div>
        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", fontWeight: 500, color: "inherit" }}>
          {label}
        </span>
        <svg style={{ marginLeft: "auto", opacity: 0.4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </motion.div>
    </Link>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export function EmployerDashboard({
  companyName,
  companyInitial,
  jobPostings,
  pipelineStages,
  totalCandidates,
  activeJobs,
  newThisWeek,
  hiresTotal,
}: EmployerDashboardProps) {
  const [companyPanelOpen, setCompanyPanelOpen] = useState(false);
  const displayName = companyName ?? "Your Company";

  return (
    <div
      className="dash-outer"
      style={{
        minHeight: "100vh",
        padding: "calc(var(--nav-h, 60px) + 3rem) 4rem 6rem",
        position: "relative",
      }}
    >
      {/* Fixed ambient background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: `
            radial-gradient(ellipse 60% 40% at 75% 20%, rgba(124,133,245,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 20% 80%, rgba(90,138,106,0.04) 0%, transparent 70%)
          `,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          style={{ marginBottom: "56px" }}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--indigo)", letterSpacing: "0.1em", marginBottom: "6px", textTransform: "uppercase" }}>
                Hiring Mode
              </div>
              <button
                onClick={() => setCompanyPanelOpen(true)}
                style={{
                  background: "none", border: "none", padding: 0, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "8px",
                }}
              >
                <h1
                  style={{
                    fontFamily: "'Poppins', system-ui, sans-serif",
                    fontSize: "clamp(22px, 3vw, 30px)",
                    fontWeight: 700,
                    color: "var(--text-1)",
                    margin: 0,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {displayName}
                </h1>
                <svg
                  width="16" height="16" viewBox="0 0 20 20" fill="none"
                  stroke="var(--indigo)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ opacity: 0.6, flexShrink: 0, marginTop: "4px" }}
                >
                  <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  <path d="M14.5 2.5a2.121 2.121 0 013 3L10 13l-4 1 1-4 7.5-7.5z" />
                </svg>
              </button>
              {!companyName && (
                <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--indigo)", margin: "4px 0 0", opacity: 0.7 }}>
                  Click to set up your company →
                </p>
              )}
            </div>

            {/* Post job CTA */}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/employer/jobs/new" style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, var(--indigo) 0%, #5a63d4 100%)",
                    color: "#fff",
                    fontFamily: "'Poppins', system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: "14px",
                    boxShadow: "0 4px 20px rgba(124,133,245,0.3)",
                    cursor: "pointer",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Post a Job
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "36px",
          }}
        >
          <StatCard
            label="Total Candidates"
            value={totalCandidates}
            accent="var(--indigo)"
            delay={0.1}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="7" r="4" /><path d="M2 21c0-4 2.686-7 6-7M15 11a4 4 0 100-8M22 21c0-4-2.686-7-6-7" />
              </svg>
            }
          />
          <StatCard
            label="Active Jobs"
            value={activeJobs}
            accent="var(--green)"
            delay={0.18}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="15" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
              </svg>
            }
          />
          <StatCard
            label="New This Week"
            value={newThisWeek}
            sublabel="candidates"
            accent="var(--copper)"
            delay={0.26}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
              </svg>
            }
          />
          <StatCard
            label="Total Hires"
            value={hiresTotal}
            accent="var(--green)"
            delay={0.34}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
          />
        </div>

        {/* Main grid */}
        <div
          className="employer-main-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 360px",
            gap: "28px",
          }}
        >
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px", minWidth: 0 }}>

            {/* Job postings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                padding: "28px 32px",
                backdropFilter: "blur(20px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <h2 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "16px", fontWeight: 600, color: "var(--text-1)", margin: 0, letterSpacing: "-0.02em" }}>
                  Job Postings
                </h2>
                <Link href="/employer/jobs" style={{ textDecoration: "none" }}>
                  <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--indigo)" }}>
                    View all →
                  </span>
                </Link>
              </div>

              {jobPostings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "14px", color: "var(--text-4)", marginBottom: "16px" }}>
                    No job postings yet
                  </div>
                  <Link href="/employer/jobs/new" style={{ textDecoration: "none" }}>
                    <motion.div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "10px 18px",
                        borderRadius: "10px",
                        border: "1px solid rgba(124,133,245,0.3)",
                        color: "var(--indigo)",
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                      whileHover={{ background: "rgba(124,133,245,0.06)" }}
                    >
                      Post your first job
                    </motion.div>
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {jobPostings.slice(0, 6).map((job, i) => (
                    <JobRow key={job.id} job={job} index={i} />
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick action bento grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "16px", fontWeight: 600, color: "var(--text-1)", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
                Quick Actions
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {[
                  { href: "/employer/jobs/new",  label: "Post a Job",       sub: "Create new listing",         accent: "var(--indigo)", icon: "M12 5v14M5 12h14" },
                  { href: "/employer/pipeline",  label: "Pipeline",         sub: "Move candidates",            accent: "var(--copper)", icon: "M2 4h4v16H2zM10 7h4v13H10zM18 2h4v20H18z" },
                  { href: "/employer/talent",    label: "Talent Pool",      sub: "All contacts & scores",      accent: "#5a8a6a",       icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
                  { href: "/employer/analytics", label: "Analytics",        sub: "Pipeline performance",       accent: "#a78bfa",       icon: "M18 20V10M12 20V4M6 20v-6M2 20h20" },
                ].map(({ href, label, sub, accent, icon }) => (
                  <Link key={href} href={href as Parameters<typeof Link>[0]["href"]} style={{ textDecoration: "none" }}>
                    <TiltCard
                      style={{
                        padding: "18px", borderRadius: "16px",
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        cursor: "pointer", display: "block",
                        transition: "border-color 0.2s ease, background 0.2s ease",
                      }}
                    >
                      <motion.div whileHover={{ borderColor: `${accent}35` }}>
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "10px",
                          background: `${accent}12`, border: `1px solid ${accent}20`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: accent, marginBottom: "12px",
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d={icon} />
                          </svg>
                        </div>
                        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--text-1)", marginBottom: "3px" }}>{label}</div>
                        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-4)" }}>{sub}</div>
                      </motion.div>
                    </TiltCard>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Pipeline overview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                padding: "28px",
                backdropFilter: "blur(20px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <h2 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "16px", fontWeight: 600, color: "var(--text-1)", margin: 0, letterSpacing: "-0.02em" }}>
                  Pipeline
                </h2>
                <Link href="/employer/pipeline" style={{ textDecoration: "none" }}>
                  <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--indigo)" }}>
                    Open →
                  </span>
                </Link>
              </div>

              {pipelineStages.length === 0 || totalCandidates === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-4)" }}>
                    No candidates yet
                  </div>
                </div>
              ) : (
                <PipelineBar stages={pipelineStages} total={totalCandidates} />
              )}
            </motion.div>

            {/* AI tip card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <TiltCard
                style={{
                  background: "linear-gradient(145deg, rgba(124,133,245,0.08) 0%, rgba(13,14,18,0.95) 100%)",
                  border: "1px solid rgba(124,133,245,0.2)",
                  borderRadius: "20px",
                  padding: "24px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "1px",
                    background: "linear-gradient(90deg, transparent, rgba(124,133,245,0.6), transparent)",
                  }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "8px",
                      background: "rgba(124,133,245,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--indigo)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    AI Insight
                  </span>
                </div>

                <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                  {activeJobs === 0
                    ? "Post your first job to start attracting candidates. The AI screener will rank them against your requirements automatically."
                    : totalCandidates === 0
                    ? "Your jobs are live. Share them across LinkedIn and job boards — the AI screener is ready to rank incoming candidates."
                    : `You have ${totalCandidates} candidate${totalCandidates !== 1 ? "s" : ""} across ${activeJobs} active job${activeJobs !== 1 ? "s" : ""}. Review the pipeline to move promising candidates forward.`
                  }
                </p>
              </TiltCard>
            </motion.div>

            {/* Next action prompts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                padding: "22px",
                backdropFilter: "blur(20px)",
              }}
            >
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "var(--text-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>
                Your next steps
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  activeJobs === 0 && {
                    href: "/employer/jobs/new",
                    label: "Post your first job",
                    desc: "AI will draft the JD for you",
                    color: "var(--indigo)",
                    urgent: true,
                  },
                  activeJobs > 0 && totalCandidates === 0 && {
                    href: `/employer/jobs`,
                    label: "Screen your first resumes",
                    desc: "AI ranks candidates in seconds",
                    color: "var(--copper)",
                    urgent: true,
                  },
                  totalCandidates > 0 && hiresTotal === 0 && {
                    href: "/employer/pipeline",
                    label: "Move top candidates forward",
                    desc: `${totalCandidates} candidate${totalCandidates !== 1 ? "s" : ""} waiting in pipeline`,
                    color: "var(--green)",
                    urgent: false,
                  },
                  {
                    href: "/employer/company",
                    label: "Complete your company profile",
                    desc: "Improves AI job description quality",
                    color: "#a78bfa",
                    urgent: false,
                  },
                  {
                    href: "/employer/analytics",
                    label: "Check pipeline analytics",
                    desc: "Spot bottlenecks and drop-off",
                    color: "var(--copper)",
                    urgent: false,
                  },
                ].filter(Boolean).slice(0, 3).map((action: any, i) => (
                  <Link key={action.href} href={action.href as Parameters<typeof Link>[0]["href"]} style={{ textDecoration: "none" }}>
                    <motion.div
                      whileHover={{ background: `${action.color}08`, borderColor: `${action.color}25`, x: 3 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "10px 12px", borderRadius: "10px",
                        border: action.urgent ? `1px solid ${action.color}20` : "1px solid rgba(255,255,255,0.05)",
                        background: action.urgent ? `${action.color}06` : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: action.color, flexShrink: 0,
                        boxShadow: action.urgent ? `0 0 6px ${action.color}` : "none",
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", fontWeight: 600, color: "var(--text-1)" }}>
                          {action.label}
                        </div>
                        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-4)" }}>
                          {action.desc}
                        </div>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={action.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Company profile panel ──────────────────────────────────── */}
      <AnimatePresence>
        {companyPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setCompanyPanelOpen(false)}
              style={{
                position: "fixed", inset: 0, zIndex: 400,
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
              }}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "fixed", top: 0, right: 0, bottom: 0,
                width: "min(520px, 90vw)",
                zIndex: 401,
                background: "var(--surface)",
                borderLeft: "1px solid var(--border)",
                overflowY: "auto",
                boxShadow: "-20px 0 80px rgba(0,0,0,0.4)",
              }}
            >
              {/* Drawer header */}
              <div style={{
                position: "sticky", top: 0, zIndex: 1,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "1.25rem 1.75rem",
                background: "var(--surface)",
                borderBottom: "1px solid var(--border)",
                backdropFilter: "blur(20px)",
              }}>
                <div>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--indigo)", margin: "0 0 4px" }}>
                    Company Profile
                  </p>
                  <p style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "16px", fontWeight: 600, color: "var(--text-1)", margin: 0, letterSpacing: "-0.02em" }}>
                    {displayName}
                  </p>
                </div>
                <button
                  onClick={() => setCompanyPanelOpen(false)}
                  style={{
                    background: "var(--surface-2)", border: "1px solid var(--border)",
                    borderRadius: "8px", padding: "6px 10px", cursor: "pointer",
                    color: "var(--text-3)", fontFamily: "'DM Mono', monospace", fontSize: "11px",
                    display: "flex", alignItems: "center", gap: "5px",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M15 5L5 15M5 5l10 10" />
                  </svg>
                  Close
                </button>
              </div>

              {/* Embed company form — strip its page chrome */}
              <div style={{ padding: "0.5rem 0" }}>
                <CompanyProfileClient initial={companyInitial} embedded />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
