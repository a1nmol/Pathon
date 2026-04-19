import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/db/server";
import { appendTranscript, getInterviewSession } from "@/lib/db/mock-interview";
import type { InterviewType, MockInterviewMessage } from "@/types/mock-interview";

const anthropic = new Anthropic();

// ---------------------------------------------------------------------------
// System prompt builders per interview type
// ---------------------------------------------------------------------------

function buildSystemPrompt(
  interviewType: InterviewType,
  roleContext: string,
  careerContext?: string,
): string {
  const roleBlock = roleContext
    ? `The candidate is interviewing for: ${roleContext}`
    : "No specific role context was provided.";

  const careerBlock = careerContext
    ? `\nCandidate background: ${careerContext}`
    : "";

  const typeGuidance: Record<InterviewType, string> = {
    behavioral: `You are conducting a behavioral interview. Focus on past experiences and behaviors.
- Ask questions that prompt the STAR method (Situation, Task, Action, Result)
- Probe for specific examples — do not accept vague generalities
- Follow up to extract measurable outcomes and personal impact
- Explore leadership, conflict resolution, collaboration, and failure experiences
- Keep a professional but warm tone`,

    technical: `You are conducting a technical coding interview. Focus on problem-solving depth.
- Start with a clear algorithmic or system problem appropriate for the role
- Ask the candidate to walk through their thinking before coding
- Probe edge cases, time/space complexity, and alternative approaches
- If they give a suboptimal solution, ask if there's a more efficient approach
- Evaluate both correctness and the clarity of their explanation`,

    system_design: `You are conducting a system design interview. Focus on architecture and trade-offs.
- Pose a realistic large-scale system design problem (e.g., design a URL shortener, rate limiter, or distributed cache)
- Ask the candidate to clarify requirements before diving in
- Probe capacity estimation, component choices, data modeling, and scalability
- Challenge design decisions — ask why they chose one approach over alternatives
- Evaluate trade-off reasoning, not just textbook correctness`,

    product: `You are conducting a product sense interview. Focus on product thinking.
- Ask about product improvement, metrics, user empathy, and prioritization
- Probe for structured frameworks but reward original insight over rote formulas
- Ask follow-up questions about trade-offs, success metrics, and failure modes
- Challenge assumptions — if a candidate says "users want X," ask how they know
- Evaluate creativity, user focus, and business acumen`,
  };

  const interviewGuide = typeGuidance[interviewType] ?? typeGuidance.behavioral;

  return `You are a senior interviewer at a top-tier technology company. You are rigorous, direct, and fair.

${roleBlock}${careerBlock}

## Interview Type: ${interviewType.replace("_", " ")}

${interviewGuide}

## Conduct rules
- Ask ONE clear question at a time. Never stack multiple questions.
- After the candidate answers, give a brief acknowledgment (1 sentence max), then ask a relevant follow-up or next question.
- Keep your responses concise — maximum 3 sentences unless you are posing a complex scenario.
- Do not give away answers. If the candidate is on the wrong track, ask a guiding question, not a correction.
- Do not break character. Stay in the role of an interviewer throughout.
- Start by briefly introducing yourself and asking the first interview question.`;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: {
    sessionId: string;
    userMessage: string;
    transcript: MockInterviewMessage[];
    roleContext: string;
    interviewType: InterviewType;
    careerContext?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sessionId, userMessage, transcript, roleContext, interviewType, careerContext } = body;

  if (!sessionId || !interviewType) {
    return NextResponse.json(
      { error: "sessionId and interviewType are required" },
      { status: 400 },
    );
  }

  // Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify session belongs to this user
  const session = await getInterviewSession(sessionId, user.id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.is_complete) {
    return NextResponse.json({ error: "Interview is already complete" }, { status: 409 });
  }

  // Build conversation history for Anthropic — interviewer = assistant, candidate = user
  // Filter out any empty-content messages (e.g. the silent init turn) before sending to Claude.
  const messages: Anthropic.MessageParam[] = transcript
    .filter((m) => m.content?.trim())
    .map((m) => ({
      role: m.role === "interviewer" ? "assistant" : "user",
      content: m.content.trim(),
    }));

  // Add the new user message if provided
  if (userMessage?.trim()) {
    messages.push({ role: "user", content: userMessage.trim() });
  }

  // If this is the first message (no transcript), start the interview
  if (messages.length === 0) {
    messages.push({ role: "user", content: "Please begin the interview." });
  }

  const systemPrompt = buildSystemPrompt(interviewType, roleContext, careerContext);

  // Save the candidate message to the transcript before streaming
  if (userMessage?.trim()) {
    try {
      const candidateMessage: MockInterviewMessage = {
        role: "candidate",
        content: userMessage.trim(),
        timestamp: new Date().toISOString(),
      };
      await appendTranscript(sessionId, user.id, candidateMessage);
    } catch {
      // Best-effort — do not block the response
    }
  }

  // Stream the interviewer response
  const stream = anthropic.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 512,
    system: systemPrompt,
    messages,
  });

  let fullResponse = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            fullResponse += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
        }

        // After streaming completes, persist the interviewer message
        if (fullResponse.trim()) {
          try {
            const interviewerMessage: MockInterviewMessage = {
              role: "interviewer",
              content: fullResponse.trim(),
              timestamp: new Date().toISOString(),
            };
            await appendTranscript(sessionId, user.id, interviewerMessage);
          } catch {
            // Best-effort
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Streaming error";
        controller.enqueue(new TextEncoder().encode(`\n\n__ERROR__:${errMsg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
