# SEC02 技術引継ぎ：持ち主が押していない、引渡先の変更

作者用・真相あり。主担当確定版。security / 難度3 / 20分 / 12証拠・ノイズ2。古書修復工房の持ち主用受渡しサイト。Cookie認証とブラウザの要求が本人の変更意思を証明するかを推理する。IDOR事件とは異なる。

## 正常・前提

持ち主は自分の預けた1冊の引渡し場所を、ログイン後の確認フォームで自ら変更できる。閲覧用GETでは変更しない。工房は当日変更受付を維持し、他人の資料は読めない。owner checkは今回すべて正常。匿名要求は401。セッションCookieは host-only; Secure; HttpOnly; SameSite=Lax明示、対象ドメインhandoff.book.example.testのみ。外部story-notice.testは別site、Cookieを読めない。HTTPSとTLS検証は全区間正常。
今回端末は、外部siteからのトップレベルGETナビゲーションではLax Cookieを添付するブラウザ。iframe/img要求とは区別する。GET変更を受け付けるサーバが単一原因で、セッション窃取やSQL注入の実証はない。GETのOriginヘッダーがないことを異常扱いしない。Refererは経路の参考、本文判断の唯一の認証手段にしない。CORS許可がなくてもリンク遷移を阻止しない。実際のURLパラメーター・攻撃コードは表示不要、対象/新値を監査の構造化欄へ示す。
10:50–11:20の変更監査・認証監査・保全ブラウザtraceを全件。server_request_idで関連付け、Cookie値ではなくsession_label表示。後の試験は独立隔離レプリカで合成データ、プレイヤーが実行した修復ログではない。

資料の観測時刻は、その状態・範囲を観測した時刻。全件資料は収録終端、複数イベント資料は最後のイベント以後とし、個別イベント時刻は本文に残す。取得は資料を調査へ揃えた時刻。

## 構成

N_OWNER PC10.72.10.22、N_EXT外部案内203.0.113.72、N_EDGE handoff.book.example.test192.0.2.72（FW/WAF、TLS終端）、N_APP10.72.20.12、N_DB10.72.30.12、N_TEST隔離同型環境10.72.40.12、N_LOG10.72.50.12。境界は所有者端末/公開入口/非公開業務/隔離試験。L01 OWNER-EXT HTTPS/443 外部案内取得、L02 OWNER-EDGE HTTPS/443 画面とナビゲーション、L03 EDGE-APP HTTP/8080保護内部区間、L04 APP-DB TCP/5432、L05 APP-LOG監査HTTPS/443、L06 EDGE-LOG同、L07 OWNER-TEST HTTPS/443固定診断。EXT→OWNERはリンク案内の論理関係L08として表示、外部サーバがCookie付き要求を直接APPへ送る線は禁止。WAFは本件URL/GETを仕様上素通し、内部侵入の新経路なし。

## 全証拠

E01 report/document/N_OWNER/11:09/持ち主申告：案内リンクを開いた後、預かり票B72の引渡先が本店から外部受渡箱へ変化。本人は変更確認フォームを開いていない。出庫は未実施。
E02 config/document/N_APP/10:50/業務要件と変更API仕様：自分の票のみ変更可、確認POSTで意思を確認、閲覧GET不変、当日変更は必須。変更受理時はbefore/after/request_idをすべて監査。外部受渡箱も正規候補場所で値の形式は正しいが、持ち主意思が必要。
E03 log/document/N_EDGE/11:08:03/入口記録：request=R72 method=GET path=/handoff/update content_type=none session_label=S72 auth_user=o72 referer=https://story-notice.test/ http=200 forwarded=APP; target=B72 new_location=BOX9。TLS検証正常、Origin=absent。11:07:00 GET /handoff/view R71=200、変更なし。
E04 log/document/N_DB/11:20/変更監査（R72更新イベント11:08:03）：request=R72 ticket=B72 owner=o72 before=MAIN after=BOX9 operation=update actor=o72。10:50–11:20 B72の全変更はR72のみ。業務出庫記録：ticket=B72 status=held dispatched=false 11:10。
E05 config/document/N_APP/10:55/稼働ルーティング：GET /handoff/update→session auth→owner check→location enum validation→update。confirmation-token検証なし、Origin/Fetch-Metadata検査なし。POST /handoff/confirmはセッションに結びつけた意図確認token検証あり。GET /handoff/viewは参照のみ。Cookie属性前提通り。旧互換GETは10:40追加。
E06 log/document/N_OWNER/11:08:03/保全trace：11:08:01トップレベル外部案内ページに遷移、11:08:03本人のリンククリック→top-level navigate GET /handoff/update request=R72; session_label=S72は対象hostだけへ添付、外部hostへは未送信。script_execution=none（該当ページの保存内容とナビゲーション追跡で確認）、form_submit=none。このクリックの意味が変更であるとの説明は案内画面にない。
E07 test/diagnostic/N_TEST/11:14/固定対照試験：同型隔離環境、同じCookie属性、合成所有者T72。外部ページからtop-level GET→sessionあり/変更1件。Cookieなし同要求→401/変更0件。参照GET→200/変更0件。意図確認tokenなしPOST→403/変更0件。稼働GETのowner checkを変えず再現。
E08 log/document/N_APP/11:20/認証と処理経路：10:50–11:20 o72対話loginは10:52本人端末1件、S72発行。API token経路なし。R72 auth=session、owner_check=pass、statement=parameterized UPDATE、target=B72。別の人の票B99をS72で指定した試験は403、owner制御は維持。
E09 config/document/N_TEST/11:15/復旧制約・試験計画：互換GET変更廃止後も参照GETの閲覧とtoken付きPOSTの変更を提供可能。欠落/他セッションtoken/非本人票を拒否する回帰項目。A系業務利用者の端末入替やFW停止は不要。token値は非表示。
E10 log/document/N_APP/11:16/正規比較：別持ち主o73、ticket=B73、POST /handoff/confirm、token_check=pass、owner_check=pass、before=MAIN after=BRANCH、本人確認操作record=F73。正常フォームでの変更とR72を比較する。
E11 alert/document/N_LOG/09:05/読取器メンテ：09:00に別建物の紙票読取器が清掃モード、09:05終了。当日Web変更/DBに依存しない。
E12 report/document/N_OWNER/前日17:30/画像保存報告：公開古書紹介ページの画像解像度が低い。ページは別公開CDN、認証Cookie/変更APIと非共有、修復済み。両ノイズは時刻/対象で区別。

## 候補と採点

H_GET：意思確認のない互換GETがセッション付きトップレベル遷移を変更として受理（正）。H_STEAL：Cookieを外部hostへ送って別端末が使用（E06/E08対象request経路）。H_OWNER：他人の票のowner check省略（E08/B72）。H_SQL：入力がSQL文として実行（E05/E08パラメータ化とenum）。H_SYNC：二つの正規確認フォームが競合（E04全変更とE06）。
S_TICKET：B72の引渡先1件が本人確認フォームを経ず変更、物理出庫なし（正、E04）。S_BOOKS：全預かり品が既に外部配送（E04）。S_PASS：全利用者パスワード変更（E08）。
C_LINK(1)：R72は外部案内から本人ブラウザのセッション付きトップレベルGETとして到達。required=[[E06]]; support=[E03,E07]。
C_ROUTE(1)：閲覧GET不変の要件に対し、互換GETが意思確認を検証せず変更を実行。required=[[E05]]; support=[E02,E07]。
C_EFFECT(2)：GETのR72がB72の引渡先を変えた1件で、未出庫の状態まで確認できる。required=[[E03,E04],[E04,E06]]; support=[E01]。E04は要求method/入口経路を含まないため、主張に『GETのR72』を明記し、入口記録E03またはブラウザ記録E06と変更監査E04の2件で成立する。
F_LAX(1)：SameSite=Laxなら外部ページからのGETにCookieは一切付かない（E06/E07）。F_CORS(1)：CORS許可がなければリンク遷移もサーバに届かない（E03/E06）。F_INPUT(2)：候補場所の値が正しいなら本人が変更を確認した（E02/E05/E10）。誤主張0、正主張矛盾=[]。
R_CLOSE：要求/変更/traceを保全、互換GETの変更を廃止しtoken付きPOSTへ統一、B72を本人に確認して正しい引渡先へ戻し出庫保留を維持、参照GETは継続（正）。R_COOKIE：CookieのHttpOnly追加だけ（既に設定、E05/E06）。R_DROP：WAF/FW全面停止し監査削除（critical、業務/保全）。
P_TEST：状態変更ルート全件のmethod/意図確認token/owner checkを回帰、外部トップレベル遷移の試験、適切なOrigin/Fetch-Metadata防御を補助追加（正）。P_CORS：CORS設定だけを変えてGET変更を残す（E03/E05）。P_ENUM：候補場所enumだけ再検査（既に正常、E05）。
V_MUTATION：GETでは変更0、正規token付きPOSTでは本人票変更成功、欠落/他セッションtoken/非本人票は拒否、B72の合意状態と出庫保留、ログ保存を確認（正）。V_200：変更画面200だけ（E03/E04）。V_SIGNOUT：本人ブラウザログアウトだけ（別ログイン時の再発は残る）。
solution S_TICKET/H_GET/C_LINK,C_ROUTE,C_EFFECT/R_CLOSE/P_TEST/V_MUTATION critical=[R_DROP]。
因果：申告E01→経路とCookieE03,E06→更新E04→旧GETと業務要件E02,E05→保全/GET廃止/本人合意E09→拒否と正規継続E07,E09,E10。未確認：リンク作成者の身元や他日時の全体被害。
採点例C_LINK E06=10、E06+E11=10、E07のみ=5、E03のみ=5、E11=0。C_EFFECT E03+E04=10、E04のみ=5。技術現象CSRFを辞典で一般説明し、内心で結論を先に言わせない。ヒント：操作意思/認証を分ける→R72を入口/変更/ブラウザで照合→GETと正規POST比較。辞典GET/POST/Cookie/SameSite/CSRF/CORS/HttpOnly/パラメータ化。
