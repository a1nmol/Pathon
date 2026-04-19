import { createClient } from "@/lib/db/server";
import type { LinkedInRecord, ParsedLinkedInData } from "@/types/linkedin";

export async function saveLinkedInData(
  userId: string,
  data: ParsedLinkedInData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("linkedin_data").upsert(
    {
      user_id: userId,
      headline: data.headline,
      summary: data.summary,
      location: data.location,
      positions: data.positions,
      education: data.education,
      skills: data.skills,
      posts: data.posts,
      post_count: data.posts.length,
      position_count: data.positions.length,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getLinkedInData(
  userId: string,
): Promise<LinkedInRecord | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("linkedin_data")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data as LinkedInRecord | null;
}
