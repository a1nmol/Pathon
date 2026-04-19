/**
 * Example CareerContext output.
 *
 * This file is reference-only. It shows what a fully-populated
 * CareerContext looks like at runtime. Never import this in production code.
 */

import type { CareerContext } from "@/types/context";

export const exampleCareerContext: CareerContext = {
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
      "I do my best work when I'm given a hard problem, a short timeline, and the trust to figure it out. Recognition matters less to me than knowing the thing I built is actually used.",

    strengths: ["systems thinking", "written communication", "simplifying complex problems", "working autonomously"],
    growth_areas: ["public speaking", "managing up", "shipping faster under ambiguity"],

    industries: ["fintech", "developer tools", "climate tech"],
    career_direction:
      "I want to move toward a design leadership role at a company building something technically ambitious. Not managing a large team — a small one where I'm still close to the work.",

    communication_style: "direct",
    feedback_preference: "blunt",

    ai_context:
      "I tend to underestimate scope when I'm excited about an idea. If something I'm proposing sounds too clean, push back. I also have a bias toward design solutions when the real answer might be a process change.",
  },

  background: {
    resume_text:
      "Staff Product Designer at Meridian (2022–present). Previously design lead at two early-stage startups. " +
      "Led redesign of core transaction flow that reduced support tickets by 34%. " +
      "Built and maintained a 400-component design system used across 6 product teams. " +
      "Conducted 80+ user research sessions across B2B and B2C contexts. " +
      "BFA Graphic Design, RISD 2015.",

    github_url: "https://github.com/example-user",

    projects: [
      {
        title: "Meridian Transaction Redesign",
        description:
          "Sole designer on a full redesign of the send-money flow. Ran discovery, defined information architecture, built prototypes, and partnered with engineering for 4 months of iterative delivery. Outcome: 34% reduction in transaction-related support volume.",
      },
      {
        title: "Meridian Design System",
        description:
          "Built the design system from scratch over 18 months. Defined contribution model, token architecture, and component API conventions. Adopted by all product teams within the org.",
      },
    ],
  },

  decisions: [
    {
      id: "d1f2a3b4-0000-0000-0000-000000000001",
      title: "Left a well-paying agency job to join an unproven startup",
      rationale:
        "The agency work was comfortable but I was solving the same class of problem on repeat. The startup was pre-product-market-fit and I wanted to learn what zero-to-one actually felt like.",
      outcome:
        "The startup failed after 14 months. I learned more in that period than in three years prior. No regrets.",
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
        "The transaction redesign at Meridian had no design manager for the first six months. I ran my own discovery, wrote the brief, aligned three engineering teams, and hit the launch date without a slip.",
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
