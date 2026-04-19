/**
 * The Debate — Two AI Advisors, One Dilemma
 *
 * Generates a structured debate between two career advisor personas:
 *
 *   The Architect — Long-horizon, strategic. Asks: "Where does this lead in 10 years?"
 *   The Challenger — Market-hardened, direct. Asks: "Can you actually execute this?"
 *
 * After the debate, The Mirror speaks — a reflective voice that surfaces
 * the user's own behavioral patterns in relation to the dilemma.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { CareerContext } from "@/types/context";
import type { ObservedPattern } from "@/types/memory";

const client = new Anthropic();

// ─── Types ────────────────────────────────────────────────────────────────────

export type DebateSpeaker = "architect" | "challenger";

export type DebateTurn = {
  speaker: DebateSpeaker;
  content: string;
};

export type DebateResult =
  | { ok: true; turns: DebateTurn[]; mirror: string }
  | { ok: false; error: string };

// ─── Debate system prompt ─────────────────────────────────────────────────────

const DEBATE_SYSTEM = `You are running a structured career advisor debate between two distinct personas.

THE ARCHITECT
Voice: Measured, precise, patient. Thinks in 5-10 year arcs.
Phrases: "what this pattern suggests", "in the longer arc", "the underlying question is"
Bias: Sees potential and alignment with stated goals. Skeptical of short-term thinking.
Does not flatter. Does not predict specific outcomes. Does not reassure blindly.

THE CHALLENGER
Voice: Direct, fast, skeptical. Thinks in markets and demonstrated behavior.
Phrases: "the reality is", "what you haven't said is", "the data you have shows"
Bias: Trusts execution over aspiration. Names the gap between what someone says and what they do.
Does not dismiss potential. Does not demotivate. Does not reassure.

Rules:
1. 3 rounds, 6 turns. Architect goes first.
2. Each turn: 2-4 sentences. Dense. No padding. No filler.
3. They respond to EACH OTHER, not just the dilemma. This is a real argument.
4. They genuinely disagree — not performatively. Name the actual disagreement.
5. Reference the user's career context where specific and relevant.
6. No bullet points. No headers. Flowing prose only.
7. Neither persona makes predictions stated as certainties.
8. Do NOT have them agree at the end. Let the tension stand.

Output valid JSON only:
{
  "turns": [
    { "speaker": "architect", "content": "string" },
    { "speaker": "challenger", "content": "string" },
    { "speaker": "architect", "content": "string" },
    { "speaker": "challenger", "content": "string" },
    { "speaker": "architect", "content": "string" },
    { "speaker": "challenger", "content": "string" }
  ]
}`;

// ─── Mirror system prompt ─────────────────────────────────────────────────────

const MIRROR_SYSTEM = `You are The Mirror — a reflective voice in a career intelligence system.

Your only job: surface one specific pattern from the user's own history that is relevant to their current dilemma. You do not advise. You do not reassure. You do not agree with either advisor. You only reflect what the data shows.

Rules:
1. ONE paragraph. 2-3 sentences maximum.
2. Start with a specific observation from their history — not a general statement.
3. Be direct. Uncomfortable is acceptable. Flattery is not.
4. If history is sparse, acknowledge what is not yet known — one sentence.
5. No advice. No recommendations. No "you should". Only observation.
6. Do not reference "the debate" or the advisors. Speak directly to the dilemma.

Output: plain text only. No JSON. No labels.`;

// ─── Context builder ──────────────────────────────────────────────────────────

function buildContextSummary(context: CareerContext): string {
  const parts: string[] = [];
  if (context.identity) {
    parts.push(`Career stage: ${context.identity.career_stage}`);
    if (context.identity.career_direction) {
      parts.push(`Stated direction: "${context.identity.career_direction}"`);
    }
    if (context.identity.knowledge_domains.length) {
      parts.push(`Domains: ${context.identity.knowledge_domains.join(", ")}`);
    }
    if (context.identity.strengths.length) {
      parts.push(`Strengths: ${context.identity.strengths.join(", ")}`);
    }
    if (context.identity.growth_areas.length) {
      parts.push(`Growth areas: ${context.identity.growth_areas.join(", ")}`);
    }
  }
  if (context.proof_capsules?.length) {
    parts.push(`Proof capsules: ${context.proof_capsules.map((c) => c.claim).join(" | ")}`);
  }
  return parts.join("\n");
}

function buildPatternSummary(patterns: ObservedPattern[]): string {
  if (!patterns.length) return "No behavioral patterns recorded yet.";
  return patterns.map((p) => `${p.kind}: ${p.description}`).join("\n");
}

// ─── generateDebate ───────────────────────────────────────────────────────────

export async function generateDebate(
  context: CareerContext,
  dilemma: string,
  patterns: ObservedPattern[] = [],
): Promise<DebateResult> {
  const contextSummary = buildContextSummary(context);
  const patternSummary = buildPatternSummary(patterns);

  const debatePrompt = `User context:\n${contextSummary}\n\nDilemma: "${dilemma}"`;
  const mirrorPrompt = `User context:\n${contextSummary}\n\nBehavioral patterns:\n${patternSummary}\n\nDilemma: "${dilemma}"`;

  try {
    // Generate debate turns and mirror in parallel
    const [debateMsg, mirrorMsg] = await Promise.all([
      client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 2048,
        system: DEBATE_SYSTEM,
        messages: [{ role: "user", content: debatePrompt }],
      }),
      client.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 256,
        system: MIRROR_SYSTEM,
        messages: [{ role: "user", content: mirrorPrompt }],
      }),
    ]);

    // Parse debate turns
    const debateBlock = debateMsg.content.find((b) => b.type === "text");
    if (!debateBlock || debateBlock.type !== "text") {
      return { ok: false, error: "No response from debate engine." };
    }

    let debateJson = debateBlock.text.trim();
    const fenceMatch = debateJson.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) debateJson = fenceMatch[1]!.trim();
    else {
      const start = debateJson.indexOf("{");
      const end = debateJson.lastIndexOf("}");
      if (start !== -1 && end !== -1) debateJson = debateJson.slice(start, end + 1);
    }

    const parsed = JSON.parse(debateJson) as { turns: DebateTurn[] };
    const turns = (parsed.turns ?? []).slice(0, 6);

    if (turns.length < 2) {
      return { ok: false, error: "Debate generation returned insufficient content." };
    }

    // Extract mirror text
    const mirrorBlock = mirrorMsg.content.find((b) => b.type === "text");
    const mirror = mirrorBlock?.type === "text" ? mirrorBlock.text.trim() : "";

    return { ok: true, turns, mirror };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error generating debate.",
    };
  }
}
