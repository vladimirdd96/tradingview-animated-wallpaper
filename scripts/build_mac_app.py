"""Build the self-contained Mac app. Only build-time downloads; none at launch."""
from pathlib import Path
import hashlib
import json
import plistlib
import shutil
import subprocess
import tarfile
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parent.parent
NODE_VERSION = '22.23.4'
# Pinned from the official nodejs.org release checksum list (not a mirror).
NODE_SHA256 = {
    'arm64': '037650d0839f457747396f052073fb48333d31bf5abd3c98b74da20d89ebb1ad',
    'x64': 'f42abca7aaac61efc57d49fb42ea84fc53bbeba9a749cb03a291ce6e4e7a69c1',
}
FILES = ['attach.cjs', 'main.cjs', 'renderer.js', 'menu.js', 'index.html', 'ui.js', 'ui.css', 'LICENSE']


def build():
    out = ROOT / 'dist'
    cache = out / 'node-cache'
    cache.mkdir(parents=True, exist_ok=True)
    app = out / 'TradingView Wallpaper.app'
    if app.exists():
        shutil.rmtree(app)
    subprocess.run(['/usr/bin/osacompile', '-o', str(app), str(ROOT / 'desktop/launcher/main.applescript')], check=True)
    resources = app / 'Contents/Resources'
    shutil.copy2(ROOT / 'desktop/launcher/launch.sh', resources / 'launch.sh')
    companion = resources / 'companion'
    companion.mkdir()
    for name in FILES:
        shutil.copy2(ROOT / 'desktop' / name, companion / name)
    for arch, expected in NODE_SHA256.items():
        stem = f'node-v{NODE_VERSION}-darwin-{arch}'
        archive = cache / (stem + '.tar.xz')
        if not archive.exists():
            print('Downloading official runtime:', arch, flush=True)
            with urllib.request.urlopen(f'https://nodejs.org/dist/v{NODE_VERSION}/{archive.name}', timeout=120) as response:
                archive.write_bytes(response.read())
        if hashlib.sha256(archive.read_bytes()).hexdigest() != expected:
            raise ValueError(f'Runtime checksum mismatch: {arch}. Delete cached archive and retry.')
        runtime = resources / 'runtime' / arch
        runtime.mkdir(parents=True)
        # Read only explicitly named entries, never extract arbitrary archive paths.
        with tarfile.open(archive) as tar:
            for source, target in [('bin/node', 'node'), ('LICENSE', 'LICENSE')]:
                entry = tar.extractfile(stem + '/' + source)
                if entry is None:
                    raise ValueError('Missing official runtime entry')
                (runtime / target).write_bytes(entry.read())
        (runtime / 'node').chmod(0o755)
        subprocess.run(['/usr/bin/codesign', '--verify', str(runtime / 'node')], check=True)
    plist_path = app / 'Contents/Info.plist'
    plist = plistlib.loads(plist_path.read_bytes())
    plist.update({
        'CFBundleIdentifier': 'io.github.vladimirdd96.tradingview-wallpaper',
        'CFBundleName': 'TradingView Wallpaper',
        'CFBundleDisplayName': 'TradingView Wallpaper',
        'CFBundleShortVersionString': json.loads((ROOT / 'package.json').read_text())['version'],
        'LSUIElement': True,
        'LSMinimumSystemVersion': '11.0',
    })
    plist_path.write_bytes(plistlib.dumps(plist))
    # Integrity seal only. This is not a Developer ID signature or notarization.
    subprocess.run(['/usr/bin/codesign', '--force', '--sign', '-', str(app)], check=True)
    subprocess.run(['/usr/bin/codesign', '--verify', '--deep', '--strict', str(app)], check=True)
    target = out / 'TradingView-Desktop-Wallpaper.zip'
    with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for item in sorted(app.rglob('*')):
            if item.is_file():
                archive.write(item, item.relative_to(out))
        archive.write(ROOT / 'desktop/START-HERE.txt', 'START HERE.txt')
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None
        assert not any(n.endswith(('runtime.json', 'settings.json', 'wallpaper.bin')) for n in archive.namelist())
    print('PASS self-contained Mac app ZIP:', target.stat().st_size, 'bytes')
    return target


if __name__ == '__main__':
    build()
