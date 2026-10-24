# TradingView Animated Wallpaper — Desktop & Chrome

**Free animated chart backgrounds for TradingView Desktop on macOS and TradingView in Google Chrome.** Put your own MP4, WebM, GIF, or image wallpaper behind candlesticks, indicators, and drawings—using local files, with no subscription or account for this tool.

[Download for Desktop](https://github.com/vladimirdd96/tradingview-animated-wallpaper/releases/latest/download/TradingView-Desktop-Wallpaper.zip) · [Download for Chrome](https://github.com/vladimirdd96/tradingview-animated-wallpaper/releases/latest/download/TradingView-Chrome-Wallpaper.zip) · [Installation guides](#choose-your-version) · [Compatibility](docs/compatibility.md) · [Agent index](llms.txt)

An independent, MIT-licensed project for **TradingView live wallpapers**, **animated candlestick chart backgrounds**, and **custom video wallpapers**. The Desktop companion works inside the actual TradingView Desktop application; it is not a Chrome shortcut or replacement trading client. The Chrome package is a Manifest V3 browser extension.

## Choose your version

| | TradingView Desktop companion | Google Chrome extension |
|---|---|---|
| Runs in | Actual TradingView Desktop app | TradingView website in Chrome |
| Platform | macOS; Apple Silicon verified | Chrome 111+; macOS verified |
| Install | Extract Desktop ZIP; run the `.command` launcher while TradingView is open | Extract Chrome ZIP; Load unpacked in `chrome://extensions` |
| Wallpaper controls | Native settings window in the running Desktop app | Extension popup and options page |
| Custom files | MP4, WebM, GIF, WebP, PNG, JPEG; up to 40 MB | Same formats and size limit |
| Build required | No; needs Node.js 22+ | No; needs Chrome |
| Guide | [Desktop setup and controls](desktop/README.md) | [Chrome setup and controls](chrome-extension/README.md) |

Both versions include a built-in animated aurora, wallpaper darkening, fill/contain fitting, and pause controls for video and aurora. Audio stays muted. Neither package includes paid wallpaper assets or anime footage.

## Quick start: actual TradingView Desktop on Mac

1. Open TradingView Desktop normally and sign in if needed. Leave your existing chart window open.
2. [Download the Desktop ZIP](https://github.com/vladimirdd96/tradingview-animated-wallpaper/releases/latest/download/TradingView-Desktop-Wallpaper.zip) and extract it.
3. Double-click **Enable Desktop Wallpaper.command** in the extracted folder. [Node.js 22+](https://nodejs.org/) must already be installed.
4. In **TradingView Desktop Wallpaper**, choose a local video or image. It applies to the chart panes in your current session.

**To reopen the wallpaper chooser or controls, run the same `.command` file again.** Closing the settings window leaves wallpaper running. After quitting and reopening TradingView, run the launcher again to restore it. The launcher never opens, quits, or restarts TradingView for you.

Desktop compatibility is verified against **TradingView Desktop 3.4.0 on macOS/Apple Silicon**. This is an unsupported customization: future TradingView or Electron changes may require an update. [Read the Desktop guide](desktop/README.md) before attaching.

## Quick start: TradingView in Chrome

1. [Download the Chrome ZIP](https://github.com/vladimirdd96/tradingview-animated-wallpaper/releases/latest/download/TradingView-Chrome-Wallpaper.zip) and extract it.
2. Open `chrome://extensions`, enable **Developer mode**, and click **Load unpacked**.
3. Select the extracted **ChartWallpaper** folder—the folder directly containing `manifest.json`.
4. Refresh a [TradingView chart](https://www.tradingview.com/chart/), click the extension icon, and choose **Choose custom wallpaper**.

Select a local file, save it, and refresh the chart. If Chrome says “Manifest file is missing or unreadable,” select the folder containing `manifest.json`, not the ZIP or its parent. [Full Chrome guide](chrome-extension/README.md).

## Features and privacy

- Custom animated video or image wallpaper behind candles; no overlay intercepting chart pointer input.
- Built-in animation without downloading a wallpaper.
- Local file storage; no wallpaper upload service, analytics, or cloud account.
- Darkening, fitting, enable/disable, and pause controls. Animated GIFs cannot be paused.
- Independent implementation: does not use ChartSkins accounts, source code, paid assets, or subscription checks.
- No order placement, trading API integration, or changes to account preferences.

Use wallpaper files you are entitled to use. A short H.264 MP4 or VP8/VP9 WebM loop is a practical choice; several 4K video panes can consume substantial GPU and memory.

## How it works

TradingView normally paints an opaque canvas background before drawing chart content. Each package inserts a media layer under chart canvases and intercepts only full-pane background fills. Candles, indicators, drawings, axes, and chart input remain with TradingView.

The Chrome extension installs a chart-scoped MAIN-world Canvas 2D hook and keeps settings handling in an isolated content script. The Desktop companion briefly attaches to the already-running Electron process, installs an in-memory hook, closes the temporary inspector, and hosts a token-protected loopback controller with a native settings window. It does not patch the signed application bundle or disable macOS security protections.

[Architecture](docs/architecture.md) · [Security and permissions](docs/security.md) · [Test scope and commands](docs/testing.md)

## Tested behavior

- Chrome: unpacked extension load, live chart rendering, custom WebM upload and playback, persistence after reload, pause, disable/re-enable, corrupt file rejection, and no reported extension manifest/runtime errors.
- Desktop: attachment to an existing logged-in Desktop 3.4.0 session, two chart panes, custom video playback, native pause/resume, disable/re-enable, saved settings, removal, and reattachment without restarting the application.
- Desktop application archive hash remained unchanged; macOS code-signature verification passed.

These are recorded tests, not a promise of compatibility with all future TradingView versions. [Exact environment and limitations](docs/testing.md).

## FAQ

### Can I use an animated Naruto wallpaper on TradingView?

Yes, select your own local MP4, WebM, or animated image. No Naruto video or other copyrighted wallpaper library is bundled. Desktop testing included a user-provided 4K MP4; only a small project-generated WebM test fixture is in the source tree.

### Is this a free ChartSkins alternative?

It provides independently implemented custom animated chart backgrounds without a subscription. It is not affiliated with ChartSkins or TradingView, and does not unlock either service's paid features or assets.

### Does the Chrome extension work inside TradingView Desktop?

No. Use the separate Desktop companion for the actual macOS Desktop app. Both are included in this repository.

### Will I need to log in again?

The Desktop launcher attaches to the app you already have open. It does not create another profile or restart that app. Normal TradingView authentication still applies.

### Can this place trades or change my strategy?

No. The packages modify chart presentation. They do not place orders, execute strategies, or provide investment advice.

### Will the wallpaper appear in exported chart screenshots?

TradingView's built-in chart export may omit the media layer. A full app/window screenshot captures the visible wallpaper.

## Development and agent entry points

```sh
node scripts/check.mjs
python3 scripts/build_release.py
```

No third-party dependencies are needed for these source/package checks. Browser integration tests require Playwright; Desktop integration tests require an already-running supported macOS Desktop app. Desktop tests temporarily change wallpaper and restore saved preferences—run them deliberately, not as a background check.

Start with [AGENTS.md](AGENTS.md), [llms.txt](llms.txt), and [CONTRIBUTING.md](CONTRIBUTING.md). Release assets are built from explicit file lists to exclude local settings, runtime tokens, and user media.

## License and affiliation

[MIT License](LICENSE). Not affiliated with, endorsed by, or maintained by TradingView or ChartSkins. Product names belong to their respective owners. TradingView's own plans, platform limits, and terms still apply.
