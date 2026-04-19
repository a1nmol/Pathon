"use server";

import { getUser } from "@/lib/auth/session";
import { buildCareerContext } from "@/lib/ai/context";
import { loadMemory } from "@/lib/db/memory";
import { generateCareerStory, type CareerStoryResult } from "@/lib/ai/story";

export async function getCareerStory(): Promise<CareerStoryResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const [context, memory] = await Promise.all([
    buildCareerContext(user.id),
    loadMemory(user.id),
  ]);

  return generateCareerStory(context, memory);
}
