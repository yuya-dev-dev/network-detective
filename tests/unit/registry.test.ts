import { describe, expect, it } from "vitest";
import { cases, caseHash, caseIdFromHash } from "../../src/scenario/registry";
import { assertNarrative } from "../../src/scenario/narrative";
import { getLayout } from "../../src/ui/topologyLayouts";
import { newAttempt } from "../../src/game/reducer";
import {
  loadSave,
  persistSave,
  storageKey,
} from "../../src/storage/localStorage";
describe("case registry and existing save compatibility", () => {
  it("separates author answers and has complete semantic diagram references", () => {
    expect(cases.map((e) => e.scenario.id)).toEqual(
      Array.from(
        { length: 16 },
        (_, i) => `case${String(i + 1).padStart(2, "0")}`,
      ),
    );
    for (const { scenario, narrative } of cases) {
      expect(scenario).not.toHaveProperty("solution");
      assertNarrative(narrative, scenario);
      const layout = getLayout(scenario);
      expect(Object.keys(layout.nodes).sort()).toEqual(
        scenario.topology.nodes.map((n) => n.id).sort(),
      );
      expect(Object.keys(layout.edges).sort()).toEqual(
        scenario.topology.links.map((l) => l.id).sort(),
      );
      for (const n of Object.values(layout.nodes)) {
        expect(n.at[0] - 76).toBeGreaterThanOrEqual(0);
        expect(n.at[0] + 76).toBeLessThanOrEqual(layout.width);
        expect(n.at[1] + 32).toBeLessThanOrEqual(layout.height);
      }
    }
  });
  it("retains legacy case01 bookmarks and distinguishes identical evidence IDs", () => {
    expect(caseHash("case01", "investigation/evidence/E01")).toBe(
      "#investigation/evidence/E01",
    );
    expect(caseHash("case02", "investigation/evidence/E01")).toBe(
      "#case02/investigation/evidence/E01",
    );
    expect(caseIdFromHash("#case06/result/E01")).toBe("case06");
    expect(caseIdFromHash("#case99/brief")).toBeNull();
    expect(caseHash("case05", "list")).toBe("#list");
  });
  it("saves repeated local IDs under separate case keys without changing previous attempts", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => values.set(k, v),
    };
    for (const { scenario } of cases) {
      const attempt = newAttempt(scenario, scenario.id + "-attempt");
      attempt.phase = "investigating";
      attempt.pinnedEvidenceIds = ["E01"];
      attempt.reportDraft.scopeId = scenario.reportOptions.scopeOptions[0].id;
      expect(
        persistSave(() => storage, scenario.id, {
          saveVersion: 1,
          activeAttempt: attempt,
          records: [],
        }),
      ).toBe(true);
    }
    expect(new Set(cases.map((e) => storageKey(e.scenario.id))).size).toBe(16);
    for (const { scenario, solution } of cases) {
      const loaded = loadSave(() => storage, scenario, solution);
      expect(loaded.warning).toBeNull();
      expect(loaded.save.activeAttempt?.attemptId).toBe(
        scenario.id + "-attempt",
      );
      expect(loaded.save.activeAttempt?.pinnedEvidenceIds).toEqual(["E01"]);
    }
  });
  it("rejects a missing evidence thought instead of displaying another case's text", () => {
    const entry = cases[4];
    const invalid = structuredClone(entry.narrative);
    delete invalid.evidenceThoughts.E01;
    expect(() => assertNarrative(invalid, entry.scenario)).toThrow();
  });
});
