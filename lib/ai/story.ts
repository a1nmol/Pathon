/**
 * Career Story Generator
 *
 * Synthesizes everything the system knows about a user into a
 * first-person narrative essay. Not a biography. Not a summary.
 * A coherent account of how this person thinks, what they've built,
 * and where they appear to be going — in their voice.
 *
 * Entry point: generateCareerStory(context, memory)
 */

import Anthropic from "@anthropic-ai/sdk";
import { serializeContext } from "./decisions";
import { applyConstraints } from "./constraints";
import type { CareerContext } from "@/types/context";
import type { CareerStateMemory } from "@/types/memory";

const client = new Anthropic();

export type CareerStoryResult =
  | { ok: true; story: string; wordCount: number }
  | { ok: false; error: string };

const SYSTEM_PROMPT = applyConstraints(`\
You are a career narrator. You are given everything known about one person's career trajectory. Your task is to write a first-person narrative in their voice — not as them summarizing their resume, but as them reflecting honestly on how they got here, what they've learned, and what they're moving toward.

Rules:
1. Write in first person ("I built...", "I kept returning to...", "What I noticed was...")
2. Do not fabricate. Every claim must come from the provided data.
3. Do not use resume language ("leveraged", "drove", "spearheaded"). Write like a person thinking out loud.
4. Include tensions and unresolved questions — this is not a success story. It is a true account.
5. Reference specific decisions from their history when they reveal something about how they think.
6. Do not close with optimism unless the data supports it. Do not close with a call to action.
7. Length: 350–500 words. Three to four paragraphs. No headers.
8. Tone: reflective, grounded, specific. Not inspirational. Not cautionary. Just true.

The essay should feel like something the person could have written themselves after a month of reflection — if they were being completely honest.`);

function buildPrompt(ctx: CareerContext, mem: CareerStateMemory): string {
  const contextBlock = serializeContext(ctx);

  // Collect key memory signals
  const memoryLines: string[] = [];

  if (mem.active_pursuits.length) {
    memoryLines.push(`Currently pursuing: ${mem.active_pursuits.map((p) => `"${p.path_name}"`).join(", ")}`);
  }
  if (mem.dismissed_paths.length) {
    memoryLines.push(`Dismissed paths: ${mem.dismissed_paths.map((p) => `"${p.path_name}"`).join(", ")}`);
  }
  if (mem.patterns.length) {
    memoryLines.push("Observed patterns:");
    for (const p of mem.patterns) {
      memoryLines.push(`- ${p.kind}: ${p.description}`);
    }
  }

  const memoryBlock = memoryLines.length
    ? memoryLines.join("\n")
    : "[No behavioral history recorded yet]";

  return `Here is everything known about this person:

${contextBlock}

---

Behavioral history:
${memoryBlock}

---

Write the first-person career narrative now.`;
}

export async function generateCareerStory(
  ctx: CareerContext,
  mem: CareerStateMemory,
): Promise<CareerStoryResult> {
  if (!ctx.identity && !ctx.background) {
    return {
      ok: false,
      error: "Insufficient data — identity and background are both missing.",
    };
  }

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(ctx, mem) }],
    });

    const block = message.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      return { ok: false, error: "No content returned." };
    }

    const story = block.text.trim();
    const wordCount = story.split(/\s+/).filter(Boolean).length;

    return { ok: true, story, wordCount };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error.",
    };
  }
}
