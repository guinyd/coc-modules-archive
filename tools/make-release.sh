#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# 生成「服务器更新包」——只含代码与前端产物，不含任何数据。
#
#   bash tools/make-release.sh [输出目录] [版本号]
#     默认输出到 ../_release
#
# 约定（v1.7.5 起）：
#   - 只产出 **zip**，不留 tar.gz / sha256 / 解压目录；
#   - 包内只有四个目录：backend / deploy / index / shared
#       index/    前端静态产物（目录名就叫 index，直接覆盖站点静态根）
#       backend/  后端源码（server.js / lib / routes / tools / package*.json，不含 data/ 与 node_modules/）
#       shared/   规则引擎（后端运行时需要）
#       deploy/   部署与更新工具（apply-update.sh / update-guide.md / nginx.conf.sample）
#   - **zip 根就是这四个目录，不再套 `coc-archive-update-<版本>-<时间>/` 父目录**
#     （2026-10-30 起；服务器解压：`unzip <包>.zip -d <目录> && cd <目录>`）
#   - _release 目录里最多保留最近 3 个 zip，更早的自动清理。
#
# 刻意**不包含** backend/data/ —— 服务器上的历史数据必须原样保留，
# apply-update.sh 会在更新前后对数据文件做校验和比对。
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

VERSION="${2:-v1.7}"
STAMP="$(date +%Y%m%d-%H%M)"
OUT_ARG="${1:-$ROOT/../_release}"
mkdir -p "$OUT_ARG"
OUT_DIR="$(cd "$OUT_ARG" && pwd)"
NAME="coc-archive-update-${VERSION}-${STAMP}"
STAGE="${OUT_DIR}/${NAME}"

echo "==> 1/5 静态检查"
npm run lint --silent

echo "==> 2/5 构建前端产物"
npm run build

echo "==> 3/5 组装 $STAGE"
rm -rf "$STAGE"
mkdir -p "$STAGE"

cp -r dist "$STAGE/index"
mkdir -p "$STAGE/backend"
for item in server.js lib routes tools package.json package-lock.json; do
  cp -r "backend/$item" "$STAGE/backend/$item"
done
# 运行期数据绝不入包（双保险：即使有人往里放了东西也在这里拦下）
rm -rf "$STAGE/backend/data" "$STAGE/backend/database.json" "$STAGE/backend/node_modules"

cp -r shared "$STAGE/shared"
mkdir -p "$STAGE/deploy"
cp deploy/apply-update.sh deploy/update-guide.md deploy/nginx.conf.sample "$STAGE/deploy/"
chmod +x "$STAGE/deploy/apply-update.sh"

echo "==> 4/5 打包（仅 zip；zip 根就是四个目录，不套父目录）"
rm -f "${OUT_DIR}/${NAME}.zip"
( cd "$OUT_DIR"
  # 约定：zip 内路径不带 coc-archive-update-<版本>-<时间>/ 前缀，
  # 直接是 backend/ deploy/ index/ shared/（用户 2026-10-30 反馈解压多一层很烦）。
  # 优先用 Python 的 zipfile：路径分隔符永远是 /，Linux 上 unzip 最稳
  if command -v python >/dev/null 2>&1; then
    python - "$NAME" <<'PY'
import os, sys, zipfile

name = sys.argv[1]
with zipfile.ZipFile(name + ".zip", "w", zipfile.ZIP_DEFLATED) as z:
    for root, _dirs, files in os.walk(name):
        for f in files:
            full = os.path.join(root, f)
            z.write(full, os.path.relpath(full, name))
PY
  elif command -v zip >/dev/null 2>&1; then
    ( cd "$NAME" && zip -qr "../${NAME}.zip" . )
  else
    powershell -NoProfile -Command "Compress-Archive -Path '${NAME}/*' -DestinationPath '${NAME}.zip' -Force"
  fi )
rm -rf "$STAGE"

echo "==> 5/5 清理旧包（只留最近 3 个 zip）"
( cd "$OUT_DIR"
  rm -rf coc-archive-update-*.tar.gz coc-archive-update-*.sha256
  for d in coc-archive-update-*/; do [[ -d "$d" ]] && rm -rf "$d"; done
  ls -1t coc-archive-update-*.zip 2>/dev/null | tail -n +4 | while read -r old; do rm -f "$old"; echo "  - 已清理 $old"; done )

echo
echo "✅ 更新包已生成："
ls -lh "$OUT_DIR/${NAME}.zip"
echo
echo "包内确认无数据文件："
if command -v python >/dev/null 2>&1; then
  if python -c "
import sys, zipfile
names = zipfile.ZipFile(sys.argv[1]).namelist()
bad = [n for n in names if n.endswith('/database.json') or n.endswith('.jsonl') or '/backups/' in n]
print('  发现可疑数据文件：' + ', '.join(bad) if bad else '', end='')
sys.exit(1 if bad else 0)
" "$OUT_DIR/${NAME}.zip"; then
    echo "  ✓ 干净（无运行期 database.json / 无审计日志 / 无 backups）"
  else
    echo ""; echo "  ❌ 发现数据文件，请检查！"; exit 1
  fi
else
  echo "  （没有 python，跳过包内数据自检）"
fi
echo "  ✓ 包内结构：backend/ deploy/ index/ shared/（zip 根，无父目录）"
echo
echo "当前保留的包："
ls -1t "$OUT_DIR"/coc-archive-update-*.zip 2>/dev/null | sed 's/^/  /'
echo
echo "服务器上执行（解压到独立目录，避免散落在当前目录）："
echo "  unzip ${NAME}.zip -d ${NAME} && cd ${NAME}"
echo "  sudo bash deploy/apply-update.sh --web <站点根>/index --app <后端目录> --port 3000"
