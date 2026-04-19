/**
 * Cover Letter Generator AI
 *
 * Generates a tailored, professional cover letter from resume text and
 * a job description, returning subject line, full body, and tone notes.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { CoverLetterResult } from "@/types/ats";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ---------------------------------------------------------------------------
// generateCoverLetter
// ---------------------------------------------------------------------------

export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  company: string,
  role: string,
  careerContext?: string,
): Promise<CoverLetterResult> {
  const contextBlock = careerContext
    ? `\n## Career Context (use to inform tone and narrative)\n${careerContext}\n`
    : "";

  const system = `\
You are an expert cover letter writer who has helped thousands of candidates land roles at top companies. You write letters that are specific, confident, and human — not generic boilerplate.

You must respond ONLY with a valid JSON object — no prose before or after, no markdown fences. The JSON must exactly match this schema:

{
  "subject_line": "<email subject line for the application, concise and compelling>",
  "body": "<the full cover letter text, ready to copy-paste>",
  "tone_notes": "<1-2 sentences explaining the tone choices and how the letter was tailored>"
}

Cover letter principles:
- Open with a specific hook — a concrete achievement or shared context, not "I am writing to apply"
- Connect the candidate's most relevant experience directly to the role's key requirements
- Address the company by name and demonstrate genuine knowledge of what they do
- Keep it to 3-4 tight paragraphs — one page maximum
- Close with a clear, confident call to action — not begging or hedging
- Match the register of the company and role (startup vs enterprise, technical vs business)
- Draw from proof capsule evidence if provided in the career context — use specific numbers and outcomes
- Never use: "I am a passionate", "team player", "fast learner", "hard worker", "I would love to"
- Never use hollow openers or closers

Subject line format: short, specific, professional. Example: "Application — Senior Product Designer, [Company]" or "[Name] — [Role Title] Application"

The body should be plain text paragraphs (no markdown, no bullet points, no headers). Use natural paragraph breaks.`;

  const userMessage = `${contextBlock}
## Resume
${resumeText}

## Job Description
${jobDescription}

## Target Company
${company}

## Target Role
${role}

Write a cover letter for this application and return the JSON result.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Cover letter: model returned no text content.");
  }

  // Strip any accidental markdown fences
  const raw = block.text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: CoverLetterResult;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Cover letter: failed to parse JSON response. Raw: ${raw.slice(0, 300)}`);
  }

  return {
    subject_line: String(parsed.subject_line ?? ""),
    body: String(parsed.body ?? ""),
    tone_notes: String(parsed.tone_notes ?? ""),
  };
}
