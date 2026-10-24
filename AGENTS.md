# Agent guide: TradingView animated wallpaper

This MIT-licensed repository contains two independent cosmetic integrations:

- `chrome-extension/`: Manifest V3 extension for tradingview.com in Chrome.
- `desktop/`: companion for the actual already-running TradingView Desktop app on macOS.

Start with `README.md`, `llms.txt`, `docs/compatibility.md`, and the target package README. Desktop support is verified only on TradingView Desktop 3.4.0/macOS/Apple Silicon. Do not describe Chrome installation as Desktop support.

## Work boundaries

- Never launch, quit, restart, log out of, or reload a user's Desktop app merely to test wallpaper. The launcher attaches to the existing normal process.
- Do not patch the application bundle, signature, Electron fuses, or system protections to force compatibility.
- Do not touch trades, broker controls, accounts, cookies, saved chart preferences, or strategies.
- Never commit user media, screenshots, profiles, runtime.json, settings.json, wallpaper.bin, tokens, or absolute personal paths. The small generated QA WebM is intentionally included. The creator explicitly approved the cropped public demo in `docs/media/desktop-demo.gif` and the linked release MP4; this narrow exception does not authorize publishing other user media.
- Keep loopback binding, process ownership checks, token/origin/host checks, and inspector cleanup intact.
- Desktop integration tests temporarily change wallpaper. Run them only with explicit authorization for the active local session. Offline checks do not need a running app.

## Validation

Run `node scripts/check.mjs` and `python3 scripts/build_release.py`. On macOS, build and verify the beginner app with `python3 scripts/build_release.py --mac-app`. Run Chrome integration tests from `tests/chrome/` with a temporary profile when needed. Desktop integration tests are in `desktop/qa/`; read `docs/testing.md` first. Do not claim unperformed live checks from CI.

## Files and release layout

`canvas.js` / `renderer.js` wrap only chart-scoped full-pane Canvas 2D fills. Media layers must ignore pointer events. Keep manifest-referenced filenames case-correct and release ZIPs installable without a build. Source allowlists in `scripts/build_release.py` determine release contents.

Update compatibility and user guides when behavior changes. Use searchable plain-language descriptions such as animated TradingView wallpaper, custom video chart backgrounds, Chrome extension, and actual macOS Desktop companion, without implying vendor affiliation or guaranteed future compatibility.

## Design Context

Desktop wallpaper controls should feel native to TradingView: match its system typography, compact form controls, neutral surfaces, and selected light/dark/system theme. Put Wallpaper settings on a separate full-width row next to Settings in the top-right main menu. Avoid promotional headings, separate companion branding, decorative fonts, and custom palettes. See `.impeccable.md` for the creator’s design direction.
