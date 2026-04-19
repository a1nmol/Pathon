import { requireStage } from "@/lib/auth/flow";
import { getProofCapsule } from "@/lib/db/proof";
import { FlowShell } from "@/components/layout/FlowShell";
import { ProofCapsuleEditorConnected } from "@/components/credentials/ProofCapsuleEditorConnected";
import { notFound } from "next/navigation";

export default async function EditCapsulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await requireStage("proof");
  const { id } = await params;

  const capsule = await getProofCapsule(id, userId);
  if (!capsule) notFound();

  return (
    <FlowShell redirectTo={`/proof/${id}`}>
      <ProofCapsuleEditorConnected userId={userId} initialCapsule={capsule} />
    </FlowShell>
  );
}
