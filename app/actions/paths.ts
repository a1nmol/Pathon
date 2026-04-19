"use server";

import { getUser } from "@/lib/auth/session";
import { recordPathResponse } from "@/lib/db/memory";
import type { PathResponseAction } from "@/types/memory";

export async function recordResponse(
  snapshotId: string,
  pathName: string,
  action: PathResponseAction,
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };
  return recordPathResponse(user.id, snapshotId, pathName, action);
}
