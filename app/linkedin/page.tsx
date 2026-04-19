import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getLinkedInData } from "@/lib/db/linkedin";
import { LinkedInImport } from "@/components/linkedin/LinkedInImport";

export default async function LinkedInPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const existing = await getLinkedInData(user.id);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingLeft: "var(--sidebar-w, 80px)" }}>
      <LinkedInImport alreadyImported={existing !== null} />
    </div>
  );
}
