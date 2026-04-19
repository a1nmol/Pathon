import { requireStage, nextRoute } from "@/lib/auth/flow";
import { FlowShell } from "@/components/layout/FlowShell";
import { CredentialIntakeConnected } from "@/components/credentials/CredentialIntakeConnected";

export default async function CredentialsPage() {
  const { userId } = await requireStage("credentials");

  return (
    <FlowShell redirectTo={nextRoute("credentials")}>
      <CredentialIntakeConnected userId={userId} />
    </FlowShell>
  );
}
