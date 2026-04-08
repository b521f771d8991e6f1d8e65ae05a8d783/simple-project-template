# simple-project-template

Cross-platform app built with Expo, TypeScript, and Express.

## Quick Start

```bash
npm install
npm run dev
```

## Docker

**Production:**
```bash
nix build .#docker && docker load < result
docker run -p 8081:8081 simple-project-template
```

**Production + Dream Mode:**
```bash
nix build .#docker-dev && docker load < result

# With API key
docker run -it -P -e ANTHROPIC_API_KEY=sk-ant-... simple-project-template-dev

# With host credentials
docker run -it -P --userns=keep-id -v ~/.claude:/home/.claude simple-project-template-dev
```

## Dream Mode

Users suggest changes via AI chat. Claude edits a clone of the source, shows a live preview, then emails the diff to the developer.

Enabled automatically when running `npm run dev`. In production, set `DREAM_MODE_SOURCES` to a source directory (set automatically in `docker-dev`).

| Variable | Purpose |
|----------|---------|
| `DREAM_MODE_SOURCES` | Path to source dir (enables dream mode in production) |
| `ANTHROPIC_API_KEY` | Claude API key |
| `DEVELOPER_EMAIL` | Receives suggested diffs via email |
| `SMTP_URL` | SMTP connection string |
| `DREAM_MODEL` | Optional model override (`sonnet`, `opus`) |

Apply a received patch:
```bash
xzcat dream.patch.xz | git apply
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Metro dev server |
| `npm run build` | Production build (Node.js) |
| `npm run build:worker` | Production build (Cloudflare Workers) |
| `npm run tag` | Create CalVer signed git tag |
| `npm run generate:icons` | Regenerate icons from `logo.svg` |
