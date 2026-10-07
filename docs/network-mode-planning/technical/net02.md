# NET02 技術引継ぎ：点灯したままの通路

作者向け。mode/type=network、難易度易〜中、20–30分。劇場の舞台袖で字幕表示リハーサル。依頼役・舞台監督の瀬尾は出演者と観客のため時刻どおり字幕を出したい。運用役・岡は音響制御の通信を守りながら新しい字幕系統を開通させたい。

## 正常要件・公開前提

字幕VLAN42=10.42.0.0/24、表示D1=.21・D2=.22、GW=.1。字幕配信server10.50.0.20/TCP443、管理端末10.30.0.10/24（VLAN30）。D1/D2は承認済み固定IP。新設edgeSWのaccess1/2はVLAN42、access3の管理はVLAN30。edge Gi24↔core Gi5は802.1Q trunk、承認allowed=30,42、native=999で一致。字幕と管理を分離し、他VLANを通さない。L3はcoreのSVI42 .1とSVI30 .1、Gi6でserverLAN .50.1へ接続。DNSを介さない固定IPによる調査対象HTTPS。別経路/無線なし、port-channelなし、STPは許可/存在VLANでforwarding、loopなし。

架空SWはtrunk ingressでallowed外タグを破棄し、vlan-not-allowedカウンタに計上。SPAN P2はこの入場判定後のCPU側、P1はedge uplinkの送出側。タグの着いたユーザ通信は物理link upでも通らない場合がある。OSコマンドは架空の読み出し表で実行しない。coreのSVI42はautostate無効で、VLAN42の有効L2ポートがなくても論理IFをupに保つ製品仕様。SVIからの自己診断はcore自身が送信元10.42.0.1として行い、字幕端末の経路を通らない。

## SVG図仕様

|nodeId|ラベル|アドレス/ポート|
|---|---|---|
|display1|字幕D1|10.42.0.21/24 GW10.42.0.1→edge Gi1|
|display2|字幕D2|10.42.0.22/24 GW10.42.0.1→edge Gi2|
|mgr|袖管理|10.30.0.10/24 GW10.30.0.1→edge Gi3|
|edge|袖SW|Gi1/2 access42、Gi3 access30、Gi24 trunk|
|core|主幹L3|Gi5 trunk、SVI42 .42.1、SVI30 .30.1、Gi6 .50.1/24|
|server|字幕配信|10.50.0.20/24 GW10.50.0.1 TCP443|
|desk|本館確認PC|10.30.0.12/24→core Gi7 access30|

上段D1/D2/管理→中段edge→縦trunk（P1 edge送出、P2 core入場後）→core→字幕配信。deskはcore横枝。VLAN42/30の枠はedge/core間を連続した論理境界として別色・凡例に示す。詳細はtrunk両端ポート/native/設計allowed、全サブネット/観測点を載せ、実際のallowed設定は証拠で読ませる。実線=物理、点線矢印=論理VLAN経路、障害色なし。文字説明にも接続先を書き、同一L2とL3越えを分ける。

## 固定証拠（取得/整理2026-10-07 10:30 JST）

### E01 承認配線/VLAN表
kind=document; acquisition=document; source=舞台袖増設設計; nodeIds=edge,core,display1,display2,mgr; observedAt=2026-10-06T18:00:00+09:00。

2026-10-06 18:00版：Gi1/2 access42、Gi3 access30。edge Gi24/core Gi5 trunk tagged30,42のみ、native999。字幕42と音響管理30を混ぜない。D1 .21/24、D2 .22/24、GW10.42.0.1。DHCPは不使用。字幕server10.50.0.20:443への通信と管理30の継続が受入条件。

### E02 端末とaccessポート実測
kind=configuration; acquisition=diagnostic; source=D1/D2とedge状態採取; nodeIds=display1,display2,edge; observedAt=2026-10-07T10:00:00+09:00。

10:00 D1=10.42.0.21/24 GW10.42.0.1、D2=.22/24 GW同じ。NIC/link up、固定設定。edge Gi1/2 operational access VLAN42 up、VLAN42 active、MAC D1=02:42:00:00:00:21 learnedGi1、D2=02:42:00:00:00:22 learnedGi2。全端末別名/二重接続なし。

### E03 境界前のARP
kind=packet-capture; acquisition=diagnostic; source=P1 edge uplink送出採取; nodeIds=display1,edge,core; observedAt=2026-10-07T10:02:10+09:00。

10:02:00–10:02:10 D1から10.50.0.20:443を1回試験。10:02:00/01/03 edge Gi24送出: taggedVID42、srcMAC02:42:00:00:00:21、broadcast ARP who-has10.42.0.1 tell10.42.0.21。coreからのARP reply受信0、D1 TCP SYN0。取得範囲この試験全件、欠落0。

### E04 trunk両端の有効設定
kind=configuration; acquisition=document; source=edge/core running-config採取; nodeIds=edge,core; observedAt=2026-10-07T10:03:00+09:00。

10:03 edge Gi24 mode=trunk allowed=30,42 native999、core Gi5 mode=trunk allowed=30 native999。両方VLAN30,42,999を作成済み。core SVI42=10.42.0.1/24 up（autostate disabled）、SVI30=10.30.0.1/24 up、server直結10.50.0.0/24。STP30/42で対象の許可ポートはforwarding、pruningなし。allowedは追加式ではなく有効集合そのもの。

### E05 字幕LAN内の対照
kind=connectivity; acquisition=diagnostic; source=D1→D2のL2疎通; nodeIds=display1,display2,edge; observedAt=2026-10-07T10:04:00+09:00。

10:04 D1 ARP who-has10.42.0.22、D2が02:42:00:00:00:22で応答、ICMP echo4/4成功、最大1ms。D1→D2はedge内VLAN42で完結しtrunkを通らない。IP重複応答なし、MAC学習安定。

### E06 境界後の受入記録
kind=counter; acquisition=diagnostic; source=P2とcore Gi5 VLANカウンタ; nodeIds=edge,core,display1; observedAt=2026-10-07T10:02:10+09:00。

E03と同じ10:02:00–10:02:10、core Gi5物理受信VID42 ARP3、vlan-not-allowed42増分3、accepted42増分0。P2のARP who-has10.42.0.1受信0。VID30はaccepted増分18、drop0。カウンタ/採取とも全区間、欠落0、表示は今回試験の差分。

### E07 ケーブルと管理通信
kind=connectivity; acquisition=diagnostic; source=uplink物理と管理HTTPSの診断; nodeIds=edge,core,mgr,server; observedAt=2026-10-07T10:05:00+09:00。

09:50–10:05 edgeGi24/coreGi5 up 1Gbps full、CRC0、link flap0。10:05管理PC10.30.0.10→同じtrunk VID30→10.50.0.20:443、HTTPS200。物理リンクの緑点灯は09:50以後継続。

### E08 サービスとL3許可
kind=configuration; acquisition=diagnostic; source=配信server/core経路・ACL照合; nodeIds=desk,server,core; observedAt=2026-10-07T10:06:00+09:00。

10:06 serverlisten443、字幕ファイル rehearsal.vtt存在、CPU12%、desk→serverHTTPS200。同時点のcore VLAN42→10.50.0.20 TCP443許可、返答許可。全L3拒否カウンタ0、E03の試行はIP段階に達していない。serverGW=10.50.0.1、core自身のSVI42アドレス10.42.0.1を送信元とするserverへのHTTPS200（字幕端末由来の要求ではない）。

### E09 増設作業の記録
kind=change-record; acquisition=document; source=trunk変更票; nodeIds=edge,core; observedAt=2026-10-07T09:45:00+09:00。

09:45 edgeGi24 allowed30,42を登録、coreGi5 allowed30を保存。「管理PCで接続確認」欄だけ完了。VLAN42の同一L2対照とGW経由の受入欄は未記入。更新はこの2ポートだけ、配線追加やループ接続はない。

### E10 字幕原稿の版
kind=document; acquisition=document; source=上演台本版管理; nodeIds=server; observedAt=2026-10-07T09:30:00+09:00。

09:30字幕原稿の改行位置を修正。ファイルはHTTPS取得でき、配信URL/ポート/ネットワーク設定は変更していない。

## 因果6段階（作者専用）

1. タグ42がtrunk両端で必要（E01）。2. coreGi5の有効allowedが30だけ（E04/E09）。3. D1/access42は正しくedge内のD2と通信（E02/E05）。4. GWを探すtag42 ARPがedgeから送出（E03）。5. coreがallowed外として落としSVI42へ届けない（E06）。6. 物理linkとVID30は正常だがD1/D2から別網へTCPを開始できない（E07/E08）。

## 報告と全候補feedback

範囲S1「袖SW配下VLAN42の別セグメント通信」正解：E03/E05/E07。S2「袖SW配下の全通信」誤：E05/E07正常。S3「配信serverの全利用者」誤：E08正常。S4「管理VLAN30だけ」誤：E07正常。

原因H1「coreGi5 trunkのallowedから42が欠落」正解：E01/E04/E06。H2「D1のGWアドレスが誤り」誤：E01/E02一致。H3「D1/D2が異なるaccessVLAN」誤：E02同じ/E05直通信。H4「uplinkケーブル断」誤：E07正常と30通信。H5「serverHTTPS停止」誤：E08正常。仮説と原因のID共通。

|ID|主張（公開文）|必要数|満点集合|allowedSupporting|feedback|
|---|---|---:|---|---|---|
|C1|D1/D2のMACは稼働access42のGi1/Gi2に学習され、両端末の実通信も成功した|2|E02+E05|なし|現行ポートへの両MAC学習はE02、実通信はE05。正常設計だけを現行学習の証拠にしない|
|C2|D1のGW探索ARPはtag42でuplinkへ送出され、coreの入場判定で落ちた|2|E03+E06|なし|境界前の送出と入場判定の破棄を同時刻で結ぶ|
|C3|trunkの承認allowed集合とcoreGi5の有効集合は42について一致しない|1|E04|E01,E09|正常要件30,42は既知、E04の現在30だけで10点。設計/変更票だけは現行確認がなく補助5点|
|W1|D1/D2はVLAN30の設定を使い、字幕VLAN42とは別網として互いに通信している|2|なし|なし|E02の稼働access42とE05の同じVLAN内通信で反証。誤主張0点|
|W2|trunk両端のnativeが異なり、D1の字幕ARPはVLAN999へ受け入れられている|2|なし|なし|E04のnative999一致とE06のVID42入場拒否に反するため0点|
|W3|字幕ARPはタグなしでuplinkに送出され、VID42の送出は記録されていない|1|なし|なし|E03はtaggedVID42のARPを記録。誤主張0点|

C1は設計上のaccess所属ではなく実測したMAC学習と実通信を主張する。C3の承認30,42は公知、現行E04だけで満点。全正主張contradictoryEvidenceIds=[]。

修復R1「設定/カウンタ/採取を保全し、coreGi5に42を追加して30,42を維持」正解：E01/E04/E06。R2「D1のGWをserverIPへ」誤：別網serverはlocal次ホップでない。R3「uplink交換だけ」誤：E07正常、設定残る。R4「trunk全VLAN許可し字幕/管理境界を撤去」誤・critical：E01の分離を壊す。

再発防止P1「trunk両端/全必要VLANを照合し、各VLANでGW経由業務通信を受入」正解：E01/E04/E09。P2「link upだけ記録」誤：E07だけでは42未確認。P3「管理30だけでテスト」誤：E09と同じ見落とし。P4「字幕の文字校正を強化」誤：必要だがL2設定を検知しない。

確認V1「D1/D2からGWのARPと配信サーバTCP443/字幕表示、同じtrunkの管理30も確認」正解：E03/E06/E07。V2「D1→D2のpingだけ」誤：E05はtrunkを通らない。V3「server自己診断だけ」誤：E08は対象経路を通らない。V4「ランプ緑だけ」誤：E07で既に緑。

ヒント1：同じSW内の成功と、上流への成功を分ける。2：物理のupとtrunkで通す番号を別に読む。3：tag42のARPを送出側と受入側で照合し、有効allowedを承認値と比べる。

辞典：VLAN=L2の論理分離、access=端末を一VLANに所属、trunk=複数VLANをtagで運ぶ、802.1Q=VLAN識別タグ、native=untaggedの扱い（42には使わない）、SVI=VLANのL3インタフェース、STP=L2ループ防止、SPAN=指定地点の通信コピー、CRC=フレーム誤りの検査。

満点S1/H1/C1(E02,E05)/C2(E03,E06)/C3(E04)/R1/P1/V1=100。C3(E04,E10)も100。C3(E01)又はC3(E09)は5で95。C2(E03,E10)5、C2(E10)0で90。R4で90でもcriticalにより未解決。

満点集合+非矛盾の余剰は10、部分支持+ノイズは5、ノイズだけ0。根拠上限2、正主張/誤主張各3。誤主張の必要数はその仮説を説明する観測数で、正しいという表示ではない。全正主張の矛盾配列は空。提出前に正誤と採点集合を表示しない。
