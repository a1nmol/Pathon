import Anthropic from "@anthropic-ai/sdk";
import type { SalaryRange } from "@/types/salary";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function estimateSalaryRange(
  roleTitle: string,
  location: string | null,
  yearsExp: number | null,
  companySize: string | null,
  careerContextSerialized: string,
): Promise<SalaryRange> {
  const locationClause = location
    ? `in ${location}`
    : "in a major US tech hub (San Francisco, Seattle, New York, or remote)";

  const expClause =
    yearsExp !== null ? `${yearsExp} years of total experience` : "unspecified years of experience";

  const sizeClause =
    companySize === "startup"
      ? "an early-stage startup (Series A-B, <200 employees)"
      : companySize === "mid"
        ? "a mid-size company (200-2000 employees)"
        : companySize === "enterprise"
          ? "a large enterprise (2000+ employees)"
          : "a company of unspecified size";

  const prompt = `You are a compensation expert with access to 2024-2025 market data from Levels.fyi, Glassdoor, LinkedIn Salary, Radford, and Mercer surveys.

Estimate the total compensation range for the following scenario:

Role: ${roleTitle}
Location: ${locationClause}
Experience: ${expClause}
Company type: ${sizeClause}

Candidate profile:
<career_profile>
${careerContextSerialized}
</career_profile>

Using 2024-2025 compensation data, provide a realistic salary range (base salary only, in USD/year). Account for:
- The candidate's specific background, skills, and experience level
- Location cost-of-living adjustments
- Company type (startups often pay less base but offer equity; enterprises pay more stable base)
- Current market conditions and demand for this role
- The candidate's strengths and gaps relative to typical candidates for this role

Return ONLY a valid JSON object with this exact structure:
{
  "low": number (10th-25th percentile base salary, no commas or symbols),
  "mid": number (50th-60th percentile base salary, no commas or symbols),
  "high": number (75th-90th percentile base salary, no commas or symbols),
  "rationale": "string — 2-3 sentences explaining the range based on this candidate's profile, experience, and market factors",
  "data_caveats": "string — 1-2 sentences noting limitations: data freshness, location variability, total comp vs base, equity considerations"
}

All numbers must be integers representing annual USD base salary. No commas, no dollar signs.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse salary estimate response: no JSON found");
  }

  const parsed = JSON.parse(jsonMatch[0]) as SalaryRange;

  if (
    typeof parsed.low !== "number" ||
    typeof parsed.mid !== "number" ||
    typeof parsed.high !== "number" ||
    typeof parsed.rationale !== "string" ||
    typeof parsed.data_caveats !== "string"
  ) {
    throw new Error("Invalid salary estimate response structure");
  }

  return parsed;
}
