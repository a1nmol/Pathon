import { NextRequest } from "next/server";
import { createClient } from "@/lib/db/server";
import { getUser } from "@/lib/auth/session";
import { buildCareerContext } from "@/lib/ai/context";
import { serializeContext } from "@/lib/ai/decisions";
import { fetchMarketOracle } from "@/lib/ai/market-oracle";
import { runPlannerAgent } from "@/lib/ai/architect-agent";
import { buildSyllabus } from "@/lib/ai/syllabus-builder";
import type {
  UserConstraints,
  GapAnalysisEvent,
  FullGapAnalysisSession,
} from "@/types/gap-analyzer";

function emit(
  controller: ReadableStreamDefaultController,
  event: GapAnalysisEvent,
) {
  controller.enqueue(
    new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`),
  );
}

/** Keep only the most signal-dense parts of the career context. */
function trimContext(serialized: string, maxChars = 600): string {
  if (serialized.length <= maxChars) return serialized;
  // Keep the first maxChars, cutting at a newline boundary if possible
  const cut = serialized.lastIndexOf("\n", maxChars);
  return serialized.slice(0, cut > 0 ? cut : maxChars) + "\n[... truncated for speed]";
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json()) as {
    targetRole: string;
    targetCompany?: string;
    constraints: UserConstraints;
  };
  const { targetRole, targetCompany, constraints } = body;

  if (!targetRole?.trim()) {
    return new Response("targetRole is required", { status: 400 });
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        // ── Phase 0: Oracle + Career Context (parallel, oracle hard-capped at 6s) ──
        emit(controller, { type: "oracle_start" });
        const [oracle, context] = await Promise.all([
          Promise.race([
            fetchMarketOracle(targetRole.trim(), targetCompany?.trim() || undefined).catch(() => null),
            new Promise<null>((r) => setTimeout(() => r(null), 6000)),
          ]),
          buildCareerContext(user.id),
        ]);

        // Truncate context hard — Haiku slows drastically on large inputs
        const serialized = trimContext(serializeContext(context), 600);
        if (oracle) emit(controller, { type: "oracle_result", data: oracle });

        // ── Phase 1: Planner ──────────────────────────────────────────────────
        emit(controller, { type: "agent_a_start" });
        const draft = await runPlannerAgent(
          targetRole.trim(),
          targetCompany?.trim() ?? null,
          serialized,
          oracle,
          constraints,
        );
        emit(controller, { type: "agent_a_draft", data: draft });

        // ── Show results immediately after planner ─────────────────────────────
        const sessionId = crypto.randomUUID();
        const partialSession: FullGapAnalysisSession = {
          id: sessionId,
          user_id: user.id,
          target_role: targetRole.trim(),
          target_company: targetCompany?.trim() ?? null,
          constraints,
          oracle,
          gaps: draft.gaps,
          readiness_score: draft.readiness_score,
          readiness_summary: draft.readiness_summary,
          critique: null,
          syllabus: [],
          created_at: new Date().toISOString(),
        };
        emit(controller, { type: "complete", data: partialSession });

        // ── Phase 2: Syllabus (background — results already visible) ──────────
        emit(controller, { type: "syllabus_start" });
        const syllabus = await buildSyllabus(
          draft.gaps.slice(0, 2), // top 2 regardless of level
          constraints,
          targetRole.trim(),
        ).catch(() => []);
        emit(controller, { type: "syllabus_result", data: syllabus });

        // ── Persist ────────────────────────────────────────────────────────────
        const supabase = await createClient();
        await (supabase as any)
          .from("gap_analysis_sessions")
          .insert({
            user_id: user.id,
            target_role: targetRole.trim(),
            target_company: targetCompany?.trim() ?? null,
            constraints,
            oracle_data: oracle,
            gaps: draft.gaps,
            readiness_score: draft.readiness_score,
            readiness_summary: draft.readiness_summary,
            critique: null,
            syllabus,
          });

      } catch (err) {
        emit(controller, {
          type: "error",
          message: err instanceof Error ? err.message : "Analysis failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
