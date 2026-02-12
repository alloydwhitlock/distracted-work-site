# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static marketing/landing site for the [distracted.work](https://distracted.work) Firefox extension. Pure HTML, CSS, and vanilla JavaScript — no frameworks, no build step, no external dependencies.

## Development

**Local server:**
```bash
python3 -m http.server 4173
```
Then visit http://127.0.0.1:4173

There is no build, lint, or test command. Changes are deployed as-is.

**Deployment:** Automatic via GitHub Actions (`.github/workflows/deploy.yml`) on push to `main`. The repository root is served directly by GitHub Pages.

## Architecture

Four static HTML pages sharing one stylesheet (`style.css`):

- **index.html** — Main landing page with randomized motivational messages. JavaScript cycles through 42 messages with a fade-in animation.
- **install.html** — Extension marketing page with feature list, screenshots, how-it-works steps, and changelog.
- **privacy.html** — Privacy policy (static content).
- **contact.html** — Support page with a spam-protected email link (assembled via JS).

All pages share a common footer with navigation links. Images live in `images/`.

## Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `chore:`, `style:`, `refactor:`
- **Branch naming:** Matches commit type — `feat/`, `fix/`, `docs/`, `chore/`, `style/`, `refactor/`
- **Workflow:** All changes go through pull requests to `main`
- **No external dependencies:** No npm, no CDN imports, no analytics/tracking
- **CSS classes:** `.btn-*` for buttons, `.page` for content containers, `.download-hero` for CTAs, `.media-frame` for screenshots, `.steps` for numbered lists
- **Colors:** Blue `#4361ee` (primary buttons), Orange `#ff6b35` (extension/download CTAs), Light gray `#f8f9fa` (backgrounds)
