"use server";

import { getUser } from "@/lib/auth/session";
import { buildCareerContext } from "@/lib/ai/context";
import { analyzeRoleFit } from "@/lib/ai/interview";
import type { RoleFitResult } from "@/lib/ai/interview";

export async function getRoleFit(
  jobDescription: string,
): Promise<RoleFitResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  const context = await buildCareerContext(user.id);
  return analyzeRoleFit(context, jobDescription);
}
