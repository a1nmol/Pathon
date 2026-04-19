import Anthropic from "@anthropic-ai/sdk";
import type { MarketOracleResult } from "@/types/gap-analyzer";

const anthropic = new Anthropic();

export async function fetchMarketOracle(
  role: string,
  company?: string,
): Promise<MarketOracleResult> {
  const companyClause = company ? ` at ${company}` : "";
  const companyIntelField = company
    ? `,\n  "company_intel": "<1-2 sentences on what ${company} looks for>"`
    : "";

  const prompt = `Market intelligence for "${role}"${companyClause} in 2026. Return ONLY valid JSON:
{
  "salary_min": <USD annual min>,
  "salary_max": <USD annual max>,
  "salary_currency": "USD",
  "demand_growth_pct": <YoY % e.g. 22>,
  "demand_signal": "very high" | "high" | "moderate" | "low",
  "hot_skills": ["skill1","skill2","skill3","skill4","skill5"],
  "emerging_roles": [
    {"title":"<role>","growth_pct":<n>,"description":"<one sentence>"},
    {"title":"<role>","growth_pct":<n>,"description":"<one sentence>"}
  ]${companyIntelField},
  "data_freshness": "estimated"
}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 700,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Oracle returned no JSON");
  return JSON.parse(jsonMatch[0]) as MarketOracleResult;
}
