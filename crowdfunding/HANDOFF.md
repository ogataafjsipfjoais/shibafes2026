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
- 実際の製作写真、オリジナルのS-320 3Dモデル、S-330の実機映像ではない注記
- 29万円の翼材料費を中心にした資金計画
- 返礼品3コース（500円メール、7,000円トート、25,000円見学会）
- 支援額の現在値は未検証のため掲載せず、CAMPFIREの公式値へ誘導
- ページ下部の支援CTA、全10コース紹介へのリンク

## 重要な判断と注意
- 確認できない仕入れ単価から「500円で部材○個」などは捏造しない。
- 実績が未確認なので「一番選ばれている」など人気を断定しない。「おすすめ」は編集上の提案。
- 3DはS-320の演出で、S-330の実機映像ではない。
- 写真は活動記録であり、近くにある人物の引用発言者を写しているとは断定しない。
- 別サイトである芝浦祭トップや既存の返礼品一覧を無断で改変しない。

## 検証
- 静的テスト: tools/test-crowdfunding-v10.mjs / tools/test-crowdfunding-v8.mjs
- Chromium: tools/qa-crowdfunding-v8.py、375x667・375x812・768x1024・1440x900
- デプロイ: .github/workflows/pages.yml
- 初回の落ち着いた版はChromium QAに成功（run 42848253337）。最新の外部CSS切り出し版は再検証を要する。

## 残課題
1. 外部CSS版のGitHub Pagesビルド・デプロイ・Chromium QAを確認する。
2. 実画面を人間の目で評価し、特に写真の選定や文章の距離感を見直す。自動テスト合格はデザインの良さを保証しない。
3. CAMPFIREの最新額を検証できる安全な同期手段が決まるまでは、進捗数値・バーを出さない。
4. 部材の単価・購入数量は公式に確認できてから金額換算を掲載。
5. 長期的に旧workbench-v10.cssの不要な装飾ルールを整理し、新CSSへ統合する。
