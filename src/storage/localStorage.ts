import type { PlayableScenario, Solution } from "../scenario/types";
import {
  array,
  integer,
  object,
  string,
  strings,
  unique,
} from "../scenario/validate";
import type {
  Attempt,
  GameSave,
  RecordEntry,
  Report,
  Result,
} from "../game/types";
import { gradeReport, validateReport } from "../game/scoring";
export const storageKey = (id: string) => `network-detective:save:${id}`;
export const emptySave = (): GameSave => ({
  saveVersion: 1,
  activeAttempt: null,
  records: [],
});
type StorageLike = Pick<Storage, "getItem" | "setItem">;
function readReport(value: unknown): Report {
  const r = object(value, "report");
  for (const k of [
    "scopeId",
    "causeId",
    "repairId",
    "preventionId",
    "verificationId",
  ])
    if (r[k] !== null) string(r[k], k);
  const claims = array(r.claims, "claims").map((v) => {
    const c = object(v, "claim");
    return {
      claimId: string(c.claimId, "claimId"),
      evidenceIds: strings(c.evidenceIds, "evidenceIds"),
    };
  });
  return {
    scopeId: r.scopeId as string | null,
    causeId: r.causeId as string | null,
    repairId: r.repairId as string | null,
    preventionId: r.preventionId as string | null,
    verificationId: r.verificationId as string | null,
    claims,
  };
}
function readResult(value: unknown): Result {
  const r = object(value, "result");
  const scores = object(r.scores, "scores");
  for (const [key, max] of [
    ["scope", 10],
    ["cause", 30],
    ["claims", 30],
    ["repair", 10],
    ["prevention", 10],
    ["verification", 10],
  ] as const)
    integer(scores[key], key, 0, max);
  integer(r.total, "total", 0, 100);
  if (
    r.total !==
      Object.values(scores).reduce<number>((sum, p) => sum + Number(p), 0) ||
    typeof r.solved !== "boolean"
  )
    throw new Error("結果データが不正です");
  strings(r.criticalOptionIds, "criticalOptionIds");
  const cs = array(r.claimScores, "claimScores");
  if (cs.length > 3) throw new Error("主張結果が多すぎます");
  for (const v of cs) {
    const c = object(v, "claimScore");
    string(c.claimId, "claimId");
    if (
      ![0, 5, 10].includes(Number(c.points)) ||
      ![
        "complete",
        "partial",
        "contradictory",
        "unrelated",
        "incorrect",
      ].includes(String(c.reason))
    )
      throw new Error("主張結果が不正です");
  }
  return r as unknown as Result;
}
export function parseSave(
  value: unknown,
  s: PlayableScenario,
  solution: Solution,
): { save: GameSave; warning: string | null } {
  const v = object(value, "save");
  if (v.saveVersion !== 1) throw new Error("保存形式のバージョンが未対応です");
  const records: RecordEntry[] = array(v.records, "records").map((value) => {
    const r = object(value, "record");
    if (r.scenarioId !== s.id) throw new Error("別事件の記録です");
    const revision = integer(r.scenarioRevision, "scenarioRevision", 1);
    const report = readReport(r.submittedReport);
    const result = readResult(r.result);
    return {
      scenarioId: s.id,
      scenarioRevision: revision,
      attemptId: string(r.attemptId, "attemptId"),
      hintLevel: integer(r.hintLevel, "hintLevel", 0, 3),
      submittedReport:
        revision === s.revision ? validateReport(report, s, true) : report,
      result:
        revision === s.revision ? gradeReport(report, solution, s) : result,
    };
  });
  unique(
    records.map((r) => r.attemptId),
    "attemptId",
  );
  if (v.activeAttempt === null)
    return {
      save: { saveVersion: 1, activeAttempt: null, records },
      warning: null,
    };
  const a = object(v.activeAttempt, "attempt");
  if (a.saveVersion !== 1 || a.scenarioId !== s.id)
    throw new Error("試行データの形式が不正です");
  const revision = integer(a.scenarioRevision, "scenarioRevision", 1);
  if (revision !== s.revision)
    return {
      save: { saveVersion: 1, activeAttempt: null, records },
      warning:
        "事件データが更新されました。以前の試行は引き継げません。記録を残して、新しい試行を開始してください。",
    };
  const ids = (value: unknown, valid: string[], path: string) => {
    const selected = strings(value, path);
    unique(selected, path);
    if (selected.some((id) => !valid.includes(id)))
      throw new Error(`${path}: 不明なID`);
    return selected;
  };
  const evidenceIds = s.evidence.map((e) => e.id);
  const hypothesisIds = s.hypotheses.map((h) => h.id);
  const hypotheses = object(a.hypothesisStates, "hypothesisStates");
  if (
    Object.keys(hypotheses).length !== hypothesisIds.length ||
    Object.keys(hypotheses).some((id) => !hypothesisIds.includes(id)) ||
    hypothesisIds.some(
      (id) =>
        !["untested", "likely", "excluded"].includes(String(hypotheses[id])),
    )
  )
    throw new Error("仮説の状態が不正です");
  const links = array(a.evidenceLinks, "evidenceLinks").map((value) => {
    const l = object(value, "link");
    if (
      !hypothesisIds.includes(String(l.hypothesisId)) ||
      !evidenceIds.includes(String(l.evidenceId)) ||
      !["support", "refute"].includes(String(l.relation))
    )
      throw new Error("証拠関連付けが不正です");
    return l as Attempt["evidenceLinks"][number];
  });
  unique(
    links.map((l) => `${l.hypothesisId}:${l.evidenceId}`),
    "evidenceLinks",
  );
  if (
    !["brief", "investigating", "submitted", "completed"].includes(
      String(a.phase),
    )
  )
    throw new Error("試行の段階が不正です");
  const locked = a.phase === "submitted" || a.phase === "completed";
  const reportDraft = validateReport(readReport(a.reportDraft), s);
  const submittedReport =
    a.submittedReport === null
      ? null
      : validateReport(readReport(a.submittedReport), s, true);
  if (locked !== (submittedReport !== null) || locked !== (a.result !== null))
    throw new Error("提出状態が不整合です");
  if (a.result !== null) readResult(a.result);
  const attempt: Attempt = {
    saveVersion: 1,
    scenarioId: s.id,
    scenarioRevision: revision,
    attemptId: string(a.attemptId, "attemptId"),
    phase: a.phase as Attempt["phase"],
    openedEvidenceIds: ids(
      a.openedEvidenceIds,
      evidenceIds,
      "openedEvidenceIds",
    ),
    pinnedEvidenceIds: ids(
      a.pinnedEvidenceIds,
      evidenceIds,
      "pinnedEvidenceIds",
    ),
    hypothesisStates: hypotheses as Attempt["hypothesisStates"],
    evidenceLinks: links,
    hintLevel: integer(a.hintLevel, "hintLevel", 0, 3),
    reportDraft,
    submittedReport,
    result: submittedReport ? gradeReport(submittedReport, solution, s) : null,
  };
  if (locked && !records.some((r) => r.attemptId === attempt.attemptId))
    records.push({
      scenarioId: s.id,
      scenarioRevision: revision,
      attemptId: attempt.attemptId,
      hintLevel: attempt.hintLevel,
      submittedReport: submittedReport!,
      result: attempt.result!,
    });
  return {
    save: { saveVersion: 1, activeAttempt: attempt, records },
    warning: null,
  };
}
export function loadSave(
  storage: () => StorageLike,
  s: PlayableScenario,
  solution: Solution,
): { save: GameSave; warning: string | null; writable: boolean } {
  let text: string | null;
  try {
    text = storage().getItem(storageKey(s.id));
  } catch {
    return {
      save: emptySave(),
      warning:
        "保存領域を読み込めません。この画面では遊べますが、再読み込みすると進行を失う可能性があります。",
      writable: false,
    };
  }
  if (!text) return { save: emptySave(), warning: null, writable: true };
  try {
    return { ...parseSave(JSON.parse(text), s, solution), writable: true };
  } catch {
    return {
      save: emptySave(),
      warning:
        "セーブデータを読み込めませんでした。新しい試行を開始してください。",
      writable: true,
    };
  }
}
export function persistSave(
  storage: () => StorageLike,
  scenarioId: string,
  save: GameSave,
): boolean {
  try {
    storage().setItem(storageKey(scenarioId), JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}
