/**
 * AI Shadow Mentor — example interactions.
 *
 * Reference-only. Never import in production code.
 *
 * Shows four interactions across two sessions for the same user.
 * Uses the stateAfterSession2 memory from memory.example.ts as the starting point:
 * - Startup path: pursuing
 * - Head of Design: considering
 * - AI product lead: dismissed
 * - Fractional: dismissed
 * - Pattern: recurring_dismissal (2 aligned paths dismissed)
 */

// ---------------------------------------------------------------------------
// Interaction 1
// User presents a plan with weak reasoning. Mentor does not validate it.
// ---------------------------------------------------------------------------

export const interaction1 = {
  userMessage: `I'm thinking of reaching out to 50 startups this week with a cold email.
If I send enough, something will stick. I've been on the startup path for three weeks
and haven't had a single conversation yet.`,

  mentorResponse: `The volume assumption is the problem here. Sending 50 cold emails to startups in a week typically produces responses in the low single digits, and most of those will be rejections from companies that aren't hiring. That's not a signal about fit — it's just the base rate for cold outreach.

Three weeks without a conversation is not enough data to conclude that more volume is the answer. The more likely issue is targeting. You've said you want a technically ambitious company where design has genuine strategic influence. That description fits maybe a few dozen companies at any given time, not a broad pool of 50.

Before sending anything, it's worth being specific about which 10 companies you'd genuinely want to work at and why. Cold outreach to those — with a clear, specific reason why you're reaching out to that company in particular — will get you further than a high-volume sweep.

What does your current list of target companies look like?`,

  meta: {
    challenged: true,       // "the problem here", "the assumption"
    referenced_memory: true, // references the startup path pursuit
  },
};

// ---------------------------------------------------------------------------
// Interaction 2
// User asks about a path they previously dismissed. Mentor surfaces the contradiction.
// ---------------------------------------------------------------------------

export const interaction2 = {
  userMessage: `I've been thinking — maybe I should try fractional work while I search.
It would give me income and flexibility. Some people make it work long-term.`,

  mentorResponse: `You dismissed this path explicitly when the engine surfaced it. Your note was: "Not what I want. Confirms my instinct."

That was six weeks ago. It's worth understanding what changed — if something changed. "Income and flexibility" are real concerns, but they're different reasons than the ones you dismissed it for before. The earlier dismissal was about fit. This one sounds like it's about financial pressure or search fatigue.

If the search is running longer than expected and you need income, that's a separate problem worth naming directly. Fractional work can solve that problem in the short term. But your own data shows you learn by building, operate in deep focus, and lose energy from context-switching — fractional engagements are structurally opposed to all three of those.

If you're considering it because the startup search isn't moving, the right question is what's blocking the search, not how to work around it. What's actually going on?`,

  meta: {
    challenged: true,       // "worth examining what changed", "different reasons"
    referenced_memory: true, // references specific dismissal and note verbatim
  },
};

// ---------------------------------------------------------------------------
// Interaction 3
// User asks a direct factual question. Short, direct answer. No challenge needed.
// ---------------------------------------------------------------------------

export const interaction3 = {
  userMessage: `What's the actual difference between a Head of Design role
and a Design Lead role in a startup context?`,

  mentorResponse: `In a startup, the titles are used inconsistently, but the meaningful distinction is scope and accountability.

A Design Lead typically owns the craft and execution for a product area or team. They may have no direct reports, or a small number. Their accountability is the quality of what ships.

A Head of Design typically owns the design function itself — hiring, standards, tooling, cross-functional influence, and the team's relationship with product and engineering leadership. They are accountable for the team's output, not just their own.

In early-stage companies (pre-Series B), these distinctions often collapse. A "Head of Design" at a 15-person company may be the only designer. In that case, the title signals responsibility for building the function from scratch, not managing one that already exists.

For your situation specifically: the startup path you're pursuing probably doesn't have a meaningful design function yet, which means the title matters less than whether you'll have authority over product direction. That's the question to ask in conversations.`,

  meta: {
    challenged: false,
    referenced_memory: true, // references the startup path pursuit and "your situation"
  },
};

// ---------------------------------------------------------------------------
// Interaction 4 — multi-turn
// User pushes back on the mentor's earlier challenge. Mentor holds position
// where warranted, concedes a specific point where the user is right.
// ---------------------------------------------------------------------------

export const interaction4 = {
  history: [
    {
      role: "user" as const,
      content: `I think I'm ready to start applying for Head of Design roles now.
I've been working closely with a junior designer on my team informally for the past month.`,
    },
    {
      role: "assistant" as const,
      content: `Working closely with a junior designer for a month is real experience, and it matters. But "informally" is doing a lot of work in that sentence.

Informal mentorship and managing a direct report are different in the ways that matter most for Head of Design evaluation. Managing a direct report means you're accountable for their performance, involved in their compensation and growth decisions, and navigating the moments when the relationship is difficult — not just when it's collaborative.

The gap I flagged before was about accountability, not proximity. A month of informal collaboration doesn't close that gap. It narrows it, but it doesn't close it. Head of Design hiring at a Series A–B company typically involves at least one conversation specifically about how you've handled underperformance, conflict on a team, or a difficult growth conversation with a report. If you can't draw on a real example, that gap will show up in the interview.

How formal is this relationship — does this designer report to you, or is it peer mentorship?`,
    },
  ],

  // User pushes back, and they have a point
  userMessage: `It's peer mentorship, but I think you're setting an unrealistic bar.
Most people who get Head of Design roles at early-stage startups don't have formal management experience either.
The founders are hiring for potential, not a resume checklist.`,

  mentorResponse: `You're partially right, and I should be precise about where.

It's true that early-stage founders often hire on trajectory rather than a completed management track record. That happens. But "founders hire for potential" is also the thing people tell themselves when they want to skip preparation, so it's worth being honest about which situation this is.

The more accurate version of your point: at a seed-stage or early Series A company hiring their first or second designer, formal management experience is often not the deciding factor. At a Series B or later company hiring a Head of Design to lead an existing team, it carries more weight. Those are genuinely different markets.

What I'd push back on is the framing of the bar as "unrealistic." The bar exists because the failure mode is real — taking a management role without management experience and struggling with the organizational parts is a common and costly mistake. The bar isn't arbitrary.

If you're targeting early-stage companies specifically, your argument has more validity. If you're treating "Head of Design" as a general target across stages, the gap is more material.

Which is it?`,

  meta: {
    challenged: true,       // concedes a point but holds the core position
    referenced_memory: false,
  },
};
