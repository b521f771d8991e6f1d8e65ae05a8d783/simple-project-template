# simple-project-template

A cross-platform application built with Expo (React Native) and TypeScript. Deploys to Cloudflare Workers or runs natively on iOS/Android.

Applications based on this template have two modes: **develop** and **build**.

| Mode | Command | Who | What |
|------|---------|-----|------|
| **Develop** | `npm run dev` | Developers | VS Code + Metro dev server with Dream Mode (Claude Code AI). |
| **Build** | `npm run build` | CI / release | Production release builds. Minified output for deployment. |

## Quick Start

```bash
npm install          # install JS dependencies
npm run dev          # start developing
```

## Develop

Local development with Metro hot-reload. Edit files in VS Code, changes appear instantly. Includes **Dream Mode** — click the Dream button in the nav bar to modify the app via Claude Code AI.

```bash
npm run dev
```

To use Dream Mode, set `ANTHROPIC_API_KEY` in `.env` or log in via `claude login`. Dream Mode respects `AGENTS.md` and `.do-not-edit` — all changes are committed via git and can be kept or discarded from the UI.

## Build

Production release builds with `NODE_ENV=production` and minified JS bundles. Dream Mode is disabled.

**Node.js:**
```bash
npm run build
node dist/main.js
```

**Cloudflare Workers:**
```bash
npm run build:worker
```

## Project Structure

```
src/
  app/            # Expo Router screens and layouts
  components/     # Reusable React Native components
  constants/      # Theme colors, config
  hooks/          # Custom React hooks
  lib/            # Shared libraries (version, etc.)
  redux/          # Redux store and slices
  server/         # Server-side code (API routes)
scripts/          # Build and release scripts
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Metro dev server with Dream Mode |
| `npm run build` | Release build for Node.js |
| `npm run build:worker` | Release build for Cloudflare Workers |
| `npm run version` | Print current version (from git tag or commit hash) |
| `npm run tag` | Create a CalVer signed git tag |
| `npm run tag:push` | Create and push a CalVer signed git tag |
| `npm run generate:icons` | Regenerate app icons from `logo.svg` |

## Versioning

Uses CalVer (`yyyy.mm.dd`) with annotated signed git tags as the single source of truth. If the current commit has no tag, the version falls back to the short commit hash with a `-dirty` suffix for uncommitted changes.

## Configuration

All project-wide config lives in `.env`:

| Variable | Purpose |
|----------|---------|
| `PROJECT_NAME` | Used across Expo, CI, and Cloudflare Workers |
| `BACKEND_LISTEN_PORT` | Express server port |
| `BACKEND_LISTEN_HOSTNAME` | Express server bind address |
| `ANTHROPIC_API_KEY` | Required for Dream Mode (Claude Code) |
| `DREAM_MODEL` | Optional model override (e.g. `sonnet`, `opus`) |

## Deployment

Cloudflare Workers are deployed automatically via GitHub Actions on push to any branch. Main branch deploys as the production worker; feature branches get preview workers that are cleaned up on branch deletion.

### Required GitHub Secrets

| Secret | Description | How to get it |
|--------|-------------|---------------|
| `CLOUDFLARE_API_TOKEN` | API token with **Workers Scripts:Edit** permission | Cloudflare dashboard → My Profile → API Tokens → Create Token → use the "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Cloudflare dashboard → any domain → Overview → right sidebar under "API", or the hex string in your dashboard URL: `dash.cloudflare.com/<account-id>` |

Set these in your GitHub repository under Settings → Secrets and variables → Actions → New repository secret.
