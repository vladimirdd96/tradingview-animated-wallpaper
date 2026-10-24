#!/bin/zsh
# Resolve bundled assets, including when Finder translocates a downloaded app.
set -eu
resources="${0:A:h}"
case "$(/usr/bin/uname -m)" in
  arm64) runtime="$resources/runtime/arm64/node" ;;
  x86_64) runtime="$resources/runtime/x64/node" ;;
  *) print -u2 'This download is for Mac computers. Please use the Chrome version on other systems.'; exit 1 ;;
esac
if [[ ! -x "$runtime" ]]; then
  print -u2 'The download is incomplete. Download TradingView Wallpaper again, unzip it, and keep the app together.'
  exit 1
fi
# No system Node, package manager, sudo, downloads, login item, or app restart.
exec "$runtime" "$resources/companion/attach.cjs"
