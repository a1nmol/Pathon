import { requireStage } from "@/lib/auth/flow";
import { FlowShell } from "@/components/layout/FlowShell";
import { ProofCapsuleEditorConnected } from "@/components/credentials/ProofCapsuleEditorConnected";

export default async function NewCapsulePage() {
  const { userId } = await requireStage("proof");

  return (
    <FlowShell redirectTo="/proof">
      <ProofCapsuleEditorConnected userId={userId} />
    </FlowShell>
  );
}
