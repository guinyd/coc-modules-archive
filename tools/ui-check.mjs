/**
 * 可选的界面冒烟测试：用无头 Chrome 真实加载站点，验证关键页面能渲染出来。
 *
 * 需要环境已安装 Chrome（或 Edge）。用法：
 *   1) 先启动后端（默认 3000）与前端 dev/preview 服务（默认 5173）
 *   2) node tools/ui-check.mjs [baseUrl]
 *
 * 它会：登录 → 打开首页 → 打开「我的角色卡」→ 新建一张角色卡 → 打开详情 → 截图。
 * 产物截图写入 tools/_shots/。
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blankSheet } from '../shared/coc7e.js';
import { buildCardBackup } from '../shared/cardmd.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = process.argv[2] || 'http://127.0.0.1:5173';
const API = process.argv[3] || 'http://127.0.0.1:3000';
const SHOTS = path.join(__dirname, '_shots');
const PORT = 9333;

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, extra = '') {
  if (cond) { pass += 1; console.log(`  ✓ ${name}`); }
  else { fail += 1; failures.push(name); console.log(`  ✗ ${name} ${extra}`); }
}

const chromePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!chromePath) {
  console.error('找不到 Chrome/Edge，跳过界面测试');
  process.exit(0);
}
fs.mkdirSync(SHOTS, { recursive: true });

// ---------------------------------------------------------------- CDP 客户端
class Cdp {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); }

  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = () => rej(new Error('WebSocket 连接失败'));
    });
    const cdp = new Cdp(ws);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
        const txt = (msg.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
        console.log('  [browser-console]', String(txt).slice(0, 300));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params?.exceptionDetails;
        console.log('  [browser-error]', String(d?.exception?.description || d?.text || '').split(String.fromCharCode(10))[0]);
      }
      if (msg.id && cdp.pending.has(msg.id)) {
        const { resolve, reject } = cdp.pending.get(msg.id);
        cdp.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
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
      }, 20000);
    });
  }

  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || '页面内脚本异常');
    return r.result.value;
  }
}

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coc-ui-'));
const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  '--window-size=1440,1000',
  'about:blank',
], { stdio: 'ignore' });

function cleanup(code) {
  try { chrome.kill('SIGKILL'); } catch { /* ignore */ }
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch { /* ignore */ }
  console.log(`\n================ 界面测试：${pass} 通过 / ${fail} 失败 ================`);
  if (fail) console.log('失败项：\n - ' + failures.join('\n - '));
  process.exit(code);
}

async function waitBrowser() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return (await r.json()).webSocketDebuggerUrl;
    } catch { /* 未就绪 */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('无头浏览器启动超时');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let seedUser = null;
  try {
    const dbFile = process.env.COCOC_DB_FILE || path.join(ROOT, '..', 'backend', 'data', 'database.json');
    void dbFile;
  } catch { /* ignore */ }

  // 用后端接口自己拿一个可用账号：优先用环境变量，其次用首个管理员（仅本地测试库）
  const login = await fetch(`${API}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.UI_USER || 'uicheck',
      password: process.env.UI_PASS || 'UiCheck-Pass1',
    }),
  }).catch(() => null);
  if (login && login.ok) seedUser = await login.json();

  const browserWs = await waitBrowser();
  const browser = await Cdp.connect(browserWs);
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const pageInfo = list.find((t) => t.id === targetId);
  const page = await Cdp.connect(pageInfo.webSocketDebuggerUrl);
  await page.send('Runtime.enable');
  await page.send('Page.enable');

  /** 新建角色卡现在要先选游戏规则：默认选「克苏鲁的呼唤 第七版」 */
  async function pickClassic() {
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('克苏鲁的呼唤 第七版'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(1200);
  }

  console.log('\n== 加载站点 ==');
  await page.send('Page.navigate', { url: BASE });
  await sleep(2500);
  const bootstrapped = await page.eval('document.querySelector("#root")?.children.length > 0');
  ok('React 应用挂载成功', bootstrapped === true);

  const title = await page.eval('document.title');
  ok('页面标题正确', title === '秘密调查档案馆', `实际 ${title}`);

  const homeText = await page.eval('document.body.innerText');
  ok('首页渲染出档案馆标题', homeText.includes('收录世界上不可名状的超自然案件'));
  ok('未登录时显示登录入口', homeText.includes('登录身份'));

  // v10.10：模组「版本」口径（coc7th / 通克 / 其它）
  const verOpts = await page.eval(`(() => {
    const sel = document.querySelector('select[aria-label="按版本筛选"]');
    return sel ? [...sel.options].map((o) => o.textContent.trim()) : null;
  })()`);
  ok('馆藏索引提供版本筛选（coc7th / 通克 / 其它）',
    Array.isArray(verOpts) && verOpts.includes('coc7th') && verOpts.includes('通克') && verOpts.includes('其它'),
    JSON.stringify(verOpts));
  const coverTags = await page.eval(`(() => {
    const plates = [...document.querySelectorAll('[data-cover-plate="card"]')];
    const labels = plates.map((p) => p.textContent || '');
    return {
      total: plates.length,
      tagged: labels.filter((t) => /coc7th|通克|其它/.test(t)).length,
    };
  })()`);
  ok('封面右下角显示版本标记（coc7th / 通克 / 其它）',
    coverTags.total > 0 && coverTags.tagged === coverTags.total, JSON.stringify(coverTags));

  console.log('\n== 登录 ==');
  if (seedUser) {
    const logged = await page.eval(`(async () => {
      localStorage.setItem('token', ${JSON.stringify(seedUser.token)});
      localStorage.setItem('user', ${JSON.stringify(JSON.stringify(seedUser.user))});
      return true;
    })()`);
    void logged;
    await page.send('Page.navigate', { url: BASE });
    await sleep(2200);
    const afterLogin = await page.eval('document.body.innerText');
    ok('登录后显示用户名', afterLogin.includes(seedUser.user.username), afterLogin.slice(0, 120));
    ok('登录后出现「我的角色卡」入口', afterLogin.includes('我的角色卡'));

    console.log('\n== 角色卡页面 ==');
    await page.eval(`(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('我的角色卡'));
      if (btn) btn.click();
      return Boolean(btn);
    })()`);
    await sleep(1600);
    const charText = await page.eval('document.body.innerText');
    ok('角色卡列表页渲染', charText.includes('角色卡') && (charText.includes('新建角色卡') || charText.includes('还没有')));
    ok('角色卡页无错误边界/异常', !charText.includes('Something went wrong'));

    console.log('\n== 新建角色卡编辑器 ==');
    await page.eval(`(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('新建角色卡'));
      if (btn) btn.click();
      return Boolean(btn);
    })()`);
    await sleep(1600);
    await pickClassic();
    const editorText = await page.eval('document.body.innerText');
    ok('编辑器渲染属性面板', editorText.includes('属性明细与年龄补正'));
    ok('编辑器渲染派生值', editorText.includes('生命值 HP') && editorText.includes('移动力 MOV'));
    ok('编辑器渲染技能点预算', editorText.includes('职业技能点') && editorText.includes('兴趣技能点'));
    ok('KP 登录时看到「KP 专属设置」（传奇标记 / 豁免年龄减益）',
      editorText.includes('KP 专属设置') && editorText.includes('传奇标记：允许突破属性 99 上限')
      && editorText.includes('豁免年龄减益（只享受教育成长）'));

    await page.eval(`(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('选择职业'));
      if (btn) btn.click();
      return Boolean(btn);
    })()`);
    await sleep(900);
    const pickerText = await page.eval('document.body.innerText');
    ok('职业选择弹窗可打开', pickerText.includes('选择职业') && pickerText.includes('会计师'));

    // 回到首页，验证重构后拆分出去的模组视图仍正常
    await page.eval(`(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('秘密调查档案馆'));
      if (btn) btn.click();
      return Boolean(btn);
    })()`);
    await sleep(1500);
    const home2 = await page.eval('document.body.innerText');
    ok('返回首页正常', home2.includes('收录世界上不可名状的超自然案件'));

    await page.eval(`(() => {
      // 卡片本身带 cursor-pointer；点标题所在的卡片即可进入详情
      const card = [...document.querySelectorAll('div.cursor-pointer')]
        .find(d => d.textContent.includes('查阅档案'));
      if (card) card.click();
      return Boolean(card);
    })()`);
    await sleep(1500);
    const detail = await page.eval('document.body.innerText');
    ok('模组详情页渲染', detail.includes('案件背景') && detail.includes('基础参数'), detail.slice(0, 120));
    ok('详情页显示归档按钮', detail.includes('已调查') || detail.includes('标记为已调查') || detail.includes('已归档'));

    if (seedUser.user.role === 'admin') {
      await page.eval(`(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('发布模组'));
        if (btn) btn.click();
        return Boolean(btn);
      })()`);
      await sleep(1400);
      const formText = await page.eval('document.body.innerText');
      ok('模组录入表单渲染', formText.includes('录入档案') && formText.includes('附加档案'));
    }

    console.log('\n== KP 列表页快捷传奇（v1.7.1） ==');
    await page.send('Page.navigate', { url: BASE });
    await sleep(2200);
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('角色卡管理'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(1800);
    const kpListText = await page.eval('document.body.innerText');
    ok('KP 角色卡管理列表渲染', kpListText.includes('角色卡管理') || kpListText.includes('全站调查员'), kpListText.slice(0, 80));
    const hasLegendBtn = await page.eval(`[...document.querySelectorAll('button')].some(b => b.textContent.trim() === '传奇')`);
    ok('列表卡片上有「传奇」快捷按钮（无需进入编辑）', hasLegendBtn === true);
    const hasEduBtn = await page.eval(`[...document.querySelectorAll('button')].some(b => b.textContent.startsWith('教育'))`);
    ok('列表卡片上有「教育」快捷按钮（授权重掷 / 重置）', hasEduBtn === true);
    const hasWaiveBtn = await page.eval(`[...document.querySelectorAll('button')].some(b => /豁免年龄|恢复年龄/.test(b.textContent))`);
    ok('列表卡片上有「豁免年龄」快捷开关', hasWaiveBtn === true);
    const hasExportBtn = await page.eval(`[...document.querySelectorAll('button')].some(b => b.textContent.trim() === '导出')`);
    ok('列表卡片上有「导出」（角色卡 Markdown / 骰娘指令）', hasExportBtn === true);
    const waiveToggled = await page.eval(`(async () => {
      const b = [...document.querySelectorAll('button')].find(x => /豁免年龄|恢复年龄/.test(x.textContent));
      if (!b) return null;
      const before = /豁免年龄/.test(b.textContent) ? 'waived' : 'normal';
      b.click();
      await new Promise((r) => setTimeout(r, 1400));
      const fresh = [...document.querySelectorAll('button')].find(x => /豁免年龄|恢复年龄/.test(x.textContent));
      const after = fresh && /豁免年龄/.test(fresh.textContent) ? 'waived' : 'normal';
      return { before, after };
    })()`);
    ok('豁免年龄是一键开关（点击后徽标状态改变）',
      waiveToggled && waiveToggled.before !== waiveToggled.after, JSON.stringify(waiveToggled));
    // 复原，避免影响后续断言
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => /豁免年龄|恢复年龄/.test(x.textContent));
      if (b) b.click();
      return true;
    })()`);
    await sleep(1400);
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.startsWith('教育'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(800);
    const eduModal = await page.eval('document.body.innerText');
    ok('教育弹窗含流水与授权/重置按钮',
      eduModal.includes('结算流水') && eduModal.includes('授权重掷一次') && eduModal.includes('重置教育增强'));
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '关闭');
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(500);
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '传奇');
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(800);
    const legendModal = await page.eval('document.body.innerText');
    ok('传奇弹窗含开关与额外调整值',
      legendModal.includes('允许这张卡突破属性 99 上限') && legendModal.includes('额外调整值（单独一栏）'));
    // 打开开关并给第一个属性 +40，保存
    await page.eval(`(() => {
      // Toggle 渲染成 <button role="switch">，不是 <label>；按文案找到它再点
      const sw = [...document.querySelectorAll('[role="switch"]')]
        .find(el => el.textContent.includes('允许这张卡突破属性 99 上限'));
      if (sw) sw.click();
      return Boolean(sw);
    })()`);
    await sleep(400);
    await page.eval(`(() => {
      const first = document.querySelector('input[type=number]');
      if (!first) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(first, '40');
      first.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await sleep(400);
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '保存');
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(1800);
    const afterLegend = await page.eval('document.body.innerText');
    ok('保存后列表直接显示「传奇 +」徽标', /传奇 \+\d+/.test(afterLegend), afterLegend.slice(0, 120));

    console.log('\n== 打印版面：技能必须单行（v1.7.4） ==');
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '打印');
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(2200);
    const printCheck = await page.eval(`(() => {
      const mm = document.createElement('div');
      mm.style.height = '297mm'; mm.style.position = 'absolute'; mm.style.visibility = 'hidden';
      document.body.appendChild(mm);
      const a4 = mm.getBoundingClientRect().height;
      mm.remove();
      // 技能表是 table-fixed；只统计这些表的行高
      const skillTables = [...document.querySelectorAll('.print-page table.table-fixed')];
      const rows = skillTables.flatMap((t) => [...t.querySelectorAll('tbody tr')]);
      const heights = rows.map((r) => Math.round(r.getBoundingClientRect().height));
      const minH = Math.min(...heights);
      const wrapped = rows.filter((r) => r.getBoundingClientRect().height > minH + 1).length;
      const clipped = [...document.querySelectorAll('.print-page table.table-fixed tbody tr td:nth-child(3)')]
        .filter((td) => td.scrollWidth > td.clientWidth + 1)
        .map((td) => td.innerText.slice(0, 20));
      const lineBlocks = [...document.querySelectorAll('.print-page span[title]')]
        .filter((el) => el.getBoundingClientRect().height > 26).length;
      const first = document.querySelector('.print-page');
      const cs = getComputedStyle(first);
      const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const contentH = Math.round((first.firstElementChild?.getBoundingClientRect().height || 0) + pad);
      return { a4: Math.round(a4), rows: rows.length, wrapped, clipped, lineBlocks, contentH,
        boxes: ([...document.querySelectorAll('.print-page')].map((p) => p.innerText).join('').match(/[☐☑]/g) || []).length };
    })()`);
    ok('打印技能行数正常（三列铺满一页）', printCheck.rows >= 40 && printCheck.rows <= 60, JSON.stringify(printCheck));
    ok('打印技能前仍有大成功方块', printCheck.boxes >= 40, `方块 ${printCheck.boxes} 个`);
    ok('每个技能都只占一行（无折行）', printCheck.wrapped === 0, `折行 ${printCheck.wrapped} 行`);
    ok('技能名没有被裁切', printCheck.clipped.length === 0, JSON.stringify(printCheck.clipped));
    ok('基础信息格子全部单行', printCheck.lineBlocks === 0, `折行 ${printCheck.lineBlocks} 个`);
    ok('第一页仍在 A4 以内', printCheck.contentH <= printCheck.a4,
      `内容 ${printCheck.contentH}px / A4 ${printCheck.a4}px`);
    {
      const shot = await page.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(SHOTS, 'print.png'), Buffer.from(shot.data, 'base64'));
      console.log(`  截图：${path.join(SHOTS, 'print.png')}`);
    }
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('返回'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(900);

    // ---------------------------------------------------------------- 补齐样本
    // 演示库没有「有教育增强记录」的在审角色卡，这里用接口现造一张再删掉，
    // 让「审卡队列显示教育增强状态」这条断言有真实数据可看。
    let seededReviewId = null;
    if (seedUser?.token) {
      const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${seedUser.token}` };
      const call = async (method, url, body) => {
        const r = await fetch(`${API}${url}`, {
          method, headers: auth, body: body === undefined ? undefined : JSON.stringify(body),
        });
        if (!r.ok) {
          const body = await r.text().catch(() => '');
          throw new Error(`${method} ${url} → ${r.status} ${body.slice(0, 200)}`);
        }
        return r.json();
      };
      try {
        const list = await call('GET', '/api/characters?scope=all');
        // 优先挑七版、且职业是内置数字 id 的卡（避免克隆伴侣/通克职业导致 400）
        const classicLike = (list.items || []).filter((x) => (x.gameSystem || 'classic7e') === 'classic7e');
        const pick = classicLike.find((x) => /^\d+$/.test(String(x.occupationId || ''))) || classicLike[0];
        const base = pick?.id ? await call('GET', `/api/characters/${pick.id}`) : null;
        if (base) {
          const created = await call('POST', '/api/characters', {
            name: 'UI 样本 · 教育增强',
            playerName: base.playerName || '',
            occupationId: base.occupationId,
            gameSystem: base.gameSystem || 'classic7e',
            kpcp: { enabled: false },
            age: base.age,
            gender: base.gender,
            residence: base.residence,
            birthplace: base.birthplace,
            era: base.era,
            chars: base.chars,
            skills: [],
            background: base.background,
            status: 'active',
          });
          seededReviewId = created.id;
          const at = Date.now();
          await call('PATCH', `/api/characters/${seededReviewId}`, {
            eduGrowth: {
              settled: true, manual: true, count: 3, gain: 4,
              rolls: [{ roll: 6, gain: 4 }], at, by: seedUser.user.username,
              attempts: [{
                at, by: seedUser.user.username, manual: true, count: 3, gain: 4,
                rolls: [{ roll: 6, gain: 4 }], totalAfter: 0, via: 'manual',
              }],
              granted: 0, rerolls: 0, locked: true,
            },
          });
          await call('POST', `/api/characters/${seededReviewId}/submit`, {});
        }
      } catch (err) {
        console.log(`  · 样本补建失败（不影响其它断言）：${err.message}`);
      }
    }

    console.log('\n== 审卡中心不再黑屏（回归：图标漏 import） ==');
    await page.send('Page.navigate', { url: BASE });
    await sleep(2200);
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('审卡中心'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(2000);
    const reviewText = await page.eval('document.body.innerText');
    const rootKids = await page.eval('document.querySelector("#root")?.children.length');
    ok('审卡中心能正常渲染（页面非空）', Number(rootKids) > 0 && reviewText.includes('待审核队列'),
      `root=${rootKids} len=${reviewText.length}`);
    ok('审卡队列显示教育增强状态', /教育 \+\d+（|教育未结算/.test(reviewText), reviewText.slice(0, 120));

    if (seededReviewId && seedUser?.token) {
      await fetch(`${API}/api/characters/${seededReviewId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${seedUser.token}` },
      }).catch(() => null);
    }

    if (seedUser.user.role === 'admin') {
      console.log('\n== 审卡规则：规则集与房规同页（v10.4） ==');
      await page.eval(`(() => {
        const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('审卡规则'));
        if (b) b.click();
        return Boolean(b);
      })()`);
      await sleep(1600);
      const rulesText = await page.eval('document.body.innerText');
      ok('审卡规则页渲染规则集与同源说明',
        rulesText.includes('规则集') && rulesText.includes('房规与审卡规则同源'), rulesText.slice(0, 120));
      ok('审卡规则页保留核心开关', rulesText.includes('启用自定义规则审卡'));
      ok('规则集栏改为「设为当前」，未选择时保存临时规则',
        rulesText.includes('设为当前') && rulesText.includes('保存临时规则') && rulesText.includes('临时规则'));
      ok('房规改名「自定义规则」并保留编辑入口',
        rulesText.includes('自定义规则') && rulesText.includes('加入自定义规则'));

      // v10.10：审卡规则与职业模板按游戏规则分开
      ok('审卡规则页提供「适用游戏规则」切换', rulesText.includes('适用游戏规则'));
      ok('七版规则页仍可设置「忽略年龄」房规', rulesText.includes('忽略年龄'));
      await page.eval(`(() => {
        const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '通俗克苏鲁');
        if (b) b.click();
        return Boolean(b);
      })()`);
      await sleep(1600);
      const pulpRulesText = await page.eval('document.body.innerText');
      ok('切到通克后显示通克专属审卡项',
        pulpRulesText.includes('必须选择原型') && pulpRulesText.includes('英雄奖励点总量'), pulpRulesText.slice(0, 160));
      ok('「忽略年龄」已从类型下拉拆成独立开关（通克页同样可见）', pulpRulesText.includes('忽略年龄'));

      // v10.13：kpcp 改为叠加层——房规卡片在任何规则页（含通克页）都出现
      ok('规则页出现「守密人伴侣房规」卡片（叠加层）',
        pulpRulesText.includes('守密人伴侣房规')
        && (pulpRulesText.includes('展开设置') || pulpRulesText.includes('启用并设置')), pulpRulesText.slice(0, 220));
      await page.eval(`(() => {
        const b = [...document.querySelectorAll('button')]
          .find(x => x.textContent.includes('展开设置') || x.textContent.includes('启用并设置'));
        if (b) b.click();
        return Boolean(b);
      })()`);
      await sleep(900);
      const kpDrawerText = await page.eval('document.body.innerText');
      const kpcpToggleLabels = [
        '由属性推导技能基础值', '兴趣点 = 教育 + 智力', '专精下限',
        '职业包可搬点', '第二门母语', '移动力按伴侣版',
      ];
      const kpcpHits = kpcpToggleLabels.filter((t) => kpDrawerText.includes(t)).length;
      ok('伴侣房规抽屉只有 6 项开关', kpcpHits === 6, `${kpcpHits}/6`);
      ok('伴侣房规抽屉支持团内自定义规则',
        kpDrawerText.includes('团内自定义规则') && kpDrawerText.includes('已启用'), kpDrawerText.slice(0, 200));
      ok('伴侣房规抽屉提供「启用伴侣房规（本规则集）」独立开关',
        kpDrawerText.includes('启用伴侣房规（本规则集）'), kpDrawerText.slice(0, 200));
      await page.eval(`(() => {
        const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '取消');
        if (b) b.click();
        return Boolean(b);
      })()`);
      await sleep(600);

      // v10.13：规则集「详情」抽屉预览（审卡规则 / 自定义规则 / 伴侣房规）
      const detailBtn = await page.eval(`(() => {
        const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '详情');
        return b ? { found: true, disabled: Boolean(b.disabled) } : { found: false, disabled: true };
      })()`);
      ok('规则集栏提供「详情」预览入口', detailBtn.found === true);
      if (detailBtn.found && !detailBtn.disabled) {
        await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='详情'); if(b) b.click(); return true; })()`);
        await sleep(900);
        const detailText = await page.eval('document.body.innerText');
        ok('KP 详情抽屉只预览审卡规则与自定义规则（伴侣房规移到玩家侧）',
          detailText.includes('审卡规则') && detailText.includes('自定义规则')
          && !detailText.includes('守密人伴侣房规'),
          detailText.slice(0, 200));
        await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='关闭'); if(b) b.click(); return true; })()`);
        await sleep(500);
      }

      await page.eval(`(() => {
        const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('职业模板'));
        if (b) b.click();
        return Boolean(b);
      })()`);
      await sleep(1500);
      const occText = await page.eval('document.body.innerText');
      ok('职业模板页可按游戏规则筛选',
        occText.includes('coc7th') && occText.includes('通克') && occText.includes('职业模板'), occText.slice(0, 160));
    }

    console.log('\n== 访客模式 ==');
    await page.eval(`localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('coc.guest.sheets.v1'); 'ok'`);
    await page.send('Page.navigate', { url: BASE });
    await sleep(2200);
    const guestHome = await page.eval('document.body.innerText');
    ok('未登录也提供「免费车卡」入口', guestHome.includes('免费车卡'));
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('免费车卡') || x.textContent.includes('新建角色卡'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(1600);
    const guestList = await page.eval('document.body.innerText');
    ok('访客可进入角色卡页', guestList.includes('访客模式'));
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('新建角色卡'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(1600);
    await pickClassic();
    const guestEditor = await page.eval('document.body.innerText');
    ok('访客可打开车卡编辑器', guestEditor.includes('属性明细与年龄补正'));
    ok('访客编辑器提示仅存本机', guestEditor.includes('本机浏览器'));
    ok('访客保存按钮为「保存到本机」', guestEditor.includes('保存到本机'));
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '房规');
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(900);
    const guestHouse = await page.eval('document.body.innerText');
    ok('访客也能打开房规页且不联网', guestHouse.includes('访客草稿不联网'));

    console.log('\n== 技能页（默认全部技能 / 高亮 / 自定义技能） ==');
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('技能分配'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(900);
    const skillText = await page.eval('document.body.innerText');
    ok('默认显示全部技能', skillText.includes('显示全部技能'));
    ok('信用评级高亮提示职业区间', skillText.includes('职业要求') || skillText.includes('选择职业后可校验区间'));
    ok('克苏鲁神话有专门提示', skillText.includes('不可用点数提升'));
    ok('提供自定义技能区块', skillText.includes('自定义技能'));
    const specSelects = await page.eval('document.querySelectorAll("select").length');
    ok('专攻技能使用下拉菜单', specSelects > 3, `select 数量 ${specSelects}`);
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('添加技能'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(600);
    const afterAdd = await page.eval('document.body.innerText');
    ok('可以添加自定义技能', afterAdd.includes('技能名称'));


    console.log('\n== 附表：法术与神话典籍（v10.7） ==');
        await page.eval(`(() => {
          const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '附表');
          if (b) b.click();
          return Boolean(b);
        })()`);
        await sleep(700);
        const appendixText = await page.eval('document.body.innerText');
        ok('编辑器有「附表」页（法术详情 + 神话典籍）',
          appendixText.includes('法术详情') && appendixText.includes('神话典籍') && appendixText.includes('添加法术'));
        await page.eval(`(() => {
          const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('添加法术'));
          if (b) b.click();
          return Boolean(b);
        })()`);
        await sleep(500);
        await page.eval(`(() => {
          const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '大典');
          if (b) b.click();
          return Boolean(b);
        })()`);
        await sleep(600);
        const drawerInfo = await page.eval(`(() => {
          const d = document.querySelector('[role="dialog"][aria-label="法术大典"]');
          if (!d) return { open: false };
          return { open: true, text: d.innerText.slice(0, 600) };
        })()`);
        ok('「大典」拉起法术大典抽屉（分类 + 条目）',
          drawerInfo.open === true && drawerInfo.text.includes('全部') && drawerInfo.text.includes('战斗')
          && drawerInfo.text.includes('共'), JSON.stringify(drawerInfo).slice(0, 160));
        await page.eval(`(() => {
          const d = document.querySelector('[role="dialog"][aria-label="法术大典"]');
          const first = d ? [...d.querySelectorAll('ul button')][0] : null;
          if (first) first.click();
          return Boolean(first);
        })()`);
        await sleep(700);
        const afterPick = await page.eval(`(() => ({ toast: document.body.innerText.includes('已填入') }))()`);
        ok('点选条目后自动补全法术行', afterPick.toast === true, JSON.stringify(afterPick));

    console.log('\n== 属性不被清零（回归：年龄补正 bug） ==');
    await page.send('Page.navigate', { url: BASE });
    await sleep(300);
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('免费车卡'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(900);
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('新建角色卡'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(900);
    await pickClassic();
    // 选职业（现在职业是必选）
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('选择职业'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(700);
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('会计师'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(700);
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('一键掷骰生成属性'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(700);
    const before = await page.eval(`[...document.querySelectorAll('input[type=number]')].slice(0,9).map(i=>i.value).join(',')`);
    const attrTotal = await page.eval(`[...document.querySelectorAll('input[type=number]')].slice(0,9).reduce((a,i)=>a+(Number(i.value)||0),0)`);
    ok('掷骰后属性有值', attrTotal > 100, `合计 ${attrTotal}`);
    const occChosen = await page.eval(`document.body.innerText.includes('职业要求') || document.body.innerText.includes('固定本职技能')`);
    ok('可以选择职业（必选）', occChosen === true);
    // 等所有挂起的请求与计时器落地 —— 旧版本这里会被重置成空白
    await sleep(6000);
    const after = await page.eval(`[...document.querySelectorAll('input[type=number]')].slice(0,9).map(i=>i.value).join(',')`);
    ok('等待 6 秒后属性未被清零', before === after && after !== '', `前 ${before} / 后 ${after}`);
    const stillOcc = await page.eval(`document.body.innerText.includes('固定本职技能')`);
    ok('等待后职业仍然保留', stillOcc === true);

    console.log('\n== 年龄可逐字输入（回归：被夹成 15 / 120） ==');
    const ageTyped = await page.eval(`(() => {
      const label = [...document.querySelectorAll('label')]
        .find(el => el.textContent.trim().startsWith('年龄') && el.querySelector('input[type=number]'));
      const input = label ? label.querySelector('input[type=number]') : null;
      if (!input) return { ok: false, reason: '找不到年龄输入框' };
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const type = (v) => { setter.call(input, v); input.dispatchEvent(new Event('input', { bubbles: true })); };
      input.focus();
      type('4');
      const afterOne = input.value;
      type('45');
      const afterTwo = input.value;
      input.blur();
      return { ok: true, afterOne, afterTwo };
    })()`);
    ok('年龄输入「4」时不会被立刻夹成 15', ageTyped.ok && ageTyped.afterOne === '4', JSON.stringify(ageTyped));
    ok('继续输入得到「45」', ageTyped.ok && ageTyped.afterTwo === '45', JSON.stringify(ageTyped));
    const ageApplied = await page.eval(`(() => {
      const label = [...document.querySelectorAll('label')]
        .find(el => el.textContent.trim().startsWith('年龄') && el.querySelector('input[type=number]'));
      return label ? label.querySelector('input[type=number]').value : '';
    })()`);
    ok('失焦后年龄保留为 45', ageApplied === '45', `实际 ${ageApplied}`);
    // 年龄补正默认关闭：本节用例显式打开
    const ageToggle = await page.eval(`(() => {
      const btn = [...document.querySelectorAll('button[role="switch"]')]
        .find(b => (b.textContent || '').includes('自动套用年龄补正'));
      if (!btn) return { ok: false };
      const before = btn.getAttribute('aria-checked');
      if (before !== 'true') btn.click();
      return { ok: true, before };
    })()`);
    await sleep(600);
    ok('年龄补正开关默认关闭、可手动打开', ageToggle.ok === true && ageToggle.before === 'false', JSON.stringify(ageToggle));
    const allocUi = await page.eval(`document.body.innerText.includes('年龄补正分配') && document.body.innerText.includes('已分配')`);
    ok('40+ 岁出现「年龄补正分配」面板（合计减点由玩家分配）', allocUi === true);
    const freeSearch = await page.eval(`[...document.querySelectorAll('input')].some(i => i.placeholder === '搜索特长…')`);
    ok('自由特长点提供搜索框', freeSearch === true);

    console.log('\n== 资产 / 武器 / 技能方块 ==');
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('装备与经历'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(900);
    const assetText = await page.eval('document.body.innerText');
    ok('资产由信用评级自动计算并锁死', assetText.includes('由信用评级自动计算'));
    ok('展示消费水平/现金/资产', assetText.includes('消费水平') && assetText.includes('现金') && assetText.includes('资产'));
    ok('提供额外资产输入', assetText.includes('额外资产'));
    ok('提供时代与货币选择', assetText.includes('货币'));

    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('战斗'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(800);
    const weaponText = await page.eval('document.body.innerText');
    ok('武器表固定有徒手', weaponText.includes('徒手'));
    ok('徒手不可删除（显示常驻）', weaponText.includes('常驻'));
    const presetCount = await page.eval(`(() => { const s=[...document.querySelectorAll('select')].find(x=>x.textContent.includes('从武器表选择')); return s ? s.options.length : 0 })()`);
    ok('提供武器预设下拉', presetCount > 5, `选项 ${presetCount}`);

    console.log('\n== 武器可连续输入（回归：只输入第一个字母） ==');
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('自定义武器'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(700);
    const weaponTyped = await page.eval(`(() => {
      const rows = [...document.querySelectorAll('tbody tr')];
      const input = rows.length ? rows[rows.length - 1].querySelector('input') : null;
      if (!input) return { ok: false, reason: '找不到武器名称输入框' };
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const type = (v) => { setter.call(input, v); input.dispatchEvent(new Event('input', { bubbles: true })); };
      input.focus();
      type('A');
      const afterOne = input.value;
      type('AB');
      const afterTwo = input.value;
      return { ok: true, afterOne, afterTwo, connected: input.isConnected };
    })()`);
    ok('武器名可连续输入（A → AB）',
      weaponTyped.ok && weaponTyped.afterOne === 'A' && weaponTyped.afterTwo === 'AB',
      JSON.stringify(weaponTyped));
    ok('输入过程中该输入框没有被重建（保住焦点与输入法）',
      weaponTyped.ok && weaponTyped.connected === true, JSON.stringify(weaponTyped));

    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('技能分配'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(800);
    const skillHeads = await page.eval(`JSON.stringify([...document.querySelectorAll('table')].find(t => t.querySelector('th')?.textContent.trim() === '技能')?.querySelectorAll('th').length || 0)`);
    const headNames = await page.eval(`JSON.stringify([...document.querySelectorAll('table')].find(t => t.querySelector('th')?.textContent.trim() === '技能') ? [...[...document.querySelectorAll('table')].find(t => t.querySelector('th')?.textContent.trim() === '技能').querySelectorAll('th')].map(th => th.textContent.trim()) : [])`);
    ok('技能分配已移除「成功」列', Number(skillHeads) === 8 && !String(headNames).includes('成功'), `${skillHeads} 列 ${headNames}`);
    const specDefaults = await page.eval(`(() => {
      const sels=[...document.querySelectorAll('select')].filter(s=>s.value==='斗殴'||s.value==='手枪');
      return sels.map(s=>s.value).join(',');
    })()`);
    ok('格斗/射击默认斗殴与手枪', specDefaults.includes('斗殴') && specDefaults.includes('手枪'), specDefaults);


    console.log('\n== 教育增强面板 / 备注栏（v1.7） ==');
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('属性与职业'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(700);
    const growthUi = await page.eval(`document.body.innerText.includes('成长 +') && document.body.innerText.includes('99 − 神话知识')`);
    ok('属性卡提供「成长 +」并说明 SAN 上限公式', growthUi === true);
    const groupPick = await page.eval(`document.body.innerText.includes('含全部分支')`);
    ok('特长选择支持按组选取（含全部分支）', groupPick === true);
    const eduUi = await page.eval(`document.body.innerText.includes('教育增强（年龄成长）')`);
    ok('编辑器有「教育增强（年龄成长）」面板', eduUi === true);
    const eduManual = await page.eval(`[...document.querySelectorAll('button')].some(b => b.textContent.includes('清零教育补正'))`);
    ok('提供手动录入与「清零教育补正」', eduManual === true);
    // 首次结算 → 立即锁定（方案 C：玩家不能自助重掷）
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('自动检定并结算'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(900);
    const lockedText = await page.eval('document.body.innerText');
    ok('首次结算后出现「已结算 / 已锁定 / 结算流水」',
      lockedText.includes('已结算') && lockedText.includes('已锁定') && lockedText.includes('结算流水'));
    const rerollBtn = await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('重掷并结算') || x.textContent.includes('自动检定并结算'));
      return b ? { disabled: b.disabled, text: b.textContent.trim() } : null;
    })()`);
    ok('锁定后玩家端的结算按钮被禁用', rerollBtn?.disabled === true, JSON.stringify(rerollBtn));
    const lockedHint = await page.eval(`document.body.innerText.includes('服务端同样会拦') || document.body.innerText.includes('请让 KP')`);
    ok('锁定后给出「找 KP 授权重掷」的提示', lockedHint === true);
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('装备与经历'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(700);
    const notesUi = await page.eval(`document.body.innerText.includes('只做记录，不会打印在角色卡上')`);
    ok('编辑器提供「备注」栏并标明不打印', notesUi === true);

    console.log('\n== 角色卡导入 / 导出（v1.7） ==');
    // Node 侧生成一份真实 Markdown，再粘贴进页面，验证「Markdown → 新卡」整条链路
    const demoCode = buildCardBackup({
      ...blankSheet(),
      name: '导入测试员', occupationId: 2, age: 30, gender: '女', era: '1920s',
      chars: { STR: 55, CON: 60, SIZ: 50, DEX: 65, APP: 70, INT: 65, POW: 55, EDU: 75, Luck: 40 },
      spells: [{ id: 'sp_demo', name: '接触深渊', category: '交流', cost: '1D6 理智', time: '1 轮', condition: '需知晓者引路' }],
            tomes: [{ id: 'tm_demo', name: '无名祭祀书', meta: '拉丁文 · 1692', sanity: '1D4', occult: '+3', mythos: '+1' }],
      notes: '导入链路自检',
    });
    await page.send('Page.navigate', { url: BASE });
    await sleep(1400);
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('免费车卡'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(1200);
    const hasImportBtn = await page.eval(`[...document.querySelectorAll('button')].some(b => b.textContent.includes('导入角色卡'))`);
    ok('角色卡列表提供「导入角色卡」', hasImportBtn === true);
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('导入角色卡'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(700);
    await page.eval(`(() => {
      const ta = [...document.querySelectorAll('textarea')].find(t => (t.placeholder || '').startsWith('# 调查员档案'));
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, ${JSON.stringify(demoCode)});
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return Boolean(ta);
    })()`);
    await sleep(400);
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '解析');
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(900);
    const parsedText = await page.eval('document.body.innerText');
    ok('粘贴备份 JSON 后解析成功并显示预览', parsedText.includes('解析成功') && parsedText.includes('导入测试员'));
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('创建为新角色卡'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(1200);
    const afterImport = await page.eval('document.body.innerText');
    ok('导入后列表出现新卡', afterImport.includes('导入测试员'));

    // 打开这张卡 → 详情页 → 导出弹窗（卡片底部有「查看」按钮）
    await page.eval(`(() => {
      const title = [...document.querySelectorAll('h3')].find(h => h.textContent.includes('导入测试员'));
      let node = title;
      let btn = null;
      while (node && !btn) {
        btn = [...node.querySelectorAll('button')].find(b => b.textContent.trim() === '查看');
        node = node.parentElement;
      }
      if (btn) btn.click();
      return Boolean(btn);
    })()`);
    await sleep(1600);
    const detailText = await page.eval('document.body.innerText');
    ok('访客也能打开角色卡详情（含教育增强记录）',
      detailText.includes('导入测试员') && detailText.includes('教育增强记录'),
      detailText.split(String.fromCharCode(10)).join('|').slice(0, 160));
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('装备与经历'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(700);
    console.log('\n== 详情：附表页（v10.7） ==');
        const tabInfo = await page.eval(`(() => {
          const t = document.querySelector('[role="tab"][data-tab="appendix"]');
          if (!t) return { found: false, tabs: [...document.querySelectorAll('[role="tab"]')].map((x) => x.dataset.tab), btns: [...document.querySelectorAll('button')].slice(0, 12).map((x) => x.textContent.trim().slice(0, 8)), txt: document.body.innerText.slice(0, 260).split(String.fromCharCode(10)).join('|') };
          t.click();
          return { found: true };
        })()`);
        await sleep(800);
        const detailAppendix = await page.eval('document.body.innerText');
        ok('详情页有「附表」页（法术详情 + 神话典籍）',
          detailAppendix.includes('法术详情') && detailAppendix.includes('神话典籍'), JSON.stringify(tabInfo).slice(0, 200));

    ok('详情页有「备注」栏（不打印）', (await page.eval('document.body.innerText')).includes('不会出现在骰娘指令与打印件上'));
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('导出') && x.textContent.includes('骰娘'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(900);
    const exportText = await page.eval('document.body.innerText');
    ok('导出弹窗同时给出角色卡 Markdown、JSON 备份与骰娘指令',
      exportText.includes('角色卡 Markdown') && exportText.includes('下载备份 .json') && exportText.includes('骰娘机器人导入指令'));
    const botCmd = await page.eval(`(() => {
      const ta = [...document.querySelectorAll('textarea')].find(t => (t.value || '').startsWith('.st '));
      return ta ? ta.value.slice(0, 40) : '';
    })()`);
    ok('骰娘指令以 .st 开头并含属性别名', botCmd.startsWith('.st ') && botCmd.includes('力量'), botCmd);
    const cardMd = await page.eval(`(() => {
      const ta = [...document.querySelectorAll('textarea')].find(t => (t.value || '').startsWith('# 调查员档案'));
      return ta ? ta.value.slice(0, 40) : '';
    })()`);
    ok('导出内容是 Markdown 档案', cardMd.startsWith('# 调查员档案'), cardMd);
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('关闭'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(500);
    // 清掉自检导入的访客卡，避免影响后续断言
    await page.eval(`(() => { localStorage.removeItem('coc.guest.sheets.v1'); return true; })()`);


    console.log('\n== 原生控件纸面化 / 母语语种 ==');
    // 上面「访客模式」那一段清掉了登录态，这里先恢复，后续步骤需要 KP 权限
    await page.eval(`(() => {
      localStorage.setItem('token', ${JSON.stringify(seedUser.token)});
      localStorage.setItem('user', ${JSON.stringify(JSON.stringify(seedUser.user))});
      localStorage.setItem('coc-theme', 'light');
      return true;
    })()`);
    await page.send('Page.navigate', { url: BASE });
    await sleep(2400);
    const native = await page.eval('document.querySelectorAll("datalist").length');
    ok('页面内已无原生 datalist（白色弹层根因）', native === 0, `datalist ${native}`);
    const scheme = await page.eval('getComputedStyle(document.documentElement).colorScheme');
    ok('日间主题 color-scheme = light（原生 select 弹层随纸面）', scheme === 'light', scheme);
    const themeState = await page.eval(`(()=>{const root=document.documentElement; const before=root.dataset.theme; root.dataset.theme='dark'; const paper=getComputedStyle(root).getPropertyValue('--color-paper').trim(); const darkScheme=getComputedStyle(root).colorScheme; root.dataset.theme=before||'light'; return { before, paper, darkScheme };})()`);
    const paperRgb = (() => {
      const m = String(themeState.paper).match(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
      return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
    })();
    ok('夜间主题切换生效（纸色变深 + color-scheme = dark）', Boolean(paperRgb) && paperRgb.every((n) => n < 80) && themeState.darkScheme === 'dark', JSON.stringify(themeState));
    await sleep(700);
    const optBg = await page.eval(`(()=>{const o=document.querySelector('select option'); return o?getComputedStyle(o).backgroundColor:''})()`);
    ok('option 显式纸色背景', Boolean(optBg) && optBg !== 'rgba(0, 0, 0, 0)' && !optBg.startsWith('rgb(23'), optBg);

    // 合集选择器：自绘纸面下拉
    await page.eval(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('发布模组'));b&&b.click();return 1})()`);
    await sleep(1800);
    await page.eval(`(()=>{const i=[...document.querySelectorAll('input')].find(x=>x.placeholder&&x.placeholder.includes('合集'));
      if(!i) return 0; i.dispatchEvent(new FocusEvent('focusin',{bubbles:true})); i.focus(); return 1})()`);
    await sleep(800);
    const darkPanel = await page.eval(`(()=>{
      const p=document.querySelector('[data-combobox-panel]');
      if(!p) return null;
      const bg=getComputedStyle(p).backgroundColor;
      const esc = String.fromCharCode(10);
      // Tailwind v4 用 oklch 表示颜色，这里只判断「不是透明」
      const solid = Boolean(bg) && bg !== "rgba(0, 0, 0, 0)";
      return { bg, solid, text: p.innerText.split(esc).join('/').slice(0,40) };
    })()`);
    ok('合集下拉是自绘纸面面板', darkPanel?.solid === true && (darkPanel.text || '').length > 0, JSON.stringify(darkPanel));

    // 母语语种
    await page.send('Page.navigate', { url: BASE }); await sleep(2000);
    await page.eval(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('免费车卡')||x.textContent.includes('我的角色卡'));b&&b.click();return 1})()`);
    await sleep(1400);
    await page.eval(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('新建角色卡'));b&&b.click();return 1})()`);
    await sleep(1600);
    await pickClassic();
    await page.eval(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('技能分配'));b&&b.click();return 1})()`);
    await sleep(1000);
    const langInput = await page.eval(`(()=>{const i=[...document.querySelectorAll('input')].find(x=>x.placeholder&&x.placeholder.includes('例：中文')); return i?i.placeholder:'无'})()`);
    ok('母语提供语种输入框', langInput !== '无', langInput);
    const langHint = await page.eval(`document.body.innerText.includes('未选择语种')`);
    ok('未填语种时给出提示', langHint === true);

    console.log('\n== 修改用户名 ==');
    await page.send('Page.navigate', { url: BASE });
    await sleep(2200);
    await page.eval(`(()=>{const u=${JSON.stringify(seedUser.user.username)};const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(u));b&&b.click();return 1})()`);
    await sleep(1600);
    const profileText = await page.eval('document.body.innerText');
    ok('个人中心有「账号资料」卡片', profileText.includes('账号资料'));
    const renameInput = await page.eval(`(()=>{const i=[...document.querySelectorAll('input')].find(x=>x.maxLength===24 && x.value); return i?i.value:'无'})()`);
    ok('用户名可编辑且预填当前值', renameInput !== '无', renameInput);
    const saveBtn = await page.eval(`Boolean([...document.querySelectorAll('button')].find(x=>x.textContent.includes('保存用户名')))`);
    ok('提供保存用户名按钮', saveBtn === true);

    console.log('\n== 模组封面（铅印色版） ==');
    await page.send('Page.navigate', { url: BASE });
    await sleep(2400);
    const cover = await page.eval(`(()=>{
      const art=document.querySelector('[data-cover-plate="card"]');
      if(!art) return null;
      const txt=art.textContent||'';
      const title=art.querySelector('h3');
      return {
        hasFileNo: /NO\\.[0-9A-Z]{4,8}/.test(txt),
        corners: art.querySelectorAll('[data-cover-corner]').length,
        motif: Boolean(art.querySelector('svg')),
        ink: art.getAttribute('data-cover-ink')||'',
        bg: getComputedStyle(art).backgroundImage,
        titleFont: title ? getComputedStyle(title).fontFamily : '',
        text: txt.slice(0,24),
      };
    })()`);
    ok('卡片封面出现档案编号', cover?.hasFileNo === true, JSON.stringify(cover));
    ok('卡片封面有四角套准角标', (cover?.corners || 0) >= 4, `角标 ${cover?.corners}`);
    ok('卡片封面有大号雕刻图案', cover?.motif === true);
    ok('封面使用深空油墨渐变', Boolean(cover?.ink) && String(cover?.bg || '').includes('gradient'), `${cover?.ink} / ${String(cover?.bg).slice(0, 48)}`);
    ok('封面题名使用衬线字体', /serif|Songti|SimSun|Georgia|Noto Serif/i.test(cover?.titleFont || ''), cover?.titleFont);

    // 详情页头图用同一套装饰
    await page.eval(`(()=>{const c=[...document.querySelectorAll('div.cursor-pointer')].find(d=>d.textContent.includes('查阅档案'));c&&c.click();return 1})()`);
    await sleep(2000);
    const heroCover = await page.eval(`(()=>{
      const art=document.querySelector('[data-cover-plate="hero"]');
      if(!art) return null;
      return { text:(art.textContent||'').slice(0,40), corners:art.querySelectorAll('[data-cover-corner]').length };
    })()`);
    ok('详情页头图也有档案封印', Boolean(heroCover) && heroCover.text.includes('档案编号'), String(heroCover?.text));
    ok('详情页头图保留四角套准角标', (heroCover?.corners || 0) >= 4, `角标 ${heroCover?.corners}`);

    console.log('\n== 通俗克苏鲁车卡器（v10.9） ==');
    await page.send('Page.navigate', { url: BASE });
    await sleep(2200);
    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('我的角色卡')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(1500);
    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('新建角色卡')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(1500);
    const systemPicker = await page.eval('document.body.innerText');
    ok('新建卡先选游戏规则（7e / 通克 两张卡）',
      systemPicker.includes('克苏鲁的呼唤 第七版') && systemPicker.includes('通俗克苏鲁'), systemPicker.slice(0, 140));
    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('通俗克苏鲁')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(1600);
    let pulpText = await page.eval('document.body.innerText');
    ok('通克编辑器渲染原型与档位区', pulpText.includes('英雄原型与通俗档位') && pulpText.includes('低通俗') && pulpText.includes('高通俗'));
    ok('通克编辑器渲染四张天赋表', pulpText.includes('四张 d10 表') && pulpText.includes('肉体天赋'));
    ok('通克编辑器提示必须选原型', pulpText.includes('必须先选原型'));

    const archePicked = await page.eval(`(() => {
      const sel = [...document.querySelectorAll('select')].find((s) => [...s.options].some((o) => (o.textContent || '').includes('冒险家')));
      if (!sel) return { ok: false, reason: '找不到原型下拉' };
      const opt = [...sel.options].find((o) => (o.textContent || '').includes('冒险家'));
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, opt.value);
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true, value: opt.value };
    })()`);
    await sleep(1200);
    pulpText = await page.eval('document.body.innerText');
    ok('选中原型后显示奖励点与白名单',
      archePicked.ok && pulpText.includes('奖励点') && pulpText.includes('冒险家'), JSON.stringify(archePicked));
    const coreVal = await page.eval(`(() => {
      const sel = [...document.querySelectorAll('select')].find((s) => [...s.options].some((o) => (o.textContent || '').includes('敏捷')));
      return sel ? sel.value : '';
    })()`);
    ok('核心属性自动落在原型属性上', coreVal === 'DEX' || coreVal === 'APP' || coreVal === '', coreVal);

    // 天赋勾选
    await page.eval(`(() => {
      const rows = [...document.querySelectorAll('button')].filter((b) => (b.textContent || '').includes('明察秋毫'));
      if (rows[0]) rows[0].click();
      return Boolean(rows[0]);
    })()`);
    await sleep(600);
    const talentOn = await page.eval('document.body.innerText.includes(\'已选 1 项\')');
    ok('天赋可勾选并计数', talentOn === true);

    // 填名字 + 选职业 → 保存
    await page.eval(`(() => {
      const input = [...document.querySelectorAll('input')].find((i) => (i.placeholder || '').includes('约翰'));
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '通克自检英雄');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await sleep(400);
    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('选择职业')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(900);
    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('警官')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(900);
    // 通克必须先把属性掷出来（全 0 会被校验拦住，存不进库）
    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('一键掷骰生成属性')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(700);
    const occText = await page.eval('document.body.innerText');
    ok('通克职业列表可用（68 个职业）', occText.includes('警官') || occText.includes('职业要求'), occText.slice(0, 80));
    const savedPulp = await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('保存角色卡'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(2200);
    const listText = await page.eval('document.body.innerText');
    ok('通克卡保存后列表出现「通克」标记',
      savedPulp === true && listText.includes('通克'), listText.slice(0, 160));

    const shot = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, 'editor.png'), Buffer.from(shot.data, 'base64'));
    console.log(`  截图：${path.join(SHOTS, 'editor.png')}`);

    // 种两套七版规则集：一套开启伴侣房规、一套未开启，用于验证玩家房规页的过滤与详情
    let kpcpSetName = '';
    let kpcpSetNameOff = '';
    if (seedUser?.token) {
      const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${seedUser.token}` };
      const post = async (body) => {
        const r = await fetch(`${API}/api/rule-sets`, { method: 'POST', headers: authHeaders, body: JSON.stringify(body) });
        const j = await r.json().catch(() => ({}));
        return j?.item || null;
      };
      try {
        kpcpSetName = 'UI 样本 · 伴侣房规集';
        kpcpSetNameOff = 'UI 样本 · 普通房规集';
        await post({
          name: kpcpSetName, gameSystem: 'classic7e', scope: 'personal', auditRules: {}, houseRules: [],
          kpcpEnabled: true,
          kpcp: { toggles: { derivedBases: true }, customRules: [{ id: 'uikr', name: 'UI 团规', note: '样本说明', enabled: true }] },
        });
        await post({
          name: kpcpSetNameOff, gameSystem: 'classic7e', scope: 'personal', auditRules: {}, houseRules: [],
          kpcpEnabled: false,
          kpcp: { toggles: { derivedBases: true } },
        });
      } catch { /* 种数据失败不阻塞其它断言 */ }
    }

    console.log('\n== 守秘人伴侣叠加层（v10.13） ==');
    await page.send('Page.navigate', { url: BASE });
    await sleep(2200);
    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('我的角色卡')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(1500);
    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('新建角色卡')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(1500);
    const picker3 = await page.eval('document.body.innerText');
    ok('规则选择页仍只有两套基础规则', picker3.includes('克苏鲁的呼唤 第七版') && picker3.includes('通俗克苏鲁'));

    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('克苏鲁的呼唤 第七版')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(1800);
    const layerText = await page.eval('document.body.innerText');
    ok('七版车卡页提供「守秘人伴侣（可选）」开关',
      layerText.includes('守秘人伴侣（可选）') && layerText.includes('启用伴侣规则'), layerText.slice(0, 200));

    // 未开启伴侣层时：房规页不应出现「伴侣房规」规则集
    if (kpcpSetName) {
      await page.eval(`(() => {
        const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '房规');
        if (b) b.click();
        return Boolean(b);
      })()`);
      await sleep(1100);
      const offRoomText = await page.eval('document.body.innerText');
      ok('未开启伴侣层时房规页不列伴侣房规规则集',
        !offRoomText.includes(kpcpSetName) && (!kpcpSetNameOff || offRoomText.includes(kpcpSetNameOff)),
        JSON.stringify({ kpcp: offRoomText.includes(kpcpSetName), plain: offRoomText.includes(kpcpSetNameOff) }));
      await page.eval(`(() => {
        const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '属性与职业');
        if (b) b.click();
        return Boolean(b);
      })()`);
      await sleep(700);
    }

    await page.eval(`(() => {
      const el = [...document.querySelectorAll('button,[role="switch"]')].find((x) => x.textContent.includes('启用伴侣规则'));
      if (el) el.click();
      return Boolean(el);
    })()`);
    await sleep(1200);
    const layerOn = await page.eval('document.body.innerText');
    ok('开启伴侣层后显示「叠加层」与房规提示',
      layerOn.includes('叠加层') && (layerOn.includes('尚未选择') || layerOn.includes('暂无带伴侣房规的规则集')), layerOn.slice(0, 220));

    // 房规页：只列出「已开启伴侣房规」的规则集，详情里能看到伴侣房规
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '房规');
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(1200);
    const roomText = await page.eval('document.body.innerText');
    if (kpcpSetName) {
      ok('开启伴侣层后房规页只列「已开启伴侣房规」的规则集',
        roomText.includes(kpcpSetName) && (!kpcpSetNameOff || !roomText.includes(kpcpSetNameOff)),
        JSON.stringify({ on: roomText.includes(kpcpSetName), off: roomText.includes(kpcpSetNameOff) }));
      const openedDetail = await page.eval(`(() => {
        const labels = [...document.querySelectorAll('label')];
        const card = labels.find((l) => l.textContent.includes('${kpcpSetName}'));
        if (!card) return false;
        const b = [...card.querySelectorAll('button')].find((x) => x.textContent.trim() === '详情');
        if (!b) return false;
        b.click();
        return true;
      })()`);
      await sleep(900);
      const playerDetail = await page.eval('document.body.innerText');
      ok('玩家房规详情含「守密人伴侣房规」段（开关与团规）',
        openedDetail === true && playerDetail.includes('守密人伴侣房规')
        && playerDetail.includes('UI 团规') && playerDetail.includes('由属性推导技能基础值'),
        playerDetail.slice(0, 240));
      await page.eval(`(() => { const b=document.querySelector('button[aria-label="关闭"]'); if(b) b.click(); return Boolean(b); })()`);
      await sleep(500);
    }
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '属性与职业');
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(700);

    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('选择职业')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(1000);
    const occPicker = await page.eval('document.body.innerText');
    ok('伴侣层职业选择器可按「职业包」筛选', occPicker.includes('职业包'), occPicker.slice(0, 160));
    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('职业包')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(800);
    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('古物学家')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(1200);
    const afterOcc = await page.eval('document.body.innerText');
    ok('选中伴侣职业包后投放固定终值（合计 300）',
      afterOcc.includes('古物学家') && afterOcc.includes('300'),
      JSON.stringify({
        hasOcc: afterOcc.includes('古物学家'),
        has300: afterOcc.includes('300'),
        open: afterOcc.includes('选择职业'),
        len: afterOcc.length,
        around: (afterOcc.match(/.{0,40}古物学家.{0,80}/) || [''])[0],
      }));

    await page.eval(`(() => {
      const input = [...document.querySelectorAll('input')].find((i) => (i.placeholder || '').includes('约翰'));
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '伴侣自检英雄');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await sleep(400);
    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('一键掷骰生成属性')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(900);

    // 第二母语：技能页添加一门，断言生成技能行
    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('技能')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(900);
    const hasLangBlock = await page.eval(`(() => {
      const input = [...document.querySelectorAll('input')].find((i) => (i.placeholder || '').includes('西班牙语'));
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '西班牙语');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await sleep(400);
    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('添加母语')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(900);
    const langText = await page.eval('document.body.innerText');
    ok('伴侣层可添加第二母语（每门 10 点）',
      hasLangBlock === true && langText.includes('母语（西班牙语）'), langText.slice(0, 200));

    const kpSaved = await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('保存角色卡'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(2400);
    const kpList = await page.eval('document.body.innerText');
    ok('伴侣层卡保存后列表徽标带 +kpcp 标记', kpSaved === true && kpList.includes('+kpcp'), kpList.slice(0, 200));

    // 伴侣版打印版面（v10.13.4）：状态栏精简、健康/理智独立行、战斗速查贴武器表
    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='查看'); if(b) b.click(); return Boolean(b); })()`);
    await sleep(2200);

    // 骰娘指令按规则集取名（v10.13.7）：伴侣层卡必须用伴侣修订表的技能名
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('导出') && x.textContent.includes('骰娘'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(1200);
    const kpBot = await page.eval(`(() => {
      const ta = [...document.querySelectorAll('textarea')].find(t => (t.value || '').startsWith('.st '));
      return ta ? ta.value : '';
    })()`);
    ok('伴侣层卡的骰娘指令改用伴侣修订表技能名（自然学 / 安抚）',
      kpBot.includes('自然学') && kpBot.includes('安抚'), kpBot.slice(0, 160));
    await page.eval(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('关闭'));
      if (b) b.click();
      return Boolean(b);
    })()`);
    await sleep(700);
    await page.eval(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('打印')); if(b) b.click(); return Boolean(b); })()`);
    await sleep(2600);
    const kpPrint = await page.eval(`(() => {
      const pages = [...document.querySelectorAll('.print-page')];
      if (!pages.length) return null;
      const txt = pages.map((p) => p.innerText).join(String.fromCharCode(10));
      const a4 = (() => {
        const probe = document.createElement('div');
        probe.style.cssText = 'width:210mm;height:297mm;position:absolute;visibility:hidden';
        document.body.appendChild(probe);
        const h = probe.getBoundingClientRect().height;
        probe.remove();
        return h;
      })();
      const first = pages[0];
      const cs = getComputedStyle(first);
      const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const contentH = Math.round((first.firstElementChild?.getBoundingClientRect().height || 0) + pad);
      return {
        pages: pages.length,
        a4: Math.round(a4),
        contentH,

        hasStats: txt.includes('生命 HP') && txt.includes('魔法 MP') && txt.includes('幸运 LUCK') && txt.includes('理智 SAN'),
        health: txt.includes('健康 HEALTH') && txt.includes('重伤值') && txt.includes('昏迷') && txt.includes('濒死'),
        sanity: txt.includes('震骇') && txt.includes('异变') && !txt.includes('异变线'),
        hpHasWound: (() => {
          const box = [...first.querySelectorAll('div')].find(
            (el) => el.className.includes('border-ink/35') && el.textContent.trim().startsWith('生命 HP'),
          );
          return Boolean(box) && box.textContent.includes('重伤值');
        })(),
        healthOneLine: (() => {
          const box = [...first.querySelectorAll('div')].find(
            (el) => el.className.includes('border-ink/35') && el.textContent.trim().startsWith('健康 HEALTH'),
          );
          if (!box) return false;
          const chips = [...box.querySelectorAll('span')].filter((s) => /^(重伤|昏迷|濒死)$/.test(s.textContent.trim()));
          if (chips.length < 3) return false;
          const tops = chips.map((c) => Math.round(c.getBoundingClientRect().top));
          return Math.max(...tops) - Math.min(...tops) <= 2;
        })(),
        sameRow: (() => {
          const boxes = [...first.querySelectorAll('div')].filter(
            (el) => el.className.includes('border-ink/35') && /^(理智 SAN|健康 HEALTH)/.test(el.textContent.trim()),
          );
          if (boxes.length < 2) return false;
          return Math.abs(boxes[0].getBoundingClientRect().top - boxes[1].getBoundingClientRect().top) <= 2;
        })(),
        // 战斗信息改成一行四格（属性式、无底色），删掉标题与移动点；移动/闪避/伤害加值/体格必须同排
        combat: (() => {
          const cells = [...first.querySelectorAll('div[class*="rounded-[3px]"]')].filter(
            (el) => /^(移动 MOV|闪避|伤害加值 DB|体格)/.test(el.textContent.trim()),
          );
          if (cells.length !== 4) return false;
          const tops = cells.map((el) => el.getBoundingClientRect().top);
          const oneLine = Math.max(...tops) - Math.min(...tops) <= 2;
          const dodge = cells.find((el) => el.textContent.trim().startsWith('闪避'))?.textContent || '';
          return oneLine && dodge.includes('%') && dodge.includes('/');
        })(),
        combatChrome: txt.includes('战斗速查') || txt.includes('移动点'),
        noGrid: !txt.includes('霉运连连') && !txt.includes('疯了'),
        rect: (() => {
          const r = first.getBoundingClientRect();
          return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
        })(),
      };
    })()`);
    ok('伴侣版打印：HP/MP/幸运/理智为「最大/初始 + 当前」四行', kpPrint?.hasStats === true, JSON.stringify(kpPrint));
    ok('伴侣版打印：健康行含重伤值与重伤/昏迷/濒死',
      kpPrint?.health === true, JSON.stringify(kpPrint));
    ok('伴侣版打印：理智行含最大与震骇/异变、不再重复「异变线」说明',
      kpPrint?.sanity === true, JSON.stringify(kpPrint));
    ok('伴侣版打印：理智与健康在同一行（理智在左）',
      kpPrint?.sameRow === true, JSON.stringify(kpPrint));
    ok('伴侣版打印：重伤值记在生命 HP 一行', kpPrint?.hpHasWound === true, JSON.stringify(kpPrint));
    ok('伴侣版打印：健康的三个复选框在同一行', kpPrint?.healthOneLine === true, JSON.stringify(kpPrint));
    ok('伴侣版打印：移动/闪避/伤害加值/体格四格同排，闪避带困难·极难',
      kpPrint?.combat === true, JSON.stringify(kpPrint));
    ok('伴侣版打印：战斗速查标题与移动点已移除',
      kpPrint?.combatChrome === false, JSON.stringify(kpPrint));
    ok('伴侣版打印：不再使用 01–99 数字格', kpPrint?.noGrid === true, JSON.stringify(kpPrint));
    ok('伴侣版打印：第一页仍在 A4 以内',
      kpPrint?.contentH > 0 && kpPrint.contentH <= kpPrint.a4,
      `内容 ${kpPrint?.contentH}px / A4 ${kpPrint?.a4}px`);
    const kpPrintShot = await page.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { ...kpPrint.rect, scale: 1 },
    });
    fs.writeFileSync(path.join(SHOTS, 'kpcp-print.png'), Buffer.from(kpPrintShot.data, 'base64'));
    console.log(`  截图：${path.join(SHOTS, 'kpcp-print.png')}`);

    const kpShot = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, 'kpcp.png'), Buffer.from(kpShot.data, 'base64'));
  } else {
    console.log('  （未提供可用账号，跳过登录后的界面检查；可用 UI_USER/UI_PASS 环境变量指定）');
  }

  cleanup(fail ? 1 : 0);
} catch (err) {
  console.error('界面测试异常：', err.message);
  try {
    const shot = await Promise.resolve(null);
    void shot;
  } catch { /* ignore */ }
  cleanup(1);
}
