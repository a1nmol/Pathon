import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { JobDetailClient } from "@/components/employer/JobDetailClient";
import { notFound } from "next/navigation";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: job, error } = await supabase
    .from("job_postings")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !job) notFound();

  // Fetch candidates for this job
  const { data: candidates } = await supabase
    .from("pipeline_candidates")
    .select("id, name, email, stage, ai_score, ai_summary, created_at, resume_text")
    .eq("job_id", id)
    .eq("employer_id", user.id)
    .order("ai_score", { ascending: false, nullsFirst: false });

  type CandidateRow = {
    id: string; name: string; email?: string | null; stage: string;
    ai_score?: number | null; ai_summary?: string | null;
    created_at: string; resume_text?: string | null;
  };

  type JobRow = {
    id: string; title: string; description: string; requirements: string[];
    nice_to_haves: string[]; salary_min?: number | null; salary_max?: number | null;
    location?: string | null; remote_ok: boolean; employment_type: string;
    status: string; created_at: string;
  };

  return (
    <JobDetailClient
      job={job as JobRow}
      candidates={((candidates ?? []) as CandidateRow[]).map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email ?? undefined,
        stage: c.stage,
        ai_score: c.ai_score ?? undefined,
        ai_summary: c.ai_summary ?? undefined,
        created_at: c.created_at,
        has_resume: !!c.resume_text,
      }))}
    />
  );
}
