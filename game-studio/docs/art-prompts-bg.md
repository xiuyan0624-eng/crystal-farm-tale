# 五张战斗背景 · 出图提示词

用途：战斗页按敌人五行换场景。每张是**整幅不透明插画**（不是贴纸，不需要白底、不需要裁边），
绘制尺寸 16:9。游戏里会铺满 `h-[248px]` 的战斗场景（实际显示约 950×248 ~ 480×248，所以主体别太碎）。

放图位置：`farm-tale-src/incoming-art/bg/`，文件名必须是
`bg_wood.png` / `bg_fire.png` / `bg_water.png` / `bg_earth.png` / `bg_light.png`，
放好后我跑一条命令（`import-art.py --batch bg`）裁成 1536×864 接进游戏。

参考图（一起丢给模型）：`farm-tale/docs/battle-jrpg.png`（构图参考：上景下地、中间留空）、
`farm-tale-src/src/assets/sticker/tree.png`、`barn.png`、`plot.png`（画风参考）。

---

## 通用要求（五张都加在提示词末尾）

```
Wide 16:9 landscape illustration, 1536x864, no text, no logo, no characters, no UI, no frame.
Hand-drawn kawaii storybook art matching the attached reference stickers: soft gouache-and-watercolour
texture with subtle paper grain, rounded organic shapes, clean dark-brown (#5A4335) outlines of medium
weight, muted cream-and-pastel palette (cream #FBF3E7, sage #7C9B64, berry #D35F7B, butter #E7B453,
water blue #6E8FA8, clay #C9922F), gentle warm light, calm and cosy mood.
Composition: horizon / ground line at about 62% of the image height. The bottom 30% must be a calm,
low-contrast ground area (soft grass, soil or stone) kept mostly empty and free of big props, because
two 2D character stickers stand there during battle. The upper 60% carries the scenery and depth.
Keep the middle band (roughly 40%-70% height) uncluttered so the enemy sticker on the right and the
player sprite on the left stay readable. Avoid heavy vignettes, harsh contrast or busy patterns.
```

## 1. 木系 · 林间空地 → `bg_wood.png`

```
A sunlit forest clearing in a gentle fantasy farm world: rounded deciduous canopies in sage and soft
olive, a few pale cherry-pink blossom clusters at the left and right edges, dappled light, low rounded
shrubs, a mossy stone or two at the sides, scattered petals drifting, warm cream sky with soft
cotton-like clouds. Ground is soft springy grass with a lighter trodden patch. Cosy, friendly, no
scary shadows.
```

## 2. 火系 · 熔岩山谷 → `bg_fire.png`

```
A fantasy volcanic valley at a safe distance: layered dark-red and terracotta rock ridges, a glowing
orange lava river low in the background (behind the horizon line, not in the bottom standing area),
drifting embers and warm amber haze, a few rounded basalt stones at the edges, smoky but cosy rather
than apocalyptic. Ground is warm dry clay with a subtle reddish tint, low contrast. Palette leans
terracotta + butter-yellow + cream, outlines still dark brown, mood warm and adventurous, not scary.
```

## 3. 水系 · 水滨浅滩 → `bg_water.png`

```
A quiet shallow lagoon: turquoise-to-cream gradient water with soft stylised wave lines, gentle foam
curls near the horizon, a few rounded pebbles and tufts of reeds at the left and right edges,
pale blue-cream sky with airy clouds and a light mist. Ground in the foreground is pale wet sand with
soft reflections, kept calm and low contrast. Fresh, cool and peaceful.
```

## 4. 土系 · 荒原矿丘 → `bg_earth.png`

```
A dry highland quarry in a fantasy farm world: stacked ochre and clay rock terraces, a soft clay path
winding behind the horizon, small grass tufts and little amber ore crystals peeking from the rocks at
the edges, dusty warm sky with beige clouds. Ground is packed earth with a gentle sandy gradient.
Rounded, friendly rock shapes — no sharp cliffs. Palette clay + butter + cream.
```

## 5. 光系 · 光之丘 → `bg_light.png`

```
A luminous hill under a pastel sunrise: soft golden meadow, gentle light beams fanning from behind the
hill, floating sparkles and tiny star glints, a low field of white and pale-pink flowers at the left
and right edges, airy cream-and-gold sky with light cloud bands. Ground is a warm sunlit lawn with a
soft glow, calm and low contrast. Serene, hopeful, magical but gentle.
```

---

## 我这边接到后会做什么

1. `import-art.py --batch bg`：按 16:9 居中裁切、缩放成 1536×864，写进 `src/assets/battle/bg_<元素>.png`；
2. `BattlePanel` 已预留：战斗时按敌人元素取图铺满场景（缺图就回退到现在的天空+草地），角色和血条位置不变；
3. 重建 → 五系各截一张战斗图给你看，再更新导出包和 README。
