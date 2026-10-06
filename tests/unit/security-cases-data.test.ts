import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assertScenario } from "../../src/scenario/validate";
import { assertNarrative } from "../../src/scenario/narrative";
import { gradeReport, validateSubmission } from "../../src/game/scoring";
import type { Narrative, Scenario } from "../../src/scenario/types";
import type { Report } from "../../src/game/types";

const specs = [
  { id: "case07", source: "sec01", count: 11, critical: ["R_DELETE"], sets: { C_GRANT: [["E03", "E05"]], C_POLICY: [["E04"], ["E06"]], C_SCOPE: [["E05", "E08"]] }, support: { C_GRANT: [], C_POLICY: ["E02"], C_SCOPE: ["E02"] } },
  { id: "case08", source: "sec02", count: 12, critical: ["R_DROP"], sets: { C_LINK: [["E06"]], C_ROUTE: [["E05"]], C_EFFECT: [["E03", "E04"], ["E04", "E06"]] }, support: { C_LINK: ["E03", "E07"], C_ROUTE: ["E02", "E07"], C_EFFECT: ["E01"] } },
  { id: "case09", source: "sec03", count: 10, critical: ["R_EXPORT", "P_ARCH"], sets: { C_SIGN: [["E03"]], C_READ: [["E08"]], C_GAP: [["E07"]] }, support: { C_SIGN: [], C_READ: ["E01", "E04"], C_GAP: ["E02", "E09"] } },
  { id: "case10", source: "sec04", count: 13, critical: ["R_WIPE", "P_OFF"], sets: { C_MISMATCH: [["E02", "E03"], ["E02", "E04"]], C_EXEC: [["E05", "E06"]], C_HOLD: [["E07"]] }, support: { C_MISMATCH: ["E10"], C_EXEC: ["E08"], C_HOLD: ["E01", "E06"] } },
  { id: "case11", source: "sec05", count: 12, critical: ["R_HIDE", "P_IP"], sets: { C_PATTERN: [["E03"], ["E07"]], C_RULE: [["E05"]], C_NOSESSION: [["E08"]] }, support: { C_PATTERN: ["E04", "E06"], C_RULE: ["E02", "E07"], C_NOSESSION: ["E03"] } },
];
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r/g, "");
const scenario = (id: string): Scenario => {
  const s: unknown = JSON.parse(read(`../../src/data/${id}.json`));
  assertScenario(s);
  return s;
};
const narrative = (s: Scenario): Narrative => {
  const n: unknown = JSON.parse(read(`../../src/data/narratives/${s.id}.json`));
  assertNarrative(n, s);
  return n;
};
const section = (text: string, heading: string) => {
  const start = text.indexOf(heading);
  if (start < 0) throw new Error(`Missing manuscript section: ${heading}`);
  return text.slice(text.indexOf("\n", start) + 1).split(/\n## /)[0];
};
const rows = (text: string, prefix: RegExp) => text.split("\n").filter(line => prefix.test(line)).map(line => line.slice(1, -1).split("|").map(cell => cell.trim()));
const authorInstructions = ["通知の原因や、この資料の重要度を表示する注釈は付けない。", "公開資料に原因や重要度を断定する注釈は付けない。", "十件を省略せず表示。"];
const canonical = (text: string) => text.replace(/^\|[-:| ]+\|$/gm, "").replace(/^```[^\n]*$/gm, "").replace(/\|/g, " ").replace(/\s+/g, " ").trim();
const evidenceText = (s: Scenario, id: string) => s.evidence.find(e => e.id === id)!.content.blocks.map(block =>
  block.type === "text" ? block.body : block.type === "log" ? block.lines.join("\n") : [...block.columns, ...block.rows.flat()].join(" ")).join("\n\n");
const reportFor = (s: Scenario): Report => ({
  scopeId: s.solution.scopeId, causeId: s.solution.causeId,
  claims: s.solution.claimRules.map(rule => ({ claimId: rule.claimId, evidenceIds: [...rule.requiredEvidenceSets[0]] })),
  repairId: s.solution.repairId, preventionId: s.solution.preventionId, verificationId: s.solution.verificationId,
});

describe.each(specs)("$id security manuscript fidelity", spec => {
  const s = scenario(spec.id);
  const n = narrative(s);
  const source = read(`../../docs/security-mode-planning/scenarios/${spec.source}.md`);

  it("validates schema and preserves every card's full content, metadata, acquisition time and thought", () => {
    expect(s).toMatchObject({ schemaVersion: 1, revision: 1, type: "security" });
    expect(s).not.toHaveProperty("mode");
    expect(s.evidence).toHaveLength(spec.count);
    const cards = [...section(source, "## プレイヤー向け：全証拠本文").matchAll(/^### (E\d\d) ([^\n]+)\n\n```yaml\n([\s\S]*?)\n```\n([\s\S]*?)(?=^### E\d\d |$(?![\s\S]))/gm)];
    expect(cards).toHaveLength(spec.count);
    for (const [, id, title, metadata, body] of cards) {
      const e = s.evidence.find(e => e.id === id)!;
      expect(e.title).toBe(title);
      for (const key of ["kind", "acquisition", "source", "observedAt"] as const)
        expect(e[key]).toBe(metadata.match(new RegExp(`^${key}: (.+)$`, "m"))![1]);
      expect(e.nodeIds).toEqual(metadata.match(/nodeIds: \[([^\]]+)\]/)![1].split(", "));
      let content = body.split("\n内心：")[0];
      for (const instruction of authorInstructions) {
        if (content.includes(instruction)) expect(s.solution.evidenceRoles[id]).toContain(instruction);
        content = content.replace(instruction, "");
      }
      expect(canonical(evidenceText(s, id))).toBe(canonical(content));
      expect(n.evidenceThoughts[id]).toBe(body.match(/内心：(（[^\n]+）)/)![1]);
      const acquired = content.match(/取得：([^。\n]+)/)![1];
      expect(new Date(acquired).getTime()).toBeGreaterThanOrEqual(new Date(e.observedAt).getTime());
    }
  });

  it("preserves all public normal requirements, topology IDs, directions, boundaries and legend meanings", () => {
    const normal = section(source, "## プレイヤー向け：正常要件");
    for (const paragraph of normal.trim().split("\n\n")) expect([...s.context.baseline, ...s.context.assumptions]).toContain(paragraph);
    expect(s.context.assumptions.join("\n")).toContain("全件資料は収録終端、複数イベントは最後のイベント以後");
    const topology = section(source, "## プレイヤー向け：構成図と文字説明");
    for (const [id, label, details, boundary] of rows(topology, /^\|N_/)) {
      const node = s.topology.nodes.find(node => node.id === id)!;
      expect(node.label).toBe(label);
      expect(node.addresses).toEqual([...details.split(" / "), `境界：${boundary}`]);
    }
    for (const [id, direction, purpose, legend] of rows(topology, /^\|L\d\d/)) {
      const [from, to] = direction.split("→");
      expect(s.topology.links.find(link => link.id === id)).toEqual({ id, from, to, label: `${purpose}（${legend}）` });
    }
  });

  it("preserves every candidate body and individual feedback without publishing author notes", () => {
    const options = Object.values(s.reportOptions).flat();
    expect(options).toHaveLength(23);
    expect(s.hypotheses).toEqual(s.reportOptions.causeOptions);
    const candidates = section(source, "## 作者向け：全報告候補と個別feedback");
    const authoredRows = rows(candidates, /^\|[SHCFRPV]_/);
    expect(authoredRows).toHaveLength(23);
    for (const [id, body, scoreOrCount, criticalOrFeedback, feedback] of authoredRows) {
      const option = options.find(option => option.id === id)!;
      expect(option.description).toBe(body);
      expect(option.label.length).toBeLessThanOrEqual(24);
      expect(s.solution.optionFeedback[id].text).toBe(feedback ?? criticalOrFeedback);
      if (id.startsWith("H_")) expect(s.solution.hypothesisFeedback[id]).toEqual(s.solution.optionFeedback[id]);
      if (/^[CF]_/.test(id)) expect(s.reportOptions.claimOptions.find(option => option.id === id)?.requiredEvidenceCount).toBe(Number(scoreOrCount));
      else expect(s.solution.criticalOptionIds.includes(id)).toBe(criticalOrFeedback === "true");
      const field = ({ S: "scopeId", H: "causeId", R: "repairId", P: "preventionId", V: "verificationId" } as const)[id[0] as "S" | "H" | "R" | "P" | "V"];
      if (field) expect(s.solution[field] === id).toBe(Number(scoreOrCount) > 0);
    }
    const { solution: _solution, ...publicScenario } = s;
    const publicText = JSON.stringify(publicScenario);
    for (const secretKey of ["criticalOptionIds", "requiredEvidenceSets", "allowedSupportingEvidenceIds", "evidenceRoles", "optionFeedback", "hypothesisFeedback", "causalChain"])
      expect(publicText).not.toContain(secretKey);
    for (const authorOnly of [...authorInstructions, "C_READ", "C_HOLD", "作者向け", "満点集合", "部分点", "critical=true"])
      expect([...s.context.baseline, ...s.context.assumptions, ...s.evidence.map(e => evidenceText(s, e.id))].join("\n")).not.toContain(authorOnly);
    expect(s.solution.causalChain.map(explanation => explanation.text)).toEqual(
      [...section(source, "## 採点後に表示する6段階解説").matchAll(/^### \d+ ([^\n]+)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)].map(match => `${match[1]}：${match[2].trim()}`),
    );
    for (const [id, role] of rows(section(source, "## 作者向け：全証拠の役割"), /^\|E\d\d/)) expect(s.solution.evidenceRoles[id]).toContain(role);
  });

  it("preserves all 11 screen thoughts plus card thoughts, full dialogue, request, hints and dictionary", () => {
    const copiedThoughts = [n.roomThought, n.requestThought, n.startThought, ...Object.values(n.tabs), ...Object.values(n.evidenceThoughts), n.reportThought, ...Object.values(n.resultThoughts), n.retryThought];
    const authoredThoughts = [...source.matchAll(/：\s*(（[^\n]+）)/g)].map(match => match[1]);
    expect(copiedThoughts).toHaveLength(spec.count + 11);
    expect([...copiedThoughts].sort()).toEqual([...authoredThoughts].sort());
    expect(n.introDialogue).toHaveLength(10);
    expect(n.resultDialogue!.solved).toHaveLength(5);
    expect(n.resultDialogue!.reconsider).toHaveLength(5);
    for (const line of [...n.introDialogue!, ...n.resultDialogue!.solved, ...n.resultDialogue!.reconsider]) expect(source).toContain(`${line.speaker}「${line.text}」`);
    for (const person of n.characters!) expect(source).toContain(`- ${person.name}：${person.description}`);
    expect(n.characters).toHaveLength(3);
    const brief = source.match(/### 依頼\n\n([\s\S]*?)\n\n### 人物/)![1];
    expect(s.brief).toBe(brief);
    expect(n.brief).toBe(brief);
    const support = section(source, "## プレイヤー向け：画面内心");
    expect(s.hints.map(hint => hint.text)).toEqual([...support.matchAll(/^\d\. ([^\n]+)$/gm)].map(match => match[1]));
    expect(s.glossary).toEqual(rows(support.split("### 一般用語辞典\n")[1], /^\|[^-]/).filter(row => row[0] !== "用語").map(([term, definition]) => ({ term, definition })));
  });

  it("locks approved evidence sets, support and critical IDs independently of conversion", () => {
    expect(s.solution.criticalOptionIds).toEqual(spec.critical);
    for (const rule of s.solution.claimRules) {
      expect(rule.requiredEvidenceSets).toEqual(spec.sets[rule.claimId as keyof typeof spec.sets]);
      expect(rule.allowedSupportingEvidenceIds).toEqual(spec.support[rule.claimId as keyof typeof spec.support]);
      expect(rule.contradictoryEvidenceIds).toEqual([]);
      const count = s.reportOptions.claimOptions.find(option => option.id === rule.claimId)!.requiredEvidenceCount;
      for (const set of rule.requiredEvidenceSets) expect(set).toHaveLength(count);
    }
  });

  it("uses the actual grader for every complete alternative, partial set, support, extra card and wrong claim", () => {
    expect(() => validateSubmission(reportFor(s), s)).not.toThrow();
    expect(gradeReport(reportFor(s), s.solution, s)).toMatchObject({ total: 100, solved: true, scores: { scope: 10, cause: 30, claims: 30, repair: 10, prevention: 10, verification: 10 } });
    for (const rule of s.solution.claimRules) {
      const replace = (ids: string[]): Report => ({ ...reportFor(s), claims: [{ claimId: rule.claimId, evidenceIds: ids }] });
      const known = [...new Set([...rule.requiredEvidenceSets.flat(), ...rule.allowedSupportingEvidenceIds])];
      const unrelated = s.evidence.find(e => !known.includes(e.id))!.id;
      for (const set of rule.requiredEvidenceSets) {
        const full = reportFor(s);
        full.claims.find(claim => claim.claimId === rule.claimId)!.evidenceIds = [...set].reverse();
        expect(gradeReport(full, s.solution, s)).toMatchObject({ total: 100, solved: true });
        if (set.length === 1) expect(gradeReport(replace([...set, unrelated]), s.solution, s).scores.claims).toBe(10);
      }
      for (const id of known) expect(gradeReport(replace([id]), s.solution, s).scores.claims)
        .toBe(rule.requiredEvidenceSets.some(set => set.length === 1 && set[0] === id) ? 10 : 5);
      expect(gradeReport(replace([unrelated]), s.solution, s).scores.claims).toBe(0);
    }
    for (const wrong of s.reportOptions.claimOptions.filter(option => option.id.startsWith("F_"))) {
      for (const card of s.evidence) expect(gradeReport({ ...reportFor(s), claims: [{ claimId: wrong.id, evidenceIds: [card.id] }] }, s.solution, s).scores.claims).toBe(0);
    }
    expect(() => validateSubmission({ ...reportFor(s), claims: reportFor(s).claims.slice(0, 2) }, s)).toThrow();
    expect(() => validateSubmission({ ...reportFor(s), claims: reportFor(s).claims.map(claim => ({ ...claim, evidenceIds: [] })) }, s)).toThrow();
    expect(gradeReport({ scopeId: null, causeId: s.solution.causeId, claims: [], repairId: null, preventionId: null, verificationId: null }, s.solution, s)).toMatchObject({ total: 30, solved: false });
  });

  it("rejects every dangerous operation without a new hidden penalty or altered solve threshold", () => {
    for (const id of spec.critical) {
      const report = reportFor(s);
      if (s.reportOptions.repairOptions.some(option => option.id === id)) report.repairId = id;
      else report.preventionId = id;
      expect(gradeReport(report, s.solution, s)).toMatchObject({ total: 90, solved: false, criticalOptionIds: [id] });
    }
    const enough = reportFor(s);
    enough.claims[2].evidenceIds = [];
    expect(gradeReport(enough, s.solution, s)).toMatchObject({ total: 90, solved: true });
    const insufficient = { ...enough, claims: enough.claims.slice(0, 1) };
    expect(gradeReport(insufficient, s.solution, s)).toMatchObject({ total: 80, solved: false });
  });
});

it("contains the complete five security episodes: 58 cards, 113 thoughts, 100 dialogue lines and 115 feedback entries", () => {
  const cases = specs.map(spec => scenario(spec.id));
  expect(cases.reduce((total, s) => total + s.evidence.length, 0)).toBe(58);
  expect(cases.reduce((total, s) => total + Object.keys(narrative(s).evidenceThoughts).length + 11, 0)).toBe(113);
  expect(cases.reduce((total, s) => {
    const n = narrative(s);
    return total + n.introDialogue!.length + n.resultDialogue!.solved.length + n.resultDialogue!.reconsider.length;
  }, 0)).toBe(100);
  expect(cases.reduce((total, s) => total + Object.keys(s.solution.optionFeedback).length, 0)).toBe(115);
});

it("retains the reviewed audit end times and separates historical events from observation timestamps", () => {
  expect(scenario("case07").evidence.find(e => e.id === "E03")!.observedAt).toBe("2026-10-05T10:30:00+09:00");
  expect(evidenceText(scenario("case07"), "E03")).toContain("10:13 event=consent");
  expect(scenario("case09").evidence.find(e => e.id === "E06")!.observedAt).toBe("2026-10-05T12:22:00+09:00");
  expect(evidenceText(scenario("case09"), "E08")).toContain("索引生成イベント時刻=12:23");
  expect(scenario("case10").evidence.find(e => e.id === "E07")!.observedAt).toBe("2026-10-05T18:45:00+09:00");
  expect(evidenceText(scenario("case10"), "E10")).toContain("18:02");
  expect(scenario("case10").evidence.find(e => e.id === "E10")!.observedAt).toBe("2026-10-05T18:36:00+09:00");
  expect(scenario("case11").evidence.find(e => e.id === "E07")!.observedAt).toBe("2026-10-05T14:10:00+09:00");
  expect(scenario("case11").evidence.find(e => e.id === "E12")!.observedAt).toBe("2026-10-05T14:10:00+09:00");
  expect(evidenceText(scenario("case11"), "E12")).toContain("2026-10-04");
  expect(evidenceText(scenario("case11"), "E09")).toContain("39行");
  expect(evidenceText(scenario("case11"), "E09")).toContain("MFA");
});

it("keeps the reviewed full-audit claims distinct from their supporting pairs", () => {
  for (const [id, claimId, evidenceIds] of [["case09", "C_READ", ["E01", "E04"]], ["case10", "C_HOLD", ["E01", "E06"]]] as const) {
    const s = scenario(id);
    expect(gradeReport({ ...reportFor(s), claims: [{ claimId, evidenceIds: [...evidenceIds] }] }, s.solution, s).scores.claims).toBe(5);
  }
});
