import { requireStage } from "@/lib/auth/flow";
import { getProofCapsule, getRevisions } from "@/lib/db/proof";
import { ProofCapsuleViewer } from "@/components/credentials/ProofCapsuleViewer";
import { notFound } from "next/navigation";
import { ProofViewerShell } from "@/components/credentials/ProofViewerShell";

export default async function CapsulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await requireStage("proof");
  const { id } = await params;

  const [capsule, revisions] = await Promise.all([
    getProofCapsule(id, userId),
    getRevisions(id),
  ]);

  if (!capsule) notFound();

  return (
    <ProofViewerShell capsuleId={id}>
      <ProofCapsuleViewer capsule={capsule} revisions={revisions} />
    </ProofViewerShell>
  );
}
