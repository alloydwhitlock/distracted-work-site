# Theme System & Page Reorganization Design

**Date:** 2026-02-12
**Status:** Approved

## Overview

Bring the extension's 17-theme system to the marketing site, reorganize scattered dev/open-source content into a dedicated page, slim down the install page, and visually polish all pages for cohesion.

## Theme System Architecture

**Approach:** CSS Variables Mirror — copy the extension's theme definitions and refactor the site's CSS to use the same variables.

### New file: `themes.css`

Contains all 17 theme definitions from the extension (`extension/shared/themes.css`), using the same selector pattern:

- `body.light` / `body.dark` for mode
- `body[data-style="theme-name"]` for style variant

Themes: Classic, New York, Nord, Catppuccin, Tokyo Night, Molokai, Dracula, Solarized, Gruvbox, One Dark, Rose Pine, Synthwave '84, Everforest, Kanagawa, Ayu, Palenight, Horizon.

Each theme defines: `--bg`, `--text`, `--text-muted`, `--card-bg`, `--card-border`, `--accent`, `--accent-hover`, `--input-bg`, `--input-border`, `--divider`.

### Refactored `style.css`

All hardcoded colors replaced with CSS variables:

| Current | Variable |
|---------|----------|
| `#4361ee` (primary blue) | `var(--accent)` |
| `#ff6b35` (orange CTAs) | `var(--cta)` (site-specific, not from extension) |
| `#f8f9fa` (backgrounds) | `var(--bg)` |
| `#333` (text) | `var(--text)` |
| Card/info-box backgrounds | `var(--card-bg)` |
| Borders | `var(--card-border)` |

### New file: `theme-switcher.js`

Shared across all pages:

- On load: reads cookie, applies theme class + `data-style` to `<body>`
- No cookie: defaults to `auto` (OS preference via `prefers-color-scheme`) + `classic` style
- Exposes functions for the floating pill UI
- Cookie: `dw-theme=auto|classic` (pipe-separated mode + style), ~1 year expiry
- No tracking — preference storage only

## Floating Theme Switcher (FAB)

### Position

`position: fixed; bottom: 1.5rem; right: 1.5rem;`

### Collapsed State

Small circular button (~48px) with palette/paint icon (CSS-only or inline SVG). Subtle shadow, uses `var(--accent)` color.

### Expanded State

On click, expands into a compact panel:

- **Top row:** Three mode buttons — Auto / Light / Dark
- **Below:** Grid of 17 color swatches (small circles) showing each theme's `--accent` color
- Hover tooltip shows theme name
- Active theme gets checkmark/ring indicator

### Behavior

- Click swatch: immediately applies theme, sets cookie
- Click outside or Escape: closes panel
- Subtle backdrop/shadow separates panel from page
- CSS `transform` + `opacity` transitions for open/close

### Accessibility

- `aria-label` on FAB button
- `role="radiogroup"` for swatches
- Keyboard navigable (tab + enter/space)

## Page Reorganization

### New page: `opensource.html`

Consolidates all dev/community content:

- **Hero section:** "distracted.work is open source" with GitHub repo links (extension + site)
- **Changelog section:** Moved from `install.html`, keeps `<!-- CHANGELOG_START -->` / `<!-- CHANGELOG_END -->` markers
- **Contributing info:** How to report bugs (GitHub Issues), how to contribute
- **License info:** Project license details

### Updated GitHub Action

`sync-changelog.sh` and `.github/workflows/sync-changelog.yml` updated to target `opensource.html` instead of `install.html`. Same injection markers and format.

### Slimmed `install.html`

Keeps:

- Download hero CTA (orange box, "Install Extension" link)
- "How It Works" steps with screenshots
- Features list (6 features)

Removes:

- Changelog section (moved to `opensource.html`)
- "Open Source" section with GitHub links (moved to `opensource.html`)

### Updated `contact.html`

- Removes GitHub Issues link (now on `opensource.html`)
- Keeps spam-protected email contact and privacy reference
- Adds link to `opensource.html` for bug reports/feature requests

### Updated footer navigation (all pages)

Home | Install | Open Source | Privacy | Contact

## Visual Cohesion

### Consistent page structure

All non-landing pages get:

- Clear hero/header area with title and 1-line description using `var(--accent)`
- Consistent section spacing and typography
- Cards using `var(--card-bg)` and `var(--card-border)`

### Privacy & Contact visual lift

- Card containers around content sections (using existing `.info-box` or similar pattern)
- Privacy: "The Short Version" box keeps prominent styling; detailed sections get card backgrounds
- Contact: email and GitHub links as styled action cards

### Smooth theme transitions

Global CSS transition on `background-color`, `color`, `border-color` (~200ms ease) for polished theme switching.

### No new dependencies

System font stack maintained. No external fonts, libraries, or CDN imports.

## Constraints

- No frameworks, no build step, no external dependencies
- Cookie for preference only — no tracking
- All pages themed including landing page
- Extension theme CSS kept in sync by copying variable definitions
