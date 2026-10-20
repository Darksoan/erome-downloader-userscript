# Erome Downloader

A userscript for Erome that adds a modern side panel to select media, download files in bulk, and send items to Telegram. The interface is responsive and usable on desktop and mobile browsers.

## Preview

![Erome Downloader preview](preview.jpeg)

## Download

- `Latest release`: `https://github.com/Darksoan/erome-downloader-userscript/releases/latest/download/erome-downloader.user.js`

## Summary

- Adds a floating panel with Download, Telegram, and Config tabs.
- Lets you select media individually or in bulk.
- Adds inline buttons to quickly download or send each media item to Telegram.
- Stores recent Chat IDs locally for repeated use.
- Stores bot token, Chat ID, language, and recent Chat IDs locally through `GM_setValue`.
- Adapts the panel to phone screens, on-screen keyboards, rotation, and pinch zoom.

## Requirements

- A userscript manager extension: Tampermonkey, Violentmonkey, Greasemonkey, Userscripts, Stay, or another compatible manager.
- Access to `erome.com`.
- For Telegram delivery, an active Telegram bot and a valid `Chat ID`.
- Mobile browsers must allow the userscript manager to open the Erome page and make network requests.

## Installation

### Install With A Userscript Manager

1. Install a userscript manager extension, such as Tampermonkey, Violentmonkey, or Greasemonkey.
2. Open `erome-downloader.user.js`.
3. Use the release link or copy the script content into a new userscript in your extension.
4. Save and enable the script.
5. Open an Erome page and the side panel should appear.

### Compatible Extensions

- Tampermonkey: common option for Chrome, Edge, Firefox, and mobile browsers that support extensions.
- Violentmonkey: lightweight and broadly compatible, including Firefox Android.
- Greasemonkey: traditional option for Firefox.
- Userscripts and Stay: iOS managers that expose the promise-based `GM.*` API; the script includes a compatibility wrapper for these managers.
- Other userscript managers compatible with `// ==UserScript==` should also work.

## Mobile Compatibility

- The panel uses a non-modal layout: part of the page stays visible, and page scrolling remains available.
- The panel follows the visible viewport when the keyboard opens, the device rotates, or the page is zoomed.
- Touch controls have 48 px targets, and inputs use 16 px text to avoid automatic zoom on mobile browsers.
- The side launcher remains available even when the page's CSS hides or clips buttons. The manager menu command **Open Download Manager** is an alternative.
- If a request or storage API is unavailable, the panel shows a warning instead of failing silently. Credentials are not moved to page storage.
- Manual open/save links are shown when automatic saving is blocked or unavailable.

### Firefox Android

Firefox Android does not support the downloads API used by `GM_download`, so the script saves files from the tab itself:

1. Select the files and tap **Baixar Selecionados**.
2. The first file is saved automatically from that tap.
3. For each remaining file, wait for **Preparar para salvar** to finish and tap **Salvar arquivo**. That tap saves the file and advances the queue.
4. Check Firefox's Downloads list. The script can request the save but cannot confirm that Android wrote the file.

Files are prepared one at a time to avoid using excessive memory. Keep the tab open until the queue finishes.

### Other Mobile Browsers

On Chrome, Edge, and other browsers where `GM_download` works, enable the manager's browser download API when the panel recommends it:

- Violentmonkey: enable **Use browser download API** and grant the requested permission.
- Tampermonkey: set **Download Mode** to **Browser** and grant the requested downloads permission.

Reload the page after changing the manager setting. The panel shows the active download mode in the Config tab.

## Usage

1. Open an Erome page that contains media.
2. Click the side tab to open the panel.
3. In the `Download` tab, select the items you want.
4. Click `Baixar Selecionados` to download selected items in bulk.
5. In the `Telegram` tab, enter the `Chat ID` and save it.
6. In the `Config` tab, enter your bot token and save it locally.
7. Use `Enviar Selecionados` to send selected files to Telegram.
8. Use `Testar Conexão` to validate the token and Chat ID.

The interface is available in Portuguese (BR), English (US), and Spanish. Use the language selector in the `Config` tab.

## Features

- Bulk download with byte-based progress, percentage, and transferred size.
- Responsive side panel for mobile and desktop layouts.
- Firefox Android save queue with real-tap confirmation for each file after the first.
- Telegram media delivery in file groups, with single items sent as photos or videos.
- Inline media buttons for download and Telegram sending.
- Recent Chat ID history.
- Dark side-panel interface with touch-friendly controls.
- Graceful fallbacks when storage, request, or download APIs are unavailable.

## Telegram Setup

- To send media through Telegram, you need a Telegram bot and that bot's token.
- Create the bot with BotFather using the `/newbot` command, then copy the generated token.
- In Erome Downloader, open the `Config` tab, paste the token into `Token do Bot`, and click `Salvar Token`.
- The token is stored locally by the userscript manager. It is sent only to the Telegram API when testing the connection or sending media.
- `Chat ID`: enter the destination that should receive the media.
- Private user: use the numeric ID directly, for example `123456789`.
- Group or supergroup: use the full `-100` format, for example `-1001234567890`.
- Public channel or group with a username: use `@channel_name` or `@group_name`.
- If you enter a negative ID without `-100`, the script tries to normalize it automatically by adding the prefix.
- The bot must be added to the group/channel and must have permission to send media.
- Telegram accepts files up to 50 MB. Larger files are reported before they are downloaded.

## Tests

The repository includes a Playwright integration suite for mobile compatibility:

```bash
node tests/mobile-compat.cjs
```

Run the Firefox save scenarios with:

```bash
TEST_ENGINE=firefox node tests/mobile-compat.cjs
```

On Windows PowerShell:

```powershell
$env:NODE_PATH = "path\to\node_modules"
$env:TEST_ENGINE = "firefox"
node tests/mobile-compat.cjs
```

Playwright is only a test dependency; the userscript has no runtime dependencies. See `tests/VALIDATION.md` for the covered scenarios and the remaining real-device checks.

## Structure

- `erome-downloader.user.js`: main userscript.
- `README.md`: summary and usage documentation.
- `CHANGELOG.md`: version history.
- `LICENSE`: MIT license text.
- `preview.jpeg`: README preview image.
- `tests/mobile-compat.cjs`: Playwright mobile compatibility suite.
- `tests/VALIDATION.md`: test coverage, environment, and device limitations.

## License

MIT.
