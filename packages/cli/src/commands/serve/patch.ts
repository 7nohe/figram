import type { IRDocument, PatchMessage } from "@figram/core";
import { diff } from "@figram/core";

export function computePatchMessage(
  prevIR: IRDocument | null,
  baseRev: number,
  nextIR: IRDocument,
): PatchMessage | null {
  const ops = diff(prevIR, nextIR);
  if (ops.length === 0) return null;
  return { type: "patch", baseRev, nextRev: baseRev + 1, ops };
}
