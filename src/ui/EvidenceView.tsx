import { useState } from "react";
import type { Evidence } from "../scenario/types";
export function EvidenceView({
  evidence,
  pinned,
  togglePin,
  back,
  backLabel = "証拠一覧へ戻る",
}: {
  evidence: Evidence;
  pinned: boolean;
  togglePin?: (checked: boolean) => void;
  back: () => void;
  backLabel?: string;
}) {
  const [logDetail, setLogDetail] = useState(false);
  const observed = new Date(evidence.observedAt).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return (
    <section className="evidence-detail">
      <button className="back-button" onClick={back}>
        ← {backLabel}
      </button>
      <div className="section-heading">
        <span className="eyebrow">EVIDENCE {evidence.id}</span>
        {togglePin && (
          <label className="check-row">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => togglePin(event.target.checked)}
              aria-label={`${evidence.id}を確認済みにする`}
            />
            <span>確認済み</span>
          </label>
        )}
      </div>
      <h2>{evidence.title}</h2>
      <dl className="metadata">
        <div>
          <dt>取得元</dt>
          <dd>{evidence.source}</dd>
        </div>
        <div>
          <dt>観測時刻</dt>
          <dd>{observed} JST</dd>
        </div>
        <div>
          <dt>取得方法</dt>
          <dd>
            {evidence.acquisition === "diagnostic"
              ? "固定診断の実測結果"
              : evidence.kind === "report"
                ? "報告・作業資料"
                : "記録・設定資料"}
          </dd>
        </div>
      </dl>
      {evidence.content.blocks.some((b) => b.type === "log") && (
        <div className="segmented">
          <button aria-pressed={!logDetail} onClick={() => setLogDetail(false)}>
            生ログ
          </button>
          <button aria-pressed={logDetail} onClick={() => setLogDetail(true)}>
            行の詳細
          </button>
        </div>
      )}
      {evidence.content.blocks.map((b, i) =>
        b.type === "text" ? (
          <p key={i}>{b.body}</p>
        ) : b.type === "table" ? (
          <div
            key={i}
            className="overflow-region"
            tabIndex={0}
            role="region"
            aria-label={`${evidence.title}の表`}
          >
            <table>
              <thead>
                <tr>
                  {b.columns.map((c, j) => (
                    <th key={j}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((row, j) => (
                  <tr key={j}>
                    {row.map((cell, k) => (
                      <td key={k}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !logDetail ? (
          <div
            key={i}
            className="overflow-region"
            tabIndex={0}
            role="region"
            aria-label={`${evidence.title}の生ログ`}
          >
            <pre>{b.lines.join("\n")}</pre>
          </div>
        ) : (
          <div key={i} className="log-details">
            {b.lines.map((line, j) => {
              const fields = Object.fromEntries(
                [...line.matchAll(/(\w+)=([^\s]+)/g)].map((m) => [m[1], m[2]]),
              );
              return (
                <article key={j}>
                  <strong>
                    記録 {j + 1} · {line.split(" ")[0]}
                  </strong>
                  <dl className="metadata">
                    <div>
                      <dt>送信元</dt>
                      <dd>
                        {fields.src ?? fields.client ?? "この行には記録なし"}
                      </dd>
                    </div>
                    <div>
                      <dt>宛先</dt>
                      <dd>
                        {fields.dst ??
                          fields.resolver ??
                          fields.url ??
                          "この行には記録なし"}
                        {fields.dport ? `:${fields.dport}` : ""}
                      </dd>
                    </div>
                    <div>
                      <dt>結果</dt>
                      <dd>
                        {fields.action ??
                          fields.status ??
                          fields.HTTP ??
                          (fields.A
                            ? `A ${fields.A} / TTL ${fields.TTL}`
                            : "この行には記録なし")}
                      </dd>
                    </div>
                  </dl>
                  <code className="wrapped-log">{line}</code>
                </article>
              );
            })}
          </div>
        ),
      )}
    </section>
  );
}
