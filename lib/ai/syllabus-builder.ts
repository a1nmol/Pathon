import Anthropic from "@anthropic-ai/sdk";
import type { GapItem, SkillSyllabus, SyllabusDay, UserConstraints } from "@/types/gap-analyzer";
import { findResourcesForSkill, RESOURCE_LIBRARY, type LibraryResource } from "./resource-library";

const anthropic = new Anthropic();

/** Always returns a syllabus — AI-generated when possible, library fallback otherwise. */
export async function buildSyllabus(
  gaps: GapItem[],
  constraints: UserConstraints,
  targetRole: string,
): Promise<SkillSyllabus[]> {
  const topGaps = gaps.slice(0, 2);
  // If somehow no gaps, manufacture a general learning plan for the target role
  const effectiveGaps: GapItem[] = topGaps.length > 0 ? topGaps : [{
    skill: targetRole,
    gap_level: "moderate",
    current_level: "Getting started",
    target_level: "Job-ready",
    how_to_close: "Follow structured learning path",
    timeline_weeks: 4,
  }];

  const isFree = constraints.situation.includes("zero_budget");
  const isPartTime = constraints.situation.includes("part_time") || constraints.situation.includes("currently_employed");
  const hoursPerDay = isPartTime ? 2 : 4;
  const numDays = constraints.time_budget === "48-hours" ? 2 : 3;

  // Gather matching resources for each skill
  const gapResources = effectiveGaps.map((gap) => {
    let matched = findResourcesForSkill(gap.skill, 6).filter((r) => (isFree ? r.is_free : true));
    if (matched.length < 2) {
      // Widen search — use role name too
      matched = findResourcesForSkill(`${gap.skill} ${targetRole}`, 6).filter((r) => (isFree ? r.is_free : true));
    }
    if (matched.length < 2) {
      // Last resort: pick any free resources
      matched = RESOURCE_LIBRARY.filter((r) => (isFree ? r.is_free : true)).slice(0, 4);
    }
    return { gap, resources: matched };
  });

  const resourceContext = gapResources
    .map(({ gap, resources }) =>
      `Skill: "${gap.skill}" (${gap.gap_level})\nResources:\n${resources.map(formatResource).join("\n")}`,
    )
    .join("\n\n");

  try {
    const prompt = `You are building a concrete day-by-day learning plan for someone targeting "${targetRole}".

VERIFIED RESOURCES — use EXACTLY these URLs, titles, creators (do not invent resources):
${resourceContext}

Constraints: ${isFree ? "FREE only" : "free or paid"}. ~${hoursPerDay}h/day. ${numDays} days per skill.

Return ONLY a valid JSON array (no markdown):
[
  {
    "skill": "<exact skill name>",
    "gap_level": "critical"|"moderate"|"minor",
    "total_hours": <number>,
    "days": [
      {
        "day": 1,
        "total_hours": ${hoursPerDay},
        "blocks": [
          {
            "time_of_day": "Morning"|"Afternoon"|"Evening",
            "hours": <number>,
            "activity": "<specific task: e.g. Watch lecture 3-5 on backprop, implement from scratch in Python>",
            "resource": {
              "title": "<exact title>",
              "platform": "<exact platform>",
              "creator": "<exact creator>",
              "duration_hours": <number>,
              "is_free": <boolean>,
              "search_url": "<exact url from list above>",
              "type": "video"|"course"|"certification"|"project"
            }
          }
        ]
      }
    ],
    "milestone": "<what they can concretely show or say after completing all days>"
  }
]

Max 2 blocks per day. Be specific in activity descriptions.`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as SkillSyllabus[];
      if (parsed.length > 0) return parsed;
    }
  } catch {
    // fall through to hard fallback
  }

  // Hard fallback: build syllabus directly from library without AI
  return buildFallbackSyllabus(effectiveGaps, gapResources.map((g) => g.resources), hoursPerDay, numDays);
}

function buildFallbackSyllabus(
  gaps: GapItem[],
  resourceSets: LibraryResource[][],
  hoursPerDay: number,
  numDays: number,
): SkillSyllabus[] {
  const timeSlots = ["Morning", "Afternoon", "Evening"];

  return gaps.map((gap, gi) => {
    const resources = resourceSets[gi];
    const days: SyllabusDay[] = [];

    for (let d = 0; d < numDays; d++) {
      const res = resources[d % resources.length];
      const nextRes = resources[(d + 1) % resources.length];
      days.push({
        day: d + 1,
        total_hours: hoursPerDay,
        blocks: [
          {
            time_of_day: timeSlots[0],
            hours: Math.ceil(hoursPerDay / 2),
            activity: `Study "${res.title}" — focus on core concepts for ${gap.skill}`,
            resource: libraryToResource(res),
          },
          ...(hoursPerDay >= 3 ? [{
            time_of_day: timeSlots[1],
            hours: Math.floor(hoursPerDay / 2),
            activity: `Practice with "${nextRes.title}" — apply what you learned to a small exercise`,
            resource: libraryToResource(nextRes),
          }] : []),
        ],
      });
    }

    return {
      skill: gap.skill,
      gap_level: gap.gap_level,
      total_hours: hoursPerDay * numDays,
      days,
      milestone: `Completed ${numDays}-day foundation for ${gap.skill} — ready to build a small project or pass a quiz on core concepts`,
    };
  });
}

function libraryToResource(r: LibraryResource) {
  return {
    title: r.title,
    platform: r.platform as "YouTube" | "Coursera" | "DeepLearning.ai" | "Udemy" | "GitHub" | "Other",
    creator: r.creator,
    duration_hours: 2,
    is_free: r.is_free,
    search_url: r.url,
    type: r.type as "video" | "course" | "project" | "article",
  };
}

function formatResource(r: LibraryResource): string {
  return `  • "${r.title}" by ${r.creator} | ${r.platform} | ${r.is_free ? "FREE" : "Paid"} | ${r.url} | ~${r.duration_hint}`;
}
