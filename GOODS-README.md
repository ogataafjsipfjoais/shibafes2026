# TBT 芝浦祭2026 物販「HANGAR 303」

## ページ
- コレクション：/shibafes2026/goodss/
- 商品詳細：/shibafes2026/goodss/{商品ID}/
- 確認URL：https://testhpshibafes.tbt.f5.si/shibafes2026/goodss/

共通ヘッダー・フッターは既存のSiteHeader/SiteFooterと共通CSSを使用。JS未実行時のHTMLも既存ランキングページの共通プリレンダー領域から生成します。新フレームワーク・外部ライブラリ・決済・注文サーバーは追加していません。

## 商品の編集
`content/goods-catalog.json`を編集して、プロジェクトフォルダ内で次を実行します。

    python3 tools/build-goods-hangar.py

Python標準ライブラリのみで一覧・詳細HTMLとキャッシュ更新用の配信ファイルを生成します。HTMLや指紋付きファイルを直接編集しないでください。画像やJSONの変更後は、生成したファイルもまとめて反映します。

商品フィールド：
- id：半角英小文字・数字・ハイフンの一意なID。詳細URLに使用。
- sourceId：既存公開データのID。
- name / description / category：商品名・説明・カテゴリー。
- price：円の整数。未確定の販売条件は会場で確認する表示。
- images：src、width、height、altの配列。複数画像は詳細ページで順に表示し、各画像を拡大できます。
- smallSrc / smallWidth：一覧・小画面用画像。任意。
- variants：選択肢の文字列配列。未入力なら確認中表示。例 ["M / ネイビー", "L / ネイビー"]。追加時に選択必須。
- status：available（販売中）、low（残りわずか）、soldout（完売）、unconfirmed（会場確認）。
- featured：注目商品をtrueに。複数指定時は先頭を採用。
- specs：仕様の見出し・内容のペア配列。
- headingLines：長い商品名の改行位置を指定する配列。任意。
- imageNote：デザイン画像・実物写真などの説明。

画像はassets/goods/内のローカルファイルのみ受け付け、HTMLのエスケープと埋込JSONのタグ無害化を行います。商品データの不正なID・価格・画像パスなどはビルド時に拒否します。

## 掲載情報
商品名・価格・画像は、既存のcontent/shop-source.jsonから参照される公開GASの商品データを2026-10-27に確認して採用しました。トレカ、ステッカー4種、トート2種、クリアファイルの計8商品です。販売単位・素材・サイズ・在庫は元データにないため確定情報として追加していません。商品画像は掲載デザインであり、実物写真とは表示していません。説明文は掲載デザインを紹介するために追加した文章です。

既存商品のスプシ/GASが変わっても、このスナップショットは自動更新されません。JSONを編集して再生成してください。自動同期が必要な場合は、仕様・在庫・複数画像の項目を含めた元データの契約を先に揃えます。

## FLIGHT KIT
購入予定の端末内メモです。数量は1〜20、最大80種類。注文・決済・取り置きではなく、バックエンドへの送信はありません。価格はJSONの現在値から再計算します。端末保存不可時はページ内メモで継続し、その旨を表示します。再読み込み・戻る操作・別タブでの変更にも追従します。コピーと印刷/PDFの操作を用意しています。

## 演出と失敗時
ネイティブスクロールに合わせて格納庫の扉をtransformで開き、見えている領域だけをrequestAnimationFrameで更新します。商品は初期状態から表示されており、IntersectionObserverで通知されなくても消えません。JS未実行でも一覧・商品詳細・価格・会場案内・リンクが残ります。購入メモの操作ボタンはJSの初期化後にだけ表示します。共通の演出OFFとprefers-reduced-motionでは演出を削減します。

## ファイル構成・キャッシュ
- assets/goods-hangar.js / .css：編集用ソース。
- content/goods-catalog.json：商品データ。
- goodss/index.html・商品ID/index.html：生成HTML。
- assets/goods/：圧縮した本画像と小画像。
- assets/goods-hangar-{ハッシュ}.js/.css：生成される配信用ファイル。
- assets/site-chrome-goods-{ハッシュ}.js・site-bootstrap-goods-{ハッシュ}.js：同じ共通コンポーネントの配信用ファイル。別実装ではありません。
- assets/index-goods-20261027.js・Scene-goods-20261027.js・AccessWalkScene-goods-20261027.js：既存の分割モジュールの参照を揃えた配信用ファイル。

既存の3D分割モジュールはメインエントリのexportを循環参照しています。エントリ名だけ変更すると旧エントリが再実行されるため、Scene・AccessWalkとの参照も同時に揃えています。軌跡・歩行の処理は変更していません。将来これらの処理を更新する場合は、3つの配信名のバージョンを同時に上げてキャッシュを更新してください。古い配信ファイルは既存キャッシュの互換性のため残しています。

テスト用ドメインと、販売条件に未確定項目がある運用を踏まえnoindexを維持。canonical/OGPは既存方針の公式ドメインを継承しています。
