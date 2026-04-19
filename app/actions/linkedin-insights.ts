"use server";

import { getUser } from "@/lib/auth/session";
import { getLinkedInData } from "@/lib/db/linkedin";
import { analyzeLinkedInPosts } from "@/lib/ai/linkedin";
import type { PostInsights } from "@/lib/ai/linkedin";

export async function getPostInsights(): Promise<
  | { ok: true; insights: PostInsights }
  | { ok: false; error: string }
> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const data = await getLinkedInData(user.id);
  if (!data) return { ok: false, error: "No LinkedIn data imported yet" };
  if (data.posts.length === 0) return { ok: false, error: "No posts found in import" };

  return analyzeLinkedInPosts(data.posts);
}
