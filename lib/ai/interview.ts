/**
 * Interview Preparation AI
 *
 * Two functions:
 *   generateSTARStories(context) — maps proof capsules to STAR interview format
 *   analyzeRoleFit(context, jobDescription) — compares a JD to the user's profile
 */

import Anthropic from "@anthropic-ai/sdk";
import { applyConstraints } from "./constraints";
import type { CareerContext } from "@/types/context";

const client = new Anthropic();

// ─── STAR Story Generator ─────────────────────────────────────────────────────

export type STARStory = {
  capsule_claim: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  best_for: string; // which type of interview question this answers best
};

export type STARResult =
  | { ok: true; stories: STARStory[]; interview_gaps: string[] }
  | { ok: false; error: string };

const STAR_SYSTEM = `You are an interview preparation assistant. You convert structured decision records into STAR-format interview stories.

Rules:
1. Every claim must come from the user's actual proof capsule data — never invent
2. Be specific and concrete — interviewers reject vague stories
3. The "result" must name an actual outcome, even if uncertain ("the team shipped X" not "it went well")
4. "best_for" should name the specific behavioral question category this story answers (e.g. "conflict resolution", "technical leadership", "ambiguity and prioritization")
5. interview_gaps: name what proof capsules are missing that would close common question categories

Output valid JSON:
{
  "stories": [
    {
      "capsule_claim": "string — the capsule's original claim",
      "situation": "string — 1-2 sentences: context and stakes",
      "task": "string — 1 sentence: what you specifically needed to do",
      "action": "string — 2-3 sentences: what you did and why",
      "result": "string — 1-2 sentences: concrete outcome",
      "best_for": "string — behavioral question category"
    }
  ],
  "interview_gaps": ["string — question category with no good story yet"]
}`;

export async function generateSTARStories(
  context: CareerContext,
): Promise<STARResult> {
  if (!context.proof_capsules || context.proof_capsules.length === 0) {
    return {
      ok: false,
      error:
        "No proof capsules found. Complete at least one proof capsule before generating STAR stories.",
    };
  }

  const capsuleSummary = context.proof_capsules
    .map(
      (c, i) =>
        `Capsule ${i + 1}: ${c.claim}\nEvidence: ${c.evidence.slice(0, 400)}`,
    )
    .join("\n\n");

  const pathContext = context.identity
    ? `Target paths: ${context.identity.career_stage} level, domains: ${context.identity.knowledge_domains.join(", ")}`
    : "";

  const prompt = `Convert these proof capsules into STAR interview stories.\n\n${pathContext}\n\nProof capsules:\n${capsuleSummary}`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 2048,
      system: applyConstraints(STAR_SYSTEM),
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      return { ok: false, error: "No response from AI." };
    }

    // Extract JSON
    let jsonStr = block.text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1]!.trim();
    else {
      const start = jsonStr.indexOf("{");
      const end = jsonStr.lastIndexOf("}");
      if (start !== -1 && end !== -1) jsonStr = jsonStr.slice(start, end + 1);
    }

    const raw = JSON.parse(jsonStr) as {
      stories: STARStory[];
      interview_gaps: string[];
    };

    return {
      ok: true,
      stories: raw.stories ?? [],
      interview_gaps: raw.interview_gaps ?? [],
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── Role Fit Analyzer ────────────────────────────────────────────────────────

export type RoleFitResult =
  | {
      ok: true;
      alignment_score: "strong" | "partial" | "weak";
      what_fits: string[];
      gaps_for_role: string[];
      relevant_capsules: string[];
      red_flags: string[];
      verdict: string;
    }
  | { ok: false; error: string };

const FIT_SYSTEM = `You are a career advisor helping someone evaluate whether a specific job fits their profile.

Rules:
1. Base every claim on the provided user profile and job description — no invention
2. Gaps must be specific to this role, not generic career advice
3. Red flags are honest — if the role conflicts with stated values or growth areas, name it
4. Verdict: one direct sentence about overall fit
5. relevant_capsules: list the proof capsule claims (verbatim) that are most useful for this application

Output valid JSON:
{
  "alignment_score": "strong" | "partial" | "weak",
  "what_fits": ["string"],
  "gaps_for_role": ["string"],
  "relevant_capsules": ["string — verbatim capsule claim"],
  "red_flags": ["string"],
  "verdict": "string — one direct sentence"
}`;

export async function analyzeRoleFit(
  context: CareerContext,
  jobDescription: string,
): Promise<RoleFitResult> {
  if (!context.identity && !context.background) {
    return {
      ok: false,
      error: "Profile incomplete — complete identity and credentials first.",
    };
  }

  const profileSummary = [
    context.identity
      ? `Career stage: ${context.identity.career_stage}, Role: ${context.identity.current_role ?? "not specified"}`
      : "",
    context.identity
      ? `Skills: ${[...context.identity.knowledge_domains, ...context.identity.strengths].join(", ")}`
      : "",
    context.identity
      ? `Growth areas: ${context.identity.growth_areas.join(", ")}`
      : "",
    context.background?.resume_text
      ? `Resume excerpt: ${context.background.resume_text.slice(0, 600)}`
      : "",
    context.proof_capsules?.length
      ? `Proof capsules: ${context.proof_capsules.map((c) => c.claim).join(" | ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Analyze this role fit.\n\nUser profile:\n${profileSummary}\n\nJob description:\n${jobDescription.slice(0, 1500)}`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: applyConstraints(FIT_SYSTEM),
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

    const raw = JSON.parse(jsonStr) as Omit<Extract<RoleFitResult, { ok: true }>, "ok">;
    return { ...raw, ok: true } as RoleFitResult;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
