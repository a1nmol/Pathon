"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface StageCount { stage: string; count: number }
interface ScoreBucket { label: string; count: number }
interface JobStat {
  id: string; title: string; status: string;
  totalCandidates: number; screenedCount: number;
  avgScore: number | null; hired: number;
}
interface WeeklyEntry { week: string; count: number }

interface Props {
  stageCounts: StageCount[];
  scoreBuckets: ScoreBucket[];
  jobStats: JobStat[];
  weeklyInflow: WeeklyEntry[];
  totalCandidates: number;
  screenedCount: number;
  hiresTotal: number;
  passedCount: number;
  conversionRate: number;
  avgScoreOverall: number | null;
}

const STAGE_LABELS: Record<string, string> = {
  applied: "Applied", reviewed: "Reviewed", phone_screen: "Phone Screen",
  interview: "Interview", decision: "Decision", hired: "Hired",
};

const STAGE_COLORS: Record<string, string> = {
  applied: "var(--text-3)", reviewed: "var(--indigo)",
  phone_screen: "var(--copper)", interview: "#a78bfa",
  decision: "#f59e0b", hired: "#22c55e",
};

function Bar({ value, max, color, label, count }: { value: number; max: number; color: string; label: string; count: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ width: "90px", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-3)", textAlign: "right", flexShrink: 0 }}>
        {label}
      </div>
      <div style={{ flex: 1, height: "10px", borderRadius: "5px", background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", borderRadius: "5px", background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <div style={{ width: "28px", fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "var(--text-2)", flexShrink: 0 }}>
        {count}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "20px 24px", borderRadius: "16px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", gap: "4px",
      }}
    >
      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "var(--text-4)" }}>{label}</div>
      <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "28px", fontWeight: 700, color, letterSpacing: "-0.03em" }}>{value}</div>
      {sub && <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "11px", color: "var(--text-4)" }}>{sub}</div>}
    </motion.div>
  );
}

export function AnalyticsClient({
  stageCounts, scoreBuckets, jobStats, weeklyInflow,
  totalCandidates, screenedCount, hiresTotal, passedCount, conversionRate, avgScoreOverall,
}: Props) {
  const maxStage = Math.max(...stageCounts.map((s) => s.count), 1);
  const maxScore = Math.max(...scoreBuckets.map((b) => b.count), 1);
  const maxWeek  = Math.max(...weeklyInflow.map((w) => w.count), 1);

  return (
    <div style={{ minHeight: "100vh", padding: "calc(var(--nav-h, 56px) + 2rem) 3rem 6rem", position: "relative" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 50% 35% at 80% 5%, rgba(124,133,245,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1040px", margin: "0 auto" }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--indigo)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Hiring Intelligence</div>
          </div>
          <h1 style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, color: "var(--text-1)", margin: 0, letterSpacing: "-0.03em" }}>
            Analytics
          </h1>
          <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "14px", color: "var(--text-4)", marginTop: "6px" }}>
            Pipeline performance, score distributions, and hiring funnel across all jobs.
          </p>
        </motion.div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", marginBottom: "32px" }}>
          <StatCard label="Total Candidates" value={totalCandidates} color="var(--indigo)" />
          <StatCard label="AI Screened" value={screenedCount} color="var(--copper)" sub={totalCandidates > 0 ? `${Math.round(screenedCount / totalCandidates * 100)}% of all` : undefined} />
          <StatCard label="Avg AI Score" value={avgScoreOverall !== null ? avgScoreOverall : "—"} color={avgScoreOverall && avgScoreOverall >= 70 ? "var(--green)" : "var(--text-2)"} />
          <StatCard label="Hires" value={hiresTotal} color="#22c55e" />
          <StatCard label="Passed" value={passedCount} color="var(--text-4)" />
          <StatCard label="Conversion" value={`${conversionRate}%`} color={conversionRate >= 10 ? "var(--green)" : "var(--copper)"} sub="applied → hired" />
        </div>

        {/* Charts grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

          {/* Pipeline funnel */}
          <motion.div
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            style={{ padding: "24px", borderRadius: "18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--indigo)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "20px" }}>Pipeline Funnel</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {stageCounts.map(({ stage, count }) => (
                <Bar
                  key={stage}
                  label={STAGE_LABELS[stage] ?? stage}
                  value={count}
                  max={maxStage}
                  color={STAGE_COLORS[stage] ?? "var(--text-3)"}
                  count={count}
                />
              ))}
            </div>
          </motion.div>

          {/* Score distribution */}
          <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            style={{ padding: "24px", borderRadius: "18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--copper)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "20px" }}>AI Score Distribution</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {scoreBuckets.map(({ label, count }) => {
                const color = label === "90+" ? "#22c55e" : label === "80–89" ? "var(--green)" : label === "65–79" ? "var(--copper)" : label === "50–64" ? "var(--indigo)" : "#64748b";
                return <Bar key={label} label={label} value={count} max={maxScore} color={color} count={count} />;
              })}
            </div>
            {screenedCount === 0 && (
              <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", color: "var(--text-4)", textAlign: "center", marginTop: "24px" }}>
                No AI-screened candidates yet.
              </div>
            )}
          </motion.div>
        </div>

        {/* Weekly inflow chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ padding: "24px", borderRadius: "18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "16px" }}
        >
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--green)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "20px" }}>Weekly Candidate Inflow</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "80px" }}>
            {weeklyInflow.map(({ week, count }) => {
              const h = maxWeek > 0 ? Math.max((count / maxWeek) * 100, count > 0 ? 8 : 0) : 0;
              return (
                <div key={week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "100%", display: "flex", alignItems: "flex-end", height: "60px" }}>
                    <motion.div
                      style={{ width: "100%", borderRadius: "4px 4px 0 0", background: "var(--indigo)", opacity: count === 0 ? 0.2 : 1 }}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "var(--text-4)", textAlign: "center" }}>{week}</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Per-job table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ padding: "24px", borderRadius: "18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--text-4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "20px" }}>Performance by Job</div>

          {jobStats.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "14px", color: "var(--text-4)" }}>
              No jobs posted yet.{" "}
              <Link href="/employer/jobs/new" style={{ color: "var(--indigo)" }}>Post your first job</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px", gap: "12px", padding: "8px 12px", borderRadius: "8px" }}>
                {["Job Title", "Candidates", "Screened", "Avg Score", "Hired"].map((h) => (
                  <div key={h} style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--text-4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</div>
                ))}
              </div>
              {jobStats.map((j, i) => (
                <motion.div
                  key={j.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px", gap: "12px", padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}
                >
                  <div>
                    <Link
                      href={`/employer/jobs/${j.id}` as Parameters<typeof Link>[0]["href"]}
                      style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--text-1)", textDecoration: "none" }}
                    >
                      {j.title}
                    </Link>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: j.status === "active" ? "#22c55e" : "var(--text-4)", marginTop: "2px", textTransform: "uppercase" }}>
                      {j.status}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "16px", fontWeight: 700, color: "var(--indigo)" }}>{j.totalCandidates}</div>
                  <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "16px", fontWeight: 700, color: "var(--copper)" }}>{j.screenedCount}</div>
                  <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "16px", fontWeight: 700, color: j.avgScore !== null && j.avgScore >= 70 ? "var(--green)" : "var(--text-3)" }}>
                    {j.avgScore !== null ? j.avgScore : "—"}
                  </div>
                  <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontSize: "16px", fontWeight: 700, color: j.hired > 0 ? "#22c55e" : "var(--text-4)" }}>{j.hired}</div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
