/**
 * Career Decision Engine — example input and output.
 *
 * This file is reference-only. Never import it in production code.
 *
 * Shows what generateCareerPaths() receives and what it produces
 * for a real user (the same persona used in context.example.ts).
 */

import type { CareerContext } from "@/types/context";
import type { CareerPathAnalysis } from "@/types/decisions";

// ---------------------------------------------------------------------------
// Example input (CareerContext)
// Same persona as context.example.ts — senior staff designer, fintech.
// ---------------------------------------------------------------------------

export const exampleInput: CareerContext = {
  user_id: "a3f7c821-0b2e-4d58-9e1a-000000000001",
  aggregated_at: "2026-04-08T14:32:00.000Z",

  completeness: {
    has_identity: true,
    has_background: true,
    has_decisions: true,
    has_proof: true,
    has_linkedin: false,
  },

  identity: {
    career_stage: "senior",
    current_role: "Staff Product Designer",
    thinking_style: "systems_thinker",
    decision_approach: "intuition_led",
    problem_framing:
      "I usually start by drawing the relationships between the people involved before I touch the actual problem. The answer almost always lives in a broken handoff, not a missing feature.",
    primary_learning_mode: "building",
    knowledge_domains: ["product design", "design systems", "user research", "early-stage startups"],
    currently_exploring: ["AI product strategy", "technical writing"],
    work_rhythm: "deep_focus",
    energy_source: "introvert",
    collaboration_style: "small_team",
    core_values: ["craft", "honesty", "autonomy", "simplicity", "impact"],
    motivated_by:
      "I do my best work when I'm given a hard problem, a short timeline, and the trust to figure it out.",
    strengths: ["systems thinking", "written communication", "simplifying complex problems", "working autonomously"],
    growth_areas: ["public speaking", "managing up", "shipping faster under ambiguity"],
    industries: ["fintech", "developer tools", "climate tech"],
    career_direction:
      "I want to move toward a design leadership role at a company building something technically ambitious. Not managing a large team — a small one where I'm still close to the work.",
    communication_style: "direct",
    feedback_preference: "blunt",
    ai_context:
      "I tend to underestimate scope when I'm excited about an idea. Push back when I seem overconfident. I also have a bias toward design solutions when the real answer might be a process change.",
  },

  background: {
    resume_text:
      "Staff Product Designer at Meridian (2022–present). Led redesign of core transaction flow, reducing support tickets by 34%. Built 400-component design system used across 6 teams. 80+ user research sessions. BFA Graphic Design, RISD 2015.",
    github_url: "https://github.com/example-user",
    projects: [
      {
        title: "Meridian Transaction Redesign",
        description:
          "Sole designer on a full redesign of the send-money flow. Ran discovery, defined IA, built prototypes, partnered with engineering for 4 months. Outcome: 34% reduction in transaction-related support volume.",
      },
      {
        title: "Meridian Design System",
        description:
          "Built the design system from scratch over 18 months. Defined contribution model, token architecture, and component API conventions. Adopted by all product teams.",
      },
    ],
  },

  decisions: [
    {
      id: "d1f2a3b4-0000-0000-0000-000000000001",
      title: "Left a well-paying agency job to join an unproven startup",
      rationale:
        "The agency work was comfortable but I was solving the same class of problem on repeat. I wanted to learn what zero-to-one actually felt like.",
      outcome: "The startup failed after 14 months. I learned more in that period than in three years prior. No regrets.",
      decided_at: "2019-06-01T00:00:00.000Z",
    },
    {
      id: "d1f2a3b4-0000-0000-0000-000000000002",
      title: "Turned down a principal role at a large tech company",
      rationale:
        "The title was right but the scope wasn't — it was a maintenance role on a mature product. I want to build, not maintain.",
      outcome: null,
      decided_at: "2025-01-15T00:00:00.000Z",
    },
  ],

  proof_capsules: [
    {
      id: "pc000000-0000-0000-0000-000000000001",
      claim: "I can lead a complex design project end-to-end without a manager",
      evidence:
        "The transaction redesign had no design manager for the first six months. I ran discovery, wrote the brief, aligned three engineering teams, and hit the launch date without a slip.",
      tags: ["leadership", "delivery", "autonomy"],
      created_at: "2026-03-10T09:00:00.000Z",
    },
    {
      id: "pc000000-0000-0000-0000-000000000002",
      claim: "I communicate clearly under pressure",
      evidence:
        "During a production incident that broke our payment flow, I wrote the internal post-mortem and external customer communication within two hours. Both were approved without edits.",
      tags: ["communication", "crisis"],
      created_at: "2026-03-18T11:30:00.000Z",
    },
  ],

  linkedin: null,
};

// ---------------------------------------------------------------------------
// Example output (CareerPathAnalysis)
// What the engine would return for the above input.
// ---------------------------------------------------------------------------

export const exampleOutput: CareerPathAnalysis = {
  user_id: "a3f7c821-0b2e-4d58-9e1a-000000000001",
  generated_at: "2026-04-08T14:33:21.000Z",
  context_snapshot_at: "2026-04-08T14:32:00.000Z",

  paths: [
    {
      name: "Design lead at a technically ambitious, small-team startup",
      alignment: "aligned",
      fit_reasoning:
        "The user's stated direction is explicit: small team, close to the work, technically ambitious problem. Their decision history confirms this isn't aspirational — they left a comfortable agency role and turned down a principal title at a large company when the work felt like maintenance. Their proof shows they can operate without management overhead. Their systems-thinking style and deep-focus rhythm are a structural match for early-stage environments where ambiguity is constant.",
      gaps: [
        "No documented experience hiring or growing other designers",
        "No public evidence of navigating founder dynamics or resource constraints at the design decision level",
        "AI product strategy is listed as 'currently exploring' — not yet a demonstrated competency",
      ],
      time_to_readiness: "3–9 months — the gap is mostly exposure, not skill. The right company and a deliberate search process is the variable, not additional preparation.",
      risk_assessment:
        "The user's own ai_context flags a tendency to underestimate scope when excited. In an early-stage environment with no design manager above them, this bias runs unchecked. Small-team startups also fail at a high rate; the user's prior startup experience ended in failure — which they've framed positively, but repeated exposure to this outcome can erode judgment about which bets are worth taking. The introvert + deep_focus profile is a risk in fast-moving seed-stage companies where interruption is structural.",
      what_to_avoid: [
        "Joining a company where the founders want a 'design executor' rather than a strategic partner — this will reproduce the agency dynamic they deliberately left",
        "Taking a role at a company with more than ~25 people without confirming the design function has real influence over product direction",
        "Accepting scope ambiguity without establishing written expectations in the first 30 days — their growth area in 'managing up' makes this a live risk",
      ],
    },
    {
      name: "Head of Design at a Series A–B fintech or developer-tools company",
      alignment: "partial",
      fit_reasoning:
        "The user's background is concentrated in fintech (Meridian) and they have direct experience building design infrastructure at scale. The 400-component design system and cross-team adoption are legitimate Head of Design-level artifacts. Their writing strength is a real advantage at this level, where alignment and influence happen through documentation as much as meetings.",
      gaps: [
        "No documented experience managing direct reports — all evidence shows independent or peer-level work",
        "Public speaking and managing up are both listed as growth areas; both are load-bearing at Head of Design",
        "'Shipping faster under ambiguity' is a growth area — this becomes a team-level constraint at the lead level, not just a personal one",
      ],
      time_to_readiness:
        "12–24 months — the management gap is real and can't be closed without doing the work. A staff role with 1–2 direct reports in the next 12 months would accelerate this materially.",
      risk_assessment:
        "The tension between 'small team, close to the work' and 'Head of Design' is structural. As the team grows, the user will be progressively further from individual contribution. Their introvert profile and deep-focus rhythm both take a hit as headcount increases. There is a meaningful risk of taking this role, succeeding at the technical parts, and burning out on the organizational parts. The user has not recorded any decisions involving people management — the absence of data here is itself a signal.",
      what_to_avoid: [
        "Targeting companies with existing design teams of more than 5 before demonstrating management competency — inheriting a team without management experience is a high-failure-rate scenario",
        "Letting the design system work define their entire leadership narrative — it signals craft but not organizational judgment, which is what hiring for this role actually evaluates",
        "Taking this role at a company where 'Head of Design' reports to a non-product executive — structural misalignment at that level is very difficult to recover from",
      ],
    },
    {
      name: "Independent design advisor or fractional design lead",
      alignment: "misaligned",
      fit_reasoning:
        "This path is surfaced not as a recommendation but because the user's profile has structural overlap with it: strong autonomy preference, deep-focus work style, demonstrated ability to operate without management, and a clear aversion to large-team contexts. If the startup search stalls or the Head of Design timeline feels slow, this path will be presented to them and they should reason about it carefully before accepting.",
      gaps: [
        "No documented client acquisition experience",
        "Fractional work requires context-switching across clients — structurally opposed to the user's deep-focus rhythm",
        "The user's stated motivation ('given a hard problem, a short timeline, and the trust to figure it out') requires relationship depth that fractional engagements rarely provide",
      ],
      time_to_readiness:
        "Could begin immediately in terms of credentials, but premature. The user has not yet had sustained design leadership accountability — going independent before that experience is a way to avoid the gap, not close it.",
      risk_assessment:
        "The primary risk is that this path optimizes for the user's preferences (autonomy, no overhead) while bypassing the growth areas (managing up, shipping under ambiguity) that would make them competitive for the roles they actually want in 3 years. It is the comfortable path dressed as an ambitious one.",
      what_to_avoid: [
        "Framing fractional work as a temporary bridge without a concrete re-entry plan — most people who intend to use it as a bridge do not",
        "Taking any fractional engagement that doesn't include a defined deliverable — open-ended advisory work will not produce the proof artifacts needed for future full-time roles",
      ],
    },
  ],

  observations: [
    "The user's decision history is more consistent than their stated direction implies. Both recorded decisions were rejections of scale and maintenance. The pattern is legible: they optimize for depth of problem over prestige of role.",
    "The growth area 'managing up' appears in the context of someone who has operated with significant autonomy. This is often a proxy for 'I have not needed to manage up because I have not had stakeholders with meaningful authority over my work.' The startup path they prefer will not resolve this — it may reinforce it.",
    "The proof capsules are strong for the independent contributor claim. Neither of them demonstrates anything about leading other people. Before pursuing a leadership role, the user should deliberately create evidence in this area.",
    "There is no data on compensation expectations, geographic constraints, or timing pressure. These are not optional — they determine which of these paths is actually available in the near term.",
  ],

  missing_context: [
    "No data on whether the user has managed direct reports at any point — all evidence suggests they have not, but absence of evidence is not confirmation",
    "No decisions recorded about previous leadership opportunities — it is unclear whether the user has been offered leadership roles before and declined, or whether they have not yet been offered them",
    "No data on the user's current compensation or financial constraints — relevant to how much runway they have for a deliberate search vs. needing to move quickly",
    "GitHub URL provided but no analysis of actual output available — this could materially affect gap assessment for technically-adjacent roles",
  ],
};
