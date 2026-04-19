"use client";

import { CredentialIntake } from "./CredentialIntake";
import { useFlowComplete } from "@/components/layout/FlowShell";

export function CredentialIntakeConnected({ userId }: { userId: string }) {
  const onSaved = useFlowComplete();
  return <CredentialIntake userId={userId} onSaved={onSaved} />;
}
