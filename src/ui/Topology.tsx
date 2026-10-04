import { useState } from "react";
import type { PlayableScenario } from "../scenario/types";
import narrative from "../data/narrative.json";
import { Dialog } from "./common";
const positions: Record<string, [number, number]> = {
  N_SALES: [85, 38],
  N_OPS: [255, 38],
  N_L3: [170, 122],
  N_DNS: [85, 206],
  N_FW: [255, 206],
  N_WEB: [255, 290],
};
function NetworkMap({
  scenario,
  selected,
  choose,
  zoom,
}: {
  scenario: PlayableScenario;
  selected: string | null;
  choose: (id: string) => void;
  zoom?: number;
}) {
  const arrow = zoom ? "arrow-expanded" : "arrow";
  return (
    <div className={`map-panel ${zoom ? "map-expanded" : "map-overview"}`}>
      <svg
        viewBox="0 0 340 328"
        role="group"
        aria-label="双方向のネットワーク構成図"
        style={
          zoom
            ? { width: `${340 * zoom}px`, height: `${328 * zoom}px` }
            : undefined
        }
      >
        <defs>
          <marker
            id={arrow}
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
              d={`M ${a[0]} ${a[1] + 28} L ${b[0]} ${b[1] - 28}`}
              fill="none"
              stroke="#8ca1b5"
              strokeWidth="2"
              markerStart={`url(#${arrow})`}
              markerEnd={`url(#${arrow})`}
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
                y={y - 27}
                width="146"
                height="54"
                rx="5"
                fill={selected === n.id ? "#1a2c37" : "#141a22"}
                stroke={selected === n.id ? "#72d9ec" : "#46586b"}
                strokeWidth={selected === n.id ? 3 : 1.5}
              />
              <rect
                x={x - 67}
                y={y - 23}
                width="134"
                height="3"
                rx="1"
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
              <rect
                x={x - 76}
                y={y - 35}
                width="152"
                height="70"
                fill="transparent"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
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
  const [enlarged, enlarge] = useState(false);
  const [zoom, setZoom] = useState(1.5);
  const choose = (id: string) => {
    select(id);
    think(narrative.tabs.topology);
  };
  const node = scenario.topology.nodes.find((n) => n.id === selected);
  const nodeDetails = node && (
    <div className="node-detail">
      {node.addresses.map((a) => (
        <p key={a}>{a}</p>
      ))}
      <div className="evidence-refs">
        {scenario.evidence
          .filter((e) => e.nodeIds.includes(node.id))
          .map((e) => (
            <button
              key={e.id}
              onClick={() => {
                select(null);
                enlarge(false);
                open(e.id);
              }}
            >
              {e.id} {e.title}
            </button>
          ))}
      </div>
    </div>
  );
  return (
    <section className="topology-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">NETWORK MAP</span>
          <h2>現場の構成図</h2>
        </div>
        <span className="stamp">機器をタップ</span>
      </div>
      <NetworkMap scenario={scenario} selected={selected} choose={choose} />
      <div className="map-actions">
        <span>全体表示</span>
        <button onClick={() => enlarge(true)}>拡大して見る ↗</button>
      </div>
      {node && !enlarged && (
        <Dialog title={node.label} close={() => select(null)}>
          {nodeDetails}
        </Dialog>
      )}
      {enlarged && (
        <Dialog
          title="構成図を拡大"
          close={() => {
            enlarge(false);
            select(null);
          }}
        >
          <div className="zoom-controls">
            <button
              aria-label="構成図を縮小"
              disabled={zoom <= 1}
              onClick={() => setZoom(Math.max(1, zoom - 0.25))}
            >
              −
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              aria-label="構成図を拡大"
              disabled={zoom >= 2.5}
              onClick={() => setZoom(Math.min(2.5, zoom + 0.25))}
            >
              ＋
            </button>
          </div>
          <p className="muted">
            縦横にスクロールできます。機器をタップすると詳細を表示します。
          </p>
          <div
            className="map-scroll"
            role="region"
            aria-label="拡大構成図"
            tabIndex={0}
          >
            <NetworkMap
              scenario={scenario}
              selected={selected}
              choose={choose}
              zoom={zoom}
            />
          </div>
          {node && (
            <>
              <h3>{node.label}</h3>
              {nodeDetails}
            </>
          )}
        </Dialog>
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
