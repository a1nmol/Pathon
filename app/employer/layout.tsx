import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getUserType } from "@/app/actions/onboarding";
import { EmployerNav } from "@/components/employer/EmployerNav";
import { EmployerTopBar } from "@/components/employer/EmployerTopBar";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/");

  const userType = await getUserType();
  // Allow null — first time coming here during onboarding
  if (userType === "applicant") redirect("/dashboard");

  return (
    <>
      <EmployerNav />
      <EmployerTopBar />
      <main
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          paddingLeft: "var(--sidebar-w, 60px)",
        }}
      >
        {children}
      </main>
    </>
  );
}
