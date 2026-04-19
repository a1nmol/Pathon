"use server";

import { createClient } from "@/lib/db/server";
import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Anthropic from "@anthropic-ai/sdk";

interface JobFormData {
  title: string;
  description: string;
  requirements: string[];
  nice_to_haves: string[];
  salary_min: string;
  salary_max: string;
  location: string;
  remote_ok: boolean;
  employment_type: string;
  status: "draft" | "active";
}

export async function createJobPosting(data: JobFormData) {
  const user = await getUser();
  if (!user) redirect("/");

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: job, error } = await (supabase as any)
    .from("job_postings")
    .insert({
      user_id: user.id,
      title: data.title,
      description: data.description,
      requirements: data.requirements,
      nice_to_haves: data.nice_to_haves,
      salary_min: data.salary_min ? parseInt(data.salary_min) : null,
      salary_max: data.salary_max ? parseInt(data.salary_max) : null,
      location: data.location || null,
      remote_ok: data.remote_ok,
      employment_type: data.employment_type,
      status: data.status,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  redirect(`/employer/jobs/${job.id}` as Parameters<typeof redirect>[0]);
}

export async function updateCandidateStage(candidateId: string, newStage: string) {
  const user = await getUser();
  if (!user) redirect("/");

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("pipeline_candidates")
    .update({ stage: newStage })
    .eq("id", candidateId)
    .eq("employer_id", user.id);

  if (error) throw new Error(error.message);
}

export async function updateCandidateNotes(candidateId: string, notes: string) {
  const user = await getUser();
  if (!user) redirect("/");

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("pipeline_candidates")
    .update({ notes })
    .eq("id", candidateId)
    .eq("employer_id", user.id);

  if (error) throw new Error(error.message);
}

export async function updateJobStatus(jobId: string, status: "draft" | "active" | "closed") {
  const user = await getUser();
  if (!user) redirect("/");

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("job_postings")
    .update({ status })
    .eq("id", jobId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

export async function deleteCandidate(candidateId: string) {
  const user = await getUser();
  if (!user) redirect("/");

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("pipeline_candidates")
    .delete()
    .eq("id", candidateId)
    .eq("employer_id", user.id);

  if (error) throw new Error(error.message);
}

export async function saveCompanyProfile(data: {
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  tech_stack?: string[];
  culture_tags?: string[];
}) {
  const user = await getUser();
  if (!user) redirect("/");

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("company_profiles")
    .upsert({ user_id: user.id, ...data }, { onConflict: "user_id" });

  if (error) throw new Error(error.message);
}

const anthropic = new Anthropic();

export async function generateJobDescription(
  title: string,
  companyName: string,
  existingRequirements: string[] = [],
): Promise<{ description: string; requirements: string[]; nice_to_haves: string[] }> {
  const user = await getUser();
  if (!user) redirect("/");

  const prompt = `You are a senior technical recruiter at a top tech company. Generate a compelling, inclusive job description for the following role.

Role: ${title}
Company: ${companyName || "a fast-growing technology company"}
${existingRequirements.length ? `Known requirements: ${existingRequirements.join(", ")}` : ""}

Return ONLY valid JSON in this exact format:
{
  "description": "3-4 paragraph job description. First paragraph: what the role does and why it matters. Second paragraph: what the team is like and how they work. Third paragraph: what success looks like in 90 days. Keep it specific, energetic, and inclusive. No buzzwords like 'rockstar' or 'ninja'.",
  "requirements": ["5-7 must-have requirements as short phrases, e.g. '3+ years TypeScript'"],
  "nice_to_haves": ["3-4 nice-to-have skills as short phrases"]
}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No response from AI");

  const raw = block.text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  return JSON.parse(raw);
}

export async function analyzeJobDescription(
  title: string,
  description: string,
  requirements: string[],
  salaryMin?: number,
  salaryMax?: number,
): Promise<{
  biasIssues: { text: string; suggestion: string }[];
  qualityIssues: string[];
  suggestions: string[];
  salaryFeedback: string;
  overallQuality: "poor" | "fair" | "good" | "excellent";
}> {
  const user = await getUser();
  if (!user) redirect("/");

  if (!title && !description) {
    return { biasIssues: [], qualityIssues: [], suggestions: [], salaryFeedback: "", overallQuality: "poor" };
  }

  const prompt = `Analyze this job description for bias, quality, and inclusivity. Be specific and actionable.

Title: ${title}
Description: ${description}
Requirements: ${requirements.join(", ")}
Salary: ${salaryMin && salaryMax ? `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}` : "Not specified"}

Return ONLY valid JSON:
{
  "biasIssues": [{ "text": "exact phrase that is problematic", "suggestion": "better alternative" }],
  "qualityIssues": ["specific quality problem, max 4"],
  "suggestions": ["concrete improvement, max 3"],
  "salaryFeedback": "one sentence about salary competitiveness or emptiness",
  "overallQuality": "poor|fair|good|excellent"
}

Bias to check: gendered words (rockstar, ninja, crush it, aggressive), exclusionary requirements (specific universities, excessive years for new tech), physical requirements not needed for the role, cultural fit language that excludes.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No response from AI");

  const raw = block.text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  return JSON.parse(raw);
}

export async function generateInterviewKit(jobId: string): Promise<{
  behavioral: string[];
  technical: string[];
  cultureAndTeam: string[];
  roleSpecific: string[];
  redFlags: string[];
}> {
  const user = await getUser();
  if (!user) redirect("/");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: job } = await supabase
    .from("job_postings")
    .select("title, description, requirements, nice_to_haves")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();

  if (!job) throw new Error("Job not found");

  const prompt = `Generate a structured interview question kit for this role.

Title: ${job.title}
Description: ${job.description?.slice(0, 400)}
Requirements: ${(job.requirements || []).join(", ")}

Return ONLY valid JSON:
{
  "behavioral": ["4-5 STAR-method behavioral questions specific to this role"],
  "technical": ["4-5 technical/skills assessment questions matching the requirements"],
  "cultureAndTeam": ["3-4 culture fit and teamwork questions"],
  "roleSpecific": ["3-4 role-specific scenario questions ('How would you handle...')"],
  "redFlags": ["3-4 questions designed to surface potential dealbreakers or red flags"]
}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No response from AI");

  const raw = block.text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  return JSON.parse(raw);
}
