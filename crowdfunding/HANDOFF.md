# クラウドファンディングサイト引き継ぎ
更新日: 2026-11-11 JST

## 対象
- GitHub: https://github.com/ogataafjsipfjoais/shibafes2026
- 公開: https://ogataafjsipfjoais.github.io/shibafes2026/crowdfunding/
- 作業ブランチ: main
- CAMPFIRE: https://camp-fire.jp/projects/990337/view
- 既存芝浦祭サイト、既存返礼品ページは維持する（無断上書きしない）

## 現在のサイト
支援を案内するスクロール型ページに、任意参加の操縦体験を追加した。
1. 実際の活動写真、ユーザー指定のタイトル「次の機体は、あなたの支援で飛ぶ。」と指定説明文
2. 2026年S-320の180.67m、2027年S-330「鵠」、募集金額・締切の概要
3. 任意の「琵琶湖から飛ぶ」体験。離陸は1クリック、操縦はマウス・タッチドラッグ・矢印キー/WASD。4つのゲート、再挑戦、終了可能
4. スクロールのみで進行するS-320本物の機体モデルと4章（記録、継承、製作、支援）
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
- assets/crowdfunding/scroll-flight-v1.js：従来のスクロール連動S-320 3D
- assets/crowdfunding/scroll-flight-v1.css：ページ本体の編集デザイン
- tools/test-crowdfunding-v10.mjs：HTML・ファイル・JS構文・事実関係・A11yチェック
- tools/qa-crowdfunding-v8.py：Playwright Chromiumで375x667、375x812、768x1024、1440x900検証
- .github/workflows/crowdfunding-browser-qa.yml：ブラウザQA、日本語フォントもインストールしてスクリーンショット
- crowdfunding/rewards/index.html：以前からの返礼品紹介、維持

## 操作と品質上の約束
- スクロールするだけでも支援まで進める。操縦は任意の1クリックで開始し、体験中も離脱可能。
- 会場や機体の高精細モデル読み込みはIntersectionObserverで表示周辺から開始。
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
