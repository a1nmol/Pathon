import Anthropic from "@anthropic-ai/sdk";
import type { NetworkConnection, WarmPath } from "@/types/network";

const client = new Anthropic();

/**
 * Given a list of connections and target companies, use Claude to identify
 * the top warm intro paths the user could leverage.
 */
export async function findWarmPaths(
  connections: NetworkConnection[],
  targetCompanies: string[],
  userRole: string,
  userSkills: string[],
): Promise<WarmPath[]> {
  if (connections.length === 0 || targetCompanies.length === 0) return [];

  // Serialize connections — limit to 500 to keep prompt manageable
  const connectionList = connections
    .slice(0, 500)
    .map(
      (c) =>
        `- ${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() +
        (c.company ? ` @ ${c.company}` : "") +
        (c.position ? ` (${c.position})` : "") +
        (c.connected_on ? ` — connected ${c.connected_on}` : ""),
    )
    .join("\n");

  const prompt = `You are a career networking strategist helping someone find warm intro paths.

USER CONTEXT:
- Current/target role: ${userRole || "Not specified"}
- Key skills: ${userSkills.length > 0 ? userSkills.join(", ") : "Not specified"}

TARGET COMPANIES: ${targetCompanies.join(", ")}

LINKEDIN CONNECTIONS (${connections.length} total, showing up to 500):
${connectionList}

TASK:
Identify the top 5–10 most valuable warm intro paths from this connection list toward the target companies. Prioritize:
1. Connections currently working at a target company
2. Connections who previously worked at a target company
3. Connections at closely related companies or in relevant roles

For each warm path, return a JSON object with these exact fields:
- connection: { first_name, last_name, company, position, connected_on, email } — copy from the input
- target_company: the target company this path leads to (string)
- relevance_reason: 1–2 sentences explaining why this connection is relevant and how they can help (be specific, reference their role/company)
- suggested_message: a 2–3 sentence outreach message that is professional, warm, and personalized. Reference their specific role or background. Do NOT use placeholders like [NAME].

Return ONLY a valid JSON array of WarmPath objects. No markdown, no explanation, no code fences.`;

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  // Strip any accidental markdown fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: WarmPath[];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Attempt to extract a JSON array from the response
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) return [];
    parsed = JSON.parse(match[0]);
  }

  // Validate structure
  return parsed.filter(
    (p): p is WarmPath =>
      p &&
      typeof p === "object" &&
      typeof p.target_company === "string" &&
      typeof p.relevance_reason === "string" &&
      typeof p.suggested_message === "string" &&
      p.connection != null,
  );
}
