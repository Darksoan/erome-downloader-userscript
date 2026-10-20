# Changelog

All notable changes to this project will be documented in this file.

## [4.3.9] - 2026-10-20

Consolidates the 4.3.x mobile-compatibility work.

### Added

- Responsive non-modal side panel for mobile browsers, with a maximum width of 520 px or 85% of the visible viewport.
- Sequential save queue for Firefox Android, including a **Save file** action for files after the first.
- Support for managers that only expose the promise-based `GM.*` API, such as Userscripts and Stay on iOS.
- `GM_registerMenuCommand` entry to open the panel when the floating launcher is hidden by the host page.
- Manager-specific guidance for enabling the browser download API in Violentmonkey and Tampermonkey.
- Manual download/open links when automatic saving is blocked or unavailable.
- Playwright mobile compatibility suite and validation notes in `tests/`.

### Changed

- Firefox Android always saves through the tab (`GM_xmlhttpRequest` -> `blob:` URL -> `<a download>`) because `GM_download` is unavailable there. Browser API mode no longer attempts it.
- The first Firefox Android file is saved from the original tap; later files wait for a real tap on **Save file** before the next file is prepared.
- The panel follows `visualViewport` height, offset, width, and zoom so it stays usable with the keyboard, rotation, and pinch zoom.
- Touch controls use at least 48 px targets and inputs use 16 px text to avoid automatic mobile zoom.
- Download progress reports transferred bytes and percentage, including indeterminate progress while the size is unknown.
- Telegram batches use groups of two files on touch devices and up to ten on desktop.
- Blob URLs are kept alive after saving so Firefox Android can finish reading the file.

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
- Send the page referrer when downloading videos to prevent CDN error pages from being saved as MP4 files.
- Allow long media transfers to run for up to 30 minutes and report Telegram's 50 MB file limit before downloading oversized files.
- Enlarge responsive sidebar previews and show byte-based download progress with percentage and transferred size.
- Keep the panel usable when the host page hides empty buttons or clips button content.
- Do not treat a blocked or unconfirmed Firefox Android save as a completed download.
- Reject HTML error pages and empty responses instead of offering them as media files.
- Keep the page clickable and scrollable while the side panel is open, without jumping on close.
- Recover from storage and request API failures without interrupting initialization.
- Prevent the Firefox Android queue from stalling after a failed transfer or an expired save gesture.

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
