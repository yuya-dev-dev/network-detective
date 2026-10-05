import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assertScenario } from "../../src/scenario/validate";
import { gradeReport, validateSubmission } from "../../src/game/scoring";
import type { Scenario } from "../../src/scenario/types";
import type { Report } from "../../src/game/types";

const specs = [
  { id: "case02", manuscript: "p01", count: 9, critical: ["A_B2", "P_B2"], sets: { C1: [["E02"]], C2: [["E04"], ["E05"]], C3: [["E05"]] }, support: { C1: ["E07"], C2: ["E03"], C3: ["E04"] }, counts: [1, 1, 2] },
  { id: "case03", manuscript: "p07", count: 10, critical: ["A_B3"], sets: { C1: [["E02"]], C2: [["E04", "E05"], ["E02", "E04"], ["E05", "E06"], ["E02", "E06"]], C3: [["E02", "E03"]] }, support: { C1: ["E07"], C2: [], C3: [] }, counts: [1, 2, 1] },
  { id: "case04", manuscript: "p03", count: 11, critical: ["A_B3"], sets: { C1: [["E02"]], C2: [["E03", "E04"], ["E04", "E05"], ["E04", "E06"], ["E04", "E08"]], C3: [["E06"]] }, support: { C1: ["E01"], C2: [], C3: ["E05", "E07"] }, counts: [1, 1, 2] },
  { id: "case05", manuscript: "p08", count: 11, critical: ["A_B3"], sets: { C1: [["E02", "E03"], ["E03", "E04"], ["E03", "E08"], ["E03", "E09"]], C2: [["E04", "E05"], ["E05", "E09"]], C3: [["E06"]] }, support: { C1: [], C2: [], C3: ["E08"] }, counts: [1, 1, 2] },
  { id: "case06", manuscript: "p09", count: 12, critical: ["A_B2", "A_B3"], sets: { C1: [["E02"]], C2: [["E03", "E09"], ["E03", "E06"], ["E03", "E05"]], C3: [["E05", "E06"]] }, support: { C1: ["E01"], C2: [], C3: ["E07"] }, counts: [1, 2, 1] },
] as const;
const available = specs.filter(spec => existsSync(new URL(`../../src/data/${spec.id}.json`, import.meta.url)));
const canonical = (text: string) => text.replace(/\r/g, "").replace(/```(?:text)?\n?/g, "").replace(/\s+/g, " ").trim();
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r/g, "");
const get = (id: string): Scenario => {
  const data: unknown = JSON.parse(read(`../../src/data/${id}.json`));
  assertScenario(data);
  return data;
};
const reportFor = (s: Scenario): Report => ({
  scopeId: s.solution.scopeId, causeId: s.solution.causeId,
  claims: s.solution.claimRules.map(rule => ({ claimId: rule.claimId, evidenceIds: [...rule.requiredEvidenceSets[0]] })),
  repairId: s.solution.repairId, preventionId: s.solution.preventionId,
  verificationId: s.solution.verificationId,
});
const evidenceText = (s: Scenario, id: string) => s.evidence.find(e => e.id === id)!.content.blocks.map(block =>
  block.type === "text" ? block.body : block.type === "log" ? block.lines.join("\n") : block.rows.flat().join(" ")).join("\n\n");

describe.each(available)("$id manuscript conversion and grading", spec => {
  const s = get(spec.id);
  const narrative = JSON.parse(read(`../../src/data/narratives/${spec.id}.json`));
  const source = read(`../../docs/scenario-planning/scenarios/${spec.manuscript}.md`);

  it("preserves all cards, the request, full evidence text, observation labels and all candidate bodies", () => {
    expect(s.evidence).toHaveLength(spec.count);
    expect(s.evidence.map(e => e.id)).toEqual(Array.from({ length: spec.count }, (_, i) => `E${String(i + 1).padStart(2, "0")}`));
    const brief = source.match(/### 依頼\n\n([\s\S]*?)\n\n### 人物/)![1];
    expect(s.brief).toBe(brief);
    expect(narrative.brief).toBe(brief);
    const cards = [...source.matchAll(/^### (E\d\d) (.+?)〔(.+?)〕\n\n([\s\S]*?)(?=\n### E\d\d |\n## プレイヤー向け：)/gm)];
    for (const card of cards) {
      const e = s.evidence.find(e => e.id === card[1])!;
      expect(canonical(evidenceText(s, e.id))).toBe(canonical(card[4].split(/\n\n内心：/)[0]));
      expect(e.title).toBe(card[2]);
      expect(e.observedAtLabel).toBe(card[3]);
      expect(e.acquisition).toBe(card[3].startsWith("診断") ? "diagnostic" : "document");
    }
    const options = Object.values(s.reportOptions).flat();
    const rows = source.split("\n").filter(line => /^\|(範囲|原因・仮説|修復|恒久修復|防止|確認)\|/.test(line));
    for (const row of rows) {
      const [, , id, body] = row.split("|");
      expect(options.find(o => o.id === id)?.description).toBe(body);
    }
    for (const row of source.split("\n").filter(line => /^\|[CK][123]\|/.test(line))) {
      const [, id, body, needed] = row.split("|");
      const claim = s.reportOptions.claimOptions.find(o => o.id === id)!;
      expect(claim.description).toBe(body);
      expect(claim.requiredEvidenceCount).toBe(Number(needed));
    }
  });

  it("preserves every unique thought, eight opening lines, closing dialogue and the complete six-stage explanation", () => {
    const originalThoughts = [...source.matchAll(/(?:導入内心|内心)：(（[^\n]+）)|^- (?:構成|証拠|仮説|報告|提出前)：(（[^\n]+）)/gm)].map(m => m[1] ?? m[2]);
    const copiedThoughts = [narrative.requestThought, ...Object.values(narrative.tabs), ...Object.values(narrative.evidenceThoughts), narrative.reportThought, ...Object.values(narrative.resultThoughts)];
    expect(new Set(copiedThoughts)).toEqual(new Set(originalThoughts));
    expect(copiedThoughts).toHaveLength(spec.count + 8);
    expect(narrative.introDialogue).toHaveLength(8);
    expect(narrative.characters).toHaveLength(3);
    for (const line of [...narrative.introDialogue, ...narrative.resultDialogue.solved, ...narrative.resultDialogue.reconsider])
      expect(source).toContain(`${line.speaker}「${line.text}」`);
    expect(narrative.resultDialogue.solved).toHaveLength(3);
    expect(narrative.resultDialogue.reconsider).toHaveLength(3);
    expect(s.solution.causalChain).toHaveLength(6);
    const originalExplanation = source.split("## 採点後に表示する解説\n\n")[1].split("\n### 誤答ごとの")[0] + "\n\n" + source.match(/^未確定：[^\n]+/m)![0];
    const copiedExplanation = s.solution.causalChain.map(item => item.text.replace(/^(症状|確認できた事実|残る原因|設定との不一致|対策|確認)：/, "")).join("\n\n");
    expect(canonical(copiedExplanation).replace(/ /g, "")).toBe(canonical(originalExplanation).replace(/ /g, ""));
    for (const [id, feedback] of Object.entries(s.solution.optionFeedback))
      if (id.includes("_B") || id.startsWith("K")) expect(source).toContain(feedback.text);
    expect(s.hints).toHaveLength(3);
    for (const hint of s.hints) expect(source).toContain(hint.text);
    for (const word of s.glossary) expect(source).toContain(word.term + "＝" + word.definition);
  });

  it("locks the agreed sets, support, wrong-card counts and critical IDs independently of generated data", () => {
    expect(s.solution.criticalOptionIds).toEqual([...spec.critical]);
    for (const rule of s.solution.claimRules) {
      expect(rule.requiredEvidenceSets).toEqual(spec.sets[rule.claimId as keyof typeof spec.sets]);
      expect(rule.allowedSupportingEvidenceIds).toEqual(spec.support[rule.claimId as keyof typeof spec.support]);
      expect(rule.contradictoryEvidenceIds).toEqual([]);
    }
    spec.counts.forEach((count, index) => expect(s.reportOptions.claimOptions.find(o => o.id === `K${index + 1}`)?.requiredEvidenceCount).toBe(count));
  });

  it("grades every complete alternate set at 100 and permits singleton proof with irrelevant evidence", () => {
    const correct = reportFor(s);
    expect(() => validateSubmission(correct, s)).not.toThrow();
    expect(gradeReport(correct, s.solution, s)).toMatchObject({ total: 100, solved: true, scores: { scope: 10, cause: 30, claims: 30, repair: 10, prevention: 10, verification: 10 } });
    for (const rule of s.solution.claimRules) {
      for (const set of rule.requiredEvidenceSets) {
        const report = reportFor(s);
        report.claims.find(c => c.claimId === rule.claimId)!.evidenceIds = [...set].reverse();
        expect(gradeReport(report, s.solution, s)).toMatchObject({ total: 100, solved: true });
        if (set.length === 1) {
          const noise = s.evidence.find(e => ![...rule.requiredEvidenceSets.flat(), ...rule.allowedSupportingEvidenceIds].includes(e.id))!.id;
          report.claims.find(c => c.claimId === rule.claimId)!.evidenceIds.push(noise);
          expect(gradeReport(report, s.solution, s)).toMatchObject({ total: 100, solved: true });
        }
      }
    }
  });

  it("retains partial/zero points, cause-only incompleteness and critical rejection with no hidden penalty", () => {
    for (const rule of s.solution.claimRules) {
      const known = [...new Set([...rule.requiredEvidenceSets.flat(), ...rule.allowedSupportingEvidenceIds])];
      for (const evidenceId of known) {
        const expected = rule.requiredEvidenceSets.some(set => set.length === 1 && set[0] === evidenceId) ? 10 : 5;
        const report = { ...reportFor(s), claims: [{ claimId: rule.claimId, evidenceIds: [evidenceId] }] };
        expect(gradeReport(report, s.solution, s).scores.claims).toBe(expected);
      }
      const noise = s.evidence.find(e => !known.includes(e.id))!.id;
      expect(gradeReport({ ...reportFor(s), claims: [{ claimId: rule.claimId, evidenceIds: [noise] }] }, s.solution, s).scores.claims).toBe(0);
    }
    for (const claimId of ["K1", "K2", "K3"])
      expect(gradeReport({ ...reportFor(s), claims: [{ claimId, evidenceIds: [s.evidence[0].id] }] }, s.solution, s).scores.claims).toBe(0);
    expect(gradeReport({ scopeId: null, causeId: s.solution.causeId, claims: [], repairId: null, preventionId: null, verificationId: null }, s.solution, s)).toMatchObject({ total: 30, solved: false });
    for (const id of s.solution.criticalOptionIds) {
      const report = reportFor(s);
      if (s.reportOptions.repairOptions.some(o => o.id === id)) report.repairId = id;
      else report.preventionId = id;
      expect(gradeReport(report, s.solution, s)).toMatchObject({ total: 90, solved: false, criticalOptionIds: [id] });
    }
  });
});

it("contains 53 evidence cards and 93 authored thoughts when all five additions are present", () => {
  expect(available).toHaveLength(5);
  expect(available.reduce((total, spec) => total + get(spec.id).evidence.length, 0)).toBe(53);
  const thoughts = available.flatMap(spec => {
    const n = JSON.parse(read(`../../src/data/narratives/${spec.id}.json`));
    return [n.requestThought, ...Object.values(n.tabs), ...Object.values(n.evidenceThoughts), n.reportThought, ...Object.values(n.resultThoughts)];
  });
  expect(thoughts).toHaveLength(93);
});
