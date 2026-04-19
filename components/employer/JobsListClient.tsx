"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  status: string;
  location?: string | null;
  remote_ok: boolean;
  employment_type: string;
  salary_min?: number | null;
  salary_max?: number | null;
  created_at: string;
  candidate_count: number;
}

const STATUS_META: Record<string, { color: string; bg: string }> = {
  active: { color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
  draft:  { color: "var(--text-4)", bg: "rgba(255,255,255,0.04)" },
  closed: { color: "#64748b", bg: "rgba(100,116,139,0.08)" },
};

export function JobsListClient({ jobs }: { jobs: Job[] }) {
  const [filter, setFilter] = useState<"all" | "active" | "draft" | "closed">("all");

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  function formatSalary(min?: number | null, max?: number | null) {
    if (!min && !max) return null;
    const fmt = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max!)}`;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "calc(var(--nav-h, 60px) + 2rem) 3rem 5rem",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(ellipse 50% 30% at 70% 20%, rgba(124,133,245,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          style={{ marginBottom: "32px" }}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--indigo)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>
                Employer · Jobs
              </div>
              <h1 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: "var(--text-1)", margin: 0, letterSpacing: "-0.03em" }}>
                {jobs.length} Job{jobs.length !== 1 ? "s" : ""}
              </h1>
            </div>

            <Link href="/employer/jobs/new" style={{ textDecoration: "none" }}>
              <motion.div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, var(--indigo) 0%, #5a63d4 100%)",
                  color: "#fff",
                  fontFamily: "'Poppins', system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(124,133,245,0.25)",
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Post Job
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {(["all", "active", "draft", "closed"] as const).map((f) => {
            const count = f === "all" ? jobs.length : jobs.filter((j) => j.status === f).length;
            const active = filter === f;
            return (
              <motion.button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: `1px solid ${active ? "var(--indigo)" : "rgba(255,255,255,0.07)"}`,
                  background: active ? "rgba(124,133,245,0.1)" : "transparent",
                  color: active ? "var(--indigo)" : "var(--text-3)",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
                whileTap={{ scale: 0.95 }}
              >
                {f} ({count})
              </motion.button>
            );
          })}
        </motion.div>

        {/* Jobs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((job, i) => {
              const meta = STATUS_META[job.status] ?? STATUS_META.draft;
              const salary = formatSalary(job.salary_min, job.salary_max);

              return (
                <motion.div
                  key={job.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Link href={`/employer/jobs/${job.id}` as any} style={{ textDecoration: "none" }}>
                    <motion.div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "20px 24px",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        backdropFilter: "blur(12px)",
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      whileHover={{
                        background: "rgba(124,133,245,0.04)",
                        borderColor: "rgba(124,133,245,0.15)",
                      }}
                    >
                      {/* Status bar left edge */}
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "20%",
                          bottom: "20%",
                          width: "3px",
                          borderRadius: "0 3px 3px 0",
                          background: meta.color,
                          opacity: 0.6,
                        }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "15px", fontWeight: 600, color: "var(--text-1)", marginBottom: "4px", letterSpacing: "-0.01em" }}>
                          {job.title}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                          {(job.location || job.remote_ok) && (
                            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-4)" }}>
                              {job.location ?? ""}{job.remote_ok ? (job.location ? " · Remote OK" : "Remote") : ""}
                            </span>
                          )}
                          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-4)", textTransform: "capitalize" }}>
                            {job.employment_type}
                          </span>
                          {salary && (
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--copper)" }}>
                              {salary}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                        {job.candidate_count > 0 && (
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--indigo)" }}>
                              {job.candidate_count}
                            </div>
                            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "10px", color: "var(--text-4)" }}>
                              candidates
                            </div>
                          </div>
                        )}
                        <div style={{ padding: "4px 12px", borderRadius: "6px", background: meta.bg, color: meta.color, fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          {job.status}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: "center", padding: "60px 0" }}
            >
              <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "14px", color: "var(--text-4)", marginBottom: "20px" }}>
                {jobs.length === 0 ? "No jobs yet" : `No ${filter} jobs`}
              </div>
              {jobs.length === 0 && (
                <Link href="/employer/jobs/new" style={{ textDecoration: "none" }}>
                  <motion.div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 20px",
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
                    Post your first job →
                  </motion.div>
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
