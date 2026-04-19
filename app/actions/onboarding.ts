"use server";

import { createClient } from "@/lib/db/server";
import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export async function setUserType(userType: "applicant" | "employer") {
  const user = await getUser();
  if (!user) redirect("/");

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("user_profiles")
    .upsert({ user_id: user.id, user_type: userType }, { onConflict: "user_id" });

  if (error) throw new Error(error.message);

  if (userType === "employer") {
    redirect("/employer/dashboard");
  } else {
    redirect("/dashboard");
  }
}

export async function getUserType(): Promise<"applicant" | "employer" | null> {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("user_profiles")
    .select("user_type")
    .eq("user_id", user.id)
    .maybeSingle();

  return (data?.user_type as "applicant" | "employer") ?? null;
}
