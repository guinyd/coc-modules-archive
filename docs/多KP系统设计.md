# 多 KP 系统 · 设计与实施说明

> 版本目标：v10.1.0 / schemaVersion 8
> 本文是本轮改造的唯一权威口径。实现与验收以本文为准；与旧交接文档冲突时以本文为准。

## 1. 角色模型

现有系统只有 `role: 'admin' | 'user'` 一维判定，`role === 'admin'` 同时表示「KP」「首席」「管理员」。
多 KP 系统保持 `role` 不变（**兼容层**），新增第二个维度 `kpRank`：

| 概念 | 判定 |
| --- | --- |
| 玩家 / 调查员 | `role === 'user'` |
| 守秘人（KP） | `role === 'admin'`（**所有** KP 都仍通过 `requireAdmin`） |
| 首席守秘人 | `role === 'admin' && kpRank === 'chief'` |
| 普通守秘人 | `role === 'admin' && kpRank === 'keeper'` |

- 系统内**有且只有一个** `kpRank === 'chief'`（迁移时取最早创建的 admin；若历史数据里有多个 admin，则全部置为 `chief`，保证升级后无人掉权限 —— 之后由首席在账号管理里降级）。
- 首席权限全局最大：所有校验处 `chief` 直接放行，不做任何额外限制。
- 新发放的 KP 账号默认 `kpRank: 'keeper'`；只有首席能任命首席 / 升降 KP。
- KP 同时也是玩家：KP 账号照样拥有玩家侧全部能力（车自己的卡、提交审核、带团记录、导出球员称号）。

## 2. 数据模型（schemaVersion 8）

### users 新增
```js
kpRank: 'chief' | 'keeper',   // 仅 role==='admin' 有意义
kpTitle: string,             // 守秘人五级称号，见 shared/coc7e.js KP_TITLES
createdBy: string | null,    // 该账号由哪个 KP 发放（user id）
createdByName: string,       // 发放时的 KP 名字快照
auditRules: object | null,   // 普通 KP 的私有审卡规则覆盖项；null = 只用全局基准
```
`settings.auditRules` 语义调整为**全局基准规则**（首席维护），普通 KP 的 `user.auditRules` 只覆盖其中一部分。
生效规则 = `DEFAULT_AUDIT_RULES` ⊕ `settings.auditRules`（基准） ⊕ `user.auditRules`（本人覆盖）。

### characters 新增
```js
custody: { kpId, kpName, grantedAt } | null,   // 玩家主动授权某位 KP 托管
reviewKpId: string | null,                    // 提交审核时选择的目标 KP
reviewKpName: string | null,
```

### modules 新增
```js
createdByName: string,   // 发布时的 KP 名字快照（署名用）
```

### reviews 新增
```js
targetKpId/targetKpName  // 冗余存档：这次审卡是送给谁的
```

### 迁移（db.js `migrate` 增加 `to 8` 分支）
- 所有既有 `role === 'admin'` → `kpRank: 'chief'`、`kpTitle: '神话守秘人'`（保证升级后权限不缩水）。
- 既有用户 `createdBy/createdByName = null`。
- 既有角色卡 `custody = null`、`reviewKpId/reviewKpName = null`。
- 既有模组 `createdByName` 用 `users` 反查补齐（查不到就空字符串）。
- `settings.auditRules` 保留原值，作为全局基准。

## 3. 权限矩阵

| 能力 | 首席 | 普通 KP | 玩家 | 访客 |
| --- | --- | --- | --- | --- |
| 发放玩家账号 | ✅ 任意 | ✅ 只能发 `role:user`，记录 `createdBy` | ❌ | ❌ |
| 查看玩家列表 | ✅ 全部 | ⚠️ 只能看**自己发放的**账号（只读，字段裁剪） | ❌ | ❌ |
| 删除账号 / 改名 / 改头衔 / 改额度 / 重置他人密码 / 看审计日志 | ✅ | ❌ | ❌ | ❌ |
| 任命 KP / 升降首席 | ✅ | ❌ | ❌ | ❌ |
| 角色卡：看全部 | ✅ | ⚠️ 只看 `custody.kpId === 自己` 的卡 | 自己的 | 公开卡 |
| 角色卡：编辑/删除 | ✅ 全部 | ❌（托管卡也不行） | 自己的 | ❌ |
| 角色卡：传奇 / 豁免年龄 / 教育快捷操作 | ✅ | ✅ 仅托管卡 | 自己的（受规则约束） | ❌ |
| 角色卡：代玩家建卡（指定 ownerId） | ✅ | ❌ | ❌ | ❌ |
| 角色卡：复制 | ✅ | ❌（托管卡也不行） | 自己的 | ❌ |
| 审核 | ✅ 全部 | ⚠️ 只有 `reviewKpId === 自己` 的提交 | ❌ | ❌ |
| 审卡规则 | ✅ 改全局基准 | ✅ 改自己的覆盖项 | ❌ | ❌ |
| 模组：发布 | ✅ | ✅ | ❌ | ❌ |
| 模组：改 / 删 | ✅ 全部 | ⚠️ 只能改删**自己发布的** | ❌ | ❌ |
| 自定义职业模板：发布 | ✅ | ✅（署名 `createdByName`） | ❌ | ❌ |
| 自定义职业模板：改 / 删 | ✅ 全部 | ⚠️ 只能改删自己发布的 | ❌ | ❌ |
| 带团记录 / 盘点 | ✅ 全部 | ✅ 自己的记录（列表按 `createdBy` 过滤） | ❌ | ❌ |
| 证书导出 | ✅ | ✅ | ✅ 仅本人 | ❌ |

**托管（custody）**：只有玩家自己在角色卡详情里可以把卡「允许某位 KP 托管」/ 取消托管；KP 不能给自己授权。首席不需要托管即可管理全部卡。

## 4. 后端 API 变更

### 认证 / 身份
- `publicUser()` 追加 `kpRank`、`kpTitle`（前端到处要用）。
- 新增 `backend/lib/roles.js`：
  ```js
  export function isKeeper(u)   // role === 'admin'
  export function isChief(u)    // role === 'admin' && kpRank === 'chief'
  export function isPlayer(u)   // role === 'user'
  export function requireChief(req,res,next)
  export function canManageCard(actor, character)      // chief || custody
  export function canEditCard(actor, character)        // chief || owner
  export function canReviewCard(actor, character)      // chief || reviewKpId===actor.id
  ```
- `GET /api/keepers`（requireAuth）：`[{id, username, kpTitle, isChief}]`，供玩家选审卡人 / 选托管人。

### 账号（backend/routes/users.js）
- `GET /api/admin/users`：chief 全量；普通 KP 只返回 `createdBy === self.id` 的用户，字段裁剪为 `{id, username, createdAt, characterCount}`，并带 `issuedBySelf: true`。
- `POST /api/admin/users`：普通 KP 只能建 `role: 'user'`（传 `role:'admin'` 直接 403），忽略 `maxCharacters`（用默认值）；chief 可建玩家或 KP，可指定 `kpRank`。都写 `createdBy/createdByName`。
- 其余 `PUT/PATCH/DELETE/rename/title/password`、`GET /audit` 全部改为 `requireChief`。
- 职业模板：POST 允许任意 KP（写 `createdBy/createdByName`）；PUT/DELETE 要求 chief 或作者。
- `GET /api/admin/audit-rules`：任何 KP 返回 `{ base, own, effective, meta }`。
- `PUT /api/admin/audit-rules`：chief 写全局基准；普通 KP 写 `user.auditRules`。

### 模组（backend/routes/modules.js）
- POST 写 `createdByName: req.user.username`。
- PUT/DELETE：`isChief || m.createdBy === req.user.id`，否则 403「只能修改自己发布的模组」。
- GET 输出包含 `createdByName`。
- 带团记录 `GET /api/sessions`：chief 看全部；普通 KP 只看 `createdBy === self.id`。

### 角色卡（backend/routes/characters.js）
- `present()`：
  - `canEdit = canEditCard(actor, c)`（chief || owner）—— 普通 KP 托管卡为 false
  - `canManage = canManageCard(actor, c)`（chief || custody）
  - `canReview = canReviewCard(actor, c)`
  - `audit`：`isKeeper(actor) ? auditSheet(c, effectiveRules(actor)) : null`
  - `reviewHistory`：canReview 才给
  - 额外返回 `custody`、`reviewKpId/reviewKpName`（`reviewKpId` 对所有能读的人可见，方便玩家看到送给谁了）
- `GET /characters?scope=all`：chief 全量；普通 KP 强过滤 `custody?.kpId === actor.id`（忽略 ownerId 越权）。
- 新增 `GET /characters?scope=review`：chief 全站；普通 KP 只 `reviewKpId === actor.id`。
- POST：`ownerId` 只有 chief 能用；普通 KP 只能建自己的卡。
- PATCH：所有者/首席可改任意字段；**普通 KP 的托管卡只允许 PATCH `KP_ONLY_FIELDS`（legendary/legendaryBonus/agePenaltyWaived）**，出现其它字段 403。
- PUT / DELETE / duplicate：`canEditCard`；duplicate 新卡 `reviewStatus: 'none'`（SEC-11），名字自动加「（副本）」，`custody: null`。
- 模组经历 POST/DELETE：owner/chief；**改完把 `reviewStatus` 失效为 'none'**（SEC-15），并清 `reviewedAt/reviewedBy`。
- 提交审核 `POST /:id/submit { kpId }`：校验 kpId 是 KP；写 `reviewKpId/reviewKpName`；pending 拒绝；owner 或 chief。
- 撤回：owner/chief。
- 审核 `POST /:id/review`：`canReviewCard`；reviews 里补 `targetKpId/targetKpName`。
- `GET /admin/reviews`、`/admin/reviews/batch`、`/admin/audit/batch`：chief 全站；普通 KP 只处理自己队列（reviewKpId === self.id）。
- 新增 `PUT /characters/:id/custody { kpId | null }`：仅 owner（chief 也可），写 `custody = {kpId, kpName, grantedAt}`。

### 审卡规则
- `auditRulesFor(actor)`：`DEFAULT ⊕ settings.auditRules ⊕ (isKeeper(actor) && !isChief ? user.auditRules : {})`。
  首席用全局基准（他自己就是基准维护者）。
- 待办兼容：`/admin/audit/:id` 等老接口全部改用 `auditRulesFor(req.user)`。

## 5. 前端变更

### 全局身份
- `src/lib/roles.js`（新）与后端同名同语义，前端统一从这里取 `isKeeper/isChief`。
- `App.jsx`：`isAdmin` 保留（= isKeeper），新增 `isChief`；`ADMIN_VIEWS` 继续对所有 KP 开放（审卡中心/角色卡管理对普通 KP 也要能进，只是内容被后端过滤）。
- 顶部导航：普通 KP 不显示「发布模组」以外的管理入口？—— 保留「KP 控制台 / 角色卡管理 / 审卡中心」，但「账号管理」入口只给首席，普通 KP 改为「发放账号」。

### 账号管理（AdminUsersPanel）
- 首席：现有全功能 + 权限角色列显示「首席守秘人 / 守秘人」+ 设 KP 五级称号 + 升降级 + 「发放人」列。
- 普通 KP：页面标题「账号发放」，只有发放表单（用户名 + 初始密码）与「我发放的账号」只读列表（含发放时间），无删除/改名/头衔/额度/重置密码。
- 顶栏统计条对普通 KP 隐藏全站统计。

### 角色卡管理
- `CharacterList`：`isKp = mode === 'kp' && isKeeper`；新增 `canCreate`（chief）控制「新建角色卡」按钮；普通 KP 标题「托管角色卡」+ 说明「仅显示玩家授权你托管的角色卡」；托管卡只显示 传奇/豁免/教育 三个快捷操作，隐藏 编辑/删除/复制；列表筛选的「全部玩家」下拉用后端裁剪后的 owners。
- `CharacterDetail`：owner 可见「托管给 KP」选择器与「提交审核 → 选择 KP」；普通 KP 托管时隐藏编辑入口，保留 KP 快捷操作。
- `CharacterEditor`：`canBuildForOthers = isChief`；自定义职业模板列表显示「发布：createdByName」。

### 审卡中心（KpReviewCenter）
- 队列按后端过滤；标题区分「全站待审」/「指派给我的」。
- 增加「我的审卡规则」面板：读取 `{base, own, effective, meta}`，普通 KP 保存到自己的覆盖项；首席保存全局基准。

### 模组
- `ModuleDetailView`：借阅登记 → 「经办人：[createdByName || '档案馆']」，署名区显示发布 KP。
- `HomeView` 卡片署名。
- `ModuleFormView`：发布人预览 = 当前 KP。

### 访客限制
- 访客不请求 `/api/keepers`、`/api/admin/*`、`/api/characters/meta`（除公开字段）；所有新接口 requireAuth；访客只见公开卡与公开模组。
- 前端不把 KP 专属状态（custody、审卡规则、审核队列）渲染给访客。

## 6. 导出文书（CertificatePreview.jsx）

1. **守秘人执导履历**：删掉「守秘人署名 / KEEPER」，改为 `签发：` + 印章压盖在签发线上 + 日期。
2. **全模组带团状态盘点**：`盘点人：[KP 名字]`（直接用当前 KP 用户名，不加「/ KEEPER」）。
3. **调查员生涯鉴定档案**：同样删掉「守秘人署名 / KEEPER」，只留签发印章；`归档类别 / CLASS` 中 `守秘人·首席` → `人事档案`。
4. **称号自由选择**：预览工具栏新增「称号显示：[KP 称号] [玩家称号]」切换；选择结果写入 localStorage，导出/打印时使用。
   - 玩家称号：`user.title`（五级调查员）
   - KP 称号：chief → `首席守秘人`；其余 → `user.kpTitle`（五级守秘人）
5. 硬约束不变：证书画布禁 mask / 动画 / @property；打印子树恒浅色；尺寸与行数不能溢出。

## 7. 安全（本轮一并实施 SEC-06/07/11/12/15/16/17/19/20）

- **SEC-06 审计**：单文件 8MB 上限轮转（`audit-YYYY-MM-DD.1.jsonl`）；`readAudit` 只读文件尾部（≤2MB）；运行期每天检查一次 prune。
- **SEC-07 限流**：`RateLimiter/FailLimiter` 增加 Map 键上限（10000），超限按最旧淘汰；键继续含 IP，登录类含 `ip|username`。
- **SEC-11 复制**：见上（reviewStatus 清空）。
- **SEC-12 教育增强**：POST 建卡同样过 `guardEduGrowth`；首次结算分支清空 `settled/gain/count/rerolls/manual/granted/attempts/lastGrant/lastReset`；未结算状态从 warn 升级为服务端拒绝写入（返回 400）。
- **SEC-15 模组经历**：见上（approved → none）。
- **SEC-16 原子写**：临时文件带随机后缀；rename 对 EPERM/EBUSY/EACCES 重试 3 次（间隔 20ms）。
- **SEC-17 错误处理**：`errorHandler` 识别 `err.type === 'entity.parse.failed'`（400）、`entity.too.large`（413）、任意 `err.status` 4xx 原样返回且不打堆栈。
- **SEC-19 职业校验**：`Object.hasOwn(OCCUPATION_BY_ID, raw)` + 拒绝 `__proto__/constructor/prototype`。
- **SEC-20 优雅退出**：`server.close()` + `closeAllConnections()`，`saveNow()` 放同步路径，5s 兜底强制退出。

## 8. 验收

- `npm run lint` 0 error；`npm run build` 通过。
- `npm run smoke` 全绿（新增多 KP 用例：发放账号、越权改模组 403、托管范围、指定审核人、per-KP 规则、副本清审核、审计轮转、限流上限）。
- `node tools/ui-check.mjs` 全绿（更新导航与文案断言）。
- 手工截图核对：首席 / 普通 KP / 玩家 / 访客 四种视角。
---

## 9. 实施结果（2026-11-05，v10.1.0）

已按本文全部落地，回归数据如下：

| 项 | 结果 |
| --- | --- |
| `npm run lint` | 0 error / 14 warning（与基线一致，均为既有前端 rule 提示） |
| `npm run build` | 通过，`dist/assets/index-*.js` 783.15 kB（既有 chunk 体积提示） |
| `npm run smoke` | 235 通过 / 0 失败（新增「多 KP 权限（v10.1）」section） |
| `node tools/check-shared.mjs` | 26 通过 / 0 失败 |
| `npm run check:secrets` | 4 / 4 |
| `node tools/ui-check.mjs` | 96 通过 / 0 失败 |
| 多 KP 权限矩阵（临时脚本） | 42 通过 / 0 失败 |
| 四视角截图 | 首席 / 普通守秘人 / 玩家 / 访客，产物在 `tools/_shots/multikp/` |

实施中与本文原方案的两处偏差（以代码为准）：

1. **托管者可 PATCH 的字段扩到 6 个**：`legendary, legendaryBonus, agePenaltyWaived, eduBonus, eduGrowth, applyAgeAdjust`（原计划只列传奇/豁免/教育三项；年龄与教育结算需要一起放行，且全部经服务端守卫推导）。归属 `ownerId` 不在白名单，非首席传不同归属直接 403。
2. **SEC-12 首次结算没有直接拒绝写入**，而是按 `attempts/manual/eduBonus` 服务端重算 `settled/count/gain` 并清授权状态：老玩家卡第一次保存时仍能正常落盘，但无法再自证 EDU 提升。`eduUnsettled` 仍保留为审计 finding（不再阻断保存），因为现有卡里存在历史数据。
3. **SEC-08 采用可选 `COCOC_SETUP_TOKEN`**，而不是强制回环限制：不设置时保持本地首启体验，生产部署设置后首启注册必须带对初始化口令。

已知遗留（不影响本轮验收）：

- 首席移交后前端不会自动刷新身份，会提示重新登录（后端权限已即时生效）。
- 普通守秘人的建卡额度由首席统一设定，前端只读展示（后端同样强制）。
- `SEC-10` 仍需在 1panel/雷池侧用 `curl -I` 验证安全头覆盖。
