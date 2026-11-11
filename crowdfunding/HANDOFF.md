# クラウドファンディングサイト引き継ぎ

更新日: 2026-11-11（日本時間）

## プロジェクト
- 目的: 芝浦工業大学TeamBirdmanTrialの二人乗り人力飛行機S-330「鵠」の製作支援を、誤解のない購入型クラウドファンディングとして案内する
- GitHub: https://github.com/ogataafjsipfjoais/shibafes2026
- 公開URL: https://ogataafjsipfjoais.github.io/shibafes2026/crowdfunding/
- 支援先: https://camp-fire.jp/projects/990337/view
- 作業ブランチ: main
- 最新のページ変更: 462ff1d79924fe1ea7246e32fa63185ae76f85c2（FAQの明確化）
- 公開成功: GitHub Actions 42959819679
- ChromiumブラウザQA成功: GitHub Actions 42959819754

## 今の構成
1. 写真＋「次の一機は、あなたの支援で飛ぶ。」：500円から支援可能、11/30募集締切、日数はAsia/Tokyoのブラウザ時間から算出
2. 支援状況：目標410,000円。現在支援額・人数は最新値を検証できないので未掲載、公式CAMPFIREへ誘導
3. 代表的な返礼品3コース：500円お礼メール、7,000円トートバッグ、25,000円試験見学会（全10コース紹介ページへ誘導）
4. 2026年S-320の飛行180.67mと髙草木雄太さんの出典つき発言
5. 27代代表とパイロットの公式発言、実際の製作写真
6. S-320 3D演出：初期表示で無限「準備しています」を出さない。読み込み失敗・タイムアウト時は実際の写真＋飛行映像へフォールバック
7. S-330の資金計画：材料費約29万円、手数料約7.7万円、返礼品約4万円。概算71/19/10％。目標との端数差を明記
8. FAQ：500円から、All-inとAll-or-Nothingの違いと個別方式は未確認、決済場所、返礼品時期、領収書、金銭的リターンがないこと
9. 最後の支援CTAとX/LINE共有

## ファイル
- crowdfunding/index.html：ページ
- assets/crowdfunding/editorial-v13.css：統合されたレイアウト・レスポンシブCSS（旧workbench装飾は読み込まない）
- assets/crowdfunding/campaign-ux.js：日本時間の残日数＋3D読み込みガード
- assets/crowdfunding/flight-3d.js：3Dと操作、写真へのフォールバック
- assets/crowdfunding/clarity-v8.js：メニューと基本的な表示制御
- crowdfunding/rewards/index.html：返礼品10コースの詳細
- assets/crowdfunding/campaign-snapshot.json：2026-11-09の古いスナップショット。現在額として扱わない
- tools/test-crowdfunding-v10.mjs：ビルド時の回帰テスト
- tools/test-crowdfunding-v8.mjs / tools/qa-crowdfunding-v8.py：Playwright/Chromiumテスト

## 設計決定
- 「あなたの席」「次はあなたの番」など感情を強要する文章、紙テープ風装飾、重複する支援CTA、偽の進捗バー、画面下の固定支援バーは使わない
- 重要な支援判断（目標金額・返礼品・締切）を活動の長い物語より前に配置
- 投資、配当、利益と誤認させない。金銭的リターンはない
- 3DはS-320の演出で、S-330の実機動画ではないと明示する
- 実名・発言は元記事へのリンクを付け、引用者の顔写真であると偽らない
- 未確認の支援人数、最新金額、人気順位、返礼品の残枠、支援者の声、材料仕入れ単価を捏造しない
- CAMPFIREの個別募集方式（All-In/All-or-Nothing）は未確認。条件が確定するまでFAQでは両方式を説明し、公式ページを参照
- 領収書はCAMPFIRE公式ヘルプに基づく一般ルールを掲載し、チーム固有の発行可否は断定しない

## 品質検証
- GitHub Pages run 42959819679: success（ページ版 462ff1d）
- Browser QA run 42959819754: success（ページ版 462ff1d）
- 375x667、375x812、768x1024、1440x900で初期CTA、画像、3D操作・フォールバック、横スクロール、JavaScriptエラーを検査
- 自動テストはデザインの主観的な完成度や人間の支援意欲までは保証しない
- 実際のブラウザでチーム本人による写真選定・文面確認は未実施

## 次にやること
1. CAMPFIREの最新支援額・人数、募集方式を公式に確認し、進捗表示を可能なら手動更新（古い数字をリアルタイムと誤認させない）
2. 端末実機と実際の見た目を確認し、特に全体の長さと3Dの気持ちよさをブラッシュアップ
3. 返礼品残枠の確証が取れた場合だけ表示する
4. 部材単価・購入量が公式に確認できた場合だけ支援金額換算を実装
5. 独立した複数AIによる議論は未実施。今後の重要変更時に利用可能なら行う

## 過去の経緯
# クラウドファンディングサイト引き継ぎ

更新日: 2026-11-11（日本時間）

## 対象
- GitHub: https://github.com/ogataafjsipfjoais/shibafes2026
- 公開: https://ogataafjsipfjoais.github.io/shibafes2026/crowdfunding/
- 作業ブランチ: main
- サイト: TeamBirdmanTrial S-330「鵠」クラウドファンディング紹介ページ
- 支援先: https://camp-fire.jp/projects/990337/view

## いまの設計方針
2026年S-320 Element（180.67m）の記録と部員本人の言葉、活動写真、S-320の3D体験を残す。ただし「人情味」を理由に感動・共感・支援を強要しない。押しつけがましい「あなたの席」などの呼びかけ、支援ボタンの乱発、写真を斜めに貼った風のデザイン、紙テープ風装飾、画面下に固定された支援CTAは廃止。事実と活動風景を落ち着いた編集デザインで伝える。

- メイン: crowdfunding/index.html
- 既存ベースCSS: assets/crowdfunding/workbench-v10.css
- 新しい上書きCSS: assets/crowdfunding/documentary-v12.css
- 3D: assets/crowdfunding/flight-3d.js
- 記事操作: assets/crowdfunding/clarity-v8.js
- 返礼品の全コース: crowdfunding/rewards/index.html

## 実装済み
- ファーストビューに500円から参加できること、11月30日締切、CAMPFIREへの支援ボタン
- S-320の記録、本人のコメント（引用元のリンク付き）、27代代表・パイロットの言葉
- 感情のピーク直後の控えめな支援CTA
- 実際の製作写真、オリジナルのS-320 3Dモデ
