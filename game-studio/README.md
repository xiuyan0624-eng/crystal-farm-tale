# 晶灵农场物语 · Game Studio 项目

这是把桌面上的 React/Vite 原型 `~/Desktop/Kimi_Agent_晶灵农场物语/app` 接进
Game Studio 之后的样子。它不是一个从模板改出来的游戏，而是原型的完整构建。

## 文件怎么来的

```
../farm-tale-src/src     原型源码（React 19 + Vite + three.js）
        │  ./rebuild.sh
        ▼
../farm-tale-src/single/index.html  单文件构建（图片压成 WebP data URI 内联）
../farm-tale-src/single/index.css / .js
        │  wrap-gamejs.mjs
        ▼
game.js                   把原型的 CSS/JS 挂进 Studio 页面（勿手改）
        │  Game Studio 的「构建」/ game_studio_build
        ▼
dist/index.html           约 3.5 MB，单文件、离线可玩
export/晶灵农场物语.html   导出的同一份单文件
```

## 改动注意

- **改游戏**：只改 `../farm-tale-src/src/`，然后运行 `../farm-tale-src/rebuild.sh`，
  再在侧边栏点「构建」或让我运行 `game_studio_build`。
- **不要手改 `game.js`**：它是 `rebuild.sh` 生成的包装，3 MB 的字符串，改了下次
  重建就没了。
- 原模板的 `game.js` 内容（Lantern Meadow 收集游戏）已经被替换掉了；项目里的
  `game.json` 只负责标题、方向、美术槽和「我的游戏」墙上的展示。
- 侧边栏的「自测」（playtest）还不认识这个游戏：原型没有 `window.__gameState()`
  / `__autoplay()`，所以自测会当成普通页面玩不了。要玩真实内容请直接在预览里玩。

## 相对于原型的改动（只有两处，都在源码里）

1. `src/main.tsx`：`BrowserRouter` → `HashRouter`。预览用 blob URL 打开页面，
   路径不是 `/`，用 history 路由会白屏。
2. `src/game/useGame.ts`：存档读写包了一层 `saveStore`。预览的 iframe 是
   `sandbox="allow-scripts"` 的不透明来源，直接碰 `localStorage` 会抛
   SecurityError；现在失败就退回内存（预览里不保留进度，导出的文件用普通浏览器
   打开仍然正常存档）。

## 可玩性改进记录（2026-11-11）

按「可玩性评审」动手改了 5 处，源码都在 `../farm-tale-src/src`：

| # | 问题 | 改动 | 实测 |
|---|---|---|---|
| 1 | 每个动作都等小农夫走过去（起点到第 1 块地 ~5 s） | `PixelWorld.tsx`：新增 `actAtPlot/actNow` —— 离目标 <260px 直接结算，只在第一次远距离时走过去；走路速度 120→240 | 播种 5 s → **87 ms**；连浇 3 次 ~15 s → **1.5 s** |
| 2 | 种子条在农场下方，要来回滚动 | 种子条 + 批量按钮浮在农场画面底部；点空地块的弹窗里直接列种子，点一下即播种 | 1280 宽浮条一行，480 宽自动换行不挡按钮 |
| 3 | 第一只精灵要等 12–17 分钟 | 首次收胡萝卜给 **2 颗**土结晶（初始 3 + 2 = 5 颗），配首蛋 10 秒加速 | 一次收获即可孵化，10 秒破壳（实测「石头仔」，图鉴 +1） |
| 4 | 浇水/收获要点很多次 | 新增 `waterAll / harvestAll`，浮条上「一键浇水 / 一键收获」，带待办数量 | 一键浇水 1 块地、一键收获 1 块地均一次点击完成 |
| 5 | 窄屏（含 Studio 侧栏 ~480px）被右栏和滚动挤爆 | `Home.tsx`：右栏 `hidden lg:block`，窄屏收进底部折叠抽屉；空地块不再显示可点的浇水按钮 | 480 宽：页面高 2181→**1603**，右栏隐藏，画布 460 宽铺满 |

验证方式：`tsc --noEmit` 通过；无头 Chrome 跑完整循环（种→浇→收→孵→破壳），**0 console/page error**。

## 视觉统一（2026-11-11）

用户反馈「画面很不统一，玩起来很难受」，因此把整套界面收进一个方向：**奶油手账 · 贴纸农场**。

- 一句话：界面像奶油色纸手账，墨线勾边，只留一个莓红主强调和一个鼠尾草绿辅助；彩色只来自游戏内容（贴纸角色 / 作物 / 元素）。
- 色板：纸底 `#FBF3E7`、卡面 `#FFFCF6`、线 `#E7D7C3`、文字 `#3B2E26 / #7C6B5D / #A9968A`、莓红 `#D35F7B`、鼠尾草 `#7C9B64`、奖励黄 `#E7B453`、危险 `#C05248`。定义在 `../farm-tale-src/tailwind.config.js`。
- 表面与控件：`src/index.css` 里的 `.card / .card-float / .pill / .btn-* / .chip / .tab / .field` 是唯一的一套；不再每块面板换一种边框色、不再用渐变标题。
- 图标：`src/ui/Icon.tsx` 一套 24 网格、1.75 描边内联 SVG，接管页签、按钮和面板标题；emoji 只当内容贴纸（作物、动物、元素）放进 `.sticker-tile / .chip`。
- 文字：正文 12–14px、标题 16–20px；原来大量 9–11px 说明文字已并进 caption/micro 并提高对比。
- 场景：草地改成鼠尾草纸绿、地块贴纸压饱和染色，和纸面外壳统一；谷仓 / 围栏的粉色作为品牌插画保留。
- 页面结构没动：5 个页签、农场浮条、弹窗、商店、背包、战斗流程与操作全部不变；`tsc --noEmit` 通过，无头 Chrome 跑过种→浇→收→孵流程与融合注入，0 console/page error。

前后对比：`docs/before-world.png` → `docs/after-world.png`；精灵养成 `docs/after-sprite.png`；480 宽 `docs/after-narrow.png`。

### 按独立评审再修的一轮

独立评审结论：方向成立、不建议重做；「不统一」的根在执行层（内容图像物料、数据字号、状态表达）。按影响顺序处理了这些：

1. **内容物料统一**：地块作物从 `fillText` emoji 改成已有作物 PNG（无图的番茄/人参用纸色剪影）；成体精灵改用元素团子贴纸兜底，不再回退 emoji；野外魔物全部换成元素团子贴纸；背包/投喂/孵化池的水晶统一成同一颗可着色的 gem SVG（不再出现五个全蓝的 💎）。
2. **战斗（进行中）补舞台**：敌方贴纸 ↔ 我方贴纸面对面、血条贴身、地面线、队友与能量上移、操作在舞台下沿；静帧能看出谁在打谁。
3. **关键数据回到 12px**：种子价格 / 掉率、牧场价格、水晶 ×n、图鉴、战斗属性、商店卡片全部 text-caption；主按钮用 #B94C67（白字 ≈4.9:1），禁用态改成纸底灰字不再叠 opacity。
4. **内容色收进色板**：元素/品质/稀有度改为纸面派生色（木/火/水/土/光与普通~传说），同一品质只保留 pill 一种外观。
5. **层级**：发送按钮默认变 secondary（输入内容才变 primary）、召唤传说与讨伐 BOSS 降为 secondary；页脚只留元素图例。
6. **减法与状态**：去掉「今天也是好天气」「点卡片购买」「选魔物 → 出击」等常驻说明和重复流程句；图鉴筛选与战斗出战用统一选中态；技能未学会加锁图标；孵化池法阵画出 5 个空槽。
7. **窄屏**：顶栏压缩、重开只留图标、浮条在 <640 改单行横向滚动；种子/牧场卡片至少 4 列且数据 12px。
8. **图标语义**：剑加护手、防御用盾、精灵养成用爪印、未学会加锁；弹窗去掉 44px 图标底块。

**仍未解决**（已告知评审边界）：本机没有可用的生图服务（codex 模型不支持、agy 未安装），番茄/人参/蜜蜂三张只能用剪影兜底，是当前唯一还看得到的物料差；480 宽只核对了农场世界页，其余四页窄屏未逐页复核；动效只做了静态判断，未在实机核对手感。

## 农场画面：暖纸底（2026-11-11 第二轮）

UI 统一后，农场场景和外壳仍不协调：环境道具和地面明度都在 0.9 左右但色相一粉一绿（互补色同明度），且只有角色有投影。按 A 路线（暖纸底 + 第一组光影/分层）改了 `PixelWorld.tsx` 的 canvas 绘制：

- **地面**：暖纸底 `#F2ECDA` + 两层色斑 + 110 处短草簇 + 22 处成簇草 + 顶部远景暖影 + 10% 暗角 + 纸纹（离屏预渲染，每帧贴图不加开销）。
- **光影**：`drawProp()` 给所有立着的道具（谷仓/树/围栏/水槽/干草/石头/花/独轮车/路牌）同一方向投影（`rgba(90,70,55,.2)`，偏移在右下方），围栏投影压到 0.13；角色投影同色同参数。
- **环境色**：环境道具统一 `saturate(.82) brightness(.97) hue-rotate(4deg)` 压成灰粉/陶土；角色和作物不滤镜，形成「低饱和背景 / 高饱和贴纸」两层。
- **地块**：从粉色贴纸改成土壤色（`saturate(.45) sepia(.28)`）+ 圆角内阴影 + 底部接地投影；浇水/干旱/土地等级的覆盖色改到纸面色板。
- **小路**：奶油色 + 10% 描边 + 16 颗石子；道具尺寸与排序不变，玩法不受影响。

前后对比：`docs/scene-before.png` → `docs/scene-after.png`；有作物的样子 `docs/scene-after-crops.png`。

还没做（第二/三组建议）：地形道具烘焙的白边还没替换成纸色；地块贴纸未重绘；canvas 未按 DPR 渲染。

## 地形道具白边 + 高分屏（2026-11-11 第三轮）

第二轮之后还剩两处「不贴地」：

1. **贴纸白边**：所有地形道具都是烘焙进 PNG 的白 die-cut 边，立在暖纸草地上就是一圈白线。
2. **Retina 发虚**：canvas 按 1280×760 建 backing store，在 2x 屏上被放大，边缘发软。

### 白边替换

新增 `farm-tale-src/tools/fix-outline.py`（Pillow + numpy，零新依赖）：

```bash
cd farm-tale-src
/Users/wfxy/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/python/bin/python3 tools/fix-outline.py
```

- 处理 10 个地形道具：`barn tree fence plot trough hay stones flowers wheelbarrow sign`；角色 / 动物 / 作物**不动**——它们贴纸边是前景语言，保留。
- 原图先备份到 `src/assets/sticker-original/`（10 个文件，可整体还原）。
- 判据：从透明区做连通膨胀，只改「能走到、且接近白色」的像素，把 RGB 换成**场景地面色** `#F2ECDA`（不是界面 paper `#FBF3E7`，否则仍比草地亮一线），alpha 保留。连通而不是按距离，是因为道具内部也有近白细节（地块亮粉格、花瓣、窗框），它们被深色描边包着、走不进去；白边外圈的抗锯齿灰点 alpha<250 可以通行，不会被一个灰点挡住。
- 实跑约 22.4 万像素；副作用：谷仓阁楼白窗、樱花/雏菊的白花瓣因为紧贴边界会被染成地面色（1x 下看不出，属于可接受的轻微损失）。
- 想要退回原始贴纸：`cp src/assets/sticker-original/*.png src/assets/sticker/`。

### DPR 渲染

`src/components/PixelWorld.tsx` 建画布时：

```ts
const dpr = Math.min(window.devicePixelRatio || 1, 2)
canvas.width = Math.round(W * dpr)
canvas.height = Math.round(H * dpr)
ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
```

绘制代码仍用 1280×760 逻辑坐标，指针换算照旧走 `getBoundingClientRect()`，所以点击/弹窗位置不变；上限 2x，避免 3x 手机上多耗一倍显存。

### 验证

- `tsc --noEmit` 通过；`./rebuild.sh` 后 `game_studio_build`（buildId `65ca0be53d1f`，3.64MB）+ `game_studio_export`。
- 无头 Chrome：dsf=1 → canvas 1280×760、dsf=2 → 2560×1520（CSS 都是 950×564），两种 DPR 下点第 1 块地都能正常收获，0 console/pageerror。
- 截图：`docs/scene-after-edges.png`（1280，带作物/动物）、`docs/scene-after-narrow.png`（480）、`docs/scene-popup.png`（地块弹窗）。

## GPT 生图接入（2026-11-11 第四轮）

第三轮之后最刺眼的还剩「地块是粉色甜点格」和「番茄 / 人参 / 蜜蜂没有图」。这四张由用户用 GPT 出图（提示词见 `docs/art-prompts.md`），流程：

```bash
cd farm-tale-src
# 把 1024×1024 纯白底原图放进 incoming-art/{plot,crop_tomato,crop_ginseng,bee}.png
/Users/wfxy/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/python/bin/python3 tools/import-art.py
./rebuild.sh
```

`tools/import-art.py` 做的事：

1. 从四条边泛洪抠掉纯白背景（只删和边缘连通的近白，保护贴纸里的奶油色高光）；
2. 只保留面积 ≥ 最大连通块 2% 的块 —— 顺手清掉了人参左边那块游离白斑；
3. 裁到内容外接框、四周留 4–6% 留白；
4. 缩放：地块 420×420（补成正方画布，避免 88×88 拉伸）、番茄 552×606、人参 474×733、蜜蜂 512×489；
5. 地块额外把奶油色 die-cut 边换成场景地面色 `#F2ECDA`（和第三轮地形道具同一套语言；作物/动物保留奶油边当前景语言）。

代码侧（`src/components/PixelWorld.tsx`）：

- 新增 `cropTomatoUrl / cropGinsengUrl / beeUrl` 三个 import，`imgs` 里加 `tomato / ginseng / bee`；
- `animalImg.bee` 从 `{ emoji: '🐝' }` 改成 `{ img: st.imgs.bee, size: 46, speed: 90 }`；
- `ITEM_STICKERS` 补 `tomato / ginseng`，种子商店、背包、投喂 chip 都换成真图；
- 地块绘制去掉 `SOIL_FILTER`（新图本身就是土壤，再压色会发灰），投影 / 等级染色 / 浇水干旱覆盖层不变；`SOIL_FILTER` 常量随之删除。

验证：

- `tsc --noEmit` 通过；`./rebuild.sh` → `game_studio_build`（buildId `e1eb5590d105`，3.71MB）→ `game_studio_export`（`export/晶灵农场物语.html` 3.71MB，blob iframe 里可独立打开）。
- 无头 Chrome 1280/480：六块地分别种番茄 / 人参 / 玉米 / 胡萝卜 / 白菜 / 南瓜，点第 1 块地收获出 `收获 🍅【优质】番茄 ×2！`，0 console/pageerror。
- 截图：`docs/art-world.png`（1280 中期存档）、`docs/art-narrow.png`（480）、`docs/art-imported.png`（四张贴纸在地面色上的原图）、`docs/art-plot-before-after.png`、`docs/art-world-before-after.png`。
- 旧粉色地块原图另存为 `src/assets/sticker-original/plot-pink-before-gpt.png`。

## 第二批生图：野外魔物（2026-11-21）

用户按 `docs/art-prompts-next.md` 出了 A 组 6 只魔物（世界 BOSS 还没出）。接入：

- `tools/import-art.py` 加了 `--batch next`，并在「丢碎片」规则里补了「细长条」判据（玄龟左侧原本带着相邻生成的残片；主体不会是细长比例）；
- 新增 `src/game/enemyImages.ts`：`ENEMY_IMAGES` 按 `ENEMIES[].id` 映射 6 张贴纸，`BOSS_IMAGE` 暂用古龙贴纸顶替（等 BOSS 图到了只改一行）；
- `BattlePanel.tsx` 三处 `ELEMENT_BLOBS[...]` 换成 `ENEMY_IMAGES[...]`：战斗舞台敌人、野外讨伐卡片、世界 BOSS 面板；
- 战斗舞台加了柔和地面光带（`radial-gradient` + 底部 `butter/20`），空舞台不再是一块平纸；`min-h` 248→232。

验证：`tsc` 通过；无头 Chrome 用 fixture 直接进中期存档（3 只 18 级精灵）打「熔岩巨像」，舞台/血条/编队/日志正常，0 console/pageerror；`game_studio_build`（buildId `7ac0d5d7091f`，3.98MB）+ export。

截图：`docs/monsters-sheet.png`（六张新贴纸）、`docs/battle-list.png`、`docs/battle-stage.png`。

### 世界 BOSS 贴纸（2026-11-21）

`boss_dragonking.png` 到位后：

- `enemyImages.BOSS_IMAGE` 从古龙贴纸换成真正的古龙王；
- 战斗舞台里 BOSS 用 `h-28`（普通魔物 `h-20`），体型差一眼能看出来；
- `game_studio_build`（buildId `6ea986f50a0a`，4.04MB）+ export；
- 截图：`docs/boss-sheet.png`、`docs/battle-boss.png`。

### 精灵展示尺寸（2026-11-21）

幼体贴纸本身留白少、体块圆，站在 80px 的魔物旁边显小，于是统一放大展示尺寸（只改展示，不改素材）：

| 位置 | 改动 |
| --- | --- |
| 战斗舞台出战精灵 | `h-12` → `h-16`（48→64px；魔物 80、BOSS 112，比例 1:1.25:1.75） |
| 战斗舞台队友小头像 | `h-5` → `h-6` |
| 编队列表头像 | `h-8` → `h-9` |
| 图鉴卡面 | `h-14` → `h-16`，容器同步 |
| 养成页头部立绘 | `h-11` → `h-[50px]` |

验证：`tsc` 通过；无头 Chrome 用带 3 只精灵的存档逐页截图，0 console/pageerror；`game_studio_build`（buildId `fbbfb737f5fc`，4.04MB）+ export。截图：`docs/battle-stage.png`、`docs/battle-boss.png`、`docs/party-sprite.png`、`docs/party-dex.png`。

### 成体精灵贴纸的「投递即生效」机制（2026-11-21）

第二批 B 组（成体/究极体）会一张张陆续到，所以先改了取图方式，避免每来一张都改代码：

```ts
// src/game/spriteImages.ts
const ADULT_ART = collectStageArt(import.meta.glob('../assets/sticker/spirit_*_adult.png', { eager: true, query: '?url', import: 'default' }))
const FINAL_ART = collectStageArt(import.meta.glob('../assets/sticker/spirit_*_final.png', { eager: true, query: '?url', import: 'default' }))
```

- 文件名规则：`spirit_<wood|fire|water|earth|light>_adult.png` / `spirit_<元素>_final.png`，丢进 `src/assets/sticker/` 后 `./rebuild.sh` 就生效，**不需要改代码**；
- 映射：`adult` 用 `_adult`；`complete` / `ultimate` 用 `_final`，没有 `_final` 时回退到 `_adult`；`baby` / `special` / `limited` 仍用原贴纸或元素团子；
- `spriteImage(speciesId, element, stage)` 增加 stage 参数，调用处（`BattlePanel` / `SpritePanel` / `DexPanel`）已同步；
- 用一张临时图验证过「放文件→构建→生效」与「删文件→回退元素团子」两条路径，0 报错；之后已删除临时图，`game_studio_build`（buildId `b1c77e4bf2e3`）+ export。

### 木系成体贴纸接入（2026-11-21）

用户按单张出图交付了第一张 B 组素材（`可爱森林花叶精灵贴纸.png`，1254×1254，绿叶兜帽 + 白花项圈 chibi 精灵）：

- `import-art.py --batch next` 处理为 `src/assets/sticker/spirit_wood_adult.png`（1254×1254 → 582×640）；
- 由上一节的 `import.meta.glob` 机制自动接管：木系 `adult`（缠绕藤/花精等）直接换图；
- 顺手修了 `BattlePanel.spriteFace`：原来「幼体用贴纸、进化形态用 emoji」，现在**所有阶段都用贴纸**，进化形态额外加 `drop-shadow(0 0 6px 元素色)` 外发光；
- 木系 `complete`/`ultimate`（荆棘妖等）暂时复用 `_adult` 图，等 `spirit_wood_final.png` 到位自动切换。

验证：`tsc` 通过；`/tmp/wood-check.mjs` 用 3 只木系精灵（缠绕藤 Lv14 / 荆棘妖 Lv32 / 花精 Lv12）截养成页、图鉴、战斗舞台，全部出图、0 console/pageerror。`game_studio_build`（buildId `22f73c593f51`，4.10MB）+ export。截图：`docs/spirit-wood-sprite.png`、`docs/spirit-wood-dex.png`、`docs/spirit-wood-battle.png`。

## B/C 组素材：由 Codex 内置 image_gen 批量出图（2026-11-21）

不再由用户手工转图，改为我用本机 Codex CLI 的 `image_gen` 直接出图（同一账号、同一质量门槛）：

```bash
codex exec -m gpt-5.6-sol \
  -i ref_wood_adult.png -i ref_baby.png \
  "$imagegen Generate exactly one image … copy to ./image.png"
```

- **模型必须指定**：本机默认的 `gpt-6.1-sol` 在 ChatGPT 号上不可用，实测可用 `gpt-5.6-sol`；
- **每张都带参考图**（同元素成体 + 幼体），锁定线条重量、die-cut 边、纸纹与配色，10 张才像一家人；
- 批量脚本 `/tmp/artgen/gen-all.sh`（一次性，未入仓）串行出 11 张：水/土/光成体 → 五系 `_final` → 谷仓/樱花树/围栏，单张 1.5–2.5 分钟。

产出与处理：

| 素材 | 处理 | 结果 |
| --- | --- | --- |
| `spirit_{water,earth,light}_adult` | 抠图裁边 | 479/481/494 × 640 |
| 五系 `spirit_*_final` | 抠图裁边 | 515–640 宽，均 640 高 |
| `barn` | 抠图 + 白边换地面色 | 900×783（白边 46,170 px） |
| `tree` | 同上 | 765×900（40,394 px） |
| `fence` | 同上 | 900×323（75,279 px） |

- 全部走 `import-art.py --batch next`，代码零改动（成体/完全体已被 `import.meta.glob` 接管，地形道具换同名文件即生效）；
- `tsc` 通过；fixture 存档截 5 元素图鉴 + 战斗、农场全景，0 console/pageerror；
- `game_studio_build`（buildId `abdc22fbb0db`，4.67MB）+ export。

截图：`docs/spirits-batch2.png`（10 张成体/完全体总览）、`docs/props-batch2.png`（谷仓/樱花树/围栏）、`docs/scene-art-batch2.png`（换新道具后的农场）、`docs/battle-five-elements.png`。

### 图鉴未捕获剪影（2026-11-21）

之前未捕获的卡显示「元素团子的灰色版」，形状都一样；现在直接用该物种实际会用的贴纸（幼体自己的贴纸 / 成体与完全体的分批素材）压成剪影：

```css
/* src/index.css */
.dex-silhouette { filter: grayscale(1) brightness(0.40) contrast(1.2) opacity(0.32); }
```

- `DexPanel.tsx` 里未捕获卡改用 `.dex-silhouette`，右上角加一个小「？」角标（`bg-paper/90` 的 16px 圆点）；
- 效果：木系攻击线两张未捕获卡分别是「成体剪影」「完全体剪影」，和已捕获的缠绕藤形成形状递进；特殊/限定没有阶段素材，仍是团子剪影（等有素材自动变）；
- `tsc` 通过，0 console/pageerror；`game_studio_build`（buildId `6e8460bf16a5`，4.67MB）+ export；截图 `docs/dex-silhouette.png`。

## 补齐 30 只幼体 + 图鉴轮廓线（2026-11-21）

### 15 只缺失的幼体贴纸

60 个物种里此前只有 15 只幼体有专属贴纸，剩下 15 只（香菇童子、蒲公英信使、世界树苗、云朵兽、珍珠贝、潮汐圣兽、灯笼鬼、炸蛋鸡、朱雀、泥人偶、晶矿兽、麒麟、流星狐、许愿灯、星辉龙）用元素团子兜底。这次用同一套 Codex `image_gen` 流水线补齐：

- 提示词统一走「baby-stage spirit sticker」模板（chubby baby creature、oversized head、dot eyes、cream die-cut、no ground/shadow/text），每只带同元素已有幼体贴纸作参考；
- 批量脚本 `/tmp/artgen/gen-babies.sh`（一次性），15 张约 25 分钟；
- `import-art.py` 加 `--batch babies` 与 `JOBS_BABIES`（15 项，640 上限、无地面色替换）；
- `spriteImages.ts` 的 `SPRITE_IMAGES` 从硬编码 import 改成 `import.meta.glob('sp_*.png')` 自动收集 —— 以后再加幼体，丢文件即生效。

现在 **30 只幼体全部有专属贴纸**（每系 3 幼体 + 2 特殊 + 1 限定）。

### 图鉴未捕获卡：只留轮廓线

- 新增 `src/ui/outline.ts`：把贴纸画进离屏 canvas，取 alpha 通道做「内描边」（mask 减去腐蚀 3px 后的 mask，涂 ink `#3B2E26`，alpha 235），输出 dataURL；按 src 缓存，同一张图只算一次；
- `DexPanel` 未捕获卡渲染轮廓图而不是灰色实心剪影，也不再盖「？」角标；
- 好处：轮廓天然按物种走（幼体就是各自形状，进化形态用该元素的成体/完全体轮廓），未捕获的卡也能看出"这只大概长什么样"。

验证：`tsc` 通过；无头 Chrome 逐系截 5 元素图鉴（30/60 已捕获状态）+ 空收集状态 + 养成页，0 console/pageerror；`game_studio_build`（buildId `2d3e386a0b30`，5.51MB）+ export。

截图：`docs/spirits-babies.png`（15 只新幼体）、`docs/dex-outline.png`（轮廓线状态）、`docs/dex-babies-owned.png`（已捕获状态）。

## 声音 + 精灵真的去干活（2026-11-21 第五轮）

### 声音

- `src/game/audio.ts`：音效全部用 WebAudio 现场合成（不占包体）—— 点击、播种、浇水、施肥、收获、卖东西、买种子/动物、孵蛋、喂食、派工、战斗命中、技能、胜利、失败、报错；
- BGM 是一段 60 秒循环 mp3（本地 `music_generate` 生成：F 大调、88bpm、吉他+沙锤，`src/assets/audio/bgm.mp3`，1.19MB）；
- `inline.py` 增加音频内联（mp3/wav/ogg/m4a → `data:audio/...;base64`），单文件导出仍然可离线播放；
- 浏览器策略：第一次点击/按键时解锁 `AudioContext` 并淡入 BGM；顶栏新增「声音/静音」按钮，状态记在 `crystal-farm-audio-muted`，沙箱里写不了就退回内存。

### 精灵工作从「数值加成」变成「真的在干活」

之前派工只改隐藏数值（生长倍率、品质权重），玩家看不到精灵做任何事，所以感觉"选了浇水它也不去浇"。这一轮：

- 农场里现在会显示**所有有工作的精灵**（不只幼体），头顶会周期性冒出工作图标（💧/💎/🧺…）；
- `useGame` 的每秒 tick 里新增：负责浇水的精灵每 20 秒会自动挑一块没浇透的地浇上（消耗体力，toast 报"第 N 块地"）；
- `PixelWorld` 检测到某块地 `waterCount` 变大时，在那块地上播浇水水花，并让负责浇水的精灵走过去 —— 看起来就是它干的；
- 采集水晶原本就有被动产出（平均 10 分钟 1 颗），现在精灵也会在农场里走动并把结晶带回来；
- 工作说明文案同步更新（`data.ts` 的 `JOBS`）。

施肥 / 收获 / 驱虫 / 看守仍是数值加成（没有对应实体动作），说明里写清楚了。

验证：`tsc` 通过；fixture 存档（3 只精灵派了浇水/采集）跑 21 秒，确认第 1 块地 `waterCount` 0→1、出现"结晶"提示、农场画面出现精灵与工作气泡，0 console/pageerror；`game_studio_build`（buildId `06a104d1d28f`，7.18MB）+ export，blob iframe 正常。

截图：`docs/jobs-working.png`（精灵在农场干活）、`docs/sound-toggle.png`（顶栏声音按钮）。

## 六个工种全部自动化（2026-11-21 第六轮）

用户要求：「收获最好能让它自己收，擅长收获的精灵会有加成，其他功能也是，施肥收获驱虫等全部完善一下」。

### 虫害机制（新的）

- `Plot` 增加 `pest?: number`；生长中的地块每秒有 0.11% 概率闹虫（有火系驱虫精灵在岗时降到 0.055%）；
- 闹虫的地 **生长速度 ×0.55**，画面上地块右上角爬一只 🐛，弹窗里出现红字提示与「驱虫」按钮（免费，点了就清）；
- 存档迁移补了 `pest` 字段（否则重载会丢）。

### 每个工种都真的会动

tick 里每个工种挑 `jobEff` 最高的精灵，按固定间隔行动（专长元素 ×0.7 间隔），干完在画面上有反馈：

| 工种 | 自动行为 | 间隔 | 专长加成 |
| --- | --- | --- | --- |
| 浇水 | 挑一块没浇透的地浇一次 | 20s | 水系：额外推进 2% 生长 |
| 收获 | 成熟作物自动帮玩家收（和手动同一套结算） | 15s | 木系：多收 1 份 |
| 施肥 | 消耗背包 1 袋普通肥料给一块地施肥 | 45s | 土系：顺手把第二块也施了（不额外消耗） |
| 驱虫 | 清掉一块地的虫 | 12s | 火系：在岗时虫害概率减半 |
| 看守 | 把动物产出的蛋/奶/毛收进背包 | 40s | 土/光：收获 5% 概率产量+1（原有） |
| 采集水晶 | 随机带回一颗结晶 | ≈10min | 光系（原有） |

- 收获/驱虫的画面反馈：作物被收掉时地块上冒金色粒子与「+收获」，虫被清掉时冒绿色粒子与「虫没了」，干活精灵会走到那块地旁边；
- toast 会写清是谁做的、有没有吃到专长加成；
- 工作说明（`JOBS[].desc`）同步重写。

验证：`tsc` 通过；fixture（5 只精灵分别派 5 个工种 + 一块成熟胡萝卜 + 一块带虫白蒜 + 一块待施肥玉米 + 鸡有 2 个蛋）跑 20–55 秒：胡萝卜被自动收进背包（木系 +1，共 3 个）、虫被驱掉、地块被浇水、玉米施上肥、鸡蛋被收进背包，0 console/pageerror；`game_studio_build`（buildId `fe85f33e2806`，7.18MB）+ export，blob iframe 正常。

截图：`docs/jobs-automation.png`（精灵自动干活 + 水系加成 toast）、`docs/pest-popup.png`（虫害提示与驱虫按钮）。

## 工种图标 + 「看守」改名（2026-11-21 第七轮）

- 六个工种不再是 emoji，改成和全站同一套的自绘 SVG（`src/ui/Icon.tsx` 24 网格 / 1.75 描边）：
  - 浇水 `drop`、施肥 `fert`（肥料袋）、收获 `basket`（带提手的篮子）、驱虫 `bug`（带斑点的虫）、采集水晶 `gem`、牧场照料 `pail`（奶桶）；
- 农场里精灵头顶的工作气泡也换成同一套矢量图形（`PixelWorld.drawJobGlyph`），不再依赖系统 emoji 字体，沙箱/离线环境显示一致；
- **「看守」改名「牧场照料」**（id 仍是 `guard`，存档不受影响）：原名容易被理解成"守夜/巡逻"，其实它做的是替你收动物产出；同时把说明改成「每 40 秒帮你收一次动物的蛋/奶/毛；收获时 5% 概率产量+1」。
- 验证：`tsc` 通过；养成页工种 chip、农场气泡、弹窗均正常，0 console/pageerror；`game_studio_build`（buildId `2bdb2abd2d77`，7.18MB）+ export，blob iframe 正常。
- 截图：`docs/job-icons.png`（六个图标，3x）、`docs/job-bubbles.png`（农场里的工作气泡）。

## 战斗界面按 JRPG 参考重做（2026-11-21 第八轮）

用户给了张经典 JRPG 手机战斗界面参考（场景在上、状态框在左上、下方一行行大指令、底部 自动 / 逃跑），照这个结构重排了 `BattlePanel`：

- **战场**：`h-[248px] sm:h-[268px]`，天空渐变 → 地平线（top 58%）→ 地面渐变；远景放同套贴纸（樱花树、两段围栏、草花、干草捆），我方精灵在左、魔物在右，双方脚下有椭圆投影；魔物名字 pill + 血条 + 数字。
- **左上状态面板**：头像 + 名字 + `Lv./元素/克制`，生命条（数字），能量三颗结晶 —— 对应参考图的 `HP / MP` 框。
- **队友血线**：一行 chip，出战角色左侧莓红竖条，倒下成员降透明度。
- **指令区**：三行大按钮（攻击 / 技能 / 防御），每行带图标、标题、一句说明；技能行在幼体时禁用并写明「进化后解锁」，能量不足时提示 `能量 x/3`。
- **战报**：独立面板，标题 + `max-h-[196px]` 滚动。
- **底部两个等宽大按钮**：`自动战斗` / `逃跑`；自动战斗开着时按钮高亮、标题条出现「自动战斗中」pill，每 1.5 秒自动出一手（能量满优先放大招）。
- 刚进战斗会自动滚到页面顶部，避免 sticky 顶栏压住状态面板。

验证：`tsc` 通过；`tools/battle-shot.mjs`（battle11-stage / battle11-boss）与 `/tmp/auto-test.mjs`（自动战斗 7 秒，日志正常增行：普通攻击 → 反击 → 倒下 → 接替）均 0 console/pageerror；480 窄屏战斗页完整可用。
`game_studio_build`（buildId `953dd32e03b6`，7.19MB）+ export，blob iframe 正常。

截图：`docs/battle-jrpg.png`、`docs/battle-auto.png`、`docs/battle-narrow.png`、`docs/battle-boss.png`。

## 五张战斗背景 · 按五行自动切换（2026-11-21 第九轮）

用本机 Codex（`gpt-5.6-sol` + 内置 image_gen）批量出了五张 16:9 战斗背景，接进战斗页：

| 元素 | 场景 |
| --- | --- |
| 木 | 林间空地（樱花 + 苔石 + 落叶） |
| 火 | 熔岩山谷（岩脊 + 远处熔岩河 + 火星） |
| 水 | 水滨浅滩（浅海 + 沙滩 + 芦苇） |
| 土 | 荒原矿丘（岩台 + 矿晶 + 土路） |
| 光 | 光之丘（日出 + 光柱 + 花田） |

接入方式：

- `src/assets/battle/bg_<元素>.png`（1536×864），`src/game/battleBg.ts` 用 `import.meta.glob` 自动建表；
- `BattlePanel` 按**敌人元素**取图铺满战场（世界 BOSS 用光系那张），缺图自动回退到原来的手绘天空+草地；
- 战斗框很扁（约 3.8:1），每张按元素单独设了取景位置 `bgPos`（wood 62% / fire 56% / water 66% / earth 60% / light 62%），保证地平线落在角色脚下附近；
- `tools/import-art.py` 新增 `--batch bg`：任意尺寸 16:9 图会居中裁切并缩到 1536×864；`tools/bg-elements.mjs` 一次跑五系战斗截图做回归。

验证：`tsc` 通过；五系各打一场（史莱姆/魔狼/玄龟/野猪/古龙）背景正确切换、0 console/pageerror；`game_studio_build`（buildId `e0bf01386baf`，7.29MB）+ export，blob iframe 正常。

截图：`docs/battle-bg-sheet.png`（五张原图）、`docs/battle-bg-{wood,fire,water,earth,light}.png`（游戏内）。

## 测试模式（2026-11-21 第十轮）

顶栏多了一个「测试」（虫子图标）按钮，打开 `DevPanel`：

- **三套存档预设**（点了立即生效并关闭面板）：
  - 中期：Lv6 · 8 块地（成熟/生长/空）· 4 只动物 · 5 只精灵各带工种 · 3000 金币；
  - 后期：Lv14 · 12 块地大半成熟 · 满图鉴 60/60 · 8 只高阶精灵（含成体/完全体）· 26000 金币；
  - 只解锁图鉴：保留当前进度，图鉴直接 60/60。
- **快捷作弊**：+5000 金币、各系水晶 +20、地块全部催熟、精灵蛋立即孵化、农场等级 +1、全体精灵 +10 级、补满肥料、满图鉴。
- 面板底部显示当前 `Lv/金币/精灵数/图鉴数`，并有「回到新手」（清档重开）。

实现：
- `useGame` 暴露 `devSet(patch)`（内部 `setState(patch)`，会照常写本地存档）；
- `makeSprite` 改为导出，`src/game/devPresets.ts` 用它 + `calcStats` 造出带等级/工种的精灵；
- `Plot` 支持直接给 `plantedAt` 偏移，所以「催熟」只是把时间往前拨 15 分钟；
- 只影响这台浏览器里的存档，导出包默认仍是新手开局。

验证：`tsc` 通过；中期/后期预设各点一次，存档字段（coins/farmLevel/plots/sprites/dex/animals）与面板显示一致，0 console/pageerror；后期预设后直接进战斗页打了熔岩巨像（成体精灵、技能能耗 1/3 正常）。`game_studio_build`（buildId `600ce9198d23`，7.30MB）+ export，blob iframe 正常。

截图：`docs/dev-panel.png`、`docs/dev-late.png`、`docs/dev-late-battle.png`。

## 战斗精灵去白框 + 里程碑（2026-11-21 第十一轮）

反馈：后期存档有点无聊；战斗里我方精灵有个米色贴纸底框、跟背景不融合、也偏小。

**战斗页**
- 我方精灵去掉 `sticker-tile-lg` 底框，直接透明贴纸叠在背景上（成体/完全体保留元素色外发光）；
- 我方 96px → **128px**，敌方 112 → 128px，BOSS 144 → 160px，双方同高、脚下椭圆投影加宽加淡；
- 状态面板里的头像仍是小圆贴纸，不需要改。

**里程碑（图鉴页顶部）**
9 个目标，进度全部从存档直接算、不需要埋点；达成后点「领取」发奖励，已领的记在 `goalsClaimed`（存档迁移补 `[]`，老存档不报错）。

| 目标 | 奖励 |
| --- | --- |
| 农场 Lv10 / Lv20 | 2000 金币 / 6000 金币 + 稀有肥料×5 |
| 图鉴 20 / 40 / 60 只 | 1500 金币 + 双系结晶 / 4000 金币 + 五色结晶 / 12000 金币 + 五色结晶 + 稀有肥料×10 |
| 精灵 5 / 10 只 | 1200 金币 / 3500 金币 + 稀有肥料×4 |
| 收服 3 只传说 | 8000 金币 + 光结晶×8 |
| 攒到 5 万金币 | 五色结晶 + 稀有肥料×3 |

验收：`tsc` 通过；后期存档下里程碑显示 6/9 达成，点「领取」金币 26000 → 28000、按钮变「已领」、toast 正常；战斗页双方 128px、无底框、0 console/pageerror。`game_studio_build`（buildId `84147e495bba`，7.31MB）+ export，blob iframe 正常。

截图：`docs/battle-big-sprite.png`、`docs/milestones.png`。

## 三个终盘系统（2026-11-21 第十二轮）

### 1. 星辰觉醒（精灵升阶外观）

究极体 **Lv.60 + 3 颗星尘碎片** → 「星辰觉醒」：全属性 +20%，外观换成星辰形态（更饱和 + 金色光晕，战斗中额外一层元素色外发光）。

- 数据：`Sprite.star?: boolean`；`STAR_LEVEL=60`、`STAR_SHARD_COST=3`、`STAR_MUL=1.2`（`src/game/data.ts`）。
- 接口：`awakenStar(spriteId)`（校验阶段/等级/碎片，重算属性并回满血）。
- 星尘碎片来源：野外战斗 15%、世界 BOSS 必掉 1 颗。
- 展示：养成页卡片「星辰」角标 + 呼吸光效；战斗舞台/队友 chip 金色发光；农场里精灵脚下金色光晕 + `saturate/brightness` 提亮。

### 2. 农场主装备 + 外观

新增「农场主」页签（`src/components/OwnerPanel.tsx`）：

- 9 件装备、3 个槽位（工具 / 服装 / 饰品），只加**农场收益**（生长 / 品质 / 水晶 / 售价），不参与战斗；
- 掉落：野外战斗 25%、世界 BOSS 必掉（BOSS 可掉 T3），不占背包格，记在 `ownedEquips`，穿戴在 `ownerEquip`；
- 收益合并进 `workBonuses()`（`growMul/qualAdd/crystalAdd` + 新增 `coinMul`），售价倍率在 `sellItem` 生效；
- 外观：服装决定农场主色调（原色 / 奶油色 / 星辉），农场画布用 `ctx.filter` 给农夫上色。

### 3. 农场扩建：温室 + 池塘

- `Plot.kind: 'soil' | 'greenhouse' | 'pond'`；`PLOT_KINDS` 定义价格与效果（温室 1400 金币：生长 ×1.35、品质 +15%；池塘 1800：水晶 +20%）；
- **24 块地全部开垦后**，空地可以在弹窗里改造成温室/池塘（`convertPlot`），不新增地块、不动已有布局；
- 两种新作物（Codex 出图 + `import-art.py --batch crops2`）：温室「兰花」（240s / 卖 880 / 光系 45%）、池塘「莲藕」（300s / 卖 1180 / 水系 55%），种错地块会提示；
- 画布表现：温室画玻璃框 + 顶棚、池塘画水面波纹；种子商店新卡带「需温室/需池塘」标签。

### 验证与产物

- `tsc` 通过；无头 Chrome 走完：终盘存档（`devPresets.endGame`：24 块地含温室/池塘、兰/莲藕、装备齐、一只星辰觉醒）→ 农场/农场主/养成/战斗四页截图，0 console/pageerror。
- 新增 dev 预设「终盘存档」，测试时从测试面板一键进入。
- `game_studio_build`（buildId `6d3b2af501d4`，7.41MB）+ export，blob iframe 正常。
- 截图：`docs/star-form.png`、`docs/star-battle.png`、`docs/owner-gear.png`、`docs/farm-expansion.png`、`docs/new-content-sheet.png`。

## 修复：后期档卡成 PPT（2026-11-21 第十三轮）

用户反馈「后期档卡爆了」。无头 Chrome 量化：终盘档帧率 **4 FPS**（平均 240ms/帧），每个页签切换 650–1900ms。

根因：`drawWalker` 里给农场主套外观滤镜时写的是

```ts
if (w.tint) ctx.filter = w.tint   // 在 ctx.save() 之前
ctx.save()
```

这个 `ctx.filter` 落在 save 之外，**不会随 restore 复位**，于是它把同一帧后面绘制的谷仓、围栏、24 块地、动物、精灵全部 CPU 过一遍滤镜，而且下一帧继续残留（DPR 2 的 2560×1520 画布逐 drawImage 滤镜 ≈ 每帧 200ms+）。

修复：

- 把 tint 赋值挪进 `ctx.save()/restore()` 之内，只作用于农场主自己；
- 在 `requestAnimationFrame` 回调开头加 `ctx.filter = 'none'` 兜底，任何路径漏设都不会污染下一帧。

结果（同一终盘档）：**60 FPS / 平均 16.7ms / p95 16.7ms**，页签切换 630–800ms（含 600ms 等待），0 console/pageerror。

验证脚本：`/tmp/perf.mjs`（注入终盘存档 → 测 rAF 间隔 + 切页耗时）、`/tmp/perf-late.mjs`（后期档同测）；截图 `docs/perf-late-farm.png`。

## 新增「喂食」农活 + 战斗后台运行（2026-11-21 第十四轮）

### 喂食（第 7 个工种）

- `JobId` 加 `'feed'`，`JOBS` 新增 `{ name: '喂食', best: ['wood', 'earth'] }`：每 30 秒自动喂**最饿的一只**动物，从背包里挑它能吃的作物（优先消耗数量少的），饱腹 +35（优质及以上按品质加，木/土系擅长再 +10）；
- 图标：新增 `feed` 图标（食槽 + 颗粒），养成页 chip、农场工作气泡（`drawJobGlyph`）同一套；
- 逻辑挂在 `useGame` 的每秒 tick 里，和浇水/施肥/收获/驱虫/牧场照料并排；
- 验证：给咕咕鸡/绵绵羊各派 1 只喂食精灵，30 秒后咕咕鸡饱腹 20→49、背包玉米 4→3，0 console/pageerror。

### 战斗后台运行

- `BattlePanel` 增加 `active` 与 `onStatus` 两个属性：`Home` 里把它**常驻挂载**（`tab !== 'battle'` 时用 `hidden` 包住），所以切到农场/养成/图鉴时组件不卸载，自动战斗的 1.5 秒计时器继续跑；
- 切走后顶栏出现「⚔️ 自动战斗中 · 敌人名 + 血条」胶囊，点一下回到战斗页；自动没开时文案变「战斗待操作」；
- 进战斗时的滚到顶部只在战斗页可见时执行，避免在别的页签里把页面滚走；
- 验证：世界 BOSS 战开自动 → 切到农场 6 秒 → 回战斗页，BOSS 血量 99812→98812、战报新增多行、我方血量下降，胶囊在后台期间可见，0 console/pageerror。

`game_studio_build`（buildId 见下）+ export；截图 `docs/feed-job.png`、`docs/battle-background.png`、`docs/battle-background-return.png`。

## 美术规格统一（2026-11-22 C 方案第 1、2 步）

问题：同屏混着两套画风 —— AI 新图 41 张 vs 早期手绘 55 张（描边色偏红黑、线更细、白边更虚、饱和度两套）。

### 1. 规格书

新增 `docs/art-style-bible.md`：描边 `#5A4335`、die-cut 边 `#FDF7EC` 92% / 贴地布景 `#F2ECDA`、边厚 1.2% 最长边、明暗 2 层、分组饱和度（作物 0.50 / 动物 0.30 / 道具 0.33 / 精灵 0.42）、禁止投影/地面/文字/外发光、工具链顺序与验收标准。

### 2. 归一脚本

新增 `tools/normalize-art.py`（可重复运行，原图备份在 `src/assets/sticker-pre-normalize/`）：

1. **剥旧边**：只剥贴边一圈（≤3% 最长边）里和透明区连通的近奶白像素，避免把奶油色的身体也剥掉；
2. **补统一边**：按 `clean_mask`（中值+模糊+阈值）重建外轮廓，画布四边各撑大 r 再补 die-cut 边，厚 1.2%，贴地布景用地面色；
3. **描边归一**：暗部像素的色度按目标棕 `#5A4335` 重映射，保留原明暗层次（黑眼珠等低饱和暗部不动）；
4. **饱和度归一**：按分组目标温和缩放（钳在 0.8–1.25 之间）。

例外：

- `plot` 跳过（接入时已手工把边色并进土壤色，重复剥边会把土壤色冲淡）；
- 早期手绘的柔边资产（`SOFT_HALO` 名单：鸡/羊/牛/主角/干草/水槽/石子/花/独轮车/木牌/水壶/奶罐、旧作物 5 张、常用旧幼体）只做描边色与饱和度，**不重建 die-cut 边** —— 它们的浅色晕圈是画的一部分，硬收会切出描边碎片（试过，羊/鸡的轮廓被切碎）。

验证：96 张全部处理；农场/战斗同屏截图对比（`docs/art-normalize-farm.png`、`art-normalize-battle.png`）、资产前后对照（`docs/art-normalize-sheet.png`）；`tsc` 通过，游戏内 0 console/pageerror。

**结论**：这一步统一了「描边色 / 边厚 / 饱和度」，但线条粗细、明暗层数与造型语言（团子 vs 人形立绘）靠后处理改不了 —— 需要第 3 步重画同屏最显眼的 10 张（主角 2、动物 3、旧作物 5），清单已写进规格书第 8 节。

## 农场主换装（2026-11-22）

原来「换衣服」只是给同一张立绘套一层颜色滤镜（奶油=泛黄、星辉=偏色），看起来像滤镜而不像换装。现在主角改成**可换装的立绘**：

- 两性别 × 三套服装 = 6 张贴纸：`owner_<girl|boy>_<linen|embroidery|star>.png`
  - 亚麻：米色亚麻围裙 + 苔绿裙 / 背带工装 + 草帽（默认）
  - 绣花：奶油绣花围裙连衣裙 + 蕾丝与缎带 / 奶油绣花马甲 + 绿领结
  - 星辉：深蓝星光礼服 + 小斗篷 + 小冠 / 深蓝星光短袍 + 斗篷
- 服装 → 外观的映射沿用 `ownerLook()`（classic / cream / star），`src/game/ownerArt.ts` 用 `import.meta.glob` 收图，文件一放进 `src/assets/sticker/` 就自动生效；
- 农场里的小人按当前服装换图（`PixelWorld` 每帧比对 `st.ownerImgs[look]`），星辉套额外保留一点高光；伙伴 NPC 也换成新画风（对方性别的亚麻套）；
- 「农场主」页签顶部新增外观预览卡（大图 + 当前外观名）。

处理链：`codex exec` 出图（带 girl/boy 参考图）→ `import-art.py --batch owners`（这批是奶油纸底而不是纯白，新增 `flood_pale` 泛洪抠底）→ `normalize-art.py` 重建 die-cut 边 → `./rebuild.sh`。

验证：`tsc` 通过；无头 Chrome 六种组合（小莓/小禾 × 三套）农场与农场主页截图，0 console/pageerror；`game_studio_build` + `game_studio_export`，blob iframe 正常。

截图：`docs/owner-outfits.png`（六套）、`docs/owner-outfit-farm.png`（农场三套对比）。

## 换装扩充 + 单人农场 + 破壳画面（2026-11-22 第十五轮）

### 1. 六套服装

服装从 3 套扩到 **6 套**（两性别各 6 张，共 12 张立绘）：

| 装备 | 外观 | 加成 |
| --- | --- | --- |
| 亚麻围裙（T1） | 亚麻 | 品质 +6% |
| 绣花围裙（T2） | 绣花 | 品质 +12% |
| 星光礼服（T3） | 星辉 | 品质 +18% |
| 晴天雨衣（T2，新） | 雨衣 | 品质 +10% · 水晶 +4% |
| 夏日祭和服（T3，新） | 祭典 | 品质 +14% · 售价 +8% |
| 暖冬毛呢（T2，新） | 冬装 | 生长 +8% · 品质 +8% |

`OwnerLook` 扩成 6 值，`ownerArt.ts` 的 `LOOK_SLUG` 同步；装备箱里点服装 chip 立刻换立绘。

### 2. 农场只留玩家一个人

去掉原来的「伙伴 NPC」：主角由所选性别决定，农场里只有他/她一个在走。选角页文案同步改成「之后农场里只有你」。

### 3. 破壳画面

孵化后不再只弹一条 toast，而是盖一层「破壳」画面（`src/components/HatchReveal.tsx`）：

- 背景虚化 + 元素色柔光 + 六颗闪烁星点；
- 新精灵大图（史诗/传说套 `.star-art` 光效）、稀有度 / 元素 / 进化线三枚 pill、名字与描述；
- 「收下它」关闭，`lastHatch` 只存内存（重载后不会重复弹）。

处理链补充：这批新图有的底色是**浅灰**而不是奶油，`import-art.py` 的泛洪改成「按四角采样底色 + 容差」的 `flood_bg`，两种底都能抠；之后照旧 `normalize-art.py` 重建 die-cut 边。

验证：`tsc` 通过；无头 Chrome 六套换装（农场 + 农场主页）、破壳流程（点「敲开蛋壳」→ 弹画面 → 收下 → 精灵入队）0 console/pageerror；`game_studio_build` + export，blob iframe 正常。

截图：`docs/owner-outfits.png`（12 套）、`docs/owner-outfit-farm.png`（新三套在农场）、`docs/hatch-reveal.png`、`docs/owner-panel.png`。

## 破壳画面分级光效 + BOSS 血量修正（2026-11-22 第十六轮）

### 1. 破壳画面按稀有度分级

光效强度跟**蛋的稀有度**走（不是孵出来的物种稀有度 —— 史诗蛋可能孵出特殊精灵，光效仍按史诗放）：

| 蛋稀有度 | 光效 |
| --- | --- |
| 传说 | 金色光雨（16 道下落光条）+ 元素光晕 + 大图星辉 |
| 史诗 | 双层光柱（元素色 + 奶油色）从顶部落下 |
| 稀有 | 两圈扩散光环 |
| 普通 / 优质 | 六颗闪烁星点 + 元素柔光 |

实现：`GameState` 新增 `lastHatchRarity`（跟着 `lastHatch` 一起只存内存），`HatchReveal` 取 `max(蛋稀有度, 物种稀有度)` 决定光效；CSS 在 `index.css` 加 `.hatch-rain` / `.hatch-beam` / `.hatch-ring` 三个动画类。

### 2. 「花精打 BOSS 不掉血」的真相（两个问题）

用户指的是**花精自己的血条不动**。根因是「功能线」精灵的被动每回合回血 8%（594 × 8% ≈ 47）大于 BOSS 反击（固定 55 攻、减防后约 35），净回血 +12/回合 —— 所以她永远满血，看起来像没受伤。

另外 BOSS 血量基数也确实太大（99999），单次 110 点只有血条的 0.11%，那是第二个问题。

修：

- BOSS 血量 `99999 → 6000`（一队精灵打十来回合能打掉一截，参与感正常）；读档时把老档的 5 万多血钳到 6000；
- 全服缓慢削血从「每秒 0–25」降到「35% 概率每秒 1–6」，不会自己把 BOSS 秒了；
- 战斗里加**伤害飘字**：打在敌人身上冒出 `-110`（会心莓红、受击砖红、治疗森绿），带白色描边保证在亮背景上也看得清；
- **功能线自愈改成「受伤才回、回 6%」**（原来看似每回合无条件回 8%，能把伤害完全抵消）；现在 594 血的花精吃 BOSS 一击 57，回 36，净掉 21/回合；
- **BOSS 反击按目标血量上限的 12% 结算**（原来固定 55，打高血量精灵等于挠痒），一队三只 Lv40+ 精灵约 20 回合能打死。

验证：

- `/tmp/bossfix.mjs`（花精 Lv38 单挑 BOSS）：花精血量 594 → 390（4 回合），BOSS 6000 → 5557，双方飘字都可见；
- `/tmp/bosswin.mjs`（三只 Lv40+ 精灵自动战斗）：BOSS 在 20 回合被打死，掉星尘碎片×1 + 装备「木柄锄头」，战报给出「全服协力击杀」；
- `/tmp/hatchtiers.mjs`：四种蛋的破壳画面各截一张，0 console/pageerror。

`game_studio_build` + export；截图 `docs/hatch-tiers.png`、`docs/boss-damage.png`、`docs/boss-kill.png`。

## 稀有度分级 + 养成简化 + 掉落与怪物扩充（2026-11-22 第十七轮）

### 1. 史诗 / 传说一眼能分

之前两个稀有度只差一个小圆点颜色，现在整张卡分级：

| 稀有度 | 卡片样式 |
| --- | --- |
| 传说 | 金色渐变卡面 + 金色描边 + 项目角「传说」金标 + 流光扫过 |
| 史诗 | 紫色渐变卡面 + 紫色描边 + 项目角「史诗」紫标 |
| 稀有及以下 | 保持原来的纸面卡 |

图鉴（`DexPanel`）和养成（`SpritePanel`）共用同一套 `card-rar-epic` / `card-rar-legend` / `rar-badge`，CSS 在 `index.css`。

![图鉴稀有度分级](farm-tale/docs/rarity-tiers.png)

### 2. 养成界面简化

原来每张卡把「描述、特长、技能、经验、体力、工种、成长倾向、三组投喂」全摊开，一屏只能看一只。现在：

- 默认只留：头像 / 名字 / 稀有度 / 等级 / 三维 / 经验体力（压成一行两颗细条）/ 工种 / 星辰觉醒；
- 描述、技能、成长倾向、投喂全部收进「详情」按钮，点开才展开（按钮文字在「详情 / 收起」之间切换）。

![简化后的养成卡](farm-tale/docs/sprite-simplified.png)

### 3. 怪物 6 → 12、打怪有掉落

**新增 6 只精英变体**（复用同元素贴纸 + `filter: hue-rotate/saturate` 区分配色，不用重新出图）：

| 精英 | 元素 | 解锁 |
| --- | --- | --- |
| 荧光史莱姆 | 木 | Lv.8 |
| 岩甲兽 | 土 | Lv.18 |
| 霜牙狼 | 水 | Lv.26 |
| 潮汐贝王 | 水 | Lv.34 |
| 焚岩兽 | 火 | Lv.42 |
| 星辉幼龙 | 光 | Lv.52 |

**掉落系统**（照常见 RPG 的做法：普通怪掉材料、精英掉更多、BOSS 必掉）：

- 新增 7 种战利品材料：野草纤维 / 粗兽皮 / 尖牙 / 龟甲片 / 火种 / 龙鳞 / 结晶尘（都能卖钱，单价 8–120 金币）；
- 每只怪有自己的 `drops` 表（材料 + 概率 + 数量区间），击杀后按概率滚一次；空手不会发生（兜底给 1 个结晶尘）；
- 胜利后弹「战利品」面板：经验、金币、结晶、材料一格格列出来，点「收下战利品」关闭；
- BOSS 额外固定给 6 个结晶尘 + 2 片龙鳞。

![战利品面板](farm-tale/docs/loot-panel.png)

![野外讨伐列表（12 只）](farm-tale/docs/enemy-list.png)

验证：`tsc` 通过；`/tmp/loot.mjs` 击杀荧光史莱姆后背包 `{木结晶×2, 野草纤维×3, 结晶尘×1}`，面板正常；稀有度、简化卡面、12 只怪列表截图各一张，0 console/pageerror。

## 装备强化 + 精英怪专属掉落（2026-11-22 第十八轮）

### 1. 用战利品材料强化装备

- 每件装备可强化 **+1 ~ +5**，每级让它的农场加成 ×1.25（+5 时是 1.25⁵ ≈ 3.05 倍基础值）；
- 消耗战利品材料，`tier` 越高越贵：

| 目标等级 | 材料（T1） |
| --- | --- |
| +1 | 结晶尘 ×5 · 野草纤维 ×4 |
| +2 | 结晶尘 ×7 · 粗兽皮 ×4 |
| +3 | 尖牙 ×5 · 龟甲片 ×3 |
| +4 | 火种 ×5 · 龙鳞 ×2 |
| +5 | 龙鳞 ×4 · 龟甲片 ×5 |

- 「农场主」页每个已穿戴槽位显示 `+N`、下一级需要的材料（够了是正常色，不够变灰）和「强化」按钮；材料不足或满级时按钮禁用；
- 数据：`EQUIP_MAX_LEVEL = 5`、`equipLevelMul()`、`enhanceCost(tier, level)` 在 `data.ts`；`GameState.equipLevels` 记等级，`workBonuses()` 里按等级缩放加成。

![强化界面](farm-tale/docs/equip-enhance.png)

### 2. 精英怪专属掉落（刷特定怪拿特定装备）

6 只精英各带一件**首次击杀必掉**的专属装备，之后再打就回到普通随机池：

| 精英 | 专属掉落 |
| --- | --- |
| 荧光史莱姆 Lv8 | 铜铃铛（水晶 +4%） |
| 岩甲兽 Lv18 | 精铁锄头（生长 +12%） |
| 霜牙狼 Lv26 | 银铃铛（水晶 +8% · 售价 +8%） |
| 潮汐贝王 Lv34 | 晴天雨衣（品质 +10% · 水晶 +4%，外观「雨衣」） |
| 焚岩兽 Lv42 | 暖冬毛呢（生长 +8% · 品质 +8%，外观「冬装」） |
| 星辉幼龙 Lv52 | 星光礼服（品质 +18%，外观「星辉」） |

战利品面板里单独一行标「专属装备」：

![专属装备掉落](farm-tale/docs/exclusive-drop.png)

实现：`EnemyDef.exclusive?: string`；`battleWin()` 第七参 `exclusive`，未拥有就塞进 `ownedEquips` 并 toast；`BattlePanel` 结算时判断并写进 loot 面板。

验证：`/tmp/enhance.mjs`（精铁锄头连点两次 → +2，生长 +12% → +18%，材料正确扣除）；`/tmp/excl.mjs`（首杀荧光史莱姆得 `["hoe_iron","bell_copper"]`，再杀一次不再给专属）；`tsc` 通过，0 console/pageerror。

---

## 第十九轮：合成饰品 · 每日首杀 · 套装 · 传说立绘

### 1. 工作台（材料合成饰品）

打怪掉的材料不再只是强化燃料：野草纤维 ×6 + 粗兽皮 ×4 + 结晶尘 ×3 → **随机一件还没拥有的 T2 饰品**（不会重复出已有的）。

- `useGame.craftCharm()`：先校验材料，再扣料、抽池；池子为空时提示「饰品已经集齐了」且不扣料；
- 「农场主」页新增「工作台」卡：三种材料的实时持有量（够/不够两态）+「合成饰品」按钮；
- 材料来源：12 只野外魔物 + 世界 BOSS 的战利品面板。

![工作台与套装](farm-tale/docs/equip-enhance.png)

### 2. 精英怪每日首杀

同一天里**第一次**击杀某只精英，额外拿 60% 金币 + 结晶尘 ×2，按「日期 + 敌 id」记录，隔天重置。

- `GameState.eliteDaily: { date: 'YYYY-MM-DD', ids: string[] }`；`battleWin()` 第八参 `eliteId`（`BattlePanel` 传 `ed.id`）；
- 去重实测：首杀 → 金币 1000→1096（+60 基础 +36 首杀）、结晶尘 2、记录 `{date:'2026-11-22',ids:['slime_elite']}`；把存档预置成「今天已拿过」再打 → 只给基础 +60。

### 3. 装备套装

三槽（工具/服装/饰品）都穿上、且三件都达到某个品阶时触发套装加成，乘在**装备提供的全部加成**上：

| 条件 | 套装 | 加成 |
| --- | --- | --- |
| 三件都 ≥ T2 | 精制套装 | 全部装备加成 ×1.1 |
| 三件都 ≥ T3 | 星辉套装 | 全部装备加成 ×1.25 |

- `workBonuses()` 返回 `setName` / `setMul`；「农场主」页在「当前加成」下显示「🔥 星辉套装 · 三槽成套：全部装备加成 ×1.25」。

### 4. 传说级专属立绘（15 张）

60 只精灵里 15 只传说级全部换成专属立绘，不再与同元素究极体共用一张图：

| 元素 | 传说级 |
| --- | --- |
| 木 | 上古树魔 · 生命之树 · 世界树苗 |
| 水 | 沧海龙王 · 极冰女王 · 潮汐圣兽 |
| 火 | 炎狱战神 · 地心炎魔 · 朱雀 |
| 土 | 大地泰坦 · 荒漠之主 · 麒麟 |
| 光 | 晨曦女神 · 月华仙灵 · 星辉龙 |

![15 只传说立绘](farm-tale/docs/legend-all.png)

- 出图：`/tmp/artgen-legend/gen.sh`（本机 Codex，`-i` 元素究极体 + 该只有的话再给一张旧贴纸），统一规格：奶白底 `#FDF7EC`、描边 `#5A4335`、平涂两层 + 一处高光、die-cut 边 1.2%、单主体无投影；
- 踩坑：`codex exec -C $ROOT` 的 cwd 是 ROOT，prompt 说「current directory」就把图写到 `$ROOT/image.png`，第一轮 15 张全判 FAIL；修法是跑完 `[ -f "$ROOT/image.png" ] && mv -f … "$name/image.png"`，并加「已存在则 skip」；
- 生命之树第一版和上古树魔撞脸（都是树干长脸的树人），按「神殿式树灵、无树干脸、金色果实 + 白花 + 心形光龛」重画；
- 接入：`import-art.py --batch legends`（900 上限、`pale=True` 吃奶油底）→ `normalize-art.py --only sp_<15 id>`（`SOFT_HALO` 里把 15 个 id 移出 `LEGEND_REPLACED`，强制重建 die-cut 边）；
- 图鉴/养成/战斗里同一张图共用（`SPRITE_IMAGES[speciesId]` 优先于元素阶段图）。

![图鉴里的传说立绘](farm-tale/docs/legend-dex-wood.png)
![战斗中的传说立绘](farm-tale/docs/legend-battle.png)

验证：`tsc` 通过；`game_studio_build` buildId `66d8d6f62e12`（8,353,049 bytes）；`game_studio_export` 同名单文件；blob 单文件 0 console/pageerror。

---

## 第二十轮：重画主角 / 动物 / 旧作物（10 张）

画风归一（第十九轮之前的 C 方案）只解决了描边色和饱和度，没解决**造型语言**——第一轮手绘的 10 张还带着细碎笔触和偏硬的转角。这一轮把它们全部按新规格重画：

| 类别 | 重画 |
| --- | --- |
| 主角 | 小莓（亚麻）、小禾（亚麻） |
| 动物 | 咕咕鸡、绵绵羊、花奶牛 |
| 旧作物 | 胡萝卜、白菜、金玉米、南瓜、草莓 |

![重画前后](farm-tale/docs/redraw-before-after.png)

- 出图：`/tmp/artgen-redraw/gen.sh`，每张给两张参考——**style 参考**（新规格的 `owner_girl_linen.png` / `sp_qilin.png` / `crop_lotus.png`）与**旧图**（保持角色和姿势），prompt 明确「match line weight / saturation / rounded shapes of the first reference, keep subject and pose of the second」；
- 接入：`import-art.py --batch redraw`（`pale=True` 吃奶油底；主角 640×760、动物约 470、作物 900×1000 与原尺寸一致）；`normalize-art.py` 里把 10 个 id 加进 `REDRAW_REPLACED` 从 `SOFT_HALO` 移出，强制重建 die-cut 边；
- 农场/选角/种子商店/牧草商店/背包图标全部走同一批文件，所以一次替换全站生效。

![重画后的农场](farm-tale/docs/redraw-farm.png)
![重画后的选角页](farm-tale/docs/redraw-select.png)

验证：`tsc` 无改动需求（只换图）；`game_studio_build` buildId `0673ea2d542a`（8,105,229 bytes）+ `game_studio_export`；农场页跑 0 console/pageerror（5 块地分别种 5 种作物 + 4 只动物都正常渲染）。

---

## 第二十一轮：布景重做（A 方案：精修贴纸风）

用户觉得场景「像贴纸拼贴、山寨」，诊断出三个原因：①每个道具都带奶油贴纸边；②透视不统一（谷仓、树是正面，地块是俯视，主角又是正面）；③地面是平涂色块 + 软椭圆，没有材质和接触阴影。选 A 方案：**保留贴纸画风，但让它们「长进场景里」**。

![布景前后](farm-tale/docs/scene-before-after.png)

### 1. 布景全部重画（10 件，去掉贴纸边、统一 3/4 俯视角）

谷仓（能看到右侧墙和屋顶厚度）、樱花树、栅栏段、草垛、石堆、花丛、独轮车、木牌、水槽、**地块**（3×3 土壤格 + 深土围边 + 石子）。

![新布景](farm-tale/docs/scene-props.png)

- 出图 prompt 明确「slightly raised three-quarter view」+「**no sticker border / no cream outline**」，并给新规格图当风格参考；
- `import-art.py --batch scene`（`pale=True` 吃奶油底，尺寸对齐原绘制框）；`normalize-art.py` 新增 `NO_RING` 集合——布景与活物（鸡/羊/牛/蜂/主角/作物）不再补 die-cut 边，只做描边归一到 `#5A4335` 和饱和度归一；
- 地块单独给了自己的饱和度目标 `0.46`（原来的 `prop 0.33` 会把新土壤压灰）。

### 2. 渲染层：接触阴影 / 深度排序 / 地面材质

- `drawProp` 换成**双层接触阴影**（外圈大而淡 + 内圈小而实），道具不再「浮」在纸上；
- 角色（主角、动物、工作精灵）原来是在所有道具之后统一绘制，现在**并入同一套 y 排序**——走到谷仓、栅栏后面会被正确遮挡；
- 地面：底色 `#EFE7D0`，色斑碎片化 + 降透明（不再是大块水彩印），叠 260 个小土斑 + 很淡的斜向割草条纹；小路去掉硬描边，改成柔边；牧场围栏内铺一层更暖的踩踏土色；
- 栅栏整排只画**一条连续长影**（原先每段各画一个椭圆投影，叠出一排黑块）；两侧竖排改画柱子长影；
- `ENV_FILTER` 从 `saturate(0.82)` 放到 `0.92`，配合更饱和的新布景。

![新场景](farm-tale/docs/scene-v2.png)

验证：`tsc` 通过；农场页 0 console/pageerror；`game_studio_build` buildId `813bfe8785f2`（7,852,522 bytes）+ `game_studio_export`。

---

## 第二十二轮：三套场景布局（可选）

上一轮改的是画风；用户要的是**布局**。把场景改成数据驱动：`PixelWorld.tsx` 新增 `LAYOUTS`（A/B/C），每套定义耕地网格（起点/间距/逐行右移）、牧场矩形、谷仓矩形、小路折线、装饰（树/草垛/石堆/花/独轮车/木牌/水槽）坐标，渲染全部读这张表。

| | 布局 | 一句话 |
| --- | --- | --- |
| A | 分区 | 左下耕地、右上牧场、左上谷仓、右下晒场；小径斜穿到右下 |
| B | 围合农场院（默认） | 谷仓压在左上当前景，耕地 4×6 居左，牧场占右半，小径绕过场院底部 |
| C | 斜向纵深 | 耕地逐行右移形成斜带，牧场右上、谷仓右下，小径从左上斜切到右下 |

- 小路从固定贝塞尔改成**折线描边**（宽填色 + 柔边 + 沿路石子），换布局只改点表；
- 谷仓/装饰的 y 排序按各自底部算，换位置后遮挡关系自动正确；
- 测试面板新增「场景布局 A/B/C」按钮（写 `localStorage['crystal-farm-layout']` 后刷新），可以现场切换对比。

![A 分区](farm-tale/docs/layout-a.png)
![B 围合农场院](farm-tale/docs/layout-b.png)
![C 斜向纵深](farm-tale/docs/layout-c.png)

验证：`tsc` 通过、三套布局均 0 console/pageerror；`game_studio_build` buildId `67adbe6b82d0`（7,854,769 bytes）。

## 第二十三轮：D 布局 · 小图重排（推倒重来版）

A/B/C 都还是「大贴纸摆在大空地上」。这一版把**所有单位缩小**、按「一张农场地图」来排：

| 项目 | 旧 | D |
| --- | --- | --- |
| 地块 | 88px | 62px（5 列 × 5 行 = 25 格，够放 24 块） |
| 角色/动物/精灵 | 原尺寸 | ×0.72 |
| 谷仓 | 300×265 | 218×200 |
| 小路 | 86px 宽的贝塞尔 | 40px 折线主干，从谷仓门口通到牧场门口 |
| 牧场 | 无缺口 | 下栏留**门**（该段栅栏不画），小路正是从门里进 |
| 前景 | 无 | 底边左右各一丛大花 + 石头，压在角色上方做框景 |

![D 布局](farm-tale/docs/layout-d.png)

实现：`LayoutDef` 新增 `plotSize` / `walkerScale` / `pastureGate` / `fg`（前景层），作物尺寸改成按地块比例（`PLOT_SIZE * 0.64`），所以以后调地块大小不用改绘制代码。测试面板 A/B/C/D 可切换。

验证：`tsc` 通过、0 console/pageerror。

## 第二十四轮：动物住处（鸡舍 / 牛棚 / 羊圈 / 蜂箱）

按用户要求：D 布局里删掉石堆、花丛、木牌，改为**给动物设计住处**。

![动物住处](farm-tale/docs/layout-d.png)

四件新布景（同一套 3/4 视角、无贴纸边）：

| 住处 | 对应动物 | 造型 |
| --- | --- | --- |
| 鸡舍 coop | 咕咕鸡 | 红色小木屋 + 奶油草顶 + 圆窗 + 下坡踏道 + 侧挂产蛋箱 + 食盆 |
| 牛棚 cowshed | 花奶牛 | 敞棚：两根木柱 + 草顶 + 左侧红板墙 + 干草卷 + 水桶 |
| 羊圈 pen | 绵绵羊 | 开放式矮栏 + 草垛 + 草料槽 + 半顶棚 |
| 蜂箱 hive | 小蜜蜂 | 三层木箱 + 小顶板 + 入口踏板 + 蜂蜜滴 |

- 四件沿牧场后侧排开，**动物只在住处前面的活动带里走动**（原先生成范围是整块牧场，会钻到房子后面）；
- 住处和动物走同一套 y 排序，动物走到房子前/后遮挡正确；
- 布景导入新增 `--batch housing`（`pale=True` 吃掉奶油底；鸡舍 300×280、羊圈 340×230、牛棚 380×300、蜂箱 200×300），并加进 `NO_RING`。

验证：`tsc` 通过、农场页 0 console/pageerror；`game_studio_build` + `game_studio_export` 已更新。

## 第二十五轮：牧场围栏重画（不再旋转贴纸）

之前的围栏是把横向栅栏贴纸**旋转 90°** 拼两侧，于是横木变成竖的、立柱变成横的——像一架梯子，四角还没接上。这一轮改成**直接画**：

- 木料颜色跟贴纸同源：横木 `#D9A96A`、高光 `#EBC98F`、立柱 `#E2B477`、描边 `#8A5B3A`；
- 前后两排 3 根横木 + 立柱，四角相接；前栏在门口留缺口，缺口两侧加高立柱当门柱；
- 两侧按透视画：立柱保持竖直，横木从后往前带一点斜度（向里收），不再出现"竖横木"；
- 前栏底下补一条淡长影，围栏落地；小路终点对到门口。

验证：`tsc` 通过、0 console/pageerror；`game_studio_build` + `game_studio_export` 已更新。

## 第二十六轮：温室区 / 池塘区（现场分区，不另开页面）

导航已经有 6 个页签，温室和池塘各自只有「2 种专属作物 + 1 条加成」，开独立页面会是一个空房间——所以改成**农场里画两个固定分区**：

![温室区与池塘区](farm-tale/docs/zones-greenhouse-pond.png)

- 耕地改成 **6 列 × 4 行 = 24 格**（正好放下 24 块地），**左上 2×2 是温室区、右下 2×2 是池塘区**，其余是普通农田；
- 弹窗里只有处在对应分区的空地才能改成温室/池塘，普通地会提示「温室在左上角、池塘在右下角」，不会再出现「随便哪块地都能改」的混乱；
- 两个区各加一个地标：温室是一圈玻璃棚（半透明玻璃 + 白框 + 人字棚顶 + 四角绿柱），池塘换成不透明水面（浅水渐变 + 水白边 + 水纹）+ 沿边的木栈道（带立柱与板缝）+ 三丛水草；
- 兰花/莲藕仍然只能种在对应地块里。

验证：`tsc` 通过、24 块地满铺 0 console/pageerror；`game_studio_build` + `game_studio_export` 已更新。

## 第二十七轮：修复「预览一片白」

**现象**：Game Studio 侧栏预览白屏（导出 HTML 直接打开是好的）。

**原因**：预览把游戏放进 `sandbox="allow-scripts"` 的 iframe，这是不透明源，**读 `localStorage` 会直接抛 SecurityError**。上一轮在 `PixelWorld.tsx` 模块顶层读了布局偏好（`localStorage.getItem('crystal-farm-layout')`）且没兜住，模块初始化就崩了 → React 没有挂载 → 白屏。

**修复**：

- `readLayoutPref()` 用 `try/catch` 包住 `localStorage`（读不到就用默认 `d`）；
- 测试面板里写布局偏好也加了 `try/catch`（预览里写不进去，但不报错）；
- 顺手修了另一个问题：温室玻璃棚/池塘木栈道原来**按分区坐标无条件绘制**，新开档还没改造时会出现「悬空的玻璃框和栈道」；现在只画**真的改造成温室/池塘**的地块。

验证方式：起本地 http，把一个 `sandbox="allow-scripts"` 的 iframe 指向构建产物（复刻 Game Studio 的预览环境），确认选角页 → 农场页都能渲染、0 报错。

`game_studio_build` `2aac51fb8aed`（7,931,473 bytes）+ export 已更新。

---

## 试玩反馈清单（第二十八轮，待改）

> 以下 7 条来自玩家试玩，先记录、暂不实现。原文保留，后面按优先级逐条做。

| # | 反馈 | 实现要点（初判） |
| --- | --- | --- |
| 1 | **图标太乱**：矢量图标和表情包（emoji）混用；精灵头顶的农作图标一直挂着，很突兀 | 统一成一套：全部走 `src/ui/Icon.tsx` 的 24 网格矢量图标；需要专门图形的（作物/材料/装备）用 AI 出贴纸后归一，不再用 emoji。精灵头顶工作图标改成「干活瞬间弹出一次」而不是常驻（`drawJobGlyph` 加持续时间与淡出） |
| 2 | 增加一个「种地农夫」相关的农种，后期主角只需要买种子 | 新增自动播种/自动收获的随从或设施（如「农事小助手」），后期解锁后玩家只负责买种子/选作物；需要与现有 7 种精灵工种区分定位 |
| 3 | **世界 BOSS 太容易掉东西**：3 级去打也掉皮肤 | 掉落表按伤害贡献/等级门槛分档：皮肤（`dress_starlight` 之类）设伤害占比或等级/战力门槛，低等级只给材料/金币；调整 `WORLD_BOSS` 的 loot 概率与保底 |
| 4 | 精灵战斗希望能**选择谁先上场**；战斗画面需要动画 | 编队改成有序队列（拖拽/上下移动决定 1/2/3 号位）；战斗加表现：出场滑入、攻击冲刺、受击抖动、技能特效、切人过渡 |
| 5 | **背包要有分类** | `InventoryPanel` 按类别分组：种子 / 作物 / 材料 / 结晶 / 装备 / 消耗品，带页签或分组标题与计数 |
| 6 | **误卖的东西最好能买回** | 记录最近 N 条卖出记录（物品+数量+金额+时间），商店加「回购」区，按原价（或加价 10%）买回，过期清空 |
| 7 | **BGM 不好听**，可以重新写个 8bits 风格 | 用 8bit（square/triangle/noise 通道）重写 BGM：主旋律 + 低音 + 鼓，60–90s 循环；先用 `music_generate` 出候选再挑 |

后续排期建议：1、3、5、6 是「体验硬伤」，2、4、7 是「系统/表现升级」。
