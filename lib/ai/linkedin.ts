/**
 * LinkedIn AI module
 *
 * Analyzes imported LinkedIn posts to extract professional signals:
 * - Recurring themes and expertise areas
 * - Communication style
 * - What the post history reveals about the person's career identity
 */

import Anthropic from "@anthropic-ai/sdk";
import { applyConstraints } from "./constraints";
import type { LinkedInPost } from "@/types/linkedin";

const client = new Anthropic();

export type PostInsights = {
  themes: string[];
  expertise_signals: string[];
  communication_style: string;
  what_posts_reveal: string;
  top_topics: { topic: string; evidence: string }[];
};

export async function analyzeLinkedInPosts(
  posts: LinkedInPost[],
): Promise<{ ok: true; insights: PostInsights } | { ok: false; error: string }> {
  if (posts.length === 0) {
    return { ok: false, error: "No posts to analyze" };
  }

  // Take a representative sample (up to 30 posts)
  const sample = posts.slice(0, 30);
  const postsText = sample
    .map((p, i) => `[${i + 1}] (${p.date.slice(0, 7)}) ${p.title ? `ARTICLE: ${p.title}\n` : ""}${p.text.slice(0, 500)}`)
    .join("\n\n---\n\n");

  const system = applyConstraints(`You are analyzing a professional's LinkedIn posts to extract career intelligence.
Your job: find genuine patterns in what they write about, how they write, and what their post history reveals.
Be specific. Name actual topics. Do not generalize. Do not soften observations.`);

  const prompt = `Here are ${sample.length} LinkedIn posts from a professional (${posts.length} total):

${postsText}

Return JSON with this exact structure:
{
  "themes": ["3-6 specific recurring topics, as short phrases"],
  "expertise_signals": ["3-5 areas where they demonstrate real knowledge, not just interest"],
  "communication_style": "2-3 sentences on how they write — format, tone, length, audience they seem to address",
  "what_posts_reveal": "3-4 sentences on what their posting history reveals about their professional identity, concerns, and priorities that they may not have explicitly stated",
  "top_topics": [
    { "topic": "specific topic name", "evidence": "one sentence citing a specific example from their posts" }
  ]
}`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content[0] as { type: "text"; text: string }).text;
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = fenceMatch ? fenceMatch[1] : text;
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    const parsed = JSON.parse(jsonStr.slice(firstBrace, lastBrace + 1)) as PostInsights;
    return { ok: true, insights: parsed };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Analysis failed",
    };
  }
}
