/**
 * Weekly Check-in AI
 *
 * Takes three reflection answers and returns a short, honest response
 * that surfaces patterns and asks a sharpening question.
 */

import Anthropic from "@anthropic-ai/sdk";
import { applyConstraints } from "./constraints";
import type { CareerContext } from "@/types/context";

const client = new Anthropic();

export type CheckInAnswers = {
  what_happened: string;      // What was the most significant thing that happened this week?
  energy: string;             // What gave you energy? What drained it?
  next: string;               // What's the one thing you want to move on next week?
};

export type CheckInResult =
  | { ok: true; response: string; sharpening_question: string }
  | { ok: false; error: string };

const CHECKIN_SYSTEM = `You are a direct, honest career advisor doing a brief weekly check-in. Your role is to reflect what you hear, surface patterns you notice (if any), and ask one sharpening question.

Rules:
1. Keep your response under 120 words total — it should feel like a thoughtful mentor, not an essay
2. Reference the user's profile only when directly relevant — don't recap their whole background
3. The sharpening_question must be a genuine question that moves thinking forward, not a restatement of what they said
4. Be honest, not flattering — if something sounds like avoidance or a pattern worth naming, name it lightly
5. Never use bullet points or headers — flowing prose only

Output valid JSON:
{
  "response": "string — 2-4 sentences reflecting what you heard and any pattern worth noting",
  "sharpening_question": "string — one question that sharpens their thinking for next week"
}`;

export async function processCheckIn(
  context: CareerContext,
  answers: CheckInAnswers,
): Promise<CheckInResult> {
  const profileContext = context.identity
    ? `User is a ${context.identity.career_stage}, targeting: ${context.identity.career_direction ?? "not specified"}.`
    : "";

  const prompt = `${profileContext}\n\nThis week's check-in:\n\nWhat happened: ${answers.what_happened}\n\nEnergy: ${answers.energy}\n\nNext week focus: ${answers.next}`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 512,
      system: applyConstraints(CHECKIN_SYSTEM),
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      return { ok: false, error: "No response from AI." };
    }

    let jsonStr = block.text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1]!.trim();
    else {
      const start = jsonStr.indexOf("{");
      const end = jsonStr.lastIndexOf("}");
      if (start !== -1 && end !== -1) jsonStr = jsonStr.slice(start, end + 1);
    }

    const raw = JSON.parse(jsonStr) as {
      response: string;
      sharpening_question: string;
    };

    return {
      ok: true,
      response: raw.response ?? "",
      sharpening_question: raw.sharpening_question ?? "",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
