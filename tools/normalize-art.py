#!/usr/bin/env python3
"""统一美术资产规格（C 方案第 2 步）。

只做"规格对齐"，不改构图、不重画：

  1. 描边色归一：把偏暗的线条像素的色相往统一棕 #5A4335 拉（保留明暗与细节，黑眼珠不受影响）；
  2. 白边归一：先把原图外圈很虚的发光收紧，再统一补一圈 die-cut 边
     - 角色/作物/精灵/魔物 → 奶油白 #FDF7EC
     - 贴地布景（谷仓/树/围栏/地块/草垛/水槽/石子/花/独轮车/木牌…）→ 场景地面色 #F2ECDA，贴地时不会有白圈
  3. 饱和度归一：每张按分组目标做温和缩放（±12% 以内），把"旧图偏淡 / 新图偏艳"拉回同一档。

原图先备份到 src/assets/sticker-pre-normalize/，之后每次都从备份读取，重复运行不会叠加白边。

用法：
  python3 tools/normalize-art.py --dry-run    # 只打印将要做的改动
  python3 tools/normalize-art.py             # 原地规范化 src/assets/sticker/*.png
  python3 tools/normalize-art.py --samples   # 额外输出前后对比样例 /tmp/normalize-samples.png
"""
from __future__ import annotations

import argparse
import shutil
import colorsys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
STICKER = ROOT / "src" / "assets" / "sticker"
BACKUP = ROOT / "src" / "assets" / "sticker-pre-normalize"

OUTLINE = (0x5A, 0x43, 0x35)      # 统一描边色
RING_CREAM = (0xFD, 0xF7, 0xEC)   # 奶油 die-cut 边
RING_GROUND = (0xF2, 0xEC, 0xDA)  # 贴地布景用地面色

# 已在接入时手工调过边色的资产：不再参与归一（重复剥边+补边会把土壤色冲淡）
# plot 以前是手绘粉色地块、不能动；现在换成新画的土壤地块，也要归一（只是不加贴纸边）
SKIP = set()

# 早期手绘图带一圈"实心浅色晕"，轮廓本身是虚的：把这些资产多收进去一圈再补边
SOFT_HALO = {
    "chicken", "sheep", "cow", "girl", "boy",
    "hay", "trough", "stones", "flowers", "wheelbarrow", "sign", "watering_can", "milk_jar",
    "crop_carrot", "crop_leaf", "crop_corn", "crop_pumpkin", "crop_berry",
    "sp_yaya", "sp_hualing", "sp_tengxu", "sp_huomiao", "sp_shuizhu", "sp_xingchen", "sp_lulu", "sp_tanqiu",
}
# 这 15 只是重新出的传说立绘：已经不是柔边老图，要重建 die-cut 边
LEGEND_REPLACED = {
    "sp_shangushumo", "sp_shengmingzhishu", "sp_shijiemiao", "sp_canghai", "sp_jibingnvwang",
    "sp_chaoxi", "sp_yanyuzhanshen", "sp_dixinyanmo", "sp_zhuque", "sp_daditan",
    "sp_huangmozhuzhu", "sp_qilin", "sp_chenxinvshen", "sp_yuehuaxian", "sp_xinghuilong",
}
SOFT_HALO -= LEGEND_REPLACED
# 这一批是重画的老资产：要重建 die-cut 边
REDRAW_REPLACED = {"girl", "boy", "chicken", "sheep", "cow",
                   "crop_carrot", "crop_leaf", "crop_corn", "crop_pumpkin", "crop_berry"}
SOFT_HALO -= REDRAW_REPLACED
# 场景布景：不戴贴纸边（布景要"长在地里"，不能再有奶油圈）
NO_RING = {"barn", "tree", "fence", "hay", "trough", "stones",
           "flowers", "wheelbarrow", "sign", "plot",
           "coop", "pen", "cowshed", "hive",
           # 世界里的活物和作物也不要贴纸边：靠描边和投影跟场景分开
           "chicken", "sheep", "cow", "bee", "girl", "boy",
           "crop_carrot", "crop_leaf", "crop_corn", "crop_pumpkin", "crop_berry",
           "crop_tomato", "crop_ginseng", "crop_lotus", "crop_orchid"}

# 贴地布景：白边换成地面色
GROUND_PROPS = {
    "plot", "barn", "tree", "fence", "hay", "trough", "stones", "flowers",
    "wheelbarrow", "sign", "shovel", "watering_can", "basket", "milk_jar",
    "bucket", "turnip", "sprout", "strawberry_basket", "strawberry_bucket",
}

# 分组饱和度目标（None = 不调）
GROUP_SAT = {
    "animal": ({"chicken", "sheep", "cow", "bee", "cat", "dog", "pig", "horse", "rabbit", "ducks", "hen_chicks"}, 0.30),
    "crop": ({"crop_carrot", "crop_leaf", "crop_corn", "crop_pumpkin", "crop_berry",
              "crop_tomato", "crop_ginseng", "crop_lotus", "crop_orchid", "carrot", "turnip", "corn"}, 0.50),
    "prop": ({"barn", "tree", "fence", "hay", "trough", "stones", "flowers", "wheelbarrow",
              "sign", "shovel", "watering_can", "basket", "milk_jar", "bucket",
              "strawberry_basket", "strawberry_bucket", "sprout"}, 0.33),
    "plot": ({"plot"}, 0.46),
    "human": ({"girl", "boy"}, None),
    "spirit": (None, 0.42),          # sp_* / spirit_* / monster_* / boss_*
}

DRY = False


def target_sat(stem: str) -> float | None:
    for name, (members, sat) in GROUP_SAT.items():
        if name == "spirit":
            if stem.startswith(("sp_", "spirit_", "monster_", "boss_")):
                return sat
            continue
        if members and stem in members:
            return sat
    return None


def ring_color(stem: str) -> tuple[int, int, int]:
    return RING_GROUND if stem in GROUND_PROPS else RING_CREAM


def peel_border(im: Image.Image) -> Image.Image:
    """把原有的 die-cut 白边/奶油边从外圈剥掉（只剥和透明区连通的近白像素），
    这样后面才能补一圈厚度统一的边；内部的高光/白花因为被描边包围不会被剥。"""
    a = np.array(im).astype(np.float32)
    alpha = a[..., 3]
    h, w = alpha.shape
    rgb = a[..., :3]
    mx = rgb.max(2)
    mn = rgb.min(2)
    spread = mx - mn
    # 近奶白：#FDF7EC / #F2ECDA 一类的低饱和亮色
    whitish = (mn >= 205) & (mx >= 220) & (spread <= 26) & (alpha > 0)
    trans = alpha < 24
    # 可通行：透明区或近奶白 —— 允许沿白边一圈一圈往里走
    passable = trans | whitish
    reach = trans.copy()
    # 只剥贴边的一圈：距离透明区不超过 3% 最长边
    dist = np.where(trans, 0, 10 ** 6).astype(np.int32)
    max_steps = max(3, int(max(h, w) * 0.03))
    for _ in range(max_steps):
        grown = reach.copy()
        grown[1:, :] |= reach[:-1, :]
        grown[:-1, :] |= reach[1:, :]
        grown[:, 1:] |= reach[:, :-1]
        grown[:, :-1] |= reach[:, 1:]
        grown &= passable
        if np.array_equal(grown, reach):
            break
        reach = grown
        dist = np.where(reach & passable, np.minimum(dist, 1) + 0, dist)
    cut = reach & whitish
    a[..., 3] = np.where(cut, 0, alpha)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")


def tighten_halo(im: Image.Image) -> Image.Image:
    """把原始很虚的外发光收紧成 1px 抗锯齿边（避免叠加后出现双圈）。"""
    a = np.array(im).astype(np.float32)
    alpha = a[..., 3]
    # 0..1 的硬核，再轻微模糊保留抗锯齿
    core = np.clip((alpha - 60.0) / (255.0 - 60.0), 0, 1)
    a[..., 3] = core * 255
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def harmonize_outline(im: Image.Image) -> Image.Image:
    """把暗部线条的色相往统一棕拉：只动暗且有一定颜色的像素。"""
    a = np.array(im).astype(np.float32) / 255.0
    rgb, alpha = a[..., :3], a[..., 3]
    mx = rgb.max(2)
    mn = rgb.min(2)
    sat = np.where(mx > 1e-5, (mx - mn) / np.maximum(mx, 1e-5), 0)
    # 暗部（线条/暗面）+ 有颜色 + 可见
    w = np.clip((0.46 - mx) / 0.46, 0, 1) * np.clip((sat - 0.08) / 0.35, 0, 1) * (alpha > 0.25)
    w = (w * 0.85)[..., None]
    target = np.array(OUTLINE, dtype=np.float32) / 255.0
    # 用目标色的相对亮度替换原暗部的色度，但保留原有明暗层次
    lum = (rgb * np.array([0.299, 0.587, 0.114], dtype=np.float32)).sum(2, keepdims=True)
    target_lum = float((target * np.array([0.299, 0.587, 0.114], dtype=np.float32)).sum())
    mapped = target[None, None, :] * (lum / max(target_lum, 1e-5))
    mapped = np.clip(mapped, 0, 1)
    out = rgb * (1 - w) + mapped * w
    b = np.concatenate([out, alpha[..., None]], axis=2)
    return Image.fromarray((np.clip(b, 0, 1) * 255).astype(np.uint8), "RGBA")


def mean_sat(im: Image.Image) -> float:
    a = np.array(im).astype(np.float32) / 255.0
    alpha = a[..., 3]
    m = alpha > 0.6
    if m.sum() == 0:
        return 0.0
    rgb = a[..., :3][m]
    mx = rgb.max(1)
    mn = rgb.min(1)
    sat = np.where(mx > 1e-5, (mx - mn) / np.maximum(mx, 1e-5), 0)
    return float(sat.mean())


def clean_mask(im: Image.Image) -> Image.Image:
    """把 alpha 收成干净的外轮廓：中值 + 轻微模糊 + 平滑阈值，去掉剥边留下的锯齿/凹口。"""
    a = np.array(im)[..., 3]
    core = Image.fromarray(((a > 120) * 255).astype(np.uint8), "L")
    core = core.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(1.0))
    core = core.point(lambda v: 255 if v > 108 else 0)
    return core


def add_ring(im: Image.Image, color: tuple[int, int, int], soft: bool = False) -> Image.Image:
    """用干净轮廓重建 die-cut 边：先铺不透明边，再把本体裁到轮廓内叠上去。"""
    w, h = im.size
    r = max(3, min(14, round(max(w, h) * 0.012)))
    if soft:
        # 早期手绘的"实心浅色晕"是画的一部分（羊毛、花朵的柔边），硬收会留下描边碎片；
        # 这批只做描边色/饱和度归一，保留原来的柔边，不再补 die-cut 边
        return im
    core = clean_mask(im)
    core_np = np.array(core)
    # 画布四边各撑大 pad，白边才不会被画布边界裁掉
    pad = r + 2
    W, H = w + pad * 2, h + pad * 2
    corep = np.zeros((H, W), dtype=np.uint8)
    corep[pad:pad + h, pad:pad + w] = core_np
    core_img = Image.fromarray(corep, "L")
    dil = np.array(core_img.filter(ImageFilter.MaxFilter(2 * r + 1)))

    canvas = np.zeros((H, W, 4), dtype=np.uint8)
    ring_only = (dil > 0) & (corep == 0)
    canvas[ring_only, 0] = color[0]
    canvas[ring_only, 1] = color[1]
    canvas[ring_only, 2] = color[2]
    canvas[ring_only, 3] = 255

    a = np.zeros((H, W, 4), dtype=np.uint8)
    a[pad:pad + h, pad:pad + w] = np.array(im)
    # 只保留轮廓内的像素，旧图的半透明晕圈/外发光一律丢掉
    a[..., 3] = np.where(corep > 0, a[..., 3], 0)
    art = Image.fromarray(a, "RGBA")
    base = Image.fromarray(canvas, "RGBA")
    base.alpha_composite(art, (0, 0))
    return base



def normalize(path: Path, stem: str, dry: bool, report: list) -> None:
    src = BACKUP / path.name
    origin = src if src.exists() else path
    im = Image.open(origin).convert("RGBA")
    sat_before = mean_sat(im)
    work = peel_border(im)
    # 先按分组把饱和度调到目标，再统一描边色（描边归一本身会轻微压饱和）
    tgt = target_sat(stem)
    factor = 1.0
    if tgt:
        lo = 0.55 if stem in {"plot"} else 0.80
        factor = float(np.clip(tgt / max(mean_sat(work), 1e-4), lo, 1.25))
        work = ImageEnhance.Color(work).enhance(factor)
    work = tighten_halo(work)
    work = harmonize_outline(work)
    if stem in NO_RING:
        work = tighten_halo(work)
    else:
        work = add_ring(work, ring_color(stem), soft=stem in SOFT_HALO)
    report.append((stem, im.size, work.size, round(sat_before, 3), round(mean_sat(work), 3), round(factor, 2), "#%02X%02X%02X" % ring_color(stem)))
    if not dry:
        if not src.exists():
            shutil.copy2(path, src)   # 首次运行：备份原图
        work.save(path)


def main() -> None:
    global DRY
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--samples", action="store_true", help="额外输出前后对比样例图")
    ap.add_argument("--only", default="", help="只处理这些名字（逗号分隔），调试用")
    args = ap.parse_args()
    DRY = args.dry_run
    BACKUP.mkdir(parents=True, exist_ok=True)

    files = sorted(STICKER.glob("*.png"))
    if args.only:
        want = {s.strip() for s in args.only.split(",") if s.strip()}
        files = [f for f in files if f.stem in want]

    report: list = []
    for f in files:
        if f.stem in SKIP:
            continue
        normalize(f, f.stem, DRY, report)

    print(f"{'dry-run ' if DRY else ''}处理 {len(report)} 张：")
    for stem, before, after, s0, s1, fac, ring in report:
        print(f"  {stem:24s} {before[0]}x{before[1]} → {after[0]}x{after[1]}  sat {s0:.2f}→{s1:.2f} (×{fac})  ring={ring}")

    if args.samples and report:
        pick = [r[0] for r in report[:0]]  # 占位
        pick = [s for s in ["chicken", "crop_carrot", "sp_yaya", "hay", "girl"] if (BACKUP / f"{s}.png").exists() or (STICKER / f"{s}.png").exists()]
        if pick:
            cell = 260
            sheet = Image.new("RGB", (cell * 2, cell * len(pick)), (251, 243, 231))
            for i, stem in enumerate(pick):
                for j, root in enumerate((BACKUP, STICKER)):
                    p = root / f"{stem}.png"
                    if not p.exists():
                        p = STICKER / f"{stem}.png"
                    im = Image.open(p).convert("RGBA")
                    im.thumbnail((cell - 30, cell - 30), Image.LANCZOS)
                    sheet.paste(im, (j * cell + (cell - im.width) // 2, i * cell + (cell - im.height) // 2), im)
            out = Path("/tmp/normalize-samples.png")
            sheet.save(out)
            print(f"样例对比：{out}")


if __name__ == "__main__":
    main()
