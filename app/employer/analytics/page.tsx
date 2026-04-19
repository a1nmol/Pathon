import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { AnalyticsClient } from "@/components/employer/AnalyticsClient";

export default async function AnalyticsPage() {
  const user = await getUser();
  if (!user) redirect("/");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const [{ data: candidates }, { data: jobs }] = await Promise.all([
    supabase
      .from("pipeline_candidates")
      .select("id, stage, ai_score, created_at, job_id")
      .eq("employer_id", user.id),
    supabase
      .from("job_postings")
      .select("id, title, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  type RawCandidate = { id: string; stage: string; ai_score?: number | null; created_at: string; job_id: string };
  type RawJob = { id: string; title: string; status: string; created_at: string };

  const allCandidates = (candidates ?? []) as RawCandidate[];
  const allJobs = (jobs ?? []) as RawJob[];

  // Pipeline funnel
  const STAGES = ["applied", "reviewed", "phone_screen", "interview", "decision", "hired"];
  const stageCounts = STAGES.map((stage) => ({
    stage,
    count: allCandidates.filter((c) => c.stage === stage).length,
  }));

  // Score distribution buckets
  const scoredCandidates = allCandidates.filter((c) => c.ai_score != null);
  const scoreBuckets = [
    { label: "0–49",  count: scoredCandidates.filter((c) => (c.ai_score ?? 0) < 50).length  },
    { label: "50–64", count: scoredCandidates.filter((c) => (c.ai_score ?? 0) >= 50 && (c.ai_score ?? 0) < 65).length },
    { label: "65–79", count: scoredCandidates.filter((c) => (c.ai_score ?? 0) >= 65 && (c.ai_score ?? 0) < 80).length },
    { label: "80–89", count: scoredCandidates.filter((c) => (c.ai_score ?? 0) >= 80 && (c.ai_score ?? 0) < 90).length },
    { label: "90+",   count: scoredCandidates.filter((c) => (c.ai_score ?? 0) >= 90).length  },
  ];

  // Per-job stats
  const jobStats = allJobs.map((j) => {
    const jc = allCandidates.filter((c) => c.job_id === j.id);
    const scored = jc.filter((c) => c.ai_score != null);
    const avgScore = scored.length > 0
      ? Math.round(scored.reduce((s, c) => s + (c.ai_score ?? 0), 0) / scored.length)
      : null;
    return {
      id: j.id,
      title: j.title,
      status: j.status,
      totalCandidates: jc.length,
      screenedCount: scored.length,
      avgScore,
      hired: jc.filter((c) => c.stage === "hired").length,
    };
  });

  // Weekly inflow (last 8 weeks)
  const weeklyInflow: { week: string; count: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString();
    const end = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekLabel = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    weeklyInflow.push({
      week: weekLabel,
      count: allCandidates.filter((c) => c.created_at >= start && c.created_at < end).length,
    });
  }

  const passedCount = allCandidates.filter((c) => c.stage === "passed").length;
  const hiresTotal = allCandidates.filter((c) => c.stage === "hired").length;
  const conversionRate = allCandidates.length > 0 ? Math.round((hiresTotal / allCandidates.length) * 100) : 0;

  return (
    <AnalyticsClient
      stageCounts={stageCounts}
      scoreBuckets={scoreBuckets}
      jobStats={jobStats}
      weeklyInflow={weeklyInflow}
      totalCandidates={allCandidates.length}
      screenedCount={scoredCandidates.length}
      hiresTotal={hiresTotal}
      passedCount={passedCount}
      conversionRate={conversionRate}
      avgScoreOverall={
        scoredCandidates.length > 0
          ? Math.round(scoredCandidates.reduce((s, c) => s + (c.ai_score ?? 0), 0) / scoredCandidates.length)
          : null
      }
    />
  );
}
