"use server";

import { requireUser } from "@/lib/auth/session";
import { buildCareerContext } from "@/lib/ai/context";
import { serializeContext } from "@/lib/ai/decisions";
import { estimateSalaryRange } from "@/lib/ai/salary";
import { createSalarySession } from "@/lib/db/salary";
import type { SalarySession } from "@/types/salary";

export async function getSalaryEstimate(
  roleTitle: string,
  location?: string,
  yearsExp?: number,
  companySize?: string,
): Promise<SalarySession> {
  const user = await requireUser("/");

  const context = await buildCareerContext(user.id);
  const serialized = serializeContext(context);

  const range = await estimateSalaryRange(
    roleTitle,
    location ?? null,
    yearsExp ?? null,
    companySize ?? null,
    serialized,
  );

  const session = await createSalarySession(
    user.id,
    roleTitle,
    location ?? null,
    yearsExp ?? null,
    companySize ?? null,
    range,
  );

  return session;
}
