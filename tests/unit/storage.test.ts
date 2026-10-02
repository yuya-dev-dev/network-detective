import { expect, it } from "vitest";
import {
  emptySave,
  loadSave,
  parseSave,
  persistSave,
  storageKey,
} from "../../src/storage/localStorage";
import { gameReducer, newAttempt } from "../../src/game/reducer";
import { playableScenario as s, getSolution } from "../../src/scenario/load";
import { gradeReport } from "../../src/game/scoring";
import { correctReport } from "../helpers/report";
const solution = getSolution();
function memory() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}
function draftSave() {
  let save = gameReducer(emptySave(), {
    type: "NEW",
    attempt: newAttempt(s, "draft"),
  });
  save = gameReducer(save, { type: "START" });
  return gameReducer(save, { type: "DRAFT", report: correctReport() });
}
it("round trips a draft without touching other scenario keys", () => {
  const store = memory();
  store.setItem(storageKey("other"), "keep");
  const save = draftSave();
  expect(persistSave(() => store, s.id, save)).toBe(true);
  expect(loadSave(() => store, s, solution).save).toEqual(save);
  expect(store.getItem(storageKey("other"))).toBe("keep");
});
it("recovers a submitted attempt without reopening editing or adding duplicate records", () => {
  const report = correctReport();
  const save = gameReducer(draftSave(), {
    type: "SUBMIT",
    report,
    result: gradeReport(report, solution, s),
  });
  expect(parseSave(save, s, solution).save.activeAttempt!.phase).toBe(
    "submitted",
  );
  expect(parseSave(save, s, solution).save.records).toHaveLength(1);
  save.records = [];
  expect(parseSave(save, s, solution).save.records).toHaveLength(1);
});
it("handles broken JSON and unavailable storage without crashing", () => {
  const store = memory();
  store.setItem(storageKey(s.id), "{broken");
  expect(loadSave(() => store, s, solution)).toMatchObject({
    save: emptySave(),
    writable: true,
  });
  expect(
    loadSave(
      () => {
        throw new Error("denied");
      },
      s,
      solution,
    ),
  ).toMatchObject({ save: emptySave(), writable: false });
  expect(
    persistSave(
      () => ({
        getItem: () => null,
        setItem: () => {
          throw new Error("quota");
        },
      }),
      s.id,
      draftSave(),
    ),
  ).toBe(false);
});
it("does not apply an old revision while preserving submitted records", () => {
  const report = correctReport();
  const save = gameReducer(draftSave(), {
    type: "SUBMIT",
    report,
    result: gradeReport(report, solution, s),
  });
  const newer = { ...s, revision: 2 };
  const loaded = parseSave(save, newer, solution);
  expect(loaded.save.activeAttempt).toBeNull();
  expect(loaded.save.records).toHaveLength(1);
  expect(loaded.warning).toContain("更新");
});
it.each(["ids", "claims", "evidence", "links", "version", "phase"])(
  "rejects structurally invalid %s saves",
  (kind) => {
    const invalid: any = draftSave();
    if (kind === "ids") invalid.activeAttempt.openedEvidenceIds = ["unknown"];
    if (kind === "claims")
      invalid.activeAttempt.reportDraft.claims.push({
        claimId: "C_PING",
        evidenceIds: ["E03"],
      });
    if (kind === "evidence")
      invalid.activeAttempt.reportDraft.claims[0].evidenceIds = [
        "E01",
        "E02",
        "E08",
      ];
    if (kind === "links")
      invalid.activeAttempt.evidenceLinks = [
        { hypothesisId: "H_DNS", evidenceId: "E01", relation: "wrong" },
      ];
    if (kind === "version") invalid.saveVersion = 9;
    if (kind === "phase") invalid.activeAttempt.phase = "completed";
    expect(() => parseSave(invalid, s, solution)).toThrow();
  },
);
