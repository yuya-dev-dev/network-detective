import type { PlayableScenario, Solution } from "../scenario/types";
import type { ClaimAnswer, Report, Result } from "./types";

export function normalizeReport(report: Report): Report {
  const claims = new Map<string, ClaimAnswer>();
  for (const claim of report.claims) {
    const previous = claims.get(claim.claimId);
    claims.set(claim.claimId, {
      claimId: claim.claimId,
      evidenceIds: [
        ...new Set([...(previous?.evidenceIds ?? []), ...claim.evidenceIds]),
      ].sort(),
    });
  }
  return {
    ...report,
    claims: [...claims.values()].sort((a, b) =>
      a.claimId.localeCompare(b.claimId),
    ),
  };
}
export function validateReport(
  report: Report,
  scenario: PlayableScenario,
  complete = false,
) {
  const r = normalizeReport(report);
  for (const [field, group] of [
    ["scopeId", "scopeOptions"],
    ["causeId", "causeOptions"],
    ["repairId", "repairOptions"],
    ["preventionId", "preventionOptions"],
    ["verificationId", "verificationOptions"],
  ] as const) {
    const id = r[field];
    if (
      (complete && !id) ||
      (id !== null && !scenario.reportOptions[group].some((o) => o.id === id))
    )
      throw new Error("報告の選択を確認してください");
  }
  if (r.claims.length > 3) throw new Error("主張は最大3枚です");
  for (const claim of r.claims) {
    if (
      !scenario.reportOptions.claimOptions.some(
        (o) => o.id === claim.claimId,
      ) ||
      claim.evidenceIds.length > 2 ||
      (complete && claim.evidenceIds.length < 1) ||
      claim.evidenceIds.some(
        (id) => !scenario.evidence.some((e) => e.id === id),
      )
    )
      throw new Error("各主張の証拠は1〜2件です");
  }
  return r;
}
export function validateSubmission(report: Report, scenario: PlayableScenario) {
  const normalized = validateReport(report, scenario, true);
  if (normalized.claims.length !== 3)
    throw new Error("判断根拠の主張を3枚選んでください");
  return normalized;
}
export function gradeReport(
  report: Report,
  solution: Solution,
  scenario: PlayableScenario,
): Result {
  const r = validateReport(report, scenario);
  const claimScores: Result["claimScores"] = r.claims.map((claim) => {
    const rule = solution.claimRules.find(
      (rule) => rule.claimId === claim.claimId,
    );
    if (!rule)
      return { claimId: claim.claimId, points: 0, reason: "incorrect" };
    const selected = new Set(claim.evidenceIds);
    if (rule.contradictoryEvidenceIds.some((id) => selected.has(id)))
      return { claimId: claim.claimId, points: 0, reason: "contradictory" };
    if (
      rule.requiredEvidenceSets.some((set) =>
        set.every((id) => selected.has(id)),
      )
    )
      return { claimId: claim.claimId, points: 10, reason: "complete" };
    const support = [
      ...rule.requiredEvidenceSets.flat(),
      ...rule.allowedSupportingEvidenceIds,
    ];
    if (support.some((id) => selected.has(id)))
      return { claimId: claim.claimId, points: 5, reason: "partial" };
    return { claimId: claim.claimId, points: 0, reason: "unrelated" };
  });
  const scores = {
    scope: r.scopeId === solution.scopeId ? 10 : 0,
    cause: r.causeId === solution.causeId ? 30 : 0,
    claims: claimScores.reduce((sum, claim) => sum + claim.points, 0),
    repair: r.repairId === solution.repairId ? 10 : 0,
    prevention: r.preventionId === solution.preventionId ? 10 : 0,
    verification: r.verificationId === solution.verificationId ? 10 : 0,
  };
  const total = Object.values(scores).reduce((sum, points) => sum + points, 0);
  const selectedOptions = [
    r.scopeId,
    r.causeId,
    r.repairId,
    r.preventionId,
    r.verificationId,
    ...r.claims.map((c) => c.claimId),
  ];
  const criticalOptionIds = solution.criticalOptionIds.filter((id) =>
    selectedOptions.includes(id),
  );
  return {
    scores,
    total,
    claimScores,
    criticalOptionIds,
    solved:
      scores.cause === 30 &&
      scores.repair === 10 &&
      scores.verification === 10 &&
      scores.claims >= 20 &&
      total >= 80 &&
      criticalOptionIds.length === 0,
  };
}
