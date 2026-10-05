import { getSolution } from "../../src/scenario/load";
import type { Solution } from "../../src/scenario/types";
import type { Report } from "../../src/game/types";
export function correctReport(s: Solution = getSolution()): Report {
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
