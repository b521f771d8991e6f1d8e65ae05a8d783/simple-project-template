#!/bin/sh
set -e

export PATH="/app/node_modules/.bin:/app/scripts:$PATH"

# ── Landlock sandbox check ──────────────────────────────────
printf "Checking Landlock sandbox... "
LANDLOCK_ERR=$(sandbox.sh /tmp -- true 2>&1) && LANDLOCK_OK=1 || LANDLOCK_OK=0
if [ "$LANDLOCK_OK" = "1" ]; then
  echo "OK"
else
  echo "FAILED"
  echo "  $LANDLOCK_ERR"
  exit 1
fi

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

# ── Verify Claude works (sandboxed compile + run) ───────────
MAGIC=$((RANDOM % 200 + 1))
printf "Checking Claude (expect exit code %d)... " "$MAGIC"
CLAUDE_CODE=$(sandbox.sh /tmp --rw-home --rox /app -- claude --print --model haiku "Write a C program that exits with code $MAGIC. Output only the code, no explanation." 2>&1)
TMPFILE="/tmp/claude-check-$$.c"
echo "$CLAUDE_CODE" | sed '/^```/d' > "$TMPFILE"
if clang -o /tmp/claude-check "$TMPFILE" 2>/dev/null && /tmp/claude-check; ACTUAL=$?; [ "$ACTUAL" = "$MAGIC" ]; then
  echo "OK"
else
  echo "FAILED (got $ACTUAL, expected $MAGIC)"
  echo "$CLAUDE_CODE"
  rm -f "$TMPFILE" /tmp/claude-check
  exit 1
fi
rm -f "$TMPFILE" /tmp/claude-check

exec "$@"
