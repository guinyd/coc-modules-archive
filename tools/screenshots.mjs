#!/usr/bin/env node
/**
 * README 配图采集脚本 —— 用无头 Chrome 跑一遍真实站点，把关键页面截成 JPEG（quality 91）。
 *
 *   node tools/screenshots.mjs [站点地址] [接口地址] [输出目录]
 *     默认 http://127.0.0.1:4173  http://127.0.0.1:3000  docs/images
 *
 * 前置条件：
 *   1) 已用 `node tools/seed-demo.mjs .demo-data` 造好演示库，并以 COCOC_DATA_DIR 指向它启动后端；
 *   2) `npm run build` 产物在跑（vite preview 或 Nginx）；
 *   3) 本机装有 Chrome / Edge。
 *
 * 脚本不做断言式的「界面测试」，只负责把图拍清楚：每一步都等待渲染完成；
 * 遇到找不到的按钮会打印警告而不是中断，方便在不同版本上微调。
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = process.argv[2] || 'http://127.0.0.1:4173';
const API = process.argv[3] || 'http://127.0.0.1:3000';
const OUT = path.resolve(process.argv[4] || path.join(ROOT, 'docs', 'images'));
const PORT = 9411;

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const chromePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!chromePath) {
  console.error('找不到 Chrome/Edge，无法截图。');
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- CDP 客户端
class Cdp {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); }

  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('WebSocket 连接失败')); });
    const cdp = new Cdp(ws);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && cdp.pending.has(msg.id)) {
        const { resolve, reject } = cdp.pending.get(msg.id);
        cdp.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
      }
    };
    return cdp;
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`${method} 超时`)); }
      }, 25000);
    });
  }

  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || '页面内脚本异常');
    return r.result.value;
  }
}

// ---------------------------------------------------------------- 小工具
let shotCount = 0;
async function shot(page, name, { full = false, maxHeight = 2600, selector = null, note = '' } = {}) {
  // 全页截图前先滚一遍，触发懒渲染/入场动画，避免视口外出现黑块
  if (full) {
    const total = await page.eval('document.documentElement.scrollHeight');
    const vh = await page.eval('window.innerHeight');
    for (let y = 0; y < total; y += Math.round(vh * 0.75)) {
      await page.eval(`window.scrollTo(0, ${y})`);
      await sleep(240);
    }
  }
  // 截图前回到顶部，避免页面滚动后把 sticky 导航拼错位
  await page.eval('window.scrollTo({ top: 0, behavior: "instant" })');
  await sleep(full ? 700 : 260);

  let clip = null;
  if (selector) {
    const box = await page.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return null;
      return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
    })()`);
    if (box) clip = { ...box, scale: 1 };
  }
  if (!clip && full) {
    const m = await page.send('Page.getLayoutMetrics');
    clip = {
      x: 0, y: 0, scale: 1,
      width: Math.min(m.cssContentSize.width, 1512),
      height: Math.min(m.cssContentSize.height, maxHeight),
    };
  }
  const args = { format: 'jpeg', quality: 91, captureBeyondViewport: !!full };
  if (clip) args.clip = clip;
  const r = await page.send('Page.captureScreenshot', args);
  const file = path.join(OUT, name.replace(/\.png$/, '.jpg'));
  fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
  shotCount += 1;
  const kb = (fs.statSync(file).size / 1024).toFixed(0);
  console.log(`  📸 ${name}  (${kb} KB)${note ? '  ' + note : ''}`);
}

/** 点击第一个 innerText 含指定文字的按钮；找不到返回 false */
async function click(page, text, { tag = 'button', nth = 0, wait = 1200 } = {}) {
  const hit = await page.eval(`(() => {
    const list = [...document.querySelectorAll(${JSON.stringify(tag)})]
      .filter((el) => (el.innerText || '').includes(${JSON.stringify(text)}));
    const el = list[${nth}];
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    el.click();
    return true;
  })()`);
  if (!hit) console.warn(`    ⚠️  找不到「${text}」`);
  await sleep(wait);
  return hit;
}

/** 按 aria-label 点击（主题拨钮等无文字的按钮） */
async function clickAria(page, label, { wait = 1200 } = {}) {
  const hit = await page.eval(`(() => {
    const el = document.querySelector('[aria-label=${JSON.stringify(label)}]');
    if (!el) return false;
    el.click();
    return true;
  })()`);
  if (!hit) console.warn(`    ⚠️  找不到 aria-label「${label}」`);
  await sleep(wait);
  return hit;
}

/** 在包含 containerText 的最近卡片里，点 innerText 含 buttonText 的按钮（最多向上找 6 层） */
async function clickIn(page, containerText, buttonText, { wait = 1600 } = {}) {
  const hit = await page.eval(`(() => {
    const want = ${JSON.stringify(buttonText)};
    const has = ${JSON.stringify(containerText)};
    for (const b of [...document.querySelectorAll('button')]) {
      if (!(b.innerText || '').includes(want)) continue;
      let p = b.parentElement, depth = 0;
      while (p && depth < 6) {
        if ((p.innerText || '').includes(has)) { b.scrollIntoView({ block: 'center' }); b.click(); return true; }
        p = p.parentElement; depth += 1;
      }
    }
    return false;
  })()`);
  if (!hit) console.warn(`    ⚠️  在「${containerText}」里找不到「${buttonText}」`);
  await sleep(wait);
  return hit;
}

async function goHome(page, token, user) {
  // 先落到站点源上，否则 about:blank 拒绝访问 localStorage
  await page.send('Page.navigate', { url: BASE });
  await sleep(1400);
  await page.eval(`(() => {
    if (${JSON.stringify(token)}) {
      localStorage.setItem('token', ${JSON.stringify(token)});
      localStorage.setItem('user', ${JSON.stringify(JSON.stringify(user))});
    } else {
      localStorage.removeItem('token'); localStorage.removeItem('user');
    }
    return 'ok';
  })()`);
  await page.send('Page.navigate', { url: BASE });
  await sleep(2200);
}

// ---------------------------------------------------------------- 主流程
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-shots-'));
const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  '--force-device-scale-factor=1',
  '--window-size=1512,950',
  'about:blank',
], { stdio: 'ignore' });

function cleanup(code) {
  try { chrome.kill('SIGKILL'); } catch { /* ignore */ }
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch { /* ignore */ }
  console.log(`\n共写出 ${shotCount} 张图片到 ${OUT}`);
  process.exit(code);
}

async function waitBrowser() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch { /* 未就绪 */ }
    await sleep(200);
  }
  throw new Error('无头浏览器启动超时');
}

try {
  const health = await fetch(`${API}/api/health`).catch(() => null);
  if (!health || !health.ok) throw new Error(`后端 ${API} 不可用，先启动演示环境`);

  const login = await (await fetch(`${API}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'keeper', password: 'Keeper-Demo-1920' }),
  })).json();
  if (!login.token) throw new Error('演示账号 keeper 登录失败，确认演示库已 seed');

  const browser = await Cdp.connect(await waitBrowser());
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = await Cdp.connect(list.find((t) => t.id === targetId).webSocketDebuggerUrl);
  await page.send('Runtime.enable');
  await page.send('Page.enable');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 1512, height: 950, deviceScaleFactor: 1, mobile: false,
  });

  // ---------------------------------------------------------- 1. 访客：首页 / 详情 / 登录
  console.log('\n== 访客：档案馆首页（深海 / 盐纸） ==');
  await goHome(page, null, null);
  await shot(page, '01-home-dark.png', { full: false });
  await clickAria(page, '切换到盐纸模式', { wait: 1400 });
  await shot(page, '02-home-light.png', { full: false });

  console.log('\n== 卷宗详情 ==');
  const opened = await page.eval(`(() => {
    const card = [...document.querySelectorAll('[role="button"]')].find((d) => (d.innerText || '').includes('查阅档案'));
    if (!card) return false;
    card.scrollIntoView({ block: 'center' }); card.click();
    return true;
  })()`);
  if (!opened) console.warn('    ⚠️  找不到「查阅档案」卡片');
  await sleep(1800);
  await shot(page, '03-module-detail.png', { full: false });

  console.log('\n== 登录页 ==');
  await goHome(page, null, null);
  await click(page, '登录身份', { wait: 1600 });
  await shot(page, '04-login.png', { full: false });

  // ---------------------------------------------------------- 2. 守秘人视角
  console.log('\n== 角色卡管理 / 详情 / 编辑器 ==');
  await goHome(page, login.token, login.user);
  await click(page, '角色卡管理', { wait: 2400 });
  await shot(page, '05-character-cards.png', { full: false });

  await clickIn(page, '伊莱亚斯', '查看', { wait: 2600 });
  await shot(page, '06-character-detail.png', { full: false });

  await click(page, '编辑', { wait: 2400 });
  await shot(page, '07-character-editor.png', { full: false });

  console.log('\n== 守秘人控制台 ==');
  await goHome(page, login.token, login.user);
  await click(page, 'KP 控制台', { wait: 2600 });
  await shot(page, '08-kp-dashboard.png', { full: false });

  console.log('\n== 审卡中心 ==');
  await goHome(page, login.token, login.user);
  await click(page, '审卡中心', { wait: 2600 });
  await shot(page, '09-review-center.png', { full: false });

  console.log('\n== 结业证书 ==');
  await goHome(page, login.token, login.user);
  await click(page, 'keeper', { wait: 2200 });
  await click(page, '预览并下载证书', { wait: 3000 });
  await shot(page, '10-certificate.png', { full: false });

  // ---------------------------------------------------------- 3. 手机端
  console.log('\n== 手机端首页 ==');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
  });
  await goHome(page, login.token, login.user);
  await shot(page, '11-mobile-home.png', { full: false });

  cleanup(0);
} catch (err) {
  console.error('截图流程异常：', err.message);
  cleanup(1);
}
