import { prisma } from "@/lib/prisma";

type Client = Pick<typeof prisma, "codeSequence">;

/**
 * Atomic running code generator via the code_sequences table.
 * e.g. generateCode("OWNER", "OWN") -> "OWN-0005"
 *      generateCode("INCOME", "INC", { period: "2568-07" }) -> "INC-2568-07-0001"
 * Never uses count()+1 (race-prone).
 */
export async function generateCode(
  entity: string,
  prefix: string,
  opts?: { period?: string; pad?: number; client?: Client }
): Promise<string> {
  const period = opts?.period ?? "";
  const pad = opts?.pad ?? 4;
  const client = opts?.client ?? prisma;

  const seq = await client.codeSequence.upsert({
    where: { entity_period: { entity, period } },
    create: { entity, period, lastNo: 1 },
    update: { lastNo: { increment: 1 } },
  });

  const num = String(seq.lastNo).padStart(pad, "0");
  return period ? `${prefix}-${period}-${num}` : `${prefix}-${num}`;
}
