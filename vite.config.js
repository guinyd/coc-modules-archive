import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * 说明：
 *  - 未设置 base，产物引用 /assets/... 绝对路径 —— 站点必须部署在域名根路径。
 *  - dev 与 preview 都把 /api 代理到后端 3000 端口，保证前后端同源
 *    （生产环境由 面板 / WAF 或自建 HTTPS 反代承担同样的反代与 TLS）。
 *  - preview 用于在本地以「生产产物」跑一遍冒烟测试。
 */
const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
  },
}

/**
 * 禁止 dev server 通过 URL 直接读取仓库内的运行期数据与敏感文件。
 * Vite 默认只限制 workspace root，但根目录下的 backend/、.demo-data/、database.json
 * 仍可能被 /@fs/ 或直接路径访问；显式 deny 后统一拒绝。public/ 与 src/ 不受影响。
 */
const fsDeny = [
  '.env',
  '.env.*',
  '*.{crt,pem}',
  '**/.git/**',
  '**/.demo-data/**',
  '**/backend/**',
  '**/data/**',
  '**/database.json',
  '**/database.json.*',
  '**/*.jsonl',
  '**/.run/**',
  '**/.tmp-build/**',
  '**/tools/**',
]

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: apiProxy,
    fs: { deny: fsDeny },
    // 有的编辑器（含 DSH 的 edit 工具）用「临时目录 + 改名」原子写文件。
    // Vite 的 chokidar 偶尔会在改名瞬间锁住临时文件并抛 EBUSY，把 dev server 带崩；
    // 这类 *.tmpdir 不是源码，直接忽略。
    // .tmp-build 是构建时给 esbuild/Chrome 用的临时目录（绝不能被 watch，否则 EBUSY）。
    watch: { ignored: ['**/*.tmpdir/**', '**/.*.tmpdir/**', '**/.tmp-build/**'] },
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
})
