/**
 * Proof Capsule — full database entity.
 *
 * The AI-facing summary type (ProofCapsule in types/context.ts) is a
 * flattened subset of this. When building CareerContext, map
 * ProofCapsuleRecord → ProofCapsule by joining the five sections into
 * `evidence`.
 *
 * Five sections capture the structure of a meaningful work story:
 *   context             — the situation and stakes
 *   constraints         — the real working conditions
 *   decision_reasoning  — what was decided and why, at the time
 *   iterations          — what changed, what failed, what surprised
 *   reflection          — what is understood now that wasn't then
 */

export type ProofCapsuleRecord = {
  id: string;
  user_id: string;

  /**
   * One-sentence claim this capsule evidences.
   * Written first — anchors the whole story.
   * Example: "I can lead a complex project without a manager."
   */
  claim: string;

  /** What was the situation? Stakes, players, setting. */
  context: string | null;

  /** What were the real working conditions — time, resources, politics? */
  constraints: string | null;

  /**
   * What was decided, and what was the reasoning at the time?
   * Not the outcome — the thinking that produced the decision.
   */
  decision_reasoning: string | null;

  /**
   * What changed along the way?
   * Attempts that failed, surprises, where the plan met reality.
   */
  iterations: string | null;

  /**
   * What is understood now that wasn't understood then?
   * Not what would be done differently — what was actually learned.
   */
  reflection: string | null;

  /** Tags for grouping. User-defined, not constrained. */
  tags: string[];

  /**
   * True when all five sections have at least some content.
   * Incomplete capsules are visible in the editor but excluded from
   * AI context by default.
   */
  is_complete: boolean;

  created_at: string;
  updated_at: string;
};

export type ProofCapsuleInsert = Omit<ProofCapsuleRecord, "id" | "created_at" | "updated_at">;
export type ProofCapsuleUpdate = Partial<Omit<ProofCapsuleRecord, "id" | "user_id" | "created_at" | "updated_at">>;

/**
 * A single saved revision of a proof capsule.
 * Append-only — revisions are never deleted or updated.
 */
export type ProofCapsuleRevision = {
  id: string;
  capsule_id: string;
  user_id: string;
  /** Full snapshot of all five sections at save time. */
  snapshot: Pick<
    ProofCapsuleRecord,
    "claim" | "context" | "constraints" | "decision_reasoning" | "iterations" | "reflection" | "tags"
  >;
  /** Total word count across all sections at this revision. */
  word_count: number;
  saved_at: string;
};

export type ProofCapsuleRevisionInsert = Omit<ProofCapsuleRevision, "id">;
