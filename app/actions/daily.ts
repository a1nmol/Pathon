"use server";

import { getUser } from "@/lib/auth/session";
import { createClient } from "@/lib/db/server";
import { loadMemory, getLatestSnapshot } from "@/lib/db/memory";
import { generateDailyAction, type DailyActionResult } from "@/lib/ai/daily";
import type { CareerPath } from "@/types/decisions";

export async function getDailyAction(mode?: string): Promise<DailyActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const supabase = await createClient();

  const [identityRes, memory, snapshot] = await Promise.all([
    supabase
      .from("career_identity")
      .select("career_stage, strengths")
      .eq("user_id", user.id)
      .maybeSingle() as unknown as Promise<{ data: { career_stage?: string; strengths?: string[] } | null }>,
    loadMemory(user.id),
    getLatestSnapshot(user.id),
  ]);

  const identity = identityRes.data;
  const activePursuits = memory.active_pursuits;

  if (!activePursuits.length) {
    return { ok: false, error: "No active pursuit — mark a career path as pursuing to get a daily action." };
  }

  const primaryPursuit = activePursuits[0]!;

  // Find the matching path in the snapshot to get gaps
  const analysis = snapshot?.analysis as { paths?: CareerPath[] } | null;
  const matchingPath = analysis?.paths?.find(
    (p) => p.name === primaryPursuit.path_name,
  );
  const gaps = matchingPath?.gaps ?? [];

  return generateDailyAction({
    pathName: primaryPursuit.path_name,
    gaps,
    stage: identity?.career_stage ?? "unknown",
    strengths: identity?.strengths ?? [],
    mode,
  });
}
