#!/bin/sh
set -e

export PATH="/app/node_modules/.bin:/app/scripts:$PATH"

# ── Claude credentials ──────────────────────────────────────
if [ -n "$ANTHROPIC_API_KEY" ]; then
  KEY_PREVIEW="${ANTHROPIC_API_KEY:0:12}...${ANTHROPIC_API_KEY: -4}"
  echo "Claude API key: $KEY_PREVIEW"
  echo "Check balance:  https://console.anthropic.com/account/billing"
elif [ -f "$HOME/.claude/.credentials.json" ]; then
  echo "Claude credentials: mounted from host"
else
  echo "No Claude credentials found. Either:"
  echo "  -e ANTHROPIC_API_KEY=sk-ant-...  (API key)"
  echo "  -v ~/.claude:/home/.claude --userns=keep-id  (host credentials)"
  exit 1
fi

# ── Git identity (unique per container) ─────────────────────
git config --global user.name "dream-$(hostname)"
git config --global user.email "dream-$(hostname)@localhost"

# ── Restore Claude config if backup exists ──────────────────
if [ ! -f "$HOME/.claude.json" ] && [ -d "$HOME/.claude/backups" ]; then
  BACKUP=$(ls -t "$HOME/.claude/backups/.claude.json.backup."* 2>/dev/null | head -1)
  if [ -n "$BACKUP" ]; then
    cp "$BACKUP" "$HOME/.claude.json"
    echo "Restored Claude config from backup"
  fi
fi

exec "$@"
