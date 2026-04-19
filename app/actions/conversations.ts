"use server";

import { createClient } from "@/lib/db/server";
import { getUser } from "@/lib/auth/session";

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Load the user's saved mentor conversation.
 * Returns an empty array if no conversation exists yet.
 */
export async function loadMentorConversation(): Promise<StoredMessage[]> {
  const user = await getUser();
  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data } = await supabase
    .from("mentor_conversations")
    .select("messages")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data?.messages || !Array.isArray(data.messages)) return [];
  return data.messages as StoredMessage[];
}

/**
 * Persist the full conversation (all messages) for the current user.
 * Upserts on user_id so there is always at most one row per user.
 */
export async function saveMentorConversation(messages: StoredMessage[]): Promise<void> {
  const user = await getUser();
  if (!user) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  await supabase
    .from("mentor_conversations")
    .upsert(
      { user_id: user.id, messages, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
}

/**
 * Clear the user's saved mentor conversation.
 */
export async function clearMentorConversation(): Promise<void> {
  const user = await getUser();
  if (!user) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  await supabase
    .from("mentor_conversations")
    .delete()
    .eq("user_id", user.id);
}
