"use server";

import { createClient } from "@/lib/db/server";
import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { screenResumes, screenSingleResume } from "@/lib/ai/resume-screener";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type EmailType = "interview_invite" | "rejection" | "offer" | "move_forward";

export async function generateCandidateEmail(
  candidateId: string,
  jobId: string,
  emailType: EmailType,
): Promise<{ subject: string; body: string }> {
  const user = await getUser();
  if (!user) redirect("/");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const [{ data: candidate }, { data: job }, { data: company }] = await Promise.all([
    supabase.from("pipeline_candidates").select("name, email, ai_summary").eq("id", candidateId).eq("employer_id", user.id).single(),
    supabase.from("job_postings").select("title, description").eq("id", jobId).eq("user_id", user.id).single(),
    supabase.from("company_profiles").select("name").eq("user_id", user.id).maybeSingle(),
  ]);

  if (!candidate || !job) throw new Error("Data not found");

  let parsedSummary: Record<string, unknown> = {};
  try { parsedSummary = JSON.parse(candidate.ai_summary ?? "{}"); } catch { /* */ }

  const typeDescriptions: Record<EmailType, string> = {
    interview_invite: "inviting them to a formal interview (video or in-person). Be warm, give scheduling flexibility, mention next steps.",
    rejection: "professionally and kindly declining their application. Be empathetic, leave a good impression, don't give specific reasons.",
    offer: "extending a job offer. Be enthusiastic, congratulate them, mention the role.",
    move_forward: "letting them know they're moving to the next stage (phone screen). Be encouraging and brief.",
  };

  const prompt = `Write a professional recruitment email from ${company?.name ?? "our company"} to ${candidate.name} about the ${job.title} position.

Email type: ${typeDescriptions[emailType]}

Candidate context (from AI screening):
- Fit summary: ${(parsedSummary.fit_summary as string) ?? "N/A"}
- Recommendation: ${(parsedSummary.recommendation as string) ?? "N/A"}

Return a JSON object with exactly two fields:
{
  "subject": "email subject line",
  "body": "full email body with proper greeting and sign-off"
}

Keep the tone professional but human. Do not use generic templates. Return ONLY the JSON.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return valid JSON");

  return JSON.parse(jsonMatch[0]) as { subject: string; body: string };
}

interface ResumeInput {
  name: string;
  email: string;
  resumeText: string;
}

export async function bulkScreenResumes(
  jobId: string,
  resumes: ResumeInput[],
) {
  const user = await getUser();
  if (!user) redirect("/");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  // Fetch job details for context
  const { data: job, error: jobErr } = await supabase
    .from("job_postings")
    .select("title, description, requirements")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();

  if (jobErr || !job) throw new Error("Job not found");

  // Run AI screening
  const results = await screenResumes(
    resumes.map((r) => ({ name: r.name, email: r.email, text: r.resumeText })),
    job.title,
    job.description,
    job.requirements ?? [],
  );

  // Save each candidate to pipeline_candidates
  const inserted = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const input = resumes[i];

    const { data: candidate } = await supabase
      .from("pipeline_candidates")
      .insert({
        job_id: jobId,
        employer_id: user.id,
        name: result.name || input.name,
        email: result.email || input.email,
        resume_text: input.resumeText,
        stage: "applied", // Start in applied — employer moves through pipeline
        ai_score: result.overall_score,
        ai_summary: JSON.stringify({
          fit_summary: result.fit_summary,
          strengths: result.strengths,
          gaps: result.gaps,
          interview_questions: result.interview_questions,
          technical_fit: result.technical_fit,
          experience_match: result.experience_match,
          culture_signals: result.culture_signals,
          growth_trajectory: result.growth_trajectory,
          recommendation: result.recommendation,
        }),
      })
      .select("id")
      .single();

    inserted.push({ ...result, candidateId: candidate?.id });
  }

  return inserted;
}

export async function screenAndUpdateCandidate(
  candidateId: string,
  jobId: string,
) {
  const user = await getUser();
  if (!user) redirect("/");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const [{ data: candidate }, { data: job }] = await Promise.all([
    supabase
      .from("pipeline_candidates")
      .select("name, email, resume_text")
      .eq("id", candidateId)
      .eq("employer_id", user.id)
      .single(),
    supabase
      .from("job_postings")
      .select("title, description, requirements")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!candidate || !job || !candidate.resume_text) {
    throw new Error("Missing data for screening");
  }

  const result = await screenSingleResume(
    candidate.name,
    candidate.email ?? "",
    candidate.resume_text,
    job.title,
    job.description,
    job.requirements ?? [],
  );

  await supabase
    .from("pipeline_candidates")
    .update({
      ai_score: result.overall_score,
      ai_summary: JSON.stringify({
        fit_summary: result.fit_summary,
        strengths: result.strengths,
        gaps: result.gaps,
        interview_questions: result.interview_questions,
        technical_fit: result.technical_fit,
        experience_match: result.experience_match,
        culture_signals: result.culture_signals,
        growth_trajectory: result.growth_trajectory,
        recommendation: result.recommendation,
      }),
    })
    .eq("id", candidateId)
    .eq("employer_id", user.id);

  return result;
}
