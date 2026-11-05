#!/usr/bin/env node
/**
 * 旧库补全工具（一次性）：给历史数据补上「谁创建的」这类无法推断的字段。
 *
 *   node tools/repair-legacy-data.mjs <database.json> [--apply] [--owner 用户名]
 *
 * 默认 dry-run（只打印将改什么，不写文件）。--apply 会先写 `<文件>.bak-<时间>` 再覆盖。
 *
 * 补什么：
 *   1. modules.createdBy / createdByName / createdByTitle   ← 缺署名的旧模组统一署给 owner
 *   2. sessions.createdBy                                   ← 缺记录人的旧带团记录归给 owner
 *   3. characters.reviewKpId / reviewKpName / reviewedAt / reviewedBy
 *      ← 已通过但缺审核人时，取该卡最近一条 approved 审核记录
 *   4. users.createdBy                                      ← 发放人姓名已有、但缺 id 的账号，补成 owner.id
 *
 * 不补什么：「谁真的发布了这份模组」这种历史事实无法凭空恢复，只能统一署名。
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const apply = args.includes('--apply');
const ownerArgIdx = args.indexOf('--owner');
const ownerName = ownerArgIdx >= 0 ? args[ownerArgIdx + 1] : '';

if (!file) {
  console.error('用法: node tools/repair-legacy-data.mjs <database.json> [--apply] [--owner 用户名]');
  process.exit(1);
}

const dbPath = path.resolve(file);
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const admins = (db.users || []).filter((u) => u.role === 'admin');
const owner =
  (ownerName && admins.find((u) => u.username === ownerName)) ||
  admins.find((u) => u.kpRank === 'chief') ||
  admins[0];

if (!owner) {
  console.error('❌ 找不到任何守秘人账号，无法确定署名对象');
  process.exit(1);
}

const ownerTitle = owner.kpRank === 'chief' ? '首席守秘人' : owner.kpTitle || '守秘人';
const changes = { modules: [], titles: [], sessions: 0, characters: [], users: [] };

// 1) 旧模组补署名
for (const m of db.modules || []) {
  if (typeof m.createdByName === 'string' && m.createdByName.trim()) {
    // 已有署名但缺称号快照（v2.3.0 之前写入的模组）
    if (!m.createdByTitle && m.createdByName === owner.username) {
      m.createdByTitle = ownerTitle;
      changes.titles.push(m.title || m.id);
    }
    continue;
  }
  m.createdBy = owner.id;
  m.createdByName = owner.username;
  m.createdByTitle = ownerTitle;
  changes.modules.push(m.title || m.id);
}

// 2) 旧带团记录补记录人
for (const s of db.sessions || []) {
  if (s.createdBy) continue;
  s.createdBy = owner.id;
  changes.sessions += 1;
}

// 3) 已通过的角色卡补审核人（取最近一条 approved 记录）
for (const c of db.characters || []) {
  if (c.reviewStatus !== 'approved') continue;
  if (c.reviewKpId && c.reviewKpName) continue;
  const revs = (db.reviews || [])
    .filter((r) => r.characterId === c.id && r.verdict === 'approved' && r.kpId)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (!revs.length) continue;
  const latest = revs[0];
  c.reviewKpId = latest.kpId;
  c.reviewKpName = latest.kpName || '';
  if (!c.reviewedAt) c.reviewedAt = latest.createdAt || Date.now();
  if (!c.reviewedBy) c.reviewedBy = latest.kpName || '';
  changes.characters.push(c.name || c.id);
}

// 4) 玩家账号：有发放人姓名、缺发放人 id 的，补成 owner.id
for (const u of db.users || []) {
  if (u.role === 'admin' || u.id === owner.id) continue;
  if (u.createdBy) continue;
  if ((u.createdByName || '') !== owner.username) continue;
  u.createdBy = owner.id;
  changes.users.push(u.username);
}

const summary = [
  `库文件：${dbPath}`,
  `署名对象：${owner.username}（${ownerTitle}）`,
  `模组补署名：${changes.modules.length} 条`,
  ...changes.modules.map((t) => `  · ${t}`),
  `补发布称号快照：${changes.titles.length} 条${changes.titles.length ? '（' + changes.titles.join('、') + '）' : ''}`,
  `带团记录补记录人：${changes.sessions} 条`,
  `角色卡补审核人：${changes.characters.length} 条${changes.characters.length ? '（' + changes.characters.join('、') + '）' : ''}`,
  `账号补发放人 id：${changes.users.length} 条${changes.users.length ? '（' + changes.users.join('、') + '）' : ''}`,
].join('\n');

console.log(summary);

if (!apply) {
  console.log('\n（dry-run：未写文件。确认无误后加 --apply 执行）');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const backup = `${dbPath}.bak-${stamp}`;
fs.copyFileSync(dbPath, backup);
fs.writeFileSync(dbPath, JSON.stringify(db));
console.log(`\n✅ 已写入 ${dbPath}`);
console.log(`   改前备份：${backup}`);