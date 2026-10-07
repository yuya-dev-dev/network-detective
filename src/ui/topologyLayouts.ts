import type { PlayableScenario } from "../scenario/types";
import { securityLayouts } from "./securityLayouts";
import { networkLayouts } from "./networkLayouts";
export type Point = [number, number];
export type MapNode = { at: Point; title?: string; lines?: string[] };
export type MapEdge = { points?: Point[]; kind?: "network" | "tunnel" | "relation" | "audit" | "test" | "copy" | "certificate" | "bulk"; arrows?: "both" | "end" | "none"; labels?: { at: Point; text: string }[] };
export type MapZone = { x: number; y: number; width: number; height: number; label: string };
export type MapLayout = { width: number; height: number; nodes: Record<string, MapNode>; edges: Record<string, MapEdge>; zones: MapZone[]; notes?: { at: Point; text: string }[]; legend?: string[]; compactOverview?: boolean; overlays?: (MapEdge & { points: Point[] })[] };
const node = (x: number, y: number, title?: string, lines?: string[]): MapNode => ({ at: [x,y], title, lines });
const label = (x: number, y: number, text: string) => ({ at: [x,y] as Point, text });
const edge = (points: Point[], text?: string, at?: Point, kind: MapEdge["kind"] = "network"): MapEdge => ({ points, kind, labels: text && at ? [{ at, text }] : [] });
const zone = (x: number, y: number, width: number, height: number, text: string): MapZone => ({ x,y,width,height,label:text });
export const layouts: Record<string, MapLayout> = {
  ...securityLayouts,
  ...networkLayouts,
  case01: { width: 480, height: 400,
    zones: [zone(12,25,188,105,"営業 VLAN41 / 10.28.41.0/24"),zone(280,25,188,105,"運用 VLAN42 / 10.28.42.0/24"),zone(12,264,188,112,"DNS側"),zone(280,264,188,112,"サーバ側")],
    nodes: { N_SALES: node(106,81,"営業端末",["PC 10.28.41.23","GW 10.28.41.1"]),N_OPS:node(374,81,"運用端末",["PC 10.28.42.24","GW 10.28.42.1"]),N_L3:node(106,204),N_DNS:node(106,321),N_FW:node(374,204,"サーバ用FW",["クライアント側 ⇄ サーバ側"]),N_WEB:node(374,321) },
    edges: { L_SALES:edge([[106,113],[106,172]]),L_OPS:edge([[374,113],[374,145],[158,145],[158,172]]),L_DNS:edge([[106,236],[106,289]],"名前解決 / FW経由なし",[129,258]),L_FW:edge([[182,204],[298,204]],"サーバ通信",[240,195]),L_WEB:edge([[374,236],[374,289]],"TCP/443",[416,258]) },
    notes:[label(240,390,"許可した接続の戻り通信はFWの状態管理対象")],
  },
  case02: { width: 480, height: 430,
    zones:[zone(12,28,188,95,"編集端末"),zone(280,28,188,95,"編集端末"),zone(12,211,456,103,"保存ノード / 10.61.20.x"),zone(12,336,456,78,"共通の保存先")],
    nodes:{N_A:node(106,77,"A班端末"),N_B:node(374,77,"B班端末"),N_DNS:node(240,164,"DNS",["10.61.10.53","caption.example.test"]),N_OLD:node(106,270,"旧保存ノード"),N_NEW:node(374,270,"新保存ノード"),N_STORE:node(240,378,"共通素材ストア")},
    edges:{L_A_DNS:edge([[158,109],[158,129],[188,129],[188,132]],"DNS",[119,149]),L_B_DNS:edge([[322,109],[322,129],[292,129],[292,132]],"DNS",[361,149]),L_A_OLD:edge([[80,109],[80,238]],"既存WS",[46,180]),L_B_NEW:edge([[400,109],[400,238]],"新規WS",[434,180]),L_A_NEW:edge([[30,109],[30,202],[374,202],[374,238]],"新接続の移行経路 / TCP443",[240,195]),L_OLD_STORE:edge([[106,302],[106,327],[204,327],[204,346]]),L_NEW_STORE:edge([[374,302],[374,327],[276,327],[276,346]])},
  },
  case03: { width:480,height:480,
    zones:[zone(12,28,188,199,"外部ネットワーク"),zone(280,28,188,199,"店の境界 / 公開MX"),zone(12,258,188,96,"店内ネットワーク"),zone(12,376,188,94,"相手MTA / 外部"),zone(280,258,188,146,"店のメールサービス")],
    nodes:{N_EXTERNAL:node(106,86,"外部接続元"),N_RECEIVE:node(106,189,"外部受信試験元"),N_MX:node(374,138,"公開MX / DNAT",["198.51.100.67","rental.example.test"]),N_MTA:node(374,313,"店MTA",["10.67.20.10","TCP/25 · TCP/587"]),N_INTERNAL:node(106,313,"正規内部通知"),N_REMOTE:node(106,424,"相手MX")},
    edges:{L_EXTERNAL_MX:edge([[182,86],[245,86],[245,121],[298,121]],"SMTP/25",[236,75]),L_RECEIVE_MX:edge([[182,189],[245,189],[245,156],[298,156]],"店宛て受信 / 25",[235,205]),L_NAT_MTA:edge([[374,170],[374,281]],"宛先NAT / 送信元保持",[359,238]),L_INTERNAL_MTA:edge([[182,313],[298,313]],"登録内部 / 認証587",[240,301]),L_MTA_REMOTE:edge([[374,345],[374,424],[182,424]],"SMTP配送・応答",[294,413])},
  },
  case04: { width:480,height:430,
    zones:[zone(12,28,188,95,"編集拠点 / 10.63.1.x"),zone(12,152,456,95,"承認VPN区間"),zone(12,274,456,139,"中央ネットワーク / FW・サーバ側")],
    nodes:{N_CLIENT:node(106,80,"編集端末"),N_VPN_SITE:node(106,204,"拠点VPN終端",["アドレスは資料未記載"]),N_G:node(374,204,"中央VPN入口 G",["10.63.10.1"]),N_FW:node(374,309,"FW",["VPN 10.63.10.254","SERVER 10.63.20.1"]),N_SERVER:node(106,366,"素材サーバ",["10.63.20.18","TCP/443"])},
    edges:{L_CLIENT_SITE:edge([[106,112],[106,172]],"拠点LAN",[149,142]),L_VPN:edge([[182,204],[298,204]],"承認VPN",[240,193],"tunnel"),L_G_FW:edge([[374,236],[374,277]],"VPN側IF",[417,260]),L_FW_SERVER:edge([[374,341],[374,366],[182,366]],"サーバ側IF / TCP443",[283,394])},
    notes:[label(240,420,"TCPデータ: サーバ→FW→G→端末 / MTU通知: G→FW→サーバ")],
  },
  case05: { width:480,height:515,
    zones:[zone(12,26,188,105,"同じ試験端末 / 登録主体"),zone(280,26,188,105,"独立した認証基盤"),zone(12,147,456,94,"同じ試験端末の2つのIF"),zone(12,263,188,96,"VPN経路"),zone(280,263,188,96,"許可試験LAN"),zone(12,385,456,114,"同じ資料ポータル・API")],
    nodes:{N_CLIENT:node(106,88,"試験端末 U17",["A団体","S17登録主体 U17/A"]),N_IDP:node(374,88,"IdP",["10.68.10.10"]),N_VPN_IF:node(106,190,"VPN側 IF",["割当範囲 10.68.50.0/24","実割当・状態はE03"]),N_TEST_IF:node(374,190,"非VPN側 IF",["10.68.60.23"]),N_VPN:node(106,317,"VPN接続・割当",["VPN認証とAPI認証は別"]),N_L3:node(374,317,"L3ルータ",["試験LAN 10.68.60.0/24"]),N_PORTAL:node(240,452,"資料ポータル / API",["10.68.20.18","TCP/443"])},
    edges:{L_CLIENT_VPN_IF:{...edge([[106,120],[106,158]],"IF所属",[148,142],"relation"),arrows:"none"},L_CLIENT_TEST_IF:{...edge([[158,120],[158,141],[374,141],[374,158]],undefined,undefined,"relation"),arrows:"none"},L_CLIENT_IDP:{...edge([[182,88],[298,88]],"認証記録の関係",[240,76],"relation"),arrows:"none"},L_VPN_IF:edge([[106,222],[106,285]],"VPN接続",[62,256],"tunnel"),L_TEST_L3:edge([[374,222],[374,285]],"IF選択 / LAN",[411,256]),L_VPN_PORTAL:edge([[106,349],[106,374],[204,374],[204,420]],"TCP/443",[145,409]),L_L3_PORTAL:edge([[374,349],[374,374],[276,374],[276,420]],"TCP/443",[335,409])},
    notes:[label(240,510,"両経路ともNAT・プロキシなし / 破線は所属・記録の関係")],
  },
  case06: { width:480,height:400,
    zones:[zone(12,28,188,110,"編集環境"),zone(280,28,188,110,"共有ファイル領域"),zone(12,230,188,135,"別保管 / 常設ネットワーク外"),zone(280,230,188,135,"復元試験環境")],
    nodes:{N_ED1:node(106,91,"編集端末 ED1",["10.69.1.23","主体U21 / 所属はE09"]),N_NAS:node(374,91,"共有NAS",["10.69.20.18","/live · /versions"]),N_V07:node(106,301,"別保管 V07",["保管世代 / 接続記録はE08"]),N_RC1:node(374,301,"復元端末 RC1",["10.69.30.21"])},
    edges:{L_ED1_NAS:edge([[182,91],[298,91]],"SMB / TCP445",[240,80]),L_RC1_NAS:edge([[374,269],[374,123]],"試験用コピー・対照再生",[327,199]),L_V07_RC1:{...edge([[182,301],[298,301]],"試験復元の関係",[240,289],"relation"),arrows:"end"}},
    notes:[label(240,390,"実線: 通信 / 破線: 復元資料の関係（恒常的な通信ではない）")],
  },
};
export function getLayout(scenario: PlayableScenario): MapLayout {
  if (layouts[scenario.id]) return layouts[scenario.id];
  return { width:480,height:Math.ceil(scenario.topology.nodes.length/2)*110+40,nodes:Object.fromEntries(scenario.topology.nodes.map((n,i)=>[n.id,node(i%2 ? 374:106,80+Math.floor(i/2)*110)])),edges:{},zones:[] };
}
