(function () {
  'use strict';

  var THEMES = [
    { id: 'classic', name: 'Classic', accent: '#4361ee' },
    { id: 'new-york', name: 'New York', accent: '#326891' },
    { id: 'nord', name: 'Nord', accent: '#5e81ac' },
    { id: 'catppuccin', name: 'Catppuccin', accent: '#1e66f5' },
    { id: 'tokyo-night', name: 'Tokyo Night', accent: '#34548a' },
    { id: 'molokai', name: 'Molokai', accent: '#f92672' },
    { id: 'dracula', name: 'Dracula', accent: '#bd93f9' },
    { id: 'solarized', name: 'Solarized', accent: '#268bd2' },
    { id: 'gruvbox', name: 'Gruvbox', accent: '#d65d0e' },
    { id: 'one-dark', name: 'One Dark', accent: '#4078f2' },
    { id: 'rose-pine', name: 'Rosé Pine', accent: '#907aa9' },
    { id: 'synthwave-84', name: "Synthwave '84", accent: '#ff7edb' },
    { id: 'everforest', name: 'Everforest', accent: '#8da101' },
    { id: 'kanagawa', name: 'Kanagawa', accent: '#957fb8' },
    { id: 'ayu', name: 'Ayu', accent: '#ff9940' },
    { id: 'palenight', name: 'Palenight', accent: '#82aaff' },
    { id: 'horizon', name: 'Horizon', accent: '#da103f' }
  ];

  var MODES = ['auto', 'light', 'dark'];

  // --- Cookie helpers ---
  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function setCookie(name, value) {
    var d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    document.cookie = name + '=' + value + ';path=/;expires=' + d.toUTCString() + ';SameSite=Lax';
  }

  // --- Theme logic ---
  function resolveMode(mode) {
    if (mode === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  }

  function applyTheme(mode, style) {
    var resolved = resolveMode(mode);
    document.body.className = document.body.className
      .replace(/\b(light|dark)\b/g, '').trim();
    document.body.classList.add(resolved);
    if (style && style !== 'classic') {
      document.body.setAttribute('data-style', style);
    } else {
      document.body.removeAttribute('data-style');
    }
  }

  function saveAndApply(mode, style) {
    setCookie('dw-theme', mode + '|' + style);
    applyTheme(mode, style);
    updateFABState();
  }

  // --- Read saved preference ---
  var saved = (getCookie('dw-theme') || 'auto|classic').split('|');
  var currentMode = saved[0] || 'auto';
  var currentStyle = saved[1] || 'classic';

  // Apply immediately (before DOMContentLoaded to prevent flash)
  applyTheme(currentMode, currentStyle);

  // Listen for OS theme changes when in auto mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (currentMode === 'auto') {
      applyTheme(currentMode, currentStyle);
    }
  });

  // --- FAB UI (built on DOMContentLoaded) ---
  var fabPanel = null;
  var fabBtn = null;
  var isOpen = false;

  function updateFABState() {
    if (!fabPanel) return;
    // Update mode buttons
    var modeButtons = fabPanel.querySelectorAll('[data-mode]');
    modeButtons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === currentMode);
    });
    // Update style swatches
    var swatches = fabPanel.querySelectorAll('[data-style]');
    swatches.forEach(function (sw) {
      sw.classList.toggle('active', sw.getAttribute('data-style') === currentStyle);
    });
    // Update FAB button accent
    if (fabBtn) {
      var theme = THEMES.find(function (t) { return t.id === currentStyle; });
      fabBtn.style.backgroundColor = theme ? theme.accent : '#4361ee';
    }
  }

  function togglePanel() {
    isOpen = !isOpen;
    fabPanel.classList.toggle('open', isOpen);
    fabBtn.setAttribute('aria-expanded', isOpen);
  }

  function closePanel() {
    isOpen = false;
    fabPanel.classList.remove('open');
    fabBtn.setAttribute('aria-expanded', 'false');
  }

  function buildFAB() {
    // Container
    var container = document.createElement('div');
    container.className = 'theme-fab-container';

    // FAB button
    fabBtn = document.createElement('button');
    fabBtn.className = 'theme-fab-btn';
    fabBtn.setAttribute('aria-label', 'Change theme');
    fabBtn.setAttribute('aria-expanded', 'false');
    fabBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2"/><circle cx="17.5" cy="10.5" r="2"/><circle cx="8.5" cy="7.5" r="2"/><circle cx="6.5" cy="12" r="2"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.7 1.7-1.5 0-.4-.2-.7-.4-1-.2-.3-.3-.6-.3-1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5.5-4.5-10-10-10z"/></svg>';
    fabBtn.addEventListener('click', togglePanel);

    // Panel
    fabPanel = document.createElement('div');
    fabPanel.className = 'theme-fab-panel';

    // Mode buttons
    var modeRow = document.createElement('div');
    modeRow.className = 'theme-mode-row';
    MODES.forEach(function (mode) {
      var btn = document.createElement('button');
      btn.className = 'theme-mode-btn';
      btn.setAttribute('data-mode', mode);
      btn.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
      btn.addEventListener('click', function () {
        currentMode = mode;
        saveAndApply(currentMode, currentStyle);
      });
      modeRow.appendChild(btn);
    });
    fabPanel.appendChild(modeRow);

    // Theme swatches
    var grid = document.createElement('div');
    grid.className = 'theme-swatch-grid';
    grid.setAttribute('role', 'radiogroup');
    grid.setAttribute('aria-label', 'Theme style');
    THEMES.forEach(function (theme) {
      var swatch = document.createElement('button');
      swatch.className = 'theme-swatch';
      swatch.setAttribute('data-style', theme.id);
      swatch.setAttribute('role', 'radio');
      swatch.setAttribute('aria-label', theme.name);
      swatch.setAttribute('title', theme.name);
      swatch.style.backgroundColor = theme.accent;
      swatch.addEventListener('click', function () {
        currentStyle = theme.id;
        saveAndApply(currentMode, currentStyle);
      });
      grid.appendChild(swatch);
    });
    fabPanel.appendChild(grid);

    container.appendChild(fabPanel);
    container.appendChild(fabBtn);
    document.body.appendChild(container);

    updateFABState();

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (isOpen && !container.contains(e.target)) {
        closePanel();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        closePanel();
        fabBtn.focus();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', buildFAB);
})();
