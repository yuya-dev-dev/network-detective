import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assertScenario } from "../../src/scenario/validate";
import { assertNarrative } from "../../src/scenario/narrative";
import { modes, modeForCase } from "../../src/scenario/modes";
import { gradeReport, validateSubmission } from "../../src/game/scoring";
import type { Scenario, Narrative } from "../../src/scenario/types";
import type { Report } from "../../src/game/types";

// Reviewed facts are fixed independently of the manuscript conversion.
const specs = [
  {
    id: "case12",
    source: "net01",
    difficulty: 2,
    minutes: 25,
    critical: ["R4"],
    sets: [[["E02"]], [["E03", "E05"]], [["E04", "E06"]]],
    support: [["E01", "E06"], [], ["E09"]],
  },
  {
    id: "case13",
    source: "net02",
    difficulty: 2,
    minutes: 25,
    critical: ["R4"],
    sets: [[["E02", "E05"]], [["E03", "E06"]], [["E04"]]],
    support: [[], [], ["E01", "E09"]],
  },
  {
    id: "case14",
    source: "net03",
    difficulty: 3,
    minutes: 30,
    critical: ["R2", "R4"],
    sets: [[["E02"]], [["E02", "E03"]], [["E04", "E06"]]],
    support: [[], ["E05"], ["E09"]],
  },
  {
    id: "case15",
    source: "net04",
    difficulty: 4,
    minutes: 40,
    critical: ["R4"],
    sets: [
      [
        ["E02", "E04"],
        ["E04", "E05"],
        ["E04", "E06"],
        ["E04", "E07"],
      ],
      [["E05"]],
      [["E06"]],
    ],
    support: [[], [], ["E01", "E07"]],
  },
  {
    id: "case16",
    source: "net05",
    difficulty: 3,
    minutes: 35,
    critical: ["R2"],
    sets: [[["E03"]], [["E03"], ["E06"]], [["E02", "E08"]]],
    support: [["E04"], ["E04", "E05"], ["E06"]],
  },
];
const kindMap: Record<string, string> = {
  document: "report",
  configuration: "config",
  "routing-table": "config",
  "change-record": "log",
  "packet-capture": "log",
  "http-trace": "log",
  "access-log": "log",
  "firewall-log": "log",
  counter: "log",
  "dns-result": "test",
  connectivity: "test",
  "service-check": "test",
  measurement: "test",
};
const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r/g, "");
const load = (id: string): Scenario => {
  const s: unknown = JSON.parse(read(`../../src/data/${id}.json`));
  assertScenario(s);
  return s;
};
const story = (s: Scenario): Narrative => {
  const n: unknown = JSON.parse(read(`../../src/data/narratives/${s.id}.json`));
  assertNarrative(n, s);
  return n;
};
const section = (text: string, heading: string) => {
  const start = text.indexOf(heading);
  if (start < 0) throw Error(heading);
  return text
    .slice(text.indexOf("\n", start) + 1)
    .split(/\n## /)[0]
    .trim();
};
const rows = (text: string) =>
  text
    .split("\n")
    .filter((line) => /^\|[^-|]/.test(line))
    .map((line) =>
      line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim()),
    );
const refs = (text: string) => [...new Set(text.match(/E\d\d/g) ?? [])];
const canonical = (text: string) =>
  text
    .replace(/^\|[-:| ]+\|$/gm, "")
    .replace(/^```[^\n]*$/gm, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const evidenceText = (s: Scenario, id: string) =>
  s.evidence
    .find((e) => e.id === id)!
    .content.blocks.map((block) =>
      block.type === "text"
        ? block.body
        : block.type === "log"
          ? block.lines.join("\n")
          : [...block.columns, ...block.rows.flat()].join(" "),
    )
    .join("\n\n");
const reportFor = (s: Scenario): Report => ({
  scopeId: "S1",
  causeId: "H1",
  claims: s.solution.claimRules.map((rule) => ({
    claimId: rule.claimId,
    evidenceIds: [...rule.requiredEvidenceSets[0]],
  })),
  repairId: "R1",
  preventionId: "P1",
  verificationId: "V1",
});

describe.each(specs)("$id network manuscript fidelity", (spec) => {
  const s = load(spec.id),
    n = story(s),
    source = read(
      `../../docs/network-mode-planning/scenarios/${spec.source}.md`,
    );

  it("preserves all ten complete evidence cards and their collection metadata", () => {
    expect(s).toMatchObject({
      schemaVersion: 1,
      revision: 1,
      type: "network",
      difficulty: spec.difficulty,
      estimatedMinutes: spec.minutes,
    });
    expect(s.title).toBe(source.match(/^# NET\d\d (.+)/)![1]);
    const cards = [
      ...section(source, "## プレイヤー向け：全証拠本文").matchAll(
        /^### (E\d\d) ([^\n]+)\n(kind=[^\n]+)\n\n([\s\S]*?)(?=^### E|$(?![\s\S]))/gm,
      ),
    ];
    expect(cards).toHaveLength(10);
    expect(s.evidence).toHaveLength(10);
    for (const [, id, title, meta, body] of cards) {
      const metadata = Object.fromEntries(
        meta
          .replace(/。$/, "")
          .split("; ")
          .map((field) => [
            field.slice(0, field.indexOf("=")),
            field.slice(field.indexOf("=") + 1),
          ]),
      );
      const e = s.evidence.find((e) => e.id === id)!;
      expect(e).toMatchObject({
        title,
        kind: kindMap[metadata.kind],
        acquisition: metadata.acquisition,
        source: metadata.source,
        nodeIds: metadata.nodeIds.split(","),
        observedAt: metadata.observedAt,
      });
      expect(canonical(evidenceText(s, id))).toBe(
        canonical(body.split("\n内心：")[0]),
      );
      expect(n.evidenceThoughts[id]).toBe(body.match(/内心：(（[^\n]+）)/)![1]);
      expect(new Date(s.context.snapshotTime).getTime()).toBeGreaterThanOrEqual(
        new Date(e.observedAt).getTime(),
      );
      expect(evidenceText(s, id)).not.toContain("kind=");
      expect(evidenceText(s, id)).not.toContain("内心：");
    }
  });

  it("preserves public normal requirements, full topology details and fixed collection conditions", () => {
    const normal = section(source, "## プレイヤー向け：正常要件・公開前提");
    for (const p of normal.split("\n\n"))
      expect([...s.context.baseline, ...s.context.assumptions]).toContain(p);
    const topology = section(source, "## プレイヤー向け：構成図と文字説明");
    const nodeRows = rows(topology).filter((row) => row[0] !== "nodeId");
    expect(s.topology.nodes).toHaveLength(nodeRows.length);
    for (const [id, label, detail] of nodeRows) {
      const node = s.topology.nodes.find((node) => node.id === id)!;
      expect(node.label).toBe(
        spec.source === "net01" ? label.split(" / ")[0] : label,
      );
      expect(node.addresses).toEqual(
        spec.source === "net01"
          ? [...label.split(" / ").slice(1), detail]
          : [detail],
      );
    }
    for (const p of topology.split("\n\n").filter((p) => !p.startsWith("|")))
      expect(s.context.assumptions).toContain(p);
    const conditions = section(source, "## プレイヤー向け：全証拠本文").split(
      "\n\n### E01",
    )[0];
    expect(s.context.assumptions).toContain(conditions);
    expect(s.context.snapshotTime).toBe("2026-10-07T10:30:00+09:00");
    expect(modeForCase(s.id)).toBe("network");
  });

  it("preserves all 27 candidate bodies, counts, individual feedback and critical decisions", () => {
    const options = Object.values(s.reportOptions).flat();
    const candidates = rows(
      section(source, "## 作者向け：報告候補の表示本文と個別feedback"),
    ).filter((row) => /^[SHCWPRV]\d$/.test(row[0]));
    expect(options).toHaveLength(27);
    expect(candidates).toHaveLength(27);
    expect(s.hypotheses).toEqual(s.reportOptions.causeOptions);
    for (const [id, body, countOrScore, critical, ...remaining] of candidates) {
      const o = options.find((option) => option.id === id)!;
      expect(o.description).toBe(body);
      expect(o.label.length).toBeLessThanOrEqual(24);
      // These are implementation notes embedded in the authored feedback column,
      // rather than player feedback; IDs are already preserved structurally.
      const feedback = remaining
        .at(-1)!
        .replace(
          /仮説(?:パネルのIDもH1–5|と原因のID共通|\/原因ID共通|\/原因共通ID)$/,
          "",
        );
      expect(s.solution.optionFeedback[id]).toEqual({
        text: feedback,
        evidenceIds: refs(feedback),
      });
      if (id.startsWith("H"))
        expect(s.solution.hypothesisFeedback[id]).toEqual(
          s.solution.optionFeedback[id],
        );
      if (/^[CW]/.test(id))
        expect(
          s.reportOptions.claimOptions.find((option) => option.id === id)!
            .requiredEvidenceCount,
        ).toBe(Number(countOrScore));
      else {
        expect(s.solution.criticalOptionIds.includes(id)).toBe(
          critical === "true",
        );
        expect(Number(countOrScore) > 0).toBe(id.endsWith("1"));
      }
    }
    const publicFacts = [
      ...s.context.baseline,
      ...s.context.assumptions,
      ...s.evidence.map((e) => evidenceText(s, e.id)),
      ...options.map((o) => o.description),
    ].join("\n");
    for (const secret of [
      "作者向け",
      "requiredAnySets",
      "allowedSupportingEvidenceIds",
      "critical=true",
      "満点集合",
      "正主張",
      "表示仕様・執筆仕様",
    ])
      expect(publicFacts).not.toContain(secret);
    for (const feedback of Object.values(s.solution.optionFeedback))
      expect(feedback.text).not.toMatch(
        /仮説パネル|原因ID共通|原因共通ID|原因のID共通/,
      );
    const counts = (correct: boolean) =>
      s.reportOptions.claimOptions
        .filter((o) => o.id.startsWith(correct ? "C" : "W"))
        .map((o) => o.requiredEvidenceCount)
        .sort();
    expect(counts(true)).toEqual(counts(false));
    expect(
      s.reportOptions.claimOptions
        .slice(0, 3)
        .some((o) => o.id.startsWith("W")),
    ).toBe(true);
  });

  it("preserves every character, dialogue, thought, hint, glossary and post-report explanation", () => {
    const brief = source.match(/### 依頼\n\n([\s\S]*?)\n\n### 人物/)![1];
    expect(s.brief).toBe(brief);
    expect(n.brief).toBe(brief);
    const intro = section(source, "## プレイヤー向け：依頼と導入");
    const characterSection = intro
      .split(/### 人物[^\n]*\n\n/)[1]
      .split("\n\n### 導入会話")[0];
    expect(n.characters).toEqual(
      [...characterSection.matchAll(/^- ([^：\n]+)：([^\n]+)$/gm)].map(
        ([, name, description]) => ({ name, description }),
      ),
    );
    const dialogue = (text: string) =>
      [...text.matchAll(/^([^\n「]+)「([^\n]+)」$/gm)].map(
        ([, speaker, text]) => ({ speaker, text }),
      );
    expect(n.introDialogue).toEqual(dialogue(intro));
    expect(n.introDialogue).toHaveLength(10);
    const result = section(source, "## プレイヤー向け：結果と再挑戦");
    expect(n.resultDialogue!.solved).toEqual(
      dialogue(result.split("### 再検討判定後")[0]),
    );
    expect(n.resultDialogue!.reconsider).toEqual(
      dialogue(result.split("### 再検討判定後")[1]),
    );
    expect(n.resultDialogue!.solved).toHaveLength(5);
    expect(n.resultDialogue!.reconsider).toHaveLength(5);
    const copied = [
      n.roomThought,
      n.requestThought,
      n.startThought,
      ...Object.values(n.tabs),
      ...Object.values(n.evidenceThoughts),
      n.reportThought,
      ...Object.values(n.resultThoughts),
      n.retryThought,
    ];
    const authored = [...source.matchAll(/：\s*(（[^\n]+）)/g)].map(
      (match) => match[1],
    );
    expect(copied).toHaveLength(21);
    expect(copied.sort()).toEqual(authored.sort());
    expect(n.roomThought).toBe(source.match(/- 開始前：(（[^\n]+）)/)![1]);
    expect(n.requestThought).toBe(source.match(/- 診断：(（[^\n]+）)/)![1]);
    const support = section(source, "## プレイヤー向け：任意支援");
    expect(s.hints.map((h) => h.text)).toEqual(
      [...support.matchAll(/^\d\. ([^\n]+)$/gm)].map((match) => match[1]),
    );
    expect(s.glossary).toEqual(
      rows(support.split("### 一般用語辞典")[1])
        .filter((row) => row[0] !== "用語")
        .map(([term, definition]) => ({ term, definition })),
    );
    const causal = source.slice(source.search(/^## 提出後.*6段階/gm));
    const authoredCausal = causal.includes("### 1 ")
      ? [
          ...causal.matchAll(
            /^### \d+ ([^\n]+)\n\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm,
          ),
        ].map(([, heading, body]) => `${heading}：${body.trim()}`)
      : [...causal.matchAll(/^\d\. \*\*([^*]+)\*\*：([^\n]+)$/gm)].map(
          ([, heading, body]) => `${heading}：${body}`,
        );
    expect(s.solution.causalChain.map((e) => e.text)).toEqual(authoredCausal);
    expect(s.solution.causalChain).toHaveLength(6);
    expect(s.solution.evidenceRoles).toEqual(
      Object.fromEntries(
        rows(section(source, "## 作者向け：全証拠の役割と限界")).filter((row) =>
          /^E\d\d$/.test(row[0]),
        ),
      ),
    );
  });

  it("locks approved alternative sets, support and critical IDs independently", () => {
    expect(s.solution).toMatchObject({
      scopeId: "S1",
      causeId: "H1",
      repairId: "R1",
      preventionId: "P1",
      verificationId: "V1",
      criticalOptionIds: spec.critical,
    });
    expect(s.solution.claimRules.map((rule) => rule.claimId)).toEqual([
      "C1",
      "C2",
      "C3",
    ]);
    s.solution.claimRules.forEach((rule, i) => {
      expect(rule.requiredEvidenceSets).toEqual(spec.sets[i]);
      expect(rule.allowedSupportingEvidenceIds).toEqual(spec.support[i]);
      expect(rule.contradictoryEvidenceIds).toEqual([]);
      for (const set of rule.requiredEvidenceSets)
        expect(set.length).toBe(
          s.reportOptions.claimOptions.find((c) => c.id === rule.claimId)!
            .requiredEvidenceCount,
        );
    });
  });

  it("checks all 330 one/two-card combinations using the real grader and independent facts", () => {
    const cards = s.evidence.map((e) => e.id),
      combinations = cards.map((id) => [id]);
    cards.forEach((id, i) =>
      cards.slice(i + 1).forEach((other) => combinations.push([id, other])),
    );
    expect(combinations).toHaveLength(55);
    for (const claim of s.reportOptions.claimOptions)
      for (const ids of combinations) {
        const i = ["C1", "C2", "C3"].indexOf(claim.id);
        const expected =
          i < 0
            ? 0
            : spec.sets[i].some((set) => set.every((id) => ids.includes(id)))
              ? 10
              : [...spec.sets[i].flat(), ...spec.support[i]].some((id) =>
                    ids.includes(id),
                  )
                ? 5
                : 0;
        const grade = gradeReport(
          {
            ...reportFor(s),
            claims: [{ claimId: claim.id, evidenceIds: [...ids].reverse() }],
          },
          s.solution,
          s,
        );
        expect(
          grade.scores.claims,
          `${spec.id}/${claim.id}/${ids.join(",")}`,
        ).toBe(expected);
      }
    expect(() => validateSubmission(reportFor(s), s)).not.toThrow();
    expect(gradeReport(reportFor(s), s.solution, s)).toMatchObject({
      total: 100,
      solved: true,
      scores: {
        scope: 10,
        cause: 30,
        claims: 30,
        repair: 10,
        prevention: 10,
        verification: 10,
      },
    });
    expect(() =>
      validateSubmission(
        { ...reportFor(s), claims: reportFor(s).claims.slice(0, 2) },
        s,
      ),
    ).toThrow();
    expect(() =>
      validateSubmission(
        {
          ...reportFor(s),
          claims: reportFor(s).claims.map((c) => ({ ...c, evidenceIds: [] })),
        },
        s,
      ),
    ).toThrow();
    expect(() =>
      validateSubmission(
        {
          ...reportFor(s),
          claims: [
            { claimId: "C1", evidenceIds: ["E01", "E02", "E03"] },
            ...reportFor(s).claims.slice(1),
          ],
        },
        s,
      ),
    ).toThrow();
  });

  it("retains critical and solve thresholds without hidden penalties", () => {
    for (const repairId of spec.critical)
      expect(
        gradeReport({ ...reportFor(s), repairId }, s.solution, s),
      ).toMatchObject({
        total: 90,
        solved: false,
        criticalOptionIds: [repairId],
      });
    const twoClaims = reportFor(s);
    twoClaims.claims[2] = { claimId: "W3", evidenceIds: ["E10"] };
    expect(gradeReport(twoClaims, s.solution, s)).toMatchObject({
      total: 90,
      solved: true,
      scores: { claims: 20 },
    });
    expect(
      gradeReport({ ...twoClaims, preventionId: "P2" }, s.solution, s),
    ).toMatchObject({ total: 80, solved: true });
    expect(
      gradeReport(
        { ...twoClaims, scopeId: "S2", preventionId: "P2" },
        s.solution,
        s,
      ),
    ).toMatchObject({ total: 70, solved: false });
    expect(
      gradeReport(
        {
          ...reportFor(s),
          claims: [
            reportFor(s).claims[0],
            { claimId: "W2", evidenceIds: ["E10"] },
            { claimId: "W3", evidenceIds: ["E10"] },
          ],
        },
        s.solution,
        s,
      ),
    ).toMatchObject({ total: 80, solved: false, scores: { claims: 10 } });
    for (const change of [
      { causeId: "H2" },
      { repairId: "R3" },
      { verificationId: "V2" },
    ])
      expect(
        gradeReport({ ...reportFor(s), ...change }, s.solution, s).solved,
      ).toBe(false);
  });
});

it("registers all five network cases with 50 cards, 105 thoughts, 100 lines and 135 feedback entries", () => {
  const cases = specs.map((spec) => load(spec.id));
  expect(modes.find((mode) => mode.id === "network")!.caseIds).toEqual(
    specs.map((spec) => spec.id),
  );
  expect(cases.reduce((sum, s) => sum + s.evidence.length, 0)).toBe(50);
  expect(
    cases.reduce(
      (sum, s) => sum + Object.keys(story(s).evidenceThoughts).length + 11,
      0,
    ),
  ).toBe(105);
  expect(
    cases.reduce((sum, s) => {
      const n = story(s);
      return (
        sum +
        n.introDialogue!.length +
        n.resultDialogue!.solved.length +
        n.resultDialogue!.reconsider.length
      );
    }, 0),
  ).toBe(100);
  expect(
    cases.reduce(
      (sum, s) => sum + Object.keys(s.solution.optionFeedback).length,
      0,
    ),
  ).toBe(135);
  expect(cases.map((s) => s.glossary.length)).toEqual([13, 11, 10, 11, 12]);
  expect(
    cases[0].glossary.some((entry) => entry.term === "ゲートウェイ（GW）"),
  ).toBe(true);
  for (const field of [
    "scopeOptions",
    "causeOptions",
    "repairOptions",
    "preventionOptions",
    "verificationOptions",
  ] as const) {
    expect(
      new Set(
        cases.map((s) =>
          s.reportOptions[field].findIndex((o) => o.id.endsWith("1")),
        ),
      ).size,
    ).toBeGreaterThan(1);
  }
});

it("keeps all 33 agreed diagram links and device roles", () => {
  const expected = [
    [
      "L_READER:reader:sw",
      "L_FIXED:fixed:sw",
      "L_UPLINK:sw:l3",
      "L_CATALOG:l3:catalog",
      "L_GUIDE:l3:guide",
      "L_DNS:l3:dns",
      "L_DHCP:l3:dhcp",
    ],
    [
      "L_D1:display1:edge",
      "L_D2:display2:edge",
      "L_MGR:mgr:edge",
      "L_TRUNK:edge:core",
      "L_SERVER:core:server",
      "L_DESK:desk:core",
    ],
    [
      "L_PUBLIC:client:rp",
      "L_DNS:client:dns",
      "L_APP:rp:app",
      "L_MANAGEMENT:rp:router",
      "L_OPS:ops:router",
      "L_DIAGNOSTIC:router:app",
    ],
    [
      "L_A:pc70:br",
      "L_B:pc140:br",
      "L_DNS:br:dns",
      "L_BR_A:br:fwa",
      "L_BR_B:br:fwb",
      "L_A_DR:fwa:dr",
      "L_B_DR:fwb:dr",
      "L_SERVER:dr:server",
    ],
    [
      "L_MEDIA:media:edge",
      "L_BULK:bulk:edge",
      "L_UPLINK:edge:wan",
      "L_WAN:wan:remote",
      "L_RECV:remote:recv",
      "L_STORE:remote:store",
    ],
  ];
  specs.forEach((spec, i) =>
    expect(
      load(spec.id).topology.links.map(
        (link) => `${link.id}:${link.from}:${link.to}`,
      ),
    ).toEqual(expected[i]),
  );
  for (const id of ["fwa", "fwb"])
    expect(
      load("case15").topology.nodes.find((node) => node.id === id)!.kind,
    ).toBe("firewall");
});
