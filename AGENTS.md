# General

## Code Quality

Produce code that is **fast, portable, secure, and reliable**:

- **Fast**: avoid unnecessary work — no redundant re-renders, no blocking the event loop, no O(n^2) where O(n) is possible.
- **Portable**: do not rely on platform-specific behavior, environment-specific paths, or undocumented runtime quirks. Code must work identically across all deployment targets (web, Cloudflare Workers, native mobile).
- **Secure**: validate all external input, never expose secrets, avoid injection vectors (XSS, command injection, etc.), follow least-privilege principles.
- **Reliable**: handle errors explicitly, avoid silent failures, write deterministic logic, and test edge cases.

**flake.nix is managed by the project owner.** AI agents may propose changes to [flake.nix](flake.nix) (including adding packages), but must present the full proposed diff to the user and receive explicit approval **before** making any edits. Do not silently modify the flake. This applies to every kind of change: adding packages, modifying derivations, updating inputs, or anything else.

Do not attempt to install system tools via apt, brew, `cargo install`, `npm install -g`, pip, or any other package manager outside of Nix.

For tools needed at runtime, prefer adding them as TypeScript modules (regular `dependencies`, not `devDependencies`) in [package.json](package.json).

## Build Scripts ([package.json](package.json))

All build orchestration uses npm scripts defined in [package.json](package.json).

### Compile targets (individual steps)

| Script | Purpose |
|---|---|
| `compile:wasm` | Cargo WASM build (release) + wasm-bindgen output to `src/wasm/` |
| `compile:wasm:dev` | Cargo WASM build (debug, faster) + wasm-bindgen output to `src/wasm/` |
| `compile:web` | Expo static web export to `dist/` |
| `compile:server` | esbuild server bundle, minified (`dist/main.js`) |
| `compile:server:dev` | esbuild server bundle, with sourcemaps (`dist/main.js`) |
| `compile:worker` | esbuild CF Worker bundle, minified (`dist/worker.js`) |
| `compile:worker:dev` | esbuild CF Worker bundle, with sourcemaps (`dist/worker.js`) |

### Build targets (full pipelines)

| Script | Purpose |
|---|---|
| `build:node` | Release: wasm → web → server (for Node.js/Docker deployment) |
| `build:node:dev` | Dev: debug wasm → web → server with sourcemaps |
| `build:cloudflare-worker` | Release: wasm → web → worker (for Cloudflare Workers deployment) |
| `build:cloudflare-worker:dev` | Dev: debug wasm → web → worker with sourcemaps |

The **Rapid Deploy** workflow uses `:dev` targets (debug cargo, sourcemaps, no minification). The **Nix Flake** workflow uses release targets (optimized cargo, minified output).

### Dev & lint

| Script | Purpose |
|---|---|
| `dev:web` | Start Expo dev server for web |
| `dev:android` | Start Expo dev server for Android |
| `dev:ios` | Start Expo dev server for iOS |
| `lint` | Lint TypeScript (Expo) + Rust (`cargo check`) |

## UI Design Principles

The UI follows Apple's Human Interface Guidelines in spirit: **simple, focused, and content-first**. Every screen should feel like it could ship as a native iOS app.

### Core philosophy

- **Remove, don't add.** If a screen feels incomplete, the answer is rarely "add more UI." Strip away until only the essential remains.
- **Content is the interface.** Text, images, and data are the design — chrome (toolbars, borders, containers) should be nearly invisible.
- **One primary action per screen.** Every screen should have a clear purpose. If the user has to think about what to do next, the design has failed.

### Layout

- **Generous whitespace** — minimum `p-4` (16px) padding on screen edges, `gap-4` between sections. Never cram elements together.
- **Single column on mobile** — do not attempt multi-column layouts on screens narrower than 768px. Stack vertically.
- **Max content width on desktop** — constrain body content to `max-w-lg` (512px) or `max-w-xl` (576px) for readability. Center on wide screens.
- **Safe areas** — always wrap root layouts with `SafeAreaView`. Never let content bleed behind the status bar or home indicator.
- **Consistent spacing scale** — use Tailwind's 4px grid: `p-2`, `p-4`, `p-6`, `p-8`. Avoid arbitrary values.

### Color

- **Solid backgrounds only** — use `bg-white` / `bg-black` (light/dark mode) or `bg-gray-50` for subtle section differentiation. Never use transparency (`bg-white/80`, `bg-black/50`, etc.).
- **No blur or glassmorphism** — no `backdrop-blur`, no frosted glass effects. They are expensive to render and inconsistent across platforms.
- **One accent color** — pick a single brand color for interactive elements (buttons, links, active states). Use it sparingly.
- **Gray palette for text hierarchy** — `text-gray-900` for primary text, `text-gray-500` for secondary, `text-gray-400` for hints/placeholders. In dark mode, invert accordingly.
- **No gradients** on backgrounds or buttons. Flat, solid fills only.

### Typography

- **System font only** — do not load custom fonts. Use the platform default (San Francisco on iOS, Roboto on Android, system-ui on web).
- **3 sizes maximum** — title (`text-2xl font-bold`), body (`text-base`), caption (`text-sm text-gray-500`). Avoid intermediate sizes.
- **Left-aligned text** — do not center body text. Center only single-line headings or empty-state messages.
- **No ALL CAPS** for body text or buttons. Use sentence case everywhere.

### Components

- **Buttons** — solid background, rounded corners (`rounded-xl`), generous padding (`px-6 py-3`). No outlines, no ghost buttons for primary actions. Use `<Pressable>` with `opacity` feedback.
- **Cards** — simple `bg-white rounded-2xl p-4` with `shadow-sm` at most. No borders unless separating items in a list. No heavy drop shadows.
- **Lists** — use `FlatList` or `ScrollView`. Separate items with thin borders (`border-b border-gray-100`) or spacing (`gap-2`), not cards-within-cards.
- **Inputs** — full width, `bg-gray-100 rounded-xl px-4 py-3`. No visible borders on unfocused state. Subtle border on focus (`border-blue-500`).
- **Icons** — use `@expo/vector-icons` only. Keep icons small (`size={20}`). Do not use icons as decoration — only for wayfinding and actions.
- **Empty states** — centered icon + short message + single action button. No walls of text explaining what to do.

### Interaction

- **Press feedback** — use `opacity: 0.7` on press via Pressable's `style` callback or NativeWind's `active:opacity-70`. No color changes, no scale transforms.
- **No heavy animations** — avoid `Animated`, `Reanimated`, or spring physics for standard UI transitions. Use the platform defaults (Expo Router handles screen transitions).
- **Loading states** — use a simple `ActivityIndicator` centered on screen. No skeleton screens, no shimmer effects, no progress bars unless the operation genuinely takes >3 seconds.
- **Haptic feedback** — use `expo-haptics` for destructive actions and confirmations only. Do not add haptics to every tap.

### Dark mode

- Support both light and dark mode using `useColorScheme()`.
- Light mode: `bg-white` backgrounds, `text-gray-900` text.
- Dark mode: `bg-black` or `bg-gray-950` backgrounds, `text-white` or `text-gray-100` text.
- Do not use `bg-gray-800` or mid-grays for dark mode backgrounds — go fully dark.
- Accent color should remain the same in both modes.

### Cross-platform consistency

The app must be readable and usable across **web** (desktop + mobile browsers), **iOS**, and **Android**:

- Test layouts at 375px (iPhone SE), 390px (iPhone 15), 768px (tablet), and 1280px+ (desktop).
- Do not assume a fixed screen size. Use `flex-1` and percentage-based layouts, not fixed pixel heights.
- On web, ensure tap targets are at least 44x44px (Apple's minimum) even though web doesn't enforce this.
- Prefer `ScrollView` over fixed-height containers — content should scroll naturally on small screens.

## React Native — No Plain HTML

This is a **React Native / Expo** app. The frontend must be written exclusively using React Native primitives and the libraries already installed.

- **Never** use HTML elements (`<div>`, `<span>`, `<p>`, `<button>`, etc.) or the DOM API (`document`, `window`, `getElementById`, etc.) in frontend code.
- Use React Native equivalents: `<View>`, `<Text>`, `<Pressable>`, `<ScrollView>`, `<Image>`, etc.
- `react-native-web` is included solely to enable `expo export --platform web` — it does not make HTML authoring acceptable.

## Styling

All UI styling uses **NativeWind**, which is already installed (`nativewind` ^4.2.1 in [package.json](package.json)).

- Apply styles exclusively through Tailwind utility classes on the `className` prop.
- **Never** use `StyleSheet.create()` or inline `style` objects — use `className` instead.
- Prefer solid background colors (`bg-white`, `bg-gray-50`, `bg-black`) over transparent variants (`bg-white/50`, `bg-black/30`).
- Use the system color palette — stick to neutral grays for backgrounds, a single accent color for actions.
- VSCode Tailwind IntelliSense (`bradlc.vscode-tailwindcss`) is pre-installed and configured.

## Language Selection

**Default to TypeScript** for all new code unless there is a clear performance reason not to.

Use **Rust** only when:
- CPU-bound work would be a bottleneck in TypeScript (e.g. encoding, parsing, crypto, heavy computation)
- You need deterministic low-latency execution
- The logic will be compiled to WASM and called from the frontend

When in doubt, write TypeScript first. Optimize to Rust only if profiling shows it is necessary.

## Project Structure

- [src-rust/](src-rust/) — Rust library compiled to cdylib/wasm via wasm-bindgen
- [src/](src/) — TypeScript source (Expo/React Native frontend + Express backend)
- [src/app/](src/app/) — Expo Router screens (file-based routing)
- [src/components/](src/components/) — Shared React Native components
- [src/constants/](src/constants/) — Theme, colors, layout constants
- [src/hooks/](src/hooks/) — Custom React hooks
- [src/redux/](src/redux/) — Redux Toolkit state
- [src/server/](src/server/) — Express API routes
- [src/server.ts](src/server.ts) — Express entry point (bundled to `dist/main.js`)
- [src/worker.ts](src/worker.ts) — Cloudflare Worker entry point (bundled to `dist/worker.js`)
- [src/wasm/](src/wasm/) — Generated WASM bindings (do not edit manually)
- [Cargo.toml](Cargo.toml) — Rust package definition
- [package.json](package.json) — npm scripts and dependencies
- [flake.nix](flake.nix) — Nix build environment (do not modify without approval)

## Do Not Modify Without Approval

These files are either generated or carefully tuned:

- [flake.nix](flake.nix) — Nix environment, all system deps live here. **Propose any change to the user first and wait for explicit approval before editing** (see [General](#general)).
- [flake.lock](flake.lock) — Nix lockfile, updated only by `nix flake update`. Do not edit manually.
- [Cargo.lock](Cargo.lock) — Rust lockfile, must stay in sync with the Nix build. Do not edit manually.

## Dependency Management

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

## Deployment Contexts

This app has two deployment contexts. Use the right APIs for each:

| Context | Entry point | Available APIs |
|---|---|---|
| **Express server** | [src/server.ts](src/server.ts) → `dist/main.js` | Full Node.js, no DOM |
| **Cloudflare Worker** | [src/worker.ts](src/worker.ts) → `dist/worker.js` | Workers runtime, no Node.js `fs`/`child_process` |
| **Expo frontend** | [src/app/](src/app/) | React Native / browser APIs only — no server-side modules |

Cross-context communication must go through the Express HTTP API — do not import server-side modules into frontend code.

## CI/CD Workflows

Two workflows handle builds and deployment:

| Workflow | File | Purpose |
|---|---|---|
| **Rapid Deploy** | [rapid-deploy.yml](.github/workflows/rapid-deploy.yml) | Fast, non-reproducible Docker/bun build for dev branches. Deploys to CF Workers in ~1 min. |
| **Nix Flake** | [nix-flake.yml](.github/workflows/nix-flake.yml) | Reproducible Nix builds for beta/stable. Multi-platform smoke tests + Docker image + CF deploy. |

Rapid Deploy runs on all branches except `beta` and `stable`. Nix Flake runs on all configured branches for reproducible builds.

## Build Verification

Always run lint before finishing a task:

```
npm run lint
```

To verify the full reproducible build locally:

```
nix flake check
```

## Git Conventions

- **All commits must be signed** (GPG or SSH). Use `git commit -S` or configure `commit.gpgsign = true`.
- **Do not add `Co-authored-by: Claude` (or any AI co-author) trailers** to commit messages.

## Testing

Write tests for each action you implement:
- **Rust (WASM)**: add `#[wasm_bindgen_test]` in [src-rust/](src-rust/)
- **TypeScript**: add Jest tests in [src/__tests__/](src/__tests__/)
