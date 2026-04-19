import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { DebateInterface } from "@/components/identity/DebateInterface";

export default async function DebatePage() {
  const user = await getUser();
  if (!user) redirect("/");

  const supabase = await createClient();
  const { data: identityCheck } = await supabase
    .from("career_identity")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!identityCheck) redirect("/identity");

  return <DebateInterface />;
}
