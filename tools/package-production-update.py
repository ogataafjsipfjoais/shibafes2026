#!/usr/bin/env python3
"""Package an already validated production dist/ for safe incremental upload."""
import argparse
import hashlib
import os
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

parser = argparse.ArgumentParser(description='Create a safe /shibafes2026/ update ZIP')
parser.add_argument('--source', required=True, help='Validated production build directory')
parser.add_argument('--output', required=True, help='Destination ZIP')
parser.add_argument('--commit', default=os.environ.get('GITHUB_SHA', 'unknown'))
args = parser.parse_args()
source = Path(args.source).resolve()
output = Path(args.output).resolve()
if not source.is_dir() or not (source / 'index.html').is_file():
    raise SystemExit('Missing production build/index.html')
if source in output.parents:
    raise SystemExit('ZIP output must be outside the build directory')

# These JSON files are modified by PHP on the live server. NEVER overwrite them
# in an update package. They remain in the build for release verification only.
PRESERVE = {'content/simulator-status.json', 'content/simulator-ranking.json'}
REQUIRED = {
    '.htaccess', 'index.html', 'crowdfunding/index.html',
    'content/simulator-status.php', 'content/simulator-ranking.php',
    'content/simulator-status-lib.php', 'content/simulator-ranking-lib.php',
    'content/simulator-public-config.json',
    'assets/s320-desktop.glb', 'assets/s320-mobile.glb',
    'assets/crowdfunding/2026-tbt-running-hero.webp',
}
files = []
for file in sorted(source.rglob('*')):
    if not file.is_file():
        continue
    if file.is_symlink():
        raise SystemExit(f'Unexpected symlink: {file}')
    name = file.relative_to(source).as_posix()
    if name in PRESERVE:
        continue
    if name.startswith(('.git/', 'tools/')) or '/..' in name or name.startswith('/'):
        raise SystemExit(f'Unsafe production path: {name}')
    files.append((name, file))
selected = {name for name, _ in files}
if not REQUIRED.issubset(selected):
    raise SystemExit('Required production files missing: ' + ', '.join(sorted(REQUIRED - selected)))
if any(name in selected for name in PRESERVE):
    raise SystemExit('Mutable server data unexpectedly included')

INSTRUCTIONS = '''TBT 芝浦祭2026 本番環境 更新パッケージ
====================================

対象: https://teambirdmantrial.jp/shibafes2026/
出典: https://github.com/ogataafjsipfjoais/shibafes2026
ビルド対象: production / Apache + PHP 7.4以上

【アップロードする前に】
1. 本番 /shibafes2026/ ディレクトリを丸ごとバックアップしてください。
2. 特に content/simulator-status.json と
   content/simulator-ranking.json はバックアップを維持してください。
3. PHPのファイル書き込み権限とHTTPS外部アクセスを確認してください。

【更新方法】
1. このZIPを展開してください。
2. 「UPLOAD_TO_shibafes2026」フォルダーの**中身だけ**を、本番サーバーの
   /shibafes2026/ に同じ相対パスでアップロードして上書きします。
3. サーバー側にしか存在しないファイルは削除しないでください。
4. .htaccess は隠しファイルなので、アップロード漏れに注意してください。
5. content/simulator-status.json と simulator-ranking.json はZIPに含まれません。
   既存の本番データを残してください。初回設置用のパッケージではありません。

【更新後の確認】
・https://teambirdmantrial.jp/shibafes2026/
・https://teambirdmantrial.jp/shibafes2026/crowdfunding/
・https://teambirdmantrial.jp/shibafes2026/goodss/
・https://teambirdmantrial.jp/shibafes2026/content/simulator-status.php
・https://teambirdmantrial.jp/shibafes2026/content/simulator-ranking.php
・画像・GLBモデル・リンク・スマホ表示・PHPエラーがないか確認してください。
・不具合があれば、アップロード前のバックアップへ戻してください。

注意: ZIP作成は本番への反映ではありません。本番サーバーへのアップロードは別途必要です。
'''
manifest = [f'Commit: {args.commit}', 'Target: /shibafes2026/',
            'Preserved (not in ZIP): ' + ', '.join(sorted(PRESERVE)),
            'SHA256  bytes  relative_file_path']
for name, file in files:
    manifest.append(f'{hashlib.sha256(file.read_bytes()).hexdigest()}  {file.stat().st_size}  {name}')

output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(output, 'w', compression=ZIP_DEFLATED, compresslevel=6) as archive:
    archive.writestr('本番更新手順.txt', INSTRUCTIONS.encode('utf-8'))
    archive.writestr('ファイルSHA256一覧.txt', ('\n'.join(manifest) + '\n').encode('utf-8'))
    for name, file in files:
        archive.write(file, arcname='UPLOAD_TO_shibafes2026/' + name)
with ZipFile(output) as archive:
    bad = archive.testzip()
    if bad:
        raise SystemExit(f'Damaged ZIP entry: {bad}')
    names = set(archive.namelist())
    if any('UPLOAD_TO_shibafes2026/' + x in names for x in PRESERVE):
        raise SystemExit('Mutable data mistakenly packed')
print(f'Created {output} ({output.stat().st_size} bytes, {len(files)} upload files)')
