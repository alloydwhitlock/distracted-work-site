/**
 * Shared theme logic for distracted.work
 */
(function () {
  'use strict';

  function resolveTheme(setting) {
    if (setting === 'dark' || setting === 'light') return setting;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(setting) {
    var resolved = resolveTheme(setting);
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(resolved);
    var toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.textContent = { auto: 'Auto', light: 'Light', dark: 'Dark' }[setting] || 'Auto';
    }
    localStorage.setItem('dw-theme', setting);
    window._currentTheme = setting;
  }

  function cycleTheme() {
    var cycle = ['auto', 'light', 'dark'];
    var current = window._currentTheme || 'auto';
    var idx = cycle.indexOf(current);
    var next = cycle[(idx + 1) % cycle.length];
    applyTheme(next);
  }

  function initTheme() {
    var saved = localStorage.getItem('dw-theme') || 'auto';
    applyTheme(saved);
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (window._currentTheme === 'auto') applyTheme('auto');
  });

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    var toggle = document.getElementById('themeToggle');
    if (toggle) toggle.addEventListener('click', cycleTheme);
  });
})();
