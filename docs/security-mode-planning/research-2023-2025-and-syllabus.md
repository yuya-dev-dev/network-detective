# セキュリティモード研究：2023–2025年と最新版シラバス

確認開始2026-10-05、記録整理2026-10-06。主担当がIPA公式6期の午後問1本文・図表・設問28ページを画像で再読し、各期の問1解答例/出題趣旨と採点講評（それぞれPDF1ページ）をテキストでも照合した。過去の研究メモだけを今回の読了記録に置き換えていない。問5や冊子全問を今回読了したという意味ではない。

問題PDFは画像中心のためPDFiumで対象ページを描画。作業物はGit対象外test-results/security-mode-researchに保存し、配信・成果物には含めない。以下は独自の短い要約。原文・図・舞台・数値・設問順を自作へ転用しない。

## 対象と抽象化

印刷ページで示す。2024春のみPDFの0始まりindexが印刷ページと同じ（前付けの差）。他期のindexは印刷ページ−1。

|期/範囲|比較対象|理由を説明する構造|制作への適用|
|---|---|---|---|
|2023春 p4–8|初動、端末挙動、対応体制、バックアップ接続|対策が保護する対象/場面と、未確認の活動を区別|保全・封じ込め・確認を分ける。既存バックアップ事件は繰り返さない|
|2023秋 p4–7|内容/転送経路、署名/暗号化、鍵と証明書|ある保護が満たす目的と、別の目的を守れない理由|暗号の名称当てではなく、誰がどこで読める/検証できるかを対応させる|
|2024春 p6–10|境界防御、利用者認証、端末、クラウド、監視|一つの成功が全体の安全を保証しないことと相関分析の目的|認証・委任・利用・監視の記録を分け、正常比較を持つ|
|2024秋 p6–9|Web入力処理、保存方式、試験結果、多層防御|同じ指標でも用途によって必要な性質が異なる|正常要件と実処理の条件を比べる。診断結果だけで本番被害を作らない|
|2025春 p6–10|侵入調査、試行の分布、認証制御、記録と保管|対策の集計単位/適用対象が活動の形に合うか|防御の有無だけでなく、今回何を数えるかとその限界を読ませる|
|2025秋 p6–10|関連組織、継続対策、権限、依存ソフト台帳|既存対策で守れない範囲と影響判定の迅速性|出所・許可・実行・業務影響をそれぞれ証拠でつなぐ|

## 公式一次資料

各行は問題 / 解答例・出題趣旨 / 採点講評。問題本文は上表、解答と講評は問1の部分だけが今回の対象。

- 2023春：[問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_ap_pm_qs.pdf) / [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_ap_pm_ans.pdf) / [講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05h_ap_pm_cmnt.pdf)
- 2023秋：[問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_ap_pm_qs.pdf) / [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_ap_pm_ans.pdf) / [講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/ps6vr70000010d6y-att/2023r05a_ap_pm_cmnt.pdf)
- 2024春：[問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_ap_pm_qs.pdf) / [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_ap_pm_ans.pdf) / [講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06h_ap_pm_cmnt.pdf)
- 2024秋：[問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_pm_qs.pdf) / [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_pm_ans.pdf) / [講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/m42obm000000afqx-att/2024r06a_ap_pm_cmnt.pdf)
- 2025春：[問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_pm_qs.pdf) / [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_pm_ans.pdf) / [講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07h_ap_pm_cmnt.pdf)
- 2025秋：[問題](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_pm_qs.pdf) / [解答例](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_pm_ans.pdf) / [講評](https://www.ipa.go.jp/shiken/mondai-kaiotu/nl10bi0000009lh8-att/2025r07a_ap_pm_cmnt.pdf)

## 最新版との照合

[IPA公式一覧](https://www.ipa.go.jp/shiken/syllabus/gaiyou.html)で現行APシラバスがVer.7.2であることを確認。[AP Ver.7.2 PDF](https://www.ipa.go.jp/shiken/syllabus/omgdg50000005kq5-att/syllabus_ap_ver7_2.pdf)中分類11セキュリティの印刷p49–57（PDF index52–60）を確認。初掲載2026-01-08、公式一覧では2026-07-06に科目A/科目Bへ表記修正。同版主改訂は法律用語であり、今回のセキュリティ項目が新設されたとは解釈しない。未確定の新制度案を現行版に使わない。

範囲には情報保護の目的、脅威/攻撃、暗号/署名/PKI、認証、アクセス管理、インシデント管理、技術的対策、認証・認可実装、Webセキュリティ等がある。5本は範囲との適合で選び、頻出順位や今後の出題予測ではない。午後過去問を参考にした推理練習であり、科目B全範囲を網羅する教材ではない。

## 個別技術の一次照合

資料は仕様確認の補助。事件固有の閾値、審査、架空製品失効等は独自の明示条件で、規格一般の保証ではない。

- [OWASP OAuth2](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)：委任のresource/action制限とtoken保護。組織審査と即時失効は架空クラウド仕様。
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)：状態変更要求のserver検証、GETで状態変更しない。CORSをリンク遷移の遮断と混同しない。
- [ブラウザ実装のSet-Cookie説明（MDN）](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)：明示Laxのcross-site top-level safe-methodナビゲーション条件。未指定Laxの猶予を事件へ混ぜない。
- [RFC8551 §3.5.3](https://www.rfc-editor.org/rfc/rfc8551.html#section-3.5.3)：multipart/signedのclear-signing。内容暗号化と各hopのTLSを分ける。
- [SLSA1.2 artifact verification](https://slsa.dev/spec/v1.2/verifying-artifacts)：署名/subject digestに加え期待builder/source等の照合。事件をSLSA完全準拠とは称しない。
- [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)：自動試行の分布、適用対象、MFA/lockoutの役割。秘密値なしで同じpasswordを試したと断定しない。

## 調査の統合

作家の[2021–2022研究](research-2021-2022.md)と合わせ、春秋5年・問1の10題、本文図表設問45ページの再確認が基礎。正常要件・実処理・記録・対策の対応を作る。事象、人物、ログ、時刻、数値、図、因果は独自に作成。
