/**
 * Career Decision Engine
 *
 * Generates 2–3 career path analyses from a CareerContext object.
 *
 * Entry point: generateCareerPaths(context)
 * This file contains:
 *   1. serializeContext()   — converts CareerContext to a prompt-safe string
 *   2. buildPrompt()        — assembles the full system + user prompt
 *   3. generateCareerPaths() — calls the model and parses the response
 */

import Anthropic from "@anthropic-ai/sdk";
import type { CareerContext } from "@/types/context";
import type { CareerPath, CareerPathAnalysis } from "@/types/decisions";
import { applyConstraints, validateOutput } from "./constraints";

const client = new Anthropic();

// ---------------------------------------------------------------------------
// Context serializer
// Converts a CareerContext into a tightly formatted plain-text block.
// No JSON — structured prose is cheaper on tokens and easier to reason about.
// ---------------------------------------------------------------------------

export function serializeContext(ctx: CareerContext): string {
  const lines: string[] = [];

  const miss = ctx.completeness;

  // ── Identity ───────────────────────────────────────────────────────────────
  if (ctx.identity) {
    const id = ctx.identity;
    lines.push("## Who They Are");
    lines.push(`Career stage: ${id.career_stage}`);
    if (id.current_role) lines.push(`Current role: ${id.current_role}`);
    lines.push(`Thinking style: ${id.thinking_style}`);
    lines.push(`Decision approach: ${id.decision_approach}`);
    if (id.problem_framing) lines.push(`Problem framing (own words): "${id.problem_framing}"`);
    lines.push(`Primary learning mode: ${id.primary_learning_mode}`);
    if (id.knowledge_domains.length) lines.push(`Deep expertise: ${id.knowledge_domains.join(", ")}`);
    if (id.currently_exploring.length) lines.push(`Currently learning: ${id.currently_exploring.join(", ")}`);
    lines.push(`Work rhythm: ${id.work_rhythm}`);
    lines.push(`Energy source: ${id.energy_source}`);
    lines.push(`Best collaboration setup: ${id.collaboration_style}`);
    if (id.core_values.length) lines.push(`Core values: ${id.core_values.join(", ")}`);
    if (id.motivated_by) lines.push(`Motivated by: "${id.motivated_by}"`);
    if (id.strengths.length) lines.push(`Strengths: ${id.strengths.join(", ")}`);
    if (id.growth_areas.length) lines.push(`Growth areas: ${id.growth_areas.join(", ")}`);
    if (id.industries.length) lines.push(`Industry background: ${id.industries.join(", ")}`);
    if (id.career_direction) lines.push(`Stated direction: "${id.career_direction}"`);
    lines.push(`Communication style: ${id.communication_style}`);
    lines.push(`Feedback preference: ${id.feedback_preference}`);
    if (id.ai_context) lines.push(`Notes for AI: "${id.ai_context}"`);
  } else {
    lines.push("## Who They Are");
    lines.push("[Identity not provided — analysis will be limited to background data only]");
  }

  lines.push("");

  // ── Background ─────────────────────────────────────────────────────────────
  if (ctx.background) {
    const bg = ctx.background;
    lines.push("## Career Background");

    if (bg.resume_text) {
      lines.push("Resume text:");
      // Trim very long resumes to 2000 chars to avoid prompt bloat
      const trimmed = bg.resume_text.length > 2000
        ? bg.resume_text.slice(0, 2000) + "\n[... truncated]"
        : bg.resume_text;
      lines.push(trimmed);
    } else {
      lines.push("[No resume provided]");
    }

    if (bg.github_url) lines.push(`GitHub: ${bg.github_url}`);

    if (bg.projects.length) {
      lines.push("Projects:");
      for (const p of bg.projects) {
        lines.push(`- ${p.title ? p.title + ": " : ""}${p.description}`);
      }
    }
  } else {
    lines.push("## Career Background");
    lines.push("[No background data provided]");
  }

  lines.push("");

  // ── Past decisions ─────────────────────────────────────────────────────────
  if (ctx.decisions.length) {
    lines.push("## Recorded Decisions");
    for (const d of ctx.decisions) {
      lines.push(`- ${d.title}`);
      lines.push(`  Rationale: ${d.rationale}`);
      if (d.outcome) lines.push(`  Outcome: ${d.outcome}`);
    }
  } else if (miss.has_decisions === false) {
    lines.push("## Recorded Decisions");
    lines.push("[No decisions recorded yet]");
  }

  lines.push("");

  // ── Proof capsules ─────────────────────────────────────────────────────────
  if (ctx.proof_capsules.length) {
    lines.push("## Evidence (Proof Capsules)");
    for (const p of ctx.proof_capsules) {
      lines.push(`- Claim: ${p.claim}`);
      lines.push(`  Evidence: ${p.evidence}`);
      if (p.tags.length) lines.push(`  Tags: ${p.tags.join(", ")}`);
    }
  } else if (miss.has_proof === false) {
    lines.push("## Evidence");
    lines.push("[No proof capsules written yet]");
  }

  // ── LinkedIn context ────────────────────────────────────────────────────────
  if (ctx.linkedin) {
    const li = ctx.linkedin;
    lines.push("");
    lines.push("## LinkedIn Professional History");

    if (li.headline) lines.push(`Headline: ${li.headline}`);
    if (li.summary) lines.push(`Summary: ${li.summary.slice(0, 600)}${li.summary.length > 600 ? "…" : ""}`);

    if (li.positions.length) {
      lines.push("Work history (chronological):");
      for (const p of li.positions) {
        const period = p.started_on
          ? `${p.started_on.slice(0, 7)} → ${p.is_current ? "present" : (p.finished_on?.slice(0, 7) ?? "?")}`
          : "";
        lines.push(`  - ${p.title} at ${p.company}${p.location ? ` (${p.location})` : ""}${period ? ` [${period}]` : ""}`);
        if (p.description) lines.push(`    ${p.description.slice(0, 200)}${p.description.length > 200 ? "…" : ""}`);
      }
    }

    if (li.skills.length) {
      lines.push(`LinkedIn skills (${li.skills.length} total): ${li.skills.slice(0, 20).map((s) => s.name).join(", ")}${li.skills.length > 20 ? `, +${li.skills.length - 20} more` : ""}`);
    }

    if (li.post_count > 0) {
      lines.push(`Total posts written: ${li.post_count}`);
      if (li.recent_posts.length) {
        lines.push("Recent posts (excerpt):");
        for (const post of li.recent_posts.slice(0, 5)) {
          lines.push(`  [${post.date.slice(0, 7)}] ${post.text.slice(0, 200)}${post.text.length > 200 ? "…" : ""}`);
        }
      }
    }
  }

  // ── Completeness note ──────────────────────────────────────────────────────
  const missingParts: string[] = [];
  if (!miss.has_identity) missingParts.push("identity");
  if (!miss.has_background) missingParts.push("background");
  if (!miss.has_decisions) missingParts.push("decisions");
  if (!miss.has_proof) missingParts.push("proof capsules");

  if (missingParts.length) {
    lines.push("");
    lines.push(`## Missing Context`);
    lines.push(`The following sections have no data: ${missingParts.join(", ")}.`);
    lines.push("Account for this uncertainty in your analysis. Do not infer missing values.");
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `\
You are a career reasoning engine. Your job is to generate 2–3 realistic career path analyses for a specific person based entirely on the data provided. You do not predict the future. You reason about fit, gaps, risk, and tradeoffs.

## Absolute rules

1. Every claim must be grounded in the provided data. If you cannot source a claim to something the user said or showed, do not make it.
2. Do not soften risks. If a path has a serious structural risk, say it is serious.
3. Do not add encouragement. Phrases like "you have what it takes" or "your passion will carry you" are not permitted.
4. Do not omit misaligned paths if the user's stated direction conflicts with their data. Surface the conflict directly.
5. Acknowledge data gaps explicitly in missing_context. Do not pretend completeness you don't have.
6. Time-to-readiness must be a range, not a point estimate. If you cannot estimate, say why.
7. what_to_avoid must be specific to this person. Generic career advice is not acceptable.

## Reasoning process

Before writing any path, work through these questions internally:
- What does this person demonstrably know how to do?
- What does their decision history reveal about what they will actually do vs. what they say they want?
- What does their growth area list signal about what is genuinely hard for them?
- Where does their stated direction agree with their behavioral data? Where does it conflict?
- What market or structural forces apply to the paths under consideration?
- What would have to be true for each path to go wrong?

## Output format

Respond with valid JSON matching this exact structure:

{
  "paths": [
    {
      "name": "string — concrete direction, not a job title",
      "fit_reasoning": "string — why this fits THIS person, references their specific data",
      "gaps": ["string", ...],
      "time_to_readiness": "string — range or uncertainty statement",
      "risk_assessment": "string — honest, specific",
      "what_to_avoid": ["string", ...],
      "alignment": "aligned" | "partial" | "misaligned"
    }
  ],
  "observations": ["string", ...],
  "missing_context": ["string", ...],
  "anti_recommendations": [
    {
      "path": "string — specific direction name, not generic category",
      "reason": "string — why THIS person should not pursue it, grounded in their data"
    }
  ]
}

Order paths from most to least aligned. Include a misaligned path last only if there is a meaningful conflict worth naming. Do not manufacture a misaligned path if none exists.

For anti_recommendations: include 1–3 directions that are structurally wrong for this person based on their data. These must be specific (not "management in general" — instead "startup CTO roles before building a team of more than 5"). Ground every reason in something from the user's identity, background, or decision history. If you cannot make a specific, data-grounded anti-recommendation, include an empty array rather than generic advice.`;

export function buildPrompt(ctx: CareerContext): string {
  return `Here is the career context for this user:\n\n${serializeContext(ctx)}`;
}

// ---------------------------------------------------------------------------
// Response parser
// Extracts and validates the JSON from the model response.
// Returns null if parsing fails — caller decides how to handle.
// ---------------------------------------------------------------------------

type RawPath = {
  name: unknown;
  fit_reasoning: unknown;
  gaps: unknown;
  time_to_readiness: unknown;
  risk_assessment: unknown;
  what_to_avoid: unknown;
  alignment: unknown;
};

type RawAntiRec = {
  path: unknown;
  reason: unknown;
};

type RawAnalysis = {
  paths: RawPath[];
  observations: unknown;
  missing_context: unknown;
  anti_recommendations?: RawAntiRec[];
};

function parseResponse(content: string, ctx: CareerContext): CareerPathAnalysis | null {
  // Try to extract the JSON object — handle code fences and leading/trailing prose
  let jsonStr = content.trim();

  // Strip ```json ... ``` or ``` ... ``` fences
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  } else {
    // Fallback: slice from first { to last }
    const start = jsonStr.indexOf("{");
    const end = jsonStr.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      jsonStr = jsonStr.slice(start, end + 1);
    }
  }

  let raw: RawAnalysis;
  try {
    raw = JSON.parse(jsonStr) as RawAnalysis;
  } catch {
    return null;
  }

  if (!Array.isArray(raw.paths) || raw.paths.length < 1) return null;

  const paths: CareerPath[] = raw.paths.map((p) => ({
    name: String(p.name ?? ""),
    fit_reasoning: String(p.fit_reasoning ?? ""),
    gaps: Array.isArray(p.gaps) ? p.gaps.map(String) : [],
    time_to_readiness: String(p.time_to_readiness ?? ""),
    risk_assessment: String(p.risk_assessment ?? ""),
    what_to_avoid: Array.isArray(p.what_to_avoid) ? p.what_to_avoid.map(String) : [],
    alignment: (["aligned", "partial", "misaligned"] as const).includes(p.alignment as never)
      ? (p.alignment as CareerPath["alignment"])
      : "partial",
  }));

  const anti_recommendations = Array.isArray(raw.anti_recommendations)
    ? raw.anti_recommendations.map((a) => ({
        path: String(a.path ?? ""),
        reason: String(a.reason ?? ""),
      })).filter((a) => a.path && a.reason)
    : [];

  return {
    user_id: ctx.user_id,
    generated_at: new Date().toISOString(),
    context_snapshot_at: ctx.aggregated_at,
    paths,
    observations: Array.isArray(raw.observations) ? raw.observations.map(String) : [],
    missing_context: Array.isArray(raw.missing_context) ? raw.missing_context.map(String) : [],
    anti_recommendations: anti_recommendations.length ? anti_recommendations : undefined,
  };
}

// ---------------------------------------------------------------------------
// generateCareerPaths — main entry point
// ---------------------------------------------------------------------------

export type GenerateResult =
  | { ok: true; analysis: CareerPathAnalysis }
  | { ok: false; error: string };

export async function generateCareerPaths(ctx: CareerContext): Promise<GenerateResult> {
  if (!ctx.identity && !ctx.background) {
    return {
      ok: false,
      error: "Insufficient data: identity and background are both missing. At least one is required.",
    };
  }

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    system: applyConstraints(SYSTEM_PROMPT),
    messages: [
      { role: "user", content: buildPrompt(ctx) },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    return { ok: false, error: "Model returned no text content." };
  }

  const analysis = parseResponse(block.text, ctx);
  if (!analysis) {
    return {
      ok: false,
      error: `Model response could not be parsed. Raw response:\n\n${block.text.slice(0, 500)}`,
    };
  }

  // Run safety validation across all free-text fields in the analysis
  const allText = [
    ...analysis.paths.flatMap((p) => [
      p.fit_reasoning,
      p.time_to_readiness,
      p.risk_assessment,
      ...p.gaps,
      ...p.what_to_avoid,
    ]),
    ...analysis.observations,
  ].join(" ");

  const validation = validateOutput(allText);
  if (!validation.pass) {
    // Log violations but do not hard-block — the validator is heuristic.
    // Callers can inspect analysis._violations if they need to act on this.
    (analysis as CareerPathAnalysis & { _violations?: unknown })._violations =
      validation.violations;
  }

  return { ok: true, analysis };
}
