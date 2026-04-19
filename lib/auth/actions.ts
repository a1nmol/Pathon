"use server";

import { createClient } from "@/lib/db/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Sends a magic link to the given email address.
 * Returns { error } on failure, { success: true } on success.
 */
export async function signInWithMagicLink(email: string, next?: string) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const redirectTo = next
    ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    : `${origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Signs the current user out and redirects to the root.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
