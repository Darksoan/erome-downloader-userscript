# Erome Downloader

A userscript for Erome that adds a modern side panel to select media, download files in bulk, and send items to Telegram.

## Preview

![Erome Downloader preview](preview.jpeg)

## Download

- `Latest release`: `https://github.com/Darksoan/erome-downloader/releases/latest/download/erome-downloader.user.js`

## Summary

- Adds a floating panel with Download, Telegram, and Config tabs.
- Lets you select media individually or in bulk.
- Adds inline buttons to quickly download or send each media item to Telegram.
- Stores recent Chat IDs locally for repeated use.
- Uses `GM_setValue` only to store the bot token and Chat ID locally in your browser.

## Requirements

- A userscript manager extension: Tampermonkey, Violentmonkey, Greasemonkey, or another compatible manager.
- Access to `erome.com`.
- For Telegram delivery, an active Telegram bot and a valid `Chat ID`.

## Installation

### Install With A Userscript Manager

1. Install a userscript manager extension, such as Tampermonkey, Violentmonkey, or Greasemonkey.
2. Open `erome-downloader.user.js`.
3. Use the release link or copy the script content into a new userscript in your extension.
4. Save and enable the script.
5. Open an Erome page and the side panel should appear.

### Compatible Extensions

- Tampermonkey: common option for Chrome, Edge, and Firefox.
- Violentmonkey: lightweight and broadly compatible.
- Greasemonkey: traditional option for Firefox.
- Other userscript managers compatible with `// ==UserScript==` should also work.

## Usage

1. Open an Erome page that contains media.
2. Click the side tab to open the panel.
3. In the `Download` tab, select the items you want.
4. Click `Baixar Selecionados` to download selected items in bulk.
5. In the `Telegram` tab, enter the `Chat ID` and save it.
6. In the `Config` tab, enter your bot token and save it locally.
7. Use `Enviar Selecionados` to send selected files to Telegram.
8. Use `Testar Conexão` to validate the token and Chat ID.

## Features

- Bulk download with progress bar.
- Telegram media delivery in file groups.
- Inline media buttons for download and Telegram sending.
- Recent Chat ID history.
- Dark side-panel interface.

## Telegram Setup

- To send media through Telegram, you need a Telegram bot and that bot's token.
- Create the bot with BotFather using the `/newbot` command, then copy the generated token.
- In Erome Downloader, open the `Config` tab, paste the token into `Token do Bot`, and click `Salvar Token`.
- The token is stored locally by the userscript manager and is only used to call the Telegram API.
- `Chat ID`: enter the destination that should receive the media.
- Private user: use the numeric ID directly, for example `123456789`.
- Group or supergroup: use the full `-100` format, for example `-1001234567890`.
- Public channel or group with a username: use `@channel_name` or `@group_name`.
- If you enter a negative ID without `-100`, the script tries to normalize it automatically by adding the prefix.
- The bot must be added to the group/channel and must have permission to send media.

## Structure

- `erome-downloader.user.js`: main userscript.
- `README.md`: summary and usage documentation.
- `preview.jpeg`: README preview image.

## License

MIT.
