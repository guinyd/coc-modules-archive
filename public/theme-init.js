/* 主题引导：在样式表之前决定昼/夜，避免整页闪白。
   CSP 只放行同源脚本，因此必须是独立文件而不是内联脚本。 */
(function () {
  try {
    var stored = localStorage.getItem('coc-theme');
    var theme = stored === 'dark' || stored === 'light' ? stored : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#081311' : '#ece3d1');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
