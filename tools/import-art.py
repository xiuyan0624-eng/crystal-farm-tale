#!/usr/bin/env python3
"""把 GPT 出的四张图（纯白底 1024×1024）接进游戏素材目录。

处理链：
  1. 从图边泛洪去掉纯白背景（只删和画面边连通的近白，保护贴纸内部的奶油色/高光）；
  2. 只保留足够大的连通块（清掉人参左边那块游离白斑之类的碎片）；
  3. 裁到内容外接框，四周留统一留白；
  4. 按用途缩放到目标尺寸；
  5. 地块额外把奶油色 die-cut 边换成场景地面色 #F2ECDA（它要贴地，和地形道具一套语言）。

用法：
  python3 tools/import-art.py           # 处理并写入 src/assets/sticker/
  python3 tools/import-art.py --dry-run # 只打印尺寸，不写文件
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INCOMING = ROOT / "incoming-art"
STICKER = ROOT / "src" / "assets" / "sticker"
BACKUP = ROOT / "src" / "assets" / "sticker-original"

SCENE_GROUND = (242, 236, 218)  # 与 fix-outline.py 一致

# 名字 → (输出文件名, 目标最大宽, 目标最大高, 是否把白边换成地面色, 留白比例)
# 农场主换装：两性别 × 三套服装（linen/embroidery/star）
JOBS_OWNERS = {
    f"owner_{gender}_{slug}": (f"owner_{gender}_{slug}.png", 900, 900, False, 0.03)
    for gender in ("girl", "boy")
    for slug in ("linen", "embroidery", "star", "rain", "festival", "winter")
}

JOBS_SCENE = {
    "barn": ("barn.png", 560, 500, False, 0.02),
    "tree": ("tree.png", 300, 360, False, 0.02),
    "fence": ("fence.png", 230, 110, False, 0.02),
    "hay": ("hay.png", 210, 150, False, 0.02),
    "stones": ("stones.png", 200, 130, False, 0.02),
    "flowers": ("flowers.png", 230, 145, False, 0.02),
    "wheelbarrow": ("wheelbarrow.png", 210, 152, False, 0.02),
    "sign": ("sign.png", 200, 200, False, 0.02),
    "trough": ("trough.png", 220, 116, False, 0.02),
    "plot": ("plot.png", 440, 440, False, 0.02),
}

JOBS_REDRAW = {
    "girl": ("girl.png", 640, 760, False, 0.03),
    "boy": ("boy.png", 640, 760, False, 0.03),
    "chicken": ("chicken.png", 470, 470, False, 0.05),
    "sheep": ("sheep.png", 450, 450, False, 0.05),
    "cow": ("cow.png", 480, 480, False, 0.05),
    "crop_carrot": ("crop_carrot.png", 900, 1000, False, 0.05),
    "crop_leaf": ("crop_leaf.png", 900, 1000, False, 0.05),
    "crop_corn": ("crop_corn.png", 900, 1000, False, 0.05),
    "crop_pumpkin": ("crop_pumpkin.png", 900, 1000, False, 0.05),
    "crop_berry": ("crop_berry.png", 900, 1000, False, 0.05),
}

JOBS_FIRST = {
    "plot": ("plot.png", 420, 420, True, 0.04),
    "crop_tomato": ("crop_tomato.png", 900, 900, False, 0.05),
    "crop_ginseng": ("crop_ginseng.png", 760, 1000, False, 0.05),
    "bee": ("bee.png", 512, 512, False, 0.06),
}

# 第二批：魔物 / 成体精灵 / 地形重画
JOBS_NEXT = {
    "monster_slime": ("monster_slime.png", 560, 560, False, 0.05),
    "monster_boar": ("monster_boar.png", 560, 560, False, 0.05),
    "monster_wolf": ("monster_wolf.png", 560, 560, False, 0.05),
    "monster_turtle": ("monster_turtle.png", 560, 560, False, 0.05),
    "monster_golem": ("monster_golem.png", 560, 560, False, 0.05),
    "monster_dragon": ("monster_dragon.png", 560, 560, False, 0.05),
    "boss_dragonking": ("boss_dragonking.png", 760, 760, False, 0.05),
    "spirit_wood_adult": ("spirit_wood_adult.png", 640, 640, False, 0.05),
    "spirit_wood_final": ("spirit_wood_final.png", 640, 640, False, 0.05),
    "spirit_water_adult": ("spirit_water_adult.png", 640, 640, False, 0.05),
    "spirit_water_final": ("spirit_water_final.png", 640, 640, False, 0.05),
    "spirit_fire_adult": ("spirit_fire_adult.png", 640, 640, False, 0.05),
    "spirit_fire_final": ("spirit_fire_final.png", 640, 640, False, 0.05),
    "spirit_earth_adult": ("spirit_earth_adult.png", 640, 640, False, 0.05),
    "spirit_earth_final": ("spirit_earth_final.png", 640, 640, False, 0.05),
    "spirit_light_adult": ("spirit_light_adult.png", 640, 640, False, 0.05),
    "spirit_light_final": ("spirit_light_final.png", 640, 640, False, 0.05),
    "barn": ("barn.png", 900, 900, True, 0.04),
    "tree": ("tree.png", 900, 900, True, 0.04),
    "fence": ("fence.png", 900, 900, True, 0.03),
}

PURE_WHITE = 249          # 三通道都 >= 这个值就当背景白
MIN_KEEP_RATIO = 0.02     # 小于最大连通块 2% 的碎片丢掉


def flood_white(rgb: np.ndarray) -> np.ndarray:
    """从四条边向内泛洪，返回背景掩码（True=背景）。"""
    h, w = rgb.shape[:2]
    near_white = (rgb.min(axis=2) >= PURE_WHITE)
    # 背景从边缘能走到的近白区域（8 邻域）
    bg = np.zeros((h, w), np.bool_)
    stack = []
    for x in range(w):
        for y in (0, h - 1):
            if near_white[y, x] and not bg[y, x]:
                bg[y, x] = True
                stack.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near_white[y, x] and not bg[y, x]:
                bg[y, x] = True
                stack.append((y, x))
    while stack:
        y, x = stack.pop()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and near_white[ny, nx]:
                    bg[ny, nx] = True
                    stack.append((ny, nx))
    return bg


def flood_pale(rgb: np.ndarray) -> np.ndarray:
    """奶油底泛洪：农场主换装图是奶油纸底（不是纯白），die-cut 边和背景同色，一刀全收掉，稍后由 normalize 重建边。"""
    h, w = rgb.shape[:2]
    mn = rgb.min(axis=2); mx = rgb.max(axis=2)
    near_pale = (mn >= 228) & ((mx - mn) <= 30)
    bg = np.zeros((h, w), np.bool_)
    stack = []
    for x in range(w):
        for y in (0, h - 1):
            if near_pale[y, x] and not bg[y, x]:
                bg[y, x] = True; stack.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near_pale[y, x] and not bg[y, x]:
                bg[y, x] = True; stack.append((y, x))
    while stack:
        y, x = stack.pop()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and near_pale[ny, nx]:
                    bg[ny, nx] = True; stack.append((ny, nx))
    return bg


def flood_bg(rgb: np.ndarray, tol: int = 22) -> np.ndarray:
    """按四角采样底色泛洪（奶油底/浅灰底都能吃），边界抗锯齿容差用 tol。"""
    h, w = rgb.shape[:2]
    corners = np.array([rgb[0, 0], rgb[0, w - 1], rgb[h - 1, 0], rgb[h - 1, w - 1]], dtype=np.int16)
    seed = np.median(corners, axis=0)
    near = (np.abs(rgb - seed).max(axis=2) <= tol)
    bg = np.zeros((h, w), np.bool_)
    stack = []
    for x in range(w):
        for y in (0, h - 1):
            if near[y, x] and not bg[y, x]:
                bg[y, x] = True; stack.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near[y, x] and not bg[y, x]:
                bg[y, x] = True; stack.append((y, x))
    while stack:
        y, x = stack.pop()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and near[ny, nx]:
                    bg[ny, nx] = True; stack.append((ny, nx))
    return bg


def keep_big_components(mask: np.ndarray, min_ratio: float) -> np.ndarray:
    """只保留面积足够大的连通块。"""
    h, w = mask.shape
    label = np.zeros((h, w), np.int32)
    cur = 0
    areas = [0]
    for y in range(h):
        for x in range(w):
            if mask[y, x] and label[y, x] == 0:
                cur += 1
                label[y, x] = cur
                stack = [(y, x)]
                area = 0
                while stack:
                    cy, cx = stack.pop()
                    area += 1
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and label[ny, nx] == 0:
                                label[ny, nx] = cur
                                stack.append((ny, nx))
                areas.append(area)
    biggest = max(areas[1:]) if cur else 0
    out = np.zeros((h, w), np.bool_)
    for i in range(1, cur + 1):
        if areas[i] < biggest * min_ratio:
            continue
        ys, xs = np.where(label == i)
        bh, bw = ys.max() - ys.min() + 1, xs.max() - xs.min() + 1
        # 细长条多半是相邻生成的残片（玄龟左边那一条），主体不会是这个比例
        if min(bw, bh) <= max(h, w) * 0.05 and max(bw, bh) >= max(h, w) * 0.12:
            continue
        touch_edge = ys.min() == 0 or xs.min() == 0 or ys.max() == h - 1 or xs.max() == w - 1
        if touch_edge and areas[i] < biggest * 0.2:
            continue
        out |= (label == i)
    return out


def recolor_outline(arr: np.ndarray, color: tuple[int, int, int]) -> int:
    """把和透明区连通的奶油色 die-cut 边换成地面色（只影响外圈）。"""
    rgb = arr[..., :3].astype(np.int16)
    alpha = arr[..., 3]
    lo = rgb.min(axis=2)
    spread = rgb.max(axis=2) - lo
    # 外圈奶油：够亮、彩度低；内部亮色（石子、格子高光）彩度更高或更暗
    creamy = (lo >= 224) & (spread <= 30) & (alpha > 0)
    h, w = alpha.shape
    # 从透明区向里膨胀，最多 46 步
    reach = np.zeros((h, w), np.bool_)
    reach[alpha == 0] = True
    frontier = reach.copy()
    for _ in range(46):
        grown = frontier.copy()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dy == 0 and dx == 0:
                    continue
                ys = slice(max(0, dy), h + min(0, dy))
                xs = slice(max(0, dx), w + min(0, dx))
                yd = slice(max(0, -dy), h + min(0, -dy))
                xd = slice(max(0, -dx), w + min(0, -dx))
                grown[yd, xd] |= frontier[ys, xs]
        new = grown & ~frontier
        if not new.any():
            break
        frontier = grown
    target = creamy & frontier
    arr[..., 0][target] = color[0]
    arr[..., 1][target] = color[1]
    arr[..., 2][target] = color[2]
    return int(target.sum())


def process(name: str, out_name: str, max_w: int, max_h: int, ground_outline: bool, pad_ratio: float, src_dir: Path, pale: bool = False) -> None:
    src = src_dir / f"{name}.png"
    if not src.exists():
        print(f"  ✗ 缺文件 {src.relative_to(ROOT)}", file=sys.stderr)
        return
    im = Image.open(src).convert("RGBA")
    arr = np.array(im)
    rgb = arr[..., :3].astype(np.int16)

    bg = flood_bg(rgb) if pale else flood_white(rgb)
    arr[..., 3][bg] = 0
    keep = keep_big_components(arr[..., 3] > 0, MIN_KEEP_RATIO)
    arr[..., 3][~keep] = 0

    reco = 0
    if ground_outline:
        reco = recolor_outline(arr, SCENE_GROUND)

    ys, xs = np.where(arr[..., 3] > 0)
    top, bottom, left, right = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    token = Image.fromarray(arr[top:bottom, left:right], "RGBA")

    cw, ch = token.size
    pad = int(round(max(cw, ch) * pad_ratio))
    canvas = Image.new("RGBA", (cw + pad * 2, ch + pad * 2), (0, 0, 0, 0))
    canvas.alpha_composite(token, (pad, pad))

    scale = min(max_w / canvas.width, max_h / canvas.height, 1.0)
    if scale < 1.0:
        canvas = canvas.resize((max(1, round(canvas.width * scale)), max(1, round(canvas.height * scale))), Image.LANCZOS)

    if name == "plot":
        # 地块要按 PLOT_SIZE×PLOT_SIZE 的正方形绘制，先补成正方画布，避免拉伸
        side = max(canvas.size)
        square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        square.alpha_composite(canvas, ((side - canvas.width) // 2, (side - canvas.height) // 2))
        canvas = square

    dst = STICKER / out_name
    print(f"  {name}: {im.size} → {canvas.size}  bg={int(bg.sum())}px  碎片清理=yes  白边染色={reco}px  → {dst.relative_to(ROOT)}")
    if not DRY_RUN:
        if dst.exists() and name == "plot":
            # 旧地块原图另存一份，sticker-original/ 里保留的是更早那版
            shutil.copy2(dst, BACKUP / "plot-pink-before-gpt.png")
        canvas.save(dst, "PNG", optimize=True)



# 第三批：补齐 15 只幼体精灵（30 只幼体里此前只有 15 张专属贴纸）
JOBS_BABIES = {
    "sp_xianggutongzi": ("sp_xianggutongzi.png", 640, 640, False, 0.05),
    "sp_pugongying": ("sp_pugongying.png", 640, 640, False, 0.05),
    "sp_shijiemiao": ("sp_shijiemiao.png", 640, 640, False, 0.05),
    "sp_yunduoshou": ("sp_yunduoshou.png", 640, 640, False, 0.05),
    "sp_zhenzhubei": ("sp_zhenzhubei.png", 640, 640, False, 0.05),
    "sp_chaoxi": ("sp_chaoxi.png", 640, 640, False, 0.05),
    "sp_denglonggui": ("sp_denglonggui.png", 640, 640, False, 0.05),
    "sp_zhadanji": ("sp_zhadanji.png", 640, 640, False, 0.05),
    "sp_zhuque": ("sp_zhuque.png", 640, 640, False, 0.05),
    "sp_nirenou": ("sp_nirenou.png", 640, 640, False, 0.05),
    "sp_jingkuangshou": ("sp_jingkuangshou.png", 640, 640, False, 0.05),
    "sp_qilin": ("sp_qilin.png", 640, 640, False, 0.05),
    "sp_liuxinghu": ("sp_liuxinghu.png", 640, 640, False, 0.05),
    "sp_xuyuandeng": ("sp_xuyuandeng.png", 640, 640, False, 0.05),
    "sp_xinghuilong": ("sp_xinghuilong.png", 640, 640, False, 0.05),
}

# 第五批：五张战斗背景（整幅不透明插画，不需要抠白底，按 16:9 裁切缩放）
BATTLE = ROOT / "src" / "assets" / "battle"

def process_bg(name: str, el: str, src_dir: Path) -> None:
    src = src_dir / f"{name}.png"
    if not src.exists():
        print(f"  ✗ 缺文件 {src.relative_to(ROOT)}", file=sys.stderr)
        return
    im = Image.open(src).convert("RGBA")
    # 铺满 16:9：先等比缩放到覆盖，再居中裁切
    target_w, target_h = 1536, 864
    scale = max(target_w / im.width, target_h / im.height)
    resized = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    left = (resized.width - target_w) // 2
    top = (resized.height - target_h) // 2
    out = resized.crop((left, top, left + target_w, top + target_h)).convert("RGB")
    dst = BATTLE / f"bg_{el}.png"
    print(f"  {name}: {im.size} → {out.size}  → {dst.relative_to(ROOT)}")
    if not DRY_RUN:
        BATTLE.mkdir(parents=True, exist_ok=True)
        out.save(dst, "PNG", optimize=True)

# 第三批：温室/池塘两种新作物
JOBS_HOUSING = {
    'coop': ('coop.png', 300, 280, False, 0.05),
    'pen': ('pen.png', 340, 230, False, 0.05),
    'cowshed': ('cowshed.png', 380, 300, False, 0.05),
    'hive': ('hive.png', 200, 300, False, 0.05),
}

JOBS_LEGENDS = {
    'sp_shangushumo': ('sp_shangushumo.png', 900, 900, False, 0.05),
    'sp_shengmingzhishu': ('sp_shengmingzhishu.png', 900, 900, False, 0.05),
    'sp_shijiemiao': ('sp_shijiemiao.png', 900, 900, False, 0.05),
    'sp_canghai': ('sp_canghai.png', 900, 900, False, 0.05),
    'sp_jibingnvwang': ('sp_jibingnvwang.png', 900, 900, False, 0.05),
    'sp_chaoxi': ('sp_chaoxi.png', 900, 900, False, 0.05),
    'sp_yanyuzhanshen': ('sp_yanyuzhanshen.png', 900, 900, False, 0.05),
    'sp_dixinyanmo': ('sp_dixinyanmo.png', 900, 900, False, 0.05),
    'sp_zhuque': ('sp_zhuque.png', 900, 900, False, 0.05),
    'sp_daditan': ('sp_daditan.png', 900, 900, False, 0.05),
    'sp_huangmozhuzhu': ('sp_huangmozhuzhu.png', 900, 900, False, 0.05),
    'sp_qilin': ('sp_qilin.png', 900, 900, False, 0.05),
    'sp_chenxinvshen': ('sp_chenxinvshen.png', 900, 900, False, 0.05),
    'sp_yuehuaxian': ('sp_yuehuaxian.png', 900, 900, False, 0.05),
    'sp_xinghuilong': ('sp_xinghuilong.png', 900, 900, False, 0.05),
}

JOBS_CROPS2 = {
    "crop_lotus": ("crop_lotus.png", 900, 900, False, 0.05),
    "crop_orchid": ("crop_orchid.png", 900, 900, False, 0.05),
}

JOBS_BG = {
    "bg_wood": ("wood",), "bg_fire": ("fire",), "bg_water": ("water",),
    "bg_earth": ("earth",), "bg_light": ("light",),
}


def main() -> None:
    global DRY_RUN
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--batch", choices=["first", "next", "babies", "bg", "crops2", "owners", "legends", "redraw", "scene", "housing"], default="first", help="first=第一批四张；next=魔物/精灵/地形；babies=补齐的 15 只幼体；bg=五张战斗背景；crops2=兰花/莲藕；owners=农场主三套服装；legends=15 只传说立绘")
    args = ap.parse_args()
    DRY_RUN = args.dry_run
    STICKER.mkdir(parents=True, exist_ok=True)
    BACKUP.mkdir(parents=True, exist_ok=True)
    if args.batch == "bg":
        src_dir = INCOMING / "bg"
        print(f"处理 {len(JOBS_BG)} 张战斗背景{'（dry-run，不写盘）' if DRY_RUN else ''}：")
        for name, (el,) in JOBS_BG.items():
            process_bg(name, el, src_dir)
        return
    if args.batch == "crops2":
        src_dir = INCOMING / "crops2"
        print(f"处理 {len(JOBS_CROPS2)} 张新作物：")
        for name, (out_name, mw, mh, ground, pad) in JOBS_CROPS2.items():
            process(name, out_name, mw, mh, ground, pad, src_dir, pale=args.batch in ('legends', 'owners'))
        return
    if args.batch == "owners":
        src_dir = INCOMING / "owners"
        print(f"处理 {len(JOBS_OWNERS)} 张农场主换装：")
        for name, (out_name, mw, mh, ground, pad) in JOBS_OWNERS.items():
            process(name, out_name, mw, mh, ground, pad, src_dir, pale=True)
        return
    jobs = {"first": JOBS_FIRST, "next": JOBS_NEXT, "babies": JOBS_BABIES, "legends": JOBS_LEGENDS, "redraw": JOBS_REDRAW, "scene": JOBS_SCENE, "housing": JOBS_HOUSING}[args.batch]
    src_dir = INCOMING if args.batch == "first" else INCOMING / "next"
    print(f"处理 {len(jobs)} 张图（{args.batch}）{'（dry-run，不写盘）' if DRY_RUN else ''}：")
    for name, (out_name, mw, mh, ground, pad) in jobs.items():
        process(name, out_name, mw, mh, ground, pad, src_dir, pale=args.batch in ('legends', 'redraw', 'scene', 'housing'))


if __name__ == "__main__":
    main()
