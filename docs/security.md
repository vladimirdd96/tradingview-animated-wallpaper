# Local storage, permissions, and attachment security

## Data handling

Both packages use local files and have no wallpaper backend, analytics service, remote code loader, or cloud account. TradingView itself still makes its normal network requests.

- Chrome stores wallpaper and settings in the current profile's extension storage. Removing the extension removes that storage.
- Desktop stores media, preferences, and runtime controller metadata in `~/Library/Application Support/TradingView/ChartWallpaper/`.
- Desktop `runtime.json` includes a session token. Do not commit/share it, `settings.json`, or `wallpaper.bin`.
- Repository ignores and release allowlists exclude these files. The only bundled video is a small project-generated QA fixture.

No login credentials, cookie exports, account records, orders, or trading API keys are needed by the companion. No real wallpaper files, private chart screenshots, or application profiles belong in bug reports.

## Chrome permissions

The extension requests `storage` and `unlimitedStorage`. Content scripts are restricted to `https://*.tradingview.com/*`. MAIN-world drawing code shares the page's JavaScript environment; TradingView can observe or interfere with the hook and DOM media elements. The isolated content script handles extension storage.

## Desktop attachment

Attaching requires trust in the local source: the temporary Node inspector can execute code inside the running Electron main process. The launcher verifies the expected installed executable, compatible runtime-inspector fuse, process ID, and a listener owned by that process on `127.0.0.1:9229`. It refuses an already-occupied debugging endpoint and closes the inspector after the evaluation completes.

The remaining HTTP controller binds to loopback, requires a random 256-bit path token, and validates Origin and Host headers. Its routes expose wallpaper settings, upload/reset, window show, status, and removal—not a general JavaScript evaluator or arbitrary filesystem reader. The native settings BrowserWindow disables Node integration and uses context isolation, sandboxing, and a restrictive content-security policy.

No SIP, Gatekeeper, signature, executable, fuse, app archive, or certificate setting is changed by the code. Local malware or another process with equivalent user access is outside this controller's protection boundary.

## Reporting a problem

For a security issue, use the repository's private security reporting feature if enabled. Otherwise open an issue requesting a private contact route without posting exploit details, tokens, media, or account information. For ordinary bugs, include package, app/browser version, platform, and a minimal reproduction without private data.
