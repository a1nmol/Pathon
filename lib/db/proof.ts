/**
 * Proof Capsule — database operations.
 *
 * All writes go through saveProofCapsule(), which handles both insert
 * (new capsule) and update (existing), then appends a revision row.
 */

import { createClient } from "@/lib/db/client";
import type {
  ProofCapsuleRecord,
  ProofCapsuleInsert,
  ProofCapsuleRevision,
} from "@/types/proof";

// ---------------------------------------------------------------------------
// Word count helper
// ---------------------------------------------------------------------------

function countWords(...sections: (string | null)[]): number {
  return sections
    .filter(Boolean)
    .join(" ")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

// ---------------------------------------------------------------------------
// saveProofCapsule
// Insert on first save (id === null), update on subsequent saves.
// Always appends a revision row.
// Returns the capsule id (new or existing).
// ---------------------------------------------------------------------------

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function saveProofCapsule(
  userId: string,
  draft: {
    id: string | null;
    claim: string;
    context: string;
    constraints: string;
    decision_reasoning: string;
    iterations: string;
    reflection: string;
    tags: string[];
  },
): Promise<SaveResult> {
  const supabase = createClient();

  let capsuleId: string;

  if (!draft.id) {
    // Insert
    const insert: ProofCapsuleInsert = {
      user_id: userId,
      claim: draft.claim,
      context: draft.context || null,
      constraints: draft.constraints || null,
      decision_reasoning: draft.decision_reasoning || null,
      iterations: draft.iterations || null,
      reflection: draft.reflection || null,
      tags: draft.tags,
      is_complete: false, // trigger will compute this
    };

    const { data, error } = await supabase
      .from("proof_capsules")
      .insert(insert)
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Insert failed" };
    capsuleId = data.id;
  } else {
    // Update
    const { error } = await supabase
      .from("proof_capsules")
      .update({
        claim: draft.claim,
        context: draft.context || null,
        constraints: draft.constraints || null,
        decision_reasoning: draft.decision_reasoning || null,
        iterations: draft.iterations || null,
        reflection: draft.reflection || null,
        tags: draft.tags,
      })
      .eq("id", draft.id)
      .eq("user_id", userId);

    if (error) return { ok: false, error: error.message };
    capsuleId = draft.id;
  }

  // Append revision — best-effort, does not block on failure
  const snapshot = {
    claim: draft.claim,
    context: draft.context || null,
    constraints: draft.constraints || null,
    decision_reasoning: draft.decision_reasoning || null,
    iterations: draft.iterations || null,
    reflection: draft.reflection || null,
    tags: draft.tags,
  };

  await supabase.from("proof_capsule_revisions").insert({
    capsule_id: capsuleId,
    user_id: userId,
    snapshot,
    word_count: countWords(
      draft.claim,
      draft.context,
      draft.constraints,
      draft.decision_reasoning,
      draft.iterations,
      draft.reflection,
    ),
  });

  return { ok: true, id: capsuleId };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listProofCapsules(
  userId: string,
): Promise<ProofCapsuleRecord[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("proof_capsules")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return (data ?? []) as ProofCapsuleRecord[];
}

export async function getProofCapsule(
  id: string,
  userId: string,
): Promise<ProofCapsuleRecord | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("proof_capsules")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  return (data as ProofCapsuleRecord) ?? null;
}

export async function getRevisions(
  capsuleId: string,
): Promise<ProofCapsuleRevision[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("proof_capsule_revisions")
    .select("*")
    .eq("capsule_id", capsuleId)
    .order("saved_at", { ascending: false });
  return (data ?? []) as ProofCapsuleRevision[];
}
