"use server";

import { getUser } from "@/lib/auth/session";
import { buildCareerContext } from "@/lib/ai/context";
import { runATSScan } from "@/lib/ai/ats";
import { generateCoverLetter } from "@/lib/ai/cover-letter";
import { getCachedScan, saveScan, getCachedCoverLetter, saveCoverLetter } from "@/lib/db/ats";
import { simpleHash } from "@/lib/utils/hash";
import type { ATSScanResult, CoverLetterResult } from "@/types/ats";

// ---------------------------------------------------------------------------
// scanResume
// ---------------------------------------------------------------------------

export async function scanResume(jobDescription: string): Promise<ATSScanResult> {
  const user = await getUser();
  if (!user) {
    throw new Error("Not authenticated.");
  }

  if (!jobDescription?.trim()) {
    throw new Error("Job description is required.");
  }

  const careerContext = await buildCareerContext(user.id);

  const resumeText = careerContext.background?.resume_text ?? "";
  if (!resumeText.trim()) {
    throw new Error(
      "No resume found. Please add your resume in Credentials before using the ATS Scanner.",
    );
  }

  // Build a serialized career context string for the AI
  const contextSummary = buildContextSummary(careerContext);

  const hash = simpleHash(jobDescription + resumeText);

  // Check cache first
  const cached = await getCachedScan(user.id, hash);
  if (cached) return cached;

  // Run the scan
  const result = await runATSScan(resumeText, jobDescription, contextSummary);

  // Cache the result
  await saveScan(user.id, hash, resumeText, jobDescription, result);

  return result;
}

// ---------------------------------------------------------------------------
// generateCover
// ---------------------------------------------------------------------------

export async function generateCover(
  company: string,
  role: string,
  jobDescription: string,
): Promise<CoverLetterResult> {
  const user = await getUser();
  if (!user) {
    throw new Error("Not authenticated.");
  }

  if (!company?.trim() || !role?.trim() || !jobDescription?.trim()) {
    throw new Error("Company, role, and job description are all required.");
  }

  const careerContext = await buildCareerContext(user.id);

  const resumeText = careerContext.background?.resume_text ?? "";
  if (!resumeText.trim()) {
    throw new Error(
      "No resume found. Please add your resume in Credentials before generating a cover letter.",
    );
  }

  const contextSummary = buildContextSummary(careerContext);

  const hash = simpleHash(company + role + jobDescription + resumeText);

  // Check cache first
  const cached = await getCachedCoverLetter(user.id, hash);
  if (cached) return cached;

  // Generate
  const result = await generateCoverLetter(
    resumeText,
    jobDescription,
    company,
    role,
    contextSummary,
  );

  // Cache
  await saveCoverLetter(user.id, hash, company, role, result);

  return result;
}

// ---------------------------------------------------------------------------
// Internal: build a compact career context string for the AI
// ---------------------------------------------------------------------------

function buildContextSummary(ctx: import("@/types/context").CareerContext): string {
  const lines: string[] = [];

  if (ctx.identity) {
    const id = ctx.identity;
    if (id.career_stage) lines.push(`Career stage: ${id.career_stage}`);
    if (id.current_role) lines.push(`Current role: ${id.current_role}`);
    if (id.career_direction) lines.push(`Career direction: ${id.career_direction}`);
    if (id.strengths.length) lines.push(`Strengths: ${id.strengths.join(", ")}`);
    if (id.knowledge_domains.length) lines.push(`Domains: ${id.knowledge_domains.join(", ")}`);
    if (id.industries.length) lines.push(`Industries: ${id.industries.join(", ")}`);
    if (id.core_values.length) lines.push(`Values: ${id.core_values.join(", ")}`);
    if (id.ai_context) lines.push(`Additional context: ${id.ai_context}`);
  }

  if (ctx.proof_capsules.length) {
    lines.push("\nProof capsules (evidence of past work):");
    for (const cap of ctx.proof_capsules.slice(0, 6)) {
      lines.push(`- [${cap.id}] ${cap.claim}`);
      if (cap.evidence) lines.push(`  Evidence: ${cap.evidence.slice(0, 200)}`);
    }
  }

  if (ctx.linkedin) {
    const li = ctx.linkedin;
    if (li.headline) lines.push(`\nLinkedIn headline: ${li.headline}`);
    if (li.summary) lines.push(`LinkedIn summary: ${li.summary.slice(0, 300)}`);
  }

  return lines.join("\n");
}
