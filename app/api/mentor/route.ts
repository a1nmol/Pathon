import { createClient } from "@/lib/db/server";
import { buildCareerContext } from "@/lib/ai/context";
import { loadMemory } from "@/lib/db/memory";
import { streamMentor } from "@/lib/ai/mentor";
import { type NextRequest, NextResponse } from "next/server";
import type { MentorMessage } from "@/types/mentor";

export async function POST(req: NextRequest) {
  let body: { userId: string; message: string; history: MentorMessage[]; mode?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { userId, message, mode } = body;
  // Cap history to last 20 messages to stay within token limits while preserving recent context
  const history: MentorMessage[] = (body.history ?? []).slice(-20);

  if (!userId || !message?.trim()) {
    return NextResponse.json({ error: "userId and message are required" }, { status: 400 });
  }

  // Verify the request comes from the authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [context, memory] = await Promise.all([
    buildCareerContext(userId),
    loadMemory(userId),
  ]);

  if (!context.identity && !context.background) {
    return NextResponse.json(
      { error: "Complete your Career Identity before speaking with the mentor." },
      { status: 422 },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const result = await streamMentor(
        context,
        memory,
        { message, history, mode },
        (chunk) => controller.enqueue(encoder.encode(chunk)),
      );

      if (!result.ok) {
        controller.enqueue(encoder.encode(`\n\n__ERROR__:${result.error}`));
      }

      controller.close();
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
