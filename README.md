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

## Native Code Architecture

This project contains native code in two layers:

- **`src-rust/`** — Rust library (`wasm-bindgen` for web, static lib for native targets)
- **`src-native/`** — Objective-C++/C shared library (`core`), built with CMake

The goal is to keep all three compile targets as similar as possible:

| Target | JS Runtime | Native Code |
|--------|-----------|-------------|
| Node.js | Node / Bun | Rust + ObjC++ → Wasm via Emscripten + `wasm-bindgen`, loaded as ES module |
| Cloudflare Workers | V8 isolates | Same `.wasm` bundle as Node, loaded as ES module |
| Desktop (macOS / Windows / Linux) | Node sidecar via Tauri | Rust + ObjC++ as a Node native addon (`.node`) loaded via `require()` |
| Mobile (iOS / Android) | React Native / Hermes | Rust + ObjC++ as an Expo Module via JSI |

### Node.js: Wasm via Emscripten + wasm-bindgen

Node loads Wasm as a standard ES module. The Wasm bundle is built from Rust via `wasm-bindgen` and from ObjC++ via Emscripten:

```bash
npm run build:rust:wasm       # cargo → wasm-bindgen → dist/wasm/
npm run build:rust:wasm:dev   # debug build
```

```bash
emcmake cmake --preset release -B build-wasm
cmake --build build-wasm
```

The `.wasm` + JS glue are imported in `src/server.ts` as a standard ES module.

### Cloudflare Workers: Same Wasm Bundle

Workers run the same `.wasm` built above — no separate compile step. The key differences from Node:

- Workers have no filesystem access; the `.wasm` binary must be imported statically or fetched from a KV/R2 binding
- Workers use the [Wasm imports API](https://developers.cloudflare.com/workers/runtime-apis/webassembly/): `import wasm from './core.wasm'`
- Memory and instantiation are handled per-isolate; keep the module lightweight

### Desktop: Tauri with Node Sidecar + Native Addon

Tauri runs Node as a [sidecar process](https://tauri.app/v1/guides/building/sidecar/). The Node server loads native code as a `.node` addon built with [node-gyp](https://github.com/nodejs/node-gyp) or [napi-rs](https://napi.rs/):

- **Rust** → `napi-rs` crate compiles to a `.node` file loaded via `require('bindings')('...')`
- **ObjC++** → CMake builds `core` as a shared library linked into the `.node` addon

```bash
npm run build:rust:native     # cargo build --release (native target)
```

### Mobile: Expo Module via JSI

Rust and ObjC++ are exposed to React Native as an [Expo Module](https://docs.expo.dev/modules/overview/) using `expo-modules-core`:

**iOS:**
- Rust compiles to a static lib: `cargo build --release --target aarch64-apple-ios` (set `crate-type = ["staticlib"]` in `Cargo.toml`)
- ObjC++ (`src-native/`) is compiled directly by Xcode as part of the module
- A Swift `Module` subclass bridges to ObjC++ via `.mm` files and to Rust via `extern "C"` FFI
- Linked via podspec: `s.vendored_libraries = 'rust/libcore.a'`

**Android:**
- Rust compiles to `.so` via `cargo-ndk`: `cargo ndk -t arm64-v8a build --release`
- ObjC++ is not supported on Android; the C layer (`test.c`) is compiled via the Android NDK CMake integration
- A Kotlin `Module` subclass calls Rust/C functions via JNI (`System.loadLibrary` + `external fun`)

**Module registration** (`expo-module.config.json`):
```json
{
  "platforms": ["ios", "android"],
  "ios": { "modules": ["CoreModule"] },
  "android": { "modules": ["com.project.CoreModule"] }
}
```

JS usage:
```ts
import { requireNativeModule } from 'expo-modules-core'
const Core = requireNativeModule('Core')
```

> For a more ergonomic Rust↔JS bridge without manual JNI boilerplate, consider [uniffi-bindgen-react-native](https://github.com/jhugman/uniffi-bindgen-react-native), which auto-generates TypeScript + JSI C++ from a Rust UDL interface.

## Deployment

Cloudflare Workers are deployed automatically via GitHub Actions on push to any branch. Main branch deploys as the production worker; feature branches get preview workers that are cleaned up on branch deletion.

### Required GitHub Secrets

| Secret | Description | How to get it |
|--------|-------------|---------------|
| `CLOUDFLARE_API_TOKEN` | API token with **Workers Scripts:Edit** permission | Cloudflare dashboard → My Profile → API Tokens → Create Token → use the "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Cloudflare dashboard → any domain → Overview → right sidebar under "API", or the hex string in your dashboard URL: `dash.cloudflare.com/<account-id>` |

Set these in your GitHub repository under Settings → Secrets and variables → Actions → New repository secret.
