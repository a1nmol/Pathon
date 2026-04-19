import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { EmployerDashboard } from "@/components/employer/EmployerDashboard";

export default async function EmployerDashboardPage() {
  const user = await getUser();
  if (!user) redirect("/");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  // Fetch company profile
  const { data: company } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Fetch job postings
  const { data: jobs } = await supabase
    .from("job_postings")
    .select("id, title, status, location, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch pipeline candidates grouped by stage
  const { data: candidates } = await supabase
    .from("pipeline_candidates")
    .select("stage, created_at")
    .eq("employer_id", user.id);

  // Compute pipeline stats
  const stageCounts: Record<string, number> = {};
  let newThisWeek = 0;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  for (const c of (candidates ?? []) as { stage: string; created_at: string }[]) {
    stageCounts[c.stage] = (stageCounts[c.stage] ?? 0) + 1;
    if (c.created_at > weekAgo) newThisWeek++;
  }

  const STAGE_ORDER = ["applied", "reviewed", "phone_screen", "interview", "decision", "hired", "passed"];
  const pipelineStages = STAGE_ORDER
    .filter((s) => stageCounts[s])
    .map((s) => ({ stage: s, count: stageCounts[s] }));

  const totalCandidates = (candidates ?? []).length;

  type JobRow = { id: string; title: string; status: string; location?: string | null; created_at: string };
  const activeJobs = ((jobs ?? []) as JobRow[]).filter((j) => j.status === "active").length;
  const hiresTotal = stageCounts["hired"] ?? 0;

  type CompanyRow = { name?: string; industry?: string; size?: string; website?: string; tech_stack?: string[]; culture_tags?: string[] };
  const c = company as CompanyRow | null;

  return (
    <EmployerDashboard
      companyName={c?.name}
      companyInitial={{
        name: c?.name ?? "",
        industry: c?.industry ?? "",
        size: c?.size ?? "",
        website: c?.website ?? "",
        tech_stack: c?.tech_stack ?? [],
        culture_tags: c?.culture_tags ?? [],
      }}
      jobPostings={((jobs ?? []) as JobRow[]).map((j) => ({
        id: j.id,
        title: j.title,
        status: j.status as "draft" | "active" | "closed",
        location: j.location ?? undefined,
        created_at: j.created_at,
      }))}
      pipelineStages={pipelineStages}
      totalCandidates={totalCandidates}
      activeJobs={activeJobs}
      newThisWeek={newThisWeek}
      hiresTotal={hiresTotal}
    />
  );
}
