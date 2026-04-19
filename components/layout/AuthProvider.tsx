"use client";

import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

type AuthContextValue = {
  user: User | null;
};

const AuthContext = createContext<AuthContextValue>({ user: null });

export function AuthProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

/** Returns the full user object, or null if unauthenticated. */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

/** Convenience hook — returns only the user ID string, or null. */
export function useUserId(): string | null {
  return useContext(AuthContext).user?.id ?? null;
}
