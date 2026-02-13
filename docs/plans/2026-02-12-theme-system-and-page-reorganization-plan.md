# Theme System & Page Reorganization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the extension's 17-theme system to the marketing site with a floating switcher, reorganize dev content into a new Open Source page, and visually polish all pages.

**Architecture:** CSS Variables Mirror approach — copy theme CSS custom properties from the extension, refactor `style.css` to consume them, add shared `theme-switcher.js` for cookie-persisted switching via a floating FAB.

**Tech Stack:** HTML, CSS (custom properties), vanilla JavaScript, cookies. No frameworks, no build step, no external dependencies.

**Design doc:** `docs/plans/2026-02-12-theme-system-and-page-reorganization-design.md`

---

### Task 1: Create `themes.css` from extension theme definitions

**Files:**
- Source (read-only): `../distracted-work-extension/extension/shared/themes.css`
- Create: `themes.css`

**Step 1: Create `themes.css`**

Copy the extension's theme definitions verbatim into a new `themes.css` at the site root. The file should contain:

- All 17 theme blocks (Classic through Horizon) with their light and dark variants
- Same selectors: `body.light`, `body.dark`, `body[data-style="theme-name"].light`, `body[data-style="theme-name"].dark`
- Same CSS custom properties: `--bg`, `--text`, `--text-muted`, `--card-bg`, `--card-border`, `--accent`, `--accent-hover`, `--input-bg`, `--input-border`, `--divider`
- Add one site-specific variable to the Classic light/dark blocks: `--cta: #ff6b35` (orange) for extension download CTAs. This stays constant across all themes.

Add `--cta: #ff6b35;` to every `body.light` and `body.dark` variant so it's always available. This is the site-specific orange used for install/download buttons and the download-hero gradient.

Also add a global smooth transition rule at the bottom:

```css
/* Smooth theme transitions */
body, .info-box, .media-frame, .steps li::before, .btn-primary, .site-footer {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
```

**Step 2: Verify file**

Run: `python3 -m http.server 4173` (from site root)
Open http://127.0.0.1:4173 — the file should load without errors (check DevTools console). The page won't visually change yet since nothing references it.

**Step 3: Commit**

```bash
git add themes.css
git commit -m "feat: add themes.css with 17 extension themes and site transitions"
```

---

### Task 2: Refactor `style.css` to use CSS variables

**Files:**
- Modify: `style.css`

**Step 1: Replace all hardcoded colors with CSS variables**

Make the following replacements throughout `style.css`:

| Line(s) | Current value | Replacement |
|---------|--------------|-------------|
| 6 | `background-color: #f8f9fa` | `background-color: var(--bg)` |
| 6 | `color: #333` | `color: var(--text)` |
| 9 | `a { color: #4361ee; }` | `a { color: var(--accent); }` |
| 20 | `.btn-primary { background-color: #4361ee` | `.btn-primary { background-color: var(--accent)` |
| 22 | `.btn-extension { background-color: #ff6b35` | `.btn-extension { background-color: var(--cta)` |
| 34 | `.page .lead { ... color: #444; }` | `.page .lead { ... color: var(--text-muted); }` |
| 37 | `.info-box { background: rgba(67, 97, 238, 0.08)` | `.info-box { background: var(--card-bg); border: 1px solid var(--card-border)` |
| 47 | `.download-hero { background: linear-gradient(145deg, #ff6b35, #e85d26)` | `.download-hero { background: linear-gradient(145deg, var(--cta), color-mix(in srgb, var(--cta) 85%, black))` |
| 51 | `box-shadow: 0 8px 32px rgba(255, 107, 53, 0.25)` | `box-shadow: 0 8px 32px rgba(255, 107, 53, 0.25)` (keep as-is, shadow is fine) |
| 101 | `.steps li::before { background: #4361ee` | `.steps li::before { background: var(--accent)` |
| 110 | `.media-frame { background: #e9ecef` | `.media-frame { background: var(--card-bg)` |
| 138 | `.page pre { background: rgba(67, 97, 238, 0.08)` | `.page pre { background: var(--card-bg)` |
| 150 | `.site-footer { border-top: 1px solid #ddd` | `.site-footer { border-top: 1px solid var(--divider)` |

**Step 2: Verify visually**

Run local server, open all 4 pages. They should look identical to before (Classic light theme is the default, which matches the original hardcoded colors closely). Check DevTools — no missing variable warnings.

**Step 3: Commit**

```bash
git add style.css
git commit -m "refactor: replace hardcoded colors with CSS variables in style.css"
```

---

### Task 3: Create `theme-switcher.js`

**Files:**
- Create: `theme-switcher.js`

**Step 1: Write theme-switcher.js**

This file handles:

1. **Cookie read/write** — reads `dw-theme` cookie on load, writes on change
2. **Theme application** — sets `body.className` (light/dark) and `body.dataset.style` (theme name)
3. **OS preference detection** — `window.matchMedia('(prefers-color-scheme: dark)')` for auto mode
4. **FAB UI** — renders and manages the floating theme switcher panel

```javascript
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
```

**Step 2: Verify**

Open any page. The FAB should appear bottom-right. Click it — panel should expand. Click a swatch — theme should change. Refresh — theme should persist via cookie.

**Step 3: Commit**

```bash
git add theme-switcher.js
git commit -m "feat: add theme-switcher.js with FAB UI and cookie persistence"
```

---

### Task 4: Add FAB styles to `style.css`

**Files:**
- Modify: `style.css`

**Step 1: Add FAB component styles**

Append the following to the end of `style.css` (before the `@keyframes fadeIn` block):

```css
/* Theme FAB */
.theme-fab-container {
  position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 1000;
}
.theme-fab-btn {
  width: 48px; height: 48px; border-radius: 50%; border: none;
  color: #fff; cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.15s, box-shadow 0.15s, background-color 0.2s;
}
.theme-fab-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(0,0,0,0.25);
}
.theme-fab-panel {
  position: absolute; bottom: 60px; right: 0;
  background: var(--card-bg, #fff); border: 1px solid var(--card-border, #e0e0e0);
  border-radius: 16px; padding: 1rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  opacity: 0; transform: translateY(8px) scale(0.95);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  min-width: 220px;
}
.theme-fab-panel.open {
  opacity: 1; transform: translateY(0) scale(1);
  pointer-events: auto;
}
.theme-mode-row {
  display: flex; gap: 0.25rem; margin-bottom: 0.75rem;
}
.theme-mode-btn {
  flex: 1; padding: 0.4rem; border: 1px solid var(--divider, #e0e0e0);
  border-radius: 8px; background: transparent; color: var(--text, #333);
  font-size: 0.8rem; font-weight: 600; cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}
.theme-mode-btn.active {
  background: var(--accent, #4361ee); color: #fff;
  border-color: var(--accent, #4361ee);
}
.theme-swatch-grid {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.4rem;
}
.theme-swatch {
  width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent;
  cursor: pointer; transition: transform 0.15s, border-color 0.15s;
  padding: 0;
}
.theme-swatch:hover { transform: scale(1.15); }
.theme-swatch.active {
  border-color: var(--text, #333);
  box-shadow: 0 0 0 2px var(--bg, #fff);
}
```

**Step 2: Verify**

Refresh any page. FAB panel should be styled correctly — panel appears above the button, swatches are a grid of colored circles, mode buttons in a row.

**Step 3: Commit**

```bash
git add style.css
git commit -m "style: add floating theme switcher (FAB) component styles"
```

---

### Task 5: Wire up `themes.css` and `theme-switcher.js` in all HTML pages

**Files:**
- Modify: `index.html`
- Modify: `install.html`
- Modify: `privacy.html`
- Modify: `contact.html`

**Step 1: Add stylesheet and script references**

In each HTML file's `<head>`, add after the existing `<link rel="stylesheet" href="style.css">`:

```html
<link rel="stylesheet" href="themes.css">
```

Before the closing `</body>` tag (but before any page-specific `<script>` blocks), add:

```html
<script src="theme-switcher.js"></script>
```

For `index.html` specifically: the `theme-switcher.js` script tag should go before the existing inline `<script>` block that handles message cycling.

**Step 2: Verify all pages**

Open each page. Theme switcher should work on all pages. Switch theme on one page, navigate to another — cookie should persist the choice.

**Step 3: Commit**

```bash
git add index.html install.html privacy.html contact.html
git commit -m "feat: wire up theme system and switcher across all pages"
```

---

### Task 6: Create `opensource.html`

**Files:**
- Create: `opensource.html`

**Step 1: Create the page**

Create `opensource.html` with this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Open Source | distracted.work</title>
  <meta name="description" content="Distracted Work is open source. View the code, contribute, and see what's changed.">
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="themes.css">
</head>
<body>
  <main class="page">
    <h1>Open Source</h1>
    <p class="lead">Distracted Work is built in the open. Browse the code, report issues, or contribute.</p>

    <div class="info-box">
      <p><strong>Extension</strong></p>
      <a class="strong-link" href="https://github.com/alloydwhitlock/distracted-work-mozilla-extension" target="_blank">github.com/alloydwhitlock/distracted-work-mozilla-extension</a>
    </div>

    <div class="info-box">
      <p><strong>Website</strong></p>
      <a class="strong-link" href="https://github.com/alloydwhitlock/distracted-work-site" target="_blank">github.com/alloydwhitlock/distracted-work-site</a>
    </div>

    <h2>Contributing</h2>
    <p>Found a bug or have an idea? <a href="https://github.com/alloydwhitlock/distracted-work-mozilla-extension/issues" target="_blank">Open an issue</a> on GitHub. Pull requests are welcome.</p>

    <h2>Clone the Repo</h2>
    <pre><code>git clone https://github.com/alloydwhitlock/distracted-work-mozilla-extension.git</code></pre>

    <h2>License</h2>
    <p>Distracted Work is released under the <a href="https://github.com/alloydwhitlock/distracted-work-mozilla-extension/blob/main/LICENSE" target="_blank">MIT License</a>.</p>

    <h2>Changelog</h2>

    <!-- CHANGELOG_START -->
    <!-- Changelog entries auto-injected by sync-changelog.sh -->
    <!-- CHANGELOG_END -->
  </main>

  <footer class="site-footer">
    <a href="/">Home</a> &middot;
    <a href="install.html">Install</a> &middot;
    <a href="opensource.html">Open Source</a> &middot;
    <a href="privacy.html">Privacy</a> &middot;
    <a href="contact.html">Contact</a> &middot;
    Made with care by <a href="https://adamwhitlock.com" target="_blank">Adam Whitlock</a>
    <a class="coffee-link" href="https://ko-fi.com/adamwhitlock" target="_blank" rel="noopener">(&#9749; buy him a coffee)</a>
  </footer>

  <script src="theme-switcher.js"></script>
</body>
</html>
```

Note: The changelog markers are empty — the sync script will populate them.

**Step 2: Verify**

Open http://127.0.0.1:4173/opensource.html — page should render with correct styling and theme switcher.

**Step 3: Commit**

```bash
git add opensource.html
git commit -m "feat: add open source page with changelog markers and contributing info"
```

---

### Task 7: Slim down `install.html` and update `contact.html`

**Files:**
- Modify: `install.html`
- Modify: `contact.html`

**Step 1: Remove sections from `install.html`**

Remove these sections from `install.html`:

1. The "Open Source" section (lines 57-60): the `<h2>Open Source</h2>`, the paragraph, the `<pre><code>git clone...</code></pre>`, and the links paragraph.
2. The "Changelog" section (lines 62-169): the `<h2>Changelog</h2>` heading and everything from `<!-- CHANGELOG_START -->` through `<!-- CHANGELOG_END -->` inclusive.

Keep: the page structure, download hero, "How It Works", "Features", and the appearance screenshot.

**Step 2: Update `contact.html`**

Replace the GitHub Issues info-box with a link pointing to the Open Source page:

Change:
```html
<div class="info-box">
  <p>GitHub Issues</p>
  <a class="strong-link" href="https://github.com/alloydwhitlock/distracted-work-mozilla-extension/issues" target="_blank">Report a bug or request a feature</a>
</div>
```

To:
```html
<div class="info-box">
  <p>Bugs &amp; Features</p>
  <a class="strong-link" href="opensource.html">Report issues or contribute on GitHub</a>
</div>
```

**Step 3: Verify**

Check `install.html` — should show CTA, how-it-works, features only. Check `contact.html` — should link to open source page.

**Step 4: Commit**

```bash
git add install.html contact.html
git commit -m "refactor: move dev/changelog content from install and contact to open source page"
```

---

### Task 8: Update footer navigation on all pages

**Files:**
- Modify: `index.html`
- Modify: `install.html`
- Modify: `privacy.html`
- Modify: `contact.html`
- Verify: `opensource.html` (already has updated footer from Task 6)

**Step 1: Update footer links**

In each page's `<footer class="site-footer">`, update the navigation links to include "Open Source":

```html
<a href="/">Home</a> &middot;
<a href="install.html">Install</a> &middot;
<a href="opensource.html">Open Source</a> &middot;
<a href="privacy.html">Privacy</a> &middot;
<a href="contact.html">Contact</a> &middot;
```

For `index.html`, the footer is inline-styled with `position: fixed`. Update its links the same way.

**Step 2: Verify**

Click through all pages — footer should show 5 nav links on every page, all working.

**Step 3: Commit**

```bash
git add index.html install.html privacy.html contact.html
git commit -m "feat: add Open Source link to footer navigation on all pages"
```

---

### Task 9: Update sync-changelog script and GitHub Action

**Files:**
- Modify: `scripts/sync-changelog.sh`
- Modify: `.github/workflows/sync-changelog.yml`

**Step 1: Update `sync-changelog.sh`**

Change the target file variable on line 7:

From:
```bash
INSTALL_HTML="$ROOT_DIR/install.html"
```
To:
```bash
TARGET_HTML="$ROOT_DIR/opensource.html"
```

Update all references to `$INSTALL_HTML` in the script to `$TARGET_HTML` (lines 112, 118, 131, 133, 136).

Update the echo on line 112:
```bash
echo "Updating $TARGET_HTML..."
```

**Step 2: Update `.github/workflows/sync-changelog.yml`**

Change the diff check on line 28:

From:
```yaml
if git diff --quiet install.html; then
```
To:
```yaml
if git diff --quiet opensource.html; then
```

Update the PR body (line 44) to reference `opensource.html` instead of `install.html`:
```yaml
Updates the changelog on `opensource.html` with the latest releases from the extension repo.
```

**Step 3: Verify the script runs**

Run: `bash scripts/sync-changelog.sh`

The changelog entries should now appear in `opensource.html` between the markers.

**Step 4: Commit**

```bash
git add scripts/sync-changelog.sh .github/workflows/sync-changelog.yml
git commit -m "chore: update changelog sync to target opensource.html instead of install.html"
```

---

### Task 10: Visual polish — privacy and contact pages

**Files:**
- Modify: `privacy.html`
- Modify: `contact.html`

**Step 1: Wrap privacy content sections in cards**

In `privacy.html`, wrap each content section (after "The Short Version" info-box) in an `info-box` div for consistent card styling:

- Wrap the "Website" section content (h2 + p + ul) — keep the h2 outside, wrap the p + ul in `<div class="info-box">`
- Wrap the "Browser Extension" section content similarly
- Wrap the "Third-Party Services" content
- Wrap the "Data Storage" content
- Leave "Children's Privacy", "Changes to This Policy", and "Contact" as plain text (they're short)

**Step 2: Verify**

Open privacy page — sections should have subtle card backgrounds that adapt to the active theme.

**Step 3: Verify contact page**

Contact page already uses info-boxes. Verify it looks good with theme switching — the email and bugs cards should adapt.

**Step 4: Commit**

```bash
git add privacy.html contact.html
git commit -m "style: add card styling to privacy page content sections"
```

---

### Task 11: Run sync-changelog to populate `opensource.html`

**Files:**
- Verify: `opensource.html` (will be modified by script)

**Step 1: Run the sync script**

```bash
bash scripts/sync-changelog.sh
```

Expected output: "Fetching releases..." followed by "Done. N changelog entries written."

**Step 2: Verify**

Open `opensource.html` — changelog entries should be populated between the markers.

**Step 3: Commit**

```bash
git add opensource.html
git commit -m "chore: populate changelog on open source page via sync script"
```

---

### Task 12: Final verification

**Files:** None (read-only verification)

**Step 1: Full site walkthrough**

Run `python3 -m http.server 4173` and verify:

1. **Landing page (`/`):** Theme switcher FAB visible. Switching themes changes colors. Message cycling still works. Cookie persists across refresh.
2. **Install page (`/install.html`):** Shows CTA, how-it-works, features. No changelog or open source section. Theme applies.
3. **Open Source page (`/opensource.html`):** Shows repos, contributing, clone command, license, changelog. Theme applies.
4. **Privacy page (`/privacy.html`):** Content sections have card styling. Theme applies.
5. **Contact page (`/contact.html`):** Email link works (JS assembly). Links to open source page. Theme applies.
6. **Footer:** All 5 pages show Home | Install | Open Source | Privacy | Contact.
7. **Theme persistence:** Pick a theme on one page, navigate to another — theme persists.
8. **Auto mode:** Set to Auto, change OS dark/light preference — site responds.
9. **Accessibility:** Tab through FAB panel, use Enter/Space to select themes, Escape to close.

**Step 2: Cross-browser check**

Open in Firefox (primary target) and at least one other browser. Verify CSS variables and cookie work.
