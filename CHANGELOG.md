# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-07-16

### Added

- A multithread-download preference for faster large archive downloads, with a single-connection option for compatibility.
- A Library & Storage setting that lets you move the WeekBox data folder, including mods, engines, and data, to any writable folder or drive.
- Settings categories for General, Downloads, Library & Storage, and Updates.
- Rotating search guidance for mod searches, GameBanana links, and GameBanana mod IDs.
- App-wide console reporting for uncaught errors and unhandled promise rejections.
- Developer tools support that can be opened when needed without opening automatically at startup.

### Changed

- Large downloads skip the parallel-download server check when multithread downloads are disabled.

### Fixed

- Mod Manager engine and version selections now save and refresh correctly.
- Mod-to-engine links are recreated after moving the WeekBox storage folder.
- Fixed a stylesheet filename-case mismatch that could prevent the search dropdown styles from loading on case-sensitive platforms.
