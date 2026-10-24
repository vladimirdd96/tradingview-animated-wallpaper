"""Build installable release ZIPs from explicit source allowlists; never include local state."""
from pathlib import Path
import hashlib
import zipfile
import sys

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist'
OUT.mkdir(exist_ok=True)
PACKAGES = {
    'TradingView-Chrome-Wallpaper.zip': ('chrome-extension', 'ChartWallpaper', [
        'manifest.json', 'canvas.js', 'content.js', 'popup.html', 'popup.js',
        'options.html', 'options.js', 'ui.css', 'README.md', 'LICENSE',
    ]),
    'TradingView-Desktop-Source.zip': ('desktop', 'TradingViewDesktopWallpaper', [
        'attach.cjs', 'main.cjs', 'renderer.js', 'menu.js', 'index.html', 'ui.js', 'ui.css',
        'Enable Desktop Wallpaper.command', 'README.md', 'LICENSE',
        'qa/evaluate.cjs', 'qa/test.cjs', 'qa/sample.webm',
    ]),
}
checksums = []
for filename, (source, folder, files) in PACKAGES.items():
    target = OUT / filename
    with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for relative in files:
            item = ROOT / source / relative
            content = item.read_bytes()
            if relative.endswith('.md'):
                text = content.decode()
                for prefix in ['docs/', 'desktop/', 'chrome-extension/']:
                    text = text.replace('](../' + prefix, '](https://github.com/vladimirdd96/tradingview-animated-wallpaper/blob/main/' + prefix)
                content = text.encode()
            info = zipfile.ZipInfo(folder + '/' + relative, date_time=(2026, 10, 24, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = ((0o100755 if relative.endswith('.command') else 0o100644) << 16)
            archive.writestr(info, content)
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None
        assert all('/data/' not in n and not n.endswith(('runtime.json', 'settings.json', 'wallpaper.bin')) for n in archive.namelist())
    checksums.append(hashlib.sha256(target.read_bytes()).hexdigest() + '  ' + filename)
    print('PASS', filename, target.stat().st_size, 'bytes')
if '--mac-app' in sys.argv:
    from build_mac_app import build
    app_zip = build()
    checksums.append(hashlib.sha256(app_zip.read_bytes()).hexdigest() + '  ' + app_zip.name)
(OUT / 'SHA256SUMS.txt').write_text('\n'.join(checksums) + '\n')
