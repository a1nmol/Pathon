import Anthropic from "@anthropic-ai/sdk";
import type {
  GapAnalysisResult,
  CritiqueResult,
  UserConstraints,
  MarketOracleResult,
} from "@/types/gap-analyzer";

const anthropic = new Anthropic();

// ── Sub-Agent A: The Planner ──────────────────────────────────────────────────

export async function runPlannerAgent(
  targetRole: string,
  targetCompany: string | null,
  careerContext: string,
  oracle: MarketOracleResult | null,
  constraints: UserConstraints,
): Promise<GapAnalysisResult> {
  const marketSection = oracle
    ? `\n## Live Market Intelligence (${oracle.data_freshness})
- Compensation: $${oracle.salary_min.toLocaleString()}–$${oracle.salary_max.toLocaleString()} USD/yr
- Demand: ${oracle.demand_signal} (${oracle.demand_growth_pct > 0 ? "+" : ""}${oracle.demand_growth_pct}% YoY growth)
- Skills employers are actively hiring for RIGHT NOW: ${oracle.hot_skills.join(", ")}
${oracle.company_intel ? `- ${targetCompany} specifically: ${oracle.company_intel}` : ""}`
    : "";

  const prompt = `Gap analysis for "${targetRole}"${targetCompany ? ` at ${targetCompany}` : ""}.
${marketSection}

Candidate: ${careerContext}

Return ONLY valid JSON:
{
  "gaps": [
    {
      "skill": "<skill>",
      "gap_level": "critical"|"moderate"|"minor",
      "current_level": "<1 sentence>",
      "target_level": "<1 sentence>",
      "how_to_close": "<1-2 sentences>",
      "timeline_weeks": <integer>
    }
  ],
  "readiness_score": <0-100>,
  "readiness_summary": "<2 sentences max>"
}

List exactly 4 gaps (1-2 critical, 1-2 moderate, 0-1 minor). Be direct.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 900,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Planner agent returned no JSON");
  return JSON.parse(jsonMatch[0]) as GapAnalysisResult;
}

// ── Sub-Agent B: The Critic ───────────────────────────────────────────────────

export async function runCriticAgent(
  draft: GapAnalysisResult,
  constraints: UserConstraints,
  targetRole: string,
): Promise<CritiqueResult> {
  const situationLabels: Record<string, string> = {
    "part-time": "studying part-time (≤3 hours/day available)",
    "no-cs-degree": "no CS degree — prefers certifications & projects over academic paths",
    "zero-budget": "zero budget — free resources only (no Udemy, no paid subscriptions)",
    "career-switching": "career switcher — no direct prior experience in this field",
    "currently-employed": "currently employed full-time — very limited daytime hours",
  };

  const situationText = constraints.situation
    .map((s) => situationLabels[s] ?? s)
    .join("\n- ");

  const prompt = `You are a brutally honest feasibility reviewer. Your job is to catch every broken assumption in a career plan given the person's REAL constraints.

Target role: ${targetRole}
Time budget: ${constraints.time_budget}
Constraints:
- ${situationText || "None specified"}

Draft plan to critique:
${JSON.stringify(draft.gaps, null, 2)}

Review EVERY gap plan. Flag these failure modes:
1. Timeline impossible given the time budget (e.g. "6 weeks" for a "48-hours" budget)
2. Resources that cost money (if zero-budget)
3. Steps assuming a CS degree or formal academic path (if no-cs-degree)
4. Activities requiring full-time focus (if part-time or currently-employed)
5. Suggestions that assume prior industry experience (if career-switching)
6. Anything vague ("practice regularly", "get more experience") — must be specific

Return ONLY valid JSON:
{
  "issues": [
    {
      "gap_index": <0-indexed position in gaps array>,
      "issue": "exactly what is wrong with this specific plan",
      "feasibility_score": <0–10, 10 = fully realistic given constraints>,
      "suggested_fix": "concrete alternative that DOES fit the constraints"
    }
  ],
  "overall_feasibility": <0–10>,
  "revised_instructions": "2–3 specific sentences telling the planner what to change"
}

If fewer than 3 items need revision, still return all issues found (can be empty array if plan is solid).`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { issues: [], overall_feasibility: 7, revised_instructions: "" };
  return JSON.parse(jsonMatch[0]) as CritiqueResult;
}

// ── Sub-Agent A Revised: Apply the critique ───────────────────────────────────

export async function runRevisionAgent(
  draft: GapAnalysisResult,
  critique: CritiqueResult,
  constraints: UserConstraints,
  targetRole: string,
  targetCompany: string | null,
): Promise<GapAnalysisResult> {
  if (critique.issues.length === 0) return draft;

  const prompt = `You drafted a career gap analysis plan that was reviewed for feasibility. Apply the critique to make every recommendation actually achievable.

Target: ${targetRole}${targetCompany ? ` at ${targetCompany}` : ""}
Time budget: ${constraints.time_budget}
Constraints: ${constraints.situation.join(", ") || "none"}

Critic's instructions: "${critique.revised_instructions}"

Specific issues to fix:
${critique.issues.map((i) => `- Gap #${i.gap_index} (score ${i.feasibility_score}/10): ${i.issue} → FIX: ${i.suggested_fix}`).join("\n")}

Original draft:
${JSON.stringify(draft, null, 2)}

Revise the plan so every flagged issue is fixed. Key rules:
- If time_budget is "48-hours", NO gap plan can reference weeks of study
- If zero-budget, ONLY free resources (YouTube, free Coursera audits, GitHub, free tiers)
- If no-cs-degree, replace any "get a degree" with certifications or project portfolios
- Replace vague advice with specific, measurable actions

Return ONLY valid JSON (same structure):
{
  "gaps": [...revised gap array...],
  "readiness_score": <may adjust slightly if critique revealed new insights>,
  "readiness_summary": "updated honest summary that reflects constraints"
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return draft;
  return JSON.parse(jsonMatch[0]) as GapAnalysisResult;
}
