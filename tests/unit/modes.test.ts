import { describe, expect, it } from "vitest";
import {
  modes,
  modeForCase,
  modeHash,
  listModeFromHash,
} from "../../src/scenario/modes";
import { cases } from "../../src/scenario/registry";
import { getLayout } from "../../src/ui/topologyLayouts";

describe("investigation mode registration", () => {
  it("classifies the existing six independently of their technical themes", () => {
    const basic = cases.filter((entry) => entry.mode === "basic");
    expect(basic).toHaveLength(6);
    expect(
      new Set(basic.map((entry) => entry.scenario.type)).size,
    ).toBeGreaterThan(1);
    expect(cases.filter((entry) => entry.mode === "security")).toHaveLength(5);
    expect(cases.filter((entry) => entry.mode === "network")).toHaveLength(5);
    expect(new Set(modes.flatMap((mode) => mode.caseIds)).size).toBe(
      cases.length,
    );
    expect(() => modeForCase("case99")).toThrow();
  });
  it("retains a mode in list URLs and accepts legacy list bookmarks", () => {
    for (const mode of modes)
      expect(listModeFromHash(modeHash(mode.id), "basic")).toBe(mode.id);
    expect(listModeFromHash("#list", "security")).toBe("security");
    expect(listModeFromHash("#list/invalid", "basic")).toBe("basic");
    expect(listModeFromHash("#case08/result", "security")).toBe("security");
  });
  it("keeps every new arrow attached to the specified source and destination", () => {
    for (const { scenario } of cases.filter(
      (entry) => entry.mode !== "basic",
    )) {
      const layout = getLayout(scenario);
      for (const link of scenario.topology.links) {
        const spec = layout.edges[link.id];
        if (scenario.id < "case12") expect(spec.arrows).toBe("end");
        else expect(["both", "end", "none"]).toContain(spec.arrows);
        const points = spec.points!;
        for (const [point, id] of [
          [points[0], link.from],
          [points.at(-1)!, link.to],
        ] as const) {
          const [x, y] = layout.nodes[id].at;
          expect(Math.abs(point[0] - x)).toBeLessThanOrEqual(76);
          expect(Math.abs(point[1] - y)).toBeLessThanOrEqual(32);
          expect(
            Math.abs(point[0] - x) === 76 || Math.abs(point[1] - y) === 32,
          ).toBe(true);
        }
      }
      expect(layout.legend?.length).toBeGreaterThan(0);
    }
  });
});
