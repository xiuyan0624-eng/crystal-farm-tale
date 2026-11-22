# 晶灵农场物语 · Crystal Farm Tale

一个「种田 × 孵化 × 养成 × 战斗」的网页小游戏：种作物收获结晶 → 5 颗水晶孵出精灵 → 喂食决定进化方向 → 编队打野外怪和 World BOSS；精灵还会在农场里自动干活（浇水/施肥/收获/驱虫/喂食/采集）。

画面走奶油手账贴纸风，所有素材都是透明底贴纸 + die-cut 边；场景、UI、图标整套统一色板（纸面 `#FBF3E7` / 墨 `#3B2E26` / 莓果 `#D35F7B` / 鼠尾草 `#7C9B64` / 黄油 `#E7B453`）。

## 技术栈

- React 19 + TypeScript + Vite
- Tailwind（语义色 token 在 `tailwind.config.js`）
- 场景渲染：原生 Canvas 2D（`src/components/PixelWorld.tsx`），无游戏引擎
- 音效：WebAudio 现场合成（`src/game/audio.ts`）+ 一段 60s 循环 BGM
- 存档：localStorage（在不透明源 iframe 里自动退回内存）

## 开发

```bash
npm install
npm run dev          # 本地开发
./rebuild.sh         # 构建成「单文件自包含 HTML」（图片/音频都内联成 data URI）
```

`rebuild.sh` 会跑 vite → `inline.py`（把资源内联）→ `wrap-gamejs.mjs`（产出可被 Game Studio 用的 `game.js`）。

自包含产物在 `single/index.html`，可以直接双击打开、离线运行。

## 目录

```
src/
  game/            玩法状态机：useGame.ts（农场/孵化/养成/战斗/装备/BOSS）、data.ts（物种/作物/敌人/装备/材料表）
  components/      页面与画布：PixelWorld（农场场景）、BattlePanel、FusionPanel、SpritePanel、DexPanel、OwnerPanel、HatchReveal…
  ui/              设计系统：Icon、Card、Btn 等
  assets/          贴纸素材（sticker/）、战斗背景（battle/）、音频
tools/
  import-art.py    把 AI 出的 1024 图批量处理成透明底贴纸（白底/奶油底泛洪、去碎片、缩放）
  normalize-art.py 规格归一：重建 die-cut 边、描边色统一、分组饱和度
docs/              美术规格书（art-style-bible.md）
```

## 美术

- 规格书：`docs/art-style-bible.md`（描边 `#5A4335`、die-cut 边 1.2%、平涂 2 层 + 1 处高光、纸纹）
- 素材由本机 Codex / GPT 图像模型批量生成，再用 `tools/import-art.py` + `tools/normalize-art.py` 归一后入库
- 场景零件（谷仓/围栏/地块/住处）和 UI 都没有贴纸边，只有「卡面」里的角色保留 die-cut 边

## 在线试玩

- **GitHub Pages**：https://xiuyan0624-eng.github.io/crystal-farm-tale/
- **Releases**：`playable.html` 是构建好的单文件游戏，下载后直接双击就能离线玩

## game-studio/

`farm-tale/` 那个 Game Studio 工程的归档（`game.json`、`game.js`、`assets/`，以及一路迭代的开发截图 `docs/`）。
换机器时把这一层用 Game Studio 打开，就能继续构建/发布；也可以直接忽略，源码构建出来的产物和它等价。

## 说明

个人练习项目，代码随便看；素材是 AI 生成 + 手工整理，商用请自行确认生成模型的条款。
