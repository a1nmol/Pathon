"use server";

import { getUser } from "@/lib/auth/session";
import { buildCareerContext } from "@/lib/ai/context";
import { loadMemory } from "@/lib/db/memory";
import { generateDebate } from "@/lib/ai/debate";
import type { DebateResult } from "@/lib/ai/debate";

export async function runDebate(dilemma: string): Promise<DebateResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const [context, memory] = await Promise.all([
    buildCareerContext(user.id),
    loadMemory(user.id),
  ]);

  return generateDebate(context, dilemma, memory.patterns);
}
