import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { MockInterviewInterface } from "@/components/mock-interview/MockInterviewInterface";

export const metadata: Metadata = {
  title: "Mock Interview — Pathon",
  description: "Practice with an AI interviewer and get detailed feedback on your performance.",
};

export default async function MockInterviewPage() {
  const user = await getUser();
  if (!user) redirect("/");

  return <MockInterviewInterface />;
}
