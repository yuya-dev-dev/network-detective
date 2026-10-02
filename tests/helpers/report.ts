import { getSolution } from "../../src/scenario/load";
import type { Report } from "../../src/game/types";
export function correctReport(): Report {
  const s = getSolution();
  return {
    scopeId: s.scopeId,
    causeId: s.causeId,
    repairId: s.repairId,
    preventionId: s.preventionId,
    verificationId: s.verificationId,
    claims: s.claimRules.map((rule) => ({
      claimId: rule.claimId,
      evidenceIds: rule.requiredEvidenceSets[0],
    })),
  };
}
