"use server";

import { getUser } from "@/lib/auth/session";
import { buildCareerContext } from "@/lib/ai/context";
import { simulateRegret, type RegretSimResult } from "@/lib/ai/regret";

export async function runRegretSimulation(pathName: string): Promise<RegretSimResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const context = await buildCareerContext(user.id);
  return simulateRegret(context, pathName);
}
