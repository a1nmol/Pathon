import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/server";
import { JobBuilderWrapper } from "@/components/employer/JobBuilderWrapper";

export default async function NewJobPage() {
  const user = await getUser();
  if (!user) redirect("/");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: company } = await supabase
    .from("company_profiles")
    .select("name")
    .eq("user_id", user.id)
    .maybeSingle();

  return <JobBuilderWrapper companyName={company?.name ?? ""} />;
}
