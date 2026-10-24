# TradingView animated wallpaper compatibility

| Target | Verified environment | Status |
|---|---|---|
| TradingView Desktop | 3.4.0 (3.4.0.8149), Electron 41.7.1, macOS, Apple Silicon | Existing logged-in app; two chart panes tested |
| TradingView website in Chrome | Manifest V3; Chrome 111+ required | Live-chart automated checks in bundled Chromium; separate visual check in Chrome on macOS |
| Desktop on Windows/Linux | Not implemented | Unsupported |
| Desktop on Intel Mac | Not tested | Not certified |
| Future TradingView/Desktop versions | Not tested | Rendering hooks or runtime attachment may change |
| Other Chromium browsers | Not tested | Chrome is the supported browser target |
| Chrome incognito and paid multi-chart layouts | Not tested | Not certified |

Video/image input: MP4, WebM, GIF, WebP, PNG, JPEG up to 40 MB. Actual decoding depends on the browser/Electron codecs. Generated WebM playback was tested in both packages; Desktop also played a user-provided 3840 × 2160 MP4 in both panes. Only the explicitly approved cropped demo is distributed; original user wallpaper files are not bundled.

Desktop tests preserved the current process and chart layout. Navigation/reload reinjection is implemented but was not tested by reloading that logged-in layout. Opening TradingView Wallpaper after a normal app restart is required; no automatic login item or background reattachment service is installed.

Chart controls, indicators, and drawings remained visible during tests. This is not a certification of every TradingView feature, indicator, rendering mode, broker integration, or theme. The wallpaper is a DOM layer and may be omitted from TradingView's own chart screenshot/export.
