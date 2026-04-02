# simple-project-template

A cross-platform application template built with Expo (React Native), Rust/WASM, and Nix. Deploys to Cloudflare Workers, Docker, or runs natively on iOS/Android.

Application based on this template have three modes: **develop → dream → build**.

| Mode | Command | Who | What |
|------|---------|-----|------|
| **Develop** | `npm run develop` | Developers | VS Code + Metro dev server. Debug builds. Edit code directly. |
| **Dream** | `npm run dream` | Privileged users | Users modify the running app via Claude Code in the browser. |
| **Build** | `npm run build` | CI / release | Production release builds. Immutable output for deployment. |

## Quick Start

```bash
nix develop          # enter dev shell (Rust, Node, wasm-pack, etc.)
npm install          # install JS dependencies
npm run develop      # start developing
```

## Develop

Local development with Metro hot-reload. Edit files in VS Code, changes appear instantly. Bacon watches Rust source in the background and rebuilds WASM on changes.

```bash
npm run develop
```

## Dream

Hand this mode to privileged users who can adapt the application on their own. A **Dream** button appears in the nav bar — they describe changes in natural language and Claude Code modifies the app in real-time.

```bash
ANTHROPIC_API_KEY=sk-ant-... npm run dream
```

How it works:

1. User clicks Dream in the nav bar and types a prompt
2. The server runs `npx claude --print --dangerously-skip-permissions` in the project directory
3. Claude Code reads files, makes edits, respects `.do-not-edit`
4. The app reloads with the changes

### Safety

- Claude Code natively respects `AGENTS.md` and `.do-not-edit` conventions
- Protected files are listed in `.do-not-edit`
- The server enforces `APP_MODE` — Dream API is only available when `APP_MODE=dream`
- All Dream changes are local and uncommitted — use `git diff` to review, `git checkout .` to revert

## Build

Production release builds with `NODE_ENV=production`, release Rust (WASM), and minified JS bundles.

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
  lib/            # Platform libraries (Rust interop, version)
  redux/          # Redux store and slices
  server/         # Server-side code (DB, API routes)
  wasm/           # Generated WASM bindings (gitignored)
src-rust/         # Rust source (lib.rs + bin/)
scripts/          # Build and release scripts
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run develop` | Debug WASM + bacon watch + Metro dev server |
| `npm run dream` | Debug build + Node server with Dream Mode |
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
