import { requireStage, nextRoute } from "@/lib/auth/flow";
import { createClient } from "@/lib/db/server";
import { FlowShell } from "@/components/layout/FlowShell";
import { IdentityFlowConnected } from "@/components/identity/IdentityFlowConnected";
import { redirect } from "next/navigation";

export default async function IdentityPage() {
  const { userId } = await requireStage("identity");

  // Identity already completed — move forward
  const supabase = await createClient();
  const { data } = await supabase
    .from("career_identity")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (data) redirect(nextRoute("identity") as any);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <FlowShell redirectTo={nextRoute("identity") as any}>
      <IdentityFlowConnected userId={userId} />
    </FlowShell>
  );
}
