/**
 * Daily Execution Generator
 *
 * Generates one concrete micro-action the user can take today
 * toward their active career pursuit. Designed to be lean — it
 * does NOT require a full CareerContext. Just the active path name,
 * key gaps, and a few identity signals.
 *
 * Entry point: generateDailyAction(params)
 */

import Anthropic from "@anthropic-ai/sdk";
import { applyConstraints } from "./constraints";

const client = new Anthropic();

export type DailyActionParams = {
  pathName: string;        // The active pursuit path
  gaps: string[];          // Key gaps identified for this path
  stage: string;           // Career stage
  strengths: string[];     // User's strengths
  mode?: string;           // Current career mode
};

export type DailyActionResult =
  | { ok: true; action: string; context: string }
  | { ok: false; error: string };

const SYSTEM_PROMPT = applyConstraints(`\
You are a daily execution advisor. You output one concrete action a person can take TODAY toward a specific career goal.

Rules:
1. The action must be completable in under 2 hours.
2. It must be specific — not "research the space" but "find 3 job postings for [role] and write down the skills you lack in each."
3. It must be calibrated to the gap — if the person's gap is "no public writing," the action should relate to writing. If the gap is "no network in X industry," the action should be a networking step.
4. Do not suggest applying to jobs as the primary action unless that is the stated gap.
5. Output two things only: a single action sentence (under 30 words), and a one-sentence context explaining why this specific action matters for this path.
6. No encouragement. No "great opportunity to." Just the action and the reason.

Output format — respond with valid JSON:
{
  "action": "string — the specific action, under 30 words",
  "context": "string — one sentence explaining why this action for this path"
}`);

export async function generateDailyAction(
  params: DailyActionParams,
): Promise<DailyActionResult> {
  const { pathName, gaps, stage, strengths, mode } = params;

  const primaryGap = gaps[0] ?? "unclear — no specific gaps identified";
  const topStrengths = strengths.slice(0, 3).join(", ") || "not specified";

  const modeNote = mode ? `\nCurrent mode: ${mode} — calibrate the action's intensity and framing to this mode.` : "";

  const userMessage = `Career stage: ${stage}
Active pursuit: "${pathName}"
Primary gap to close: ${primaryGap}
Other gaps: ${gaps.slice(1, 3).join(", ") || "none listed"}
Strengths to leverage: ${topStrengths}${modeNote}

Generate the daily action.`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 256,
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

    const raw = JSON.parse(jsonStr) as { action?: unknown; context?: unknown };
    const action = String(raw.action ?? "").trim();
    const context = String(raw.context ?? "").trim();

    if (!action) return { ok: false, error: "Parsed empty action." };

    return { ok: true, action, context };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error.",
    };
  }
}
