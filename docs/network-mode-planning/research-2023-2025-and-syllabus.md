# ネットワーク編研究：2023–2025年と現行シラバス

2026-10-07。作者向け。主担当がIPA公式春秋6期の午後問5の本文・図表・設問27ページを新たに画像で読み直し、各期の問5解答例/出題趣旨と採点講評を照合した。問1や冊子全問を今回読了したという意味ではない。作家の[2021–2022研究](research-2021-2022.md)と合わせて、5年10題を確認した。

## 今回の確認記録

既存の公式PDFをPDFiumで再描画した。2023春/秋、2024春は連結画像でも確認し、2024秋・2025春秋は文字の可読性を確保するため全ページを単ページ画像でも確認。解答/講評の問5部分はテキストを抽出して照合した。PNG/抽出内容はGit対象外のtest-results/network-mode-researchへ置き、教材・配信・Gitへ原文PDFや画像を収録しない。新しいPDF成果物を作った作業ではない。

|期|問5本文の印刷ページ|PDFの0始まりindex|独自の抽象化|
|---|---|---|---|
|2023春|28–31|27–30|名前解決/次ホップ/既存利用者の状態を分けて、停止の影響範囲まで考える。既存DNS切替事件は繰り返さない|
|2023秋|26–29|25–28|内部と外部、名前とIP、接続先と中継の許可条件を対応付ける。既存SMTP事件を再制作しない|
|2024春|30–33|30–33|通信の性質に合う方式を選び、帯域と接続数、処理能力を別の指標として読む|
|2024秋|24–28|23–27|中継点変更後の宛先/送信元/観測範囲を図と設定の双方から追う|
|2025春|30–34|29–33|L2の記録、名前解決の実応答、通信量を別々に観測する。pingだけでアプリ機能を判断しない|
|2025秋|30–34|29–33|移行後も業務の接続要件が残る。DHCPの配布情報、経路、変換前後を図の地点へ対応させる|

解答例は各期PDF index2、講評はindex1の問5部分。2024春の前付け差によるページずれを上表へ反映した。採点講評は、単語の暗記に加えてネットワーク部/ホスト部、実際のDNS問い合わせ、経路や利用状態など「何を確かめる観測か」を取り違えないことの必要性を確認する資料として用いた。正答率から本作の難易度や将来の出題を予測しない。

## 一次資料

以下は問題 / 解答例・出題趣旨 / 採点講評。

- 2023春：[問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_ap_pm_qs.pdf) / [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_ap_pm_ans.pdf) / [講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_ap_pm_cmnt.pdf)
- 2023秋：[問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_ap_pm_qs.pdf) / [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_ap_pm_ans.pdf) / [講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_ap_pm_cmnt.pdf)
- 2024春：[問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_ap_pm_qs.pdf) / [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_ap_pm_ans.pdf) / [講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_ap_pm_cmnt.pdf)
- 2024秋：[問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_pm_qs.pdf) / [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_pm_ans.pdf) / [講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_pm_cmnt.pdf)
- 2025春：[問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_pm_qs.pdf) / [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_pm_ans.pdf) / [講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_pm_cmnt.pdf)
- 2025秋：[問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_pm_qs.pdf) / [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_pm_ans.pdf) / [講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_pm_cmnt.pdf)

2021春の公式問題はWebでも開いて問5該当ページを確認。2024春/2025春のWeb PDF直接閲覧は取得エラーになったため、手元の公式PDFを再描画して読んだ。Web取得成功とローカルの再読を混同しない。

## シラバスとの適合

[公式一覧](https://www.ipa.go.jp/shiken/syllabus/gaiyou.html)と[現行APシラバスVer.7.2](https://www.ipa.go.jp/shiken/syllabus/omgdg50000005kq5-att/syllabus_ap_ver7_2.pdf)を2026-10-07に確認。中分類10ネットワークの印刷p43–45（PDF index46–48）を読み、IPアドレス/サブネット/CIDR、ARP/VLAN/802.1Q、ルーティング、DHCP、リバースプロキシ、QoS/性能を今回の学習軸へ対応させた。

Ver.7.2初掲載は2026-01-08、一覧は2026-07-10更新、2026-07-06に午前/午後を科目A/科目Bへ表記修正。未確定の新制度案を現行の範囲として使わない。従来の「午後対策」というユーザーの呼称を尊重しつつ、この5本を出題予測や全範囲網羅教材とはしない。

## 独自事件の技術照合

規格をそのまま事件の設定にせず、標準的原理と架空製品の具体動作を分ける。製品ごとの前提は正常要件として公開する。

- [RFC1122 §3.3.1](https://www.rfc-editor.org/rfc/rfc1122)：端末のローカル/非ローカル判定とgateway選択を照合。[RFC2131](https://www.rfc-editor.org/rfc/rfc2131)：DHCP設定配布とrelayのgiaddrを照合。NET01の独立scope mask設定やproxy ARP無効は架空環境の明示条件。
- [Cisco公式trunk設定](https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/lyr2-fwd/vlan/vlan-configuration-guide/configure-vlan-trunks.html)：allowed VLANによる通過対象制御を照合。NET02のdropカウンタ名、SPAN位置、active/SVI条件は公開された独自前提。
- [NGINX公式WebSocket proxying](https://nginx.org/en/docs/http/websocket.html)：HTTP/1.1 Upgradeの中継に専用処理が必要という原理を照合。特定のNGINXバージョンの既定値を事件へ持ち込まず、NET03は架空RPのws_bridgeとHTTP/1.1を明記する。認証/426の判定は独自APP仕様。
- [RFC1812 §5.2.4.3](https://www.rfc-editor.org/rfc/rfc1812)：有効ルートの最長一致を照合。NET04の独立FW状態/返答許可/切替運用は独自条件。非対称経路一般が必ず障害になるとはしない。
- [RFC2474](https://www.rfc-editor.org/rfc/rfc2474)と[現行EF PHB RFC3246](https://www.rfc-editor.org/rfc/rfc3246)：DSCPによる各hopのクラス処理を照合。旧RFC2598ではなく後継3246を参照。NET05の4/20Mbit/s、FIFO、40ms/1%の受入基準、書換処理は独自条件。事件の間隔変動は独自測定量で、RFCのjitter定義や総帯域保証と混同しない。

問題の文・会社・数値・図・ログ・設問順は転用しない。得るものは「要件→構成/観測点→実状態→比較→理由→対処」の骨格だけで、人物・業務・構成・証拠・因果は独自に制作する。
