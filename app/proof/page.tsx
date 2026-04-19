import { requireStage } from "@/lib/auth/flow";
import { listProofCapsules } from "@/lib/db/proof";
import { ProofList } from "@/components/credentials/ProofList";

export default async function ProofPage() {
  const { userId } = await requireStage("proof");
  const capsules = await listProofCapsules(userId);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingLeft: "var(--sidebar-w, 80px)" }}>
      <ProofList userId={userId} capsules={capsules} />
    </div>
  );
}
