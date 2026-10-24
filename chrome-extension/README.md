# TradingView animated wallpaper Chrome extension

A free **Manifest V3 Chrome extension** for custom animated chart backgrounds on the TradingView website. Add a local MP4, WebM, GIF, or image behind candlesticks, with no account or subscription for this extension.

For the actual macOS TradingView Desktop application, use the [separate Desktop companion](../desktop/README.md).

## Install in Google Chrome

1. [Download the Chrome release ZIP](https://github.com/vladimirdd96/tradingview-animated-wallpaper/releases/latest/download/TradingView-Chrome-Wallpaper.zip) and extract it.
2. Keep the extracted **ChartWallpaper** folder in a permanent location.
3. Open `chrome://extensions` in Chrome and enable **Developer mode**.
4. Click **Load unpacked** and select the **ChartWallpaper** folder directly containing `manifest.json`.
5. Pin **Chart Wallpaper** using Chrome's puzzle-piece menu.
6. Open or refresh a [TradingView chart](https://www.tradingview.com/chart/). The built-in aurora should appear behind candles.
7. Open the extension → **Choose custom wallpaper** → choose a local file → **Save wallpaper** → refresh the chart.

When installing from a cloned repository, select this `chrome-extension/` folder directly. No build step, terminal command, or Chrome Web Store account is required.

## How to open the wallpaper controls

Click the pinned **Chart Wallpaper** extension icon. The popup contains enable/disable, darkening, and pause controls. Click **Choose custom wallpaper** to open the file chooser/settings page again.

Refresh the chart after changing settings to guarantee a complete canvas repaint. Changes are delivered immediately, but existing canvas pixels remain until TradingView redraws.

## Custom wallpapers

Supported files: MP4, WebM, animated GIF, WebP, PNG, JPEG; up to **40 MB**. Chrome must be able to decode the file. H.264 MP4 and VP8/VP9 WebM are practical choices. Audio is muted. Video/aurora can be paused; animated GIFs cannot. The built-in aurora respects reduced-motion preferences. Hidden tabs pause video and the aurora.

Files stay in this Chrome profile's local extension storage, not uploaded or synchronized. Removing the extension removes its stored wallpaper. Large files and many chart tabs increase memory use. No anime footage, paid wallpaper library, or downloaded media is bundled.

Fill chart crops edges; Show entire wallpaper letterboxes. Only chart panes get wallpaper. Axes and surrounding TradingView UI retain their current theme.

## Fix “Manifest file is missing or unreadable”

Choose the **folder directly containing manifest.json**. Do not select the ZIP, an extra parent folder created by extraction, or manifest.json itself. Keep the installed folder in place; moving or deleting it breaks an unpacked extension. After changing source files, reload the extension card and refresh TradingView.

If wallpaper is missing, check Enable wallpaper, refresh the chart, and try the built-in aurora. For video errors, try H.264 MP4 or VP8/VP9 WebM. Dark wallpapers can reduce label contrast on light chart themes; adjust darkening or your TradingView theme.

## Permissions and compatibility

Requires Chrome 111+; verified in Chromium on macOS and visually inspected in Chrome. `storage` saves settings/media; `unlimitedStorage` permits custom videos beyond the normal quota. Content scripts run only on HTTPS TradingView subdomains. There is no backend, analytics, or remotely executed code.

The chart-specific hook runs in the page's MAIN world to intercept its Canvas 2D drawing calls; settings/media handling runs in the isolated extension world. TradingView can observe DOM elements inserted into its page. See [security details](../docs/security.md).

TradingView DOM/rendering changes can require an update. Paid multi-chart layouts, incognito, every indicator/theme/codec, and future releases are not certified. Built-in chart export may omit the wallpaper. See [compatibility](../docs/compatibility.md) and [testing](../docs/testing.md).
