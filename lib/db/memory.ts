/**
 * Career State Memory — database operations
 *
 * All writes are inserts. Nothing here updates or deletes.
 * The memory system is a log, not a mutable record.
 *
 * Reads assemble CareerStateMemory from raw rows, computing
 * patterns in application code rather than SQL to keep the
 * pattern logic testable and auditable.
 */

import { createClient } from "@/lib/db/server";
import type { CareerPathAnalysis } from "@/types/decisions";
import type {
  BehaviorEvent,
  BehaviorEventInsert,
  BehaviorEventMeta,
  BehaviorEventType,
  CareerStateMemory,
  ObservedPattern,
  PathResponse,
  PathResponseAction,
  PathResponseInsert,
  PathSnapshot,
  PathSnapshotInsert,
} from "@/types/memory";

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * Persists a CareerPathAnalysis as a path snapshot and logs the event.
 * Call this immediately after generateCareerPaths() returns ok: true.
 */
export async function saveSnapshot(
  userId: string,
  analysis: CareerPathAnalysis,
): Promise<{ snapshot_id: string } | { error: string }> {
  const supabase = await createClient();

  const insert: PathSnapshotInsert = {
    user_id: userId,
    analysis,
    context_snapshot_at: analysis.context_snapshot_at,
  };

  const { data, error } = await (supabase
    .from("path_snapshots") as unknown as {
      insert: (v: unknown) => { select: (s: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } };
    })
    .insert(insert)
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Insert returned no data" };
  }

  // Log the event — best-effort, does not block on failure
  await logEvent(userId, {
    event_type: "analysis_generated",
    snapshot_id: data.id,
    path_count: analysis.paths.length,
  });

  return { snapshot_id: data.id };
}

/**
 * Records a user's response to a suggested path.
 * Detects revisits by checking for a prior response to the same path_name.
 */
export async function recordPathResponse(
  userId: string,
  snapshotId: string,
  pathName: string,
  action: PathResponseAction,
  note?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // Check for prior response to this path (for revisit detection)
  const { data: prior } = await supabase
    .from("path_responses")
    .select("action")
    .eq("user_id", userId)
    .eq("path_name", pathName)
    .order("responded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const insert: PathResponseInsert = {
    user_id: userId,
    snapshot_id: snapshotId,
    path_name: pathName,
    action,
    note: note ?? null,
    responded_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("path_responses").insert(insert);
  if (error) return { error: error.message };

  // Log the appropriate event
  const previousAction = prior ? (prior.action as PathResponseAction) : null;

  if (prior && prior.action !== action) {
    await logEvent(userId, {
      event_type: "path_revisited",
      snapshot_id: snapshotId,
      path_name: pathName,
      previous_action: prior.action as PathResponseAction,
      new_action: action,
    });
  } else {
    const eventType = (
      {
        pursuing: "path_pursued",
        dismissed: "path_dismissed",
        deferred: "path_deferred",
        considering: "path_deferred", // considering maps to deferred event
      } as Record<PathResponseAction, BehaviorEventType>
    )[action];

    if (eventType === "path_pursued") {
      await logEvent(userId, {
        event_type: "path_pursued",
        snapshot_id: snapshotId,
        path_name: pathName,
        previous_action: previousAction,
      });
    } else if (eventType === "path_dismissed") {
      // Look up alignment from the snapshot for the dismissal log
      const { data: snapshot } = await supabase
        .from("path_snapshots")
        .select("analysis")
        .eq("id", snapshotId)
        .single();

      const analysis = snapshot?.analysis as CareerPathAnalysis | undefined;
      const path = analysis?.paths.find((p) => p.name === pathName);

      await logEvent(userId, {
        event_type: "path_dismissed",
        snapshot_id: snapshotId,
        path_name: pathName,
        alignment: path?.alignment ?? "partial",
      });
    } else {
      await logEvent(userId, {
        event_type: "path_deferred",
        snapshot_id: snapshotId,
        path_name: pathName,
      });
    }
  }

  return {};
}

/**
 * Logs an arbitrary behavior event.
 * Best-effort — callers should not block on failure.
 */
export async function logEvent(
  userId: string,
  meta: BehaviorEventMeta,
): Promise<void> {
  const supabase = await createClient();
  const insert: BehaviorEventInsert = {
    user_id: userId,
    event_type: meta.event_type,
    meta,
    occurred_at: new Date().toISOString(),
  };
  await supabase.from("behavior_log").insert(insert);
}

/**
 * Returns the most recent path snapshot for a user, or null if none exists.
 * Used by the paths page to avoid regenerating paths on every visit.
 */
export async function getLatestSnapshot(
  userId: string,
): Promise<PathSnapshot | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("path_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as PathSnapshot | null) ?? null;
}

// ---------------------------------------------------------------------------
// Read — assemble CareerStateMemory
// ---------------------------------------------------------------------------

/**
 * Assembles the full CareerStateMemory for a user from raw DB rows.
 * Computes patterns in application code.
 *
 * Returns null if the user has no memory data at all.
 */
export async function loadMemory(userId: string): Promise<CareerStateMemory> {
  const supabase = await createClient();

  const [snapshotsResult, responsesResult, eventsResult] = await Promise.all([
    supabase
      .from("path_snapshots")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("path_responses")
      .select("*")
      .eq("user_id", userId)
      .order("responded_at", { ascending: false }),
    supabase
      .from("behavior_log")
      .select("*")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false }),
  ]);

  const snapshots = (snapshotsResult.data ?? []) as PathSnapshot[];
  const responses = (responsesResult.data ?? []) as PathResponse[];
  const events = (eventsResult.data ?? []) as BehaviorEvent[];

  // Derive active pursuits: latest action per path_name = "pursuing"
  const latestByPath = new Map<string, PathResponse>();
  for (const r of [...responses].reverse()) {
    latestByPath.set(r.path_name, r);
  }
  const active_pursuits = [...latestByPath.values()].filter((r) => r.action === "pursuing");
  const dismissed_paths = [...latestByPath.values()].filter((r) => r.action === "dismissed");

  const patterns = detectPatterns(responses, events);

  return {
    user_id: userId,
    assembled_at: new Date().toISOString(),
    snapshots,
    responses,
    active_pursuits,
    dismissed_paths,
    events,
    patterns,
  };
}

// ---------------------------------------------------------------------------
// Pattern detection
// Purely observational. Describes frequency and recency. No inference.
// ---------------------------------------------------------------------------

function detectPatterns(
  responses: PathResponse[],
  events: BehaviorEvent[],
): ObservedPattern[] {
  const patterns: ObservedPattern[] = [];
  const now = new Date();

  // ── Recurring dismissal ───────────────────────────────────────────────────
  // Dismissed paths that had "aligned" alignment in their snapshot.
  const dismissalEvents = events.filter(
    (e): e is BehaviorEvent & { meta: Extract<BehaviorEventMeta, { event_type: "path_dismissed" }> } =>
      e.event_type === "path_dismissed"
  );
  const alignedDismissals = dismissalEvents.filter(
    (e) => e.meta.alignment === "aligned",
  );
  if (alignedDismissals.length >= 2) {
    patterns.push({
      kind: "recurring_dismissal",
      description: `Dismissed ${alignedDismissals.length} paths the engine marked as aligned. The dismissed paths may share a theme worth examining.`,
      event_count: alignedDismissals.length,
      last_seen_at: alignedDismissals[0]?.occurred_at ?? now.toISOString(),
    });
  }

  // ── Repeated deferral ─────────────────────────────────────────────────────
  // More than 2 distinct paths deferred and never followed up on.
  const deferredNames = new Set(
    responses.filter((r) => r.action === "deferred").map((r) => r.path_name),
  );
  const pursuedNames = new Set(
    responses.filter((r) => r.action === "pursuing").map((r) => r.path_name),
  );
  const permanentlyDeferred = [...deferredNames].filter((n) => !pursuedNames.has(n));
  if (permanentlyDeferred.length >= 2) {
    const lastDeferral = responses.find(
      (r) => r.action === "deferred" && permanentlyDeferred.includes(r.path_name),
    );
    patterns.push({
      kind: "repeated_deferral",
      description: `${permanentlyDeferred.length} paths have been deferred and not returned to.`,
      event_count: permanentlyDeferred.length,
      last_seen_at: lastDeferral?.responded_at ?? now.toISOString(),
    });
  }

  // ── Direction instability ─────────────────────────────────────────────────
  const directionChanges = events.filter((e) => e.event_type === "direction_changed");
  if (directionChanges.length >= 2) {
    patterns.push({
      kind: "direction_instability",
      description: `Career direction has been updated ${directionChanges.length} times.`,
      event_count: directionChanges.length,
      last_seen_at: directionChanges[0]?.occurred_at ?? now.toISOString(),
    });
  }

  // ── Low engagement ────────────────────────────────────────────────────────
  const generatedCount = events.filter((e) => e.event_type === "analysis_generated").length;
  const responseCount = responses.length;
  if (generatedCount >= 2 && responseCount === 0) {
    const lastGenerated = events.find((e) => e.event_type === "analysis_generated");
    patterns.push({
      kind: "low_engagement",
      description: `${generatedCount} analyses generated with no path responses recorded.`,
      event_count: generatedCount,
      last_seen_at: lastGenerated?.occurred_at ?? now.toISOString(),
    });
  }

  // ── Pursuit commitment ────────────────────────────────────────────────────
  // Marked pursuing and the response is at least 14 days old (not just a reflex).
  const sustainedPursuits = responses.filter((r) => {
    if (r.action !== "pursuing") return false;
    const age = (now.getTime() - new Date(r.responded_at).getTime()) / 86_400_000;
    return age >= 14;
  });
  if (sustainedPursuits.length >= 1) {
    patterns.push({
      kind: "pursuit_commitment",
      description: `${sustainedPursuits.length} path${sustainedPursuits.length > 1 ? "s" : ""} marked as pursuing for 14+ days.`,
      event_count: sustainedPursuits.length,
      last_seen_at: sustainedPursuits[0]?.responded_at ?? now.toISOString(),
    });
  }

  // ── Friction detected ─────────────────────────────────────────────────────
  // A specific path has been deferred 3+ times without being pursued or dismissed.
  const deferralCountByPath = new Map<string, PathResponse[]>();
  for (const r of responses) {
    if (r.action === "deferred") {
      const list = deferralCountByPath.get(r.path_name) ?? [];
      list.push(r);
      deferralCountByPath.set(r.path_name, list);
    }
  }
  for (const [pathName, deferrals] of deferralCountByPath.entries()) {
    if (deferrals.length >= 3) {
      // Only flag if this path hasn't been pursued or dismissed since
      const laterActions = responses.filter(
        (r) => r.path_name === pathName && (r.action === "pursuing" || r.action === "dismissed")
      );
      if (!laterActions.length) {
        patterns.push({
          kind: "friction_detected",
          description: `"${pathName}" has been deferred ${deferrals.length} times without being pursued or dismissed. Something may be blocking a decision here.`,
          event_count: deferrals.length,
          last_seen_at: deferrals[0]?.responded_at ?? now.toISOString(),
        });
      }
    }
  }

  return patterns;
}
