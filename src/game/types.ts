export type ClaimAnswer = { claimId: string; evidenceIds: string[] };
export type Report = {
  scopeId: string | null;
  causeId: string | null;
  claims: ClaimAnswer[];
  repairId: string | null;
  preventionId: string | null;
  verificationId: string | null;
};
export type Result = {
  total: number;
  solved: boolean;
  criticalOptionIds: string[];
  scores: {
    scope: number;
    cause: number;
    claims: number;
    repair: number;
    prevention: number;
    verification: number;
  };
  claimScores: {
    claimId: string;
    points: number;
    reason:
      "complete" | "partial" | "contradictory" | "unrelated" | "incorrect";
  }[];
};
export type Attempt = {
  saveVersion: 1;
  scenarioId: string;
  scenarioRevision: number;
  attemptId: string;
  phase: "brief" | "investigating" | "submitted" | "completed";
  openedEvidenceIds: string[];
  pinnedEvidenceIds: string[];
  hypothesisStates: Record<string, "untested" | "likely" | "excluded">;
  evidenceLinks: {
    hypothesisId: string;
    evidenceId: string;
    relation: "support" | "refute";
  }[];
  hintLevel: number;
  reportDraft: Report;
  submittedReport: Report | null;
  result: Result | null;
};
export type RecordEntry = Pick<
  Attempt,
  "scenarioId" | "scenarioRevision" | "attemptId" | "hintLevel"
> & { submittedReport: Report; result: Result };
export type GameSave = {
  saveVersion: 1;
  activeAttempt: Attempt | null;
  records: RecordEntry[];
};
