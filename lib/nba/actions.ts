/**
 * NBA — Next Best Action Engine
 *
 * Rule-based action selector. Takes a snapshot of user career context
 * and returns exactly one action. The system never floods, never confuses.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type ActionCategory =
  | "identity"
  | "credentials"
  | "paths"
  | "proof"
  | "skills"
  | "mentor"
  | "interview"
  | "reflection"
  | "offer";

export interface NBAAction {
  id: string;
  /** Large, confident action text shown in the card */
  title: string;
  /** Context sentence: "Right now, the best move is…" completion */
  context: string;
  timeEstimate: string;
  impactHint: string;
  href: string;
  reasoning: { icon: string; text: string }[];
  category: ActionCategory;
  estimatedMinutes: number;
  /** Shown after completion — what the user has earned */
  payoff: string;
}

export interface NBAContext {
  hasIdentity: boolean;
  hasCredentials: boolean;
  hasPaths: boolean;
  proofCount: number;
  mentorSessionCount: number;
  skillGapCount: number;
  /** null = never checked in */
  daysSinceCheckIn: number | null;
}

// ── Action library ─────────────────────────────────────────────────────────────

const ACTIONS: NBAAction[] = [
  {
    id: "complete-identity",
    title: "Map how you actually think about your career",
    context: "before anything else, the system needs to understand you — not just your résumé.",
    timeEstimate: "15–20 min",
    impactHint: "unlocks all AI reasoning",
    href: "/identity",
    reasoning: [
      { icon: "◆", text: "Everything else depends on this foundation" },
      { icon: "⚡", text: "Highest-leverage action available right now" },
      { icon: "🧠", text: "AI can't reason without knowing how you think" },
    ],
    category: "identity",
    estimatedMinutes: 18,
    payoff: "Your career model is live. The system can now reason for you.",
  },
  {
    id: "add-credentials",
    title: "Feed your professional story into the system",
    context: "your identity is set. Now the AI needs to see what you've actually built.",
    timeEstimate: "10–15 min",
    impactHint: "powers path generation",
    href: "/credentials",
    reasoning: [
      { icon: "◇", text: "Path analysis needs real data, not guesses" },
      { icon: "⚡", text: "Low effort — high signal for the AI" },
      { icon: "🧭", text: "Without this, career paths are empty assumptions" },
    ],
    category: "credentials",
    estimatedMinutes: 12,
    payoff: "Your story is in the system. Career paths can now be generated.",
  },
  {
    id: "generate-paths",
    title: "Generate the three paths that fit your actual context",
    context: "your context is ready. Time to see where you could realistically go.",
    timeEstimate: "5–8 min",
    impactHint: "clarifies all future decisions",
    href: "/paths",
    reasoning: [
      { icon: "⊗", text: "Paths collapse 90% of career uncertainty" },
      { icon: "🧭", text: "Every future decision maps back to one of these" },
      { icon: "⚡", text: "System is ready — this takes less than 10 minutes" },
    ],
    category: "paths",
    estimatedMinutes: 7,
    payoff: "Three career directions mapped. Your future is no longer abstract.",
  },
  {
    id: "first-proof",
    title: "Document the best decision you made this year",
    context: "paths exist. Now make them real by proving your actual thinking.",
    timeEstimate: "12–18 min",
    impactHint: "interview-ready proof capsule",
    href: "/proof/new",
    reasoning: [
      { icon: "◎", text: "Proof capsules are the output interviewers actually want" },
      { icon: "🧠", text: "Documents reasoning behind decisions, not just outcomes" },
      { icon: "⚡", text: "First one is always the hardest — and most valuable" },
    ],
    category: "proof",
    estimatedMinutes: 15,
    payoff: "One documented decision. Interview-ready proof earned.",
  },
  {
    id: "weekly-checkin",
    title: "Reflect on this week before it becomes just noise",
    context: "it's been a while. Patterns accumulate without regular reflection.",
    timeEstimate: "8–12 min",
    impactHint: "updates behavioral model",
    href: "/check-in",
    reasoning: [
      { icon: "◷", text: "Reflection creates the data that makes AI advice accurate" },
      { icon: "⚡", text: "This week's signals decay if not captured now" },
      { icon: "🧭", text: "Patterns need weekly input to stay meaningful" },
    ],
    category: "reflection",
    estimatedMinutes: 10,
    payoff: "This week is captured. Your behavioral model is updated.",
  },
  {
    id: "second-proof",
    title: "Add a second decision to your proof library",
    context: "one proof capsule isn't a library. You need range.",
    timeEstimate: "12–18 min",
    impactHint: "strengthens interview credibility",
    href: "/proof/new",
    reasoning: [
      { icon: "◎", text: "Three capsules = a credible story. You have one." },
      { icon: "🧠", text: "Different decisions show range, not just one good day" },
      { icon: "⚡", text: "Medium effort — compounding return over time" },
    ],
    category: "proof",
    estimatedMinutes: 15,
    payoff: "Your proof library grows stronger with each decision.",
  },
  {
    id: "skill-gaps",
    title: "Map where your skills stop and your gaps begin",
    context: "paths exist, but skill clarity is missing. Fix that now.",
    timeEstimate: "10–12 min",
    impactHint: "shows exactly what to learn next",
    href: "/skills",
    reasoning: [
      { icon: "⊞", text: "Gap awareness prevents false confidence in interviews" },
      { icon: "🧭", text: "Shows precisely what to develop for each path" },
      { icon: "⚡", text: "Constellation builds from your existing identity data" },
    ],
    category: "skills",
    estimatedMinutes: 11,
    payoff: "Skill map complete. You know exactly what to build next.",
  },
  {
    id: "interview-prep",
    title: "Turn your decisions into answers interviewers actually want",
    context: "you have proof. Now let the system convert it into STAR stories.",
    timeEstimate: "10–15 min",
    impactHint: "direct interview confidence",
    href: "/interview",
    reasoning: [
      { icon: "◷", text: "STAR format is what every behavioral interview expects" },
      { icon: "🧭", text: "Generated from your actual history, not generic templates" },
      { icon: "⚡", text: "Ready to review in the next 15 minutes" },
    ],
    category: "interview",
    estimatedMinutes: 12,
    payoff: "Your STAR stories are ready. You can answer any behavioral question.",
  },
  {
    id: "mentor-session",
    title: "Challenge your reasoning with your AI shadow mentor",
    context: "you have context and proof. Now pressure-test your thinking.",
    timeEstimate: "10–20 min",
    impactHint: "strengthens career logic",
    href: "/mentor",
    reasoning: [
      { icon: "⌁", text: "Unchallenged reasoning creates blind spots" },
      { icon: "🧠", text: "Mentor knows your entire career context" },
      { icon: "⚡", text: "One session reveals what you couldn't see alone" },
    ],
    category: "mentor",
    estimatedMinutes: 15,
    payoff: "Your reasoning was tested. Weak assumptions are now visible.",
  },
  {
    id: "evaluate-offer",
    title: "Evaluate that opportunity you've been sitting on",
    context: "you have a mature system. Use it to make a real decision.",
    timeEstimate: "8–12 min",
    impactHint: "removes decision paralysis",
    href: "/offer",
    reasoning: [
      { icon: "⊡", text: "System evaluates against your paths and actual values" },
      { icon: "🧭", text: "Gives a verdict: take / negotiate / decline / unclear" },
      { icon: "⚡", text: "One session replaces weeks of second-guessing" },
    ],
    category: "offer",
    estimatedMinutes: 10,
    payoff: "Decision clarity earned. Next step is obvious.",
  },
];

// ── Selector ───────────────────────────────────────────────────────────────────

function find(id: string): NBAAction {
  const a = ACTIONS.find((a) => a.id === id);
  if (!a) throw new Error(`NBA action not found: ${id}`);
  return a;
}

export function selectAction(ctx: NBAContext): NBAAction {
  // Priority waterfall — order is intentional
  if (!ctx.hasIdentity) return find("complete-identity");
  if (!ctx.hasCredentials) return find("add-credentials");
  if (!ctx.hasPaths) return find("generate-paths");
  if (ctx.proofCount === 0) return find("first-proof");

  // Overdue check-in
  if (ctx.daysSinceCheckIn !== null && ctx.daysSinceCheckIn > 6) {
    return find("weekly-checkin");
  }

  // Build proof library
  if (ctx.proofCount < 3) return find("second-proof");

  // Skill awareness
  if (ctx.skillGapCount > 2) return find("skill-gaps");

  // Interview readiness
  if (ctx.mentorSessionCount === 0) return find("mentor-session");

  // STAR stories
  if (ctx.proofCount >= 2) return find("interview-prep");

  // Offer evaluation (mature users)
  return find("evaluate-offer");
}
