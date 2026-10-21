// Apply the saved preference before rendering, including when storage is restricted.
(() => {
  let theme = 'dark';
  try {
    if (localStorage.getItem('arena-theme') === 'light') theme = 'light';
  } catch {
    // The switch still works for this page when browser storage is unavailable.
  }
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'light' ? '#f5f6fc' : '#090e1c');
})();
