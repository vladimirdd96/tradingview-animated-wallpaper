# Testing TradingView animated wallpapers

Recorded validation: 23–24 October 2026.

## Actual Desktop results

Tested the signed TradingView Desktop 3.4.0 (3.4.0.8149), Electron 41.7.1, on macOS/Apple Silicon. Tests attached to the same already-running logged-in app throughout, with a two-chart layout.

Passed: runtime attachment; ready wallpaper in both panes; transparent chart background with painted chart content retained; pointer passthrough; generated WebM playback muted in both panes; pause; disable/re-enable; local settings persistence; corrupt input and invalid setting rejection; foreign Origin/missing-token rejection; full removal; saved-media reattachment in the same process. Native settings pause/resume was also exercised through macOS UI automation. A user-supplied 4K MP4 subsequently decoded and advanced playback in both panes without errors.

The temporary inspector was closed after testing. The installed app archive's SHA-256 remained unchanged and `codesign --verify --strict` passed. No private screenshots, user videos, settings, tokens, process IDs, or application profiles are published here.

Navigation/reload injection is implemented but was not tested by reloading the open logged-in chart layout. Other Desktop versions, architectures, codecs, indicators, and layouts are not certified.

## Chrome results

A real unpacked extension loaded in full bundled Chromium on macOS, with no reported manifest/runtime errors. A public live TradingView chart showed wallpaper behind candles. Custom WebM upload, playback, reload persistence, pause, disable/re-enable, reset to aurora, corrupt-media rejection, and popup load passed. The rendering code was separately visually inspected in Chrome through DevTools.

Single-pane Chrome layout was tested. Incognito, paid multi-chart layouts, all codecs/themes/indicators, and future TradingView versions are not certified.

## Offline source and packaging checks

```sh
node scripts/check.mjs
python3 scripts/build_release.py
```

These checks parse the extension manifest, validate referenced assets, check JavaScript syntax and the launcher, inspect basic package invariants, and build ZIPs from explicit allowlists. They do not start TradingView, attach a debugger, or alter an existing browser/app session.

## Chrome integration test

```sh
cd tests/chrome
npm install
npx playwright install chromium
npm test
```

The test uses a fresh temporary Chromium profile, a public TradingView chart, and generated media. It does not attach to the user's Chrome. Internet access and the public chart are required. A local test screenshot is written into ignored `artifacts/`. The original tests used Playwright 1.62.1; use the pinned dependency for reproduction.

## Desktop integration test — deliberate local run only

While the supported Desktop app and companion are already active:

```sh
node desktop/qa/test.cjs
```

This test temporarily switches wallpaper, exercises removal and reattachment, then restores the saved wallpaper/preferences. It never launches, quits, or reloads TradingView. Do not run it automatically against someone else's active chart session. It uses the generated `desktop/qa/sample.webm` fixture and no third-party dependencies.

Hosted CI is not enabled in this repository. An optional [GitHub Actions example](examples/github-actions.yml) runs only offline source/package checks; a maintainer with workflow permission can copy it into `.github/workflows/`. A passing source/package check is not a live TradingView compatibility certification.

## Desktop menu and appearance update (1.1.1)

The native top-right three-dot menu was checked in the existing Desktop process. The injected row aligned with Settings at the same horizontal position/width and appeared directly below it. Clicking its visible label reopened the redesigned Wallpaper settings window; Done hid it without stopping wallpaper. Process identity, saved media hash, and wallpaper preferences matched the pre-update snapshot.

Isolated Chromium tests cover menu placement inside a horizontal native-style row wrapper (preventing side-by-side placement), clicks, Enter/Space, arrow-key adjacency, idempotence, rerender reinsertion, cleanup, and exclusion from other menu types. Settings tests cover explicit dark appearance with a light system preference, live light-theme updates, all controls fitting the default window, narrow-window containment, long filenames, accessible switches, custom file selection/upload, and Done. The live Desktop check used the current dark appearance; the user’s app theme was not switched for testing.

Run the isolated UI checks without touching Desktop:

```sh
cd tests/chrome
npm install
npx playwright install chromium
npm run test:desktop-menu
npm run test:desktop-settings
```
