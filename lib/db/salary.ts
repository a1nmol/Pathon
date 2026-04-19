import { createClient } from "@/lib/db/server";
import type { SalaryRange, SalarySession, NegotiationMessage } from "@/types/salary";

export async function createSalarySession(
  userId: string,
  roleTitle: string,
  location: string | null,
  yearsExp: number | null,
  companySize: string | null,
  range: SalaryRange,
): Promise<SalarySession> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("salary_sessions")
    .insert({
      user_id: userId,
      role_title: roleTitle,
      location,
      years_of_exp: yearsExp,
      company_size: companySize,
      range_low: range.low,
      range_mid: range.mid,
      range_high: range.high,
      rationale: range.rationale,
      data_caveats: range.data_caveats,
      negotiation_transcript: [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create salary session: ${error.message}`);
  }

  return data as SalarySession;
}

export async function getSalarySession(
  sessionId: string,
  userId: string,
): Promise<SalarySession | null> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("salary_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch salary session: ${error.message}`);
  }

  return (data as SalarySession) ?? null;
}

export async function appendNegotiationMessage(
  sessionId: string,
  userId: string,
  message: NegotiationMessage,
): Promise<void> {
  const supabase = await createClient();

  // Fetch current transcript
  const { data, error: fetchError } = await (supabase as any)
    .from("salary_sessions")
    .select("negotiation_transcript")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch session transcript: ${fetchError.message}`);
  }

  const currentTranscript: NegotiationMessage[] =
    (data as { negotiation_transcript: NegotiationMessage[] }).negotiation_transcript ?? [];

  const { error: updateError } = await (supabase as any)
    .from("salary_sessions")
    .update({
      negotiation_transcript: [...currentTranscript, message],
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(`Failed to append negotiation message: ${updateError.message}`);
  }
}

export async function getUserSalarySessions(userId: string): Promise<SalarySession[]> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("salary_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user salary sessions: ${error.message}`);
  }

  return (data as SalarySession[]) ?? [];
}
