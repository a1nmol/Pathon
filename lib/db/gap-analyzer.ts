import { createClient } from "@/lib/db/server";
import type { FullGapAnalysisSession } from "@/types/gap-analyzer";

// Re-export for backward compat
export type { FullGapAnalysisSession as GapAnalysisSession };

export async function getLatestGapSession(
  userId: string,
): Promise<FullGapAnalysisSession | null> {
  const supabase = await createClient();

  const { data } = await (supabase as any)
    .from("gap_analysis_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as FullGapAnalysisSession) ?? null;
}

export async function getPastGapSessions(
  userId: string,
  limit = 5,
): Promise<FullGapAnalysisSession[]> {
  const supabase = await createClient();

  const { data } = await (supabase as any)
    .from("gap_analysis_sessions")
    .select("id, target_role, target_company, readiness_score, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as FullGapAnalysisSession[]) ?? [];
}
