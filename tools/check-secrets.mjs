#!/usr/bin/env node
/**
 * SEC-01 验收脚本（无第三方依赖）：
 *   1. backend/ 与 .demo-data/ 下不得出现明文 "password" 字段；
 *   2. 不得残留 database.json.*.tmp 原子写临时文件；
 *   3. run-local.sh 默认只绑定回环地址，显式 --lan 才放开；
 *   4. vite.config.js 的 server.fs.deny 覆盖运行期/敏感目录。
 * 任一失败以退出码 1 结束。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['backend', '.demo-data'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.tmp-build', '.run']);
const PASSWORD_NEEDLE = Buffer.from('"password"');
const TMP_RE = /^database\.json\..*\.tmp$/;

/** 深度优先遍历目录，跳过依赖/构建/运行期噪声目录。 */
function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

/** 分块扫描，避免把大文件整个读进内存；返回是否包含指定字节串。 */
function fileHasNeedle(file, needle) {
  const fd = fs.openSync(file, 'r');
  try {
    const chunk = Buffer.allocUnsafe(1024 * 1024);
    let tail = Buffer.alloc(0);
    for (;;) {
      const n = fs.readSync(fd, chunk, 0, chunk.length, null);
      if (n === 0) return false;
      const buf = tail.length
        ? Buffer.concat([tail, chunk.subarray(0, n)])
        : chunk.subarray(0, n);
      if (buf.includes(needle)) return true;
      // 保留末尾 needle.length - 1 字节，防止匹配跨块边界
      tail = Buffer.from(buf.subarray(Math.max(0, buf.length - needle.length + 1)));
    }
  } finally {
    fs.closeSync(fd);
  }
}

const passwordHits = [];
const tmpHits = [];
const readErrors = [];

for (const rel of SCAN_DIRS) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    const relFile = path.relative(ROOT, file);
    if (TMP_RE.test(path.basename(file))) tmpHits.push(relFile);
    try {
      if (fileHasNeedle(file, PASSWORD_NEEDLE)) passwordHits.push(relFile);
    } catch (err) {
      readErrors.push(`${relFile}: ${err.message}`);
    }
  }
}

let runLocal = '';
try {
  runLocal = fs.readFileSync(path.join(ROOT, 'run-local.sh'), 'utf8');
} catch (err) {
  readErrors.push(`run-local.sh: ${err.message}`);
}

let viteConfig = '';
try {
  viteConfig = fs.readFileSync(path.join(ROOT, 'vite.config.js'), 'utf8');
} catch (err) {
  readErrors.push(`vite.config.js: ${err.message}`);
}

const failures = [];
function check(name, ok, detail = '') {
  if (ok) {
    console.log(`  ✓ ${name}`);
    return;
  }
  failures.push(name);
  console.log(`  ✗ ${name}${detail ? `（${detail}）` : ''}`);
}

console.log('[check:secrets] SEC-01 验收');

check('无明文 "password" 字段', passwordHits.length === 0 && readErrors.length === 0,
  [...passwordHits, ...readErrors].join(', '));
if (passwordHits.length) {
  console.log('    以下文件仍含明文口令字段：');
  for (const f of passwordHits) console.log(`      - ${f}`);
}
if (readErrors.length) {
  console.log('    以下文件读取失败，检查不完整：');
  for (const err of readErrors) console.log(`      - ${err}`);
}

check('无 database.json.*.tmp 残留', tmpHits.length === 0, tmpHits.join(', '));
if (tmpHits.length) {
  console.log('    以下临时文件需要清理：');
  for (const f of tmpHits) console.log(`      - ${f}`);
}

const loopbackOk = /COCOC_HOST:-127\.0\.0\.1/.test(runLocal)
  && runLocal.includes('--lan')
  && /BACKEND_HOST="0\.0\.0\.0"/.test(runLocal)
  && !/--host 0\.0\.0\.0/.test(runLocal);
check('run-local.sh 默认回环，仅 --lan 监听 0.0.0.0', loopbackOk);

const viteDenyOk = viteConfig.includes('fs: { deny: fsDeny }')
  && viteConfig.includes("'**/.demo-data/**'")
  && viteConfig.includes("'**/backend/**'")
  && viteConfig.includes("'**/data/**'")
  && viteConfig.includes("'**/database.json'");
check('vite.config.js 的 server.fs.deny 覆盖敏感目录与数据库', viteDenyOk);

if (failures.length) {
  console.error(`\n[check:secrets] 失败 ${failures.length} 项`);
  process.exitCode = 1;
} else {
  console.log('\n[check:secrets] 通过');
}