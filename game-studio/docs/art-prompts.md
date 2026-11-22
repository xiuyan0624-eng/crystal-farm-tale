# 生图指令（交给 GPT / ChatGPT 出图）

一共 4 张：地块、番茄作物、人参作物、蜜蜂。

- 出图尺寸：**1024 × 1024 PNG**（正方形就行，构图留白够就好，我会裁）。
- 背景：**纯白 #FFFFFF**（ChatGPT 直接给透明底不方便；纯白我这边可以一键抠掉）。
- 命名后丢进：`farm-tale-src/incoming-art/`（已建好）。
- 想要风格更像：**把 `farm-tale/docs/art-ref/` 里的 `plot.png`、`crop_carrot.png`、`chicken.png`、`cow.png` 作为参考图一起发给 GPT**，并说「照着参考图的画风、描边和上色」。
- 一条都不要少：单主体、正中、四周留白、无投影、无地面、无文字、无水印、无边框。

---

## 0. 通用风格后缀（每条 prompt 末尾都粘这段）

> Style: cute kawaii sticker illustration for a cozy paper-craft farming game. Thick creamy-white die-cut sticker outline (#FFFCF2) of uniform width around the whole silhouette; inside it a warm dark-brown line art (#5A4335); soft flat cel shading with only two tones; gentle pastel palette; subtle paper grain on surfaces; no gradients, no gloss. One single isolated object, centered, generous empty margin. Flat pure white #FFFFFF background, no cast shadow, no ground plane, no scenery, no text, no watermark, no frame. Square 1024x1024 PNG.

---

## 1. 地块 `plot.png`（最影响观感的一张）

> An EMPTY tilled soil plot for a farming game, seen from a slightly high three-quarter top-down angle: a rounded square patch of warm brown soil (base #B98A63, shadow #8E6446, lit top #CBA077) divided into a 3 x 3 grid of tilled beds with soft furrows between them; slightly raised rounded soil lip at the outer edge; three or four tiny pebbles and two short grass tufts peeking out at the corners. Absolutely NO plants, NO seeds, NO tools, NO signs, NO vegetables. The plot fills about 80% of the frame and is perfectly square in composition.
>
> （粘贴上面的通用风格后缀）

要点：**空格子**、俯视微斜、3×3 垄、边缘有厚度、四角允许露出小石子和小草。不要在格子里画任何小苗。

---

## 2. 番茄作物 `crop_tomato.png`

> A ripe tomato harvest sticker: two plump glossy red tomatoes, one larger in front and one tucked behind, deep red with orange-red shading and soft white highlight; green calyx leaves on top and a short curly vine stem; two or three green leaves at the base. Chunky and very readable when shrunk to 56 pixels wide. Vertical composition, the tomato cluster centered, slightly taller than wide.
>
> （粘贴上面的通用风格后缀）

要点：像现有胡萝卜/白菜那样「可收获的果实 + 叶子」，不是田里的小苗；竖构图、轮廓简单。

---

## 3. 人参作物 `crop_ginseng.png`

> A ginseng root harvest sticker (Chinese 人参): a pale cream-beige forked ginseng root shaped like a little human figure — thick oval body, two short arm-like side roots, two leg-like roots — with warm sandy #D8B98C creases and #B9986A shading; a short green stem on top with three small dark-green leaves. Cute, chunky, readable at 56 pixels wide. Vertical composition, centered.
>
> （粘贴上面的通用风格后缀）

要点：米白偏黄的人形根 + 顶部三片绿叶；不要画成白萝卜，也不要深棕色树根。

---

## 4. 蜜蜂 `bee.png`

> A cute little honeybee sticker, side view in profile facing LEFT: plump oval body with soft yellow (#F2C46A) and warm brown (#8C6244) stripes, two tiny translucent creamy wings raised above the back, one small round dark eye, a thin curved antenna, six short stubby legs, a tiny friendly smile. Small round character, about as wide as tall, centered with even empty space around it.
>
> （粘贴上面的通用风格后缀）

要点：侧面、朝左（和鸡/牛一致）、胖圆、翅膀半透明奶油色、有笑脸。

---

## 出完丢给我之后我会做

1. 从白底抠图（边缘泛洪 + 抗锯齿收边），裁到内容外接框并留统一留白；
2. 把 die-cut 白边换成场景地面色 `#F2ECDA`（和上一轮地形道具一致），按用途缩放到目标尺寸；
3. 覆盖 `farm-tale-src/src/assets/sticker/`（原图备份到 `sticker-original/`）；
4. `./rebuild.sh` → 无头 Chrome 截图核对（1280 / 480）→ `game_studio_build` + `game_studio_export`，把新版本的对比图发你。

如果某张出得不满意，直接说「第几张重来，改成……」，不用整批重生成。
