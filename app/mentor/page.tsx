import { requireStage } from "@/lib/auth/flow";
import { getLatestSnapshot } from "@/lib/db/memory";
import { MentorInterface } from "@/components/identity/MentorInterface";
import type { CareerPathAnalysis } from "@/types/decisions";

export default async function MentorPage() {
  const { userId } = await requireStage("mentor");
  const snapshot = await getLatestSnapshot(userId);
  const paths =
    (snapshot?.analysis as CareerPathAnalysis | null)?.paths ?? [];

  return <MentorInterface userId={userId} paths={paths} />;
}
