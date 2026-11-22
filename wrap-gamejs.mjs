/**
 * Turn the inlined single-file game into `game.js` for the Game Studio project.
 *
 * Game Studio always compiles `game.js` into `dist/index.html`, so an
 * externally built HTML cannot simply live in `dist/` — the next build (or an
 * export) would replace it with the template game. Instead this script mounts
 * the prototype inside the studio's own page:
 *
 *  - the template's canvas and its styles are removed,
 *  - the prototype's CSS is added as one <style>,
 *  - `#root` is created and the prototype's bundled JS runs from an injected
 *    <script type="module">, which the studio page's CSP allows.
 *
 * build / export / version / share then all act on this project like on any
 * other, and the studio's own CSP (`script-src 'unsafe-inline'`) still holds.
 *
 * Usage: node wrap-gamejs.mjs [--css single/index.css] [--js single/index.js]
 *                             [--out ../farm-tale/game.js]
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const here = dirname(fileURLToPath(import.meta.url))

/** Read `--flag value` pairs from argv. */
function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 && process.argv[index + 1] !== undefined ? process.argv[index + 1] : fallback
}

const cssPath = resolve(here, option('css', 'single/index.css'))
const jsPath = resolve(here, option('js', 'single/index.js'))
const outPath = resolve(here, option('out', '../farm-tale/game.js'))

const css = await readFile(cssPath, 'utf8')
const js = await readFile(jsPath, 'utf8')

// JSON gives correct JS string literals; `</` is escaped so the inline script in
// the built page cannot be closed by markup inside the strings.
const literal = (value) => JSON.stringify(value).replaceAll('</', '<\\/')
const cssLiteral = literal(css)
const jsLiteral = literal(js)

const source = `/* 晶灵农场物语 —— 由 ../farm-tale-src 的 React 原型构建生成（rebuild.sh）。
 *
 * 不要手改这个文件：原型源码在 ../farm-tale-src/src，改完运行
 * ../farm-tale-src/rebuild.sh 重新生成它，再在侧边栏点「构建」或让我运行
 * game_studio_build。这个文件只是把原型的 CSS/JS 挂进 Game Studio 的页面，
 * 让 build / export / version / share 都作用于这一版游戏。
 */
(function () {
  'use strict';

  var css = ${cssLiteral};
  var js = ${jsLiteral};

  // 1. 清掉模板自己的 canvas、脚本和样式，留出干净的挂载点。
  var head = document.head;
  var keep = [];
  for (var i = 0; i < head.children.length; i += 1) {
    var node = head.children[i];
    var tag = node.tagName;
    if (tag === 'META' || tag === 'TITLE') keep.push(node);
  }
  while (head.firstChild) head.removeChild(head.firstChild);
  for (var k = 0; k < keep.length; k += 1) head.appendChild(keep[k]);

  var style = document.createElement('style');
  style.textContent = css;
  head.appendChild(style);

  while (document.body.firstChild) document.body.removeChild(document.body.firstChild);
  var root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);

  // 2. 原型是一个打包好的 ES module：用注入的 module script 执行它。
  var script = document.createElement('script');
  script.type = 'module';
  script.textContent = js;
  document.body.appendChild(script);
})();
`

await writeFile(outPath, source, 'utf8')
console.log(`wrote ${outPath} (${(Buffer.byteLength(source) / 1048576).toFixed(2)} MB)`)
