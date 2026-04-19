import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getUserType } from "@/app/actions/onboarding";
import { RoleSelector } from "@/components/onboarding/RoleSelector";

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/");

  // Already chose a role → skip onboarding
  const userType = await getUserType();
  if (userType === "employer") redirect("/employer/dashboard");
  if (userType === "applicant") redirect("/dashboard");

  return <RoleSelector />;
}
