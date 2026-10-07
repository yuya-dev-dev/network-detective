# 学習用の用語辞典

2026-10-07。ヘッダーの用語辞典をポート番号26項目、セキュリティ45項目、選択中の事件用語の3分類へ拡張。全分類検索では英字の大小・全角数字・空白を正規化し、別表記も検索する。検索と分類は保存・採点に影響しない。JSONはアプリに同梱する。

試験への出題保証ではなく、午後問題を読む際の基礎を引くための独自の短い説明。代表的なポートは問題文の設定で変更可能。FTP20はアクティブ方式のサーバ送信元、SNMP162は通知先、DNSはUDP/TCP、HTTPSはHTTP/3でUDP443も使用、ICMP/ESP/AHはTCP/UDPポートを持たない点を区別した。

範囲選定：[IPA APシラバスVer.7.2](https://www.ipa.go.jp/shiken/syllabus/omgdg50000005kq5-att/syllabus_ap_ver7_2.pdf)のネットワーク・セキュリティを参考にした。定義は逐語転載せず、本アプリ向けに要約した。シナリオ固有の原因や解答を共通辞典へ追加しない。

ポートの一次資料：[IANA登録](https://www.iana.org/assignments/service-names-port-numbers)、[FTP RFC959](https://www.rfc-editor.org/rfc/rfc959)、[SNMP RFC3417](https://www.rfc-editor.org/rfc/rfc3417.html)、[DHCP RFC2131](https://www.rfc-editor.org/rfc/rfc2131.html)、[メールTLS RFC8314](https://www.rfc-editor.org/rfc/rfc8314.html)、[HTTP/3 RFC9114](https://www.rfc-editor.org/rfc/rfc9114.html)、[RADIUS RFC2865](https://www.rfc-editor.org/rfc/rfc2865.html)・[Accounting RFC2866](https://www.rfc-editor.org/rfc/rfc2866.html)。

用語の一次資料：[NIST用語集](https://csrc.nist.gov/glossary)、[最小権限](https://csrc.nist.gov/glossary/term/least_privilege)、[多層防御](https://csrc.nist.gov/glossary/term/defense_in_depth)、[フォレンジックSP800-86](https://csrc.nist.gov/pubs/sp/800/86/final)、[Zero Trust SP800-207](https://csrc.nist.gov/pubs/sp/800/207/final)。Web攻撃の説明と対策はOWASPの[SQL Injection](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)、[XSS](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)、[CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)と照合した。

検証はbuild/全既存単体テストと、分類・FTP方式差・SNMP番号・全角数字・別表記・検索ゼロ件・事件用語・ダーク/ホワイト・360/430px横はみ出し・ネット切断中の参照・進行非変更を確認するE2Eを対象とする。

結果：build/型検査/既存11事件のデータ検証PASS、単体122件PASS、辞典E2E3件PASS。テーマE2E4件も各ケースPASSを確認。360pxダーク・430pxホワイトのスクリーンショットを目視し、横はみ出し・文字重なりなし。PWA圧縮総量786.1KiB。
