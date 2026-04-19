/**
 * AI Output Safety and Honesty Constraints
 *
 * Three things live here:
 *
 *   SAFETY_CONSTRAINTS_BLOCK — plain-text block appended to every system prompt.
 *     Defines what the model must and must not do across all outputs.
 *
 *   validateOutput(text) — post-generation runtime check.
 *     Catches violations before the response reaches the user.
 *     Returns a structured result: pass or list of specific failures.
 *
 *   applyConstraints(systemPrompt) — wraps any system prompt with the constraint block.
 *     Call this in decisions.ts and mentor.ts instead of using bare prompts.
 *
 * These constraints apply to ALL AI outputs in Pathon without exception.
 * Neither the decision engine nor the mentor is exempt.
 */

// ---------------------------------------------------------------------------
// The constraint block — injected into every system prompt
// ---------------------------------------------------------------------------

export const SAFETY_CONSTRAINTS_BLOCK = `
## Safety and Honesty Constraints

These rules apply to every sentence you produce. They are not suggestions.

### On outcomes

Never state or imply that a career path, action, or decision will produce a specific result.
Career outcomes are determined by factors outside the data you have access to and outside anyone's full control — market conditions, timing, luck, organizational dynamics, personal factors not captured here.

Prohibited constructions:
- "If you do X, you will get Y"
- "This path will lead to..."
- "You'll be ready in exactly N months"
- "Companies like this always..."
- Superlatives applied to predictions: "the best path", "the fastest route", "the surest way"

Required instead:
- "This path is more likely to fit because..."
- "Based on the data here, the gaps appear to be..."
- "One plausible outcome is..."
- Time estimates as ranges with stated assumptions: "12–18 months, assuming..."

### On absolutes

Do not use absolute language when describing the user's traits, patterns, or tendencies.
The data you have is self-reported and incomplete. Observation is not diagnosis.

Prohibited constructions:
- "You are X" (as a fixed trait claim)
- "You always...", "You never..."
- "You definitely...", "You clearly..."
- "The data proves..."

Required instead:
- "Based on what you've shared..."
- "The pattern here suggests..."
- "This appears to be..."
- "Your stated preference is..."
- "The recorded decisions show a tendency toward..."

### On uncertainty

Uncertainty must be stated explicitly when it is present — not softened, not omitted.
If the analysis relies on incomplete data, say what is missing and how it limits the conclusion.
Do not fill data gaps with inference and present the inference as fact.

Required when data is incomplete:
- Name the missing data specifically
- State how the missing data limits the conclusion
- Do not proceed as if the gap does not exist

### On user agency

The user makes their own decisions. You provide reasoning, not directives.
Do not frame your output as the final word on what the user should do.

Prohibited constructions:
- "You should do X" (without acknowledging it is a reasoned suggestion, not a command)
- "The answer is..."
- "Don't do X" stated as fact without explaining the reasoning behind it
- Framing one option as obviously correct without surfacing the tradeoffs of the others

Required instead:
- "One consideration here is..."
- "The tradeoff is..."
- "Whether this is right depends on..."
- "This is a judgment call — here is the relevant reasoning..."
- When recommending against something: explain the specific concern, not just the conclusion

### What these constraints do not mean

They do not mean you must hedge every sentence.
They do not mean you cannot be direct.
They do not mean you must soften difficult truths.

A direct, honest statement grounded in available data and presented as a reasoned observation — not a guarantee — is compliant. The goal is accuracy, not timidity.
`;

// ---------------------------------------------------------------------------
// applyConstraints
// Wraps any system prompt with the constraint block.
// The block is appended at the end so it does not interfere with
// role framing or context injection at the top of the prompt.
// ---------------------------------------------------------------------------

export function applyConstraints(systemPrompt: string): string {
  return `${systemPrompt}\n${SAFETY_CONSTRAINTS_BLOCK}`;
}

// ---------------------------------------------------------------------------
// Violation types
// ---------------------------------------------------------------------------

export type ViolationKind =
  | "guaranteed_outcome"     // states a future result as certain
  | "absolute_trait_claim"   // "you are X" without qualification
  | "uninflected_absolute"   // always/never/definitely applied to predictions
  | "missing_uncertainty"    // conclusion stated despite named data gaps
  | "agency_removal";        // removes the user's decision-making role

export type Violation = {
  kind: ViolationKind;
  /** The exact substring from the output that triggered this violation. */
  excerpt: string;
  /** Why it is a violation. */
  reason: string;
};

export type ValidationResult =
  | { pass: true }
  | { pass: false; violations: Violation[] };

// ---------------------------------------------------------------------------
// validateOutput
// Post-generation runtime check. Runs on the full text of any AI response
// before it is returned to the caller or streamed to the client.
//
// This is a heuristic scan — it cannot catch every violation, and it will
// produce some false positives. Treat failures as a signal to review the
// output, not as a hard block in all cases. The severity field on each
// violation lets callers decide how to handle.
// ---------------------------------------------------------------------------

type PatternDef = {
  kind: ViolationKind;
  patterns: RegExp[];
  reason: string;
};

const VIOLATION_PATTERNS: PatternDef[] = [
  {
    kind: "guaranteed_outcome",
    patterns: [
      /this path will (lead|result|get you|land you|make you)/i,
      /you will (get|land|become|receive|achieve|be hired|be offered)/i,
      /if you do (this|that|x),?\s+you('ll| will)/i,
      /guaranteed to/i,
      /the surest way/i,
      /the fastest route to/i,
      /will definitely (work|succeed|open|lead)/i,
    ],
    reason: "States a future career outcome as certain. Outcomes depend on factors outside the available data.",
  },
  {
    kind: "absolute_trait_claim",
    patterns: [
      /\byou are (someone who|a person who|naturally|inherently|fundamentally)\b/i,
      /\byou('re| are) (definitely|clearly|obviously) (a|an|the)\b/i,
      /\bthe data (proves|confirms|shows definitively) (that )?you\b/i,
    ],
    reason: "States a fixed trait claim about the user. Data is self-reported and incomplete — observation is not diagnosis.",
  },
  {
    kind: "uninflected_absolute",
    patterns: [
      /\byou (always|never) \w/i,
      /\b(companies|employers|hiring managers) (always|never|definitely|will always|will never)\b/i,
      /\bthis (always|never) (works|happens|leads|results)\b/i,
      /\bthe (best|only|perfect) (path|option|choice|move|way|approach) (for you|is)\b/i,
    ],
    reason: "Uses an absolute prediction about behavior or outcomes. Career domains have too many variables for this to hold.",
  },
  {
    kind: "agency_removal",
    patterns: [
      /\bthe answer is\b/i,
      /\byou (must|have to|need to) (do|take|pursue|accept|reject)\b/i,
      /\bthere is (only one|no other) (option|choice|path|way)\b/i,
      /\bdon't (do|take|pursue|accept) (this|that|x)\b(?!.*because)/i,
    ],
    reason: "Frames the output as a directive rather than reasoned guidance. The user makes their own decisions.",
  },
];

// Sentence-level uncertainty check — applied when the output contains
// explicit acknowledgment of missing data but then draws a hard conclusion.
const UNCERTAINTY_BRIDGE_PATTERN =
  /(no (resume|background|identity|data|information) (was |is |has been )?(provided|available|present))[^.]*\.\s+[A-Z][^.]*\b(is|are|will|the answer|the best|clearly)\b/i;

function findExcerpt(text: string, pattern: RegExp): string {
  const match = text.match(pattern);
  if (!match) return "";
  const start = Math.max(0, (match.index ?? 0) - 20);
  const end = Math.min(text.length, (match.index ?? 0) + match[0].length + 20);
  return `...${text.slice(start, end)}...`;
}

export function validateOutput(text: string): ValidationResult {
  const violations: Violation[] = [];

  for (const def of VIOLATION_PATTERNS) {
    for (const pattern of def.patterns) {
      if (pattern.test(text)) {
        violations.push({
          kind: def.kind,
          excerpt: findExcerpt(text, pattern),
          reason: def.reason,
        });
        break; // one violation per kind per pattern group
      }
    }
  }

  // Uncertainty bridge check
  if (UNCERTAINTY_BRIDGE_PATTERN.test(text)) {
    violations.push({
      kind: "missing_uncertainty",
      excerpt: findExcerpt(text, UNCERTAINTY_BRIDGE_PATTERN),
      reason: "Draws a definitive conclusion immediately after acknowledging missing data.",
    });
  }

  if (violations.length === 0) return { pass: true };
  return { pass: false, violations };
}
