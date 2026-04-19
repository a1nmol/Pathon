"use server";

import { getUser } from "@/lib/auth/session";
import { buildCareerContext } from "@/lib/ai/context";
import { processCheckIn } from "@/lib/ai/checkin";
import type { CheckInAnswers, CheckInResult } from "@/lib/ai/checkin";

export async function submitCheckIn(
  answers: CheckInAnswers,
): Promise<CheckInResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  const context = await buildCareerContext(user.id);
  return processCheckIn(context, answers);
}
