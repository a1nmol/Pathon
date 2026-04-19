"use client";

/**
 * ProofViewerShell
 *
 * Client wrapper that injects the onEdit callback into ProofCapsuleViewer.
 * Converts capsuleId to a router.push call so the page stays a Server Component.
 */

import { useRouter } from "next/navigation";
import React from "react";

export function ProofViewerShell({
  capsuleId,
  children,
}: {
  capsuleId: string;
  children: React.ReactElement<{ onEdit?: () => void }>;
}) {
  const router = useRouter();

  return React.cloneElement(children, {
    onEdit: () => router.push(`/proof/${capsuleId}/edit`),
  });
}
