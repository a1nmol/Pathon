import { type NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/db/server";
import { appendNegotiationMessage } from "@/lib/db/salary";
import type { NegotiationMessage } from "@/types/salary";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  let body: {
    sessionId: string;
    userMessage: string;
    transcript: NegotiationMessage[];
    roleTitle: string;
    rangeData: { low: number; mid: number; high: number };
    companySize: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sessionId, userMessage, transcript, roleTitle, rangeData, companySize } = body;

  if (!sessionId || !userMessage?.trim()) {
    return NextResponse.json(
      { error: "sessionId and userMessage are required" },
      { status: 400 },
    );
  }

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companySizeLabel =
    companySize === "startup"
      ? "an early-stage startup"
      : companySize === "mid"
        ? "a mid-size company"
        : companySize === "enterprise"
          ? "a large enterprise"
          : "a competitive tech company";

  const systemPrompt = `You are a hiring manager at ${companySizeLabel}. You are negotiating compensation with a candidate for the ${roleTitle} role.

Our approved salary range for this role is $${rangeData.low.toLocaleString()} – $${rangeData.high.toLocaleString()} (base, annually). The midpoint is $${rangeData.mid.toLocaleString()}.

Negotiation guidelines:
- Be professional, realistic, and firm but fair
- Push back on requests more than 15% above the midpoint — explain budget constraints and market rates
- Be open to reasonable counter-offers within range — you want to hire good talent
- If asked for equity, mention it exists but you can't negotiate specifics in this channel
- If the candidate makes a compelling case for their value, you can move toward the high end
- Never go above the high end of the range in base salary
- Keep responses conversational and concise (2-4 sentences)
- Do not be a pushover, but don't be unnecessarily harsh either
- Acknowledge good points before pushing back`;

  // Build message history for the API
  const apiMessages: { role: "user" | "assistant"; content: string }[] = transcript.map(
    (msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }),
  );

  apiMessages.push({ role: "user", content: userMessage });

  const encoder = new TextEncoder();
  let accumulatedResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 512,
          system: systemPrompt,
          messages: apiMessages,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = event.delta.text;
            accumulatedResponse += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
        }

        // Save both messages to the transcript after streaming completes
        try {
          await appendNegotiationMessage(sessionId, user.id, {
            role: "user",
            content: userMessage,
          });
          await appendNegotiationMessage(sessionId, user.id, {
            role: "hiring_manager",
            content: accumulatedResponse,
          });
        } catch (saveErr) {
          // Non-fatal — the stream already delivered successfully
          console.error("Failed to save negotiation messages:", saveErr);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Streaming error";
        controller.enqueue(encoder.encode(`__ERROR__:${errMsg}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
