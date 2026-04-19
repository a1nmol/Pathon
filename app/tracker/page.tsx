import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { getApplications } from "@/lib/db/tracker";
import { KanbanBoard } from "@/components/tracker/KanbanBoard";

export const metadata = { title: "Application Tracker — Pathon" };

export default async function TrackerPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const apps = await getApplications(user.id);

  return (
    <main style={{ padding: "5.5rem 1.5rem 3rem", paddingLeft: "calc(var(--sidebar-w, 80px) + 1.5rem)", maxWidth: "1400px", margin: "0 auto" }}>
      <KanbanBoard initialApps={apps} />
    </main>
  );
}
