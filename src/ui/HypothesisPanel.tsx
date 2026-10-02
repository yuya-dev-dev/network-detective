import type { PlayableScenario } from "../scenario/types";
import type { Attempt } from "../game/types";
import type { Action } from "../game/reducer";
export function HypothesisPanel({
  scenario,
  attempt,
  dispatch,
}: {
  scenario: PlayableScenario;
  attempt: Attempt;
  dispatch: (a: Action) => void;
}) {
  const available = scenario.evidence.filter((e) =>
    attempt.openedEvidenceIds.includes(e.id),
  );
  return (
    <section>
      <span className="eyebrow">HYPOTHESIS NOTE</span>
      <h2>仮説を整理する</h2>
      <p className="muted">
        複数を「有力」にできます。ここでの分類や関連付けは採点しません。
      </p>
      {scenario.hypotheses.map((h) => (
        <article key={h.id} className="paper-card">
          <h3>{h.label}</h3>
          <p>{h.description}</p>
          <div className="segmented">
            {(
              [
                ["untested", "未検証"],
                ["likely", "有力"],
                ["excluded", "除外"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                aria-pressed={attempt.hypothesisStates[h.id] === value}
                onClick={() =>
                  dispatch({
                    type: "HYPOTHESIS",
                    hypothesisId: h.id,
                    state: value,
                  })
                }
              >
                {label}
              </button>
            ))}
          </div>
          <details>
            <summary>
              証拠を支持・反証として結ぶ（
              {
                attempt.evidenceLinks.filter((l) => l.hypothesisId === h.id)
                  .length
              }
              件）
            </summary>
            {available.length === 0 ? (
              <p>先に証拠を開いてみよう。</p>
            ) : (
              available.map((e) => {
                const link = attempt.evidenceLinks.find(
                  (l) => l.hypothesisId === h.id && l.evidenceId === e.id,
                );
                return (
                  <label className="link-row" key={e.id}>
                    <span>
                      {e.id} {e.title}
                    </span>
                    <select
                      aria-label={`${h.label}と${e.id}の関連`}
                      value={link?.relation ?? ""}
                      onChange={(event) =>
                        dispatch({
                          type: "LINK",
                          hypothesisId: h.id,
                          evidenceId: e.id,
                          relation:
                            event.target.value === ""
                              ? null
                              : (event.target.value as "support" | "refute"),
                        })
                      }
                    >
                      <option value="">関連なし</option>
                      <option value="support">支持</option>
                      <option value="refute">反証</option>
                    </select>
                  </label>
                );
              })
            )}
          </details>
        </article>
      ))}
    </section>
  );
}
