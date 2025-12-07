# Talabia Admin - Deployment Guide

This project can be deployed to multiple hosting platforms. Choose the guide that matches your hosting provider:

## Quick Reference

| Platform | Command | Documentation |
|----------|---------|---------------|
| **GitHub Pages** | `npm run build:gh-pages` | [DEPLOY.md](DEPLOY.md) |
| **IIS (MonsterASP.NET)** | `npm run build:iis` | [DEPLOY-IIS.md](DEPLOY-IIS.md) |

---

## GitHub Pages Deployment

**Best for:** Free hosting, static sites, portfolios

### Quick Start
```bash
npm run build:gh-pages
git add docs
git commit -m "Deploy to GitHub Pages"
git push origin main
```

**Settings:** Repository → Settings → Pages → Source: `/docs` folder

📖 **Full Guide:** [DEPLOY.md](DEPLOY.md)

---

## IIS Deployment (MonsterASP.NET)

**Best for:** Windows hosting, shared hosting, ASP.NET servers

### Quick Start
```bash
npm run build:iis
```

Then upload all files from `dist/` folder to your web root via FTP.

**Requirements:**
- IIS URL Rewrite Module installed
- Application Pool: "No Managed Code"

📖 **Full Guide:** [DEPLOY-IIS.md](DEPLOY-IIS.md)

---

## Key Differences

### File Structure After Build

**GitHub Pages:**
- Output: `docs/` folder
- Includes: `.nojekyll`, `404.html`
- Base href: `/Talabia-Front-End/`

**IIS (MonsterASP.NET):**
- Output: `dist/` folder
- Includes: `web.config`
- Base href: `/` (root)

### Common Issues

#### GitHub Pages - 404 on Routes
- Missing `404.html` → Run `npm run build:gh-pages`
- Wrong base href → Check it's `/Talabia-Front-End/`

#### IIS - 502.5 Error
- Wrong `web.config` → Use the one from `npm run build:iis`
- Wrong Application Pool → Set to "No Managed Code"

#### IIS - 500.19 Error
- Missing URL Rewrite module → Install from IIS.net
- Contact hosting support if needed

---

## Development

Run locally:
```bash
npm start
```

Build for testing:
```bash
npm run build
```

---

## Need Help?

- **GitHub Pages Issues:** Check [DEPLOY.md](DEPLOY.md)
- **IIS Issues:** Check [DEPLOY-IIS.md](DEPLOY-IIS.md)
- **General Angular:** Check Angular CLI documentation

---

## File Overview

- `DEPLOY.md` - GitHub Pages deployment guide
- `DEPLOY-IIS.md` - IIS/MonsterASP.NET deployment guide
- `deploy-gh-pages.js` - GitHub Pages build script
- `deploy-iis.js` - IIS build script
- `src/web.config` - IIS configuration (auto-included in builds)
