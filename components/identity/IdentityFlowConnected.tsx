"use client";

import { IdentityFlow } from "./IdentityFlow";
import { useFlowComplete } from "@/components/layout/FlowShell";

export function IdentityFlowConnected({ userId }: { userId: string }) {
  const onComplete = useFlowComplete();
  return <IdentityFlow userId={userId} onComplete={onComplete} />;
}
