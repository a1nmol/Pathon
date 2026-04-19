"use server";

import { getUser } from "@/lib/auth/session";
import { buildCareerContext } from "@/lib/ai/context";
import { loadMemory } from "@/lib/db/memory";
import { evaluateOffer, type OfferEvalResult } from "@/lib/ai/offer";

export async function evaluateJobOffer(offerText: string): Promise<OfferEvalResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  if (!offerText?.trim()) {
    return { ok: false, error: "No offer text provided." };
  }

  const [context, memory] = await Promise.all([
    buildCareerContext(user.id),
    loadMemory(user.id),
  ]);

  return evaluateOffer(context, memory, offerText);
}
