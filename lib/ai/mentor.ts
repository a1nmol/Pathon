/**
 * AI Shadow Mentor
 *
 * Provides ongoing, context-aware career guidance grounded in
 * CareerContext and CareerStateMemory. Does not agree automatically.
 * Challenges weak reasoning. References past decisions when relevant.
 *
 * Entry points:
 *   askMentor(context, memory, input)         — returns full response
 *   streamMentor(context, memory, input)      — streams text, returns metadata
 */

import Anthropic from "@anthropic-ai/sdk";
import { serializeContext } from "./decisions";
import { applyConstraints, validateOutput } from "./constraints";
import type { CareerContext } from "@/types/context";
import type { CareerStateMemory, PathResponse } from "@/types/memory";
import type { MentorInput, MentorResponse, MentorStreamMeta } from "@/types/mentor";
import { CAREER_MODES, type CareerMode } from "@/types/mode";

const client = new Anthropic();

// ---------------------------------------------------------------------------
// Memory serializer
// Converts CareerStateMemory into a prompt-safe summary.
// Only includes what is meaningful — empty sections are omitted entirely.
// ---------------------------------------------------------------------------

function serializeMemory(mem: CareerStateMemory): string {
  const lines: string[] = [];

  // ── Active pursuits ────────────────────────────────────────────────────────
  if (mem.active_pursuits.length) {
    lines.push("## Currently Pursuing");
    for (const r of mem.active_pursuits) {
      const date = new Date(r.responded_at).toISOString().slice(0, 10);
      lines.push(`- "${r.path_name}" (committed ${date})${r.note ? ` — note: "${r.note}"` : ""}`);
    }
    lines.push("");
  }

  // ── Dismissed paths ────────────────────────────────────────────────────────
  if (mem.dismissed_paths.length) {
    lines.push("## Dismissed Paths");
    for (const r of mem.dismissed_paths) {
      const date = new Date(r.responded_at).toISOString().slice(0, 10);
      lines.push(`- "${r.path_name}" (dismissed ${date})${r.note ? ` — reason: "${r.note}"` : ""}`);
    }
    lines.push("");
  }

  // ── Other responses (deferred / considering) ───────────────────────────────
  const otherResponses = mem.responses.filter(
    (r): r is PathResponse =>
      r.action === "deferred" || r.action === "considering",
  );
  // Deduplicate to latest per path_name
  const seen = new Set<string>();
  const dedupedOther: PathResponse[] = [];
  for (const r of otherResponses) {
    if (!seen.has(r.path_name)) {
      seen.add(r.path_name);
      dedupedOther.push(r);
    }
  }
  if (dedupedOther.length) {
    lines.push("## Deferred or Under Consideration");
    for (const r of dedupedOther) {
      const date = new Date(r.responded_at).toISOString().slice(0, 10);
      lines.push(`- "${r.path_name}" (${r.action} on ${date})${r.note ? ` — "${r.note}"` : ""}`);
    }
    lines.push("");
  }

  // ── Observed patterns ──────────────────────────────────────────────────────
  if (mem.patterns.length) {
    lines.push("## Observed Behavioral Patterns");
    for (const p of mem.patterns) {
      lines.push(`- ${p.kind}: ${p.description}`);
    }
    lines.push("");
  }

  // ── Recent decision log (last 6 events, excluding analysis_generated) ──────
  const relevantEvents = mem.events
    .filter((e) => e.event_type !== "analysis_generated")
    .slice(0, 6);
  if (relevantEvents.length) {
    lines.push("## Recent Activity");
    for (const e of relevantEvents) {
      const date = new Date(e.occurred_at).toISOString().slice(0, 10);
      lines.push(`- [${date}] ${formatEventLine(e.event_type, e.meta)}`);
    }
    lines.push("");
  }

  if (lines.length === 0) {
    return "[No memory data — this appears to be the first session.]";
  }

  return lines.join("\n");
}

function formatEventLine(
  eventType: string,
  meta: Record<string, unknown>,
): string {
  switch (eventType) {
    case "path_pursued":
      return `Marked "${meta.path_name}" as pursuing`;
    case "path_dismissed":
      return `Dismissed "${meta.path_name}" (alignment: ${meta.alignment})`;
    case "path_deferred":
      return `Deferred "${meta.path_name}"`;
    case "path_revisited":
      return `Revisited "${meta.path_name}": ${meta.previous_action} → ${meta.new_action}`;
    case "direction_changed":
      return `Updated career direction`;
    case "identity_updated":
      return `Updated identity fields: ${(meta.fields_changed as string[]).join(", ")}`;
    case "credentials_updated":
      return `Updated credentials: ${(meta.fields_changed as string[]).join(", ")}`;
    case "advice_ignored":
      return `No response to "${meta.path_name}" after ${meta.days_elapsed} days`;
    default:
      return eventType;
  }
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(ctx: CareerContext, mem: CareerStateMemory, mode?: string): string {
  const contextBlock = serializeContext(ctx);
  const memoryBlock = serializeMemory(mem);

  const modeConfig = mode && mode in CAREER_MODES
    ? CAREER_MODES[mode as CareerMode]
    : null;

  const modeBlock = modeConfig
    ? `\n## Current mode: ${modeConfig.label}\n\n${modeConfig.mentorTone}\n`
    : "";

  return `\
You are a career mentor. You are not a coach, not a cheerleader, and not a therapist. You are an experienced, serious advisor who has been given detailed information about one specific person's career situation and history.

Your job is to help this person think more clearly about their career. You do this by responding honestly to what they actually say — not what you wish they had said.

---

## What you know about this person

${contextBlock}

---

## Their decision history and behavioral patterns

${memoryBlock}

---

## How you operate

**Challenge weak reasoning.** If the person's logic has a gap, name it. Do not smooth it over. Do not validate a plan just because they sound committed to it. Commitment is not the same as soundness.

**Reference the past when relevant.** You have their full decision history with dates. If they are about to repeat a pattern — or if a past decision contradicts what they are now saying — say so directly. Name the specific path and when they made that choice. Example: "You dismissed this direction in March and now you're considering it again — what changed?" Do not make vague allusions. Cite specific names and dates from the history below.

**Explain tradeoffs.** Every real career decision has a cost. When the person is weighing options, make the tradeoffs explicit. Do not present one path as obviously correct unless the data makes it so.

**Do not agree automatically.** If someone tells you their plan, your first job is to examine it, not affirm it. You may agree with it — but only after you have genuinely considered whether there is a problem with it.

**Acknowledge what you do not know.** If the person asks about something their data does not cover, say what is missing. Do not infer or fill the gap.

**Distinguish between what the person wants and what the data supports.** These are often different. Name that gap without being dismissive of either side.

## Tone

Calm. Professional. Direct. You use plain sentences. No lists unless the content requires enumeration. No headers. No rhetorical questions. No encouragement that isn't earned. No softening phrases like "that's understandable" or "great question." Just respond to what was said.

If their feedback_preference is "blunt", do not hedge. If it is "balanced" or "encouraging", do not strip all warmth — but do not omit a hard truth because of it. The preference governs delivery, not content.

## Response length

Match the weight of the question. A simple factual question gets a short answer. A complex strategic question gets a thorough one. Do not pad. Do not summarize what you just said at the end.

## What you never do

- Tell them what they want to hear if it is not accurate
- Add closing affirmations ("good luck", "you've got this", "I'm rooting for you")
- Invent information not present in their context or history
- Treat their stated intention as evidence of their capability
- Treat their self-assessment of their strengths as verified fact${modeBlock}`;
}

// ---------------------------------------------------------------------------
// Response metadata extractor
// Determines challenged and referenced_memory from content heuristics.
// These are signals for downstream logging — not perfect, but consistent.
// ---------------------------------------------------------------------------

function extractMeta(
  content: string,
  mem: CareerStateMemory,
): Pick<MentorResponse, "challenged" | "referenced_memory"> {
  const lower = content.toLowerCase();

  // Challenge indicators — direct pushback language
  const challengeSignals = [
    "that reasoning",
    "that logic",
    "not quite right",
    "worth examining",
    "the problem with",
    "that's not",
    "i'd push back",
    "contradicts",
    "doesn't follow",
    "the gap here",
    "before accepting that",
    "the assumption",
  ];
  const challenged = challengeSignals.some((s) => lower.includes(s));

  // Memory reference — did we mention a specific path name or pattern?
  const pathNames = [
    ...mem.active_pursuits.map((r) => r.path_name.toLowerCase()),
    ...mem.dismissed_paths.map((r) => r.path_name.toLowerCase()),
    ...mem.responses.map((r) => r.path_name.toLowerCase()),
  ];
  const patternKinds = mem.patterns.map((p) => p.kind.replace(/_/g, " "));

  const referenced_memory =
    pathNames.some((n) => lower.includes(n.slice(0, 20))) ||
    patternKinds.some((k) => lower.includes(k));

  return { challenged, referenced_memory };
}

// ---------------------------------------------------------------------------
// askMentor — full response
// ---------------------------------------------------------------------------

export async function askMentor(
  ctx: CareerContext,
  mem: CareerStateMemory,
  input: MentorInput,
): Promise<{ ok: true; response: MentorResponse } | { ok: false; error: string }> {
  if (!ctx.identity && !ctx.background) {
    return {
      ok: false,
      error: "Insufficient context: identity and background are both missing.",
    };
  }

  const messages: Anthropic.MessageParam[] = [
    ...input.history.map((m): Anthropic.MessageParam => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: input.message },
  ];

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: applyConstraints(buildSystemPrompt(ctx, mem, input.mode)),
    messages,
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    return { ok: false, error: "Model returned no text content." };
  }

  // Validate before returning — violations are logged, not hard-blocked
  const validation = validateOutput(block.text);
  const meta = extractMeta(block.text, mem);

  return {
    ok: true,
    response: {
      content: block.text,
      ...meta,
      ...(validation.pass ? {} : { _violations: validation.violations }),
    },
  };
}

// ---------------------------------------------------------------------------
// streamMentor — streaming response
// Streams text chunks via the provided onChunk callback.
// Returns metadata after streaming completes.
// ---------------------------------------------------------------------------

export async function streamMentor(
  ctx: CareerContext,
  mem: CareerStateMemory,
  input: MentorInput,
  onChunk: (text: string) => void,
): Promise<{ ok: true; meta: MentorStreamMeta } | { ok: false; error: string }> {
  if (!ctx.identity && !ctx.background) {
    return {
      ok: false,
      error: "Insufficient context: identity and background are both missing.",
    };
  }

  const messages: Anthropic.MessageParam[] = [
    ...input.history.map((m): Anthropic.MessageParam => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: input.message },
  ];

  let fullText = "";

  const stream = client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: applyConstraints(buildSystemPrompt(ctx, mem, input.mode)),
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      onChunk(event.delta.text);
      fullText += event.delta.text;
    }
  }

  const meta = extractMeta(fullText, mem);
  return { ok: true, meta };
}
