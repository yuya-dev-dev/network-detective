import { useState } from "react";
import type { PlayableScenario } from "../scenario/types";
import narrative from "../data/narrative.json";
const positions: Record<string, [number, number]> = {
  N_SALES: [85, 48],
  N_OPS: [255, 48],
  N_L3: [170, 170],
  N_DNS: [85, 290],
  N_FW: [255, 290],
  N_WEB: [255, 420],
};
export function Topology({
  scenario,
  open,
  think,
}: {
  scenario: PlayableScenario;
  open: (id: string) => void;
  think: (text: string) => void;
}) {
  const [selected, select] = useState<string | null>(null);
  const choose = (id: string) => {
    select(id);
    think(narrative.tabs.topology);
  };
  const node = scenario.topology.nodes.find((n) => n.id === selected);
  return (
    <section>
      <div className="section-heading">
        <div>
          <span className="eyebrow">NETWORK MAP</span>
          <h2>現場の構成図</h2>
        </div>
        <span className="stamp">機器をタップ</span>
      </div>
      <div className="map-panel">
        <svg
          viewBox="0 0 340 482"
          role="group"
          aria-label="双方向のネットワーク構成図"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0 0 10 5 0 10z" fill="#8ca1b5" />
            </marker>
          </defs>
          {scenario.topology.links.map((l) => {
            const a = positions[l.from],
              b = positions[l.to];
            return (
              <path
                key={l.id}
                d={`M ${a[0]} ${a[1] + 35} L ${b[0]} ${b[1] - 35}`}
                fill="none"
                stroke="#8ca1b5"
                strokeWidth="2"
                markerStart="url(#arrow)"
                markerEnd="url(#arrow)"
              />
            );
          })}
          {scenario.topology.nodes.map((n) => {
            const [x, y] = positions[n.id];
            const short =
              n.id === "N_SALES"
                ? "営業 / VLAN41"
                : n.id === "N_OPS"
                  ? "運用 / VLAN42"
                  : n.label;
            return (
              <g
                key={n.id}
                role="button"
                tabIndex={0}
                aria-label={`${n.label}の詳細`}
                onClick={() => choose(n.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    choose(n.id);
                  }
                }}
              >
                <rect
                  x={x - 73}
                  y={y - 34}
                  width="146"
                  height="68"
                  rx="9"
                  fill={selected === n.id ? "#1a2c37" : "#141a22"}
                  stroke={selected === n.id ? "#72d9ec" : "#46586b"}
                  strokeWidth={selected === n.id ? 3 : 1.5}
                />
                <rect
                  x={x - 67}
                  y={y - 28}
                  width="134"
                  height="6"
                  rx="3"
                  fill="#344252"
                />
                <text
                  x={x}
                  y={y - 3}
                  textAnchor="middle"
                  fill="#edf2f7"
                  fontSize="14"
                  fontWeight="bold"
                >
                  {short}
                </text>
                <text
                  x={x}
                  y={y + 20}
                  textAnchor="middle"
                  fill="#b6c8d6"
                  fontSize="11"
                >
                  {n.id === "N_FW" ? "通信許可 / 拒否" : n.addresses[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {node && (
        <article className="paper-card">
          <h3>{node.label}</h3>
          {node.addresses.map((a) => (
            <p key={a}>{a}</p>
          ))}
          <div className="evidence-refs">
            {scenario.evidence
              .filter((e) => e.nodeIds.includes(node.id))
              .map((e) => (
                <button key={e.id} onClick={() => open(e.id)}>
                  {e.id} {e.title}
                </button>
              ))}
          </div>
        </article>
      )}
      <details className="paper-card">
        <summary>構成と通信経路を文字で読む</summary>
        {scenario.topology.nodes.map((n) => (
          <p key={n.id}>
            <strong>{n.label}</strong>
            <br />
            {n.addresses.join(" / ")}
          </p>
        ))}
        <ul>
          {scenario.topology.links.map((l) => (
            <li key={l.id}>{l.label}</li>
          ))}
        </ul>
        <p>許可した接続の戻り通信はFWが状態に基づき許可します。</p>
      </details>
      <details className="paper-card">
        <summary>正常要件と調査の前提</summary>
        <h3>正常要件</h3>
        <ul>
          {scenario.context.baseline.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <h3>通信・記録の前提</h3>
        <ul>
          {scenario.context.assumptions.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
