# Contributing

Read [AGENTS.md](AGENTS.md), [architecture](docs/architecture.md), and the relevant package guide before changing the renderer or Desktop attachment.

Run `node scripts/check.mjs` and `python3 scripts/build_release.py`. Chrome integration tests are in `tests/chrome/`; Desktop tests require a supported, already-running app and explicit authorization to temporarily change its wallpaper. [Full testing instructions](docs/testing.md).

For a bug report, identify Chrome extension vs Desktop companion, platform, browser/Desktop version, media format, and a minimal reproduction. Do not upload private charts, account details, local controller tokens, profiles, or copyrighted wallpaper files. A generated non-sensitive sample is preferable.

Keep compatibility claims tied to performed tests. Preserve pointer passthrough, narrowly scoped drawing interception, local-only media handling, controller checks, and clean removal. Do not add automatic app restarts, account access, order execution, bundle patches, or paid wallpaper downloads.

For documentation changes, keep package names, download links, manifest filenames, and launcher paths accurate. Favor natural searchable explanations over repeated keywords.
