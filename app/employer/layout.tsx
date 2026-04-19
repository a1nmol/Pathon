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
          paddingLeft: "var(--sidebar-w, 68px)",
          transition: "padding-left 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {children}
      </main>
    </>
  );
}
