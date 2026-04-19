"use client";

/**
 * FlowShell
 *
 * Thin client wrapper used by Server Component pages to wire
 * onComplete → router.push(redirectTo) for any flow component.
 * Exposes the callback via Context so no function props cross
 * the Server/Client boundary.
 *
 * Usage:
 *   <FlowShell redirectTo="/next-stage">
 *     <SomeFlowConnected userId={userId} />
 *   </FlowShell>
 */

import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo } from "react";
import React from "react";

const FlowCompleteContext = createContext<() => void>(() => {});

export function useFlowComplete() {
  return useContext(FlowCompleteContext);
}

export function FlowShell({
  redirectTo,
  children,
}: {
  redirectTo: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const onComplete = useMemo(
    () => () => router.push(redirectTo as Parameters<typeof router.push>[0]),
    [router, redirectTo],
  );
  return (
    <FlowCompleteContext.Provider value={onComplete}>
      {children}
    </FlowCompleteContext.Provider>
  );
}
