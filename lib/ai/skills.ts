/**
 * Skill node builder.
 *
 * Derives SkillNode[] from CareerContext and CareerPathAnalysis.
 * No AI call — pure data transformation.
 *
 * Leverage heuristic: skills named in multiple paths' gaps score higher.
 * Skills the user owns that appear as foundations for gaps score highest.
 */

import type { ContextIdentity } from "@/types/context";
import type { CareerPathAnalysis } from "@/types/decisions";
import type { SkillNode, SkillStatus } from "@/types/skills";

// Skills considered foundational — they transfer broadly across domains.
// These receive a leverage boost regardless of the user's specific context.
const FOUNDATIONAL_LABELS = new Set([
  "communication",
  "written communication",
  "systems thinking",
  "problem solving",
  "leadership",
  "project management",
  "product thinking",
  "research",
  "data analysis",
  "teaching",
  "mentorship",
  "prioritization",
  "storytelling",
]);

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

// Simple string similarity — used to connect related nodes by label overlap.
// Not fuzzy matching; just shared significant words.
function sharesMeaningfulWord(a: string, b: string): boolean {
  const STOP = new Set(["a", "an", "the", "of", "in", "for", "and", "or", "to", "with", "at"]);
  const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)));
  const wordsB = b.split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));
  return wordsB.some((w) => wordsA.has(w));
}

export function buildSkillNodes(
  identity: ContextIdentity,
  analysis: CareerPathAnalysis | null,
): SkillNode[] {
  // ── Collect raw skills by status ──────────────────────────────────────────
  const owned = new Set([
    ...identity.knowledge_domains.map(normalize),
    ...identity.strengths.map(normalize),
  ]);

  const exploring = new Set(
    identity.currently_exploring.map(normalize).filter((s) => !owned.has(s)),
  );

  const gaps = new Set<string>();
  if (analysis) {
    for (const path of analysis.paths) {
      for (const gap of path.gaps) {
        const n = normalize(gap);
        if (!owned.has(n) && !exploring.has(n)) gaps.add(n);
      }
    }
  }

  // Gap frequency — skills missing from multiple paths are higher leverage
  const gapFrequency = new Map<string, number>();
  if (analysis) {
    for (const path of analysis.paths) {
      for (const gap of path.gaps) {
        const n = normalize(gap);
        gapFrequency.set(n, (gapFrequency.get(n) ?? 0) + 1);
      }
    }
  }

  // ── Build initial node list ───────────────────────────────────────────────
  const nodes: SkillNode[] = [];

  function addNode(label: string, status: SkillStatus) {
    const n = normalize(label);

    // Leverage
    let leverage = 0.45;
    if (FOUNDATIONAL_LABELS.has(n)) leverage = 0.82;
    if (status === "gap") {
      const freq = gapFrequency.get(n) ?? 1;
      // Gap mentioned in multiple paths = high leverage to acquire
      leverage = Math.min(0.9, 0.4 + freq * 0.2);
    }
    if (status === "owned" && FOUNDATIONAL_LABELS.has(n)) leverage = 0.9;

    // Relevance
    const relevance =
      status === "owned" ? 0.88 :
      status === "exploring" ? 0.62 :
      0.35;

    nodes.push({ label, leverage, relevance, status, related: [] });
  }

  // Deduplicate across sets — owned wins over exploring wins over gap
  for (const s of owned) addNode(s, "owned");
  for (const s of exploring) addNode(s, "exploring");
  for (const s of gaps) addNode(s, "gap");

  // ── Build related edges ───────────────────────────────────────────────────
  // Two nodes are related if their labels share a meaningful word,
  // or if one is in the foundational set and the other is domain-specific.
  const labels = nodes.map((n) => n.label);

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      const related =
        sharesMeaningfulWord(a.label, b.label) ||
        (FOUNDATIONAL_LABELS.has(normalize(a.label)) && b.status === "gap") ||
        (FOUNDATIONAL_LABELS.has(normalize(b.label)) && a.status === "gap");

      if (related) {
        a.related.push(b.label);
        b.related.push(a.label);
      }
    }
  }

  void labels; // suppress unused warning

  return nodes;
}
