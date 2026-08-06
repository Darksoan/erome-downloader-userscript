// ==UserScript==
// @name         Erome Downloader
// @description  Download Erome media with bulk selection and Telegram delivery
// @match        https://erome.com/*
// @match        https://*.erome.com/*
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      erome.com
// @connect      *.erome.com
// @connect      api.telegram.org
// @run-at       document-end
// @version      4.2.0
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    let TELEGRAM_BOT_TOKEN = GM_getValue('tg_bot_token', '');
    let TELEGRAM_CHAT_ID = GM_getValue('tg_chat_id', '');
    let currentLang = GM_getValue('lang', 'pt-BR');

    const i18n = {
        'pt-BR': {
            title: 'Download Manager',
            close: 'Fechar',
            tabDownload: 'Download',
            tabTelegram: 'Telegram',
            tabConfig: 'Config',
            selectAll: 'Selecionar Todos',
            deselectAll: 'Desselecionar Todos',
            downloadSelected: 'Baixar Selecionados',
            chatIdLabel: 'Chat ID',
            chatIdPlaceholder: 'Ex: 123456789 ou -3953729181',
            save: 'Salvar',
            sendSelected: 'Enviar Selecionados',
            testConnection: 'Testar Conexão',
            botTokenLabel: 'Token do Bot',
            botTokenPlaceholder: '1234567890:AABBccDD...',
            saveToken: 'Salvar Token',
            tokenPrivacy: 'O token é salvo localmente via GM_setValue e enviado apenas à API do Telegram.',
            languageLabel: 'Idioma',
            counter: (n) => `${n} selecionados`,
            loadingMedia: 'Carregando mídias...',
            noMediaFound: 'Nenhuma mídia encontrada',
            noMediaFoundDesc: 'Não foi possível encontrar imagens ou vídeos nesta página.',
            openManager: 'Abrir Download Manager',
            errorConfigToken: 'Configure o Token do Bot na aba Config.',
            errorConfigChatId: 'Informe um Chat ID na aba Telegram.',
            errorConfigTokenToast: 'Configure o Token do Bot primeiro. Clique na barra rosa à direita para abrir as configurações.',
            errorConfigChatIdToast: 'Configure o Chat ID primeiro. Clique na barra rosa à direita para abrir as configurações.',
            selectAtLeastOne: 'Selecione pelo menos uma mídia para baixar.',
            selectAtLeastOneMedia: 'Selecione pelo menos uma mídia.',
            chatIdRequired: 'Digite um Chat ID válido.',
            invalidChatId: 'Chat ID inválido. Use um ID numérico ou @username válido.',
            tokenRequired: 'Token não pode ser vazio.',
            invalidToken: 'Token do Bot inválido.',
            chatIdSaved: 'Chat ID salvo!',
            chatIdConverted: (id) => ` (convertido para ${id})`,
            tokenSaved: 'Token salvo localmente!',
            testingWith: (id) => `Testando com Chat ID: ${id}...`,
            connectionSuccess: (id) => `Conexão bem-sucedida! (ID: ${id})`,
            connectionError: (desc, id) => `Erro: ${desc} (ID usado: ${id})`,
            invalidApiResponse: 'Resposta inválida da API.',
            networkError: 'Falha de rede ao conectar com o Telegram.',
            downloadStarted: (name) => `Download iniciado: ${name}`,
            filesDownloaded: (n) => `${n} arquivo(s) enviado(s) para download!`,
            downloadFallbackStarted: (name) => `Fallback iniciado no navegador: ${name}`,
            sendingFile: (name) => `Enviando ${name}...`,
            sent: (name) => `Enviado: ${name}`,
            sendError: (msg) => `Erro ao enviar: ${msg}`,
            downloadError: (msg) => `Erro ao baixar: ${msg}`,
            downloadBlobError: 'Falha ao baixar a mídia do Erome',
            preparingSend: (n) => `Preparando envio de ${n} arquivo(s)...`,
            downloadingGroup: (cur, total, count) => `Baixando grupo ${cur}/${total} (${count} arquivos)...`,
            sendingGroup: (cur, total) => `Enviando grupo ${cur}/${total}...`,
            allSent: (n, groups) => `${n} arquivo(s) enviado(s) com sucesso em ${groups} grupo(s)!`,
            partialSent: (ok, err) => `${ok} enviado(s), ${err} erro(s). Veja o console (F12).`,
            filesDownloadResult: (ok, fallback, err) => `${ok} concluído(s), ${fallback} fallback(s) iniciado(s), ${err} erro(s).`,
            groupError: (num, msg) => `Erro no grupo ${num}: ${msg}`,
            groupDownloadError: (num, error) => `Erro ao baixar grupo ${num}: ${error}`,
            sendSuccess: 'Enviado com sucesso',
            sendErrorTitle: 'Erro ao enviar',
            downloadErrorTitle: 'Erro ao baixar',
            configNeeded: 'Configuração necessária',
            tgConnected: 'Erome Download Manager conectado com sucesso!',
            downloadBtn: '↓',
            telegramBtn: '➤',
            downloadBtnDone: '✓',
            downloadBtnFail: '✕',
            inlineDownloadTitle: 'Download',
            inlineTelegramTitle: 'Enviar para Telegram',
            previewAlt: 'Preview',
            downloadProgressAria: 'Progresso do download',
            nonOkHttpStatus: (status) => `Download falhou (HTTP ${status})`,
            parseError: 'Falha ao parsear resposta do Telegram',
            uploadNetworkError: 'Erro de rede no upload',
            telegramFileTooLarge: (size) => `O arquivo tem ${size} MB; a API de bots do Telegram aceita até 50 MB.`,
            requestTimeout: 'A requisição excedeu o tempo limite.',
        },
        'en-US': {
            title: 'Download Manager',
            close: 'Close',
            tabDownload: 'Download',
            tabTelegram: 'Telegram',
            tabConfig: 'Config',
            selectAll: 'Select All',
            deselectAll: 'Deselect All',
            downloadSelected: 'Download Selected',
            chatIdLabel: 'Chat ID',
            chatIdPlaceholder: 'Ex: 123456789 or -3953729181',
            save: 'Save',
            sendSelected: 'Send Selected',
            testConnection: 'Test Connection',
            botTokenLabel: 'Bot Token',
            botTokenPlaceholder: '1234567890:AABBccDD...',
            saveToken: 'Save Token',
            tokenPrivacy: 'The token is saved locally via GM_setValue and sent only to the Telegram API.',
            languageLabel: 'Language',
            counter: (n) => `${n} selected`,
            loadingMedia: 'Loading media...',
            noMediaFound: 'No media found',
            noMediaFoundDesc: 'Could not find images or videos on this page.',
            openManager: 'Open Download Manager',
            errorConfigToken: 'Configure the Bot Token in the Config tab.',
            errorConfigChatId: 'Enter a Chat ID in the Telegram tab.',
            errorConfigTokenToast: 'Configure the Bot Token first. Click the pink bar on the right to open settings.',
            errorConfigChatIdToast: 'Configure the Chat ID first. Click the pink bar on the right to open settings.',
            selectAtLeastOne: 'Select at least one media to download.',
            selectAtLeastOneMedia: 'Select at least one media.',
            chatIdRequired: 'Enter a valid Chat ID.',
            invalidChatId: 'Invalid Chat ID. Use a numeric ID or a valid @username.',
            tokenRequired: 'Token cannot be empty.',
            invalidToken: 'Invalid Bot Token.',
            chatIdSaved: 'Chat ID saved!',
            chatIdConverted: (id) => ` (converted to ${id})`,
            tokenSaved: 'Token saved locally!',
            testingWith: (id) => `Testing with Chat ID: ${id}...`,
            connectionSuccess: (id) => `Connection successful! (ID: ${id})`,
            connectionError: (desc, id) => `Error: ${desc} (ID used: ${id})`,
            invalidApiResponse: 'Invalid API response.',
            networkError: 'Network error connecting to Telegram.',
            downloadStarted: (name) => `Download started: ${name}`,
            filesDownloaded: (n) => `${n} file(s) sent for download!`,
            downloadFallbackStarted: (name) => `Browser fallback started: ${name}`,
            sendingFile: (name) => `Sending ${name}...`,
            sent: (name) => `Sent: ${name}`,
            sendError: (msg) => `Error sending: ${msg}`,
            downloadError: (msg) => `Download error: ${msg}`,
            downloadBlobError: 'Failed to download media from Erome',
            preparingSend: (n) => `Preparing to send ${n} file(s)...`,
            downloadingGroup: (cur, total, count) => `Downloading group ${cur}/${total} (${count} files)...`,
            sendingGroup: (cur, total) => `Sending group ${cur}/${total}...`,
            allSent: (n, groups) => `${n} file(s) sent successfully in ${groups} group(s)!`,
            partialSent: (ok, err) => `${ok} sent, ${err} error(s). Check console (F12).`,
            filesDownloadResult: (ok, fallback, err) => `${ok} completed, ${fallback} fallback(s) started, ${err} error(s).`,
            groupError: (num, msg) => `Error in group ${num}: ${msg}`,
            groupDownloadError: (num, error) => `Error downloading group ${num}: ${error}`,
            sendSuccess: 'Sent successfully',
            sendErrorTitle: 'Error sending',
            downloadErrorTitle: 'Download error',
            configNeeded: 'Configuration required',
            tgConnected: 'Erome Download Manager connected successfully!',
            downloadBtn: '↓',
            telegramBtn: '➤',
            downloadBtnDone: '✓',
            downloadBtnFail: '✕',
            inlineDownloadTitle: 'Download',
            inlineTelegramTitle: 'Send to Telegram',
            previewAlt: 'Preview',
            downloadProgressAria: 'Download progress',
            nonOkHttpStatus: (status) => `Download failed (HTTP ${status})`,
            parseError: 'Failed to parse Telegram response',
            uploadNetworkError: 'Network error on upload',
            telegramFileTooLarge: (size) => `The file is ${size} MB; the Telegram Bot API accepts up to 50 MB.`,
            requestTimeout: 'The request timed out.',
        },
        'es': {
            title: 'Gestor de Descargas',
            close: 'Cerrar',
            tabDownload: 'Descargar',
            tabTelegram: 'Telegram',
            tabConfig: 'Config',
            selectAll: 'Seleccionar Todos',
            deselectAll: 'Deseleccionar Todos',
            downloadSelected: 'Descargar Seleccionados',
            chatIdLabel: 'Chat ID',
            chatIdPlaceholder: 'Ej: 123456789 o -3953729181',
            save: 'Guardar',
            sendSelected: 'Enviar Seleccionados',
            testConnection: 'Probar Conexión',
            botTokenLabel: 'Token del Bot',
            botTokenPlaceholder: '1234567890:AABBccDD...',
            saveToken: 'Guardar Token',
            tokenPrivacy: 'El token se guarda localmente vía GM_setValue y solo se envía a la API de Telegram.',
            languageLabel: 'Idioma',
            counter: (n) => `${n} seleccionados`,
            loadingMedia: 'Cargando medios...',
            noMediaFound: 'No se encontraron medios',
            noMediaFoundDesc: 'No se pudieron encontrar imágenes o videos en esta página.',
            openManager: 'Abrir Gestor de Descargas',
            errorConfigToken: 'Configure el Token del Bot en la pestaña Config.',
            errorConfigChatId: 'Ingrese un Chat ID en la pestaña Telegram.',
            errorConfigTokenToast: 'Configure el Token del Bot primero. Haga clic en la barra rosa a la derecha para abrir la configuración.',
            errorConfigChatIdToast: 'Configure el Chat ID primero. Haga clic en la barra rosa a la derecha para abrir la configuración.',
            selectAtLeastOne: 'Seleccione al menos un medio para descargar.',
            selectAtLeastOneMedia: 'Seleccione al menos un medio.',
            chatIdRequired: 'Ingrese un Chat ID válido.',
            invalidChatId: 'Chat ID inválido. Use un ID numérico o @username válido.',
            tokenRequired: 'El Token no puede estar vacío.',
            invalidToken: 'Token del Bot inválido.',
            chatIdSaved: '¡Chat ID guardado!',
            chatIdConverted: (id) => ` (convertido a ${id})`,
            tokenSaved: '¡Token guardado localmente!',
            testingWith: (id) => `Probando con Chat ID: ${id}...`,
            connectionSuccess: (id) => `¡Conexión exitosa! (ID: ${id})`,
            connectionError: (desc, id) => `Error: ${desc} (ID usado: ${id})`,
            invalidApiResponse: 'Respuesta de API inválida.',
            networkError: 'Error de red al conectar con Telegram.',
            downloadStarted: (name) => `Descarga iniciada: ${name}`,
            filesDownloaded: (n) => `¡${n} archivo(s) enviado(s) para descarga!`,
            downloadFallbackStarted: (name) => `Fallback iniciado en el navegador: ${name}`,
            sendingFile: (name) => `Enviando ${name}...`,
            sent: (name) => `Enviado: ${name}`,
            sendError: (msg) => `Error al enviar: ${msg}`,
            downloadError: (msg) => `Error al descargar: ${msg}`,
            downloadBlobError: 'Error al descargar el medio de Erome',
            preparingSend: (n) => `Preparando envío de ${n} archivo(s)...`,
            downloadingGroup: (cur, total, count) => `Descargando grupo ${cur}/${total} (${count} archivos)...`,
            sendingGroup: (cur, total) => `Enviando grupo ${cur}/${total}...`,
            allSent: (n, groups) => `¡${n} archivo(s) enviado(s) con éxito en ${groups} grupo(s)!`,
            partialSent: (ok, err) => `${ok} enviado(s), ${err} error(es). Vea la consola (F12).`,
            filesDownloadResult: (ok, fallback, err) => `${ok} completada(s), ${fallback} fallback(s) iniciado(s), ${err} error(es).`,
            groupError: (num, msg) => `Error en grupo ${num}: ${msg}`,
            groupDownloadError: (num, error) => `Error al descargar grupo ${num}: ${error}`,
            sendSuccess: 'Enviado con éxito',
            sendErrorTitle: 'Error al enviar',
            downloadErrorTitle: 'Error de descarga',
            configNeeded: 'Configuración necesaria',
            tgConnected: '¡Erome Download Manager conectado con éxito!',
            downloadBtn: '↓',
            telegramBtn: '➤',
            downloadBtnDone: '✓',
            downloadBtnFail: '✕',
            inlineDownloadTitle: 'Descargar',
            inlineTelegramTitle: 'Enviar a Telegram',
            previewAlt: 'Vista previa',
            downloadProgressAria: 'Progreso de descarga',
            nonOkHttpStatus: (status) => `Descarga fallida (HTTP ${status})`,
            parseError: 'Error al procesar respuesta de Telegram',
            uploadNetworkError: 'Error de red en la subida',
            telegramFileTooLarge: (size) => `El archivo tiene ${size} MB; la API de bots de Telegram acepta hasta 50 MB.`,
            requestTimeout: 'La solicitud excedió el tiempo límite.',
        }
    };

    const t = (key, ...args) => {
        const lang = i18n[currentLang] ? currentLang : 'pt-BR';
        const val = i18n[lang][key] || i18n['pt-BR'][key];
        if (typeof val === 'function') return val(...args);
        return val;
    };

    const COLORS = {
        background: '#000000',
        primary: '#ef5f96',
        text: '#ffffff',
        textSecondary: '#aaaaaa',
        border: '#333333',
        hover: '#ff6fa8',
        success: '#4caf50',
        error: '#f44336',
        cardBg: '#1a1a1a',
        telegram: '#229ED9'
    };

    const MAX_CONCURRENT_DOWNLOADS = 3;
    const MEDIA_METADATA_TIMEOUT = 15000;
    const MEDIA_TRANSFER_TIMEOUT = 30 * 60 * 1000;
    const TELEGRAM_REQUEST_TIMEOUT = 120000;
    const TELEGRAM_FILE_LIMIT_BYTES = 50 * 1000 * 1000;
    let mediaItems = [];
    let selectedItems = new Set();

    const normalizeChatId = (id) => {
        const str = String(id).trim();
        if (!str) return str;
        if (str.startsWith('@')) return str;
        if (!/^-?\d+$/.test(str)) return str;
        if (!str.startsWith('-')) return str;
        const digits = str.replace(/^-/, '');
        if (digits.startsWith('100')) return str;
        return `-100${digits}`;
    };

    const isValidToken = (token) => /^\d+:[A-Za-z0-9_-]+$/.test(String(token).trim());
    const isValidChatId = (id) => {
        const value = String(id).trim();
        return /^-?\d+$/.test(value) || /^@[A-Za-z0-9_]{5,32}$/.test(value);
    };

    const injectStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            #erome-modal-overlay {
                display: none; position: fixed; top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0,0,0,0.7); z-index: 999999;
                animation: fadeIn 0.2s ease;
            }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideInRight  { from { transform: translateX(100%); } to { transform: translateX(0); } }
            @keyframes slideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }

            #erome-modal {
                position: fixed; top: 0; right: 0; height: 100vh;
                background: ${COLORS.background};
                border-left: 2px solid ${COLORS.primary};
                width: 520px; max-width: 100vw;
                display: flex; flex-direction: column;
                animation: slideInRight 0.3s ease;
            }
            #erome-modal.closing { animation: slideOutRight 0.25s ease forwards; }

            #erome-modal-header {
                padding: 20px; border-bottom: 1px solid ${COLORS.border};
                background: ${COLORS.background};
            }
            #erome-modal-title {
                font-size: 18px; font-weight: 600; color: ${COLORS.text};
                margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;
            }
            #erome-modal-close {
                background: transparent; border: 1px solid ${COLORS.border};
                color: ${COLORS.text}; font-size: 14px; width: 100%; height: 36px;
                border-radius: 4px; cursor: pointer; display: flex;
                align-items: center; justify-content: center;
                transition: all 0.2s ease; font-weight: 500; margin-top: 12px;
            }
            #erome-modal-close:hover {
                background: ${COLORS.cardBg}; border-color: ${COLORS.primary}; color: ${COLORS.primary};
            }
            #erome-modal-controls {
                padding: 16px 20px; border-bottom: 1px solid ${COLORS.border};
                display: flex; flex-direction: column; gap: 8px;
                background: ${COLORS.background};
            }
            .erome-tabs { display: flex; gap: 4px; margin-bottom: 4px; }
            .erome-tab {
                flex: 1; padding: 8px; border: 1px solid ${COLORS.border};
                background: transparent; color: ${COLORS.textSecondary};
                border-radius: 4px; cursor: pointer; font-size: 12px;
                font-weight: 600; transition: all 0.2s ease; text-align: center;
            }
            .erome-tab.active {
                background: ${COLORS.primary}; border-color: ${COLORS.primary};
                color: ${COLORS.background};
            }
            .erome-tab-panel { display: none; }
            .erome-tab-panel.active { display: flex; flex-direction: column; gap: 8px; }

            .erome-btn {
                padding: 10px 16px; border: 1px solid ${COLORS.border};
                background: transparent; color: ${COLORS.text}; border-radius: 4px;
                cursor: pointer; font-weight: 500; font-size: 13px;
                transition: all 0.2s ease; display: flex;
                align-items: center; justify-content: center; gap: 6px; width: 100%;
            }
            .erome-btn:hover { background: ${COLORS.cardBg}; border-color: ${COLORS.primary}; color: ${COLORS.primary}; }
            .erome-btn-primary { background: ${COLORS.primary}; color: ${COLORS.background}; border-color: ${COLORS.primary}; }
            .erome-btn-primary:hover { background: ${COLORS.hover}; border-color: ${COLORS.hover}; color: ${COLORS.background}; }
            .erome-btn-telegram { background: ${COLORS.telegram}; color: #fff; border-color: ${COLORS.telegram}; }
            .erome-btn-telegram:hover { background: #1a8bbf; border-color: #1a8bbf; color: #fff; }
            .erome-btn:disabled { opacity: 0.4; cursor: not-allowed; }
            .erome-btn-loading { position: relative; pointer-events: none; color: transparent !important; }
            .erome-btn-loading::after {
                content: ''; position: absolute; width: 14px; height: 14px;
                top: 50%; left: 50%; margin: -7px 0 0 -7px;
                border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
                border-radius: 50%; animation: spin 0.6s linear infinite;
            }

            .erome-input-group { display: flex; flex-direction: column; gap: 4px; }
            .erome-input-label {
                font-size: 11px; color: ${COLORS.textSecondary}; font-weight: 600;
                text-transform: uppercase; letter-spacing: 0.5px;
                display: flex; align-items: center; gap: 5px;
            }
            .erome-label-icon { flex-shrink: 0; }
            .erome-input {
                padding: 9px 12px; background: ${COLORS.cardBg};
                border: 1px solid ${COLORS.border}; border-radius: 4px;
                color: ${COLORS.text}; font-size: 13px; width: 100%;
                box-sizing: border-box; transition: border-color 0.2s ease; outline: none;
            }
            .erome-input:focus { border-color: ${COLORS.primary}; }
            .erome-input-select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${COLORS.textSecondary}' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
            .erome-input-row { display: flex; gap: 8px; align-items: flex-end; }
            .erome-input-row .erome-input-group { flex: 1; }
            .erome-input-row .erome-btn { width: auto; padding: 9px 14px; white-space: nowrap; flex-shrink: 0; }

            .erome-chat-history { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }
            .erome-chat-tag {
                display: inline-flex; align-items: center; gap: 8px; padding: 4px 10px;
                background: ${COLORS.cardBg}; border: 1px solid ${COLORS.border};
                border-radius: 12px; font-size: 11px; color: ${COLORS.textSecondary};
                cursor: pointer; transition: all 0.2s ease;
            }
            .erome-chat-tag:hover { border-color: ${COLORS.border}; }
            .erome-chat-tag-remove {
                background: transparent;
                border: 0;
                color: ${COLORS.textSecondary};
                font-size: 18px;
                font-weight: 300;
                line-height: 1;
                cursor: pointer;
                transition: all 0.2s ease;
                padding: 0;
                margin: 0;
            }
            .erome-chat-tag-remove:hover {
                color: ${COLORS.text};
            }

            #erome-modal-content { padding: 18px; overflow-y: auto; flex: 1; }
            #erome-modal-content::-webkit-scrollbar { width: 8px; }
            #erome-modal-content::-webkit-scrollbar-track { background: ${COLORS.background}; }
            #erome-modal-content::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 4px; }
            #erome-modal-content::-webkit-scrollbar-thumb:hover { background: ${COLORS.primary}; }

            .erome-media-item {
                display: flex; align-items: center; padding: 12px; margin-bottom: 10px;
                background: ${COLORS.cardBg}; border: 1px solid ${COLORS.border};
                border-radius: 4px; transition: all 0.2s ease; cursor: pointer;
            }
            .erome-media-item:hover { border-color: ${COLORS.primary}; }
            .erome-media-item.selected { border-color: ${COLORS.primary}; background: #1a0d13; }

            .erome-checkbox {
                width: 20px; height: 20px; min-width: 20px;
                border: 1px solid ${COLORS.border}; border-radius: 3px; margin-right: 12px;
                display: flex; align-items: center; justify-content: center;
                background: transparent; transition: all 0.2s ease;
            }
            .erome-media-item.selected .erome-checkbox { background: ${COLORS.primary}; border-color: ${COLORS.primary}; }
            .erome-checkbox::after { content: '✓'; color: ${COLORS.background}; font-weight: bold; font-size: 14px; display: none; }
            .erome-media-item.selected .erome-checkbox::after { display: block; }

            .erome-media-preview {
                width: clamp(112px, 28vw, 150px); aspect-ratio: 3 / 2; object-fit: cover;
                flex-shrink: 0; border-radius: 4px; margin-right: 12px;
                border: 1px solid ${COLORS.border}; background: ${COLORS.cardBg};
            }
            .erome-media-info { flex: 1; min-width: 0; }
            .erome-media-type {
                display: inline-block; padding: 2px 8px; background: ${COLORS.primary};
                color: ${COLORS.background}; border-radius: 3px; font-size: 10px;
                font-weight: 600; margin-bottom: 4px; text-transform: uppercase;
            }
            .erome-media-url {
                color: ${COLORS.textSecondary}; font-size: 11px; word-break: break-all;
                line-height: 1.3; overflow: hidden; text-overflow: ellipsis;
                display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
            }
            .erome-loading { text-align: center; padding: 40px 20px; color: ${COLORS.textSecondary}; font-size: 14px; }
            .erome-spinner {
                border: 2px solid ${COLORS.border}; border-top: 2px solid ${COLORS.primary};
                border-radius: 50%; width: 40px; height: 40px;
                animation: spin 0.8s linear infinite; margin: 0 auto 16px;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

            #erome-sidebar-trigger {
                position: fixed; top: 0; right: 0; width: 4px; height: 100vh;
                background: ${COLORS.primary}; z-index: 999998; cursor: pointer;
                transition: width 0.2s ease;
            }
            #erome-sidebar-trigger:hover { width: 8px; }
            #erome-sidebar-trigger::before {
                content: '⬅'; position: absolute; left: -32px; top: 50%;
                transform: translateY(-50%); background: ${COLORS.primary};
                color: ${COLORS.background}; width: 32px; height: 60px;
                display: flex; align-items: center; justify-content: center;
                border-radius: 4px 0 0 4px; font-size: 16px; opacity: 1;
                transition: opacity 0.2s ease;
            }
            #erome-sidebar-trigger:hover::before { opacity: 1; }

            .erome-counter {
                background: ${COLORS.cardBg}; color: ${COLORS.primary}; padding: 8px 12px;
                border-radius: 4px; font-size: 13px; font-weight: 600;
                border: 1px solid ${COLORS.border}; text-align: center; width: 100%;
            }
            .erome-empty { text-align: center; padding: 60px 20px; color: ${COLORS.textSecondary}; }

            #erome-notification {
                display: none; padding: 10px 14px; border-radius: 4px; font-size: 13px;
                font-weight: 500; text-align: center; border: 1px solid transparent;
            }
            #erome-notification.info    { background: #1a2a3a; border-color: #2a5080; color: #7eb8f7; display: block; }
            #erome-notification.success { background: #1a2e1a; border-color: #2e6b2e; color: ${COLORS.success}; display: block; }
            #erome-notification.error   { background: #2e1a1a; border-color: #6b2e2e; color: ${COLORS.error}; display: block; }

            #erome-progress-bar-wrap {
                display: none; position: relative; height: 24px; background: ${COLORS.cardBg};
                border: 1px solid ${COLORS.border}; border-radius: 4px; overflow: hidden;
            }
            #erome-progress-bar-wrap.visible { display: block; }
            #erome-progress-bar {
                position: absolute; inset: 0 auto 0 0; height: 100%; background: ${COLORS.primary};
                width: 0%; transition: width 0.15s linear;
            }
            #erome-progress-bar.indeterminate {
                width: 35% !important; animation: eromeProgressIndeterminate 1.1s ease-in-out infinite;
            }
            #erome-progress-label {
                position: relative; z-index: 1; display: flex; align-items: center;
                justify-content: center; height: 100%; color: ${COLORS.text}; font-size: 11px;
                font-weight: 600; letter-spacing: 0.1px; text-shadow: 0 1px 2px #000;
            }
            @keyframes eromeProgressIndeterminate {
                from { left: -35%; }
                to { left: 100%; }
            }
            .erome-divider { border: none; border-top: 1px solid ${COLORS.border}; margin: 4px 0; }

            /* Botões inline no site */
            .erome-inline-actions {
                position: absolute;
                bottom: 48px;
                right: 8px;
                display: flex;
                gap: 4px;
                z-index: 100;
            }
            .erome-inline-btn {
                width: 32px;
                height: 32px;
                padding: 0;
                border: 1px solid rgba(255,255,255,0.3);
                background: rgba(0,0,0,0.8);
                color: #fff;
                border-radius: 0;
                cursor: pointer;
                font-size: 14px;
                font-weight: 400;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                backdrop-filter: blur(8px);
            }
            .erome-inline-btn:hover {
                background: rgba(0,0,0,0.95);
            }
            .erome-inline-btn.download:hover {
                border-color: ${COLORS.primary};
                background: ${COLORS.primary};
                color: #000;
            }
            .erome-inline-btn.telegram:hover {
                border-color: ${COLORS.telegram};
                background: ${COLORS.telegram};
                color: #fff;
            }
            .erome-inline-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .erome-inline-btn.loading {
                position: relative;
                color: transparent !important;
                pointer-events: none;
            }
            .erome-inline-btn.loading::after {
                content: '';
                position: absolute;
                width: 14px;
                height: 14px;
                top: 50%;
                left: 50%;
                margin: -7px 0 0 -7px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: #fff;
                border-radius: 50%;
                animation: spin 0.6s linear infinite;
            }
            .media-group .video,
            .media-group .img {
                position: relative;
            }

            /* Toast notifications */
            .erome-toast {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: ${COLORS.cardBg};
                color: ${COLORS.text};
                padding: 16px 20px;
                border-radius: 6px;
                border: 1px solid ${COLORS.border};
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                z-index: 1000000;
                min-width: 300px;
                max-width: 400px;
                animation: slideInUp 0.3s ease;
                backdrop-filter: blur(10px);
            }
            .erome-toast.error {
                border-color: ${COLORS.error};
                background: rgba(244, 67, 54, 0.15);
            }
            .erome-toast.success {
                border-color: ${COLORS.success};
                background: rgba(76, 175, 80, 0.15);
            }
            .erome-toast.info {
                border-color: ${COLORS.telegram};
                background: rgba(34, 158, 217, 0.15);
            }
            .erome-toast-title {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
            }
            .erome-toast-message {
                font-size: 12px;
                color: ${COLORS.textSecondary};
                line-height: 1.4;
            }
            .erome-toast.closing {
                animation: slideOutDown 0.3s ease;
            }
            @keyframes slideInUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutDown {
                from {
                    transform: translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateY(100%);
                    opacity: 0;
                }
            }

            @media (max-width: 560px) {
                #erome-modal { width: 100vw; border-left: 0; }
                #erome-modal-header { padding: 16px; }
                #erome-modal-controls { padding: 12px 16px; }
                #erome-modal-content { padding: 12px; }
                .erome-media-item { padding: 10px; }
                .erome-media-preview { width: 112px; margin-right: 10px; }
                .erome-checkbox { margin-right: 10px; }
            }


        `;
        document.head.appendChild(style);
    };

    const createSidebarTrigger = () => {
        const trigger = document.createElement('div');
        trigger.id = 'erome-sidebar-trigger';
        trigger.title = t('openManager');
        trigger.onclick = openModal;
        document.body.appendChild(trigger);
    };

    const getChatHistory = () => {
        try {
            const stored = GM_getValue('tg_chat_history', '[]');
            const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
            if (!Array.isArray(parsed)) return [];
            return parsed
                .filter(chat => chat && typeof chat.id === 'string' && typeof chat.label === 'string')
                .slice(0, 10);
        } catch (error) {
            console.warn('[Erome Downloader] Invalid chat history:', error);
            return [];
        }
    };

    const saveChatToHistory = (id, label) => {
        const history = getChatHistory();
        if (!history.find(c => c.id === id)) {
            history.unshift({ id, label: label || id });
            GM_setValue('tg_chat_history', JSON.stringify(history.slice(0, 10)));
        }
        renderChatHistory();
    };

    const removeChatFromHistory = (id) => {
        GM_setValue('tg_chat_history', JSON.stringify(getChatHistory().filter(c => c.id !== id)));
        renderChatHistory();
    };

    const renderChatHistory = () => {
        const container = document.getElementById('erome-chat-history');
        if (!container) return;
        container.innerHTML = '';
        getChatHistory().forEach(chat => {
            const tag = document.createElement('span');
            tag.className = 'erome-chat-tag';
            const label = document.createElement('span');
            label.textContent = chat.label;
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'erome-chat-tag-remove';
            remove.textContent = '×';
            remove.setAttribute('aria-label', 'Remove chat');
            tag.append(label, remove);
            label.onclick = () => {
                document.getElementById('erome-chat-id-input').value = chat.id;
                TELEGRAM_CHAT_ID = chat.id;
                GM_setValue('tg_chat_id', chat.id);
            };
            remove.onclick = (e) => {
                e.stopPropagation();
                removeChatFromHistory(chat.id);
            };
            container.appendChild(tag);
        });
    };

    const createModal = () => {
        const overlay = document.createElement('div');
        overlay.id = 'erome-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

        const modal = document.createElement('div');
        modal.id = 'erome-modal';
        modal.innerHTML = `
            <div id="erome-modal-header">
                <h2 id="erome-modal-title">${t('title')}</h2>
                <div class="erome-counter" id="erome-counter">${t('counter', 0)}</div>
                <button id="erome-modal-close">${t('close')}</button>
            </div>

            <div id="erome-modal-controls">
                <div id="erome-notification"></div>
                <div id="erome-progress-bar-wrap" role="progressbar" aria-label="${t('downloadProgressAria')}">
                    <div id="erome-progress-bar"></div>
                    <span id="erome-progress-label">0%</span>
                </div>

                <div class="erome-tabs">
                    <button class="erome-tab active" data-tab="download">${t('tabDownload')}</button>
                    <button class="erome-tab"        data-tab="telegram">${t('tabTelegram')}</button>
                    <button class="erome-tab"        data-tab="config">${t('tabConfig')}</button>
                </div>

                <!-- Aba Download -->
                <div class="erome-tab-panel active" id="tab-download">
                    <button class="erome-btn" id="erome-select-all">${t('selectAll')}</button>
                    <button class="erome-btn" id="erome-deselect-all">${t('deselectAll')}</button>
                    <button class="erome-btn erome-btn-primary" id="erome-download-selected">${t('downloadSelected')}</button>
                </div>

                <!-- Aba Telegram -->
                <div class="erome-tab-panel" id="tab-telegram">
                    <div class="erome-input-row">
                        <div class="erome-input-group">
                            <label class="erome-input-label" id="label-chat-id">${t('chatIdLabel')}</label>
                            <input id="erome-chat-id-input" class="erome-input"
                               placeholder="${t('chatIdPlaceholder')}" />
                        </div>
                        <button class="erome-btn erome-btn-telegram" id="erome-save-chat-id">${t('save')}</button>
                    </div>

                    <div id="erome-chat-history" class="erome-chat-history"></div>
                    <hr class="erome-divider">
                    <button class="erome-btn erome-btn-telegram" id="erome-send-telegram">${t('sendSelected')}</button>
                    <button class="erome-btn" id="erome-test-telegram" style="font-size:12px;">${t('testConnection')}</button>
                </div>

                <!-- Aba Config -->
                <div class="erome-tab-panel" id="tab-config">
                    <div class="erome-input-group">
                        <label class="erome-input-label" id="label-language">
                            <svg class="erome-label-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                            <span>${t('languageLabel')}</span>
                        </label>
                        <select id="erome-lang-select" class="erome-input erome-input-select" style="cursor:pointer;">
                            <option value="pt-BR" ${currentLang === 'pt-BR' ? 'selected' : ''}>Português (BR)</option>
                            <option value="en-US" ${currentLang === 'en-US' ? 'selected' : ''}>English (US)</option>
                            <option value="es" ${currentLang === 'es' ? 'selected' : ''}>Español</option>
                        </select>
                    </div>
                    <div class="erome-input-group">
                        <label class="erome-input-label" id="label-bot-token">${t('botTokenLabel')}</label>
                        <input id="erome-bot-token-input" class="erome-input" type="password"
                               placeholder="${t('botTokenPlaceholder')}" />
                    </div>
                    <button class="erome-btn erome-btn-primary" id="erome-save-token">${t('saveToken')}</button>
                    <p id="p-token-privacy" style="font-size:11px;color:${COLORS.textSecondary};margin:0;">
                        ${t('tokenPrivacy')}
                    </p>
                </div>
            </div>

            <div id="erome-modal-content">
                <div class="erome-loading">
                    <div class="erome-spinner"></div>
                    ${t('loadingMedia')}
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById('erome-chat-id-input').value = TELEGRAM_CHAT_ID;
        document.getElementById('erome-bot-token-input').value = TELEGRAM_BOT_TOKEN;

        document.getElementById('erome-modal-close').onclick = closeModal;

        modal.querySelectorAll('.erome-tab').forEach(tab => {
            tab.onclick = () => {
                modal.querySelectorAll('.erome-tab').forEach(t => t.classList.remove('active'));
                modal.querySelectorAll('.erome-tab-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
            };
        });

        document.getElementById('erome-select-all').onclick = selectAll;
        document.getElementById('erome-deselect-all').onclick = deselectAll;
        document.getElementById('erome-download-selected').onclick = downloadSelected;

        document.getElementById('erome-save-chat-id').onclick = () => {
            const val = document.getElementById('erome-chat-id-input').value.trim();
            if (!val) { showNotification(t('chatIdRequired'), 'error', 3000); return; }
            const normalized = normalizeChatId(val);
            if (!isValidChatId(normalized)) {
                showNotification(t('invalidChatId'), 'error', 3000);
                return;
            }
            TELEGRAM_CHAT_ID = normalized;
            GM_setValue('tg_chat_id', normalized);
            saveChatToHistory(normalized, val);
            const changed = normalized !== val ? t('chatIdConverted', normalized) : '';
            showNotification(`${t('chatIdSaved')}${changed}`, 'success', 3500);
        };

        document.getElementById('erome-send-telegram').onclick = sendToTelegram;
        document.getElementById('erome-test-telegram').onclick = testTelegramConnection;

        document.getElementById('erome-save-token').onclick = () => {
            const val = document.getElementById('erome-bot-token-input').value.trim();
            if (!val) { showNotification(t('tokenRequired'), 'error', 3000); return; }
            if (!isValidToken(val)) {
                showNotification(t('invalidToken'), 'error', 3000);
                return;
            }
            TELEGRAM_BOT_TOKEN = val;
            GM_setValue('tg_bot_token', val);
            showNotification(t('tokenSaved'), 'success', 2500);
        };

        document.getElementById('erome-lang-select').onchange = (e) => {
            currentLang = e.target.value;
            GM_setValue('lang', currentLang);
            refreshModalTexts();
        };

        renderChatHistory();
    };

    const showNotification = (message, type = 'info', autoDismissMs = 0) => {
        const el = document.getElementById('erome-notification');
        if (!el) return;
        el.textContent = message;
        el.className = type;
        if (autoDismissMs > 0) {
            clearTimeout(el._timer);
            el._timer = setTimeout(() => { el.className = ''; }, autoDismissMs);
        }
    };

    const showToast = (title, message, type = 'info', duration = 4000) => {
        const toast = document.createElement('div');
        toast.className = `erome-toast ${type}`;
        const titleEl = document.createElement('div');
        titleEl.className = 'erome-toast-title';
        titleEl.textContent = String(title);
        const messageEl = document.createElement('div');
        messageEl.className = 'erome-toast-message';
        messageEl.textContent = String(message);
        toast.append(titleEl, messageEl);

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('closing');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    };

    let progressHideTimer;
    let progressOperationId = 0;

    const beginProgressOperation = () => ++progressOperationId;
    const isCurrentProgressOperation = (operationId) => operationId === progressOperationId;

    const getProgressElements = () => ({
        wrap: document.getElementById('erome-progress-bar-wrap'),
        bar: document.getElementById('erome-progress-bar'),
        label: document.getElementById('erome-progress-label')
    });

    const hideProgress = (delay = 0, operationId = progressOperationId) => {
        if (!isCurrentProgressOperation(operationId)) return;
        clearTimeout(progressHideTimer);
        const { wrap, bar, label } = getProgressElements();
        if (!wrap || !bar || !label) return;
        const hide = () => {
            if (!isCurrentProgressOperation(operationId)) return;
            wrap.classList.remove('visible');
            bar.classList.remove('indeterminate');
            bar.style.width = '0%';
            label.textContent = '0%';
        };
        if (delay > 0) progressHideTimer = setTimeout(hide, delay);
        else hide();
    };

    const setProgress = (done, total, operationId = progressOperationId) => {
        if (!isCurrentProgressOperation(operationId)) return;
        clearTimeout(progressHideTimer);
        const { wrap, bar, label } = getProgressElements();
        if (!wrap || !bar || !label) return;
        if (total <= 0) { hideProgress(0, operationId); return; }
        const percentage = Math.min(100, Math.max(0, Math.round((done / total) * 100)));
        wrap.classList.add('visible');
        wrap.setAttribute('aria-valuemin', '0');
        wrap.setAttribute('aria-valuemax', String(total));
        wrap.setAttribute('aria-valuenow', String(done));
        bar.classList.remove('indeterminate');
        bar.style.width = `${percentage}%`;
        label.textContent = `${percentage}%`;
        if (done >= total) hideProgress(900, operationId);
    };

    const formatBytes = (bytes) => {
        const value = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
        if (value < 1000) return `${Math.round(value)} B`;
        const units = ['KB', 'MB', 'GB', 'TB'];
        let size = value / 1000;
        let unitIndex = 0;
        while (size >= 1000 && unitIndex < units.length - 1) {
            size /= 1000;
            unitIndex++;
        }
        return `${size.toFixed(size >= 100 ? 0 : 1)} ${units[unitIndex]}`;
    };

    const setByteProgress = (loaded, total, complete = false, operationId = progressOperationId) => {
        if (!isCurrentProgressOperation(operationId)) return;
        clearTimeout(progressHideTimer);
        const wrap = document.getElementById('erome-progress-bar-wrap');
        const bar = document.getElementById('erome-progress-bar');
        const label = document.getElementById('erome-progress-label');
        if (!wrap || !bar || !label) return;
        const loadedBytes = Number.isFinite(loaded) && loaded > 0 ? loaded : 0;
        const totalBytes = Number.isFinite(total) && total > 0 ? total : 0;
        wrap.classList.add('visible');
        if (totalBytes > 0) {
            const percentage = complete
                ? 100
                : Math.min(100, Math.max(0, Math.round((loadedBytes / totalBytes) * 100)));
            wrap.setAttribute('aria-valuemin', '0');
            wrap.setAttribute('aria-valuemax', String(totalBytes));
            wrap.setAttribute('aria-valuenow', String(Math.min(loadedBytes, totalBytes)));
            bar.classList.remove('indeterminate');
            bar.style.width = `${percentage}%`;
            label.textContent = `${percentage}% · ${formatBytes(complete ? totalBytes : loadedBytes)} / ${formatBytes(totalBytes)}`;
        } else if (complete) {
            wrap.setAttribute('aria-valuemin', '0');
            wrap.setAttribute('aria-valuemax', '1');
            wrap.setAttribute('aria-valuenow', '1');
            bar.classList.remove('indeterminate');
            bar.style.width = '100%';
            label.textContent = loadedBytes > 0 ? formatBytes(loadedBytes) : '100%';
        } else {
            wrap.removeAttribute('aria-valuemin');
            wrap.removeAttribute('aria-valuemax');
            wrap.removeAttribute('aria-valuenow');
            bar.classList.add('indeterminate');
            label.textContent = loadedBytes > 0 ? formatBytes(loadedBytes) : '...';
        }
        if (complete) hideProgress(900, operationId);
    };

    const updateTransferProgress = (transfers, complete = false, operationId = progressOperationId) => {
        let loaded = 0;
        let total = 0;
        let unknownLoaded = 0;
        let hasUnknownTransfer = false;
        transfers.forEach((transfer) => {
            if (transfer.total > 0) {
                total += transfer.total;
                loaded += Math.min(transfer.loaded, transfer.total);
            } else {
                unknownLoaded += transfer.loaded;
                hasUnknownTransfer = true;
            }
        });
        if (hasUnknownTransfer && !complete) {
            setByteProgress(loaded + unknownLoaded, 0, false, operationId);
            return;
        }
        setByteProgress(total > 0 ? loaded : unknownLoaded, total, complete, operationId);
    };

    const toAbsoluteUrl = (value) => {
        if (!value) return '';
        try {
            return new URL(value, location.href).href;
        } catch {
            return value;
        }
    };

    const getMediaSource = (media) => {
        // Prefer loaded media URL; lazy attributes may still point to thumbnails.
        if (media.tagName === 'IMG') {
            return toAbsoluteUrl(media.currentSrc
                || media.getAttribute('src')
                || media.getAttribute('data-src')
                || media.getAttribute('data-original')
                || '');
        }

        const source = media.querySelector('source');
        return toAbsoluteUrl(media.currentSrc
            || (source && (source.currentSrc || source.getAttribute('src') || source.src))
            || media.getAttribute('data-src')
            || media.getAttribute('src')
            || '');
    };

    const collectMedia = () => {
        mediaItems = [];
        const seenUrls = new Set();
        const mediaElements = document.querySelectorAll('.media-group .video video, .media-group .img img');

        mediaElements.forEach((media) => {
            const src = getMediaSource(media);
            if (!src || seenUrls.has(src)) return;
            seenUrls.add(src);

            let originalFileName = '';
            try {
                const parts = new URL(src).pathname.split('/');
                originalFileName = parts[parts.length - 1];
            } catch {
                originalFileName = src.split('/').pop().split('?')[0];
            }

            mediaItems.push({ id: src, type: media.tagName, src, element: media, originalFileName });
        });
        const currentIds = new Set(mediaItems.map(item => item.id));
        selectedItems = new Set([...selectedItems].filter(id => currentIds.has(id)));
        return mediaItems;
    };

    const addInlineButtons = () => {
        const mediaGroups = document.querySelectorAll('.media-group');

        mediaGroups.forEach((group, index) => {
            if (group.querySelector('.erome-inline-actions')) return;

            const video = group.querySelector('.video video');
            const img = group.querySelector('.img img');
            const mediaElement = video || img;

            if (!mediaElement) return;

            const src = getMediaSource(mediaElement);

            if (!src) return;

            const mediaType = img ? 'IMG' : 'VIDEO';
            const mediaItem = {
                id: index,
                type: mediaType,
                src: src,
                element: mediaElement,
                originalFileName: src.split('/').pop().split('?')[0]
            };

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'erome-inline-actions';
            actionsDiv.innerHTML = `
                <button class="erome-inline-btn download" data-index="${index}" title="${t('inlineDownloadTitle')}">${t('downloadBtn')}</button>
                <button class="erome-inline-btn telegram" data-index="${index}" title="${t('inlineTelegramTitle')}">${t('telegramBtn')}</button>
            `;

            const container = group.querySelector('.video') || group.querySelector('.img');
            if (container) {
                container.style.position = 'relative';
                container.appendChild(actionsDiv);

                const downloadBtn = actionsDiv.querySelector('.download');
                const telegramBtn = actionsDiv.querySelector('.telegram');

                downloadBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    downloadSingleInline(mediaItem, downloadBtn);
                };

                telegramBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sendSingleToTelegramInline(mediaItem, telegramBtn);
                };
            }
        });
    };

    const getDownloadErrorMessage = (reason) => {
        if (typeof reason === 'string' && reason) return reason;
        if (reason && typeof reason.message === 'string' && reason.message) return reason.message;
        return t('downloadBlobError');
    };

    const tryBrowserDownload = (url, fileName, target = '_self') => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = target;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const startDownload = (url, fileName, onSuccess, onFailure, target = '_self', onProgress = () => {}) => {
        let settled = false;
        const fail = (reason) => {
            if (settled) return;
            settled = true;
            let fallbackStarted = false;
            // Browser fallback is best effort and never counts as confirmed success.
            try {
                tryBrowserDownload(url, fileName, target);
                fallbackStarted = true;
            } catch (fallbackError) {
                console.error('[Erome Downloader] Browser fallback failed:', fallbackError);
            }
            onFailure(getDownloadErrorMessage(reason), fallbackStarted);
        };

        try {
            GM_download({
                url,
                name: fileName,
                saveAs: false,
                timeout: MEDIA_TRANSFER_TIMEOUT,
                headers: { Referer: location.href },
                onload: () => {
                    if (settled) return;
                    settled = true;
                    onSuccess();
                },
                onerror: fail,
                onprogress: (progress) => {
                    if (settled) return;
                    onProgress(Number(progress.loaded) || 0, Number(progress.total) || 0);
                },
                onabort: () => fail('Download aborted'),
                ontimeout: () => fail(t('requestTimeout'))
            });
        } catch (error) {
            fail(error);
        }
    };

    const downloadSingleInline = (item, btnElement) => {
        btnElement.disabled = true;
        btnElement.classList.add('loading');

        const fileName = getFileName(item.src, item, item.id + 1);
        let loadedBytes = 0;
        let totalBytes = 0;
        const progressOperation = beginProgressOperation();
        setByteProgress(0, 0, false, progressOperation);

        startDownload(
            item.src,
            fileName,
            () => {
                setByteProgress(totalBytes || loadedBytes, totalBytes || loadedBytes, true, progressOperation);
                btnElement.disabled = false;
                btnElement.classList.remove('loading');
                btnElement.textContent = t('downloadBtnDone');
                setTimeout(() => { btnElement.textContent = t('downloadBtn'); }, 2000);
            },
            (error, fallbackStarted) => {
                hideProgress(0, progressOperation);
                btnElement.disabled = false;
                btnElement.classList.remove('loading');
                btnElement.textContent = fallbackStarted ? t('downloadBtn') : t('downloadBtnFail');
                showToast(
                    fallbackStarted ? t('inlineDownloadTitle') : t('downloadErrorTitle'),
                    fallbackStarted ? t('downloadFallbackStarted', fileName) : t('downloadError', error),
                    fallbackStarted ? 'info' : 'error',
                    4000
                );
                setTimeout(() => { btnElement.textContent = t('downloadBtn'); }, 3000);
            },
            '_blank',
            (loaded, total) => {
                loadedBytes = loaded;
                if (total > 0) totalBytes = total;
                setByteProgress(loadedBytes, totalBytes, false, progressOperation);
            }
        );
    };

    const createTelegramFile = (blob, item, fileName) => {
        const fallbackType = item.type === 'IMG' ? 'image/jpeg' : 'video/mp4';
        const extension = fileName.split('.').pop().toLowerCase();
        const extensionTypes = {
            gif: 'image/gif',
            jpeg: 'image/jpeg',
            jpg: 'image/jpeg',
            mov: 'video/quicktime',
            mp4: 'video/mp4',
            png: 'image/png',
            webm: 'video/webm',
            webp: 'image/webp'
        };
        const blobType = typeof blob.type === 'string' ? blob.type : '';
        const mimeType = /^(image|video)\//.test(blobType)
            ? blobType
            : (extensionTypes[extension] || fallbackType);
        return new File([blob], fileName, { type: mimeType });
    };

    const sendSingleToTelegramInline = (item, btnElement) => {
        const token = TELEGRAM_BOT_TOKEN;
        const chatId = normalizeChatId(TELEGRAM_CHAT_ID);

        if (!token) {
            showToast(
                t('configNeeded'),
                t('errorConfigTokenToast'),
                'error',
                5000
            );
            return;
        }
        if (!isValidToken(token)) {
            showToast(t('configNeeded'), t('invalidToken'), 'error', 5000);
            return;
        }
        if (!chatId) {
            showToast(
                t('configNeeded'),
                t('errorConfigChatIdToast'),
                'error',
                5000
            );
            return;
        }
        if (!isValidChatId(chatId)) {
            showToast(t('configNeeded'), t('invalidChatId'), 'error', 5000);
            return;
        }

        btnElement.disabled = true;
        btnElement.classList.add('loading');

        const fileName = getFileName(item.src, item, item.id + 1);
        let loadedBytes = 0;
        let totalBytes = 0;
        const progressOperation = beginProgressOperation();
        setByteProgress(0, 0, false, progressOperation);

        downloadTelegramBlob(
            item,
            (blob) => {
                setByteProgress(totalBytes || blob.size, totalBytes || blob.size, true, progressOperation);
                const file = createTelegramFile(blob, item, fileName);

                sendSingleMedia(
                    token,
                    chatId,
                    { type: item.type, blob: file, fileName },
                    () => {
                        btnElement.disabled = false;
                        btnElement.classList.remove('loading');
                        btnElement.innerHTML = t('downloadBtnDone');
                        showToast(t('sendSuccess'), fileName, 'success', 3000);
                        setTimeout(() => {
                            btnElement.innerHTML = t('telegramBtn');
                        }, 2000);
                    },
                    (errMsg) => {
                        btnElement.disabled = false;
                        btnElement.classList.remove('loading');
                        btnElement.innerHTML = t('downloadBtnFail');
                        showToast(t('sendErrorTitle'), errMsg, 'error', 4000);
                        setTimeout(() => {
                            btnElement.innerHTML = t('telegramBtn');
                        }, 3000);
                        console.error('[Telegram] Error:', errMsg);
                    }
                );
            },
            (error) => {
                hideProgress(0, progressOperation);
                btnElement.disabled = false;
                btnElement.classList.remove('loading');
                btnElement.innerHTML = t('downloadBtnFail');
                showToast(t('downloadErrorTitle'), error, 'error', 4000);
                setTimeout(() => {
                    btnElement.innerHTML = t('telegramBtn');
                }, 3000);
                console.error('[Download] Error:', error);
            },
            (loaded, total) => {
                loadedBytes = loaded;
                if (total > 0) totalBytes = total;
                setByteProgress(loadedBytes, totalBytes, false, progressOperation);
            }
        );
    };

    const getFileName = (url, item, counter) => {
        try {
            let fileName = (item.originalFileName || '').split('?')[0];
            const hasExt = /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i.test(fileName);
            if (!fileName || !hasExt) {
                const ext = item.type === 'IMG' ? 'jpg' : 'mp4';
                const pageTitle = document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30) || 'erome';
                fileName = `${pageTitle}_${counter}.${ext}`;
            }
            return decodeURIComponent(fileName).replace(/[<>:"/\\|?*]/g, '_');
        } catch {
            return `erome_media_${counter}.${item.type === 'IMG' ? 'jpg' : 'mp4'}`;
        }
    };

    const renderMediaList = () => {
        const content = document.getElementById('erome-modal-content');
        if (mediaItems.length === 0) {
            content.innerHTML = `
                <div class="erome-empty">
                    <h3 style="color:${COLORS.text};margin-bottom:10px;">${t('noMediaFound')}</h3>
                    <p>${t('noMediaFoundDesc')}</p>
                </div>`;
            updateCounter();
            return;
        }
        content.innerHTML = '';
        mediaItems.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'erome-media-item' + (selectedItems.has(item.id) ? ' selected' : '');
            const preview = item.type === 'IMG' ? item.src : (item.element.poster || item.src);
            const fileName = getFileName(item.src, item, index + 1);

            const checkbox = document.createElement('div');
            checkbox.className = 'erome-checkbox';
            const previewEl = document.createElement('img');
            previewEl.className = 'erome-media-preview';
            previewEl.alt = t('previewAlt');
            previewEl.loading = 'lazy';
            previewEl.src = preview;
            const info = document.createElement('div');
            info.className = 'erome-media-info';
            const type = document.createElement('span');
            type.className = 'erome-media-type';
            type.textContent = item.type === 'IMG' ? 'IMG' : 'VID';
            const fileNameEl = document.createElement('div');
            fileNameEl.className = 'erome-media-url';
            fileNameEl.textContent = fileName;
            info.append(type, fileNameEl);
            itemDiv.append(checkbox, previewEl, info);

            itemDiv.onclick = () => toggleSelection(item.id);

            content.appendChild(itemDiv);
        });
        updateCounter();
    };

    const toggleSelection = (id) => { selectedItems.has(id) ? selectedItems.delete(id) : selectedItems.add(id); renderMediaList(); };
    const selectAll = () => { mediaItems.forEach(i => selectedItems.add(i.id)); renderMediaList(); };
    const deselectAll = () => { selectedItems.clear(); renderMediaList(); };
    const updateCounter = () => {
        const el = document.getElementById('erome-counter');
        if (el) el.textContent = t('counter', selectedItems.size);
    };

    const downloadSelected = () => {
        if (selectedItems.size === 0) {
            showNotification(t('selectAtLeastOne'), 'error', 3000);
            return;
        }
        const btn = document.getElementById('erome-download-selected');
        const selectedMedia = mediaItems.filter(i => selectedItems.has(i.id));
        const total = selectedMedia.length;
        if (total === 0) {
            selectedItems.clear();
            updateCounter();
            showNotification(t('selectAtLeastOne'), 'error', 3000);
            return;
        }
        let done = 0;
        let errors = 0;
        let fallbacks = 0;
        const transfers = selectedMedia.map(() => ({ loaded: 0, total: 0, started: false, finished: false }));
        const progressOperation = beginProgressOperation();

        btn.disabled = true;
        setByteProgress(0, 0, false, progressOperation);

        const onFinish = (status, transfer) => {
            done++;
            if (status === 'error') errors++;
            if (status === 'fallback') fallbacks++;
            transfer.finished = true;
            if (status === 'success') {
                if (transfer.total === 0 && transfer.loaded > 0) transfer.total = transfer.loaded;
                if (transfer.total > 0) transfer.loaded = transfer.total;
            }
            const completedSuccessfully = done === total && errors === 0 && fallbacks === 0;
            updateTransferProgress(transfers, completedSuccessfully, progressOperation);
            if (done === total) {
                if (!completedSuccessfully) hideProgress(900, progressOperation);
                btn.disabled = false;
                btn.classList.remove('erome-btn-loading');
                btn.textContent = '⬇ ' + t('downloadSelected');
                const message = errors === 0 && fallbacks === 0
                    ? t('filesDownloaded', total)
                    : t('filesDownloadResult', total - errors - fallbacks, fallbacks, errors);
                showNotification(message, errors > 0 ? 'error' : (fallbacks > 0 ? 'info' : 'success'), 5000);
            }
        };

        let index = 0, active = 0;
        btn.classList.add('erome-btn-loading');
        const next = () => {
            while (active < MAX_CONCURRENT_DOWNLOADS && index < total) {
                const itemIndex = index++;
                const item = selectedMedia[itemIndex];
                const transfer = transfers[itemIndex];
                transfer.started = true;
                active++;
                const fileName = getFileName(item.src, item, itemIndex + 1);
                startDownload(
                    item.src,
                    fileName,
                    () => { active--; onFinish('success', transfer); next(); },
                    (error, fallbackStarted) => {
                        if (!fallbackStarted) console.error('[Download] Error:', error);
                        active--;
                        onFinish(fallbackStarted ? 'fallback' : 'error', transfer);
                        next();
                    },
                    '_self',
                    (loaded, itemTotal) => {
                        transfer.loaded = loaded;
                        if (itemTotal > 0) transfer.total = itemTotal;
                        updateTransferProgress(transfers, false, progressOperation);
                    }
                );
            }
        };
        loadRemoteFileSizes(selectedMedia, (sizes) => {
            sizes.forEach((size, itemIndex) => {
                if (size > 0) transfers[itemIndex].total = size;
            });
            updateTransferProgress(transfers, false, progressOperation);
            next();
        });
    };

    const testTelegramConnection = () => {
        const rawId = document.getElementById('erome-chat-id-input').value.trim() || TELEGRAM_CHAT_ID;
        const chatId = normalizeChatId(rawId);
        const token = TELEGRAM_BOT_TOKEN;

        if (!token) { showNotification(t('errorConfigToken'), 'error', 4000); return; }
        if (!isValidToken(token)) { showNotification(t('invalidToken'), 'error', 4000); return; }
        if (!chatId) { showNotification(t('errorConfigChatId'), 'error', 4000); return; }
        if (!isValidChatId(chatId)) { showNotification(t('invalidChatId'), 'error', 4000); return; }

        showNotification(t('testingWith', chatId), 'info');

        try {
            const { done, fail } = createSettledCallbacks(
                () => showNotification(t('connectionSuccess', chatId), 'success', 5000),
                (message) => showNotification(message, 'error', 8000)
            );
            GM_xmlhttpRequest({
                method: 'POST',
                url: `https://api.telegram.org/bot${token}/sendMessage`,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ chat_id: chatId, text: t('tgConnected') }),
                timeout: TELEGRAM_REQUEST_TIMEOUT,
                onload: (res) => {
                    try {
                        const json = JSON.parse(res.responseText);
                        if (json.ok) {
                            done();
                        } else {
                            fail(t('connectionError', json.description, chatId));
                        }
                    } catch { fail(t('invalidApiResponse')); }
                },
                onerror: () => fail(t('networkError')),
                ontimeout: () => fail(t('requestTimeout'))
            });
        } catch (error) {
            showNotification(t('networkError'), 'error', 4000);
            console.error('[TG] Connection test failed:', error);
        }
    };

    const downloadBlob = (url, onSuccess, onError, onProgress = () => {}) => {
        let settled = false;
        const fail = (message) => {
            if (settled) return;
            settled = true;
            onError(message);
        };

        try {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'blob',
                anonymous: false,
                timeout: MEDIA_TRANSFER_TIMEOUT,
                headers: {
                    'Referer': 'https://www.erome.com/',
                    'Origin': 'https://www.erome.com'
                },
                onload: (res) => {
                    if (settled) return;
                    if (!res.response || res.status < 200 || res.status >= 300) {
                        fail(t('nonOkHttpStatus', res.status));
                        return;
                    }
                    settled = true;
                    onProgress(res.response.size, res.response.size);
                    onSuccess(res.response);
                },
                onprogress: (progress) => {
                    if (settled) return;
                    onProgress(Number(progress.loaded) || 0, Number(progress.total) || 0);
                },
                onerror: (error) => {
                    console.error('[TG] Download failed:', error);
                    fail(t('downloadBlobError'));
                },
                ontimeout: () => fail(t('requestTimeout')),
                onabort: () => fail(t('downloadBlobError'))
            });
        } catch (error) {
            console.error('[TG] Download request failed:', error);
            fail(getDownloadErrorMessage(error));
        }
    };

    const getContentLength = (headers) => {
        const match = /^content-length:\s*(\d+)\s*$/im.exec(String(headers || ''));
        return match ? Number(match[1]) : 0;
    };

    const getRemoteFileSize = (url, onDone) => {
        let settled = false;
        const done = (size = 0) => {
            if (settled) return;
            settled = true;
            onDone(size);
        };

        try {
            GM_xmlhttpRequest({
                method: 'HEAD',
                url,
                anonymous: false,
                timeout: MEDIA_METADATA_TIMEOUT,
                headers: { Referer: location.href },
                onload: (res) => done(
                    res.status >= 200 && res.status < 300 ? getContentLength(res.responseHeaders) : 0
                ),
                onerror: () => done(),
                ontimeout: () => done(),
                onabort: () => done()
            });
        } catch {
            done();
        }
    };

    const loadRemoteFileSizes = (items, onDone) => {
        const sizes = new Array(items.length).fill(0);
        let index = 0;
        let active = 0;
        let completed = 0;

        const next = () => {
            while (active < MAX_CONCURRENT_DOWNLOADS && index < items.length) {
                const itemIndex = index++;
                active++;
                getRemoteFileSize(items[itemIndex].src, (size) => {
                    sizes[itemIndex] = size;
                    active--;
                    completed++;
                    if (completed === items.length) onDone(sizes);
                    else next();
                });
            }
        };
        next();
    };

    const getTelegramFileTooLargeMessage = (bytes) => {
        return t('telegramFileTooLarge', (bytes / 1000000).toFixed(1));
    };

    const downloadTelegramBlob = (item, onSuccess, onError, onProgress = () => {}) => {
        let decided = false;
        const download = (remoteSize = 0) => {
            if (decided) return;
            decided = true;
            if (remoteSize > 0) onProgress(0, remoteSize);
            if (remoteSize > TELEGRAM_FILE_LIMIT_BYTES) {
                onError(getTelegramFileTooLargeMessage(remoteSize));
                return;
            }

            downloadBlob(
                item.src,
                (blob) => {
                    if (blob.size > TELEGRAM_FILE_LIMIT_BYTES) {
                        onError(getTelegramFileTooLargeMessage(blob.size));
                        return;
                    }
                    onSuccess(blob);
                },
                onError,
                onProgress
            );
        };

        getRemoteFileSize(item.src, download);
    };

    const createSettledCallbacks = (onDone, onError) => {
        // Ignore late success/error events after timeout, abort, or network failure.
        let settled = false;
        return {
            done: (...args) => {
                if (settled) return;
                settled = true;
                onDone(...args);
            },
            fail: (...args) => {
                if (settled) return;
                settled = true;
                onError(...args);
            }
        };
    };

    const getTelegramUpload = (item) => {
        // Telegram albums accept only photo/video; unsupported formats use documents.
        const fileName = item.fileName || item.originalFileName || '';
        const extension = fileName.split('.').pop().toLowerCase();
        const mimeType = item.blob && typeof item.blob.type === 'string'
            ? item.blob.type.toLowerCase()
            : '';

        const isPhoto = item.type === 'IMG'
            && (mimeType === 'image/jpeg' || mimeType === 'image/png'
                || (!mimeType && (!fileName.includes('.') || ['jpg', 'jpeg', 'png'].includes(extension))));
        if (isPhoto) return { method: 'sendPhoto', field: 'photo', albumType: 'photo' };

        const isVideo = item.type !== 'IMG'
            && (mimeType === 'video/mp4'
                || (!mimeType && (!fileName.includes('.') || extension === 'mp4')));
        if (isVideo) return { method: 'sendVideo', field: 'video', albumType: 'video' };

        return { method: 'sendDocument', field: 'document', albumType: null };
    };

    const handleTelegramResponse = (res, onDone, onError) => {
        try {
            const json = JSON.parse(res.responseText);
            if (json.ok) {
                onDone(json);
            } else {
                console.error('[TG] API error:', json.description);
                onError(json.description || t('invalidApiResponse'));
            }
        } catch (error) {
            console.error('[TG] Response parse error:', error);
            onError(t('parseError'));
        }
    };

    const sendSingleMedia = (token, chatId, item, onDone, onError) => {
        const { done, fail } = createSettledCallbacks(onDone, onError);
        const upload = getTelegramUpload(item);
        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append(upload.field, item.blob, item.fileName);

        try {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `https://api.telegram.org/bot${token}/${upload.method}`,
                data: formData,
                timeout: MEDIA_TRANSFER_TIMEOUT,
                onload: (res) => handleTelegramResponse(res, done, fail),
                onerror: () => fail(t('uploadNetworkError')),
                ontimeout: () => fail(t('requestTimeout'))
            });
        } catch (error) {
            fail(getDownloadErrorMessage(error));
        }
    };

    const sendMediaGroup = (token, chatId, mediaGroup, onDone, onError) => {
        if (mediaGroup.length < 2 || mediaGroup.length > 10
            || mediaGroup.some(item => !getTelegramUpload(item).albumType)) {
            onError(t('invalidApiResponse'));
            return;
        }
        const { done, fail } = createSettledCallbacks(onDone, onError);
        const formData = new FormData();
        formData.append('chat_id', String(chatId));

        const mediaArray = mediaGroup.map((item, idx) => {
            const attachName = `file${idx}`;

            formData.append(attachName, item.blob, item.fileName);

            return {
                type: getTelegramUpload(item).albumType,
                media: `attach://${attachName}`
            };
        });

        formData.append('media', JSON.stringify(mediaArray));

        try {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `https://api.telegram.org/bot${token}/sendMediaGroup`,
                data: formData,
                timeout: MEDIA_TRANSFER_TIMEOUT,
                onload: (res) => handleTelegramResponse(res, done, fail),
                onerror: () => {
                    console.error('[TG] Upload network error');
                    fail(t('uploadNetworkError'));
                },
                ontimeout: () => fail(t('requestTimeout'))
            });
        } catch (error) {
            fail(getDownloadErrorMessage(error));
        }
    };

    const sendMediaBatch = (token, chatId, mediaGroup, onDone, onError) => {
        if (mediaGroup.length === 1) {
            sendSingleMedia(token, chatId, mediaGroup[0], onDone, onError);
            return;
        }

        if (mediaGroup.every(item => getTelegramUpload(item).albumType)) {
            sendMediaGroup(token, chatId, mediaGroup, onDone, onError);
            return;
        }

        // Send incompatible album items sequentially instead of rejecting whole batch.
        let index = 0;
        let failures = 0;
        const messages = [];
        const next = () => {
            if (index >= mediaGroup.length) {
                if (failures === 0) onDone();
                else onError(messages.join('; '), failures);
                return;
            }

            const item = mediaGroup[index++];
            sendSingleMedia(
                token,
                chatId,
                item,
                next,
                (message) => {
                    failures++;
                    messages.push(message);
                    next();
                }
            );
        };
        next();
    };

    const sendToTelegram = () => {
        const rawId = document.getElementById('erome-chat-id-input').value.trim() || TELEGRAM_CHAT_ID;
        const chatId = normalizeChatId(rawId);
        const token = TELEGRAM_BOT_TOKEN;

        if (!token) { showNotification(t('errorConfigToken'), 'error', 4000); return; }
        if (!isValidToken(token)) { showNotification(t('invalidToken'), 'error', 4000); return; }
        if (!chatId) { showNotification(t('errorConfigChatId'), 'error', 4000); return; }
        if (!isValidChatId(chatId)) { showNotification(t('invalidChatId'), 'error', 4000); return; }
        if (selectedItems.size === 0) { showNotification(t('selectAtLeastOneMedia'), 'error', 3000); return; }

        TELEGRAM_CHAT_ID = chatId;
        GM_setValue('tg_chat_id', chatId);
        saveChatToHistory(chatId, rawId);

        const btn = document.getElementById('erome-send-telegram');
        const selectedMedia = mediaItems.filter(i => selectedItems.has(i.id));
        const total = selectedMedia.length;
        if (total === 0) {
            selectedItems.clear();
            updateCounter();
            showNotification(t('selectAtLeastOneMedia'), 'error', 3000);
            return;
        }
        let done = 0, errors = 0;
        const progressOperation = beginProgressOperation();

        btn.disabled = true;
        btn.classList.add('erome-btn-loading');
        setProgress(0, total, progressOperation);
        showNotification(t('preparingSend', total), 'info');

        const BATCH_SIZE = 10;
        const batches = [];
        for (let i = 0; i < selectedMedia.length; i += BATCH_SIZE) {
            batches.push(selectedMedia.slice(i, i + BATCH_SIZE));
        }

        let currentBatch = 0;

        const processBatch = () => {
            if (currentBatch >= batches.length) {
                btn.disabled = false;
                btn.classList.remove('erome-btn-loading');
                btn.textContent = '✈ ' + t('sendSelected');
                const msg = errors === 0
                    ? t('allSent', total, batches.length)
                    : t('partialSent', total - errors, errors);
                showNotification(msg, errors === 0 ? 'success' : 'error', 8000);
                return;
            }

            const batch = batches[currentBatch];
            const batchNum = currentBatch + 1;
            const transfers = batch.map(() => ({ loaded: 0, total: 0, started: true, finished: false }));
            showNotification(t('downloadingGroup', batchNum, batches.length, batch.length), 'info');
            setByteProgress(0, 0, false, progressOperation);

            const downloadPromises = batch.map((item, idx) => {
                const transfer = transfers[idx];
                return new Promise((resolve) => {
                    downloadTelegramBlob(
                        item,
                        (blob) => {
                            transfer.finished = true;
                            if (transfer.total === 0) transfer.total = blob.size;
                            transfer.loaded = transfer.total;
                            updateTransferProgress(transfers, false, progressOperation);
                            try {
                                const fileName = getFileName(item.src, item, done + idx + 1);
                                resolve({
                                    ok: true,
                                    media: {
                                        type: item.type,
                                        blob: createTelegramFile(blob, item, fileName),
                                        fileName
                                    }
                                });
                            } catch (error) {
                                resolve({ ok: false, error: getDownloadErrorMessage(error) });
                            }
                        },
                        (error) => {
                            transfer.finished = true;
                            updateTransferProgress(transfers, false, progressOperation);
                            resolve({ ok: false, error });
                        },
                        (loaded, itemTotal) => {
                            transfer.loaded = loaded;
                            if (itemTotal > 0) transfer.total = itemTotal;
                            updateTransferProgress(transfers, false, progressOperation);
                        }
                    );
                });
            });

            Promise.all(downloadPromises)
                .then((results) => {
                    const failedDownloads = results.filter(result => !result.ok);
                    if (failedDownloads.length === 0) updateTransferProgress(transfers, true, progressOperation);
                    else hideProgress(900, progressOperation);
                    const mediaGroup = results
                        .filter(result => result.ok)
                        .map(result => result.media);

                    if (failedDownloads.length > 0) {
                        errors += failedDownloads.length;
                        done += failedDownloads.length;
                        setProgress(done, total, progressOperation);
                        failedDownloads.forEach(result => console.error('[TG] Media download failed:', result.error));
                    }

                    if (mediaGroup.length === 0) {
                        showNotification(
                            t('groupDownloadError', batchNum, failedDownloads[0]?.error || t('downloadBlobError')),
                            'error',
                            5000
                        );
                        currentBatch++;
                        setTimeout(() => processBatch(), 1000);
                        return;
                    }

                    showNotification(t('sendingGroup', batchNum, batches.length), 'info');

                    const onGroupDone = () => {
                        done += mediaGroup.length;
                        setProgress(done, total, progressOperation);
                        currentBatch++;
                        setTimeout(() => processBatch(), 1000);
                    };
                    const onGroupError = (errMsg, failedCount = mediaGroup.length) => {
                        errors += failedCount;
                        done += mediaGroup.length;
                        setProgress(done, total, progressOperation);
                        showNotification(t('groupError', batchNum, errMsg), 'error', 5000);
                        currentBatch++;
                        setTimeout(() => processBatch(), 1000);
                    };

                    sendMediaBatch(token, chatId, mediaGroup, onGroupDone, onGroupError);
                });
        };

        processBatch();
    };

    const refreshModalTexts = () => {
        const titleEl = document.getElementById('erome-modal-title');
        if (titleEl) titleEl.textContent = t('title');

        const closeEl = document.getElementById('erome-modal-close');
        if (closeEl) closeEl.textContent = t('close');

        const counterEl = document.getElementById('erome-counter');
        if (counterEl) counterEl.textContent = t('counter', selectedItems.size);

        const trigger = document.getElementById('erome-sidebar-trigger');
        if (trigger) trigger.title = t('openManager');
        const progress = document.getElementById('erome-progress-bar-wrap');
        if (progress) progress.setAttribute('aria-label', t('downloadProgressAria'));

        // Tabs
        const tabs = document.querySelectorAll('.erome-tab');
        if (tabs.length >= 3) {
            tabs[0].textContent = t('tabDownload');
            tabs[1].textContent = t('tabTelegram');
            tabs[2].textContent = t('tabConfig');
        }

        // Download tab buttons
        const selAll = document.getElementById('erome-select-all');
        if (selAll) selAll.textContent = t('selectAll');
        const deselAll = document.getElementById('erome-deselect-all');
        if (deselAll) deselAll.textContent = t('deselectAll');
        const dlSel = document.getElementById('erome-download-selected');
        if (dlSel) dlSel.textContent = t('downloadSelected');

        // Telegram tab
        const chatIdLabel = document.getElementById('label-chat-id');
        if (chatIdLabel) chatIdLabel.textContent = t('chatIdLabel');
        const chatIdInput = document.getElementById('erome-chat-id-input');
        if (chatIdInput) chatIdInput.placeholder = t('chatIdPlaceholder');
        const saveChatBtn = document.getElementById('erome-save-chat-id');
        if (saveChatBtn) saveChatBtn.textContent = t('save');
        const sendTelBtn = document.getElementById('erome-send-telegram');
        if (sendTelBtn) sendTelBtn.textContent = t('sendSelected');
        const testBtn = document.getElementById('erome-test-telegram');
        if (testBtn) testBtn.textContent = t('testConnection');

        // Config tab
        const langLabel = document.getElementById('label-language');
        if (langLabel) {
            const span = langLabel.querySelector('span');
            if (span) span.textContent = t('languageLabel');
        }
        const botLabel = document.getElementById('label-bot-token');
        if (botLabel) botLabel.textContent = t('botTokenLabel');
        const botInput = document.getElementById('erome-bot-token-input');
        if (botInput) botInput.placeholder = t('botTokenPlaceholder');
        const saveTokenBtn = document.getElementById('erome-save-token');
        if (saveTokenBtn) saveTokenBtn.textContent = t('saveToken');
        const privP = document.getElementById('p-token-privacy');
        if (privP) privP.textContent = t('tokenPrivacy');

        // Refresh media list and counter
        renderMediaList();

        // Refresh inline buttons
        document.querySelectorAll('.erome-inline-actions').forEach(el => el.remove());
        addInlineButtons();
    };

    const openModal = () => {
        collectMedia();
        const overlay = document.getElementById('erome-modal-overlay');
        const modal = document.getElementById('erome-modal');
        overlay.style.display = 'block';
        modal.classList.remove('closing');
        renderMediaList();
        renderChatHistory();
    };

    const closeModal = () => {
        const modal = document.getElementById('erome-modal');
        const overlay = document.getElementById('erome-modal-overlay');
        modal.classList.add('closing');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 250);
    };

    const init = () => {
        injectStyles();
        createSidebarTrigger();
        createModal();

        addInlineButtons();

        let refreshTimer;
        const observer = new MutationObserver((mutations) => {
            const affectsMedia = mutations.some(mutation => [
                ...mutation.addedNodes,
                ...mutation.removedNodes
            ].some(node => node.nodeType === Node.ELEMENT_NODE && (
                node.matches('.media-group')
                || node.closest('.media-group')
                || node.querySelector('.media-group')
            )));
            if (!affectsMedia) return;

            clearTimeout(refreshTimer);
            // Debounce site mutations to avoid repeated scans during media loading.
            refreshTimer = setTimeout(() => {
                addInlineButtons();
                const overlay = document.getElementById('erome-modal-overlay');
                if (overlay && overlay.style.display !== 'none') {
                    collectMedia();
                    renderMediaList();
                }
            }, 150);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
