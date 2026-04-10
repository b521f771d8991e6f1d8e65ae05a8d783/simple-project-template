# simple-project-template

Cross-platform app: Expo (React Native) + TypeScript. Runs on Node.js, Cloudflare Workers, and Tauri desktop.
Supports native programming languages (Rust and (Objective) C/++) compiled either as native code (tauri (as an npm addon), react native apps (using expo)), or wasm (using emscripen and wasm-bindgen).

## Quick Start

```bash
npm install
npm run dev
```

## Docker

```bash
# Production
nix build .#docker && docker load < result
docker run -p 8081:8081 simple-project-template

# Dream Mode
nix build .#docker-dev && docker load < result
docker run -it -P -e ANTHROPIC_API_KEY=sk-ant-... simple-project-template-dev
```

## Dream Mode

AI-assisted live editing. Users suggest changes via chat; Claude edits a source clone, shows a preview, and emails the diff.

| Variable | Purpose |
|----------|---------|
| `DREAM_MODE_SOURCES` | Enables dream mode in production |
| `ANTHROPIC_API_KEY` | Claude API key |
| `DEVELOPER_EMAIL` | Receives diffs |
| `SMTP_URL` | SMTP connection string |

Apply a patch: `xzcat dream.patch.xz | git apply`