import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type GapLevel = "critical" | "moderate" | "minor";

export type GapItem = {
  skill: string;
  gap_level: GapLevel;
  current_level: string;
  target_level: string;
  how_to_close: string;
  timeline_weeks: number;
};

export type GapAnalysisResult = {
  gaps: GapItem[];
  readiness_score: number;
  readiness_summary: string;
};

export async function analyzeGaps(
  targetRole: string,
  targetCompany: string | null,
  careerContextSerialized: string,
): Promise<GapAnalysisResult> {
  const companyClause = targetCompany
    ? `at ${targetCompany}`
    : "at a competitive tech company";

  const prompt = `You are an expert technical career coach with deep knowledge of hiring standards at top companies.

Analyze the following career profile against the requirements for a **${targetRole}** role ${companyClause}.

<career_profile>
${careerContextSerialized}
</career_profile>

Provide a rigorous, honest gap analysis. Do not be generous — identify real gaps that would cause a candidate to be rejected or struggle in the role.

Return ONLY a valid JSON object with this exact structure:
{
  "gaps": [
    {
      "skill": "string — the specific skill or competency being evaluated",
      "gap_level": "critical" | "moderate" | "minor",
      "current_level": "string — honest assessment of current level (1-2 sentences)",
      "target_level": "string — what the role requires (1-2 sentences)",
      "how_to_close": "string — specific, actionable resources and steps (2-4 sentences with concrete recommendations like books, courses, projects)",
      "timeline_weeks": number — realistic weeks to close this gap with focused effort
    }
  ],
  "readiness_score": number between 0 and 100,
  "readiness_summary": "string — 2-3 sentence honest assessment of overall readiness, strengths, and biggest obstacles"
}

Gap level definitions:
- "critical": A deal-breaker gap. Would likely result in rejection at screening or early interview stages. Must be addressed before applying.
- "moderate": Significant gap that would surface in interviews. Could be compensated with strong performance elsewhere but should be addressed.
- "minor": Small gap that might come up but wouldn't disqualify. Nice-to-have improvements.

Include 5-10 gaps total covering technical skills, soft skills, and domain knowledge.
Readiness score: 0-30 = not ready, 31-50 = significant work needed, 51-74 = getting there, 75-89 = strong candidate with gaps, 90-100 = exceptional fit.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse gap analysis response: no JSON found");
  }

  const parsed = JSON.parse(jsonMatch[0]) as GapAnalysisResult;

  // Validate structure
  if (
    !Array.isArray(parsed.gaps) ||
    typeof parsed.readiness_score !== "number" ||
    typeof parsed.readiness_summary !== "string"
  ) {
    throw new Error("Invalid gap analysis response structure");
  }

  return parsed;
}
