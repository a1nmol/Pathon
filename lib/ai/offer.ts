/**
 * Offer Evaluator
 *
 * Analyzes a job offer against the user's career paths, values, and profile.
 * Does not just check role fit — it evaluates whether this offer moves the
 * user toward or away from what they actually want.
 *
 * Entry point: evaluateOffer(context, memory, offerText)
 */

import Anthropic from "@anthropic-ai/sdk";
import { serializeContext } from "./decisions";
import { applyConstraints } from "./constraints";
import type { CareerContext } from "@/types/context";
import type { CareerStateMemory } from "@/types/memory";

const client = new Anthropic();

export type OfferEvalResult =
  | {
      ok: true;
      verdict: "take" | "negotiate" | "decline" | "unclear";
      verdict_reason: string;
      what_fits: string[];
      what_conflicts: string[];
      negotiation_points: string[];
      red_flags: string[];
      path_alignment: string;
    }
  | { ok: false; error: string };

const SYSTEM_PROMPT = applyConstraints(`\
You are a career decision advisor. You have been given detailed information about one specific person and a job offer they are considering. Your job is to evaluate whether this offer is right for THIS person, not for a hypothetical candidate.

Rules:
1. Ground every point in the user's specific data — their values, career paths, gaps, and behavioral history.
2. Do not evaluate the company in the abstract. Evaluate fit between this person and this offer.
3. Verdict options: "take" (clear yes, well aligned), "negotiate" (interested but terms or role need work), "decline" (misaligned or wrong timing), "unclear" (insufficient offer information to decide).
4. If the offer would move the person AWAY from their active pursuit, name that directly.
5. negotiation_points must be specific — what specifically to ask for and why it matters for this person's trajectory.
6. red_flags must be grounded in the offer text and the person's data — not generic interview red flags.
7. Do not soften hard verdicts.

Output format — valid JSON only:
{
  "verdict": "take" | "negotiate" | "decline" | "unclear",
  "verdict_reason": "string — one paragraph explaining the verdict",
  "what_fits": ["string", ...],
  "what_conflicts": ["string", ...],
  "negotiation_points": ["string", ...],
  "red_flags": ["string", ...],
  "path_alignment": "string — one sentence on how this offer relates to their active or top-aligned path"
}`);

export async function evaluateOffer(
  ctx: CareerContext,
  mem: CareerStateMemory,
  offerText: string,
): Promise<OfferEvalResult> {
  if (!offerText.trim()) {
    return { ok: false, error: "No offer text provided." };
  }
  if (!ctx.identity && !ctx.background) {
    return { ok: false, error: "Insufficient profile data." };
  }

  const contextBlock = serializeContext(ctx);

  const pursuits = mem.active_pursuits.map((p) => p.path_name).join(", ") || "none recorded";

  const userMessage = `Here is everything known about this person:

${contextBlock}

---

Currently pursuing: ${pursuits}

---

Job offer to evaluate:

${offerText}

---

Evaluate this offer for this person.`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1536,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const block = message.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      return { ok: false, error: "No content returned." };
    }

    let jsonStr = block.text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1]!.trim();
    else {
      const s = jsonStr.indexOf("{");
      const e = jsonStr.lastIndexOf("}");
      if (s !== -1 && e > s) jsonStr = jsonStr.slice(s, e + 1);
    }

    const raw = JSON.parse(jsonStr) as {
      verdict?: unknown;
      verdict_reason?: unknown;
      what_fits?: unknown;
      what_conflicts?: unknown;
      negotiation_points?: unknown;
      red_flags?: unknown;
      path_alignment?: unknown;
    };

    const validVerdicts = ["take", "negotiate", "decline", "unclear"] as const;
    const verdict = validVerdicts.includes(raw.verdict as never)
      ? (raw.verdict as typeof validVerdicts[number])
      : "unclear";

    return {
      ok: true,
      verdict,
      verdict_reason: String(raw.verdict_reason ?? ""),
      what_fits: Array.isArray(raw.what_fits) ? raw.what_fits.map(String) : [],
      what_conflicts: Array.isArray(raw.what_conflicts) ? raw.what_conflicts.map(String) : [],
      negotiation_points: Array.isArray(raw.negotiation_points) ? raw.negotiation_points.map(String) : [],
      red_flags: Array.isArray(raw.red_flags) ? raw.red_flags.map(String) : [],
      path_alignment: String(raw.path_alignment ?? ""),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error.",
    };
  }
}
