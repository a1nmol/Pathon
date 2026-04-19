import { createClient } from "@/lib/db/server";
import type { NetworkConnection } from "@/types/network";

/**
 * Upsert a batch of connections for a user.
 * Uses insert with ignoreDuplicates since there's no easy composite upsert
 * without a DB-level unique constraint. Falls back to plain insert-all.
 */
export async function saveConnections(
  userId: string,
  connections: NetworkConnection[],
): Promise<void> {
  if (connections.length === 0) return;

  const supabase = await createClient();

  const rows = connections.map((c) => ({
    user_id: userId,
    first_name: c.first_name,
    last_name: c.last_name,
    company: c.company,
    position: c.position,
    connected_on: c.connected_on,
    email: c.email,
  }));

  // Upsert in batches of 500 to avoid request size limits
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("network_connections")
      .upsert(batch, {
        onConflict: "user_id,first_name,last_name,company",
        ignoreDuplicates: false,
      });

    if (error) {
      // Fallback: try plain insert ignoring duplicates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("network_connections")
        .insert(batch, { ignoreDuplicates: true });
    }
  }
}

/**
 * Return all connections for a given user, ordered by connected_on descending.
 */
export async function getConnections(userId: string): Promise<NetworkConnection[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("network_connections")
    .select("id, first_name, last_name, company, position, connected_on, email")
    .eq("user_id", userId)
    .order("connected_on", { ascending: false });

  if (error || !data) return [];
  return data as NetworkConnection[];
}
