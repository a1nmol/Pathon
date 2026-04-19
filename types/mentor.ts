/**
 * AI Shadow Mentor types.
 *
 * The mentor operates as a stateless function over two inputs:
 *   1. CareerContext    — who the user is and what they've done
 *   2. CareerStateMemory — how their thinking has evolved over time
 *
 * It does not store its own state. History is managed by the caller
 * as a standard message thread and passed on each invocation.
 */

// ---------------------------------------------------------------------------
// Message thread
// Standard assistant/user alternation. System prompt is assembled
// separately and not stored here.
// ---------------------------------------------------------------------------

export type MentorRole = "user" | "assistant";

export type MentorMessage = {
  role: MentorRole;
  content: string;
};

// ---------------------------------------------------------------------------
// Mentor invocation input
// ---------------------------------------------------------------------------

export type MentorInput = {
  /**
   * The current situation, question, or statement from the user.
   * This is the new message being added to the thread.
   */
  message: string;

  /**
   * Prior turns in this conversation, oldest first.
   * Empty on the first turn.
   */
  history: MentorMessage[];

  /**
   * The user's current career mode. Adjusts mentor tone without
   * changing the underlying reasoning or honesty requirements.
   * Optional — if absent, the mentor uses default tone.
   */
  mode?: string;
};

// ---------------------------------------------------------------------------
// Mentor response
// ---------------------------------------------------------------------------

export type MentorResponse = {
  /**
   * The mentor's reply.
   * Plain text — no markdown headers, no bullet lists unless the
   * content genuinely requires enumeration.
   */
  content: string;

  /**
   * Whether the mentor identified and challenged something in the user's
   * message. True when a pushback or reframe was issued.
   * For logging and pattern detection downstream.
   */
  challenged: boolean;

  /**
   * Whether the mentor referenced a specific past decision or behavior pattern.
   * True when memory was actively used, not just present.
   */
  referenced_memory: boolean;
};

// ---------------------------------------------------------------------------
// Streaming variant
// Used when the response is streamed to the client.
// Only the metadata fields are returned after streaming completes.
// ---------------------------------------------------------------------------

export type MentorStreamMeta = Omit<MentorResponse, "content">;
