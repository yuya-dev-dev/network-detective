import { useId, useState } from "react";
import type { PlayableScenario } from "../scenario/types";
import { getLayout, type Point } from "./topologyLayouts";
import { Dialog } from "./common";

function DeviceIcon({ kind }: { kind: string }) {
  if (kind === "client") return <><rect x="1" y="2" width="20" height="14" rx="1"/><path d="M11 16v4M4 20h14"/></>;
  if (kind === "firewall") return <><rect x="1" y="1" width="20" height="20"/><path d="M1 7h20M1 14h20M8 1v6M15 7v7M8 14v7"/></>;
  if (kind === "storage") return <><ellipse cx="11" cy="4" rx="10" ry="3"/><path d="M1 4v14c0 4 20 4 20 0V4M1 11c0 4 20 4 20 0"/></>;
  if (kind === "switch" || kind === "router" || kind === "vpn") return <><rect x="1" y="2" width="20" height="18" rx={kind === "vpn" ? "7" : "2"}/><path d="M4 7h13l-3-3M17 15H4l3 3"/></>;
  return <><rect x="3" y="1" width="16" height="20" rx="2"/><path d="M6 7h10M6 12h10M6 17h4"/></>;
}
function endpoints(a: Point, b: Point): Point[] {
  if (Math.abs(a[0]-b[0]) > Math.abs(a[1]-b[1])) {
    const sign = Math.sign(b[0]-a[0]); return [[a[0]+sign*76,a[1]],[(a[0]+b[0])/2,a[1]],[(a[0]+b[0])/2,b[1]],[b[0]-sign*76,b[1]]];
  }
  const sign = Math.sign(b[1]-a[1]); return [[a[0],a[1]+sign*32],[a[0],(a[1]+b[1])/2],[b[0],(a[1]+b[1])/2],[b[0],b[1]-sign*32]];
}
function NetworkMap({ scenario, selected, choose, zoom }: { scenario: PlayableScenario; selected: string | null; choose: (id: string) => void; zoom?: number }) {
  const layout = getLayout(scenario);
  const arrow = useId().replace(/:/g, "") + "-arrow";
  return <div className={`map-panel ${zoom ? "map-expanded" : "map-overview"}`}>
    <svg viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label="ネットワーク構成図：実線は通信、破線は所属や資料の関係" style={zoom ? {width:layout.width*zoom,height:layout.height*zoom} : undefined}>
      <defs><marker id={arrow} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="#a9bccd"/></marker></defs>
      <text x="14" y="16" className="map-caption">NETWORK TOPOLOGY / CASE {scenario.id.slice(4)}</text>
      {layout.zones.map((z,i)=><g key={i} className="map-zone"><rect x={z.x} y={z.y} width={z.width} height={z.height} rx="3"/><text x={z.x+7} y={z.y+13}>{z.label}</text></g>)}
      {scenario.topology.links.map(link=>{
        const spec = layout.edges[link.id] ?? {};
        const points = spec.points ?? endpoints(layout.nodes[link.from].at,layout.nodes[link.to].at);
        const arrows = spec.arrows ?? "both";
        return <g key={link.id} data-link-id={link.id} data-link-kind={spec.kind ?? "network"}>
          <title>{link.label}</title>
          {spec.kind === "tunnel" && <polyline points={points.map(p=>p.join(",")).join(" ")} className="map-tunnel"/>}
          <polyline points={points.map(p=>p.join(",")).join(" ")} className={`map-link ${spec.kind ?? "network"}`} markerStart={arrows === "both" ? `url(#${arrow})` : undefined} markerEnd={arrows !== "none" ? `url(#${arrow})` : undefined}/>
          {spec.labels?.map((l,i)=><text key={i} x={l.at[0]} y={l.at[1]} className="map-link-label">{l.text}</text>)}
        </g>;
      })}
      {scenario.topology.nodes.map(n=>{
        const spec = layout.nodes[n.id]; const [x,y] = spec.at;
        const lines = spec.lines ?? n.addresses.slice(0,2);
        const hitHeight = Math.max(84,layout.height*0.21);
        return <g key={n.id} role="button" tabIndex={0} aria-label={`${n.label}の詳細`} data-node-id={n.id} onClick={()=>choose(n.id)} onKeyDown={e=>{if(e.key === "Enter" || e.key === " "){e.preventDefault();choose(n.id);}}}>
          <title>{n.label + " / " + n.addresses.join(" / ")}</title>
          <rect className="map-node" x={x-76} y={y-32} width="152" height="64" rx="3" stroke={selected === n.id ? "#72d9ec" : "#73879a"} strokeWidth={selected === n.id ? "2.5" : "1.2"}/>
          <g className="device-symbol" transform={`translate(${x-68} ${y-25})`}><DeviceIcon kind={n.kind}/></g>
          <text x={x+12} y={y-10} className="map-node-title">{spec.title ?? n.label}</text>
          {lines.map((line,i)=><text key={i} x={x} y={y+9+i*14} className="map-address">{line}</text>)}
          <rect x={x-78} y={y-hitHeight/2} width="156" height={hitHeight} fill="transparent" className="map-hit"/>
        </g>;
      })}
      {layout.notes?.map((note,i)=><text key={i} x={note.at[0]} y={note.at[1]} className="map-note">{note.text}</text>)}
    </svg>
  </div>;
}
export function Topology({
  scenario,
  open,
  think,
  thought,
}: {
  scenario: PlayableScenario;
  open: (id: string) => void;
  think: (text: string) => void;
  thought: string;
}) {
  const [selected, select] = useState<string | null>(null);
  const [enlarged, enlarge] = useState(false);
  const [zoom, setZoom] = useState(1.5);
  const choose = (id: string) => {
    select(id);
    think(thought);
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
