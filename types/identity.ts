/**
 * Career Identity
 *
 * A structured model of how a user thinks, learns, and operates.
 * Every field exists to change how AI reasoning is applied — not for display.
 * Constrained fields (enums) give the model reliable signal to act on;
 * free-text fields provide nuance that enums can't capture.
 */

// ---------------------------------------------------------------------------
// Enum types
// These map 1:1 to Postgres enums in the migration.
// ---------------------------------------------------------------------------

/**
 * How the person naturally processes a problem before acting on it.
 *
 * analytical      → breaks things into components, seeks root cause
 * creative        → generates many possibilities, connects unrelated ideas
 * strategic       → zooms out, prioritizes leverage and long-term position
 * pragmatic       → moves fast, values working solutions over perfect ones
 * systems_thinker → focuses on relationships, feedback loops, emergent behavior
 */
export type ThinkingStyle =
  | "analytical"
  | "creative"
  | "strategic"
  | "pragmatic"
  | "systems_thinker";

/**
 * How the person reaches decisions when options exist.
 *
 * data_driven         → relies on metrics, evidence, and structured comparison
 * intuition_led       → trusts pattern-recognition built from experience
 * consensus_seeking   → validates through others before committing
 * structured_process  → follows a defined framework (pro/con, decision matrix, etc.)
 */
export type DecisionApproach =
  | "data_driven"
  | "intuition_led"
  | "consensus_seeking"
  | "structured_process";

/**
 * The mode of engagement through which new knowledge actually sticks.
 *
 * building    → learns by building something real
 * reading     → learns through documentation, books, written material
 * discussing  → learns by talking through ideas with others
 * observing   → learns by watching others then replicating
 * teaching    → learns by explaining to someone else
 */
export type LearningMode = "building" | "reading" | "discussing" | "observing" | "teaching";

/**
 * The natural energy and pacing pattern of how they do their best work.
 *
 * deep_focus   → needs long uninterrupted blocks; context-switching is costly
 * collaborative → energized by working alongside others in real time
 * sprint_rest  → intense short bursts followed by deliberate recovery
 * steady_pace  → consistent daily output, avoids extremes
 */
export type WorkRhythm = "deep_focus" | "collaborative" | "sprint_rest" | "steady_pace";

/**
 * Where the person draws energy from in work contexts.
 * Affects collaboration assumptions and communication defaults.
 */
export type EnergySource = "introvert" | "extrovert" | "ambivert";

/**
 * The team configuration in which the person does their best work.
 *
 * independent → works best alone; collaboration is occasional and time-boxed
 * pair        → thrives with one trusted partner
 * small_team  → 3–6 people; tight coordination, high trust
 * large_team  → comfortable navigating larger orgs, multiple stakeholders
 */
export type CollaborationStyle = "independent" | "pair" | "small_team" | "large_team";

/**
 * How the person naturally packages and delivers information to others.
 *
 * direct      → bottom line first, minimal hedging
 * diplomatic  → attends to relationship alongside content
 * detailed    → thorough, prefers completeness over brevity
 * high_level  → prefers headlines and decisions, not implementation detail
 */
export type CommunicationStyle = "direct" | "diplomatic" | "detailed" | "high_level";

/**
 * How the person prefers to receive feedback, critique, or correction.
 *
 * blunt       → wants unvarnished truth immediately
 * balanced    → wants the positive named alongside the problem
 * encouraging → needs the relationship preserved; critique should feel safe
 */
export type FeedbackPreference = "blunt" | "balanced" | "encouraging";

/**
 * Approximate position in career arc.
 * Informs how much foundational context AI should assume.
 *
 * early     → 0–3 years; building fundamentals
 * mid       → 3–7 years; developing judgment and ownership
 * senior    → 7–12 years; leads delivery, shapes standards
 * lead      → cross-team scope, strategic influence, people development
 * executive → org-level accountability, abstract reasoning at scale
 * founder   → building something from scratch; wears many hats
 */
export type CareerStage = "early" | "mid" | "senior" | "lead" | "executive" | "founder";

// ---------------------------------------------------------------------------
// Core type
// ---------------------------------------------------------------------------

export type CareerIdentity = {
  id: string;

  /** References auth.users. One row per user (unique constraint on DB). */
  user_id: string;

  // --- Cognitive style ---

  /** Primary mode of processing problems. Governs how AI frames explanations. */
  thinking_style: ThinkingStyle;

  /**
   * How the person arrives at a decision when multiple options exist.
   * AI uses this to calibrate whether to lead with data, options, or a recommendation.
   */
  decision_approach: DecisionApproach;

  /**
   * Free-form description of how the person approaches novel problems.
   * Captures nuance that the enum can't — their own words matter here.
   * Example: "I usually draw the system first, then work backwards to what's broken."
   */
  problem_framing: string | null;

  // --- Learning ---

  /**
   * The mode through which the person most reliably learns.
   * AI uses this to decide whether to show code, link docs, suggest a conversation,
   * or recommend teaching the concept to someone else.
   */
  primary_learning_mode: LearningMode;

  /**
   * Domains where the person has built deep knowledge.
   * Informs which concepts AI can reference without explanation.
   * Example: ["distributed systems", "product strategy", "React"]
   */
  knowledge_domains: string[];

  /**
   * Topics or skills the person is actively building right now.
   * Informs AI suggestions, resources, and framing of novel topics.
   */
  currently_exploring: string[];

  // --- Work patterns ---

  /**
   * Natural energy and pacing pattern.
   * AI uses this to structure suggestions (e.g., don't recommend constant async
   * loops to a deep-focus person; don't suggest solo isolation to a collaborator).
   */
  work_rhythm: WorkRhythm;

  /**
   * Whether the person draws energy from or expends it in social interaction.
   * Affects collaboration advice and meeting-load recommendations.
   */
  energy_source: EnergySource;

  /**
   * The team configuration where the person does their best work.
   * AI uses this when advising on role fit, team design, or ways of working.
   */
  collaboration_style: CollaborationStyle;

  // --- Values & motivation ---

  /**
   * Up to five words or short phrases that represent the person's professional values.
   * AI uses this to align suggestions with what the person actually cares about.
   * Example: ["craft", "autonomy", "impact", "honesty", "growth"]
   */
  core_values: string[];

  /**
   * Narrative description of what drives the person professionally.
   * Richer than core_values — captures the "why behind the why."
   * Example: "I'm most alive when I'm building something no one has built before..."
   */
  motivated_by: string | null;

  // --- Strengths & growth ---

  /**
   * Skills, traits, or behaviors the person reliably excels at.
   * AI uses this to leverage strengths when suggesting approaches.
   */
  strengths: string[];

  /**
   * Areas the person has consciously identified as needing development.
   * AI uses this to offer stretch suggestions and avoid routing around growth edges.
   */
  growth_areas: string[];

  // --- Career ---

  /** Current role title. Provides anchoring context for seniority and scope. */
  current_role: string | null;

  /**
   * Approximate position in career arc.
   * Governs how much foundational context AI assumes or provides.
   */
  career_stage: CareerStage;

  /**
   * Industry domains the person has worked in or is targeting.
   * Example: ["fintech", "climate tech", "developer tools"]
   */
  industries: string[];

  /**
   * Where the person wants to be in their career.
   * AI uses this to evaluate whether suggestions align with their trajectory.
   */
  career_direction: string | null;

  // --- Communication ---

  /**
   * How the person naturally communicates.
   * AI mirrors this style in responses to reduce friction.
   */
  communication_style: CommunicationStyle;

  /**
   * How the person wants feedback, critique, or corrections delivered.
   * AI should never deliver feedback in a style inconsistent with this.
   */
  feedback_preference: FeedbackPreference;

  // --- AI context ---

  /**
   * Open-ended notes the person writes to prime AI reasoning.
   * Anything that doesn't fit the structured fields goes here.
   * Example: "I tend to underestimate scope. Push back when I seem overconfident."
   */
  ai_context: string | null;

  created_at: string;
  updated_at: string;
};

/** Subset used when creating a new identity — id and timestamps are server-generated. */
export type CareerIdentityInsert = Omit<CareerIdentity, "id" | "created_at" | "updated_at">;

/** Partial update type — all fields except id and user_id are optional. */
export type CareerIdentityUpdate = Partial<Omit<CareerIdentity, "id" | "user_id" | "created_at" | "updated_at">>;
