# NET03 技術引継ぎ：届かない開演ベル

作者向け。mode/type=network、難易度中、25–35分。市民演奏会の舞台連絡Web。依頼役・受付の小坂は客席へ開演の変更を伝えたい。運用役・蓮見はHTTPS公開口を守り、内部サービスを直接インターネットへ出さず復旧したい。字幕事件とは別の組織/公演で、障害の登場人物や業務を継続利用しない。

## 正常要件と公開前提

予定ページhttps://cue.music.example/ は通常HTTPS。開演ベルは同一originのwss://cue.music.example/live を使い、接続時にHTTP/1.1 Upgradeを行い101後にイベントを受信する。ブラウザ/入口/バックエンドともこの事件ではHTTP/1.1、HTTP/2/3 WebSocketは使わない。入口リバースプロキシRPでTLSを終端し、内部APP10.80.2.20:8080へ平文HTTP/1.1を中継。外部からAPP直結は禁止、RP以外のFW/WAF/中継なし。

RPは架空製品。普通の中継ではConnection/Upgrade等のhop-by-hopヘッダを削除。/live専用ws_bridge=true時は検証済み切替要求をバックエンド用に再構成して送り、APP101後にトンネルへ切替。false時はConnection: close、UpgradeなしでHTTPを中継する。これは製品の公開仕様で、普通のHTTPならhop-by-hop削除は正しい。APPは/liveで認証済みかつ完全なUpgrade要求なら101、不足時426/Upgrade:websocket、認証失敗401。ヘッダ名は大文字小文字不問。正常要件はws_bridge=trueで機能を維持し、TLS/認証/内部境界を維持する。

## 構成図

|nodeId|ラベル|接続/アドレス|
|---|---|---|
|client|受付PC-W|198.51.100.18、外部NIC|
|dns|公開DNS|203.0.113.53 UDP/TCP53|
|rp|入口RP|public203.0.113.40:443、inside10.80.2.10/24、管理10.80.9.10/24|
|app|連絡APP|10.80.2.20/24 TCP8080、default10.80.2.1|
|router|内部L3|10.80.2.1、10.80.9.1|
|ops|保守PC|10.80.9.30/24→L3、許可された診断用APP8080|

client→rp（外部HTTPS/WSS443、TLS終端枠）→app（HTTP/1.1 TCP8080）。dnsは名前解決の別枝。ops→router→appは管理診断線、公開経路とは別色/凡例。P1=RP外部TLS復号後、P2=RP→APP、P3=管理診断のAPP。概要はclient/rp/appを縦軸、DNS/保守を横枝。詳細にネット境界・ポート・P1–3・TLSの区間を置く。症状で線を赤くしない。図にはws_bridgeの実測値や欠落ヘッダを書かない。

## 固定証拠（取得/整理2026-10-07 10:30 JST）

### E01 サービス契約
kind=document; acquisition=document; source=舞台連絡サービス受入仕様; nodeIds=client,rp,app; observedAt=2026-10-06T17:30:00+09:00。

2026-10-06 17:30版。/は予定確認HTTPS200、/liveはHTTP/1.1 Upgrade→101→openイベント。TLSは入口終端、外部はRP443だけ、内部8080非公開。/liveの認証を維持。/が200でもベルの受入に代えない。ws_bridge仕様は上述どおり公開、正しいws要求をAPPへ再構成する。

### E02 受付PCから入口まで
kind=http-trace; acquisition=diagnostic; source=PC-Wブラウザ診断; nodeIds=client,rp; observedAt=2026-10-07T10:00:02+09:00。

10:00:00 TLS接続203.0.113.40:443、SNIcue.music.example、証明書ホスト一致/期限内/検証PASS。HTTP/1.1 GET /live（trace r-live-1）：Host cue.music.example、Origin: https://cue.music.example、Connection: Upgrade、Upgrade: websocket、Sec-WebSocket-Version:13、Sec-WebSocket-Key:MTIzNDU2Nzg5MGFiY2RlZg==、認証Cookieは表示用token-tag=U17（値を掲載しない）。10:00:02応答HTTP426/Upgrade:websocket、WebSocket接続不成立。採取はこの往復全件、欠落0。

### E03 APP到着の要求
kind=http-trace; acquisition=diagnostic; source=P2 APP受信トレース; nodeIds=rp,app; observedAt=2026-10-07T10:00:02+09:00。

10:00:01 trace r-live-1、peer10.80.2.10→10.80.2.20:8080、GET /live HTTP/1.1、Host cue.music.example、Origin: https://cue.music.example、Connection: close、Upgradeヘッダなし、Sec-WebSocket-Version:13、KeyはE02と同じ、token-tag U17=認証成功。APP判定「Upgrade要求条件不足」、426/Upgrade:websocketを10:00:02返却。ログは要求ヘッダ全項目のうち認証秘密値だけ非表示、対象trace欠落0。

### E04 RP有効プロファイル
kind=configuration; acquisition=document; source=RP running-route export; nodeIds=rp,app; observedAt=2026-10-07T10:03:00+09:00。

10:03 route /live→10.80.2.20:8080、upstream_http=1.1、ws_bridge=false、plain_forward strips hop-by-hop、Connection output=close。route /→同じAPP:8080、plain_forward。TLS/host/認証引継ぎは変更なし。全route2件、/liveは長いパス優先でこの設定に一致、別route/上書きなし。

### E05 対応する中継ログ
kind=access-log; acquisition=diagnostic; source=RP front/back access log; nodeIds=client,rp,app; observedAt=2026-10-07T10:00:02+09:00。

10:00:00–02 trace r-live-1 frontstatus426、upstreamstatus426、upstream10.80.2.20:8080、connect4ms、response9ms、route=/live。RP自身の403/502/504生成なし。ログはヘッダを記録しないため、これだけで切替ヘッダの存在は判断できない。

### E06 内部APPの対照試験
kind=http-trace; acquisition=diagnostic; source=P3 保守PCからAPP診断; nodeIds=ops,router,app; observedAt=2026-10-07T10:05:02+09:00。

10:05:00同じAPP10.80.2.20:8080、同じHost/path/token-tag U17で完全なHTTP/1.1 Upgrade要求を送信。APP認証PASS、10:05:01 HTTP101/Connection:Upgrade/Upgrade:websocket、Sec-WebSocket-AcceptのKeyとの検証PASS。10:05:02 event=open受信。管理PCからの許可された比較診断で、RP設定は変更していない。これは外部受付の修復後成功ではない。

### E07 通常ページ
kind=http-trace; acquisition=diagnostic; source=PC-W予定ページ比較; nodeIds=client,rp,app; observedAt=2026-10-07T10:01:00+09:00。

10:01同じ203.0.113.40:443、同一TLS条件/認証でGET / HTTP/1.1→RP→APP、200。予定version rehearsal-17。通常ページの本文取得は9ms。/liveのプロトコル切替を行っていない。

### E08 DNS・接続・負荷
kind=connectivity; acquisition=diagnostic; source=受付DNS照会/ネットワーク状態; nodeIds=client,dns,rp,app; observedAt=2026-10-07T10:06:00+09:00。

10:06 A cue.music.example=203.0.113.40（承認台帳一致）、AAAAなし。RP→APP8080はTCP接続成功。09:55–10:06 link flap/CRC0、RP CPU14%/接続上限10000中32、APP CPU21%/接続上限5000中14。ネットワーク損失記録0。TLS検証を省いた診断ではない。

### E09 更新履歴
kind=change-record; acquisition=document; source=RPプロファイル更新票; nodeIds=rp; observedAt=2026-10-07T09:40:00+09:00。

09:40 route /liveプロファイルlive_tunnel(ws_bridge=true)→standard_http(false)。目的欄「共通化」。/通常ページ200だけ受入、イベント受信欄未記入。APP更新なし、DNS/証明書更新なし。

### E10 ベルの文言
kind=document; acquisition=document; source=受付画面の案内版; nodeIds=app; observedAt=2026-10-07T09:10:00+09:00。

09:10「間もなく開演」を「まもなく開演」に表記変更。イベントの文字列だけで、接続先・通信方式・routeは変更対象外。

## 因果6段階

1. ベルは通常HTTP200と別にUpgrade101が必要（E01）。2. RP/liveの専用切替設定がfalse（E04/E09）。3. PCはTLS成功後に完全なUpgradeを送る（E02）。4. 通常中継処理によりAPP到着時Upgradeが失われConnectionclose（E03）。5. 認証済みAPPは条件不足で426（E03/E05）、直接正しい要求なら101（E06）。6. 予定ページは見えるが外部ベル接続だけ不成立（E07）。

## 報告候補・feedback

範囲S1「入口RPを経由する/liveのイベント接続」正解：E02/E06/E07。S2「サイト全ページ」誤：E07正常。S3「APPの全WebSocket機能」誤：E06正常。S4「TLS接続だけ」誤：E02TLS成功後のHTTP応答。

原因H1「/liveのws_bridge無効でAPP向け切替ヘッダが失われた」正解：E02/E03/E04。H2「証明書の期限切れ」誤：E02検証PASS。H3「DNSが旧入口を返す」誤：E08一致/E02正しい入口。H4「APPの認証拒否」誤：E03U17認証成功、401でなく426。H5「APPがWebSocketを未実装」誤：E06同一APP101/open。仮説/原因ID共通。

|ID|主張（公開文）|必要数|満点集合|allowedSupporting|feedback|
|---|---|---:|---|---|---|
|C1|受付の/liveはTLS検証に成功した後、HTTP426で切替不成立となる|1|E02|なし|同一試行のTLSとHTTP応答がE02にあり10点|
|C2|受付で送ったUpgrade要求は、対応するAPP受信時に失われConnectionもcloseになる|2|E02+E03|E05|入口前とAPP受信をtraceで対応。E05はヘッダなしの相関補助5点|
|C3|内部対照は101後のイベント受信まで成功し、有効/live routeは普通の中継でヘッダを削る|2|E04+E06|E09|公開仕様だけでなく実測した内部101/openはE06、有効routeはE04。変更票だけは補助5点|
|W1|受付のTLS検証は失敗し、HTTP要求は入口へ到達していない|1|なし|なし|E02のTLS PASSとHTTP426で反証。誤主張0点|
|W2|受付のUpgradeはAPPまで保持され、認証によりAPPが401で拒否している|2|なし|なし|E02/E03で前後を照合するとAPPにはUpgradeなし、認証成功で426。誤主張0点|
|W3|通常ページと内部/live対照は共に200を返し、ベルも通常HTTPだけで成功している|2|なし|なし|E07通常200とE06切替101/openは別方式。誤った組合せなので0点|

C3はAPPの仕様上の能力ではなく、内部対照で実測した101後のイベント受信と、有効中継設定を主張する。全正主張contradictoryEvidenceIds=[]。

修復R1「記録/設定を保存し/liveだけ専用ws_bridgeを有効化、TLS/認証/内部8080境界を維持」正解：E01/E03/E04。R2「証明書検証を無効化」誤・critical：E02正常、防護を壊す。R3「DNSを変えるだけ」誤：E08正常。R4「APP8080を外部公開しRPを迂回」誤・critical：E01内部非公開を壊す。

再発防止P1「routeごとに通常ページとUpgrade101後の認証済みイベント受信を受入」正解：E01/E09。P2「通常ページ200だけ」誤：E07で見逃す。P3「全hop-by-hopヘッダを全routeで無条件転送」誤：中継の正規処理を外す、/liveの条件付き再構成が必要。P4「ベル文言の短縮」誤：E10内容と切替は別。

確認V1「外部受付からTLS/認証付き/live101とイベント受信、通常ページと内部非公開も確認」正解：E01/E02/E06/E07。V2「保守PCから101だけ」誤：E06はRPを通らない。V3「443へのTCP接続だけ」誤：切替/イベント未検証。V4「426が返ればHTTPとして正常扱い」誤：E01の業務条件不成立。

ヒント1：同じサイトでも機能の通信方式を分ける。2：入口とAPPで同じtraceの要求ヘッダ/応答を比べる。3：TLS成功後の426と、内部対照の101の差を/live有効プロファイルまで追う。

辞典：WSS=TLS上のWebSocket、Upgrade=HTTP/1.1のプロトコル切替、101=Switching Protocols、426=切替要求が必要な応答（本APP条件は公開）、hop-by-hop=その接続単位のヘッダ、リバースプロキシ=入口で要求を内部へ中継、TLS終端=暗号区間の終了点、traceID=同一要求の対応用識別。

満点S1/H1/C1(E02)/C2(E02,E03)/C3(E04,E06)/R1/P1/V1=100。C1(E02,E10)も100。C2(E02)又はC2(E05)5で95。C2(E02,E10)5、C2(E10)0で90。R2/R4で90でもcriticalにより未解決。

満点集合+非矛盾の余剰は10、部分支持+ノイズは5、ノイズだけ0。根拠上限2、正主張/誤主張各3。誤主張の必要数はその仮説を説明する観測数で、正しいという表示ではない。全正主張の矛盾配列は空。提出前に正誤と採点集合を表示しない。
