import { useRef, useState } from "react";
import type { PlayableScenario } from "../scenario/types";
import type { Report } from "../game/types";
import { validateSubmission } from "../game/scoring";
import { Dialog } from "./common";
export function ReportForm({
  scenario,
  report,
  opened,
  change,
  submit,
  onReview,
}: {
  scenario: PlayableScenario;
  report: Report;
  opened: string[];
  change: (r: Report) => void;
  submit: () => void;
  onReview: () => void;
}) {
  const [confirming, confirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useRef<HTMLElement>(null);
  const groups = [
    ["scopeId", "scopeOptions", "影響範囲", "10点"],
    ["causeId", "causeOptions", "根本原因", "30点"],
    ["repairId", "repairOptions", "修復計画", "10点"],
    ["preventionId", "preventionOptions", "再発防止", "10点"],
    ["verificationId", "verificationOptions", "復旧確認", "10点"],
  ] as const;
  const candidates = scenario.evidence.filter((e) => opened.includes(e.id));
  const prepare = () => {
    try {
      validateSubmission(report, scenario);
      setError(null);
      onReview();
      confirm(true);
    } catch (e) {
      setError((e as Error).message);
      const missing = groups.find(([field]) => !report[field]);
      const section = form.current?.querySelector<HTMLDetailsElement>(
        `details[data-report-field="${missing?.[0] ?? "claims"}"]`,
      );
      if (section) {
        section.open = true;
        section.scrollIntoView({ block: "start" });
        section.querySelector("summary")?.focus();
      }
    }
  };
  const claims = (
    <details className="report-group" data-report-field="claims">
      <summary>
        <span>判断根拠</span>
        <small>
          主張3枚を選択 · {report.claims.length}/3枚
          {report.claims.some((c) => c.evidenceIds.length === 0)
            ? " · 証拠未添付"
            : ""}
        </small>
      </summary>
      <fieldset>
        <legend>
          判断根拠 <span>最大30点</span>
        </legend>
        <p className="muted">
          主張を3枚選び、カードに記載された件数の証拠を添付してください。補足を含め、各主張2件まで添付できます。証拠は1件以上で提出できますが、不足すると部分点または0点になります。
        </p>
        <details className="grading-guide">
          <summary>判断根拠の採点基準</summary>
          <p>
            各主張10点。正しい主張と必要な証拠がそろうと10点、支持する証拠があっても十分でない場合は5点です。誤った主張、矛盾する証拠、無関係な証拠だけの場合は0点です。件数を満たすだけでは得点になりません。
          </p>
        </details>
        {scenario.reportOptions.claimOptions.map((o) => {
          const claim = report.claims.find((c) => c.claimId === o.id);
          return (
            <div
              className={`claim-option ${claim ? "selected" : ""}`}
              key={o.id}
            >
              <label className="option">
                <input
                  type="checkbox"
                  checked={!!claim}
                  disabled={!claim && report.claims.length >= 3}
                  onChange={() =>
                    change({
                      ...report,
                      claims: claim
                        ? report.claims.filter((c) => c.claimId !== o.id)
                        : [
                            ...report.claims,
                            { claimId: o.id, evidenceIds: [] },
                          ],
                    })
                  }
                />
                <span>
                  <strong>{o.label}</strong>
                  <small>{o.description}</small>
                  <small className="claim-requirement">
                    必要な証拠：{o.requiredEvidenceCount}件
                  </small>
                </span>
              </label>
              {claim && (
                <div className="claim-evidence">
                  {candidates.length ? (
                    candidates.map((e) => (
                      <label key={e.id} className="check-row">
                        <input
                          type="checkbox"
                          checked={claim.evidenceIds.includes(e.id)}
                          disabled={
                            !claim.evidenceIds.includes(e.id) &&
                            claim.evidenceIds.length >= 2
                          }
                          onChange={() =>
                            change({
                              ...report,
                              claims: report.claims.map((c) =>
                                c.claimId !== o.id
                                  ? c
                                  : {
                                      ...c,
                                      evidenceIds: c.evidenceIds.includes(e.id)
                                        ? c.evidenceIds.filter(
                                            (id) => id !== e.id,
                                          )
                                        : [...c.evidenceIds, e.id],
                                    },
                              ),
                            })
                          }
                        />
                        <span>
                          {e.id} {e.title}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p>証拠タブで資料を開くと添付できます。</p>
                  )}
                  <p className="muted">
                    必要 {o.requiredEvidenceCount}件 · 添付{" "}
                    {claim.evidenceIds.length}件（補足を含め2件まで）
                    {claim.evidenceIds.length < o.requiredEvidenceCount
                      ? " · 証拠が不足しています"
                      : ""}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </fieldset>
    </details>
  );
  return (
    <section ref={form} className="report-page">
      <span className="eyebrow">INVESTIGATION REPORT</span>
      <h2>調査報告をまとめる</h2>
      <p>提出はこの試行で1回。まだ気になることがあれば、調査へ戻れます。</p>
      {groups.map(([field, group, title, points], index) => (
        <div key={field}>
          <details className="report-group" data-report-field={field}>
            <summary>
              <span>{title}</span>
              <small>
                {scenario.reportOptions[group].find(
                  (o) => o.id === report[field],
                )?.label ?? "未選択"}
              </small>
            </summary>
            <fieldset>
              <legend>
                {title} <span>{points}</span>
              </legend>
              {scenario.reportOptions[group].map((o) => (
                <label
                  key={o.id}
                  className={`option ${report[field] === o.id ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name={field}
                    value={o.id}
                    checked={report[field] === o.id}
                    onChange={() => change({ ...report, [field]: o.id })}
                  />
                  <span>
                    <strong>{o.label}</strong>
                    <small>{o.description}</small>
                  </span>
                </label>
              ))}
            </fieldset>
          </details>
          {index === 1 && claims}
        </div>
      ))}
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <button className="primary wide" onClick={prepare}>
        報告内容を確認する →
      </button>
      {confirming && (
        <Dialog title="この内容で報告する" close={() => confirm(false)}>
          <p>
            提出後は回答を変更できません。解説を読んだ後の再挑戦は、別の試行として記録します。
          </p>
          <dl className="review-report">
            {groups.map(([field, group, title]) => (
              <div key={field}>
                <dt>{title}</dt>
                <dd>
                  {
                    scenario.reportOptions[group].find(
                      (o) => o.id === report[field],
                    )?.label
                  }
                </dd>
              </div>
            ))}
            <div>
              <dt>判断根拠</dt>
              <dd>
                {report.claims.length
                  ? report.claims.map((c) => (
                      <p key={c.claimId}>
                        {
                          scenario.reportOptions.claimOptions.find(
                            (o) => o.id === c.claimId,
                          )?.label
                        }
                        <br />
                        <span className="mono">
                          {c.evidenceIds.join(" + ")}
                        </span>
                      </p>
                    ))
                  : "主張なし"}
              </dd>
            </div>
          </dl>
          <button
            className="primary wide"
            onClick={() => {
              confirm(false);
              submit();
            }}
          >
            この報告を提出する
          </button>
        </Dialog>
      )}
    </section>
  );
}
