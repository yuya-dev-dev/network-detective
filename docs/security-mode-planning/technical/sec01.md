# SEC01 技術引継ぎ：交換会の連絡先が、知らない連携先へ

作者用・真相あり。主担当確定版。security / 難度2 / 15分 / 証拠11・ノイズ1。舞台は種苗交換会の受付。旧APIキー流出事件と違い、秘密の漏えいを前提にせず、正規ログインした本人の委任と組織審査の境界を追う。

## 正常要件と仕様

交換会の非公開受付連絡先は受付担当本人が閲覧する。外部連携で読むには組織審査を通ったclient_idだけを許可。審査済み便札作成アプリ A_LABEL は label.print のみ。正規仕事を止めず、無審査 A_MAP の contacts.read を止める。
架空クラウドのOAuth仕様：同意grantはsubject/client/scope単位、アクセスは当該subject自身のcontactsだけ。今回refresh/access tokenは表示タグで実値なし。grant revokeは対応refresh tokenと発行済access tokenを直ちにAPI拒否にする製品固有仕様（一般OAuthの一律仕様ではない）。userinfo/contacts APIは毎回grantの有効性を照合。対話MFAは同意時も成功しているが、アプリの審査を代替しない。会員共有データへの越権/IDORではない。
時刻同期JST、10:00–10:30の全件監査を保全。API応答件数は送信完了したレコード数で、相手の保存/二次利用は不明。連絡先内容は架空で本文に個人情報を載せない。

資料の観測時刻は、その状態・範囲を観測した時刻。全件資料は収録終端、複数イベント資料は最後のイベント以後とし、個別イベント時刻は本文に残す。取得は資料を調査へ揃えた時刻。

## 構成図

N_DESK 受付PC10.71.10.21 → N_IDP id.seed.example.test 192.0.2.71 HTTPS/443 認証と同意。N_DESK → N_API contacts.seed.example.test 192.0.2.72 HTTPS/443 正規閲覧。N_MAP route-helper.example.test 203.0.113.71 → N_IDP HTTPS/443 トークン取得、N_MAP → N_API HTTPS/443 委任読取。N_LABEL labels.example.test 198.51.100.71 → N_IDP/N_API HTTPS/443 審査済連携（今回contacts APIへの実要求はない）。N_IDP/N_API → N_AUDIT10.71.20.10 HTTPS/443 監査転送。PCは内部、IDP/APIはクラウド組織テナント、二アプリは別事業者。認証・同意・データ・監査を区別。8リンクID L01..L08（PC-IDP/PC-API/MAP-IDP/MAP-API/LABEL-IDP/LABEL-API/IDP-AUDIT/API-AUDIT）。N_LABELからAPIは許可されるlabel.printサービス経路だけを表す。連絡先読み取り線として描かない。

## 固定証拠（取得時刻10:30、observedAtは各記載時刻）

E01 report/document/N_DESK/10:24/受付票：外部連携 A_MAP の連絡先読取通知、対象u17、24件。受付は自分で地図支援の同意画面を操作したが組織審査済みか確認していない。通知は一次の断定をしない。
E02 config/document/N_IDP/10:00/正常要件・審査台帳：contacts.readは組織審査必須。承認一覧 A_LABEL(label.print)、A_CAL(calendar.read)の2つで全件。A_MAP未申請。u17の保有連絡先は24件、他利用者は含まない。
E03 log/document/N_IDP/10:30/認証監査：10:12 event=login user=u17 device=DESK-1 method=password+mfa result=success; 10:13 event=consent user=u17 client=A_MAP scope=contacts.read grant=G17 actor=user result=created。10:00–10:30 u17のログイン・同意全件はこの2件だけ。パスワードやMFA値は記録しない。
E04 config/document/N_IDP/10:14/稼働ポリシー：userConsent=allow; approvalRequiredScopes=[]; grant=G17 subject=u17 client=A_MAP scope=contacts.read status=active; reviewed=false。両者の整合を比較できる。grant_idは認証秘密ではない。
E05 log/document/N_API/10:20/応答監査：request=Q17 auth=oauth grant=G17 subject=u17 client=A_MAP scope=contacts.read operation=list_contacts count=24 response_complete=true http=200。APIが審査済みと認定したというフィールドはない。
E06 test/diagnostic/N_IDP,N_API/10:25/隔離テナント同型動作確認：同じapprovalポリシーで未審査TEST_MAPへのuserConsent生成成功→テスト連絡先2件の読取成功。approvalRequiredScopes=[contacts.read]にした別固定試験では審査未済同意=denied、A_LABEL label.print=allowed。本番の修復後ログではない。仮名のテストデータだけ。
E07 config/document/N_IDP,N_API/10:26/失効仕様表：password_change→password credential更新、OAuth grant変化なし。revoke_grant→対応refresh停止＋access API即拒否。アプリ表示の削除だけ→grant変化なし。PCログアウト→PC sessionのみ。正規A_LABEL grant=G_LABELは別識別子。
E08 log/document/N_API/10:30/操作範囲監査：G17の10:00–10:30全API要求はQ17だけ。contacts.write・他利用者読取・一括共有exportはscope不足で利用不能（製品仕様）。対象24件は受付担当保有領域。システム全件流出の観測なし。
E09 config/document/N_MAP/10:11/連携案内保全：画面説明『受付の場所案内をまとめます』、要求scope contacts.read、表示名 地図まとめ、client_id=A_MAP。表示名は組織審査結果ではない。誰が作成したかは保全資料で未特定。
E10 test/diagnostic/N_DESK,N_API/10:27/正常比較：DESK-1の本人contacts画面24件表示200、A_LABEL便札処理job=J14完了、G_LABEL active。読取 API/TLS/認証サービスは稼働中。
E11 alert/document/N_AUDIT/09:20/別件記録：09:15に公開会場マップの画像キャッシュ更新遅延。09:20解消。対象公開CDNはcontact API/IdPの依存先ではない。u17/G17は記録対象外。

## 仮説＝原因候補、範囲

H_POLICY：無審査の連絡先読取同意を組織ポリシーが許可（正）。H_PASSWORD：外部の対話ログインでパスワードを使い連絡先取得（E03/E05のmethodと主体が反証、人物の無実を断定しない）。H_LABEL：審査済便札アプリの予定読取（E02/E05 IDとscope不一致）。H_PUBLIC：匿名公開画面でcontactsを配布（E05/E08認証必須）。H_OUTAGE：API停止の誤通知（E05/E10成功）。
S_G17：u17の連絡先24件をG17経由で無審査アプリに送信（正）。S_ALL：全利用者全データの送信（E08）。S_WRITE：連絡先改変のみ（E05/E08）。

## 主張（公開必要件数）

C_GRANT(2)：u17が同意したG17をA_MAPの読取に使用。required=[[E03,E05]]。support=[]。
C_POLICY(1)：連絡先読取の審査要件を稼働同意ポリシーが強制しない。required=[[E04],[E06]]。support=[E02]。
C_SCOPE(2)：10:00–10:30の全API要求を照合した確認範囲は、u17自身の連絡先24件の送信1回に限られる。required=[[E05,E08]]。support=[E02]。E02+E05も件数と保有領域は示すが全要求範囲を示さないので5。
F_MFA(1)：MFA成功なら外部アプリの用途も審査済み（E02/E03反証）。F_LABEL(2)：表示名が受付向けならA_LABELと同じ権限（E02/E09）。F_RESET(1)：パスワード変更だけでG17の読取も即停止（E07）。すべて誤主張0。各正主張contradictory=[]。

R_STOP：監査と同意画面を保全し、G17を失効、contacts.readの無審査同意を停止、影響24件を関係者へ報告、A_LABELは維持（正）。R_RESET：パスワード変更のみ（E07）。R_DELETE：監査と連携通知を消し、アプリの表示だけ削除（critical、E07と保全）。
P_REVIEW：連絡先読取の管理者審査、最小scope、同意/実読取監視、定期grant棚卸し（正）。P_NAME：表示名に受付とあれば審査省略（E09）。P_TLS：TLS証明書だけを毎日確認（経路安全は委任用途を保証しない）。
V_PAIR：G17の旧access/refreshが拒否、無審査contacts同意も拒否、承認済label.printと本人閲覧を維持、異常読取停止を監査で確認（正）。V_LOGOUT：PCログアウト画面だけ（E07）。V_TLS：APIのTLS接続だけ（E05/E10）。

solution S_G17/H_POLICY/C_GRANT,C_POLICY,C_SCOPE/R_STOP/P_REVIEW/V_PAIR、critical=[R_DELETE]。
因果6段階：通知E01→本人認証と同意E03→G17読取E05→審査要件/実設定不一致E02,E04→失効と同意制限E07→旧grant拒否と正規維持E07,E10。未確認：アプリ運営者の身元、相手保存、二次利用。ノイズE11は時刻と依存で排除。
採点例C_POLICY E04=10、E06=10、E02のみ=5、E11のみ=0。C_GRANT E03+E05=10、E03のみ=5。各候補の個別解説は上記EIDを用いて完成稿へ明記。
ヒント軸：本人ログインとアプリ読取を分ける→同意ID/要求scopeを対応→審査台帳/稼働ポリシー比較。辞典：OAuth/委任/scope/grant/MFA/失効。台詞は審査不足や正解語を導入で断定しない。
