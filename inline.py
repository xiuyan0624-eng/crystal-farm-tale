#!/usr/bin/env python3
"""Inline the built Vite app into one self-contained HTML file.

Game Studio's sidebar preview loads `<project>/dist/index.html` through a blob
URL, so every script, stylesheet and picture has to live inside that single
file. Vite emits separate files (and, with `base: './'`, resolves pictures via
`new URL("name.png", import.meta.url)`), so this script:

  1. re-encodes the emitted pictures to WebP capped at MAX_EDGE and turns each
     into a data: URI,
  2. rewrites every `new URL("...", import.meta.url).href` and every quoted
     picture file name in the bundle to its data: URI,
  3. folds the JS and CSS into the HTML shell.

Usage: python3 inline.py [--dist dist] [--out ../farm-tale/dist/index.html]
"""

from __future__ import annotations

import base64
import io
import json
import os
import re
import sys

from PIL import Image

# Longest edge kept for pictures. The prototype draws sprites at a few hundred
# pixels, so 512 stays sharp while keeping the single file a few megabytes.
MAX_EDGE = 512
# WebP quality for the re-encoded pictures.
QUALITY = 85

IMAGE_EXT = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'}
# 音频不重新编码（mp3 已经是压缩格式），直接塞成 data URI
AUDIO_MIME = {'.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4'}
# `new URL("sp_yaya-abc.png", import.meta.url).href` (double or single quotes,
# and the `.href` may be written with or without whitespace around the dot).
URL_PATTERN = re.compile(
    r"""new\s+URL\(\s*(["'])([^"']+)\1\s*,\s*import\.meta\.url\s*\)\s*\.\s*href""",
)


def parse_args(argv: list[str]) -> dict[str, str]:
    """Read `--dist` and `--out` from the command line."""
    options = {'dist': 'dist', 'out': ''}
    index = 0
    while index < len(argv):
        current = argv[index]
        if current in ('--dist', '--out') and index + 1 < len(argv):
            options[current[2:]] = argv[index + 1]
            index += 2
            continue
        index += 1
    return options


def data_uri(path: str) -> str:
    """Re-encode one picture and return a data URI for it."""
    with Image.open(path) as image:
        image.load()
        picture = image.convert('RGBA')
        longest = max(picture.size)
        if longest > MAX_EDGE:
            scale = MAX_EDGE / longest
            picture = picture.resize(
                (max(1, round(picture.width * scale)), max(1, round(picture.height * scale))),
                Image.LANCZOS,
            )
        buffer = io.BytesIO()
        picture.save(buffer, 'WEBP', quality=QUALITY, method=4)
        payload = base64.b64encode(buffer.getvalue()).decode('ascii')
    return f'data:image/webp;base64,{payload}'


def audio_uri(path: str, mime: str) -> str:
    """Read one audio file and return a data URI (no re-encoding)."""
    with open(path, 'rb') as handle:
        payload = base64.b64encode(handle.read()).decode('ascii')
    return f'data:{mime};base64,{payload}'


def picture_map(assets_dir: str) -> dict[str, str]:
    """Map every emitted picture / audio file name to its data URI."""
    mapping: dict[str, str] = {}
    raw_bytes = 0
    for name in sorted(os.listdir(assets_dir)):
        extension = os.path.splitext(name)[1].lower()
        path = os.path.join(assets_dir, name)
        if extension in IMAGE_EXT:
            uri = data_uri(path)
        elif extension in AUDIO_MIME:
            uri = audio_uri(path, AUDIO_MIME[extension])
        else:
            continue
        mapping[name] = uri
        raw_bytes += len(uri)
    print(f'assets: {len(mapping)} files, {raw_bytes / 1048576:.1f} MB as data URIs')
    return mapping


def inline_pictures(text: str, pictures: dict[str, str]) -> str:
    """Rewrite picture references inside JS or CSS text to their data URIs."""

    def replace_url(match: re.Match[str]) -> str:
        name = match.group(2).lstrip('./')
        uri = pictures.get(name) or pictures.get(os.path.basename(name))
        if uri is None:
            return match.group(0)
        return json.dumps(uri)

    text = URL_PATTERN.sub(replace_url, text)
    # Any remaining bare file name (quoted) becomes its data URI too; the names
    # are content-hashed, so a plain replacement cannot hit something else.
    for name, uri in pictures.items():
        for candidate in (name, f'assets/{name}', f'/assets/{name}', f'./assets/{name}'):
            quoted = f'"{candidate}"'
            if quoted in text:
                text = text.replace(quoted, json.dumps(uri))
            single = f"'{candidate}'"
            if single in text:
                text = text.replace(single, json.dumps(uri))
    return text


def main() -> int:
    """Run the inliner and write the single-file HTML."""
    options = parse_args(sys.argv[1:])
    dist = options['dist']
    out = options['out'] or os.path.join(os.path.dirname(dist), 'index.single.html')
    assets_dir = os.path.join(dist, 'assets')
    html_path = os.path.join(dist, 'index.html')

    with open(html_path, encoding='utf-8') as handle:
        html = handle.read()

    pictures = picture_map(assets_dir)

    scripts = re.findall(r'<script[^>]*src="([^"]+)"[^>]*>\s*</script>', html)
    styles = re.findall(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', html)
    if len(scripts) != 1:
        raise SystemExit(f'expected one script tag in {html_path}, found {len(scripts)}')

    js = ''
    for source in scripts:
        with open(os.path.join(dist, source.lstrip('./')), encoding='utf-8') as handle:
            js += handle.read()
    css = ''
    for source in styles:
        with open(os.path.join(dist, source.lstrip('./')), encoding='utf-8') as handle:
            css += handle.read()

    js = inline_pictures(js, pictures)
    css = inline_pictures(css, pictures)
    if 'import.meta.url' in js:
        leftovers = len(URL_PATTERN.findall(js))
        print(f'warning: {leftovers} `new URL(..., import.meta.url)` left in the bundle')

    # Fold everything into the shell: CSS in the head, module script at the end.
    html = re.sub(r'<script[^>]*src="[^"]+"[^>]*>\s*</script>\s*', '', html)
    html = re.sub(r'<link[^>]*rel="stylesheet"[^>]*>\s*', '', html)
    html = html.replace('</head>', f'<style>{css}</style></head>')
    html = html.replace('</body>', f'<script type="module">{js}</script></body>')

    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as handle:
        handle.write(html)
    print(f'wrote {out} ({os.path.getsize(out) / 1048576:.1f} MB)')

    # The Game Studio wrapper (wrap-gamejs.mjs) mounts the app into the studio's
    # own shell instead of replacing the document, so it needs the two halves on
    # their own as well: the same CSS and the same bundled JS.
    base, _extension = os.path.splitext(out)
    css_out = base + '.css'
    js_out = base + '.js'
    with open(css_out, 'w', encoding='utf-8') as handle:
        handle.write(css)
    with open(js_out, 'w', encoding='utf-8') as handle:
        handle.write(js)
    print(f'wrote {css_out} ({os.path.getsize(css_out) / 1024:.0f} KB), {js_out} ({os.path.getsize(js_out) / 1048576:.1f} MB)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
