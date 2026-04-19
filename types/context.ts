/**
 * CareerContext
 *
 * The single normalized object passed to every AI call.
 * It is assembled from all user-specific data sources and contains
 * nothing else. AI reasoning must not access raw DB rows directly.
 *
 * Shape rules:
 * - No raw UI state or form artifacts
 * - No fields that can be null AND undefined — pick one
 * - No hallucinated or inferred values — every field is sourced
 * - Sections absent from the DB are null (not omitted)
 */

import type {
  CareerStage,
  CollaborationStyle,
  CommunicationStyle,
  DecisionApproach,
  EnergySource,
  FeedbackPreference,
  LearningMode,
  ThinkingStyle,
  WorkRhythm,
} from "./identity";

import type { ProjectDescription } from "./credentials";
import type { LinkedInPosition, LinkedInPost, LinkedInSkill } from "./linkedin";

// ---------------------------------------------------------------------------
// Stub types for future modules
// These are intentionally minimal. They will be expanded in-place
// when their respective modules (decisions, proof capsules) are built.
// The aggregator's type contract is already correct for those fields.
// ---------------------------------------------------------------------------

/**
 * A recorded career decision: a choice the user made, why they made it,
 * and what happened. Populated by the Decisions module (not yet built).
 */
export type PastDecision = {
  id: string;
  /** Short title: "Left fintech job", "Turned down PM role", etc. */
  title: string;
  /** The reasoning at the time of the decision. */
  rationale: string;
  /** Outcome or reflection, added later. */
  outcome: string | null;
  /** ISO date string of when the decision was made. */
  decided_at: string;
};

/**
 * A proof capsule: a concrete, verifiable evidence item the user
 * has written about themselves. Populated by the Proof module (not yet built).
 */
export type ProofCapsule = {
  id: string;
  /** The claim being evidenced: "I led a team under pressure", etc. */
  claim: string;
  /** Specific story or evidence supporting the claim. */
  evidence: string;
  /** Optional tags for grouping: ["leadership", "technical"] */
  tags: string[];
  created_at: string;
};

// ---------------------------------------------------------------------------
// CareerContext sections
// ---------------------------------------------------------------------------

/**
 * Normalized identity section. Derived 1:1 from CareerIdentity.
 * Null if the user has not completed the identity flow.
 */
export type ContextIdentity = {
  career_stage: CareerStage;
  current_role: string | null;
  thinking_style: ThinkingStyle;
  decision_approach: DecisionApproach;
  /** User's own words on how they approach problems. May be null. */
  problem_framing: string | null;
  primary_learning_mode: LearningMode;
  knowledge_domains: string[];
  currently_exploring: string[];
  work_rhythm: WorkRhythm;
  energy_source: EnergySource;
  collaboration_style: CollaborationStyle;
  core_values: string[];
  motivated_by: string | null;
  strengths: string[];
  growth_areas: string[];
  industries: string[];
  career_direction: string | null;
  communication_style: CommunicationStyle;
  feedback_preference: FeedbackPreference;
  /** Free-form notes written explicitly to prime AI reasoning. */
  ai_context: string | null;
};

/**
 * Normalized background section. Derived from Credentials.
 * Null if the user has not submitted any credentials.
 */
export type ContextBackground = {
  /** Full extracted resume text. May be null if no resume was provided. */
  resume_text: string | null;
  /** GitHub profile URL as entered. May be null. */
  github_url: string | null;
  /** User-written project descriptions. Empty array if none provided. */
  projects: ProjectDescription[];
};

/**
 * LinkedIn professional context — imported from LinkedIn data export.
 * Null if the user has not imported LinkedIn data.
 */
export type ContextLinkedIn = {
  headline: string | null;
  summary: string | null;
  positions: LinkedInPosition[];
  skills: LinkedInSkill[];
  /** Most recent posts (capped at 20 for context size). */
  recent_posts: LinkedInPost[];
  post_count: number;
};

// ---------------------------------------------------------------------------
// CareerContext — the root type
// ---------------------------------------------------------------------------

export type CareerContext = {
  /** The user this context belongs to. Always present. */
  user_id: string;

  /**
   * ISO 8601 timestamp of when this context object was assembled.
   * Use this to determine staleness, not created_at of individual rows.
   */
  aggregated_at: string;

  /**
   * Indicates which sections have data. Lets AI reason about
   * completeness without inspecting each field individually.
   */
  completeness: {
    has_identity: boolean;
    has_background: boolean;
    has_decisions: boolean;
    has_proof: boolean;
    has_linkedin: boolean;
  };

  /** How the user thinks, learns, and operates. Null if not yet captured. */
  identity: ContextIdentity | null;

  /** Factual career background from resume and projects. Null if not yet provided. */
  background: ContextBackground | null;

  /**
   * Recorded career decisions with rationale and outcomes.
   * Empty array until the Decisions module is built and populated.
   */
  decisions: PastDecision[];

  /**
   * Evidence capsules the user has written.
   * Empty array until the Proof module is built and populated.
   */
  proof_capsules: ProofCapsule[];

  /**
   * LinkedIn professional context from data export.
   * Null if the user has not imported LinkedIn data.
   */
  linkedin: ContextLinkedIn | null;
};
