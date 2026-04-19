/**
 * Mock Interview — database operations
 *
 * All session data is persisted to `mock_interview_sessions`.
 * The transcript is an append-only JSONB array. Feedback is
 * written once when the interview is completed.
 */

import { createClient } from "@/lib/db/server";
import type {
  MockInterviewSession,
  MockInterviewMessage,
  MockInterviewFeedback,
  InterviewType,
} from "@/types/mock-interview";

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * Creates a new interview session for the given user.
 * Returns the full session object with generated id and started_at.
 */
export async function createInterviewSession(
  userId: string,
  roleContext: string,
  interviewType: InterviewType,
): Promise<MockInterviewSession> {
  const supabase = await createClient();

  const insert = {
    user_id: userId,
    role_title: roleContext || "",
    interview_type: interviewType,
    transcript: [],
    feedback: null,
    is_complete: false,
  };

  const { data, error } = await (supabase as any)
    .from("mock_interview_sessions")
    .insert(insert)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create interview session");
  }

  return data as MockInterviewSession;
}

/**
 * Fetches a single session by id, scoped to the given userId.
 * Returns null if not found or unauthorized.
 */
export async function getInterviewSession(
  sessionId: string,
  userId: string,
): Promise<MockInterviewSession | null> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("mock_interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data as MockInterviewSession;
}

/**
 * Appends a single message to the transcript array.
 * Uses Supabase's array append via RPC-style update.
 */
export async function appendTranscript(
  sessionId: string,
  userId: string,
  message: MockInterviewMessage,
): Promise<void> {
  const supabase = await createClient();

  // First fetch current transcript
  const { data: current, error: fetchError } = await (supabase as any)
    .from("mock_interview_sessions")
    .select("transcript")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !current) {
    throw new Error(fetchError?.message ?? "Session not found");
  }

  const updatedTranscript = [...(current.transcript ?? []), message];

  const { error: updateError } = await (supabase as any)
    .from("mock_interview_sessions")
    .update({ transcript: updatedTranscript })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

/**
 * Saves the final AI-generated feedback and marks the session complete.
 */
export async function saveInterviewFeedback(
  sessionId: string,
  userId: string,
  feedback: MockInterviewFeedback,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await (supabase as any)
    .from("mock_interview_sessions")
    .update({
      feedback,
      is_complete: true,
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Returns all sessions for a user, ordered newest first.
 */
export async function getUserSessions(
  userId: string,
): Promise<MockInterviewSession[]> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("mock_interview_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as MockInterviewSession[];
}
