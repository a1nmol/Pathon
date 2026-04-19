import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { ATSScanner } from "@/components/ats/ATSScanner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ATS Scanner — Pathon",
};

export default async function ATSPage() {
  const user = await getUser();
  if (!user) redirect("/");

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingLeft: "var(--sidebar-w, 60px)" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "calc(56px + 3rem) 5vw 6rem" }}>
        <ATSScanner />
      </div>
    </div>
  );
}
