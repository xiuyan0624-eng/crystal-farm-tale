#!/bin/sh
# 重新构建「晶灵农场物语」并写回 Game Studio 项目。
#
#   src/  →  vite build  →  dist/  →  inline.py  →  single/index.{html,css,js}
#                                                            ↓
#                                            wrap-gamejs.mjs → ../farm-tale/game.js
#
# 改完 src/ 后运行 ./rebuild.sh，然后在侧边栏点「构建」（或让我运行
# game_studio_build）把 game.js 编译成 dist/index.html。
set -eu
cd "$(dirname "$0")"

# inline.py / wrap 需要 Pillow 的只是图片处理；优先用 DSH 自带的 Python 运行时
# （系统 python3 通常没装 Pillow）。
python3_has_pillow() {
  "$1" -c 'import PIL' >/dev/null 2>&1
}
if [ -z "${PYTHON:-}" ]; then
  for candidate in \
    /Users/wfxy/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/python/bin/python3 \
    python3
  do
    if python3_has_pillow "$candidate"; then PYTHON="$candidate"; break; fi
  done
fi
if [ -z "${PYTHON:-}" ]; then
  echo "找不到带 Pillow 的 Python，请用 PYTHON=/path/to/python3 ./rebuild.sh 指定" >&2
  exit 1
fi

node node_modules/vite/bin/vite.js build
"$PYTHON" inline.py --dist dist --out single/index.html
node wrap-gamejs.mjs --css single/index.css --js single/index.js --out ../farm-tale/game.js
echo "✔ 已更新 ../farm-tale/game.js —— 接着在侧边栏点「构建」完成 dist"
