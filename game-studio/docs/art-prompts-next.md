# 生图指令（第二批：魔物 / 成体精灵 / 三张地形道具）

和第一批同样的规格：**1024×1024 PNG、纯白底 #FFFFFF、单主体居中、四周留白、无投影、无地面、无文字**。
命名后丢进 `farm-tale-src/incoming-art/next/`。

参考图（直接一起发给 GPT，说「照这些的画风、描边和纸纹」）：
- 魔物：「怪物贴纸」没有现成参考，用 `docs/art-ref/blob_wood.png`（元素团子）+ `docs/art-ref/chicken.png`（动物贴纸）当风格锚；
- 精灵：`docs/art-ref/sp_yaya.png`、`blob_water.png`；
- 地形：`docs/art-ref/barn.png`、`tree.png`、`fence.png`（这三张是要被替换的旧图，重画时可参照构图）。

## 通用风格后缀（每条 prompt 末尾都粘）

```
Style: cute kawaii sticker illustration for a cozy paper-craft farming game. Thick creamy-white die-cut sticker outline (#FFFCF2) of uniform width around the whole silhouette; inside it a warm dark-brown line art (#5A4335); soft flat cel shading with only two tones; gentle pastel palette; subtle paper grain on surfaces; no gradients, no gloss. One single isolated creature, centered, generous empty margin. Flat pure white #FFFFFF background, no cast shadow, no ground plane, no scenery, no text, no watermark, no frame. Square 1024x1024 PNG.
```

---

# A. 野外魔物 6 只 + 世界 BOSS 1 只（优先级最高：现在全是 emoji）

统一要求：都是「坏一点但依然可爱」的贴纸怪物，体块圆润、轮廓简单，缩到 80px 能认出是什么。

### A1 `monster_slime.png` — 草丛史莱姆（木）
```
A cute round grass slime monster for a farming RPG: a plump translucent spring-green blob with a glossy highlight, two tiny determined eyes and a small pout, two short curled vine arms, a little leaf sprout growing on top, a few tiny white daisy petals stuck to its body. Wood element. Slightly bouncy pose, sitting flat.
(粘通用风格后缀)
```

### A2 `monster_boar.png` — 暴躁野猪（土）
```
A chunky angry-but-cute wild boar monster: rounded earthy-brown body with darker muddy patches, stubby legs, big snout with two small cream tusks, tiny angry eyebrows, a short bristly mane, one small stone chip stuck on its back, a dirt smudge on the cheek. Earth element. Stocky and wide, standing.
(粘通用风格后缀)
```

### A3 `monster_wolf.png` — 月夜魔狼（火）
```
A cute wolf monster of the night: compact slate-blue-grey wolf body with a fluffy chest, ember-orange glowing mane and tail tip, small pointed ears, one bright amber eye and one scarred eye, faint crescent moon marking on the forehead, tiny paws with ember sparks. Fire element. Alert sitting pose, tail curled around the body.
(粘通用风格后缀)
```

### A4 `monster_turtle.png` — 深渊玄龟（水）
```
A sturdy deep-sea turtle monster: big rounded indigo shell with soft pale water-rune swirls and a few barnacle pebbles, dark teal head and flippers, small sleepy eyes, a faint water droplet floating above its head. Water element. Wide and heavy, calm pose.
(粘通用风格后缀)
```

### A5 `monster_golem.png` — 熔岩巨像（火）
```
A hulking rock golem monster made of warm grey-brown boulders with glowing orange lava cracks, two small glowing eyes in a blunt stone face, oversized chunky fists, a few ember specks rising around it. Fire element. Imposing but rounded and friendly-cute.
(粘通用风格后缀)
```

### A6 `monster_dragon.png` — 苍穹古龙（光）
```
A small winged sky dragon monster: pale cream body with soft gold scales, long curved neck, little horns, two feathered wings with warm gold tips, a spiral tail, calm bright eyes, a tiny floating halo ring above its head. Light element. Elegant, compact, vertical composition.
(粘通用风格后缀)
```

### A7 `boss_dragonking.png` — 世界 BOSS·苍穹古龙王（光）
```
An imposing yet adorable sky dragon king, the boss version of a small sky dragon: large serpentine cream-and-gold dragon with broad feathered wings, a crown of golden sky-crystals on its head, glowing warm light runes along the chest, a grand coiled pose, small gentle eyes. Light element. Heroic and bigger-looking than a normal pet, fills the frame.
(粘通用风格后缀)
```

---

# B. 成体精灵（5 系 × 成体 / 究极体 = 10 张）

游戏里同一元素的精灵共用一张阶段图（幼体已有专属贴纸），所以按元素出两种形态即可。要求：比幼体更大更成熟、形态可辨，缩到 56px 还能认出元素。

### B1 `spirit_wood_adult.png` — 木系成体
```
An evolved wood spirit creature, adult stage: a small gentle vine-and-flower spirit with a leafy hood, braided vine arms, a ring of tiny blossoms around its shoulders and a soft glowing green core on the chest. Bigger and more mature than a sprout baby; still cute and round. Wood element: fresh greens with warm brown line work.
(粘通用风格后缀)
```

### B2 `spirit_wood_final.png` — 木系究极体
```
A legendary fully-grown wood spirit, final evolution: a small ancient tree guardian with a mossy bark body, a crown of glowing leaves, roots curling at the base, tiny glowing seed orbs circling it, calm protective expression. Majestic but still a cute sticker character. Wood element.
(粘通用风格后缀)
```

### B3 `spirit_water_adult.png` — 水系成体
```
An evolved water spirit creature, adult stage: a small flowing-water mage-like spirit with a droplet hood, translucent watery robe with soft wave edges, holding a tiny orb of water, bubbly fins, gentle smile. Bigger and more mature than a droplet baby. Water element: soft aqua and pale blue with warm brown line work.
(粘通用风格后缀)
```

### B4 `spirit_water_final.png` — 水系究极体
```
A legendary fully-grown water spirit, final evolution: a small elegant sea-dragon spirit with flowing wave-shaped mane and tail, pearly scales, ice-crystal horns, tiny floating bubbles and a soft moon-shaped glow behind its head. Majestic but still a cute sticker character. Water element.
(粘通用风格后缀)
```

### B5 `spirit_fire_adult.png` — 火系成体
```
An evolved fire spirit creature, adult stage: a small fiery fox-like spirit with a flame-tipped tail, ember paws, a little flame tuft on the head, warm orange-to-cream gradient body, playful confident expression. Bigger and more mature than a flame baby. Fire element: warm oranges with warm brown line work.
(粘通用风格后缀)
```

### B6 `spirit_fire_final.png` — 火系究极体
```
A legendary fully-grown fire spirit, final evolution: a small armored warrior spirit of molten magma, dark warm rocky plates over glowing orange cracks, horned flame helm, floating ember shards around the body, fierce but cute face. Majestic but still a sticker character. Fire element.
(粘通用风格后缀)
```

### B7 `spirit_earth_adult.png` — 土系成体
```
An evolved earth spirit creature, adult stage: a small sturdy stone creature with rounded pebble body, layered rock plates, a tiny crystal sprout on its back, short strong arms, warm sandy colours with moss patches, calm friendly face. Bigger and more mature than a soil baby. Earth element.
(粘通用风格后缀)
```

### B8 `spirit_earth_final.png` — 土系究极体
```
A legendary fully-grown earth spirit, final evolution: a small mountain-and-crystal guardian with a craggy stone body, glowing amber crystal core, mossy shoulders, floating pebbles orbiting it, ancient gentle face. Majestic but still a cute sticker character. Earth element.
(粘通用风格后缀)
```

### B9 `spirit_light_adult.png` — 光系成体
```
An evolved light spirit creature, adult stage: a small radiant starlight spirit with a glowing cream-pink body, tiny two-stage halo, floppy star-tipped ears, soft sparkles drifting around it, one bright eye smiling. Bigger and more mature than a star baby. Light element: warm cream, gold and blush pink with warm brown line work.
(粘通用风格后缀)
```

### B10 `spirit_light_final.png` — 光系究极体
```
A legendary fully-grown light spirit, final evolution: a small winged radiant spirit with feathered glowing wings, a circlet of tiny stars, a luminous core in its chest, drifting light motes, serene joyful expression. Majestic but still a cute sticker character. Light element.
(粘通用风格后缀)
```

---

# C. 三张地形道具重画（对齐新线条重量与配色）

要点：这三张会被换成**和 GPT 图一致的粗线、低饱和、纸纹**，颜色参考现有暖纸底农场（奶油、陶土粉、鼠尾草绿）。

### C1 `barn.png` — 谷仓
```
A cozy little storybook barn sticker, straight-on slightly high view: warm dusty-rose red plank walls with visible vertical boards, a soft cream barn roof with rounded gable, white cross-braced double doors with warm brown trim, one small square loft window with a cream frame, a tiny hay bale and a shovel leaning beside the door, a few grass tufts at the base. Same composition as the reference barn but with thicker warm-brown line work and flatter, less saturated colour. No sky, no ground plane, no cast shadow.
(粘通用风格后缀)
```

### C2 `tree.png` — 樱花树
```
A cozy storybook cherry-blossom tree sticker: soft dusty-pink rounded canopy in three fluffy clusters with small cream blossom dots, warm brown curving trunk with a few branches, a tiny rope swing hanging from one branch, a small circle of grass and fallen petals at the base. Same composition as the reference tree, but thicker warm-brown line work, flatter colour, gentle paper grain. No ground plane, no cast shadow.
(粘通用风格后缀)
```

### C3 `fence.png` — 栅栏（一节，需左右可拼接）
```
A single repeatable wooden fence segment sticker for a farming game: one horizontal span with a rounded post at each end and two horizontal rails between them, warm light-brown planks with soft grain lines, a tiny grass tuft at the base of each post, one small nail dot per rail. IMPORTANT: the left and right edges must line up so the segment tiles seamlessly when repeated side by side; keep the composition exactly centered and symmetric. No ground plane, no cast shadow.
(粘通用风格后缀)
```

---

# 出完丢给我

```
farm-tale-src/incoming-art/next/
```

我会按这张表接进去：

| 文件 | 用在哪 |
| --- | --- |
| `monster_*.png` | 战斗页野外讨伐卡片 + 战斗舞台的敌人 |
| `boss_dragonking.png` | 战斗舞台 BOSS + 世界 BOSS 面板 + 世界频道 |
| `spirit_<元素>_adult.png` / `_final.png` | 精灵养成 / 图鉴 / 战斗的成体、完全体、究极体（同元素共用） |
| `barn.png` `tree.png` `fence.png` | 替换现有地形贴纸，并重跑 `fix-outline.py` 把白边换成地面色 |

如果一次出 20 张太累，**先出 A（7 张）+ C（3 张）**，B 那 10 张之后单独补 —— 先做 A 的好处是战斗页立刻不再是 emoji。
