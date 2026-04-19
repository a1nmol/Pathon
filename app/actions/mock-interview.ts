"use server";

import { requireUser } from "@/lib/auth/session";
import {
  createInterviewSession,
  getInterviewSession,
  saveInterviewFeedback,
  getUserSessions,
} from "@/lib/db/mock-interview";
import { buildCareerContext } from "@/lib/ai/context";
import Anthropic from "@anthropic-ai/sdk";
import type {
  InterviewType,
  MockInterviewFeedback,
  MockInterviewSession,
} from "@/types/mock-interview";

const anthropic = new Anthropic();

// ---------------------------------------------------------------------------
// startInterview
// ---------------------------------------------------------------------------

/**
 * Creates a new mock interview session for the authenticated user.
 * Returns the session id which the client uses to identify the conversation.
 */
export async function startInterview(
  roleContext: string,
  interviewType: InterviewType,
): Promise<{ sessionId: string }> {
  const user = await requireUser("/");

  const session = await createInterviewSession(
    user.id,
    roleContext.trim(),
    interviewType,
  );

  return { sessionId: session.id };
}

// ---------------------------------------------------------------------------
// endInterview
// ---------------------------------------------------------------------------

/**
 * Ends a mock interview session by generating AI feedback across the full
 * transcript. Marks the session complete and persists the feedback.
 */
export async function endInterview(
  sessionId: string,
): Promise<MockInterviewFeedback> {
  const user = await requireUser("/");

  const session = await getInterviewSession(sessionId, user.id);
  if (!session) {
    throw new Error("Session not found or unauthorized");
  }

  if (session.transcript.length < 2) {
    throw new Error("Not enough conversation to generate feedback");
  }

  // Build a readable transcript for the AI
  const transcriptText = session.transcript
    .map((m) => `${m.role === "interviewer" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .join("\n\n");

  const contextInfo = session.role_title
    ? `Role being interviewed for: ${session.role_title}`
    : "No specific role context provided";

  const interviewTypeLabels: Record<InterviewType, string> = {
    behavioral: "Behavioral",
    technical: "Technical / Coding",
    system_design: "System Design",
    product: "Product Sense",
  };

  const typeLabel = interviewTypeLabels[session.interview_type] ?? session.interview_type;

  // Fetch optional career context
  let careerContextSummary = "";
  try {
    const ctx = await buildCareerContext(user.id);
    if (ctx.identity?.current_role) {
      careerContextSummary = `\nCandidate's current role: ${ctx.identity.current_role}`;
    }
  } catch {
    // Context not available — proceed without it
  }

  const systemPrompt = `You are an expert interviewer and career coach evaluating a mock interview transcript. Analyze the candidate's performance and provide structured, actionable feedback.

Interview type: ${typeLabel}
${contextInfo}${careerContextSummary}

Evaluate the candidate on these four dimensions, each scored 0-10:
- overall: Overall interview performance
- communication: Clarity, articulation, and conciseness
- specificity: Use of concrete examples, numbers, and specific details
- structure: Organization of answers (e.g. STAR method, logical flow)

Respond with ONLY valid JSON matching this exact schema:
{
  "score": {
    "overall": <number 0-10>,
    "communication": <number 0-10>,
    "specificity": <number 0-10>,
    "structure": <number 0-10>
  },
  "strengths": [<3-4 specific strengths as strings>],
  "improvements": [<3-4 specific, actionable improvement areas as strings>],
  "standout_moments": [<1-3 specific moments from the transcript that stood out, positive or negative>],
  "summary": "<2-3 sentence overall assessment in plain prose, honest and direct>"
}`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Here is the interview transcript to evaluate:\n\n${transcriptText}`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("AI returned no feedback content");
  }

  let feedback: MockInterviewFeedback;
  try {
    // Strip markdown code fences if present
    const raw = block.text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    feedback = JSON.parse(raw) as MockInterviewFeedback;
  } catch {
    throw new Error("Failed to parse AI feedback: " + block.text.slice(0, 200));
  }

  await saveInterviewFeedback(sessionId, user.id, feedback);

  return feedback;
}

// ---------------------------------------------------------------------------
// getSession
// ---------------------------------------------------------------------------

/**
 * Returns the full session for the authenticated user, or null if not found.
 */
export async function getSession(
  sessionId: string,
): Promise<MockInterviewSession | null> {
  const user = await requireUser("/");
  return getInterviewSession(sessionId, user.id);
}

// ---------------------------------------------------------------------------
// getPastSessions
// ---------------------------------------------------------------------------

/**
 * Returns all completed interview sessions for the authenticated user,
 * newest first. Used to display past session history.
 */
export async function getPastSessions(): Promise<MockInterviewSession[]> {
  const user = await requireUser("/");
  const sessions = await getUserSessions(user.id);
  return sessions.filter((s) => s.is_complete);
}
