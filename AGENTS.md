# Guiding Principles

Produce code that is **simple, fast, portable, secure, and reliable**:

- **Simple**: every decision — architecture, UI, code, dependencies — must favor the simplest option that works. Fewer moving parts means fewer bugs, faster iteration, and easier onboarding. Prefer fewer files, fewer abstractions, fewer layers. A 10-line function is better than a 3-file abstraction hierarchy. Don't build for hypothetical futures — build for today.
- **Fast**: no unnecessary work — no redundant re-renders, no blocking the event loop.
- **Portable**: works identically across web, Cloudflare Workers, and native mobile.
- **Secure**: validate external input, never expose secrets, avoid injection vectors.
- **Reliable**: handle errors explicitly, no silent failures.

# Nix & System Dependencies

**[flake.nix](flake.nix) is managed by the project owner.** Propose any changes as a diff and wait for explicit approval before editing. This applies to all changes: packages, derivations, inputs, everything.

Do not install system tools via apt, brew, cargo install, npm install -g, pip, or any package manager outside Nix. For runtime tools, add them as `dependencies` (not `devDependencies`) in [package.json](package.json).

# Build Scripts ([package.json](package.json))

All build orchestration uses npm scripts.

### Compile targets

| Script | Purpose |
|---|---|
| `compile:wasm` / `compile:wasm:dev` | Cargo WASM build (release/debug) + wasm-bindgen → `src/wasm/` |
| `compile:web` | Expo static web export → `dist/` |
| `compile:server` / `compile:server:dev` | esbuild server bundle → `dist/main.js` |
| `compile:worker` / `compile:worker:dev` | esbuild CF Worker bundle → `dist/worker.js` |

### Build pipelines

| Script | Purpose |
|---|---|
| `build:node` / `build:node:dev` | wasm → web → server (Node.js/Docker) |
| `build:cloudflare-worker` / `build:cloudflare-worker:dev` | wasm → web → worker (Cloudflare) |

`:dev` targets use debug cargo + sourcemaps. Release targets are optimized + minified.

### Dev & lint

| Script | Purpose |
|---|---|
| `dev:web` / `dev:android` / `dev:ios` | Expo dev servers |
| `lint` | TypeScript lint + `cargo check` |

# UI Design

The UI follows one rule: **if it doesn't need to be there, remove it.** Every screen should feel like a native iOS app — simple, focused, content-first.

### Principles

- **One primary action per screen.** If the user has to think about what to do, the design failed.
- **Content is the interface.** Chrome (toolbars, borders, containers) should be nearly invisible.
- **No decoration.** No gradients, no glassmorphism, no blur, no heavy shadows, no shimmer effects.

### Layout

- Generous whitespace: minimum `p-4` padding, `gap-4` between sections.
- Single column on mobile (<768px). Max `max-w-lg`/`max-w-xl` on desktop.
- Always use `SafeAreaView`. Use `flex-1` and percentage layouts, not fixed pixel heights.
- Consistent spacing: Tailwind's 4px grid (`p-2`, `p-4`, `p-6`, `p-8`).

### Color & Typography

- Solid backgrounds only: `bg-white`/`bg-black` (light/dark), `bg-gray-50` for sections. No transparency.
- One accent color for interactive elements, used sparingly.
- Text hierarchy: `text-gray-900` primary, `text-gray-500` secondary, `text-gray-400` hints.
- System font only. Three sizes max: title (`text-2xl font-bold`), body (`text-base`), caption (`text-sm text-gray-500`).
- Left-aligned text. Sentence case everywhere.

### Components (keep it minimal)

- **Buttons**: solid bg, `rounded-xl`, `px-6 py-3`. No ghost/outline for primary actions.
- **Cards**: `bg-white rounded-2xl p-4 shadow-sm`. No borders unless list separators.
- **Inputs**: `bg-gray-100 rounded-xl px-4 py-3`. Border on focus only.
- **Lists**: `FlatList`/`ScrollView` with thin borders or spacing between items.
- **Icons**: `@expo/vector-icons` only, small (`size={20}`), functional not decorative.
- **Loading**: centered `ActivityIndicator`. No skeletons, no shimmer.
- **Empty states**: icon + short message + one action button.

### Interaction

- Press feedback: `opacity: 0.7` via Pressable. No scale transforms.
- No animation libraries for standard UI transitions. Let the platform handle it.
- Haptics for destructive actions only.

### Dark mode

- Light: `bg-white` + `text-gray-900`. Dark: `bg-black`/`bg-gray-950` + `text-white`.
- Same accent color in both modes. Use `useColorScheme()`.

### Cross-platform

- Test at 375px, 390px, 768px, 1280px+.
- Minimum 44x44px tap targets. Prefer `ScrollView` over fixed-height containers.

# React Native — No Plain HTML

This is a **React Native / Expo** app. Never use HTML elements (`<div>`, `<span>`, `<p>`, etc.) or DOM APIs (`document`, `window`). Use React Native primitives: `<View>`, `<Text>`, `<Pressable>`, `<ScrollView>`, `<Image>`.

# Styling

All styling via **NativeWind** — Tailwind utility classes on the `className` prop. Never use `StyleSheet.create()` or inline `style` objects.

# Language Selection

- **Rust** — all business logic, data processing, validation, algorithms, API clients, database access. Lives in [src-rust/](src-rust/), called via [src/lib/rust.ts](src/lib/rust.ts).
- **Objective-C/C++** — native platform integration, Expo native modules, and bridging code that requires direct access to native frameworks (Linux, Windows, UIKit, Foundation, CoreData, etc.).
- **TypeScript** — UI components, screen layouts, navigation, styling, and thin glue wiring Rust to UI.

# Project Structure

| Path | Purpose |
|---|---|
| [src-rust/](src-rust/) | Rust library (cdylib/wasm via wasm-bindgen) |
| [src/app/](src/app/) | Expo Router screens (file-based routing) |
| [src/components/](src/components/) | Shared React Native components |
| [src/constants/](src/constants/) | Theme, colors, layout constants |
| [src/hooks/](src/hooks/) | Custom React hooks |
| [src/redux/](src/redux/) | Redux Toolkit state |
| [src/server/](src/server/) | Express API routes |
| [src/server.ts](src/server.ts) | Express entry point → `dist/main.js` |
| [src/worker.ts](src/worker.ts) | CF Worker entry point → `dist/worker.js` |
| [src/wasm/](src/wasm/) | Generated WASM bindings (do not edit) |

# Do Not Modify Without Approval

- [flake.nix](flake.nix) — propose changes first, wait for approval.
- [flake.lock](flake.lock) — updated only by `nix flake update`.
- [Cargo.lock](Cargo.lock) — must stay in sync with the Nix build.

# Dependencies

**Never use `devDependencies`.** All deps go in `dependencies`.

Before adding anything new: check if [package.json](package.json), [Cargo.toml](Cargo.toml), or [flake.nix](flake.nix) already covers it. New deps must be widely adopted, actively maintained, from a trusted registry, and open-source licensed.

# Deployment Contexts

| Context | Entry point | Available APIs |
|---|---|---|
| **Express server** | [src/server.ts](src/server.ts) | Full Node.js, no DOM |
| **Cloudflare Worker** | [src/worker.ts](src/worker.ts) | Workers runtime, no Node.js fs/child_process |
| **Expo frontend** | [src/app/](src/app/) | React Native / browser APIs only |

Cross-context communication goes through the Express HTTP API. Import from `@/lib/rust` for Rust interop — never interact with WASM or native bridges directly.

# CI/CD

| Workflow | Purpose |
|---|---|
| **Rapid Deploy** ([rapid-deploy.yml](.github/workflows/rapid-deploy.yml)) | Fast Docker/bun build for dev branches. ~1 min to CF Workers. |
| **Nix Flake** ([nix-flake.yml](.github/workflows/nix-flake.yml)) | Reproducible Nix builds for beta/stable. Multi-platform + Docker + CF. |

# Build Verification

```
npm run lint          # always run before finishing a task
nix flake check       # full reproducible build verification
```

# Git Conventions

- All commits must be signed (GPG or SSH).
- Do not add `Co-authored-by: Claude` or any AI co-author trailers.

# Testing

Write tests for each action you implement:
- **Rust**: `#[wasm_bindgen_test]` in [src-rust/](src-rust/)
- **TypeScript**: Jest tests in [src/__tests__/](src/__tests__/)
