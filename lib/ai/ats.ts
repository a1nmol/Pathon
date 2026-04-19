/**
 * ATS Scanner AI
 *
 * Analyzes a resume against a job description and returns a structured
 * ATSScanResult with score, keyword analysis, and actionable fixes.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ATSScanResult } from "@/types/ats";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ---------------------------------------------------------------------------
// runATSScan
// ---------------------------------------------------------------------------

export async function runATSScan(
  resumeText: string,
  jobDescription: string,
  careerContext?: string,
): Promise<ATSScanResult> {
  const contextBlock = careerContext
    ? `\n## Career Context\n${careerContext}\n`
    : "";

  const system = `\
You are an expert ATS (Applicant Tracking System) analyst and resume specialist with deep knowledge of how ATS systems parse, score, and rank resumes against job descriptions.

Your job is to perform a rigorous, data-driven analysis of a resume against a job description. You identify exactly what keywords, skills, and phrases are present or absent, and you produce concrete, actionable fixes.

You must respond ONLY with a valid JSON object — no prose before or after, no markdown fences, no commentary. The JSON must exactly match this schema:

{
  "score": <integer 0-100>,
  "headline": "<one sentence summary of the match quality and primary gap>",
  "hard_skills_missing": ["<skill>", ...],
  "soft_skills_missing": ["<skill>", ...],
  "keyword_hits": ["<keyword found in both resume and JD>", ...],
  "fixes": [
    {
      "issue": "<specific problem identified in the resume>",
      "fix": "<specific, actionable instruction to fix it>",
      "capsule_id": "<optional: only if a proof capsule is referenced>",
      "capsule_claim": "<optional: the claim of the referenced capsule>"
    },
    ...
  ],
  "summary": "<2-3 sentences giving an honest overall assessment>"
}

Scoring guide:
- 80-100: Strong match. Most required skills present, good keyword density.
- 60-79: Partial match. Key skills present but gaps in language or secondary requirements.
- 40-59: Weak match. Significant skill or keyword gaps. Substantial rewrite needed.
- 0-39: Poor match. Fundamental misalignment between resume and role.

Rules:
- keyword_hits must be exact terms or close variants that appear in BOTH the resume and the JD
- hard_skills_missing: technical skills, tools, certifications, languages explicitly required by the JD but absent from the resume
- soft_skills_missing: behavioral/interpersonal traits called out in the JD not evidenced in the resume
- fixes: list 3-6 high-priority, specific fixes. Each must name the exact issue and give an exact remedy
- Do not invent skills the resume has or pad keyword_hits
- Be honest about the score — do not inflate it`;

  const userMessage = `${contextBlock}
## Resume
${resumeText}

## Job Description
${jobDescription}

Analyze this resume against the job description and return the JSON assessment.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("ATS scan: model returned no text content.");
  }

  // Strip any accidental markdown fences
  const raw = block.text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: ATSScanResult;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`ATS scan: failed to parse JSON response. Raw: ${raw.slice(0, 300)}`);
  }

  // Normalize and validate
  return {
    score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
    headline: String(parsed.headline ?? ""),
    hard_skills_missing: Array.isArray(parsed.hard_skills_missing) ? parsed.hard_skills_missing.map(String) : [],
    soft_skills_missing: Array.isArray(parsed.soft_skills_missing) ? parsed.soft_skills_missing.map(String) : [],
    keyword_hits: Array.isArray(parsed.keyword_hits) ? parsed.keyword_hits.map(String) : [],
    fixes: Array.isArray(parsed.fixes)
      ? parsed.fixes.map((f) => ({
          issue: String(f.issue ?? ""),
          fix: String(f.fix ?? ""),
          ...(f.capsule_id ? { capsule_id: String(f.capsule_id) } : {}),
          ...(f.capsule_claim ? { capsule_claim: String(f.capsule_claim) } : {}),
        }))
      : [],
    summary: String(parsed.summary ?? ""),
  };
}
