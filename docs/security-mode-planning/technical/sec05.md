# SEC05 技術引継ぎ：失敗は並んでいるのに、警報が鳴らない

作者用・真相あり。主担当確定版。security / 難度3 / 22分 / 12証拠・ノイズ2。野鳥観測の共同記録窓口。被害断定ではなく、認証失敗を原記録で再構成し、検知要件と集計単位の不一致を調べる。パスワード変更でAPIトークンを止める旧候補や、バックアップ復元と重複しない。

## 正常要件・前提

利用者は公開ログイン窓口から自分の下書きを編集する。正常な共同観測会から同じNAT出口で多数ログインする業務を維持。認証失敗は保存し、5分間に同一送信元から8以上の異なる利用者IDへpassword失敗があれば、認証ノードを横断して担当者へ通知する。ログイン成功や既認証操作をこの失敗数に含めない。担当は断定せず調査を始めるためのアラート要件。
AUTH-A/Bは負荷分散、同じ利用者登録とポリシー。password成功時も機密下書きはMFA必須、今回不審群はすべてpassword失敗でsession/token発行0。MFAは推奨防御であるが、失敗群の検知集計を置き換えるものではない。IDごと5回失敗ロックは正しく稼働、跨ID分散の通知は別要件。パスワードの平文/ハッシュ/同一値照合タグをログに記録しない。従って同じパスワードを試したと断定不可、辞典のpassword sprayは類似パターンの説明に留める。
14:00–14:10完全snapshot、サーバ時刻JST同期。source IPは入口のTLS実接続から記録し、クライアント自己申告X-Forwarded-Forは採用しない。各試行はrequest_id一つ。入口/認証/収集の複数行は同じ試行の複製。集計は認証結果（event_type=password_result）をrequest_idで重複排除する。sourceは個人の身元ではない。IPの所有者や悪意を断定せず『未承認の多数ID認証試行として調査対象』。

資料の観測時刻は、その状態・範囲を観測した時刻。全件資料は収録終端、複数イベント資料は最後のイベント以後とし、個別イベント時刻は本文に残す。取得は資料を調査へ揃えた時刻。

## 図

N_FIELD 観測会端末群10.75.10.0/24、N_NAT198.51.100.75（正常NAT）、N_EXT203.0.113.75（調査対象source）、N_EDGElogin.bird.example.test192.0.2.75（TLS終端/LB）、N_A10.75.20.15、N_B10.75.20.16、N_APP10.75.30.15、N_COL10.75.40.15、N_SIEM10.75.50.15、N_DESK10.75.60.25。L01 FIELD-NAT、L02 NAT-EDGE HTTPS443、L03 EXT-EDGE HTTPS443、L04 EDGE-A HTTPS8443、L05 EDGE-B同、L06 A-APP HTTPS443認証済業務関係、L07 B-APP同、L08 EDGE-COL HTTPS443、L09 A-COL同、L10 B-COL同、L11 COL-SIEM同、L12 SIEM-DESK通知HTTPS443。利用者群/公開入口/認証プール/業務/監視の境界。データ線と監視線を分け、失敗でAPPへ業務要求が入ったと誤解させない。LBとNATを分離、拡大図はID/送信元変換/観測位置を示す。

## 全証拠

E01 report/document/N_DESK/14:09/編集者報告：原記録に普段と違う多数IDへのログイン失敗があるが通知一覧0件。観測会の投稿は正常。公開前データが読まれたかは調べてから報告したい。
E02 config/document/N_SIEM/14:00/通知正常要件：password失敗、同一source、5分内、distinct user_id >=8、認証ノード横断で警報。原ログ保存/成功除外/重複排除を維持。IDロックは同一IDのpassword失敗>=5、5分、15分lock、別の保護。
E03 log/document/N_A,N_B/14:10/認証結果全件（調査群）：request Q01..Q10; 時刻14:01:00/01:20/01:40/02:00/02:20/02:40/03:00/03:20/03:40/04:00; user=b01..b10各1つ; source=203.0.113.75全件; odd Q→AUTH-A、even Q→AUTH-B; event=password_result; result=fail; session_issued=false全件。各行を時刻/ID/ノード/結果表で展開、十件なので省略記号を使わない。パスワード値の記録なし。
E04 log/document/N_EDGE/14:10/入口要求全件：Q01..Q10がそれぞれ1件、transport_source=203.0.113.75、target=A/B対応。10件とE03が一致。正常観測会 source=198.51.100.75 は別群QF01..QF13、XFF不採用。これだけでは認証成否を数えない。
E05 config/document/N_SIEM/14:00/稼働rule R_ACCOUNT：filter event=password_result and result=fail; dedup=request_id; group=[source,user_id,auth_node]; window=5m; count>=5→notify。distinct_user通知ruleなし。ruleは正常要件E02とは別の現在値、アラート抑制時間なし。
E06 log/document/N_COL/14:05/取込品質検査：Q01..Q10についてEDGEのrequestレコード10行、AUTHのpassword_result10行、取込receipt10行の計30行。全認証イベント取込済み、delay_max=2s、dropped=0、time_parse=JST。raw row count=30は試行回数ではない。request_idとevent_typeを保持。
E07 test/diagnostic/N_SIEM/14:10/固定再集計表：同snapshotをE02定義でfilter/dedupした source203.0.113.75 window14:00–14:05 resultfail unique_requests=10 distinct_users=10 auth_nodes=2。R_ACCOUNT各bucket(source,user,node) count=1、通知0。別のsourceの結果はE09。正常要件を修正した後の本番稼働ログではなく保全データの固定診断。
E08 log/document/N_A,N_B,N_APP/14:10/成立範囲全件：Q01..Q10 password fail、MFA challengeなし、session/token発行0。これらrequest/主体による下書きread/export0。登録b01..b10へ配布する権限はない。14:00–14:10観測範囲の侵入成功は確認されない。以前/他経路の侵害を一括で否定しない。
E09 log/document/N_NAT,N_A,N_B/14:05/正常観測会対照：source198.51.100.75、10人f01..f10のpassword成功10件とMFA成功10件、f02/f04/f07各1回password失敗（計3）、その後本人成功、全13password試行QF01..QF13。AUTH-A/B両方。password試行に対応するEDGE/AUTH password_result/receiptのraw telemetry39行。MFA成功10件は別認証監査で、この39行の集計対象に含めない。E02再集計 distinct_failed_users=3→警報条件未達。多数ID自体だけで不正判定しない。
E10 config/document/N_DESK/14:06/調査制約・予定：当時の承認負荷試験/認証試験一覧は0件。source203.0.113.75の自動試行は正規予定に登録なし。原記録保全後、当該sourceへ暫定レート制限/監視を追加可能、NAT198.51.100.75正常群を維持。恒久的安全判断をIPだけで行わず、跨ID相関とMFA/リスク認証を継続評価。利用者全員ロックとlog削除は不要。
E11 alert/document/N_COL/13:15/別連絡：13:10の音声観測録音の添付容量通知、投稿端末REC75のみ、13:15解消。認証イベント/通知配送の依存なし。
E12 log/document/N_DESK/14:10/既知通知の配信試験：前日2026-10-04 16:00の別合成事象AL_TESTのdesk受信成功。当日2026-10-05 14:10現在の通知API health=200、担当登録active。過去の成功で今日のR_ACCOUNT条件成立を証明しない。今日配送停止という仮説を否定する決定的比較はE05/E07の発報0とする。

## 仮説/選択

H_GROUP：跨ID通知要件に対し、稼働集計がuserとauth_nodeごとに分割（正）。H_LOSS：AUTH-B失敗記録が監視へ届かない（E06）。H_CLOCK：時刻ズレで5分の範囲外（E03/E06/E07）。H_DELIVERY：通知生成済みだが端末配送停止（E05/E07通知生成0、E12は補助）。H_NORMAL：観測会NAT群の正規成功を失敗と誤認（E03/E09source/結果比較）。
S_ATTEMPT：203.0.113.75から10IDへ各1回password失敗、成功session/業務readはこの範囲で未確認（正）。S_BREACH：10人全データ流出確定（E08）。S_NAT：正常観測会全員が拒否された（E09）。
C_PATTERN(1)：5分内の同一sourceのpassword失敗は重複を除いて10試行・10ID、2認証ノードに跨る。required=[[E03],[E07]]; support=[E04,E06]。どちらも必要情報を含むので両代替を認める。
C_RULE(1)：通知要件のsource単位8IDと、稼働ruleのsource/user/node単位5失敗は集計軸/閾値が異なる。required=[[E05]]; support=[E02,E07]。E07にR_ACCOUNT count値はあるがgroup/filter設定や通知閾値の全体はない。
C_NOSESSION(1)：Q01..Q10に成功session発行や業務読取は観測されていない。required=[[E08]]; support=[E03]。scopeは固定時刻/request範囲を明記。
F_SPRAY(1)：ログから10試行が同じパスワードを使ったと確定（E03値なし）。F_ROWS(2)：原telemetry30行なので30回の認証試行（E04/E06）。F_MANY(1)：同じNATから10人ログインしただけで攻撃確定（E09）。正主張矛盾=[]、誤主張0。
R_CORRELATE：原ログ/設定/取込品質を保全、当該sourceへの暫定制限と調査、E02の跨ID/跨node通知を追加し既存IDロック維持、正常観測会継続、侵入未確認として報告（正）。R_THRESHOLD：現在のIDロック閾値を5→4にするだけ（各ID1回なので4回のロック条件未達、E03。通知R_ACCOUNTのgroup/閾値はその操作では変わらず、跨ID通知の不足が残る、E02/E05/E07）。R_HIDE：全員lockし原ログ削除（critical、業務/保全）。
P_TEST：複数ID/複数nodeの失敗、同NAT正規成功、取込遅延/重複/時刻の回帰、MFAとリスク認証、ログ保管と監視応答手順を定期確認（正）。P_IP：NAT配下利用者をすべて危険と恒久拒否（critical）。P_MFAONLY：MFA有効の表示だけを見て失敗監視を廃止（MFAは有効防御だが監視要件を置き換えない、E02/E08）。
V_COMPARE：保全Q群は1事象として通知/担当受信、QF正常群は誤警報なし、同ID繰返しlockも継続、filter/dedup/source/時刻/全node取込を確認、制限中も正常投稿可（正）。V_ZERO：通知一覧0だけで安全（E01/E07）。V_PING：監視サーバpingだけ（E05/E06）。
solution S_ATTEMPT/H_GROUP/C_PATTERN,C_RULE,C_NOSESSION/R_CORRELATE/P_TEST/V_COMPARE critical=[R_HIDE,P_IP]。
因果：報告E01→認証原記録と品質E03,E06→試行相関E04,E07→要件/rule差E02,E05→保全と暫定制限/跨ID検知→正常群/不審群の対照E08,E09,E10。未知：人物身元、パスワード同一性、他時刻被害。ノイズE11/E12の範囲に注意。
採点C_PATTERN E03またはE07=10、E03+E11=10、E06=5、E11=0。C_RULE E05=10、E02/E07単独=5。ヒント：行数と試行数を分ける→source/request/user/nodeを対応→要件と現在groupを比較。辞典SIEM/相関分析/ロックアウト/MFA/NAT/重複排除/password spray（値が見えないなら断定不可）。
