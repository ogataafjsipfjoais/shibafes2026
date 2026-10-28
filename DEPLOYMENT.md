# 配信と開発

## GitHub Pages

GitHub Pagesは静的な確認用です。PHPは公開せず、受付・ランキングはコミット時点のJSONを表示します。`sourceAvailable: false` とし、最新の受付状況と誤認させません。ライブ連携はPHP対応の本番環境で行います。

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
