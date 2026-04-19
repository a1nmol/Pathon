"use server";

import { getUser } from "@/lib/auth/session";
import { saveConnections, getConnections } from "@/lib/db/network";
import { findWarmPaths } from "@/lib/ai/network";
import { buildCareerContext } from "@/lib/ai/context";
import type { NetworkConnection, WarmPath } from "@/types/network";

/**
 * Import a batch of connections for the authenticated user.
 */
export async function importConnections(connections: NetworkConnection[]): Promise<void> {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  await saveConnections(user.id, connections);
}

/**
 * Analyze the user's network to surface warm intro paths toward target companies.
 * Pulls career context (role, skills) from their existing profile data.
 */
export async function analyzeNetwork(targetCompanies: string[]): Promise<WarmPath[]> {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const [connections, context] = await Promise.all([
    getConnections(user.id),
    buildCareerContext(user.id),
  ]);

  if (connections.length === 0) return [];

  // Extract role and skills from career context
  const userRole =
    context.identity?.current_role ??
    (context.linkedin?.positions?.[0] as { title?: string } | undefined)?.title ??
    "";

  const userSkills: string[] = [
    ...(context.identity?.knowledge_domains ?? []),
    ...(context.linkedin?.skills?.map((s: { name?: string } | string) =>
      typeof s === "string" ? s : (s.name ?? ""),
    ) ?? []),
  ]
    .filter(Boolean)
    .slice(0, 30);

  return findWarmPaths(connections, targetCompanies, userRole, userSkills);
}
