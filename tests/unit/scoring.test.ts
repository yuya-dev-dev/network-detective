import { describe, expect, it } from "vitest";
import { playableScenario as s, getSolution } from "../../src/scenario/load";
import {
  gradeReport,
  normalizeReport,
  validateReport,
  validateSubmission,
} from "../../src/game/scoring";
import { emptyReport } from "../../src/game/reducer";
import { correctReport } from "../helpers/report";
const solution = getSolution();
describe("fixed grading rubric", () => {
  it("requires three claims only for new submissions and retains partial evidence grading", () => {
    const report = correctReport();
    report.claims = report.claims.slice(0, 2);
    expect(() => validateReport(report, s, true)).not.toThrow();
    expect(() => validateSubmission(report, s)).toThrow("3枚");
    const partial = correctReport();
    partial.claims[2].evidenceIds = ["E05"];
    expect(() => validateSubmission(partial, s)).not.toThrow();
    expect(gradeReport(partial, solution, s).scores.claims).toBe(25);
  });
  it.each([
    ["C_DNS", ["E02"], 10],
    ["C_DNS", ["E02", "E01"], 10],
    ["C_DNS", ["E01"], 5],
    ["C_DNS", ["E08"], 0],
    ["C_DNS", ["E02", "E08"], 10],
    ["C_DROP", ["E04"], 10],
    ["C_DROP", ["E04", "E03"], 10],
    ["C_DROP", ["E03"], 5],
    ["C_DROP", ["E08"], 0],
    ["C_MISMATCH", ["E05", "E06"], 10],
    ["C_MISMATCH", ["E05", "E03"], 10],
    ["C_MISMATCH", ["E05"], 5],
    ["C_MISMATCH", ["E06"], 5],
    ["C_MISMATCH", ["E03"], 5],
    ["C_MISMATCH", ["E06", "E03"], 5],
    ["C_MISMATCH", ["E08"], 0],
    ["C_PING", ["E03"], 0],
  ])("%s with %j = %d", (claimId, ids, expected) => {
    expect(
      gradeReport(
        {
          ...emptyReport(),
          claims: [{ claimId: String(claimId), evidenceIds: ids as string[] }],
        },
        solution,
        s,
      ).scores.claims,
    ).toBe(expected);
  });
  it("is deterministic and accepts the alternate complete evidence set", () => {
    const r = correctReport();
    expect(gradeReport(r, solution, s)).toMatchObject({
      total: 100,
      solved: true,
    });
    r.claims[2].evidenceIds = ["E03", "E05"];
    expect(gradeReport(r, solution, s)).toMatchObject({
      total: 100,
      solved: true,
    });
    expect(gradeReport(r, solution, s)).toEqual(
      gradeReport(structuredClone(r), solution, s),
    );
  });
  it("ignores order and duplicates without double scoring", () => {
    const r = correctReport();
    r.claims.push({ ...r.claims[0], evidenceIds: ["E02", "E02"] });
    expect(normalizeReport(r).claims).toHaveLength(3);
    expect(gradeReport(r, solution, s).total).toBe(100);
  });
  it("gives contradiction precedence even when a required set is complete", () => {
    const copy = structuredClone(solution);
    copy.claimRules[0].contradictoryEvidenceIds = ["E08"];
    const result = gradeReport(
      {
        ...emptyReport(),
        claims: [{ claimId: "C_DNS", evidenceIds: ["E02", "E08"] }],
      },
      copy,
      s,
    );
    expect(result.claimScores[0]).toMatchObject({
      points: 0,
      reason: "contradictory",
    });
  });
  it("does not solve a cause-only report or erase independent correct facts for a wrong cause", () => {
    expect(
      gradeReport({ ...emptyReport(), causeId: solution.causeId }, solution, s),
    ).toMatchObject({ total: 30, solved: false });
    expect(
      gradeReport({ ...correctReport(), causeId: "H_DNS" }, solution, s),
    ).toMatchObject({ total: 70, solved: false, scores: { claims: 30 } });
  });
  it("enforces the total and evidence thresholds separately", () => {
    const r = correctReport();
    r.scopeId = "S_ALL";
    r.preventionId = "A_CLEAR_DNS";
    expect(gradeReport(r, solution, s)).toMatchObject({
      total: 80,
      solved: true,
    });
    r.claims[2].evidenceIds = ["E06"];
    expect(gradeReport(r, solution, s)).toMatchObject({
      total: 75,
      solved: false,
    });
    const partial = correctReport();
    partial.claims = [
      { claimId: "C_DNS", evidenceIds: ["E01"] },
      { claimId: "C_DROP", evidenceIds: ["E03"] },
      { claimId: "C_MISMATCH", evidenceIds: ["E06"] },
    ];
    expect(gradeReport(partial, solution, s)).toMatchObject({
      total: 85,
      solved: false,
      scores: { claims: 15 },
    });
  });
  it("blocks critical options without a hidden score penalty", () => {
    expect(
      gradeReport(
        { ...correctReport(), repairId: "A_DISABLE_FW" },
        solution,
        s,
      ),
    ).toMatchObject({
      total: 90,
      solved: false,
      criticalOptionIds: ["A_DISABLE_FW"],
    });
  });
  it("rejects unknown IDs, too many claims and too many distinct evidence IDs", () => {
    expect(() =>
      validateReport({ ...correctReport(), causeId: "unknown" }, s),
    ).toThrow();
    const r = correctReport();
    r.claims.push({ claimId: "C_PING", evidenceIds: ["E03"] });
    expect(() => gradeReport(r, solution, s)).toThrow();
    r.claims = [{ claimId: "C_DNS", evidenceIds: ["E01", "E02", "E08"] }];
    expect(() => gradeReport(r, solution, s)).toThrow();
    r.claims = [{ claimId: "C_DNS", evidenceIds: [] }];
    expect(() => validateReport(r, s, true)).toThrow();
  });
});
