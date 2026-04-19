import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { CoverLetterGenerator } from "@/components/cover-letter/CoverLetterGenerator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cover Letter — Pathon",
};

export default async function CoverLetterPage() {
  const user = await getUser();
  if (!user) redirect("/");

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingLeft: "var(--sidebar-w, 60px)" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "calc(56px + 3rem) 5vw 6rem" }}>
        <CoverLetterGenerator />
      </div>
    </div>
  );
}
