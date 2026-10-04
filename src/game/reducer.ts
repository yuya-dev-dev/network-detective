import type { PlayableScenario } from "../scenario/types";
import type { Attempt, GameSave, Report, Result } from "./types";
import { normalizeReport } from "./scoring";
export const emptyReport = (): Report => ({
  scopeId: null,
  causeId: null,
  claims: [],
  repairId: null,
  preventionId: null,
  verificationId: null,
});
export function newAttempt(s: PlayableScenario, attemptId: string): Attempt {
  return {
    saveVersion: 1,
    scenarioId: s.id,
    scenarioRevision: s.revision,
    attemptId,
    phase: "brief",
    openedEvidenceIds: [],
    pinnedEvidenceIds: [],
    hypothesisStates: Object.fromEntries(
      s.hypotheses.map((h) => [h.id, "untested"]),
    ),
    evidenceLinks: [],
    hintLevel: 0,
    reportDraft: emptyReport(),
    submittedReport: null,
    result: null,
  };
}
export type Action =
  | { type: "SYNC"; save: GameSave }
  | { type: "NEW"; attempt: Attempt }
  | { type: "START" }
  | { type: "OPEN"; evidenceId: string }
  | { type: "PIN"; evidenceId: string; checked?: boolean }
  | {
      type: "HYPOTHESIS";
      hypothesisId: string;
      state: Attempt["hypothesisStates"][string];
    }
  | {
      type: "LINK";
      hypothesisId: string;
      evidenceId: string;
      relation: "support" | "refute" | null;
    }
  | { type: "HINT" }
  | { type: "DRAFT"; report: Report }
  | { type: "SUBMIT"; report: Report; result: Result }
  | { type: "COMPLETE" };
export function gameReducer(save: GameSave, action: Action): GameSave {
  if (action.type === "SYNC") return action.save;
  if (action.type === "NEW") return { ...save, activeAttempt: action.attempt };
  const a = save.activeAttempt;
  if (!a) return save;
  const locked = a.phase === "submitted" || a.phase === "completed";
  if (locked && !["OPEN", "COMPLETE"].includes(action.type)) return save;
  let next = a;
  switch (action.type) {
    case "START":
      if (a.phase === "brief") next = { ...a, phase: "investigating" };
      break;
    case "OPEN":
      next = {
        ...a,
        openedEvidenceIds: [
          ...new Set([...a.openedEvidenceIds, action.evidenceId]),
        ],
      };
      break;
    case "PIN":
      next = {
        ...a,
        pinnedEvidenceIds:
          (action.checked ?? !a.pinnedEvidenceIds.includes(action.evidenceId))
            ? [...new Set([...a.pinnedEvidenceIds, action.evidenceId])]
            : a.pinnedEvidenceIds.filter((id) => id !== action.evidenceId),
      };
      break;
    case "HYPOTHESIS":
      next = {
        ...a,
        hypothesisStates: {
          ...a.hypothesisStates,
          [action.hypothesisId]: action.state,
        },
      };
      break;
    case "LINK":
      next = {
        ...a,
        evidenceLinks: [
          ...a.evidenceLinks.filter(
            (l) =>
              l.hypothesisId !== action.hypothesisId ||
              l.evidenceId !== action.evidenceId,
          ),
          ...(action.relation
            ? [
                {
                  hypothesisId: action.hypothesisId,
                  evidenceId: action.evidenceId,
                  relation: action.relation,
                },
              ]
            : []),
        ],
      };
      break;
    case "HINT":
      next = { ...a, hintLevel: Math.min(3, a.hintLevel + 1) };
      break;
    case "DRAFT":
      next = { ...a, reportDraft: normalizeReport(action.report) };
      break;
    case "SUBMIT": {
      if (a.phase !== "investigating") return save;
      next = {
        ...a,
        phase: "submitted",
        submittedReport: normalizeReport(action.report),
        result: action.result,
      };
      const record = {
        scenarioId: a.scenarioId,
        scenarioRevision: a.scenarioRevision,
        attemptId: a.attemptId,
        hintLevel: a.hintLevel,
        submittedReport: next.submittedReport!,
        result: action.result,
      };
      return {
        ...save,
        activeAttempt: next,
        records: save.records.some((r) => r.attemptId === a.attemptId)
          ? save.records
          : [...save.records, record],
      };
    }
    case "COMPLETE":
      if (a.phase === "submitted") next = { ...a, phase: "completed" };
      break;
  }
  return { ...save, activeAttempt: next };
}
