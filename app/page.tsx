import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { EntryScreen } from "@/components/layout/EntryScreen";
import { createClient } from "@/lib/db/server";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getUser();

  if (user) {
    const supabase = await createClient();

    // Check user type first — employers go to their dashboard
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from("user_profiles")
      .select("user_type")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.user_type === "employer") {
      redirect("/employer/dashboard");
    }

    // For applicants (and new users without a role yet), check identity completion
    const { data: identity } = await supabase
      .from("career_identity")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.user_type === "applicant") {
      redirect(identity ? "/dashboard" : "/identity");
    }

    // No role yet → onboarding
    redirect("/onboarding");
  }

  const { error } = await searchParams;
  return <EntryScreen authError={error} />;
}
