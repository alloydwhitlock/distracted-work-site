# distracted.work

Landing site for **distracted.work** and the Distracted Work Firefox extension.

This repository contains a static website (HTML + CSS) deployed to GitHub Pages.

## What this site includes

- `index.html`: motivational "get back to work" page with randomized messages
- `install.html`: extension install/features/changelog page
- `privacy.html`: privacy policy
- `contact.html`: support contact page
- `style.css`: shared styles
- `images/`: screenshots and branding assets used by the pages
- `.github/workflows/deploy.yml`: GitHub Pages deployment workflow

## Local development

No build step is required.

1. From the repo root, start a static server:
   ```bash
   python3 -m http.server 4173
   ```
2. Open [http://127.0.0.1:4173](http://127.0.0.1:4173).

You can also open `index.html` directly in a browser, but using a local server is recommended.

## Deployment

Deployments run automatically via GitHub Actions when changes are pushed to `main`:

- Workflow: `.github/workflows/deploy.yml`
- Target: GitHub Pages
- Artifact path: repository root (`.`)

`CNAME` is included for the custom domain configuration.

## Related project

Firefox extension source:

- [alloydwhitlock/distracted-work-mozilla-extension](https://github.com/alloydwhitlock/distracted-work-mozilla-extension)

## Contributing

1. Create a branch.
2. Make your HTML/CSS/content changes.
3. Validate pages locally.
4. Open a pull request.
