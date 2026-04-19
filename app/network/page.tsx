import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { getConnections } from "@/lib/db/network";
import { NetworkMap } from "@/components/network/NetworkMap";

export const metadata = { title: "Network Map — Pathon" };

export default async function NetworkPage() {
  const user = await getUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user) redirect("/" as any);

  const connections = await getConnections(user.id);

  return (
    <main
      style={{
        padding: "5.5rem 1.5rem 3rem",
        paddingLeft: "calc(var(--sidebar-w, 80px) + 1.5rem)",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <NetworkMap initialConnections={connections} />
    </main>
  );
}
