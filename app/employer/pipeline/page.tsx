import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { PipelineKanban } from "@/components/employer/PipelineKanban";

export default async function PipelinePage() {
  const user = await getUser();
  if (!user) redirect("/");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const { data: candidates } = await supabase
    .from("pipeline_candidates")
    .select(`
      id,
      name,
      email,
      stage,
      ai_score,
      ai_summary,
      notes,
      created_at,
      job_id,
      job_postings (title)
    `)
    .eq("employer_id", user.id)
    .order("created_at", { ascending: false });

  type RawCandidate = {
    id: string;
    name: string;
    email?: string | null;
    stage: string;
    ai_score?: number | null;
    ai_summary?: string | null;
    notes?: string | null;
    created_at: string;
    job_id: string;
    job_postings?: { title?: string } | null;
  };

  const normalized = ((candidates ?? []) as RawCandidate[]).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email ?? undefined,
    stage: c.stage,
    ai_score: c.ai_score ?? undefined,
    ai_summary: c.ai_summary ?? undefined,
    notes: c.notes ?? undefined,
    created_at: c.created_at,
    job_id: c.job_id,
    job_title: c.job_postings?.title ?? undefined,
  }));

  return <PipelineKanban candidates={normalized} />;
}
