/**
 * Career State Memory — example state transitions.
 *
 * Reference-only. Shows three chronological sessions for the same user.
 * Each session shows what was written to the DB and what state looks like after.
 * Never import this in production code.
 */

import type { CareerStateMemory, PathSnapshot, PathResponse, BehaviorEvent } from "@/types/memory";

// Shared user
const USER_ID = "a3f7c821-0b2e-4d58-9e1a-000000000001";

// ---------------------------------------------------------------------------
// Session 1 — April 8
// Engine runs for the first time. User dismisses the fractional path,
// marks the startup path as pursuing, defers the Head of Design path.
// ---------------------------------------------------------------------------

const snapshot_1: PathSnapshot = {
  id: "snap-0001",
  user_id: USER_ID,
  context_snapshot_at: "2026-04-08T14:32:00.000Z",
  created_at: "2026-04-08T14:33:21.000Z",
  analysis: {
    user_id: USER_ID,
    generated_at: "2026-04-08T14:33:21.000Z",
    context_snapshot_at: "2026-04-08T14:32:00.000Z",
    paths: [
      {
        name: "Design lead at a technically ambitious, small-team startup",
        alignment: "aligned",
        fit_reasoning: "Matches stated direction and confirmed by decision history.",
        gaps: ["No documented hiring experience", "AI strategy not yet demonstrated"],
        time_to_readiness: "3–9 months",
        risk_assessment: "Scope underestimation is a live risk in unstructured environments.",
        what_to_avoid: ["Joining a company that wants a design executor, not a strategic partner"],
      },
      {
        name: "Head of Design at a Series A–B fintech company",
        alignment: "partial",
        fit_reasoning: "Background fits but management gap is real.",
        gaps: ["No direct reports documented", "Managing up is a growth area"],
        time_to_readiness: "12–24 months",
        risk_assessment: "The tension between wanting to be close to the work and managing a team is structural.",
        what_to_avoid: ["Inheriting a team of more than 5 without management experience"],
      },
      {
        name: "Independent design advisor or fractional design lead",
        alignment: "misaligned",
        fit_reasoning: "Surfaced to address it, not recommend it.",
        gaps: ["No client acquisition experience", "Deep-focus rhythm conflicts with context-switching"],
        time_to_readiness: "Could begin immediately but is premature.",
        risk_assessment: "Optimizes for preferences while bypassing growth areas.",
        what_to_avoid: ["Using fractional work as a bridge without a concrete re-entry plan"],
      },
    ],
    observations: ["Decision history shows consistent rejection of scale and maintenance."],
    missing_context: ["No data on compensation constraints."],
  },
};

const responses_after_session_1: PathResponse[] = [
  {
    id: "resp-0001",
    user_id: USER_ID,
    snapshot_id: "snap-0001",
    path_name: "Design lead at a technically ambitious, small-team startup",
    action: "pursuing",
    note: "This is exactly where I want to go. Starting to map companies.",
    responded_at: "2026-04-08T15:10:00.000Z",
  },
  {
    id: "resp-0002",
    user_id: USER_ID,
    snapshot_id: "snap-0001",
    path_name: "Head of Design at a Series A–B fintech company",
    action: "deferred",
    note: null,
    responded_at: "2026-04-08T15:12:00.000Z",
  },
  {
    id: "resp-0003",
    user_id: USER_ID,
    snapshot_id: "snap-0001",
    path_name: "Independent design advisor or fractional design lead",
    action: "dismissed",
    note: "Not what I want. Confirms my instinct.",
    responded_at: "2026-04-08T15:13:00.000Z",
  },
];

const events_after_session_1: BehaviorEvent[] = [
  {
    id: "evt-0001",
    user_id: USER_ID,
    event_type: "analysis_generated",
    meta: { event_type: "analysis_generated", snapshot_id: "snap-0001", path_count: 3 },
    occurred_at: "2026-04-08T14:33:21.000Z",
  },
  {
    id: "evt-0002",
    user_id: USER_ID,
    event_type: "path_pursued",
    meta: {
      event_type: "path_pursued",
      snapshot_id: "snap-0001",
      path_name: "Design lead at a technically ambitious, small-team startup",
      previous_action: null,
    },
    occurred_at: "2026-04-08T15:10:00.000Z",
  },
  {
    id: "evt-0003",
    user_id: USER_ID,
    event_type: "path_deferred",
    meta: {
      event_type: "path_deferred",
      snapshot_id: "snap-0001",
      path_name: "Head of Design at a Series A–B fintech company",
    },
    occurred_at: "2026-04-08T15:12:00.000Z",
  },
  {
    id: "evt-0004",
    user_id: USER_ID,
    event_type: "path_dismissed",
    meta: {
      event_type: "path_dismissed",
      snapshot_id: "snap-0001",
      path_name: "Independent design advisor or fractional design lead",
      alignment: "misaligned",
    },
    occurred_at: "2026-04-08T15:13:00.000Z",
  },
];

// Memory state after session 1
export const stateAfterSession1: CareerStateMemory = {
  user_id: USER_ID,
  assembled_at: "2026-04-08T15:14:00.000Z",
  snapshots: [snapshot_1],
  responses: responses_after_session_1,
  active_pursuits: [responses_after_session_1[0]],
  dismissed_paths: [responses_after_session_1[2]],
  events: events_after_session_1,
  patterns: [],
  // No patterns yet — not enough history.
};

// ---------------------------------------------------------------------------
// Session 2 — April 29 (three weeks later)
// User updates career_direction. Engine runs again with the updated context.
// New analysis names a different "aligned" path — user dismisses it.
// The deferred Head of Design path is revisited as "considering".
// ---------------------------------------------------------------------------

const snapshot_2: PathSnapshot = {
  id: "snap-0002",
  user_id: USER_ID,
  context_snapshot_at: "2026-04-29T10:05:00.000Z",
  created_at: "2026-04-29T10:06:44.000Z",
  analysis: {
    user_id: USER_ID,
    generated_at: "2026-04-29T10:06:44.000Z",
    context_snapshot_at: "2026-04-29T10:05:00.000Z",
    paths: [
      {
        name: "Design lead at a technically ambitious, small-team startup",
        alignment: "aligned",
        fit_reasoning: "Unchanged — still the strongest match.",
        gaps: ["AI strategy gap is narrowing based on currently_exploring field"],
        time_to_readiness: "2–6 months — closer than three weeks ago",
        risk_assessment: "Scope underestimation remains unaddressed.",
        what_to_avoid: ["Taking a role without a defined design decision-making scope"],
      },
      {
        name: "AI product design lead at an early-stage AI company",
        alignment: "aligned",
        fit_reasoning: "User updated direction to include AI-native companies. Currently exploring AI product strategy is now a signal.",
        gaps: ["No shipped AI product experience", "AI-specific design patterns not documented"],
        time_to_readiness: "6–12 months",
        risk_assessment: "Market is crowded; differentiation from 'designer who uses AI' to 'AI product designer' requires demonstrated work.",
        what_to_avoid: ["Applying to AI companies with AI experience framed only as a tool user"],
      },
      {
        name: "Head of Design at a Series A–B fintech company",
        alignment: "partial",
        fit_reasoning: "Same structural tension. Management gap unchanged.",
        gaps: ["Still no documented management experience"],
        time_to_readiness: "12–18 months",
        risk_assessment: "Unchanged.",
        what_to_avoid: ["Bypassing the management gap by targeting IC-equivalent Head of Design roles"],
      },
    ],
    observations: [
      "User pursued the startup path 3 weeks ago and has not updated that response — treated as sustained.",
      "Direction update introduced AI-native companies as a new target.",
    ],
    missing_context: ["No data on whether the user has applied anywhere or had conversations."],
  },
};

const responses_after_session_2: PathResponse[] = [
  ...responses_after_session_1,
  {
    id: "resp-0004",
    user_id: USER_ID,
    snapshot_id: "snap-0002",
    path_name: "AI product design lead at an early-stage AI company",
    action: "dismissed",
    note: "Not ready for this yet. Want to land the startup role first.",
    responded_at: "2026-04-29T10:45:00.000Z",
  },
  // User revisits the previously deferred Head of Design path
  {
    id: "resp-0005",
    user_id: USER_ID,
    snapshot_id: "snap-0002",
    path_name: "Head of Design at a Series A–B fintech company",
    action: "considering",
    note: "Still not ready but I'm not closing the door.",
    responded_at: "2026-04-29T10:47:00.000Z",
  },
];

const events_after_session_2: BehaviorEvent[] = [
  ...events_after_session_1,
  {
    id: "evt-0005",
    user_id: USER_ID,
    event_type: "direction_changed",
    meta: {
      event_type: "direction_changed",
      previous: "I want to move toward a design leadership role at a company building something technically ambitious.",
      current: "I want to lead design at a small, technically ambitious company — ideally building with AI.",
    },
    occurred_at: "2026-04-27T09:00:00.000Z",
  },
  {
    id: "evt-0006",
    user_id: USER_ID,
    event_type: "analysis_generated",
    meta: { event_type: "analysis_generated", snapshot_id: "snap-0002", path_count: 3 },
    occurred_at: "2026-04-29T10:06:44.000Z",
  },
  {
    id: "evt-0007",
    user_id: USER_ID,
    event_type: "path_dismissed",
    meta: {
      event_type: "path_dismissed",
      snapshot_id: "snap-0002",
      path_name: "AI product design lead at an early-stage AI company",
      alignment: "aligned",
    },
    occurred_at: "2026-04-29T10:45:00.000Z",
  },
  {
    id: "evt-0008",
    user_id: USER_ID,
    event_type: "path_revisited",
    meta: {
      event_type: "path_revisited",
      snapshot_id: "snap-0002",
      path_name: "Head of Design at a Series A–B fintech company",
      previous_action: "deferred",
      new_action: "considering",
    },
    occurred_at: "2026-04-29T10:47:00.000Z",
  },
];

// Patterns now detectable:
// - recurring_dismissal: 2 aligned paths dismissed (fractional was misaligned,
//   AI product lead was aligned) — only aligned dismissals count, so this triggers
//   at the second aligned dismissal.

export const stateAfterSession2: CareerStateMemory = {
  user_id: USER_ID,
  assembled_at: "2026-04-29T10:48:00.000Z",
  snapshots: [snapshot_2, snapshot_1],
  responses: responses_after_session_2,
  // active_pursuits: latest action per path_name = "pursuing"
  active_pursuits: [
    responses_after_session_1[0], // startup path still pursuing
  ],
  // dismissed_paths: latest action per path_name = "dismissed"
  // Note: AI product lead is dismissed; Head of Design was revisited to "considering"
  dismissed_paths: [
    responses_after_session_2[3], // AI product lead
    responses_after_session_1[2], // fractional
  ],
  events: events_after_session_2,
  patterns: [
    {
      kind: "recurring_dismissal",
      description:
        "Dismissed 2 paths the engine marked as aligned. The dismissed paths may share a theme worth examining.",
      event_count: 2,
      last_seen_at: "2026-04-29T10:45:00.000Z",
    },
  ],
};

// ---------------------------------------------------------------------------
// Session 3 — June 3 (five weeks later)
// User hasn't responded to the startup path in 7 weeks — still "pursuing".
// The pursuit_commitment pattern now fires (14+ days).
// User updates identity fields (changed growth_areas).
// Engine runs again. User changes their startup pursuit to "deferred" after
// a job search reality check. Head of Design path upgraded to "pursuing".
// ---------------------------------------------------------------------------

const events_after_session_3: BehaviorEvent[] = [
  ...events_after_session_2,
  {
    id: "evt-0009",
    user_id: USER_ID,
    event_type: "identity_updated",
    meta: {
      event_type: "identity_updated",
      fields_changed: ["growth_areas", "currently_exploring"],
    },
    occurred_at: "2026-05-20T14:00:00.000Z",
  },
  {
    id: "evt-0010",
    user_id: USER_ID,
    event_type: "path_revisited",
    meta: {
      event_type: "path_revisited",
      snapshot_id: "snap-0003", // new snapshot
      path_name: "Design lead at a technically ambitious, small-team startup",
      previous_action: "pursuing",
      new_action: "deferred",
    },
    occurred_at: "2026-06-03T11:20:00.000Z",
  },
  {
    id: "evt-0011",
    user_id: USER_ID,
    event_type: "path_pursued",
    meta: {
      event_type: "path_pursued",
      snapshot_id: "snap-0003",
      path_name: "Head of Design at a Series A–B fintech company",
      previous_action: "considering",
    },
    occurred_at: "2026-06-03T11:22:00.000Z",
  },
];

const responses_after_session_3: PathResponse[] = [
  ...responses_after_session_2,
  {
    id: "resp-0006",
    user_id: USER_ID,
    snapshot_id: "snap-0003",
    path_name: "Design lead at a technically ambitious, small-team startup",
    action: "deferred",
    note: "Searched for 6 weeks. Right companies aren't hiring. Shifting focus.",
    responded_at: "2026-06-03T11:20:00.000Z",
  },
  {
    id: "resp-0007",
    user_id: USER_ID,
    snapshot_id: "snap-0003",
    path_name: "Head of Design at a Series A–B fintech company",
    action: "pursuing",
    note: "Going to actively close the management gap. Taking on a direct report at current job.",
    responded_at: "2026-06-03T11:22:00.000Z",
  },
];

export const stateAfterSession3: CareerStateMemory = {
  user_id: USER_ID,
  assembled_at: "2026-06-03T11:23:00.000Z",
  snapshots: [], // snap-0003 omitted for brevity
  responses: responses_after_session_3,
  // startup path: latest action = deferred → not in active_pursuits
  // Head of Design: latest action = pursuing → in active_pursuits
  active_pursuits: [responses_after_session_3[6]], // Head of Design
  dismissed_paths: [
    responses_after_session_2[3], // AI product lead
    responses_after_session_1[2], // fractional
  ],
  events: events_after_session_3,
  patterns: [
    {
      kind: "recurring_dismissal",
      description: "Dismissed 2 paths the engine marked as aligned.",
      event_count: 2,
      last_seen_at: "2026-04-29T10:45:00.000Z",
    },
    {
      kind: "pursuit_commitment",
      description: "1 path marked as pursuing for 14+ days.",
      event_count: 1,
      last_seen_at: "2026-06-03T11:22:00.000Z",
    },
    // Note: repeated_deferral does NOT fire here.
    // The startup path was pursued for 7 weeks before being deferred —
    // that is a considered decision, not avoidance behavior.
    // The Head of Design path moved from deferred → considering → pursuing.
    // No path was deferred and purely abandoned.
  ],
};
