/**
 * Resume Screener AI
 *
 * Takes multiple resume texts + a job description and returns
 * a structured score and analysis for each candidate.
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ResumeScreenResult {
  name: string;
  email: string;
  overall_score: number;          // 0-100
  technical_fit: number;          // 0-100
  experience_match: number;       // 0-100
  culture_signals: number;        // 0-100
  growth_trajectory: number;      // 0-100
  fit_summary: string;            // 2-3 sentence verdict
  strengths: string[];            // 3 concrete strengths
  gaps: string[];                 // 2-3 gaps vs JD
  interview_questions: string[];  // 3 tailored questions
  recommendation: "strong_yes" | "yes" | "maybe" | "no";
}

export async function screenResumes(
  resumes: { name: string; email: string; text: string }[],
  jobTitle: string,
  jobDescription: string,
  requirements: string[],
): Promise<ResumeScreenResult[]> {
  const reqList = requirements.length > 0
    ? requirements.map((r) => `- ${r}`).join("\n")
    : "Not specified";

  const resumeBlocks = resumes
    .map((r, i) =>
      `<resume index="${i}" name="${r.name}" email="${r.email}">\n${r.text}\n</resume>`
    )
    .join("\n\n");

  const prompt = `You are an expert talent screener. Evaluate each candidate resume against this job and return a JSON array.

## Job Title
${jobTitle}

## Job Description
${jobDescription}

## Requirements
${reqList}

## Resumes to Evaluate
${resumeBlocks}

Return a JSON array (one object per resume, same order) with this exact structure:
[
  {
    "name": "Candidate Name",
    "email": "email@example.com",
    "overall_score": 78,
    "technical_fit": 82,
    "experience_match": 75,
    "culture_signals": 70,
    "growth_trajectory": 85,
    "fit_summary": "Strong frontend engineer with 4 years React experience. Missing the backend depth the role requires but shows rapid learning. Culture signals indicate high ownership mentality.",
    "strengths": ["4 years of React/TypeScript matching core requirement", "Led 3 product launches showing ownership", "Active OSS contributor showing passion for craft"],
    "gaps": ["No experience with Node.js or backend systems", "Only 1 leadership experience vs 2+ required"],
    "interview_questions": ["Walk me through how you'd approach adding server-side rendering to a large existing React app.", "Tell me about a time you had to learn a new technology stack quickly under pressure.", "How do you handle code review feedback you disagree with?"],
    "recommendation": "yes"
  }
]

Scoring rubric:
- technical_fit: How well their skills match the technical requirements (0-100)
- experience_match: Years/type/level of experience vs what's needed (0-100)
- culture_signals: Ownership, growth mindset, communication signals from resume (0-100)
- growth_trajectory: Is their career accelerating? Are they leveling up fast? (0-100)
- overall_score: Weighted average (technical_fit 40%, experience_match 35%, culture_signals 15%, growth_trajectory 10%)
- recommendation: "strong_yes" (85+), "yes" (70-84), "maybe" (50-69), "no" (<50)

Be honest and critical. Not everyone should score highly. Return ONLY the JSON array.`;

  const message = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  // Extract JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("AI did not return valid JSON");

  return JSON.parse(jsonMatch[0]) as ResumeScreenResult[];
}

export async function screenSingleResume(
  name: string,
  email: string,
  resumeText: string,
  jobTitle: string,
  jobDescription: string,
  requirements: string[],
): Promise<ResumeScreenResult> {
  const results = await screenResumes(
    [{ name, email, text: resumeText }],
    jobTitle,
    jobDescription,
    requirements,
  );
  return results[0];
}
