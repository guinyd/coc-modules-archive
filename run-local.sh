#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# 本地一键启动 / 停止（生产构建 + 后端）
#
#   bash run-local.sh start    启动后端(3000) 与前端产物预览(4173)
#   bash run-local.sh start --lan  允许局域网访问（默认只绑定 127.0.0.1）
#   bash run-local.sh stop     停止两者
#   bash run-local.sh status   查看运行状态与地址
#   bash run-local.sh dev      改用 Vite 开发服务器(5173，改代码即时生效)
#   bash run-local.sh logs     查看日志
#
# 说明：默认所有服务只绑定 127.0.0.1；显式传 --lan 才监听 0.0.0.0，
#       供同一局域网的平板/手机访问。后端仍由前端服务反代 /api。
# ---------------------------------------------------------------------------
set -uo pipefail
cd "$(dirname "$0")"

RUN_DIR=".run"
BACKEND_PORT="${PORT:-3000}"
WEB_PORT="${WEB_PORT:-4173}"
DEV_PORT=5173

mkdir -p "$RUN_DIR"

# --lan 可出现在命令前后；默认只监听回环地址（SEC-01）。
LAN=0
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --lan) LAN=1 ;;
    *) ARGS+=("$arg") ;;
  esac
done
if ((${#ARGS[@]})); then set -- "${ARGS[@]}"; else set --; fi
CMD="${1:-start}"

BACKEND_HOST="${COCOC_HOST:-127.0.0.1}"
WEB_HOST="127.0.0.1"
if [[ "$LAN" == 1 ]]; then
  BACKEND_HOST="0.0.0.0"
  WEB_HOST="0.0.0.0"
fi

pidfile() { echo "$RUN_DIR/$1.pid"; }

# 端口 -> 监听进程 PID（Windows/Git Bash 下 kill -0 对原生进程不可靠，统一走 netstat）
port_pid() {
  netstat -ano 2>/dev/null | grep LISTENING | grep -E "[:.]$1 " | awk '{print $NF}' | head -1
}

is_alive() {
  [[ -n "$(port_pid "$1")" ]]
}

# 结束进程树（vite 会派生子进程）
kill_tree() {
  local pid="$1"
  [[ -n "$pid" ]] || return 0
  if command -v taskkill >/dev/null 2>&1; then
    taskkill //F //T //PID "$pid" >/dev/null 2>&1 || true
  else
    pkill -TERM -P "$pid" 2>/dev/null || true
    kill -TERM "$pid" 2>/dev/null || true
  fi
}

stop_port() {
  local name="$1" port="$2" pid
  pid="$(port_pid "$port")"
  [[ -f "$(pidfile "$name")" ]] && pid="${pid:-$(cat "$(pidfile "$name")")}"
  if [[ -n "$pid" ]]; then
    kill_tree "$pid"
    rm -f "$(pidfile "$name")"
    echo "  已停止 $name（端口 $port，pid $pid）"
  else
    echo "  $name 未在运行"
  fi
}

start_backend() {
  if is_alive "$BACKEND_PORT"; then echo "  后端已在运行（端口 $BACKEND_PORT）"; return; fi
  echo "  后端绑定：$BACKEND_HOST:$BACKEND_PORT"
  COCOC_HOST="$BACKEND_HOST" PORT="$BACKEND_PORT" nohup node backend/server.js > "$RUN_DIR/backend.log" 2>&1 &
  echo $! > "$(pidfile backend)"
  sleep 2
  if curl -sf "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null; then
    echo "  ✅ 后端 http://127.0.0.1:$BACKEND_PORT（绑定 $BACKEND_HOST）"
  else
    echo "  ❌ 后端启动失败，见 $RUN_DIR/backend.log"; tail -5 "$RUN_DIR/backend.log"
  fi
}

start_web() {
  if is_alive "$WEB_PORT"; then echo "  站点已在运行（端口 $WEB_PORT）"; return; fi
  [[ -d dist ]] || { echo "  未找到 dist，先执行 npm run build"; return; }
  echo "  前端绑定：$WEB_HOST:$WEB_PORT"
  nohup npx vite preview --host "$WEB_HOST" --port "$WEB_PORT" --strictPort > "$RUN_DIR/preview.log" 2>&1 &
  echo $! > "$(pidfile web)"
  sleep 5
  if curl -sf "http://127.0.0.1:$WEB_PORT/" >/dev/null; then
    echo "  ✅ 站点 http://localhost:$WEB_PORT（绑定 $WEB_HOST）"
    if [[ "$LAN" == 1 ]]; then
      grep -o 'http://[0-9.]*:'"$WEB_PORT" "$RUN_DIR/preview.log" | sort -u | sed 's/^/     局域网: /'
    fi
  else
    echo "  ❌ 前端启动失败，见 $RUN_DIR/preview.log"; tail -5 "$RUN_DIR/preview.log"
  fi
}

start_dev() {
  if is_alive "$DEV_PORT"; then echo "  开发服务器已在运行（端口 $DEV_PORT）"; return; fi
  echo "  开发服务器绑定：$WEB_HOST:$DEV_PORT"
  nohup npx vite --host "$WEB_HOST" --port "$DEV_PORT" --strictPort > "$RUN_DIR/dev.log" 2>&1 &
  echo $! > "$(pidfile dev)"
  sleep 5
  echo "  ✅ 开发服务器 http://localhost:$DEV_PORT（绑定 $WEB_HOST，改代码即时生效）"
}

case "$CMD" in
  start)
    if [[ "$LAN" == 1 ]]; then echo "==> 启动（--lan：监听 0.0.0.0）"; else echo "==> 启动（仅本机 127.0.0.1）"; fi
    start_backend
    start_web
    echo
    echo "浏览器打开：http://localhost:$WEB_PORT"
    ;;
  dev)
    if [[ "$LAN" == 1 ]]; then echo "==> 启动（开发模式，--lan：监听 0.0.0.0）"; else echo "==> 启动（开发模式，仅本机 127.0.0.1）"; fi
    start_backend
    start_dev
    rm -f "$(pidfile web)"
    echo
    echo "浏览器打开：http://localhost:$DEV_PORT"
    ;;
  stop)
    echo "==> 停止"
    stop_port web "$WEB_PORT"; stop_port dev "$DEV_PORT"; stop_port backend "$BACKEND_PORT"
    ;;
  status)
    echo "==> 状态"
    if is_alive "$BACKEND_PORT"; then echo "  后端 运行中  http://127.0.0.1:$BACKEND_PORT（绑定 $BACKEND_HOST）"; else echo "  后端 已停止"; fi
    if is_alive "$WEB_PORT"; then echo "  站点 运行中  http://localhost:$WEB_PORT（绑定 $WEB_HOST）"; else echo "  站点 已停止"; fi
    if is_alive "$DEV_PORT"; then echo "  开发 运行中  http://localhost:$DEV_PORT（绑定 $WEB_HOST）"; fi
    ;;
  logs)
    tail -n "${2:-40}" "$RUN_DIR/backend.log" 2>/dev/null
    echo "--- preview ---"
    tail -n "${2:-20}" "$RUN_DIR/preview.log" 2>/dev/null
    ;;
  *)
    sed -n '2,16p' "$0"
    ;;
esac
