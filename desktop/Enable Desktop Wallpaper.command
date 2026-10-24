#!/bin/zsh
cd -- "${0:A:h}" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$PATH"
if ! command -v node >/dev/null 2>&1; then
  print 'Node.js 22 or later is required. Install it from nodejs.org, then run this file again.'
  read -r '?Press Return to close.'
  exit 1
fi
node attach.cjs
if (( $? != 0 )); then read -r '?Press Return to close.'; fi
