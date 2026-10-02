import { expect, it } from "vitest";
import { gameReducer, newAttempt } from "../../src/game/reducer";
import { playableScenario as s, getSolution } from "../../src/scenario/load";
import { emptySave } from "../../src/storage/localStorage";
import { gradeReport } from "../../src/game/scoring";
import { correctReport } from "../helpers/report";
it("preserves notes, links, opened evidence, pinning and sequential hints", () => {
  let save = gameReducer(emptySave(), {
    type: "NEW",
    attempt: newAttempt(s, "one"),
  });
  save = gameReducer(save, { type: "START" });
  save = gameReducer(save, { type: "OPEN", evidenceId: "E01" });
  save = gameReducer(save, { type: "OPEN", evidenceId: "E01" });
  save = gameReducer(save, { type: "PIN", evidenceId: "E01" });
  save = gameReducer(save, {
    type: "HYPOTHESIS",
    hypothesisId: "H_DNS",
    state: "likely",
  });
  save = gameReducer(save, {
    type: "LINK",
    hypothesisId: "H_DNS",
    evidenceId: "E01",
    relation: "support",
  });
  save = gameReducer(save, {
    type: "LINK",
    hypothesisId: "H_DNS",
    evidenceId: "E01",
    relation: "refute",
  });
  for (let i = 0; i < 4; i++) save = gameReducer(save, { type: "HINT" });
  expect(save.activeAttempt).toMatchObject({
    openedEvidenceIds: ["E01"],
    pinnedEvidenceIds: ["E01"],
    hypothesisStates: { H_DNS: "likely" },
    hintLevel: 3,
    evidenceLinks: [
      { hypothesisId: "H_DNS", evidenceId: "E01", relation: "refute" },
    ],
  });
  save = gameReducer(save, {
    type: "LINK",
    hypothesisId: "H_DNS",
    evidenceId: "E01",
    relation: null,
  });
  expect(save.activeAttempt!.evidenceLinks).toEqual([]);
});
it("submits exactly once, locks edits and retains the initial record during retry", () => {
  const report = correctReport(),
    result = gradeReport(report, getSolution(), s);
  let save = gameReducer(emptySave(), {
    type: "NEW",
    attempt: newAttempt(s, "one"),
  });
  save = gameReducer(save, { type: "START" });
  save = gameReducer(save, { type: "SUBMIT", report, result });
  const submitted = save;
  save = gameReducer(save, { type: "SUBMIT", report, result });
  save = gameReducer(save, {
    type: "DRAFT",
    report: { ...report, causeId: null },
  });
  save = gameReducer(save, { type: "HINT" });
  expect(save).toEqual(submitted);
  save = gameReducer(save, { type: "COMPLETE" });
  save = gameReducer(save, { type: "OPEN", evidenceId: "E04" });
  expect(save.activeAttempt!.phase).toBe("completed");
  save = gameReducer(save, { type: "NEW", attempt: newAttempt(s, "two") });
  expect(save.records).toHaveLength(1);
  expect(save.records[0].result.total).toBe(100);
  expect(save.activeAttempt).toMatchObject({
    attemptId: "two",
    phase: "brief",
    reportDraft: { causeId: null },
  });
});
