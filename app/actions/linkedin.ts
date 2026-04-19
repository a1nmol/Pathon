"use server";

import { getUser } from "@/lib/auth/session";
import { saveLinkedInData } from "@/lib/db/linkedin";
import type { ParsedLinkedInData } from "@/types/linkedin";

export async function importLinkedInData(
  data: ParsedLinkedInData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  return saveLinkedInData(user.id, data);
}
