# GitHub Pages Deployment Guide

## Quick Deploy

Run this command to build and prepare for GitHub Pages:

```bash
npm run build:gh-pages
```

Then commit and push:

```bash
git add docs
git commit -m "Deploy to GitHub Pages"
git push origin main
```

## GitHub Pages Settings

Make sure your GitHub Pages is configured correctly:

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select:
   - **Branch**: `main`
   - **Folder**: `/docs`
4. Click **Save**

## What the build script does

The `build:gh-pages` script:
1. Builds your Angular app with production configuration
2. Sets the correct base href (`/Talabia-Front-End/`)
3. Copies files from `docs/browser/` to `docs/` (Angular 18+ outputs to browser subfolder)
4. Creates `404.html` for SPA routing support
5. Creates `.nojekyll` file to ensure GitHub Pages serves all files correctly
6. Cleans up the `browser/` directory

## Manual Build (Alternative)

If you prefer to build manually:

```bash
ng build --configuration production --base-href /Talabia-Front-End/
node deploy-gh-pages.js
```

## Troubleshooting

### 404 Error on Routes
- Make sure `404.html` exists in the `docs/` folder
- Verify the base href is `/Talabia-Front-End/` (with trailing slash)

### Files Not Loading
- Check that `.nojekyll` file exists in `docs/`
- Verify GitHub Pages is set to serve from `/docs` folder

### Changes Not Showing
- GitHub Pages can take 1-5 minutes to update after pushing
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
