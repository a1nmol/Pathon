/**
 * Regret Simulation
 *
 * Before committing to a path, shows the user a brief first-person
 * simulation of themselves 18 months into that decision.
 *
 * Not a prediction. A calibration tool. Forces the user to sit with
 * the real texture of the decision before clicking "pursuing."
 *
 * Entry point: simulateRegret(context, pathName)
 */

import Anthropic from "@anthropic-ai/sdk";
import { serializeContext } from "./decisions";
import { applyConstraints } from "./constraints";
import type { CareerContext } from "@/types/context";

const client = new Anthropic();

export type RegretSimResult =
  | { ok: true; simulation: string; honest_question: string }
  | { ok: false; error: string };

const SYSTEM_PROMPT = applyConstraints(`\
You are running a regret simulation. The user is about to commit to a career path. You will write a short first-person account of what their life looks like 18 months after making that commitment — based on everything you know about them.

This is not a success story. It is not a horror story. It is a realistic account.

Rules:
1. Write in first person: "It's been eighteen months since I committed to..."
2. Include one thing that went well and one thing that was harder than expected.
3. Ground both in the user's specific data — their gaps, their tendencies, their values.
4. Do not include overall happiness or regret scores. Just describe what happened.
5. End with one question the simulated-future-self would ask the current self. Not rhetorical — a real, specific question they might want answered before deciding.
6. Length: 180–240 words. Two paragraphs + one question.
7. Tone: thoughtful, honest, neither promotional nor cautionary.

Output format — valid JSON only:
{
  "simulation": "string — the 18-month account, two paragraphs",
  "honest_question": "string — the one question, as a direct question"
}`);

export async function simulateRegret(
  ctx: CareerContext,
  pathName: string,
): Promise<RegretSimResult> {
  if (!ctx.identity && !ctx.background) {
    return { ok: false, error: "Insufficient profile data." };
  }

  const contextBlock = serializeContext(ctx);

  const userMessage = `Profile:

${contextBlock}

---

Path being committed to: "${pathName}"

Simulate 18 months after committing to this path.`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 512,
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

    const raw = JSON.parse(jsonStr) as { simulation?: unknown; honest_question?: unknown };
    const simulation = String(raw.simulation ?? "").trim();
    const honest_question = String(raw.honest_question ?? "").trim();

    if (!simulation) return { ok: false, error: "Empty simulation." };

    return { ok: true, simulation, honest_question };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error.",
    };
  }
}
