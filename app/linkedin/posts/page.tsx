import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getLinkedInData } from "@/lib/db/linkedin";
import { PostsArchive } from "@/components/linkedin/PostsArchive";

export default async function LinkedInPostsPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const data = await getLinkedInData(user.id);
  if (!data) redirect("/linkedin");

  return <PostsArchive posts={data.posts} totalPostCount={data.post_count} />;
}
