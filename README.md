# simple-project-template

A cross-platform application template built with Expo (React Native), TypeScript, and Nix. Deploys to Cloudflare Workers, Docker, or runs natively on iOS/Android.

Application based on this template have two modes: **develop** and **build**.

| Mode | Command | Who | What |
|------|---------|-----|------|
| **Develop** | `npm run dev` | Developers | VS Code + Metro dev server with Dream Mode (Claude Code AI). |
| **Build** | `npm run build` | CI / release | Production release builds. Immutable output for deployment. |

## Quick Start

```bash
nix develop          # enter dev shell (Node, git, etc.)
npm install          # install JS dependencies
npm run dev      # start developing
```

## Develop

Local development with Metro hot-reload. Edit files in VS Code, changes appear instantly. Includes **Dream Mode** — click the Dream button in the nav bar to modify the app via Claude Code AI.

```bash
npm run dev
```

To use Dream Mode, set `ANTHROPIC_API_KEY` in `.env` or log in via `claude login`. Dream Mode respects `AGENTS.md` and `.do-not-edit` — all changes are committed via git and can be kept or discarded from the UI.

## Build

Production release builds with `NODE_ENV=production` and minified JS bundles. Dream Mode is disabled.

**Node.js / Docker:**
```bash
npm run build
node dist/main.js
```

**Cloudflare Workers:**
```bash
npm run build:worker
```

**Via Nix (CI):**
```bash
nix build .                    # Node server + Docker image
nix build .#cloudflare-worker  # Cloudflare Worker artifact
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
  server/         # Server-side code (DB, API routes)
scripts/          # Build and release scripts
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Metro dev server with Dream Mode |
| `npm run build` | Release build for Node.js / Docker |
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
| `PROJECT_NAME` | Used across Nix, Expo, CI, and Cloudflare Workers |
| `BACKEND_LISTEN_PORT` | Express server port |
| `BACKEND_LISTEN_HOSTNAME` | Express server bind address |
| `ANTHROPIC_API_KEY` | Required for Dream Mode (Claude Code) |
| `DREAM_MODEL` | Optional model override (e.g. `sonnet`, `opus`) |

## Deployment

- **Cloudflare Workers**: Triggered by git tag push via GitHub Actions
- **Docker**: Built by Nix, pushed to GHCR with s6 process supervision
- **Native**: Build with `eas build` (Expo Application Services)
