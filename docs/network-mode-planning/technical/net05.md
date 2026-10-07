# NET05 技術引継ぎ：拍手に埋もれた声

作者向け。mode/type=network、難易度中〜難、30–40分。地域配信スタジオの遠隔手話通訳・音声連絡のリハーサル。依頼役・配信調整の長谷は画面が映るだけでなく通訳者への連絡を聞き取れる状態を求める。運用役・戸川は日中の素材送信も続けながら、専用端末の通信品質を戻したい。障害対象はスタジオから通訳拠点への片方向RTP音声で、映像/反対向きの品質を未観測のまま断定しない。

## 正常要件・公開前提

認定音声端末M1=10.55.10.21/24（VLAN110）から受信10.95.0.20:5004/UDPへRTP音声を送る。M1音声はL3計測値2Mbit/sでDSCP46を付す。素材送信B1=10.55.20.30/24（VLAN120）→保存10.95.0.30:443/TCPはDSCP0で最大送出30Mbit/s。両業務を同時に行い、音声の受信間隔変動は最大40ms以下、損失率1%未満とする。受信間隔変動は本事件の指標「受信間隔と送信間隔の差の絶対値の最大」、一般的なRFCのjitter定義を名乗らない。

SW-EはL3/境界装置。承認ポリシーは管理されたM1接続Gi1だけDSCPを保持、Gi2素材側はDSCP0へ書換、uplinkで追加書換なし。WAN-RはSW後のIPv4 DSCP46をQ-VOICE、他をQ-BEへ分類。分類規則/キューは有効表の全件、アプリ自動判定や別trustはなし。WAN出力はL3換算20Mbit/sのshaper、Q-VOICE優先最大4Mbit/s（超過はpolicer）、Q-BEは残余。今回は音声2Mbit/sでVOICE上限以内。単位は全て10進、各測定はIP総量で揃え、リンクヘッダ/圧縮差なし。QoSで総帯域は増えず、素材BEは遅延/再送が許容される。Wi-Fi/NAT/tunnel暗号化なし、音声のDSCPはアプリで検証済み設定、秘密はない。全経路MTU1500。M1音声はIP総長250byte（IPv4/UDP/RTPヘッダを含む）を1000ppsで送り、断片化なしでIP総量2Mbit/sとなる。

## SVG構成

|nodeId|機器|IF/IP|
|---|---|---|
|media|認定M1|10.55.10.21/24 GW10.55.10.1、SW-E Gi1 access110|
|bulk|素材B1|10.55.20.30/24 GW10.55.20.1、SW-E Gi2 access120|
|edge|SW-E|SVI110 .10.1、SVI120 .20.1、up172.30.0.1/30 Gi24|
|wan|WAN-R|lan172.30.0.2/30、wan192.0.2.1/30、出力20Mbit/s|
|remote|通訳拠点R|wan192.0.2.2/30、srv10.95.0.1/24|
|recv|音声受信|10.95.0.20/24 GW10.95.0.1 UDP5004|
|store|素材保存|10.95.0.30/24 GW10.95.0.1 TCP443|

概要はM1/B1横2列→SW-E→WAN-R（Q-VOICE/Q-BEは同じ機器の内部枠）→20Mbit/s回線→通訳R→受信/保存2列。media→recvの音声方向とbulk→storeの素材方向を別線種、凡例で説明。詳細にVLAN、Gi1/2/24、両/30、P1=SW Gi1入場前、P2=Gi24送出後/WAN入力、P3=WAN出力キュー、P4=受信。Gi24物理は1Gbit/s、WAN shaperとは区別。設計に「認定端末のマーク保持」と示し、有効書換値/異常キューを図で色分けしない。ASCII文字経路説明も用意する。

## 固定証拠（取得/整理2026-10-07 10:30 JST）

### E01 品質と境界ポリシー
kind=document; acquisition=document; source=配信スタジオ通信受入基準; nodeIds=media,bulk,edge,wan,recv,store; observedAt=2026-10-06T17:00:00+09:00。

2026-10-06 17:00版。M1音声2Mbit/s/DSCP46、Gi1保持、Gi2素材はDSCP0、VOICE優先4Mbit/s、WAN20Mbit/s。素材同時送信中にも音声受信間隔変動max≤40ms/損失<1%。素材はBEで遅れてよい、素材全停止を恒久条件にしない。許可端末以外の任意46マークは信頼しない。映像/逆方向は今回判定外。

### E02 品質の2条件比較
kind=measurement; acquisition=diagnostic; source=M1/受信側固定比較試験; nodeIds=media,bulk,recv,store,wan; observedAt=2026-10-07T10:05:00+09:00。

10:00–10:01素材なし：音声IP送出2Mbit/s、受信間隔変動max8ms、損失0.1%。10:04–10:05素材あり：音声同じ2Mbit/s、素材送出30Mbit/s、音声変動max180ms、損失8%。端末/接続/設定/音声内容は同じ。両1分の全パケット計測、時計同期済み、欠測なし。これはSW変更前の負荷比較、素材ありの合計送出32Mbit/s。素材の回線送出30Mbit/sではなくWAN手前のoffered load。

### E03 境界を通る同じ音声
kind=packet-capture; acquisition=diagnostic; source=P1/P2同時ミラー採取; nodeIds=media,edge,wan; observedAt=2026-10-07T10:04:01+09:00。

10:04:00–10:04:01、flow10.55.10.21:40004→10.95.0.20:5004/UDP、RTP stream M1-7 seq1200–2199の同じ1000packetを照合。この1秒の対象flow全数で、IP総長250byte/1000pps/2Mbit/s、MTU1500で断片化なし。P1 Gi1入場前DSCP46全1000、P2 Gi24送出後DSCP0全1000、ほかIP/port/seq一致。欠落0。P2はWAN-R入力前なのでここにWANキューの遅延を含めない。素材はP1 Gi2/P2ともDSCP0。ECN下位2bitは未使用0で不変。

### E04 SW-Eの有効入力処理
kind=configuration; acquisition=document; source=SW-E running-policy export; nodeIds=edge,media,bulk; observedAt=2026-10-07T10:06:00+09:00。

10:06 Gi1 access110 input reset_dscp=0、Gi2 access120 input reset_dscp=0、Gi24 output rewrite=none。Gi1にkeep-mark例外なし、ACL/分類の別上書きなし。M1-MACはGi1だけ、認定端末台帳一致、物理差し替えなし。resetは受信したDSCPを0へ変える架空製品の処理名。

### E05 WAN-Rの分類・キュー規則
kind=configuration; acquisition=document; source=WAN-R有効分類全件; nodeIds=wan; observedAt=2026-10-07T10:06:00+09:00。

10:06 DSCP46→Q-VOICE（優先4Mbit/s、超過policer）。DSCPその他→Q-BE（残余、有限FIFO、満杯drop）。wan shaper20Mbit/s（IP総量換算）、lan物理1Gbit/s。マーキングの再書換なし、queueの障害/自動分類なし。音声がBEに入れば素材と同一FIFOを競合する。priorityが一律帯域を保証するのではなく今回の承認2Mbit/sは上限以下。

### E06 混雑時キュー統計
kind=counter; acquisition=diagnostic; source=P3 WAN-R分類差分と遅延; nodeIds=wan,media,bulk; observedAt=2026-10-07T10:05:00+09:00。

10:04–10:05 Q-VOICE音声分類0 packet、policer drop0。Q-BEにはM1音声と素材両flow、offered32Mbit/s、平均送出20Mbit/s、backlog持続、queue delay p95=150ms、max=175ms、full-dropあり。音声flowのWAN出力drop8%、素材flowにもdropあり。統計全区間、flow分類を含み欠測0。p95キュー遅延とE02の最大間隔変動は別指標で、同じ数値にしない。

### E07 物理と端末の対照
kind=service-check; acquisition=diagnostic; source=端末負荷/リンク/受信状態; nodeIds=media,edge,wan,remote,recv; observedAt=2026-10-07T10:07:00+09:00。

09:55–10:07全リンクup、CRC/linkflap0。M1有線Gi1、CPU17%、受信CPU22%、両方送受信処理遅延max2ms。SW-E/WAN-R/remote route変化なし、UDP5004許可、10:04–05音声WAN入力から受信までの全損失はE06WAN出力で一致。受信side以外で追加drop記録0。インターネット一般の混雑ではなく管理対象回線の計測。

### E08 マークを指定したキュー対照
kind=measurement; acquisition=diagnostic; source=WAN-R入力の承認診断flow; nodeIds=wan,remote,recv,bulk,store; observedAt=2026-10-07T10:10:00+09:00。

10:09–10:10、音声本番端末を一時停止して診断源をWAN-R lanへ接続し、同じIP総量2Mbit/s/UDP5004/DSCP46を入力。素材は同じ30Mbit/s/0を継続。Q-VOICE診断flow2Mbit/s、policer0、診断受信間隔変動max10ms、損失0.2%、Q-BE素材平均18Mbit/s。SW-E設定は変えていない。この人工対照はキュー方式の比較で、本番M1修復後成功ではない。診断の終了後本番を再開、全証拠は調査開始前に採取済み。

### E09 SW-Eテンプレート更新
kind=change-record; acquisition=document; source=境界ポリシー変更票; nodeIds=edge; observedAt=2026-10-07T09:30:00+09:00。

09:30入力テンプレートを共通reset0へ。Gi1の認定音声keep-mark例外を引き継がなかった。物理/route/WANqueue/端末マーキングは変更なし。業務音声のみ素材なしで受入、素材同時欄は未確認。

### E10 配信ポスター
kind=document; acquisition=document; source=スタジオ広報更新記録; nodeIds=store; observedAt=2026-10-07T09:00:00+09:00。

09:00ポスター画像を差し替え、素材保管のファイル名poster-b.webp。RTPの送信間隔/DSCP/ネットワークポリシーの変更なし。

## 因果6段階

1. 認定M1の46保持と同時業務時の品質が要件（E01）。2. SW-E Gi1もreset0になる（E04/E09）。3. M1は46で送るがSW通過後0（E03）。4. 有効DSCP分類で音声もBEへ（E05/E06）。5. offered32が20を超える混雑時、音声が素材と同じキューで待ち/損失（E02/E06）。6. VOICEは空いたまま品質不成立、正しい46入力対照では同じ素材条件で品質成立（E08）。QoSで全トラフィックの総量を増やす話ではない。

## 報告・全候補feedback

範囲S1「素材同時送信中のスタジオM1→通訳拠点RTP音声」正解：E02/E06。S2「スタジオの全業務停止」誤：素材は送出、E02無負荷音声は正常。S3「通訳拠点からの逆方向音声」誤：今回対象/観測外、断定しない。S4「ポスター表示だけ」誤：E10と測定音声は別。

原因H1「SW-E Gi1が音声46を0へ書換え、混雑時にBEを競合させた」正解：E03/E04/E05/E06。H2「M1が最初から46を付けていない」誤：E03P1は46。H3「VOICEの4Mbit/s上限を音声2Mbit/sが超えた」誤：E01/E02/E06はVOICE分類0/policer0。H4「ケーブルのCRCエラー」誤：E07全区間CRC0。H5「受信CPUの処理能力不足」誤：E07負荷/遅延とE08対照、キュー位置を無視。

|ID|主張（公開文）|必要数|満点集合|allowedSupporting|feedback|
|---|---|---:|---|---|---|
|C1|同じM1音声packetのDSCPはSW-E前46、通過後0に変わる|1|E03|E04|同じpacketの実測比較はE03で10点。設定E04だけは補助5点|
|C2|観測したM1音声のSW後DSCPはBEの分類に該当し、VOICEの対象条件を満たさない|1|E03 又は E06|E04,E05|分類規則は既知。E03の実マーク0又はE06の実分類BE/VOICE0で10点。E06から具体値0自体を断定しない。設定規則だけは補助5点|
|C3|同じ素材30Mbit/s条件で、本番音声は品質を満たさず46入力対照は満たす|2|E02+E08|E06|本番/対照の品質を二つの測定で結ぶ。キュー統計だけは補助5点|
|W1|人工46対照でWANは32Mbit/sを送出し、素材30と音声2を損失なしで同時転送した|1|なし|なし|E08は音声2と素材18で容量20、損失0.2%。誤主張0点|
|W2|混雑時M1はVOICEに分類され、4Mbit/s上限超過のpolicer dropが記録された|1|なし|なし|E06はVOICE音声0/policer0、誤主張0点|
|W3|本番は素材の有無で品質が変わらず、人工46対照も素材同時時に品質基準を超えた|2|なし|なし|E02で本番の品質差、E08で対照の基準内を確認できる。誤主張0点|

C2の分類規則は公知。実マークE03又は実分類E06の単独で満点。E06は具体DSCP値0を単独で証明しないが、この主張はBE該当とVOICE条件外までなので十分。E03の1秒サンプルから全1分へ外挿しない。全正主張contradictoryEvidenceIds=[]。

修復R1「前後採取/有効設定/キューを保全し、認定M1のGi1だけ承認の46保持へ戻しGi2の0とVOICE上限を維持」正解：E01/E03/E04。R2「全ポートの全通信を46へ上書き」誤・critical：E01信頼境界/優先枠を壊す。R3「素材を恒久停止して負荷をなくす」誤：一時緩和にはなるがE01同時業務/マーク要件未修復。R4「受信アプリだけ再起動」誤：E07正常、境界設定残る。

再発防止P1「認定端末ポート例外の差分を監査し、実マークと同時素材送信時品質を受入」正解：E01/E03/E09。P2「素材なし音声だけ」誤：E02/E09で見逃す。P3「DSCP名だけ確認しSW後を見ない」誤：E03境界変化未確認。P4「常に回線増速だけに依存」誤：容量拡張は有効な別策だが認定マーク要件と誤分類を検知しない。

確認V1「本番M1で46保持/VOICE分類と素材同時30時の音声≤40ms・損失<1%、素材BE/認定外Gi2のDSCP0書換も維持確認」正解：E01/E02/E03/E06/E08。V2「SW内の設定文字だけ」誤：実パケットと受信品質未確認。V3「素材を止めた時だけ聞ければ完了」誤：E01同時条件を満たさない。V4「人工46対照の過去値で復旧判定」誤：E08はM1を通していない。

ヒント1：帯域の平均だけでなく、どのクラスのキューに入るかを見る。2：同じ音声packetのマークを境界前後で照合する。3：音声を優先する設定は存在する。分類前にマークが変わっていないか、同じ素材条件の対照と結ぶ。

辞典：DSCP=IPヘッダの6bitクラス識別値、46=EFに用いる推奨コード点（実装は公開規則どおり）、QoS=分類/キュー等で品質を制御、BE=特別な優先なし、shaper=送出レート調整、policer=許容超過を処置、offered load=入口へ提供された量、FIFO=先に入ったものから処理、RTP=音声等のpacket媒体通信、損失率=送出に対し受信しない割合。

満点S1/H1/C1(E03)/C2(E03)/C3(E02,E08)/R1/P1/V1=100。C2(E06)も100。C1(E03,E10)又はC2(E06,E10)も100。C1(E04)又はC2(E05)5で95。C3(E02,E10)5、C3(E10)0で90。R2で90でもcriticalにより未解決。

満点集合+非矛盾の余剰は10、部分支持+ノイズは5、ノイズだけ0。根拠上限2、正主張/誤主張各3。誤主張の必要数はその仮説を説明する観測数で、正しいという表示ではない。全正主張の矛盾配列は空。提出前に正誤と採点集合を表示しない。
