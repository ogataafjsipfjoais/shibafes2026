#!/usr/bin/env python3
"""Standalone /crowdfunding/2026/ package for Apache/static HTTPS hosting."""
import argparse
import hashlib
import os
import shutil
import tempfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from zipfile import ZIP_DEFLATED, ZipFile

TARGET = "https://teambirdmantrial.jp/crowdfunding/2026/"
ORIGIN = "https://ogataafjsipfjoais.github.io/shibafes2026/crowdfunding/"
ASSETS = (
    "assets/tbt-official-emblem.svg",
    "assets/crowdfunding/campaign-story-v2.css",
    "assets/crowdfunding/venue-flight-v1.css",
    "assets/crowdfunding/venue-flight-v1.js",
    "assets/crowdfunding/vendor/three-r128.min.js",
    "assets/crowdfunding/vendor/meshopt_decoder-r128.js",
    "assets/crowdfunding/vendor/GLTFLoader-r128.js",
    "assets/crowdfunding/2026-tbt-running-hero.webp",
    "assets/crowdfunding/2026-tail-lake.jpg",
    "assets/crowdfunding/2026-tail-user-photo.webp",
    "assets/s320-desktop.glb",
    "assets/s320-mobile.glb",
)

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        for attr in ("src", "href", "poster"):
            if d.get(attr):
                self.refs.append(d[attr])

def package(source: Path, output: Path, commit: str):
    if not (source / "crowdfunding/index.html").is_file():
        raise SystemExit("Missing production crowdfunding HTML")
    with tempfile.TemporaryDirectory(prefix="tbt-crowdfunding-") as temp:
        root = Path(temp) / "2026"
        root.mkdir()
        for item in ASSETS:
            src = source / item
            if not src.is_file():
                raise SystemExit("Required production asset missing: " + item)
            dst = root / item
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
        html = (source / "crowdfunding/index.html").read_text(encoding="utf-8")
        if ORIGIN not in html:
            raise SystemExit("Expected source canonical missing; review release")
        html = html.replace(ORIGIN, TARGET)
        html = html.replace(
            "https://ogataafjsipfjoais.github.io/shibafes2026/assets/crowdfunding/2026-tbt-running-hero.webp",
            TARGET + "assets/crowdfunding/2026-tbt-running-hero.webp"
        ).replace("../assets/", "assets/")
        if "ogataafjsipfjoais.github.io" in html or "/shibafes2026/" in html:
            raise SystemExit("Old deployment URL remains in HTML")
        if '<link rel="canonical" href="' + TARGET + '">' not in html:
            raise SystemExit("Wrong standalone canonical")
        (root / "index.html").write_text(html, encoding="utf-8")
        jsfile = root / "assets/crowdfunding/venue-flight-v1.js"
        js = jsfile.read_text(encoding="utf-8")
        original = "const modelPath='../assets/'+state.aircraft;"
        if js.count(original) != 1:
            raise SystemExit("Unexpected S-320 model location")
        jsfile.write_text(js.replace(original, "const modelPath='assets/'+state.aircraft;"), encoding="utf-8")
        for model in ("assets/s320-desktop.glb", "assets/s320-mobile.glb"):
            with (root / model).open("rb") as f:
                if f.read(4) != b"glTF":
                    raise SystemExit("Invalid GLB model: " + model)
        links = Links()
        links.feed(html)
        for link in links.refs:
            parsed = urlsplit(link)
            if parsed.scheme or parsed.netloc or link.startswith(("#", "data:")):
                continue
            if link.startswith("/"):
                raise SystemExit("Absolute local link: " + link)
            resolved = (root / unquote(parsed.path)).resolve()
            if not resolved.is_relative_to(root.resolve()) or not resolved.is_file():
                raise SystemExit("Missing standalone link: " + link)
        rewards = root / "rewards/index.html"
        rewards.parent.mkdir(parents=True)
        rewards.write_text('<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=https://camp-fire.jp/projects/990337/view"><title>CAMPFIRE返礼品</title></head><body><a href="https://camp-fire.jp/projects/990337/view">CAMPFIREで返礼品を見る</a></body></html>\n', encoding="utf-8")
        instructions = f"""クラファン2026 本番用 更新手順
公開先: {TARGET}
ソースコミット: {commit}

1. 本番サーバーの /crowdfunding/2026/ を事前にバックアップ。
2. ZIPを解凍。
3. ZIP内の「2026」フォルダーをサーバーの /crowdfunding/ にアップロード。
4. /crowdfunding/2026/index.html が存在することを確認。
5. トップ写真、外部CAMPFIREへのボタン、S-320の3D飛行、PCとスマホを確認。
6. 本番の他ディレクトリ・ファイルは削除しない。
7. GLBを配信できないサーバーでは .glb のMIME設定を確認。

このZIPには芝浦祭の全ページやPHP・ランキングデータは入っていません。
GitHub Pagesの更新は、本番サーバーへのアップロードとは異なります。
"""
        manifest = [f"Commit: {commit}", f"Canonical: {TARGET}", "SHA256  bytes  relative_path"]
        files = sorted(p for p in root.rglob("*") if p.is_file())
        for file in files:
            rel = file.relative_to(root).as_posix()
            manifest.append(f"{hashlib.sha256(file.read_bytes()).hexdigest()}  {file.stat().st_size}  {rel}")
        output.parent.mkdir(parents=True, exist_ok=True)
        with ZipFile(output, "w", compression=ZIP_DEFLATED, compresslevel=6) as z:
            z.writestr("アップロード手順.txt", instructions)
            z.writestr("SHA256一覧.txt", "\n".join(manifest) + "\n")
            for file in files:
                z.write(file, arcname=file.relative_to(Path(temp)).as_posix())
        with ZipFile(output) as z:
            if z.testzip() or "2026/index.html" not in z.namelist():
                raise SystemExit("Release ZIP failed validation")
        print(f"PASS: {len(files)} standalone files, {len(links.refs)} references; {output.stat().st_size} ZIP bytes")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--commit", default=os.environ.get("GITHUB_SHA", "unknown"))
    args = ap.parse_args()
    package(Path(args.source).resolve(), Path(args.output).resolve(), args.commit)
