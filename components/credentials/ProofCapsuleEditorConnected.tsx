"use client";

import { ProofCapsuleEditor } from "./ProofCapsuleEditor";
import { useFlowComplete } from "@/components/layout/FlowShell";
import type { ProofCapsuleRecord } from "@/types/proof";

export function ProofCapsuleEditorConnected({
  userId,
  initialCapsule,
}: {
  userId: string;
  initialCapsule?: ProofCapsuleRecord;
}) {
  const onComplete = useFlowComplete();
  return (
    <ProofCapsuleEditor
      userId={userId}
      initialCapsule={initialCapsule}
      onComplete={onComplete}
    />
  );
}
