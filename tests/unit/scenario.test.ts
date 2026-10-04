import { expect, it } from "vitest";
import data from "../../src/data/case01.json";
import { assertScenario } from "../../src/scenario/validate";
import { playableScenario } from "../../src/scenario/load";
it("has exactly one playable case, eight evidence cards and no author data in the UI projection", () => {
  expect(() => assertScenario(data)).not.toThrow();
  expect(data.evidence.map((e) => e.id)).toEqual([
    "E01",
    "E02",
    "E03",
    "E04",
    "E05",
    "E06",
    "E07",
    "E08",
  ]);
  expect(playableScenario).not.toHaveProperty("solution");
  expect(data.hypotheses).toHaveLength(4);
  expect(data.brief.length).toBeGreaterThanOrEqual(200);
  expect(data.brief.length).toBeLessThanOrEqual(350);
});
it.each([
  "missing",
  "duplicate",
  "reference",
  "html",
  "table",
  "oversize",
  "feedback",
  "time",
  "evidenceCount",
  "evidenceCountMismatch",
])("rejects %s data errors before a build", (kind) => {
  const invalid: any = structuredClone(data);
  if (kind === "missing") delete invalid.context;
  if (kind === "duplicate") invalid.evidence[1].id = "E01";
  if (kind === "reference") invalid.evidence[0].nodeIds.push("N_UNKNOWN");
  if (kind === "html")
    invalid.evidence[0].content.blocks = [
      { type: "html", body: "<div>raw</div>" },
    ];
  if (kind === "table") invalid.evidence[0].content.blocks[0].rows[0].pop();
  if (kind === "oversize")
    invalid.solution.claimRules[0].requiredEvidenceSets = [
      ["E01", "E02", "E03"],
    ];
  if (kind === "feedback") delete invalid.solution.optionFeedback.C_DNS;
  if (kind === "time") invalid.context.snapshotTime = "tomorrow";
  if (kind === "evidenceCount")
    delete invalid.reportOptions.claimOptions[0].requiredEvidenceCount;
  if (kind === "evidenceCountMismatch")
    invalid.reportOptions.claimOptions.find(
      (o: any) => o.id === "C_MISMATCH",
    ).requiredEvidenceCount = 1;
  expect(() => assertScenario(invalid)).toThrow();
});
