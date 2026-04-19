"use server";

import { createClient } from "@/lib/db/server";
import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  userType: "applicant" | "employer" | null;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getUser();
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_type")
    .eq("user_id", user.id)
    .maybeSingle();

  const meta = user.user_metadata ?? {};
  const displayName: string =
    meta.display_name ??
    meta.full_name ??
    meta.name ??
    user.email?.split("@")[0] ??
    "User";

  return {
    id: user.id,
    email: user.email ?? "",
    displayName,
    avatarUrl: meta.avatar_url ?? null,
    userType: (profile?.user_type ?? null) as "applicant" | "employer" | null,
  };
}

export async function updateDisplayName(name: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { display_name: name.trim() },
  });
  if (error) throw new Error(error.message);
}

export async function switchRole(role: "applicant" | "employer") {
  const user = await getUser();
  if (!user) redirect("/");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  await supabase
    .from("user_profiles")
    .upsert({ user_id: user.id, user_type: role }, { onConflict: "user_id" });

  if (role === "employer") redirect("/employer/dashboard");
  else redirect("/dashboard");
}

export async function signOutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
