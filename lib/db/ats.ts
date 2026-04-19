/**
 * ATS Scanner + Cover Letter — database operations.
 *
 * Uses (supabase as any) for tables not yet in the generated type definitions.
 * Tables expected:
 *   ats_scan_results   (id, user_id, hash, resume_text, job_description, result jsonb, created_at)
 *   cover_letters      (id, user_id, hash, company, role, result jsonb, created_at)
 */

import { createClient } from "@/lib/db/server";
import type { ATSScanResult, CoverLetterResult } from "@/types/ats";

// ---------------------------------------------------------------------------
// ATS Scan Results
// ---------------------------------------------------------------------------

export async function getCachedScan(
  userId: string,
  hash: string,
): Promise<ATSScanResult | null> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("ats_scan_results")
    .select("result")
    .eq("user_id", userId)
    .eq("input_hash", hash)
    .maybeSingle();

  if (error || !data) return null;

  return data.result as ATSScanResult;
}

export async function saveScan(
  userId: string,
  hash: string,
  resumeText: string,
  jobDescription: string,
  result: ATSScanResult,
): Promise<void> {
  const supabase = await createClient();

  await (supabase as any)
    .from("ats_scan_results")
    .upsert(
      {
        user_id: userId,
        input_hash: hash,
        resume_text: resumeText,
        job_description: jobDescription,
        result,
      },
      { onConflict: "user_id,input_hash" },
    );
}

// ---------------------------------------------------------------------------
// Cover Letters
// ---------------------------------------------------------------------------

export async function getCachedCoverLetter(
  userId: string,
  hash: string,
): Promise<CoverLetterResult | null> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("cover_letters")
    .select("result")
    .eq("user_id", userId)
    .eq("input_hash", hash)
    .maybeSingle();

  if (error || !data) return null;

  return data.result as CoverLetterResult;
}

export async function saveCoverLetter(
  userId: string,
  hash: string,
  company: string,
  role: string,
  result: CoverLetterResult,
): Promise<void> {
  const supabase = await createClient();

  await (supabase as any)
    .from("cover_letters")
    .upsert(
      {
        user_id: userId,
        input_hash: hash,
        company,
        role,
        result,
      },
      { onConflict: "user_id,input_hash" },
    );
}
