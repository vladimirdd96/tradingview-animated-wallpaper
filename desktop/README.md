# TradingView Wallpaper for Mac

Put your own animated video or picture behind charts in the actual TradingView Desktop app.

## Install — no coding needed

1. Open TradingView and leave your chart open.
2. **[Download TradingView Wallpaper for Mac](https://github.com/vladimirdd96/tradingview-animated-wallpaper/releases/latest/download/TradingView-Desktop-Wallpaper.zip)**.
3. Double-click the ZIP to unzip it. Move **TradingView Wallpaper.app** to **Applications**.
4. Open **TradingView Wallpaper**. Click **Choose file…** in the settings window and pick your video or picture.

Everything needed is inside the download. No Terminal, Node.js installation, or administrator access is required by the app. Your existing TradingView login stays in place.

### First-open help

This app is not notarized by Apple. If macOS blocks it and you trust this download, open **System Settings → Privacy & Security → Open Anyway**, then try opening the app again. macOS may ask for your password when approving the app. [Apple’s instructions](https://support.apple.com/102445).

### Which computers work?

Tested on **Mac / Apple Silicon** with TradingView Desktop 3.4.0, installed normally in Applications. The app includes an Intel runtime, but Intel Macs are not yet tested. For Windows or Linux, use the [Chrome version](../chrome-extension/README.md).

## How to reopen the wallpaper chooser and controls

**Open the top-right three-dot main menu in TradingView Desktop and choose Wallpaper settings….** The entry sits on its own full-width row directly below Settings.

The settings window follows TradingView’s selected dark, light, or system theme, including changes while it is open. Click **Done** or close the window to return to charts. Wallpaper stays active.

After quitting and reopening TradingView, open **TradingView Wallpaper** again. This restores your saved wallpaper and the menu entry.

- **Show wallpaper behind candles:** enable/disable the media layer.
- **Choose file…:** save and apply a custom wallpaper.
- **Use built-in aurora:** switch to the bundled animation.
- **Darken wallpaper:** improve chart readability.
- **Fitting:** fill/crop the chart or show the entire wallpaper with letterboxing.
- **Pause animation:** stop that animation. macOS Reduced Motion also pauses both. GIF animation cannot be paused.
- **Remove wallpaper from this session:** restore the original chart renderer and remove the in-memory companion.

Closing settings leaves the wallpaper running. After quitting and reopening TradingView, open **TradingView Wallpaper** again to restore saved wallpaper. No login or account action is performed by the launcher.

## Formats and storage

MP4, WebM, GIF, WebP, PNG, and JPEG, up to **40 MB**. H.264 MP4 and VP8/VP9 WebM are practical video choices. Audio is muted. Video and aurora pause in hidden chart tabs. Each pane uses a separate video element; prefer a short 720p/1080p loop for lighter GPU and memory use.

A copy of the selected media and settings is saved locally under:

```text
~/Library/Application Support/TradingView/ChartWallpaper/
```

No wallpaper is uploaded or synchronized. `runtime.json` contains the local controller address and session token; it is private runtime state and must not be committed or shared. User-provided wallpaper videos are not included in this repository or release.

## Troubleshooting

- **Settings window was closed:** open the top-right three-dot menu → Wallpaper settings….
- **No supported running process:** open the official Desktop app normally; do not launch it with a separate test profile.
- **The app will not open:** check the First-open help above. If the download is incomplete, download and unzip it again.
- **Port 9229 already in use:** close that debugging session. The launcher does not take it over.
- **App build disables runtime inspector attachment:** this build is unsupported. Do not modify the app's fuses, signature, or security settings.
- **Wallpaper decoding fails:** try the built-in aurora or re-encode your file to H.264 MP4/VP8/VP9 WebM.
- **High CPU/GPU or memory:** use a shorter, lower-resolution video or the built-in animation.
- **Wallpaper disappears after quitting:** open TradingView Wallpaper after reopening TradingView. Automatic attachment at system startup is not installed.

## Implementation and tests

The companion briefly enables a loopback Node inspector in the existing Electron process. It verifies process ownership and loopback binding, installs the in-memory renderer/controller, and closes the temporary inspector. Its restricted controller uses a random token, rejects foreign origins, and exposes wallpaper controls rather than arbitrary evaluation.

The signed app's files are not edited. The renderer intercepts full-pane Canvas 2D background fills while preserving chart content. A restored 0.001 zoom-factor adjustment requests repaint without editing chart preferences.

Two-pane playback, pause, disable/re-enable, storage, removal, reattachment, and code-signature integrity were tested in Desktop 3.4.0. Navigation/reload reinjection is implemented but was not tested by reloading the logged-in chart layout. [Test details](../docs/testing.md) and [security model](../docs/security.md).

## Developers: source-only installation

The separate **TradingView-Desktop-Source.zip** is for developers. It requires Node.js 22+ already installed; run **Enable Desktop Wallpaper.command** from that folder. Ordinary users should use the Mac app download above instead.

The Mac app bundles pinned official runtimes for Apple Silicon and Intel. The build verifies their SHA-256 checksums, includes their licenses, and seals the launcher with an ad hoc signature. This is an integrity seal, not Apple notarization or a Developer ID signature. No system-wide runtime, login item, or background updater is installed. Remove the launcher app to uninstall it; remove the wallpaper from its settings to stop the current session.
