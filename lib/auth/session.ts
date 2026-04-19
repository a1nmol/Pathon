import { createClient } from "@/lib/db/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

/**
 * Returns the authenticated user from the current session, or null.
 * Safe to call from any Server Component or Server Action.
 *
 * Uses getUser() (not getSession()) to validate against Supabase servers —
 * session data in cookies alone is not trusted.
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the authenticated user or redirects to `redirectTo`.
 * Use in protected Server Components and Server Actions.
 */
export async function requireUser(redirectTo = "/"): Promise<User> {
  const user = await getUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user) redirect(redirectTo as any);
  return user;
}
