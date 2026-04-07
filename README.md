# simple-project-template

A cross-platform application built with Expo (React Native) and TypeScript. Runs on Node.js, Cloudflare Workers, and as a Tauri desktop app. Deploys automatically via GitHub Actions using a reproducible Nix Flake build.

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

### Web / Node.js + Cloudflare Workers

Builds the Expo web frontend, Wasm native modules (Rust + ObjC++ via Emscripten), Node.js server, and Cloudflare Worker bundle.

```bash
npm run build:web
```

Steps:
1. `compile:native:wasm` — CMake + Emscripten → `dist/libcore.a`
2. `compile:rust:wasm` — wasm-pack → `dist/rust/`
3. `compile:web` — Expo export → `dist/` (web frontend)
4. `compile:server` — esbuild → `dist/main.js` (Node.js server)
5. `compile:worker` — esbuild → `dist/worker.js` (Cloudflare Worker)

Run the Node.js server:
```bash
node dist/main.js
```

Deploy to Cloudflare Workers:
```bash
npx wrangler deploy --name "$PROJECT_NAME"
```

### Desktop (Tauri)

Builds a Tauri desktop app with the Expo web frontend and a Node.js SEA sidecar server.

```bash
npm run build:tauri
```

Steps:
1. `compile:native:native` — CMake → native `libcore` shared library
2. `compile:rust:native` — `cargo build --release` → native Rust library (napi-rs `.node` addon)
3. `compile:web` — Expo export → `dist/` (web frontend served by Tauri WebView)
4. `compile:server:sea` — builds the Node.js SEA server binary:
   - esbuild bundles `src/server.ts` → `dist/main.js`
   - `node --experimental-sea-config sea-config.json` generates `dist/sea-prep.blob`
   - Copies the Node.js binary to `binaries/server`
   - `postject` injects the blob (`NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2` sentinel)
5. `cargo tauri build` — bundles everything into a desktop app (AppImage on Linux, `.app`/DMG on macOS)

The SEA sidecar means no Node.js installation is required on the user's machine.

### Nix (Reproducible)

All targets are also available as reproducible Nix builds:

```bash
nix build .#default    # web + Node.js server
nix build .#tauri-app  # Tauri desktop app
nix build .#docker     # Docker image
nix run .#rust-hello_world
```

CI builds all targets on `ubuntu-24.04`, `ubuntu-24.04-arm`, and `macos-15` via GitHub Actions.

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
src-rust/
  lib.rs          # Rust library (wasm-bindgen + napi-rs)
  bin/
    hello_world/  # Example native binary
    tauri-app/    # Tauri desktop app entry point
src-native/
  test.h          # C header
  test.mm         # ObjC++ implementation
  test.test.c++   # Boost.Test unit tests
src-tauri/        # Tauri icons and resources
scripts/          # Build and release scripts
tauri.conf.json   # Tauri app configuration
sea-config.json   # Node.js SEA configuration
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Metro dev server with Dream Mode |
| `npm run build:web` | Release build for Node.js + Cloudflare Workers |
| `npm run build:tauri` | Release build for Tauri desktop app |
| `npm run test` | Run all tests (CMake ctest + cargo test + jest) |
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

## Native Code Architecture

This project contains native code in two layers:

- **`src-rust/`** — Rust library (`wasm-bindgen` for Wasm, `napi-rs` for native `.node` addon)
- **`src-native/`** — Objective-C++/C shared library (`core`), built with CMake

| Target | JS Runtime | Native Code |
|--------|-----------|-------------|
| Node.js / Cloudflare Workers | Node / V8 isolates | Rust + ObjC++ → Wasm via Emscripten + `wasm-bindgen`, loaded as ES module |
| Desktop (Tauri) | Node SEA sidecar | Rust → `napi-rs` `.node` addon; ObjC++ → shared lib linked in |
| Mobile (iOS / Android) | React Native / Hermes | Rust + ObjC++ as an Expo Module via JSI |

### Node.js / Cloudflare Workers: Wasm

ObjC++ compiled to Wasm via Emscripten; Rust compiled to Wasm via `wasm-pack`. Both loaded as ES modules.

### Desktop: Tauri + Node.js SEA Sidecar

Tauri provides the WebView shell and bundles a [Node.js Single Executable Application](https://nodejs.org/api/single-executable-applications.html) as a sidecar. The SEA embeds the esbuild-bundled server and loads native code via a `napi-rs` `.node` addon.

### Mobile: Expo Module via JSI

**iOS:** Rust → static lib (`aarch64-apple-ios`), ObjC++ compiled by Xcode, bridged via Swift.

**Android:** Rust → `.so` via `cargo-ndk`, C layer via Android NDK CMake, bridged via Kotlin/JNI.

## Deployment

Cloudflare Workers are deployed automatically via GitHub Actions (`ci.yml`) on every push. Main branch deploys to production; other branches get preview deployments. The Docker image is pushed to GHCR on every Linux build.

### Required GitHub Secrets

| Secret | Description | How to get it |
|--------|-------------|---------------|
| `CLOUDFLARE_API_TOKEN` | API token with **Workers Scripts:Edit** permission | Cloudflare dashboard → My Profile → API Tokens → Create Token → use the "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Cloudflare dashboard → any domain → Overview → right sidebar under "API", or the hex string in your dashboard URL: `dash.cloudflare.com/<account-id>` |

Set these in your GitHub repository under Settings → Secrets and variables → Actions → New repository secret.
