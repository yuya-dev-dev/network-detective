import type { Scenario } from "./types";

export function object(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${path}: オブジェクトが必要です`);
  return value as Record<string, unknown>;
}
export function string(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`${path}: 空でない文字列が必要です`);
  return value;
}
export function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${path}: 配列が必要です`);
  return value;
}
export function strings(value: unknown, path: string): string[] {
  return array(value, path).map((v, i) => string(v, `${path}[${i}]`));
}
export function integer(
  value: unknown,
  path: string,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max)
    throw new Error(`${path}: 範囲内の整数が必要です`);
  return Number(value);
}
export function unique(ids: string[], path: string) {
  if (new Set(ids).size !== ids.length)
    throw new Error(`${path}: IDが重複しています`);
}
function date(value: unknown, path: string) {
  const text = string(value, path);
  if (
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:Z|[+-]\d\d:\d\d)$/.test(text) ||
    !Number.isFinite(Date.parse(text))
  )
    throw new Error(`${path}: タイムゾーン付きISO 8601が必要です`);
}
export function assertScenario(value: unknown): asserts value is Scenario {
  const s = object(value, "Scenario");
  if (s.schemaVersion !== 1) throw new Error("未対応のschemaVersion");
  for (const key of ["id", "title", "brief"]) string(s[key], key);
  integer(s.revision, "revision", 1);
  integer(s.estimatedMinutes, "estimatedMinutes", 1);
  integer(s.difficulty, "difficulty", 1, 4);
  if (!["network", "hybrid", "security"].includes(String(s.type)))
    throw new Error("不正な事件タイプ");
  strings(s.prerequisites, "prerequisites");
  const context = object(s.context, "context");
  strings(context.baseline, "baseline");
  strings(context.assumptions, "assumptions");
  date(context.snapshotTime, "snapshotTime");
  const topology = object(s.topology, "topology");
  const nodes = array(topology.nodes, "nodes").map((v) => object(v, "node"));
  const nodeIds = nodes.map((n) => {
    string(n.label, "node.label");
    string(n.kind, "node.kind");
    strings(n.addresses, "addresses");
    return string(n.id, "node.id");
  });
  unique(nodeIds, "nodes");
  const links = array(topology.links, "links").map((v) => object(v, "link"));
  unique(
    links.map((l) => string(l.id, "link.id")),
    "links",
  );
  for (const l of links) {
    if (!nodeIds.includes(String(l.from)) || !nodeIds.includes(String(l.to)))
      throw new Error("リンクの参照先が存在しません");
    string(l.label, "link.label");
  }
  const evidence = array(s.evidence, "evidence").map((v) =>
    object(v, "Evidence"),
  );
  const evidenceIds = evidence.map((e) => string(e.id, "Evidence.id"));
  unique(evidenceIds, "evidence");
  const refs = (value: unknown, ids: string[], path: string) => {
    const selected = strings(value, path);
    unique(selected, path);
    if (selected.some((id) => !ids.includes(id)))
      throw new Error(`${path}: 不明なID参照`);
    return selected;
  };
  for (const e of evidence) {
    for (const key of ["title", "source"]) string(e[key], `Evidence.${key}`);
    if (
      !["report", "log", "config", "test", "alert"].includes(String(e.kind)) ||
      !["document", "diagnostic"].includes(String(e.acquisition))
    )
      throw new Error("証拠の種別・取得方法が不正");
    date(e.observedAt, "observedAt");
    if (e.observedAtLabel !== undefined) string(e.observedAtLabel, "observedAtLabel");
    refs(e.nodeIds, nodeIds, "nodeIds");
    const blocks = array(object(e.content, "content").blocks, "blocks");
    if (!blocks.length) throw new Error("証拠内容が空です");
    for (const v of blocks) {
      const b = object(v, "block");
      if (b.type === "text") string(b.body, "body");
      else if (b.type === "log") strings(b.lines, "lines");
      else if (b.type === "table") {
        const columns = strings(b.columns, "columns");
        if (!columns.length) throw new Error("表の列が空です");
        for (const row of array(b.rows, "rows"))
          if (strings(row, "row").length !== columns.length)
            throw new Error("表の列数が不一致");
      } else throw new Error("未対応の証拠ブロック（raw HTMLは禁止）");
    }
  }
  const options = (value: unknown, path: string) =>
    array(value, path).map((v) => {
      const o = object(v, path);
      string(o.label, `${path}.label`);
      string(o.description, `${path}.description`);
      return string(o.id, `${path}.id`);
    });
  const hypothesisIds = options(s.hypotheses, "hypotheses");
  unique(hypothesisIds, "hypotheses");
  const ro = object(s.reportOptions, "reportOptions");
  const optionGroups = [
    "scopeOptions",
    "causeOptions",
    "claimOptions",
    "repairOptions",
    "preventionOptions",
    "verificationOptions",
  ];
  const groupIds = Object.fromEntries(
    optionGroups.map((k) => [k, options(ro[k], k)]),
  );
  for (const key of optionGroups) {
    unique(groupIds[key], key);
    if (groupIds[key].length < 3) throw new Error(`${key}: 3候補以上が必要`);
  }
  const allOptionIds = Object.values(groupIds).flat();
  const claims = array(ro.claimOptions, "claimOptions").map((v) =>
    object(v, "claimOption"),
  );
  for (const claim of claims)
    integer(claim.requiredEvidenceCount, "requiredEvidenceCount", 1, 2);
  unique(allOptionIds, "reportOptions");
  if (
    groupIds.causeOptions.length !== hypothesisIds.length ||
    groupIds.causeOptions.some((id) => !hypothesisIds.includes(id))
  )
    throw new Error("原因候補は仮説IDと一致させてください");
  const sol = object(s.solution, "solution");
  for (const [key, group] of [
    ["scopeId", "scopeOptions"],
    ["causeId", "causeOptions"],
    ["repairId", "repairOptions"],
    ["preventionId", "preventionOptions"],
    ["verificationId", "verificationOptions"],
  ]) {
    if (!groupIds[group].includes(String(sol[key])))
      throw new Error(`${key}: 正答IDが存在しません`);
  }
  const rules = array(sol.claimRules, "claimRules").map((v) =>
    object(v, "claimRule"),
  );
  const ruleIds = rules.map((r) => string(r.claimId, "claimId"));
  unique(ruleIds, "claimRules");
  if (
    ruleIds.length !== 3 ||
    ruleIds.some((id) => !groupIds.claimOptions.includes(id)) ||
    groupIds.claimOptions.length - ruleIds.length < 3
  )
    throw new Error("正しい主張3件、誤主張3件以上が必要");
  for (const r of rules) {
    const sets = array(r.requiredEvidenceSets, "requiredEvidenceSets").map(
      (v) => refs(v, evidenceIds, "requiredEvidenceSet"),
    );
    if (!sets.length || sets.some((set) => set.length < 1 || set.length > 2))
      throw new Error("成立条件は1〜2証拠の空でない候補集合にしてください");
    if (
      sets.some(
        (set) =>
          set.length !==
          claims.find((c) => c.id === r.claimId)?.requiredEvidenceCount,
      )
    )
      throw new Error("主張の必要証拠数と成立条件が一致しません");
    const support = refs(
      r.allowedSupportingEvidenceIds,
      evidenceIds,
      "allowedSupportingEvidenceIds",
    );
    const contrary = refs(
      r.contradictoryEvidenceIds,
      evidenceIds,
      "contradictoryEvidenceIds",
    );
    if ([...sets.flat(), ...support].some((id) => contrary.includes(id)))
      throw new Error("支持証拠と矛盾証拠が重複しています");
  }
  refs(sol.criticalOptionIds, allOptionIds, "criticalOptionIds");
  const explanation = (value: unknown) => {
    const e = object(value, "explanation");
    string(e.text, "explanation.text");
    refs(e.evidenceIds, evidenceIds, "explanation.evidenceIds");
  };
  array(sol.causalChain, "causalChain").forEach(explanation);
  for (const [key, ids] of [
    ["hypothesisFeedback", hypothesisIds],
    ["optionFeedback", allOptionIds],
  ] as const) {
    const feedback = object(sol[key], key);
    for (const id of ids) explanation(feedback[id]);
    if (Object.keys(feedback).some((id) => !ids.includes(id)))
      throw new Error(`${key}: 不明な候補ID`);
  }
  const roles = object(sol.evidenceRoles, "evidenceRoles");
  for (const id of evidenceIds) string(roles[id], `evidenceRoles.${id}`);
  if (Object.keys(roles).some((id) => !evidenceIds.includes(id)))
    throw new Error("evidenceRoles: 不明な証拠");
  const hints = array(s.hints, "hints").map((v) => object(v, "Hint"));
  unique(
    hints.map((h) => string(h.id, "hint.id")),
    "hints",
  );
  if (hints.length !== 3 || hints.some((h, i) => h.level !== i + 1))
    throw new Error("ヒントは1〜3の順に必要です");
  for (const h of hints) {
    string(h.text, "hint.text");
    refs(h.evidenceIds, evidenceIds, "hint.evidenceIds");
  }
  for (const v of array(s.glossary, "glossary")) {
    const g = object(v, "term");
    string(g.term, "term");
    string(g.definition, "definition");
  }
}
