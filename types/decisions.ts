/**
 * Career Decision Engine output types.
 *
 * These represent what the engine produces — not what goes into it.
 * The input is always a CareerContext. The output is always a CareerPathAnalysis.
 */

/**
 * A single career path the engine has reasoned about.
 *
 * Every field must be grounded in something from the CareerContext.
 * If the engine cannot make a claim from the data, it must say so
 * explicitly — not omit the field and not fabricate.
 */
export type CareerPath = {
  /**
   * Short, concrete name for this trajectory.
   * Not a job title — a description of the direction.
   * Example: "Technical design leadership at a growth-stage company"
   */
  name: string;

  /**
   * Why this path fits THIS specific user.
   * Must reference at least one thing from their identity or background.
   * No generic framing — if it could apply to anyone, rewrite it.
   */
  fit_reasoning: string;

  /**
   * Skills, experience, or credentials the user demonstrably lacks
   * for this path. Named specifically, not categorically.
   * Example: ["managing a team of more than 3 reports", "P&L ownership"]
   * Empty array only if the user is genuinely ready now.
   */
  gaps: string[];

  /**
   * Realistic estimate of time needed to close the gaps and be ready.
   * Express as a range: "6–12 months", "2–3 years".
   * If the gaps are unclear due to missing data, say so in the value:
   * "Unclear — depends on whether the user has X (not provided)"
   */
  time_to_readiness: string;

  /**
   * Honest assessment of what could go wrong or is uncertain.
   * Includes structural risks (market, org dynamics) and personal ones
   * (growth areas that directly threaten this path).
   * Must not be softened. If the risk is high, say it is high.
   */
  risk_assessment: string;

  /**
   * Specific things the user should not do if they pursue this path.
   * Grounded in their known tendencies, gaps, or decision patterns.
   * Not generic career advice — specific to this person and path.
   */
  what_to_avoid: string[];

  /**
   * Whether this path aligns with the user's stated direction and values.
   * "aligned" — consistent with what the user said they want
   * "partial"  — some alignment, notable tensions
   * "misaligned" — the engine is surfacing this path to address it, not recommend it
   */
  alignment: "aligned" | "partial" | "misaligned";
};

/**
 * The full output of the Career Decision Engine for one invocation.
 */
export type CareerPathAnalysis = {
  /**
   * The user_id this analysis was generated for.
   * Carried through from CareerContext for traceability.
   */
  user_id: string;

  /**
   * ISO 8601 timestamp of when this analysis was generated.
   */
  generated_at: string;

  /**
   * The aggregated_at timestamp of the CareerContext this was built from.
   * Used to detect stale analyses if the context is updated.
   */
  context_snapshot_at: string;

  /**
   * 2–3 career paths, ordered from most to least aligned.
   * A misaligned path may be included as the last entry if the user's
   * stated direction contradicts the data — this must be flagged explicitly.
   */
  paths: CareerPath[];

  /**
   * Cross-cutting observations that apply regardless of path.
   * Things the engine noticed that the user should know before
   * making any decision — gaps in context, contradictions,
   * patterns across decisions, notable risks.
   * Not an executive summary. Not encouragement. Plain observations.
   */
  observations: string[];

  /**
   * What context is missing that would materially change this analysis.
   * Specific — not "more information would help."
   * Example: ["No resume provided — gap analysis is based on identity data only"]
   */
  missing_context: string[];

  /**
   * Paths or directions the engine explicitly recommends against for this user.
   * Each entry names the direction and provides a specific, grounded reason
   * why it is wrong for THIS person — not generic career wisdom.
   */
  anti_recommendations?: {
    path: string;
    reason: string;
  }[];
};
