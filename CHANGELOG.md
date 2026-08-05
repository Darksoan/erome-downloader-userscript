# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed

- Send single media items through `sendPhoto` or `sendVideo` instead of invalid one-item media groups.
- Preserve successful items when another download fails inside a Telegram batch.
- Stop reporting failed `GM_download` calls as successful downloads.
- Use response MIME types for Telegram uploads and add request timeouts.
- Validate stored values, Chat IDs, Bot Tokens, and chat history before use.
- Remove unsafe HTML interpolation from user-controlled media and chat history values.
- Prevent late Telegram responses from completing a request after timeout handling.
- Send GIF, WebP, WebM, MOV, and other unsupported album formats as documents.
- Report browser download fallbacks separately from confirmed downloads and failures.
- Prefer loaded `currentSrc` media over lazy-loading placeholder attributes.

## [4.2.0] - 2026-05-09

### Added

- Multi-language support (i18n) with **Portuguese (BR)**, **English (US)**, and **Spanish (ES)**.
- Language selector at the top of the Config tab with a modern globe icon.
- `refreshModalTexts()` to update all visible strings in real-time when switching languages without closing the modal.
- Inline button tooltips now translate with the selected language.

### Changed

- All hardcoded user-facing strings replaced with i18n translation keys.
- Language choice is persisted via `GM_setValue('lang')` and restored on page load.
- Inline buttons are re-rendered when language changes.
- Error messages in `downloadBlob` and `sendMediaGroup` now respect the selected language.

## [4.1.0] - 2026-05-06

### Added

- Public GitHub repository with organized documentation.
- README with preview image, installation guide, usage instructions, and Telegram setup.
- MIT license file.
- GitHub release asset for direct userscript download.

### Changed

- Renamed the project to `Erome Downloader`.
- Renamed the userscript file to `erome-downloader.user.js`.
- Simplified userscript metadata header.
- Translated repository documentation to English.

### Notes

- The script requires a userscript manager such as Tampermonkey, Violentmonkey, or Greasemonkey.
- Telegram delivery requires a bot token and a valid Chat ID.
