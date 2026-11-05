/**
 * 审计日志：把"谁在什么时候对什么做了什么"追加写入按天切分的 JSONL 文件。
 *
 * 用途：
 *  - KP 管理角色卡时的可追溯性（谁改过谁的卡）。
 *  - 安全事件排查（登录失败、越权尝试、数据删除）。
 * 只追加、不修改；保留最近 30 天，运行期每天清理一次。
 *
 * 容量控制（SEC-06）：
 *  - 单个日文件达到 8MB 即滚动为 audit-YYYY-MM-DD.N.jsonl，最多保留 5 个分片。
 *  - readAudit 只读文件尾部最多 2MB，避免管理员翻日志时把整文件读进内存。
 */

import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './db.js';
import { clientIp } from './security.js';

const AUDIT_DIR = path.join(DATA_DIR, 'audit');
const KEEP_DAYS = 30;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_PARTS = 5;
const TAIL_BYTES = 2 * 1024 * 1024;

/** 上次执行过期清理的日期（YYYY-MM-DD）：避免每次写都 readdir */
let lastPrunedDay = '';

function fileFor(day) {
  return path.join(AUDIT_DIR, `audit-${day}.jsonl`);
}

function partFileFor(day, n) {
  return path.join(AUDIT_DIR, `audit-${day}.${n}.jsonl`);
}

/** 删除超过保留期的日志（含滚动分片） */
export function pruneAudit(now = Date.now()) {
  try {
    if (!fs.existsSync(AUDIT_DIR)) return;
    const cutoff = new Date(now - KEEP_DAYS * 86400_000).toISOString().slice(0, 10);
    for (const f of fs.readdirSync(AUDIT_DIR)) {
      const m = /^audit-(\d{4}-\d{2}-\d{2})(?:\.\d+)?\.jsonl$/.exec(f);
      if (m && m[1] < cutoff) fs.unlinkSync(path.join(AUDIT_DIR, f));
    }
  } catch (err) {
    console.error('[audit] 清理失败:', err.message);
  }
}

/**
 * 轮转当天的日志：现有分片整体后移一位，编号最大的（最旧）删除。
 * 只在新文件写到上限时调用，频率很低，允许 readdir。
 */
function rotateAudit(day) {
  let maxPart = 0;
  try {
    for (const f of fs.readdirSync(AUDIT_DIR)) {
      const m = new RegExp(`^audit-${day}\\.(\\d+)\\.jsonl$`).exec(f);
      if (m) maxPart = Math.max(maxPart, Number(m[1]));
    }
  } catch (err) {
    console.error('[audit] 轮转扫描失败:', err.message);
    return;
  }
  for (let n = maxPart; n >= 1; n -= 1) {
    const from = partFileFor(day, n);
    if (n + 1 > MAX_PARTS) {
      try { fs.unlinkSync(from); } catch { /* 分片已不存在，忽略 */ }
      continue;
    }
    try { fs.renameSync(from, partFileFor(day, n + 1)); } catch { /* 分片已不存在，忽略 */ }
  }
  try { fs.renameSync(fileFor(day), partFileFor(day, 1)); } catch { /* 主文件不存在，忽略 */ }
}

/** 当前主文件大小；文件不存在按 0 处理 */
function fileSize(file) {
  try { return fs.statSync(file).size; } catch { return 0; }
}

/**
 * 记录一条审计事件（失败不抛错，绝不因为日志问题影响业务）。
 * @param {object} req express 请求（可为 null，如启动事件）
 * @param {string} action 动作，如 'character.update'
 * @param {object} detail 结构化细节（不要放口令等敏感值）
 */
export function audit(req, action, detail = {}) {
  try {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
    const entry = {
      at: new Date().toISOString(),
      action,
      actor: req?.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : null,
      ip: req ? clientIp(req) : null,
      ua: req ? String(req.headers['user-agent'] || '').slice(0, 160) : null,
      ...detail,
    };
    const day = entry.at.slice(0, 10);
    // 运行期每天清理一次即可；写入热路径上不做 readdir
    if (lastPrunedDay !== day) {
      lastPrunedDay = day;
      pruneAudit();
    }
    if (fileSize(fileFor(day)) >= MAX_FILE_BYTES) rotateAudit(day);
    fs.appendFileSync(fileFor(day), `${JSON.stringify(entry)}\n`, 'utf-8');
  } catch (err) {
    console.error('[audit] 写入失败:', err.message);
  }
}

/**
 * 读取指定日期的审计日志（仅管理员接口使用）。
 * 先 stat，超过 2MB 时只读文件尾部：从 2MB 边界后的第一个换行开始解析，
 * 单行解析失败只跳过该行，不影响其它记录。
 */
export function readAudit(day, limit = 200) {
  const file = fileFor(day);
  let size;
  try { size = fs.statSync(file).size; } catch { return []; }
  if (size === 0) return [];

  const start = Math.max(0, size - TAIL_BYTES);
  const length = size - start;
  const buf = Buffer.alloc(length);
  const fd = fs.openSync(file, 'r');
  let read;
  try {
    read = fs.readSync(fd, buf, 0, length, start);
  } finally {
    fs.closeSync(fd);
  }

  let text = buf.subarray(0, read).toString('utf8');
  if (start > 0) {
    // 从文件中段开始读时，第一行大概率被截断，丢弃到第一个换行之后
    const nl = text.indexOf('\n');
    if (nl === -1) return [];
    text = text.slice(nl + 1);
  }
  // 先过滤坏行再截取：limit 表示“有效记录条数”，坏行不应挤掉正常记录
  return text.split('\n').filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean).slice(-limit);
}