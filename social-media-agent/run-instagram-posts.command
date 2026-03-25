#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "Choose what to capture:"
echo "1) Orders"
echo "2) Feed"
read "choice?Enter 1-2: "

category=""

case "$choice" in
  1) category="browse" ;;
  2) category="feed" ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

if [[ ! -x "$SCRIPT_DIR/node_modules/.bin/ts-node" ]]; then
  echo "Missing local dependencies. Run install first."
  exit 1
fi

"$SCRIPT_DIR/node_modules/.bin/ts-node" "$SCRIPT_DIR/src/cli.ts" instagram --category "$category" --no-headless

echo
echo "Saved posts under: $SCRIPT_DIR/instagram-posts"
read "done?Press Enter to close..."
