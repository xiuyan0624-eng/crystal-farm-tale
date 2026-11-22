#!/usr/bin/env python3
"""把地形道具烘焙进 PNG 的白色 die-cut 边换成场景地面色。

只改和透明区连通的近白像素（从透明区向外膨胀），所以谷仓窗框、花朵、
围栏内侧的白色细节不会被误伤。原图会先备份到 src/assets/sticker-original/。

用法：
  python3 tools/fix-outline.py [--dry-run]
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
STICKER = ROOT / "src" / "assets" / "sticker"
BACKUP = ROOT / "src" / "assets" / "sticker-original"

# 只处理立在地面上的道具；角色 / 动物 / 作物保留白色贴纸边作为前景语言
TARGETS = [
    "barn",
    "tree",
    "fence",
    "plot",
    "trough",
    "hay",
    "stones",
    "flowers",
    "wheelbarrow",
    "sign",
]

# 场景地面色 #F2ECDA。这些道具全部立在地面上，把白边换成地面色才真正贴地；
# 换成界面 paper #FBF3E7 会比地面亮一点，仍能看到一圈浅色描边。
SCENE_GROUND = (242, 236, 218)
# 白边厚度大多在 10–25px；用「离透明区的距离」而不是连通性来圈定，
# 因为有些素材的白边外面还包了一圈抗锯齿灰边，连通性会被它挡住。
MAX_STEPS = 56
MAX_DIST = 34
# 地块贴纸的白边比其它道具厚（外圈 ~40px），单独放宽
PER_TARGET_DIST = {"plot": 48}


def white_border_mask(arr: np.ndarray, max_dist: int = MAX_DIST) -> np.ndarray:
    """返回「从透明区能走到的白色 die-cut 边」掩码。

    连通性判据比纯距离稳：道具内部也有近白的细节（地块格子的亮粉、花瓣、
    窗框），它们被深色描边包着，从透明区走不进去；而白边外圈的抗锯齿灰点
    虽然不白，但 alpha<250 因此可以通行，不会再像第一版那样被一个灰点挡住。
    """
    rgb = arr[..., :3].astype(np.int16)
    alpha = arr[..., 3]
    lo = rgb.min(axis=2)
    spread = rgb.max(axis=2) - lo

    transparent = alpha <= 16
    passable = (alpha < 250) | ((lo >= 200) & (spread <= 44))
    passable |= transparent

    reachable = transparent.copy()
    for _ in range(4000):
        grown = reachable.copy()
        grown[1:, :] |= reachable[:-1, :]
        grown[:-1, :] |= reachable[1:, :]
        grown[:, 1:] |= reachable[:, :-1]
        grown[:, :-1] |= reachable[:, 1:]
        grown &= passable
        if np.array_equal(grown, reachable):
            break
        reachable = grown

    whitish = (lo >= 186) & (spread <= 46) & (alpha > 0) & ~transparent
    return reachable & whitish


def process(path: Path, dry_run: bool) -> tuple[int, int]:
    max_dist = PER_TARGET_DIST.get(path.stem, MAX_DIST)
    original = Image.open(path)
    had_alpha = original.mode in ("RGBA", "LA")
    im = original.convert("RGBA")
    arr = np.array(im)
    mask = white_border_mask(arr, max_dist)
    count = int(mask.sum())
    if count == 0:
        return 0, im.size[0] * im.size[1]

    out = arr.copy()
    out[mask, 0] = SCENE_GROUND[0]
    out[mask, 1] = SCENE_GROUND[1]
    out[mask, 2] = SCENE_GROUND[2]

    if not dry_run:
        BACKUP.mkdir(parents=True, exist_ok=True)
        backup_path = BACKUP / path.name
        if not backup_path.exists():
            shutil.copy2(path, backup_path)
        Image.fromarray(out).save(path)
        if not had_alpha:
            print(f"  ! {path.name} 原图没有 alpha，已转 RGBA 保存", file=sys.stderr)
    return count, im.size[0] * im.size[1]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    total = 0
    missing = []
    for name in TARGETS:
        path = STICKER / f"{name}.png"
        if not path.exists():
            missing.append(name)
            continue
        changed, pixels = process(path, args.dry_run)
        pct = changed / pixels * 100 if pixels else 0
        total += changed
        print(f"{name:12s} {changed:7d} px  {pct:5.2f}%  ({pixels} px)")

    if missing:
        print(f"missing: {', '.join(missing)}", file=sys.stderr)
    print(f"done: {total} px recolored{' (dry run)' if args.dry_run else ''}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
