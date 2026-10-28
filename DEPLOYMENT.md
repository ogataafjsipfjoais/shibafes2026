# 配信と開発

## GitHub Pages

GitHub Pagesは静的配信です。PHP自体は公開せず、GitHub Actions内で公開シートの受付・ランキングを読み取り、検証・公開可否のフィルター後にJSONを生成します。main更新、手動実行、約5分間隔のスケジュールで公開します。GitHub混雑時は遅延します。取得失敗時は公開を中止し、古い表示の更新日時を進めません。サイトの「情報を更新」は現在の配信JSONを再取得する操作で、Actions実行を要求するものではありません。

検索除外の指定は使用しません。canonical・OGP・サイトマップは本番の `https://teambirdmantrial.jp/shibafes2026/` を指します。Pagesおよび公開リポジトリが検索に出る可能性があります。

```sh
python3 tools/build-release.py --target pages --output dist
```

出力先は空のフォルダーにしてください。Pagesではリポジトリ名がURLの `/shibafes2026/` になります。

## 本番

```sh
python3 tools/build-release.py --target production --output dist
```

`dist/` の中身をPHP対応サーバーの `/shibafes2026/` へ配置します。**受付・ランキングのJSONはサーバーの新しいデータを維持してください。** `.htaccess` が有効なApache環境を想定しています。サーバールートの robots.txt で本番URLをブロックしないでください。

## 整理

編集用JS/CSS、ビルドツール、現在の生成ファイルをリポジトリで管理します。公開用には依存関係をたどって必要なファイルだけ出力します。3Dモデルの動的な選択も維持します。更新後は先に `python3 tools/build-goods-hangar.py` を実行してください。

## 品質チェック

mainへの更新時には物販ページの再生成、公開ファイルの抽出、リンク・検索情報・JSON・セキュリティ設定・3Dモデルの検証を行い、成功時だけPagesに公開します。
スクラッチはrequestAnimationFrameで描画回数を制限します。Pagesではレスポンスヘッダーの任意設定ができないため、埋め込み防止等のHTTPヘッダーは本番Apache側で適用します。
