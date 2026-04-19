import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { JobsListClient } from "@/components/employer/JobsListClient";

export default async function JobsPage() {
  const user = await getUser();
  if (!user) redirect("/");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: jobs } = await supabase
    .from("job_postings")
    .select("id, title, status, location, remote_ok, employment_type, salary_min, salary_max, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: counts } = await supabase
    .from("pipeline_candidates")
    .select("job_id")
    .eq("employer_id", user.id);

  const countMap: Record<string, number> = {};
  for (const row of (counts ?? []) as { job_id: string }[]) {
    countMap[row.job_id] = (countMap[row.job_id] ?? 0) + 1;
  }

  type JobRow = {
    id: string;
    title: string;
    status: string;
    location?: string | null;
    remote_ok: boolean;
    employment_type: string;
    salary_min?: number | null;
    salary_max?: number | null;
    created_at: string;
  };

  const enriched = ((jobs ?? []) as JobRow[]).map((j) => ({
    ...j,
    candidate_count: countMap[j.id] ?? 0,
  }));

  return <JobsListClient jobs={enriched} />;
}
