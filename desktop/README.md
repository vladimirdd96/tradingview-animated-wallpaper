# Animated wallpapers in the actual TradingView Desktop app on macOS

The Desktop companion adds your local animated video or image behind candlestick charts in the **real TradingView Desktop application**. It attaches to the existing running app, keeps its login/session, and opens wallpaper controls in a native settings window.

## Requirements

- macOS; Apple Silicon with TradingView Desktop **3.4.0** is verified.
- Official TradingView installed at `/Applications/TradingView.app` and already running normally.
- [Node.js 22 or later](https://nodejs.org/). No npm installation or build is needed.
- An Electron build that permits runtime inspector attachment. The launcher checks this and refuses unsupported builds without patching the app.

Other Desktop versions and Intel Macs are not certified. [Compatibility table](../docs/compatibility.md).

## Install and choose a wallpaper

1. [Download the Desktop release ZIP](https://github.com/vladimirdd96/tradingview-animated-wallpaper/releases/latest/download/TradingView-Desktop-Wallpaper.zip).
2. Extract it and keep the **TradingViewDesktopWallpaper** folder in a permanent location.
3. Open TradingView Desktop normally. Leave your existing logged-in chart window open.
4. Double-click **Enable Desktop Wallpaper.command** in that folder.
5. The native **TradingView Desktop Wallpaper** window opens. Click **Choose a local video or image** and select your file.

From a cloned repository, run the same `.command` file inside `desktop/`, or run `node desktop/attach.cjs` from the repository root. macOS may require you to authorize running a downloaded command file; inspect the source before doing so. Do not disable system security protections to use this project.

The launcher never launches, quits, or restarts TradingView. No extra Desktop profile or login is created.

## How to reopen the wallpaper chooser and controls

**Double-click Enable Desktop Wallpaper.command again.** If the companion is already active, it simply shows its settings window.

- **Show wallpaper behind candles:** enable/disable the media layer.
- **Choose a local video or image:** save and apply a custom wallpaper.
- **Use built-in aurora:** switch to the bundled animation.
- **Darken wallpaper:** improve chart readability.
- **Fitting:** fill/crop the chart or show the entire wallpaper with letterboxing.
- **Pause video / aurora:** stop that animation. macOS Reduced Motion also pauses both. GIF animation cannot be paused.
- **Remove wallpaper from this session:** restore the original chart renderer and remove the in-memory companion.

Closing settings leaves the wallpaper running. After quitting and reopening TradingView, run the launcher again to restore saved wallpaper. No login or account action is performed by the launcher.

## Formats and storage

MP4, WebM, GIF, WebP, PNG, and JPEG, up to **40 MB**. H.264 MP4 and VP8/VP9 WebM are practical video choices. Audio is muted. Video and aurora pause in hidden chart tabs. Each pane uses a separate video element; prefer a short 720p/1080p loop for lighter GPU and memory use.

A copy of the selected media and settings is saved locally under:

```text
~/Library/Application Support/TradingView/ChartWallpaper/
```

No wallpaper is uploaded or synchronized. `runtime.json` contains the local controller address and session token; it is private runtime state and must not be committed or shared. User-provided wallpaper videos are not included in this repository or release.

## Troubleshooting

- **Settings window was closed:** run the `.command` launcher again.
- **No supported running process:** open the official Desktop app normally; do not launch it with a separate test profile.
- **Node.js missing:** install Node.js 22+ from its official site, then retry.
- **Port 9229 already in use:** close that debugging session. The launcher does not take it over.
- **App build disables runtime inspector attachment:** this build is unsupported. Do not modify the app's fuses, signature, or security settings.
- **Wallpaper decoding fails:** try the built-in aurora or re-encode your file to H.264 MP4/VP8/VP9 WebM.
- **High CPU/GPU or memory:** use a shorter, lower-resolution video or the built-in animation.
- **Wallpaper disappears after quitting:** run the launcher after reopening TradingView. Automatic attachment at system startup is not installed.

## Implementation and tests

The companion briefly enables a loopback Node inspector in the existing Electron process. It verifies process ownership and loopback binding, installs the in-memory renderer/controller, and closes the temporary inspector. Its restricted controller uses a random token, rejects foreign origins, and exposes wallpaper controls rather than arbitrary evaluation.

The signed app's files are not edited. The renderer intercepts full-pane Canvas 2D background fills while preserving chart content. A restored 0.001 zoom-factor adjustment requests repaint without editing chart preferences.

Two-pane playback, pause, disable/re-enable, storage, removal, reattachment, and code-signature integrity were tested in Desktop 3.4.0. Navigation/reload reinjection is implemented but was not tested by reloading the logged-in chart layout. [Test details](../docs/testing.md) and [security model](../docs/security.md).
