/**
 * Skill Intelligence — node types for the constellation visualization.
 *
 * SkillNode is the normalized unit. It is derived from CareerIdentity
 * and CareerPathAnalysis before being passed to the component.
 * The component never reads raw DB rows.
 */

/**
 * The source of this skill in the user's data.
 *
 * owned      — from knowledge_domains or strengths (user has it now)
 * exploring  — from currently_exploring (in progress)
 * gap        — from CareerPath.gaps (identified as missing by the engine)
 */
export type SkillStatus = "owned" | "exploring" | "gap";

export type SkillNode = {
  /** Display label. Used as the identity key — must be unique across nodes. */
  label: string;

  /**
   * How much this skill unlocks other skills or paths.
   * 0–1. Controls sphere radius.
   * Set by the builder; defaults to 0.5 for most skills.
   * Foundational skills (communication, systems thinking) receive higher values.
   */
  leverage: number;

  /**
   * How current and in-demand this skill is.
   * 0–1. Controls opacity.
   * Gaps are always 0.35 (present but clearly absent).
   * Exploring skills are 0.6.
   * Owned skills are 0.85–1.0.
   */
  relevance: number;

  status: SkillStatus;

  /**
   * Labels of other SkillNodes this skill transfers to or from.
   * Transferability is symmetric — if A lists B, B should list A.
   * Controls edge visibility and proximity in layout.
   */
  related: string[];
};
