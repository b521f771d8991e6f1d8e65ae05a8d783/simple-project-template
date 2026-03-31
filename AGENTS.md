# General

## Code Quality

Produce code that is **fast, portable, secure, and reliable**:

- **Fast**: avoid unnecessary work — no redundant re-renders, no blocking the event loop, no O(n²) where O(n) is possible.
- **Portable**: do not rely on platform-specific behavior, environment-specific paths, or undocumented runtime quirks. Code must work identically across all deployment targets (web, Cloudflare Workers, Electron).
- **Secure**: validate all external input, never expose secrets, avoid injection vectors (XSS, command injection, etc.), follow least-privilege principles.
- **Reliable**: handle errors explicitly, avoid silent failures, write deterministic logic, and test edge cases.

**flake.nix is managed by the project owner.** AI agents may propose changes to [flake.nix](flake.nix) (including adding packages), but must present the full proposed diff to the user and receive explicit approval **before** making any edits. Do not silently modify the flake. This applies to every kind of change: adding packages, modifying derivations, updating inputs, or anything else.

Do not attempt to install system tools via apt, brew, `cargo install`, `npm install -g`, pip, or any other package manager outside of Nix.

For tools needed at runtime, prefer adding them as TypeScript modules (regular `dependencies`, not `devDependencies`) in [package.json](package.json).

## Build Scripts ([package.json](package.json))

All build orchestration uses npm scripts defined in [package.json](package.json).

| Script | Purpose |
|---|---|
| `npm run dev:web` | Start Expo dev server for web |
| `npm run dev:android` | Start Expo dev server for Android |
| `npm run dev:ios` | Start Expo dev server for iOS |
| `npm run build:web` | Full web build (Expo export + server + worker bundles) |
| `npm run build:server` | esbuild server bundle (`dist/main.js`) |
| `npm run build:worker` | esbuild worker bundle (`dist/worker.js`) |
| `npm run lint` | Lint TypeScript via Expo lint |

## React Native — No Plain HTML

This is a **React Native / Expo** app. The frontend must be written exclusively using React Native primitives and the libraries already installed.

- **Never** use HTML elements (`<div>`, `<span>`, `<p>`, `<button>`, etc.) or the DOM API (`document`, `window`, `getElementById`, etc.) in frontend code.
- Use React Native equivalents: `<View>`, `<Text>`, `<Pressable>`, `<ScrollView>`, `<Image>`, etc.
- `react-native-web` is included solely to enable `expo export --platform web` — it does not make HTML authoring acceptable.

## Styling

All UI styling uses **NativeWind**, which is already installed (`nativewind` ^4.2.1 in [package.json](package.json)).

- Apply styles exclusively through Tailwind utility classes on the `className` prop.
- **Never** use `StyleSheet.create()` or inline `style` objects — use `className` instead.
- The NativeWind type shim is at [typescript/nativewind-env.d.ts](typescript/nativewind-env.d.ts).
- VSCode Tailwind IntelliSense (`bradlc.vscode-tailwindcss`) is pre-installed and configured.
- For custom design tokens (colors, spacing, etc.) extend [typescript/src/constants/theme.ts](typescript/src/constants/theme.ts) and the Tailwind config — do not hardcode values in components.

## Language Selection

**Default to TypeScript** for all new code unless there is a clear performance reason not to.

Use **Rust** only when:
- CPU-bound work would be a bottleneck in TypeScript (e.g. encoding, parsing, crypto, heavy computation)
- You need deterministic low-latency execution
- The logic will be compiled to WASM and called from the frontend

When in doubt, write TypeScript first. Optimize to Rust only if profiling shows it is necessary.

## Project Structure

- [rust/](rust/) — Rust library compiled to cdylib/wasm via wasm-pack
- [src/](src/) — TypeScript source (Expo/React Native frontend + Express backend)
- [Cargo.toml](Cargo.toml) — Rust package definition
- [package.json](package.json) — npm scripts and dependencies
- [flake.nix](flake.nix) — Nix build environment (do not modify)

## Do Not Modify Without Approval

These files are either generated or carefully tuned:

- [flake.nix](flake.nix) — Nix environment, all system deps live here. **Propose any change to the user first and wait for explicit approval before editing** (see [General](#general)).
- [flake.lock](flake.lock) — Nix lockfile, updated only by `nix flake update`. Do not edit manually.
- [Cargo.lock](Cargo.lock) — Rust lockfile, must stay in sync with the Nix build. Do not edit manually.

## TypeScript Source Layout

All TypeScript source lives under [src/](src/):

- [src/app/](src/app/) — Expo Router screens (file-based routing)
- [src/server/](src/server/) — Express API routes
- [src/server.ts](src/server.ts) — Express entry point (bundled to `dist/main.js` by esbuild)
- [src/redux/](src/redux/) — Redux Toolkit state
- [src/components/](src/components/) — Shared React Native components

### Dependency Management

**Never use `devDependencies` in [package.json](package.json).** All dependencies — whether runtime or build-time — must be added to `dependencies`. This ensures:
- Clear visibility of what the project needs
- Consistent behavior across all environments (dev, CI, production)
- No hidden dependencies that might break in edge cases

**Before adding any new dependency:**

1. Check whether the functionality is already covered by a package that is **already installed**. Review [package.json](package.json) (TypeScript/React Native), [Cargo.toml](Cargo.toml) (Rust), and [flake.nix](flake.nix) (system tools) before reaching for something new.
2. If a new dependency is genuinely needed, it must meet **all** of the following criteria before being added:
   - Widely adopted and actively maintained (significant download counts, recent releases, responsive maintainers)
   - Published by a trusted, identifiable publisher on an official registry: [npmjs.com](https://npmjs.com) (TypeScript), [crates.io](https://crates.io) (Rust), or [nixpkgs](https://search.nixos.org/packages) (system)
   - Has a clear open-source license compatible with the project
3. For system-level tools (anything that would go in `flake.nix`): propose the addition to the user for approval before modifying the flake (see [General](#general) above).

## Electron / Expo Architecture

This app has three contexts. Use the right APIs for each:

| Context | Entry point | Available APIs |
|---|---|---|
| **Electron main** | [src/electron.ts](src/electron.ts) → `dist/electron.js` | Full Node.js + Electron APIs (`app`, `BrowserWindow`, …) |
| **Express server** | [src/server.ts](src/server.ts) → `dist/main.js` | Full Node.js, no DOM, no Electron renderer APIs |
| **Expo frontend** | [src/app/](src/app/) | React Native / browser APIs only — no `fs`, no `child_process` |

The Electron main process ([src/electron.ts](src/electron.ts)) starts Express in-process (using `DISABLE_CLUSTER=1`), waits for it to be ready, then opens a `BrowserWindow` at `http://127.0.0.1:{port}/internal`. The `/internal` route is the embedded app view.

Cross-context communication must go through the Express HTTP API or Electron IPC — do not import server-side modules into frontend code.

## Build Verification

**`nix flake check` must pass before every commit** — this is enforced by the pre-commit hook (see [Pre-commit Hook](#pre-commit-hook) below).

`nix flake check` builds **all** packages (`web-app`, `web-app-debug`, `electron-app`, `docker-image`, `docker-image-debug`) in a clean, reproducible Nix sandbox. It is the authoritative gate — it catches issues that local incremental builds miss.

Always run it before finishing a task:

```
nix flake check
```

To diagnose a failing target in isolation, use `nix build`:

```
nix build .#web-app       # wasm/emscripten/TypeScript web code
nix build .#electron-app  # Electron shell or web-app output
```

## Git Conventions

- **All commits must be signed** (GPG or SSH). Use `git commit -S` or configure `commit.gpgsign = true`.
- **Do not add `Co-authored-by: Claude` (or any AI co-author) trailers** to commit messages.

## Pre-commit Hook

A shared pre-commit hook enforces that `nix flake check` passes before every commit. The hook is managed by [Husky](https://typicode.github.io/husky/) and lives in [.husky/pre-commit](.husky/pre-commit).

**Setup** (run once after cloning):
```
npm install
```

This installs npm dependencies and initializes Husky hooks. The pre-commit hook will automatically run before every commit and block any commit where `nix flake check` fails, with helpful output directing you to the failing target.

To bypass the hook in an emergency (not recommended), use:
```
git commit --no-verify
```

However, commits that fail the build will be caught at push time and should not be merged to main.

Additionally, before finishing any task, run:
```
npx prettier --write .
npm run lint
```

## Localization (l10n)

All user-visible strings must be translated. When adding any new string to the frontend:

1. Add the key to **every** locale file in [typescript/src/i18n/locales/](typescript/src/i18n/locales/).
2. Never hardcode a display string in a component — always use `t("key")` from `react-i18next`.

The supported locales are:

| File | Language |
|---|---|
| `en.json` | English |
| `de.json` | German |
| `fr.json` | French |
| `es.json` | Spanish |
| `pt.json` | Portuguese |
| `ru.json` | Russian |
| `ar.json` | Arabic |
| `zh.json` | Chinese |
| `he.json` | Hebrew |
| `la.json` | Latin |

If you add a new language, register it in [typescript/src/i18n/index.ts](typescript/src/i18n/index.ts).

## Testing

Write tests for each action you implement:
- **Rust (WASM)**: add `#[wasm_bindgen_test]` in [rust/](rust/)
- **TypeScript**: add Jest tests in [src/\_\_tests\_\_/](src/__tests__/)