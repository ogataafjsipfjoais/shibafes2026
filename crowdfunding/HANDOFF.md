# クラウドファンディングサイト引き継ぎ
更新日: 2026-11-11 JST

## 対象
- GitHub: https://github.com/ogataafjsipfjoais/shibafes2026
- 公開: https://ogataafjsipfjoais.github.io/shibafes2026/crowdfunding/
- 作業ブランチ: main
- CAMPFIRE: https://camp-fire.jp/projects/990337/view
- 既存芝浦祭サイト、既存返礼品ページは維持する（無断上書きしない）

## 現在のサイト
支援を案内するスクロール型ページの一部として、画面内で自動離陸する操縦体験を**1つだけ**設けている。
1. 実際の活動写真、ユーザー指定のタイトル「次の機体は、あなたの支援で飛ぶ。」と指定説明文
2. 2026年S-320の180.67m、2027年S-330「鵠」、募集金額・締切の概要
3. 「琵琶湖から飛ぶ」体験。ページを開くとGLBを読み込み、シーンが画面の約35%見えると自動離陸（クリック不要）。マウス・タッチ・矢印キー/WASDで操縦。4つのゲート、再挑戦、終了可能
4. 操縦体験の下は短い「機体をつくる人たちの言葉」欄に統合。髙草木雄太さん／大谷映奈さんの公式記事と活動記録へ直接リンク（重複する2つ目の3D展示・4章は削除）
5. 返礼品3コース（500円メール、7,000円バッグ、25,000円試験見学）と全10コース案内
6. CAMPFIREの公式支援先、投資・配当ではないことの明記

## 使用データ
- 芝浦祭サイトと**同じファイル**を相対参照: assets/s320-desktop.glb（PC）、assets/s320-mobile.glb（モバイル）
- データはMeshopt圧縮。assets/crowdfunding/vendor/three-r128.min.js、GLTFLoader-r128.js、meshopt_decoder-r128.js が必要。ライセンスはvendor/THREE-LICENSE.txt。
- 新しい機体を箱・円柱で代用しない。シミュレーター内のS-320は上記GLBからロードする。
- 会場: 滋賀県彦根市・琵琶湖松原湖岸。読売テレビ公式大会概要 https://www.ytv.co.jp/birdman/about/ によれば離陸台は水面から約10m、助走路約10m、傾斜3.5度。
- 湖・桟橋・足場・山並み・ゲート・飛行挙動は**演出用の概略再現**で、公式会場の正確な3Dデータや本番映像ではない。プレーヤーには明記済み。
- 3DはS-320のモデル。S-330の実機・映像と誤解させない。
- 実名の公式記事リンク（髙草木雄太さん／大谷映奈さん）は本文に残す。

## 主要ファイル
- crowdfunding/index.html：本文と操縦シーンのDOM、支援導線
- assets/crowdfunding/venue-flight-v1.js：実際のGLBを使う琵琶湖離陸台＋4ゲート操縦
- assets/crowdfunding/venue-flight-v1.css：操縦体験のPC/スマホUI
- assets/crowdfunding/campaign-story-v2.css：重複した3D・章構成のスタイルを除いたページ本体CSS
- assets/crowdfunding/scroll-flight-v1.js / scroll-flight-v1.css：旧資産。リポジトリには残すが、現クラファンページからは読み込まない
- tools/test-crowdfunding-v10.mjs：HTML・ファイル・JS構文・事実関係・A11yチェック
- tools/qa-crowdfunding-v8.py：Playwright Chromiumで375x667、375x812、768x1024、1440x900検証
- .github/workflows/crowdfunding-browser-qa.yml：ブラウザQA、日本語フォントもインストールしてスクリーンショット
- crowdfunding/rewards/index.html：以前からの返礼品紹介、維持

## 操作と品質上の約束
- スクロールするだけでも支援まで進める。操縦シーンに入ると自動離陸、タッチ画面内でも縦スクロールを維持。途中の終了・再挑戦が可能。
- 機体のGLB読み込みはページ開始時から自動実行。IntersectionObserverは画面内判定（35%以上）とアニメーション制御のみ。
- スマホは軽量GLB、reduced-motionやWebGL失敗時は写真・記事・支援リンクを維持。
- 支援総額・人数・進捗率・返礼品残枠は最新値を確認できていないため捏造しない。
- 「一番選ばれている」などの人気順位を裏付けなく出さない。
- 金銭的リターンがない購入型クラウドファンディング。申込・決済はCAMPFIRE上でのみ。
- クラファンページ以外の芝浦祭トップやゲームを壊さない。
- 今回は単一AIによるデザイン・実装・検証の観点で判断。独立した複数AIの協議は未実施。

## 検証記録
- 4ゲートを実際に操縦して通るPlaywrightテストはスマホ375pxとデスクトップ1440pxで成功。PCの低フレームレート対策後: GitHub Actions QA 42968072984 success。
- スクロールモデルの読み込み・レスポンシブ・横スクロール0・JavaScriptエラー0・縮小動作設定の代替を検証。
- 会場の光と機体の見せ方をスクリーンショットから修正。日本語文字のスクリーンショット評価を可能にするためCIにNoto CJKを追加。
- 直近の視覚チェック用QA 42969115309: success。さらにフェードイン完了後の写真を撮るQAを追加したため、最新コミットに対するチェック結果を再確認すること。
- 最新のGitHub PagesはActionsが完了したコミットのみ成功と言える。最終引き継ぎ時はActionsを再取得する。

## 未解決・次の優先
1. 最新コミットのページデプロイとブラウザQAを確認し、実機iOS Safariでタッチ操作を検証する（自動Chromiumテストは実機の代わりにならない）。
2. 会場は演出再現。会場の構造物や湖面の視覚品質はまだ実写との比較・学生本人確認が必要。
3. トップ画像について、以前ユーザーがチャットに添付した画像は**GitHub上に未アップロード**。現行はassets/crowdfunding/2026-propeller-team.jpg。以前準備した差し替え仕組みは残っているが、実ファイルがないため反映されていない。
4. CAMPFIREの現在額・人数・個別方式は改めて公式確認のうえ反映。数値捏造は禁止。
5. 独立した複数AIの議論は未実施。必要に応じて次回行う。

## 注意
引き継ぎ時は最初にこのHANDOFF.mdを読み、他の芝浦祭ページを変更せず、GitHubの現コードとActions結果を確認して作業を再開する。


## 2026-11-11 06:08 返礼品導線とiPad Safariの3D読み込み
- ユーザーから、iPad上で「3Dを読み込めなかった」と表示されたとの報告。
- 分析：`crowdfunding/index.html` の従来CSP `script-src 'self'` は、Meshopt GLBを解凍するWebAssembly実行を阻害し得る。ここに `'wasm-unsafe-eval'` を追加した。サードパーティのJSや `unsafe-eval` は許可していない。
- iPad/タッチ端末では、操縦用モデルに芝浦祭の `assets/s320-mobile.glb` を優先利用（デスクトップ約6MB、モバイル約2.8MB）。描画ピクセル比・アンチエイリアス・会場の小物数を減らした。
- iPad Safariで2つのWebGLコンテキストを同時に使用しないため、タッチ端末のスクロール記事ではS-320の静止画を表示。**3D操縦体験は維持**。iPad以外のPCではスクロール3Dも使用。
- Playwright ChromiumでCSPをバイパスせずiPad風タッチ環境で操縦ができるチェックを追加し成功（Actions run 42971010013）。さらにLinux WebKitでのiPad近似テスト `tools/qa-crowdfunding-webkit.py` を導入。GitHub Actions `webkit-ipad` jobで実行。run 42971756553 で成功（WebKit/1024x768タッチ、CSP有効のまま `s320-mobile.glb` の読み込み・離陸・静止画代替を確認）。
- 全6か所の `./rewards/` リンクをCAMPFIRE公式 `https://camp-fire.jp/projects/990337/view` へ直接変更。旧返礼品紹介ページのソースは削除せず維持。
- 「オリジナルトートバッグ。2027年2月にお届け予定。」の配送時期記載を削除。サイト上は「A4が入るオリジナルトートバッグ。」。
- iPad Safari実機を直接操作する検証は**未実施**。ユーザーによる再表示で問題が続く場合はエラー表示位置とiPadOSを確認。機密情報や購入操作は不要。

- 追加修正: WebKitのCSPがHTMLのインラインstyle属性を無視することを確認。heroの文字装飾をCSSクラスへ移動。実WebKitテストでJSエラーなし。
- Playwright WebKitはSafariと同じエンジンだがLinux上のiPad近似テスト。iPad Safariの実機検証完了とは扱わない。


## 2026-11-11 16:38 JST: 機首方向と3D自動読み込み
- ユーザー報告: 琵琶湖の操縦システムで飛行機が進行方向と逆向き。離陸ボタンを押さなくても3Dを読み込んでほしい。
- 対応: `assets/crowdfunding/venue-flight-v1.js` でGLBの機体ルートのY回転をπラジアン（180度）に設定。コースとカメラは変更せず、機首を- Z方向のゲートと湖に向ける。実際のGLBは引き続きS-320のモバイル/デスクトップデータ。
- 対応: ページ表示時に `setup()` を自動開始。IntersectionObserverは読み込み開始ではなく、可視領域でのフレーム描画制御に使用。離陸ボタンは飛行開始のみ。自動でスクロールや離陸はしない。
- QA: `tools/test-crowdfunding-v10.mjs` に自動初期化と回転設定の検査を追加。Chromium 375px・1440pxではスクロール・クリック前の3D準備、機体方向を検査。iPad相当のLinux WebKitもCSP有効のままクリック前読み込みを検査。
- GitHub Pages: run 42981309653 successful (commit a8621356)。WebKit job run 42981309686 passed; Chromiumは実行完了後に結果を記録すること。
- 未確認: 実際のiPad Safari・実機操縦視覚による前後向きの最終確認は未実施。自動テストは内部の向きと動作を確認するが、実機視覚検証の代わりにならない。

## 2026-11-11 17:01 JST 自動離陸への切り替え
- ユーザー要望：「ここから離陸する」ボタン・表示をなくし、勝手に離陸を始めること。
- `crowdfunding/index.html` から `#pilot-intro` と `#pilot-begin` を削除。説明は「画面に入ると自動でテイクオフ」に更新。
- `venue-flight-v1.js` で、3Dロード完了かつステージ可視率35%以上で `maybeAutoStart()` が自動離陸。離陸時の `scrollIntoView()` は除去。ロード前に到達した場合もロード完了後に開始。
- タッチでスクロールが止まらないよう `venue-flight-v1.css` の `touch-action` を `pan-y` に変更。矢印キー/WASDとマウス操作、4ゲート、終了、ゴールからのリプレイは維持。
- 「操縦を終了」した後は同じ画面内で勝手に再始動せず、いったん画面外に出て戻ると再開可能。reduced-motion設定やGLB失敗時の写真フォールバックも維持。
- 自動テスト: GitHub Pages run 42984428914 success。Browser QA run 42984428715 はWebKit iPad類似・Chromium双方 success。Chromiumは375x667、375x812、768x1024、1440x900でGLB・自動離陸・4ゲート・支援導線・横はみ出し0・JSエラー0を確認。iPad風タッチ＋CSP有効も検証。
- 今回の独立した複数AI協議は未実施。単一AIでUI・実装・QAの観点から修正。


## 2026-11-11 17:11 JST 重複コンテンツ削除
- ユーザー要望：「重複しているところを消して」。
- 確認できた重複: S-320の4ゲート操縦（自動離陸）と、その直後にもう一つのS-320 3Dを表示する巨大なスクロール展示。両方で記録・27代への継承・製作・支援の4章を重複掲載していた。
- 採用判断: ユーザーが希望した琵琶湖会場の**自動離陸・本物のS-320・4ゲート操縦**を残し、2つ目の3D展示と繰り返しの4章を削除。画面には1つのWebGL canvasのみ。
- 公式出典が失われないよう、操縦エリアと返礼品の間に短い「機体をつくる人たちの言葉」欄を追加。髙草木雄太さん／大谷映奈さんの公式記事と活動記録へリンク。
- フィナーレの「続けて返礼品を見る」は `#rewards` へ直結。繰り返しの読み物を飛ばして、返礼品3コース・CAMPFIRE・支援情報へ進める。
- 削除済みの `scroll-flight-v1.js` は現ページで読み込まない。共有CSSも不要になった3D/章ルールを取り除き `campaign-story-v2.css` へ整理。旧ソースは他ページへの影響を避けてリポジトリに保存。
- 減ったもの: 重複3Dシーン、4章の巨大なスクロールセクション、二重GLB描画、不要CSS（旧CSS比約2.7KB減）。重要な歴史的数字、返礼品、CAMPFIRE支援リンク、注記は維持。
- 現行チェックは `tools/test-crowdfunding-v10.mjs`、`tools/qa-crowdfunding-v8.py`、`tools/qa-crowdfunding-webkit.py` を新構成に合わせて更新済み。該当コミットの最終Actions結果は確認すること。
- 今回は単一AIによるUI/UX・実装・QAの観点での判断。独立した複数AI協議は未実施。


## 2026-11-11 添付トップ画像の実装
- ユーザー提供の鳥人間コンテスト機体写真（画像内に「人力二人乗り」「TeamBirdmanTrial」の文字）を、`assets/crowdfunding/2026-flight-hero.avif` に最適化してGitHubにバイナリ登録済み。画像は700×467 AVIF。
- `crowdfunding/index.html` のヒーローを `picture` とAVIFソースに変更。旧 `2026-propeller-team.jpg` は非対応ブラウザのフォールバックとして保持。
- `campaign-story-v2.css` は画像の文字を切らない `object-fit:contain`。デスクトップでは周辺にぼかしを使用し、スマホは縦横比を維持。サイト側の支援説明とCTAは画像の下に表示し重なりを回避。
- ユーザーの再指示した見出し「次の機体は、あなたの支援で飛ぶ。」と説明文「S-330「鵠」の機体製作へのご支援お願い致します。二人乗り人力プロペラ機で、鳥人間コンテストへの出場そして記録更新を目指します。」は既存HTMLに**反映済みであることを再確認**。旧見出し・旧説明文は不在。
- ユーザーメッセージの「3. 2２２２…」は修正指示として意味を特定できず、サイト変更は行わない。
- 残る確認: 最新GitHub ActionsのデプロイおよびブラウザQA結果。iPad Safari実機テストは未実施。
- 独立した複数AI協議は未実施。単一AIでデザイン・実装・検証の観点から判断。
