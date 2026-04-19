/**
 * Career State Memory
 *
 * Tracks how the user's career thinking evolves over time.
 * Everything here is observational — what happened, what the user did,
 * what they didn't do. No scores, no labels, no psychological inference.
 *
 * Three tables, three responsibilities:
 *
 *   path_snapshots     — stores every CareerPathAnalysis the engine generated
 *   path_responses     — stores what the user did with each suggested path
 *   behavior_log       — stores discrete observable events over time
 *
 * The memory system is append-only by convention. Nothing is deleted.
 * Past state is never overwritten — new rows record new state.
 */

import type { CareerPath, CareerPathAnalysis } from "./decisions";

// ---------------------------------------------------------------------------
// path_snapshots
// One row per engine invocation. Stores the full analysis as JSONB so
// the exact paths, reasoning, and gaps are preserved at the moment of generation.
// ---------------------------------------------------------------------------

export type PathSnapshot = {
  id: string;
  user_id: string;

  /**
   * The full CareerPathAnalysis output from the engine.
   * Stored verbatim — never mutated after insert.
   */
  analysis: CareerPathAnalysis;

  /**
   * The aggregated_at timestamp of the CareerContext that produced this analysis.
   * Matches analysis.context_snapshot_at — duplicated here for query efficiency.
   */
  context_snapshot_at: string;

  created_at: string;
};

export type PathSnapshotInsert = Omit<PathSnapshot, "id" | "created_at">;

// ---------------------------------------------------------------------------
// path_responses
// One row per path per user action. A single snapshot may produce multiple
// response rows — one per path the user interacted with.
// ---------------------------------------------------------------------------

/**
 * What the user did with a suggested career path.
 *
 * pursuing       — user has indicated they are actively working toward this path
 * considering    — user is treating it as a live option but hasn't committed
 * dismissed      — user has explicitly rejected this path
 * deferred       — user acknowledged it but set it aside for later
 */
export type PathResponseAction = "pursuing" | "considering" | "dismissed" | "deferred";

export type PathResponse = {
  id: string;
  user_id: string;

  /** The snapshot this response is attached to. */
  snapshot_id: string;

  /**
   * The name field of the CareerPath the user responded to.
   * Stored as a string (not a FK) because paths have no stable ID —
   * they are regenerated on each engine invocation.
   */
  path_name: string;

  /** What the user did. */
  action: PathResponseAction;

  /**
   * Optional free-text note the user wrote when taking this action.
   * Not analyzed — stored verbatim for future context.
   */
  note: string | null;

  responded_at: string;
};

export type PathResponseInsert = Omit<PathResponse, "id">;

// ---------------------------------------------------------------------------
// behavior_log
// Discrete, observable events. Not interpreted — recorded.
// The event_type enum is the controlled vocabulary. Everything else is JSONB.
// ---------------------------------------------------------------------------

/**
 * Observable event types.
 *
 * analysis_generated    — engine ran and produced a CareerPathAnalysis
 * path_pursued          — user marked a path as actively pursuing
 * path_dismissed        — user dismissed a path
 * path_deferred         — user deferred a path
 * advice_ignored        — a path was shown, no response was ever recorded
 * direction_changed     — user updated career_direction in their identity
 * identity_updated      — any identity field was changed
 * credentials_updated   — resume or project data was updated
 * path_revisited        — user responded to a path they had previously dismissed or deferred
 */
export type BehaviorEventType =
  | "analysis_generated"
  | "path_pursued"
  | "path_dismissed"
  | "path_deferred"
  | "advice_ignored"
  | "direction_changed"
  | "identity_updated"
  | "credentials_updated"
  | "path_revisited";

/**
 * Metadata shapes for each event type.
 * Union discriminated by event_type — callers must match.
 */
export type BehaviorEventMeta =
  | { event_type: "analysis_generated"; snapshot_id: string; path_count: number }
  | { event_type: "path_pursued"; snapshot_id: string; path_name: string; previous_action: PathResponseAction | null }
  | { event_type: "path_dismissed"; snapshot_id: string; path_name: string; alignment: CareerPath["alignment"] }
  | { event_type: "path_deferred"; snapshot_id: string; path_name: string }
  | { event_type: "advice_ignored"; snapshot_id: string; path_name: string; days_elapsed: number }
  | { event_type: "direction_changed"; previous: string | null; current: string | null }
  | { event_type: "identity_updated"; fields_changed: string[] }
  | { event_type: "credentials_updated"; fields_changed: string[] }
  | { event_type: "path_revisited"; snapshot_id: string; path_name: string; previous_action: PathResponseAction; new_action: PathResponseAction }

export type BehaviorEvent = {
  id: string;
  user_id: string;
  event_type: BehaviorEventType;
  /**
   * Structured metadata for this event.
   * Shape is determined by event_type — see BehaviorEventMeta.
   */
  meta: BehaviorEventMeta;
  occurred_at: string;
};

export type BehaviorEventInsert = Omit<BehaviorEvent, "id">;

// ---------------------------------------------------------------------------
// CareerStateMemory
// The assembled view of all memory for one user.
// Built by the memory reader — not stored as a row.
// ---------------------------------------------------------------------------

/**
 * A pattern detected across the behavior log.
 * Purely observational — describes frequency and recency, not cause.
 */
export type ObservedPattern = {
  /**
   * Machine-readable label for downstream consumers (e.g. the AI prompt).
   *
   * recurring_dismissal   — dismissed aligned paths more than once
   * repeated_deferral     — deferred the same category of path multiple times
   * direction_instability — career_direction has changed 2+ times
   * low_engagement        — analyses generated but no paths ever responded to
   * pursuit_commitment    — marked at least one path as pursuing and sustained it
   */
  kind:
    | "recurring_dismissal"
    | "repeated_deferral"
    | "direction_instability"
    | "low_engagement"
    | "pursuit_commitment"
    | "friction_detected";

  /** Plain description of what was observed. Not a judgment. */
  description: string;

  /** Number of events that form this pattern. */
  event_count: number;

  /** ISO timestamp of the most recent event contributing to this pattern. */
  last_seen_at: string;
};

export type CareerStateMemory = {
  user_id: string;

  /** ISO timestamp of when this object was assembled. */
  assembled_at: string;

  /** Every analysis the engine has produced for this user, newest first. */
  snapshots: PathSnapshot[];

  /** Every path response the user has made, newest first. */
  responses: PathResponse[];

  /**
   * Paths the user is currently marked as pursuing.
   * Derived from responses — the most recent action per path_name.
   */
  active_pursuits: PathResponse[];

  /**
   * Paths the user has dismissed across all sessions.
   * Multiple dismissals of differently-named paths with the same alignment
   * is a signal — surfaced in patterns.
   */
  dismissed_paths: PathResponse[];

  /** Full chronological event log, newest first. */
  events: BehaviorEvent[];

  /**
   * Detected behavioral patterns.
   * Computed at assembly time from the event log.
   * Empty if insufficient history exists.
   */
  patterns: ObservedPattern[];
};
