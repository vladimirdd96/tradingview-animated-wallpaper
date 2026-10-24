# How animated wallpaper is rendered behind TradingView charts

## Shared rendering technique

1. Find `canvas[data-name="pane-canvas"]` in TradingView chart panes.
2. Insert an image/video or built-in aurora layer below the chart canvases.
3. Mark that layer ready only after media loads.
4. Wrap Canvas 2D `fillRect` calls. Only for a chart canvas with a ready wallpaper, replace a transformed rectangle covering the full canvas with `clearRect`.
5. Preserve smaller drawing calls and unrelated canvases. The wallpaper layer uses `pointer-events: none`.

This exposes the media behind the chart without compositing a video frame into the chart on every animation tick. Axes and surrounding application UI retain their normal backgrounds. DOM discovery handles replacement chart canvases.

The method depends on TradingView's current DOM markers and Canvas 2D rendering. Future upstream changes can require maintenance.

## Chrome extension

- `chrome-extension/manifest.json`: statically registered Manifest V3 content scripts, popup, and settings page.
- `canvas.js`: MAIN-world full-pane drawing hook installed at document start.
- `content.js`: isolated-world settings/media handling, Blob creation, DOM layers, visibility behavior, and pane status.
- `options.js` / `options.html`: local file validation, save/reset, and fitting.
- `popup.js` / `popup.html`: enable, darkening, pause, and status.

Custom media persists as a data URL in `chrome.storage.local`, then becomes a Blob URL in chart tabs. Refreshing the chart guarantees repaint after changes. The extension uses `storage` and `unlimitedStorage` and only injects into HTTPS TradingView subdomains.

## Actual Desktop companion

- `desktop/attach.cjs`: locate the normal already-running official macOS app, check runtime-inspector fuse support, activate the inspector, verify loopback listener ownership, and send the companion source/assets into memory.
- `desktop/main.cjs`: attach to chart webContents, host restricted local controls, persist settings/media under the app's Application Support directory, and create a sandboxed native settings window.
- `desktop/menu.js`: add a native-style full-width Wallpaper settings row to the trusted local Desktop main menu, with keyboard access and cleanup. A dedicated IPC event opens settings only when its sender is that menu view. No controller token or Node bridge is added to chart pages.
- `desktop/renderer.js`: create per-pane media layers, install/restore the drawing wrapper, and handle motion/visibility.
- Mac app: self-contained Finder launcher with official, checksum-verified Node.js runtimes. Opens native wallpaper settings without Terminal; no runtime installation or launch-time downloads.
- Developer `.command` launcher: find local Node.js and invoke the attachment script. It never starts, quits, or restarts TradingView.

The temporary inspector closes after attachment. The remaining controller has a random-token URL, binds only to `127.0.0.1`, rejects foreign origins and unexpected Host headers, and exposes only wallpaper operations. Closing settings leaves the in-memory companion active. Removing wallpaper detaches lifecycle listeners and restores the renderer. Quitting the app clears the companion from memory.

The Desktop view is repainted through a brief 0.001 zoom-factor adjustment followed by restoration. No chart settings are edited. The application bundle and signature remain untouched.

The settings window uses TradingView-style light/dark palettes and the app’s `nativeTheme` selection. Theme updates reach the open window without reopening it. Done hides settings while leaving wallpaper active. Runtime upgrades replace only the in-memory companion, preserving saved media/preferences and the running application process.
