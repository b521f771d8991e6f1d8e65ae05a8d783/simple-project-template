#!/bin/sh
# Landlock sandbox wrapper for dream mode processes.
# Usage: sandbox.sh <workdir> [options] -- <command...>
#
# Options:
#   --rw-home        Grant read-write access to $HOME (for claude config)
#   --rox <path>     Additional read-execute path
#   --ro <path>      Additional read-only path
#
# Always grants:
#   --rox  /nix/store /sbin /bin  (executables)
#   --ro   /etc                    (config)
#   --rw   <workdir> /tmp          (workspace)
#
# Passes through: PATH, HOME, SSL/TLS certs, ANTHROPIC_API_KEY, DREAM_* vars

set -e

WORKDIR="$1"; shift

EXTRA=""
while [ "$1" != "--" ] && [ $# -gt 0 ]; do
  case "$1" in
    --rw-home) EXTRA="$EXTRA --rw ${HOME:-/home}"; shift ;;
    --rox)     EXTRA="$EXTRA --rox $2"; shift 2 ;;
    --ro)      EXTRA="$EXTRA --ro $2"; shift 2 ;;
    *)         echo "sandbox.sh: unknown option $1" >&2; exit 1 ;;
  esac
done
[ "$1" = "--" ] && shift

exec landrun \
  --best-effort \
  --rox /nix/store --rox /sbin --rox /bin \
  --ro /etc \
  --rw "$WORKDIR" --rw /tmp \
  $EXTRA \
  --env PATH --env HOME \
  --env SSL_CERT_FILE --env NODE_EXTRA_CA_CERTS \
  --env ANTHROPIC_API_KEY \
  --env DREAM_MODE_SOURCES --env DREAM_PREVIEW --env DREAM_MODEL \
  --env EXPO_OFFLINE --env EXPO_NO_TELEMETRY --env BROWSER \
  -- "$@"
