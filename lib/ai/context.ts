/**
 * Career Context Aggregator
 *
 * buildCareerContext(userId) is the single entry point for assembling
 * everything known about a user into one CareerContext object.
 *
 * Rules:
 * - Fetch once per call — no caching here; callers decide caching strategy
 * - Never throw on missing data — absent sections become null or []
 * - Never infer or hallucinate — only store what the user explicitly provided
 */

import { createClient } from "@/lib/db/server";
import type { CareerContext, ContextBackground, ContextIdentity, ContextLinkedIn, PastDecision, ProofCapsule } from "@/types/context";
import type { CareerIdentity } from "@/types/identity";
import type { Credentials } from "@/types/credentials";
import type { ProofCapsuleRecord } from "@/types/proof";

// ---------------------------------------------------------------------------
// Normalizers — convert raw DB rows to context sections
// ---------------------------------------------------------------------------

function normalizeIdentity(row: CareerIdentity): ContextIdentity {
  return {
    career_stage: row.career_stage,
    current_role: row.current_role,
    thinking_style: row.thinking_style,
    decision_approach: row.decision_approach,
    problem_framing: row.problem_framing,
    primary_learning_mode: row.primary_learning_mode,
    knowledge_domains: row.knowledge_domains,
    currently_exploring: row.currently_exploring,
    work_rhythm: row.work_rhythm,
    energy_source: row.energy_source,
    collaboration_style: row.collaboration_style,
    core_values: row.core_values,
    motivated_by: row.motivated_by,
    strengths: row.strengths,
    growth_areas: row.growth_areas,
    industries: row.industries,
    career_direction: row.career_direction,
    communication_style: row.communication_style,
    feedback_preference: row.feedback_preference,
    ai_context: row.ai_context,
  };
}

function normalizeBackground(row: Credentials): ContextBackground {
  return {
    resume_text: row.resume_text,
    github_url: row.github_url,
    projects: row.project_descriptions,
  };
}

// ---------------------------------------------------------------------------
// buildCareerContext
// ---------------------------------------------------------------------------

type AggregatorOptions = {
  /**
   * Recorded career decisions.
   * Pass an empty array until the Decisions module is built.
   * The aggregator will query the DB directly once that table exists.
   */
  decisions?: PastDecision[];
};

function normalizeProofCapsule(row: ProofCapsuleRecord): ProofCapsule {
  // Synthesize `evidence` for the AI by joining the five structured sections.
  const sections: string[] = [
    row.context,
    row.constraints,
    row.decision_reasoning,
    row.iterations,
    row.reflection,
  ].filter((s): s is string => typeof s === "string" && s.trim().length > 0);

  return {
    id: row.id,
    claim: row.claim,
    evidence: sections.join("\n\n"),
    tags: row.tags,
    created_at: row.created_at,
  };
}

export async function buildCareerContext(
  userId: string,
  opts: AggregatorOptions = {},
): Promise<CareerContext> {
  const { decisions = [] } = opts;

  const supabase = await createClient();

  // Fetch all sources in parallel
  const [identityResult, credentialsResult, capsuleResult, linkedInResult] = await Promise.all([
    supabase
      .from("career_identity")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("credentials")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("proof_capsules")
      .select("*")
      .eq("user_id", userId)
      .eq("is_complete", true)
      .order("updated_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("linkedin_data")
      .select("headline, summary, positions, skills, posts, post_count")
      .eq("user_id", userId)
      .maybeSingle() as Promise<{ data: { headline: string | null; summary: string | null; positions: unknown[]; skills: unknown[]; posts: unknown[]; post_count: number } | null; error: unknown }>,
  ]);

  const identity = identityResult.data ? normalizeIdentity(identityResult.data) : null;
  const background = credentialsResult.data ? normalizeBackground(credentialsResult.data) : null;
  const proof_capsules = (capsuleResult.data ?? []).map((r) =>
    normalizeProofCapsule(r as ProofCapsuleRecord),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liRow = linkedInResult.data as any;
  const linkedin: ContextLinkedIn | null = liRow
    ? {
        headline: liRow.headline,
        summary: liRow.summary,
        positions: liRow.positions ?? [],
        skills: liRow.skills ?? [],
        recent_posts: (liRow.posts ?? []).slice(0, 20),
        post_count: liRow.post_count ?? 0,
      }
    : null;

  const completeness = {
    has_identity: identity !== null,
    has_background: background !== null,
    has_decisions: decisions.length > 0,
    has_proof: proof_capsules.length > 0,
    has_linkedin: linkedin !== null,
  };

  return {
    user_id: userId,
    aggregated_at: new Date().toISOString(),
    completeness,
    identity,
    background,
    decisions,
    proof_capsules,
    linkedin,
  };
}
