/**
 * Flow gating — determines where in the narrative a user belongs.
 *
 * Each stage has a precondition. Pages call requireStage() to confirm
 * the user can enter, and redirect backward if not. Pages call nextStage()
 * to get the route the "continue" action should push to.
 *
 * Stages (in order):
 *   entry       → /          (always accessible when unauthenticated)
 *   identity    → /identity  (requires auth)
 *   credentials → /credentials (requires auth + identity)
 *   paths       → /paths     (requires auth + identity)
 *   mentor      → /mentor    (requires auth + identity)
 *   proof       → /proof     (requires auth + identity)
 */

import { createClient } from "@/lib/db/server";
import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRoute = any;

export type Stage =
  | "entry"
  | "identity"
  | "credentials"
  | "paths"
  | "mentor"
  | "proof";

export const STAGE_ROUTES: Record<Stage, string> = {
  entry: "/",
  identity: "/identity",
  credentials: "/credentials",
  paths: "/paths",
  mentor: "/mentor",
  proof: "/proof",
};

export const STAGE_SEQUENCE: Stage[] = [
  "entry",
  "identity",
  "credentials",
  "paths",
  "mentor",
  "proof",
];

/** Returns the route for the stage after the given one. */
export function nextRoute(current: Stage): string {
  const idx = STAGE_SEQUENCE.indexOf(current);
  const next = STAGE_SEQUENCE[idx + 1] ?? STAGE_SEQUENCE[STAGE_SEQUENCE.length - 1]!;
  return STAGE_ROUTES[next];
}

/**
 * Checks whether the user has completed their career identity.
 * Used by all stages after identity.
 */
async function hasIdentity(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("career_identity")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

/**
 * Guards a protected page. Call at the top of any Server Component
 * that requires authentication. Redirects to / if unauthenticated.
 * Redirects to /identity if identity is missing and identityRequired is true.
 *
 * Returns the authenticated user.
 */
export async function requireStage(
  stage: Exclude<Stage, "entry">,
): Promise<{ userId: string }> {
  const user = await getUser();
  if (!user) redirect(STAGE_ROUTES.entry as AnyRoute);

  // All stages after identity require it to be complete
  if (stage !== "identity") {
    const identityDone = await hasIdentity(user.id);
    if (!identityDone) redirect(STAGE_ROUTES.identity as AnyRoute);
  }

  return { userId: user.id };
}
