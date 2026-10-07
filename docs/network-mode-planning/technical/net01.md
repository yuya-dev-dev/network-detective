# NET01 技術引継ぎ：隣の棟は遠い

作者向け。mode/type=network、難易度やや易、想定20–30分。舞台は町の資料館のデジタル閲覧室。依頼役・司書の朝倉は予約資料を待つ来館者に閲覧の見通しを出したい。運用役・牧は貸出端末の設定を個別に変えず管理したい。主人公は一人称の調査員。

## プレイヤー公開の正常要件・前提

閲覧LANは10.60.8.0/24（VLAN108）、保管サーバLANは10.60.9.0/24（VLAN109）。閲覧端末はDHCPで10.60.8.100–150、マスク255.255.255.0、GW10.60.8.1、DNS10.70.0.53を得る。資料サーバcatalog.museum.example=10.60.9.20のHTTPS/TCP443と案内10.70.0.20/TCP443を使う。図の/24は設計値であって端末実測値ではない。

単一有線NIC、IPv4だけ。端末は宛先が自身の接続ネットワーク内なら宛先へARP、外ならGWへARPして送る。静的ルートなし。L3はVLAN108/109を別のブロードキャスト領域としproxy ARPは無効。DHCPサーバはrelayのgiaddrにより対象scopeを選ぶ（本製品ではoption82等の選択なし）。scopeのmaskは独立設定で管理ミスを受け付ける。範囲を/23にしたい業務要件はない。

## 構成図仕様

|nodeId|ラベル・アドレス|ポート/役割|
|---|---|---|
|reader|閲覧PC-R / 10.60.8.121|NIC→access Gi1/0/1|
|fixed|固定確認PC-F / 10.60.8.10/24|Gi1/0/2|
|sw|閲覧L2-SW|uplink Gi1/0/24 tagged108|
|l3|館内L3 / .8.1・.9.1・10.70.0.1|Gi1 trunk108、Gi2 VLAN109、Gi3 services|
|catalog|資料 / 10.60.9.20/24 GW .9.1|TCP443|
|guide|案内 / 10.70.0.20/24 GW .0.1|TCP443|
|dns|DNS / 10.70.0.53|UDP/TCP53|
|dhcp|DHCP / 10.70.0.67|UDP67、relay|

reader/fixed→sw→l3。l3→catalog、l3→services（guide/dns/dhcp）。閲覧LANと保管LANを別枠。DHCPは端末UDP68↔relay↔serverUDP67、giaddr10.60.8.1。観測点P1=readerNIC、P2=L3閲覧SVI、P3=DHCP応答。概要は端末・SW・L3を縦軸、下に資料とサービス2列。詳細に各/24とポート、P1–3を掲載。短い概要ラベルにはDHCPの実際のmaskを載せない。図の全線と文字説明は同じ経路。

## 固定証拠（全て取得/整理2026-10-07 10:30 JST）

以下kindは既存Scenarioの表現へ実装時対応させる意味分類である。本文の時刻は全てJST、未指定日付は2026-10-07。全診断は設定変更前。

### E01 配布仕様
kind=document; acquisition=document; source=承認済み閲覧室IP設計; nodeIds=reader,l3,dhcp,catalog; observedAt=2026-10-06T17:00:00+09:00。

2026-10-06 17:00版。VLAN108=10.60.8.0/24、scope READER: pool10.60.8.100–150, mask255.255.255.0, router10.60.8.1, DNS10.70.0.53。VLAN109=10.60.9.0/24、資料10.60.9.20。既存設計の変更承認なし。案内と資料は両方利用対象。

### E02 PC-Rの設定
kind=configuration; acquisition=diagnostic; source=PC-R設定とIPv4経路の採取; nodeIds=reader; observedAt=2026-10-07T10:05:00+09:00。

10:05 IPv4=10.60.8.121、mask=255.255.254.0(/23)、GW=10.60.8.1、DNS=10.70.0.53、DHCP=enabled、server=10.70.0.67。接続経路10.60.8.0/23 on-link、default via10.60.8.1。ルート全件はこの2本、NIC1本、lease取得09:55:00。

### E03 PC-Rの実通信
kind=packet-capture; acquisition=diagnostic; source=P1端末NIC採取; nodeIds=reader,sw,l3,catalog; observedAt=2026-10-07T10:07:10+09:00。

10:07:00–10:07:10、PC-Rから資料へ接続1回、フィルタなし・欠落0。10:07:00/01/03 ARP who-has10.60.9.20 tell10.60.8.121。応答0、TCP SYN送出0。10:07:05案内へはARP who-has10.60.8.1→L3応答、そのMAC宛てTCP10.70.0.20:443、HTTPS200。資料宛てはGWへ送っていない。

### E04 DHCPの有効scope
kind=configuration; acquisition=document; source=DHCP実行設定export; nodeIds=dhcp,l3; observedAt=2026-10-07T10:08:00+09:00。

10:08有効設定：READER selected_by giaddr10.60.8.1、pool10.60.8.100–150、option1=255.255.254.0、option3=10.60.8.1、option6=10.70.0.53。未使用空き27、競合検出0。ほかscope SERVICE=10.70.0.0/24 option1=255.255.255.0。option82/端末別上書きなし。

### E05 名前解決
kind=dns-result; acquisition=diagnostic; source=PC-RからDNS問い合わせ記録; nodeIds=reader,dns,catalog; observedAt=2026-10-07T10:06:00+09:00。

10:06 PC-R→10.70.0.53 UDP53、catalog.museum.example A応答NOERROR10.60.9.20 TTL300。guide.museum.example A応答10.70.0.20。承認台帳と一致、AAAAなし。問い合わせ応答の全件2件。pingによる代用ではない。

### E06 配布のワイヤ記録
kind=packet-capture; acquisition=diagnostic; source=P3 relay/DHCP採取; nodeIds=reader,l3,dhcp; observedAt=2026-10-07T09:55:00+09:00。

09:54:58–09:55:00 xid0x0101、client PC-R: DISCOVER relay giaddr10.60.8.1→server10.70.0.67。OFFER/REQUEST/ACK同一xid、ACK yiaddr10.60.8.121, option1=255.255.254.0, option3=10.60.8.1, option6=10.70.0.53, lease8h。配布サーバID10.70.0.67。この交換の欠落0、重複応答なし。

### E07 固定端末とサーバ側の比較
kind=connectivity; acquisition=diagnostic; source=PC-F業務通信/資料サービス診断; nodeIds=fixed,l3,catalog; observedAt=2026-10-07T10:09:10+09:00。

10:09 PC-F10.60.8.10/24から資料へGW .8.1経由TCP443、HTTPS200、資料ID A-18閲覧成功。資料はlisten443、GW .9.1、CPU18%、HTTPS自己診断200。保存データ件数は正常。PC-Fは障害後も変更していない固定設定、PC-Rを直した試験ではない。

### E08 L3とリンクの状態
kind=configuration; acquisition=diagnostic; source=L3状態/許可設定; nodeIds=sw,l3; observedAt=2026-10-07T10:10:00+09:00。

10:10 SVI108=10.60.8.1/24 up、SVI109=10.60.9.1/24 up、10.70.0.1/24 up。直結3経路、108→109 TCP443許可、逆は応答許可。proxy ARP全SVI off。09:50–10:10 uplink link flap0、CRC0。P2はE03の資料宛てIPを受信していない。この範囲のIPフィルタ記録欠落0、資料deny0。

### E09 運用変更票
kind=change-record; acquisition=document; source=DHCPscope変更履歴; nodeIds=dhcp; observedAt=2026-10-07T09:40:00+09:00。

09:40台帳取り込みでREADER option1が255.255.255.0→255.255.254.0。他フィールド変更なし。作業者本人の手動端末調整はなし。

### E10 閲覧席の案内
kind=document; acquisition=document; source=公開案内板版記録; nodeIds=guide; observedAt=2026-10-07T09:00:00+09:00。

09:00開館案内のタイトルを「秋の特集」へ変更、本文更新完了。ネットワーク/資料サーバ/DHCPの設定は変更対象外。

## 真相・因果（作者専用）

1. 配布仕様/24が維持されるべき（E01）。2. DHCPscopeのoption1だけ/23に変わる（E04/E09）。3. PC-Rが/23をACKで受け取る（E06）、現行端末も/23（E02）。4. 10.60.9.20を同一/23のon-linkと判断。5. 別VLANの資料へARPしてもL2越えできずproxy ARPもoff（E03/E08）。6. DNSやサービスは生存（E05/E07）だがPC-Rから資料のTCPが始まらない。修復後成功は未観測。

## 報告候補とfeedback

範囲 S1「DHCPを新規取得した閲覧端末の資料閲覧」正解：E02/E03/E06、対象を全館や資料停止へ広げない。S2「資料サーバの全利用者」誤：E07固定対照正常。S3「館内の全IP通信」誤：E03案内正常。S4「名前解決だけ」誤：E05正常でE03通信段階はARP。

原因 H1「READERの配布マスクが/23になった」正解：E01/E02/E04/E06。H2「DNSの資料Aレコードが誤った」誤：E05正しい。H3「資料HTTPSサービスが停止」誤：E07同一サービス正常。H4「DHCPアドレス枯渇で未取得」誤：E04空き/E06ACK。H5「L3が資料TCPを拒否」誤：E08許可、E03SYN未送出。仮説パネルのIDもH1–5。

|ID|主張（公開文）|必要数|満点集合|allowedSupporting|feedback|
|---|---|---:|---|---|---|
|C1|閲覧端末の現行マスクは承認された/24と異なる/23である|1|E02|E01,E06|正常要件/24は既知。E02の現行値だけで10点。E01の要件やE06の配布時点だけでは現行の確定に不足して5点|
|C2|資料名は正しく解決されたが、PC-Rは資料宛てにARPしTCPを始めていない|2|E03+E05|なし|名前解決と実送出の観測を結ぶ。単独の片側は5点|
|C3|PC-Rへ配布された/23は、READERの有効option1と一致する|2|E04+E06|E09|有効scopeと当該ACKを結ぶ。変更履歴だけは補助5点|
|W1|資料名のA応答は承認先と異なり、端末は別のサーバへTCPを送出している|2|なし|なし|E05のA応答は承認先に一致し、E03で資料宛てSYNは送出0。二つの観測の結び方が誤りなので0点|
|W2|資料サーバはCPUが飽和し、固定端末からのHTTPS閲覧も失敗している|1|なし|なし|E07のCPU18%と固定端末HTTPS200に反するため0点|
|W3|READERの空きがなくPC-RにACKが配布されず、設定未取得が資料の停止を起こした|2|なし|なし|E04の空きとE06のACKがこの組合せを反証。誤主張0点|

C1の公開前提/24をE01添付で再証明する必要はない。現行E02で満点。E06は取得時の配布で現行の代替ではない。全正主張contradictoryEvidenceIds=[]。

修復 R1「配布/端末/通信記録を保存し、READER option1を/24へ戻し対象端末を再取得」正解：E01/E04/E06。R2「DNSキャッシュだけ削除」誤：E05正しい。R3「資料を再起動」誤：E07正常、配布設定は残る。R4「閲覧/保管VLANを統合」誤・critical：E01境界要件を壊す。

再発防止 P1「scope設定をIP設計と照合し、実DHCP取得でmask/GW/DNSと別VLAN通信を検査」正解：E01/E06/E08。P2「案内ページが開けば完了」誤：E03資料の差を見逃す。P3「全端末を管理外の固定IPへ」誤：自動管理要件を捨てる。P4「全SVIのproxy ARPで差を隠す」誤：E01の正しい配布を保証しない。

確認 V1「再取得後/24・GW・DNSを確認し、資料TCP443のGW経由と閲覧、案内も確認」正解：E02/E03/E05。V2「DHCPACKの存在だけ」誤：E06は誤値でもACK。V3「案内へのpingだけ」誤：資料HTTPSを検証しない。V4「E07の過去の固定端末200で復旧判定」誤：対象の修復後状態ではない。

## ヒント・辞典・採点例

ヒント1：IPを得たことと、その設定で正しい経路を選べることは別。ヒント2：設計値と端末のmaskで、資料の宛先を同一ネットワークと考えるか比べる。ヒント3：/23は10.60.8/24と10.60.9/24を含む。端末が資料へARPした理由を配布元まで追う。

辞典：DHCP=IP/mask/GW等を配布、option1=mask、giaddr=relay側クライアント網識別のアドレス、CIDR=/nはネットワーク部のビット数、ARP=同一L2でIPのMACを探す、GW=別網への次ホップ、proxy ARP=別網宛てARPに代理応答（今回は無効）。

満点S1/H1/C1(E02)/C2(E03,E05)/C3(E04,E06)/R1/P1/V1=100。C1(E02,E10)も100。C1(E01)又はC1(E06)は5で95。C2(E03,E10)は5、C2(E10)だけは0で90。誤主張は必要数にかかわらず0。R4で90でもcriticalにより未解決。

満点集合+非矛盾の余剰は10、部分支持+ノイズは5、ノイズだけ0。根拠上限2、正主張/誤主張各3。誤主張の必要数はその仮説を説明する観測数で、正しいという表示ではない。全正主張の矛盾配列は空。提出前に正誤と採点集合を表示しない。
