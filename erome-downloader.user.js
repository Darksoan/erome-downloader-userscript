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
// @version      4.1.0
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    let TELEGRAM_BOT_TOKEN = GM_getValue('tg_bot_token', '');
    let TELEGRAM_CHAT_ID = GM_getValue('tg_chat_id', '');

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
    let mediaItems = [];
    let selectedItems = new Set();

    const normalizeChatId = (id) => {
        const str = String(id).trim();
        if (!str) return str;
        if (str.startsWith('@')) return str;
        if (!str.startsWith('-')) return str;
        const digits = str.replace(/^-/, '');
        if (digits.startsWith('100')) return str;
        return `-100${digits}`;
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
                width: 440px; max-width: 92vw;
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
            }
            .erome-input {
                padding: 9px 12px; background: ${COLORS.cardBg};
                border: 1px solid ${COLORS.border}; border-radius: 4px;
                color: ${COLORS.text}; font-size: 13px; width: 100%;
                box-sizing: border-box; transition: border-color 0.2s ease; outline: none;
            }
            .erome-input:focus { border-color: ${COLORS.primary}; }
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

            #erome-modal-content { padding: 16px; overflow-y: auto; flex: 1; }
            #erome-modal-content::-webkit-scrollbar { width: 8px; }
            #erome-modal-content::-webkit-scrollbar-track { background: ${COLORS.background}; }
            #erome-modal-content::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 4px; }
            #erome-modal-content::-webkit-scrollbar-thumb:hover { background: ${COLORS.primary}; }

            .erome-media-item {
                display: flex; align-items: center; padding: 10px; margin-bottom: 8px;
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
                width: 60px; height: 60px; object-fit: cover; border-radius: 3px;
                margin-right: 10px; border: 1px solid ${COLORS.border}; background: ${COLORS.cardBg};
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
                display: none; height: 4px; background: ${COLORS.border}; border-radius: 2px; overflow: hidden;
            }
            #erome-progress-bar-wrap.visible { display: block; }
            #erome-progress-bar { height: 100%; background: ${COLORS.primary}; width: 0%; transition: width 0.3s ease; }
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


        `;
        document.head.appendChild(style);
    };

    const createSidebarTrigger = () => {
        const trigger = document.createElement('div');
        trigger.id = 'erome-sidebar-trigger';
        trigger.title = 'Abrir Download Manager';
        trigger.onclick = openModal;
        document.body.appendChild(trigger);
    };

    const getChatHistory = () => JSON.parse(GM_getValue('tg_chat_history', '[]'));

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
            tag.innerHTML = `<span>${chat.label}</span><span class="erome-chat-tag-remove" data-id="${chat.id}">×</span>`;
            tag.querySelector('span:first-child').onclick = () => {
                document.getElementById('erome-chat-id-input').value = chat.id;
                TELEGRAM_CHAT_ID = chat.id;
                GM_setValue('tg_chat_id', chat.id);
            };
            tag.querySelector('.erome-chat-tag-remove').onclick = (e) => {
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
                <h2 id="erome-modal-title">Download Manager</h2>
                <div class="erome-counter" id="erome-counter">0 selecionados</div>
                <button id="erome-modal-close">Fechar</button>
            </div>

            <div id="erome-modal-controls">
                <div id="erome-notification"></div>
                <div id="erome-progress-bar-wrap"><div id="erome-progress-bar"></div></div>

                <div class="erome-tabs">
                    <button class="erome-tab active" data-tab="download">Download</button>
                    <button class="erome-tab"        data-tab="telegram">Telegram</button>
                    <button class="erome-tab"        data-tab="config">Config</button>
                </div>

                <!-- Aba Download -->
                <div class="erome-tab-panel active" id="tab-download">
                    <button class="erome-btn" id="erome-select-all">Selecionar Todos</button>
                    <button class="erome-btn" id="erome-deselect-all">Desselecionar Todos</button>
                    <button class="erome-btn erome-btn-primary" id="erome-download-selected">Baixar Selecionados</button>
                </div>

                <!-- Aba Telegram -->
                <div class="erome-tab-panel" id="tab-telegram">
                    <div class="erome-input-row">
                        <div class="erome-input-group">
                            <label class="erome-input-label">Chat ID</label>
                            <input id="erome-chat-id-input" class="erome-input"
                                   placeholder="Ex: 123456789 ou -3953729181"
                                   value="${TELEGRAM_CHAT_ID}" />
                        </div>
                        <button class="erome-btn erome-btn-telegram" id="erome-save-chat-id">Salvar</button>
                    </div>

                    <div id="erome-chat-history" class="erome-chat-history"></div>
                    <hr class="erome-divider">
                    <button class="erome-btn erome-btn-telegram" id="erome-send-telegram">Enviar Selecionados</button>
                    <button class="erome-btn" id="erome-test-telegram" style="font-size:12px;">Testar Conexão</button>
                </div>

                <!-- Aba Config -->
                <div class="erome-tab-panel" id="tab-config">
                    <div class="erome-input-group">
                        <label class="erome-input-label">Token do Bot</label>
                        <input id="erome-bot-token-input" class="erome-input" type="password"
                               placeholder="1234567890:AABBccDD..."
                               value="${TELEGRAM_BOT_TOKEN}" />
                    </div>
                    <button class="erome-btn erome-btn-primary" id="erome-save-token">Salvar Token</button>
                    <p style="font-size:11px;color:${COLORS.textSecondary};margin:0;">
                        O token é salvo localmente via GM_setValue e nunca enviado a terceiros.
                    </p>
                </div>
            </div>

            <div id="erome-modal-content">
                <div class="erome-loading">
                    <div class="erome-spinner"></div>
                    Carregando mídias...
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

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
            if (!val) { showNotification('Digite um Chat ID válido.', 'error', 3000); return; }
            const normalized = normalizeChatId(val);
            TELEGRAM_CHAT_ID = normalized;
            GM_setValue('tg_chat_id', normalized);
            saveChatToHistory(normalized, val);
            const changed = normalized !== val ? ` (convertido para ${normalized})` : '';
            showNotification(`Chat ID salvo!${changed}`, 'success', 3500);
        };

        document.getElementById('erome-send-telegram').onclick = sendToTelegram;
        document.getElementById('erome-test-telegram').onclick = testTelegramConnection;

        document.getElementById('erome-save-token').onclick = () => {
            const val = document.getElementById('erome-bot-token-input').value.trim();
            if (!val) { showNotification('Token não pode ser vazio.', 'error', 3000); return; }
            TELEGRAM_BOT_TOKEN = val;
            GM_setValue('tg_bot_token', val);
            showNotification('Token salvo com segurança!', 'success', 2500);
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
        toast.innerHTML = `
            <div class="erome-toast-title">${title}</div>
            <div class="erome-toast-message">${message}</div>
        `;

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

    const setProgress = (done, total) => {
        const wrap = document.getElementById('erome-progress-bar-wrap');
        const bar = document.getElementById('erome-progress-bar');
        if (!wrap || !bar) return;
        if (total === 0) { wrap.classList.remove('visible'); return; }
        wrap.classList.add('visible');
        bar.style.width = `${Math.round((done / total) * 100)}%`;
        if (done >= total) setTimeout(() => wrap.classList.remove('visible'), 800);
    };

    const collectMedia = () => {
        mediaItems = [];
        const seenUrls = new Set();
        const mediaElements = document.querySelectorAll('.media-group .video video, .media-group .img img');

        mediaElements.forEach((media) => {
            let src = '';
            if (media.tagName === 'IMG') {
                src = media.src || media.getAttribute('data-src') || '';
            } else {
                const source = media.querySelector('source');
                src = (source ? source.src : media.src) || '';
            }
            if (!src || seenUrls.has(src)) return;
            seenUrls.add(src);

            let originalFileName = '';
            try {
                const parts = new URL(src).pathname.split('/');
                originalFileName = parts[parts.length - 1];
            } catch {
                originalFileName = src.split('/').pop().split('?')[0];
            }

            mediaItems.push({ id: mediaItems.length, type: media.tagName, src, element: media, originalFileName });
        });
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

            let src = '';
            if (img) {
                src = img.src || img.getAttribute('data-src') || '';
            } else if (video) {
                const source = video.querySelector('source');
                src = (source ? source.src : video.src) || '';
            }

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
                <button class="erome-inline-btn download" data-index="${index}" title="Download">↓</button>
                <button class="erome-inline-btn telegram" data-index="${index}" title="Enviar para Telegram">➤</button>
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

    const downloadSingleInline = (item, btnElement) => {
        btnElement.disabled = true;
        btnElement.classList.add('loading');

        const fileName = getFileName(item.src, item, item.id + 1);

        GM_download({
            url: item.src,
            name: fileName,
            saveAs: false,
            onload: () => {
                btnElement.disabled = false;
                btnElement.classList.remove('loading');
                btnElement.innerHTML = '✓';
                setTimeout(() => {
                    btnElement.innerHTML = '↓';
                }, 2000);
            },
            onerror: () => {
                const a = document.createElement('a');
                a.href = item.src;
                a.download = fileName;
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                btnElement.disabled = false;
                btnElement.classList.remove('loading');
                btnElement.innerHTML = '✓';
                setTimeout(() => {
                    btnElement.innerHTML = '↓';
                }, 2000);
            }
        });
    };

    const sendSingleToTelegramInline = (item, btnElement) => {
        const token = TELEGRAM_BOT_TOKEN;
        const chatId = normalizeChatId(TELEGRAM_CHAT_ID);

        if (!token) {
            showToast(
                'Configuração necessária',
                'Configure o Token do Bot primeiro. Clique na barra rosa à direita para abrir as configurações.',
                'error',
                5000
            );
            return;
        }
        if (!chatId) {
            showToast(
                'Configuração necessária',
                'Configure o Chat ID primeiro. Clique na barra rosa à direita para abrir as configurações.',
                'error',
                5000
            );
            return;
        }

        btnElement.disabled = true;
        btnElement.classList.add('loading');

        const fileName = getFileName(item.src, item, item.id + 1);

        downloadBlob(
            item.src,
            (blob) => {
                const mimeType = item.type !== 'IMG' ? 'video/mp4' : 'image/jpeg';
                const file = new File([blob], fileName, { type: mimeType });

                sendMediaGroup(
                    token,
                    chatId,
                    [{
                        type: item.type,
                        blob: file,
                        fileName: fileName
                    }],
                    () => {
                        btnElement.disabled = false;
                        btnElement.classList.remove('loading');
                        btnElement.innerHTML = '✓';
                        showToast('Enviado com sucesso', fileName, 'success', 3000);
                        setTimeout(() => {
                            btnElement.innerHTML = '➤';
                        }, 2000);
                    },
                    (errMsg) => {
                        btnElement.disabled = false;
                        btnElement.classList.remove('loading');
                        btnElement.innerHTML = '✕';
                        showToast('Erro ao enviar', errMsg, 'error', 4000);
                        setTimeout(() => {
                            btnElement.innerHTML = '➤';
                        }, 3000);
                        console.error('[Telegram] Erro:', errMsg);
                    }
                );
            },
            (error) => {
                btnElement.disabled = false;
                btnElement.classList.remove('loading');
                btnElement.innerHTML = '✕';
                showToast('Erro ao baixar', error, 'error', 4000);
                setTimeout(() => {
                    btnElement.innerHTML = '➤';
                }, 3000);
                console.error('[Download] Erro:', error);
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
                    <h3 style="color:${COLORS.text};margin-bottom:10px;">Nenhuma mídia encontrada</h3>
                    <p>Não foi possível encontrar imagens ou vídeos nesta página.</p>
                </div>`;
            return;
        }
        content.innerHTML = '';
        mediaItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'erome-media-item' + (selectedItems.has(item.id) ? ' selected' : '');
            const preview = item.type === 'IMG' ? item.src : (item.element.poster || item.src);
            const fileName = getFileName(item.src, item, item.id);

            itemDiv.innerHTML = `
                <div class="erome-checkbox"></div>
                <img src="${preview}" class="erome-media-preview" alt="Preview" loading="lazy">
                <div class="erome-media-info">
                    <span class="erome-media-type">${item.type === 'IMG' ? 'IMG' : 'VID'}</span>
                    <div class="erome-media-url">${fileName}</div>
                </div>`;

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
        if (el) el.textContent = `${selectedItems.size} selecionados`;
    };

    const downloadSingle = (item, btnElement) => {
        btnElement.disabled = true;
        btnElement.classList.add('loading');

        const fileName = getFileName(item.src, item, item.id + 1);

        GM_download({
            url: item.src,
            name: fileName,
            saveAs: false,
            onload: () => {
                btnElement.disabled = false;
                btnElement.classList.remove('loading');
                showNotification(`Download iniciado: ${fileName}`, 'success', 2500);
            },
            onerror: () => {
                const a = document.createElement('a');
                a.href = item.src;
                a.download = fileName;
                a.target = '_self';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                btnElement.disabled = false;
                btnElement.classList.remove('loading');
                showNotification(`Download iniciado: ${fileName}`, 'success', 2500);
            }
        });
    };

    const sendSingleToTelegram = (item, btnElement) => {
        const rawId = document.getElementById('erome-chat-id-input').value.trim() || TELEGRAM_CHAT_ID;
        const chatId = normalizeChatId(rawId);
        const token = TELEGRAM_BOT_TOKEN;

        if (!token) {
            showNotification('Configure o Token do Bot na aba Config.', 'error', 4000);
            return;
        }
        if (!chatId) {
            showNotification('Informe um Chat ID na aba Telegram.', 'error', 4000);
            return;
        }

        btnElement.disabled = true;
        btnElement.classList.add('loading');

        const fileName = getFileName(item.src, item, item.id + 1);
        showNotification(`Enviando ${fileName}...`, 'info');

        downloadBlob(
            item.src,
            (blob) => {
                const mimeType = item.type !== 'IMG' ? 'video/mp4' : 'image/jpeg';
                const file = new File([blob], fileName, { type: mimeType });

                sendMediaGroup(
                    token,
                    chatId,
                    [{
                        type: item.type,
                        blob: file,
                        fileName: fileName
                    }],
                    () => {
                        btnElement.disabled = false;
                        btnElement.classList.remove('loading');
                        showNotification(`Enviado: ${fileName}`, 'success', 3000);
                    },
                    (errMsg) => {
                        btnElement.disabled = false;
                        btnElement.classList.remove('loading');
                        showNotification(`Erro ao enviar: ${errMsg}`, 'error', 4000);
                    }
                );
            },
            (error) => {
                btnElement.disabled = false;
                btnElement.classList.remove('loading');
                showNotification(`Erro ao baixar: ${error}`, 'error', 4000);
            }
        );
    };
    const downloadSelected = () => {
        if (selectedItems.size === 0) {
            showNotification('⚠️ Selecione pelo menos uma mídia para baixar.', 'error', 3000);
            return;
        }
        const btn = document.getElementById('erome-download-selected');
        const selectedMedia = mediaItems.filter(i => selectedItems.has(i.id));
        const total = selectedMedia.length;
        let done = 0;

        btn.disabled = true;
        setProgress(0, total);

        const onFinish = () => {
            done++;
            setProgress(done, total);
            if (done === total) {
                btn.disabled = false;
                btn.classList.remove('erome-btn-loading');
                btn.textContent = '⬇ Baixar Selecionados';
                showNotification(`${total} arquivo(s) enviado(s) para download!`, 'success', 4000);
            }
        };

        let index = 0, active = 0;
        const next = () => {
            while (active < MAX_CONCURRENT_DOWNLOADS && index < total) {
                const item = selectedMedia[index++];
                active++;
                btn.classList.add('erome-btn-loading');
                const fileName = getFileName(item.src, item, index);
                GM_download({
                    url: item.src, name: fileName, saveAs: false,
                    onload: () => { active--; onFinish(); next(); },
                    onerror: () => {
                        const a = document.createElement('a');
                        a.href = item.src; a.download = fileName; a.target = '_self';
                        document.body.appendChild(a); a.click(); document.body.removeChild(a);
                        active--; onFinish(); next();
                    }
                });
            }
        };
        next();
    };

    const testTelegramConnection = () => {
        const rawId = document.getElementById('erome-chat-id-input').value.trim() || TELEGRAM_CHAT_ID;
        const chatId = normalizeChatId(rawId);
        const token = TELEGRAM_BOT_TOKEN;

        if (!token) { showNotification('⚠️ Configure o Token do Bot na aba Config.', 'error', 4000); return; }
        if (!chatId) { showNotification('⚠️ Informe um Chat ID.', 'error', 4000); return; }

        showNotification(`Testando com Chat ID: ${chatId}...`, 'info');

        GM_xmlhttpRequest({
            method: 'POST',
            url: `https://api.telegram.org/bot${token}/sendMessage`,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({ chat_id: chatId, text: 'Erome Download Manager conectado com sucesso!' }),
            onload: (res) => {
                try {
                    const json = JSON.parse(res.responseText);
                    if (json.ok) {
                        showNotification(`Conexão bem-sucedida! (ID: ${chatId})`, 'success', 5000);
                    } else {
                        showNotification(`Erro: ${json.description} (ID usado: ${chatId})`, 'error', 8000);
                    }
                } catch { showNotification('Resposta inválida da API.', 'error', 4000); }
            },
            onerror: () => showNotification('Falha de rede ao conectar com o Telegram.', 'error', 4000)
        });
    };

    const downloadBlob = (url, onSuccess, onError) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            responseType: 'blob',
            anonymous: false,
            headers: {
                'Referer': 'https://www.erome.com/',
                'Origin': 'https://www.erome.com'
            },
            onload: (res) => {
                if (!res.response || res.status < 200 || res.status >= 300) {
                    onError(`Download falhou (HTTP ${res.status})`);
                    return;
                }
                onSuccess(res.response);
            },
            onerror: (e) => {
                console.error('[TG] Falha ao baixar mídia:', e);
                onError('Falha ao baixar a mídia do Erome');
            }
        });
    };

    const sendMediaGroup = (token, chatId, mediaGroup, onDone, onError) => {
        const formData = new FormData();
        formData.append('chat_id', String(chatId));

        const mediaArray = mediaGroup.map((item, idx) => {
            const isVideo = item.type !== 'IMG';
            const mediaType = isVideo ? 'video' : 'photo';
            const attachName = `file${idx}`;

            formData.append(attachName, item.blob, item.fileName);

            return {
                type: mediaType,
                media: `attach://${attachName}`
            };
        });

        formData.append('media', JSON.stringify(mediaArray));

        GM_xmlhttpRequest({
            method: 'POST',
            url: `https://api.telegram.org/bot${token}/sendMediaGroup`,
            data: formData,
            onload: (res) => {
                try {
                    const json = JSON.parse(res.responseText);
                    if (json.ok) {
                        onDone();
                    } else {
                        console.error('[TG] Erro ao enviar grupo:', json.description);
                        onError(json.description);
                    }
                } catch (e) {
                    onError('Falha ao parsear resposta do Telegram');
                }
            },
            onerror: (e) => {
                console.error('[TG] Falha de rede no upload do grupo:', e);
                onError('Erro de rede no upload');
            }
        });
    };

    const sendToTelegram = () => {
        const rawId = document.getElementById('erome-chat-id-input').value.trim() || TELEGRAM_CHAT_ID;
        const chatId = normalizeChatId(rawId);
        const token = TELEGRAM_BOT_TOKEN;

        if (!token) { showNotification('Configure o Token do Bot na aba Config.', 'error', 4000); return; }
        if (!chatId) { showNotification('Informe um Chat ID na aba Telegram.', 'error', 4000); return; }
        if (selectedItems.size === 0) { showNotification('Selecione pelo menos uma mídia.', 'error', 3000); return; }

        TELEGRAM_CHAT_ID = chatId;
        GM_setValue('tg_chat_id', chatId);
        saveChatToHistory(chatId, rawId);

        const btn = document.getElementById('erome-send-telegram');
        const selectedMedia = mediaItems.filter(i => selectedItems.has(i.id));
        const total = selectedMedia.length;
        let done = 0, errors = 0;

        btn.disabled = true;
        btn.classList.add('erome-btn-loading');
        setProgress(0, total);
        showNotification(`Preparando envio de ${total} arquivo(s)...`, 'info');

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
                btn.textContent = '✈ Enviar Selecionados';
                const msg = errors === 0
                    ? `${total} arquivo(s) enviado(s) com sucesso em ${batches.length} grupo(s)!`
                    : `${total - errors} enviado(s), ${errors} erro(s). Veja o console (F12).`;
                showNotification(msg, errors === 0 ? 'success' : 'error', 8000);
                return;
            }

            const batch = batches[currentBatch];
            const batchNum = currentBatch + 1;
            showNotification(`Baixando grupo ${batchNum}/${batches.length} (${batch.length} arquivos)...`, 'info');

            const downloadPromises = batch.map((item, idx) => {
                return new Promise((resolve, reject) => {
                    downloadBlob(
                        item.src,
                        (blob) => {
                            const fileName = getFileName(item.src, item, done + idx + 1);
                            const mimeType = item.type !== 'IMG' ? 'video/mp4' : 'image/jpeg';
                            resolve({
                                type: item.type,
                                blob: new File([blob], fileName, { type: mimeType }),
                                fileName: fileName
                            });
                        },
                        (error) => reject(error)
                    );
                });
            });

            Promise.all(downloadPromises)
                .then((mediaGroup) => {
                    showNotification(`Enviando grupo ${batchNum}/${batches.length}...`, 'info');

                    sendMediaGroup(
                        token,
                        chatId,
                        mediaGroup,
                        () => {
                            done += batch.length;
                            setProgress(done, total);
                            currentBatch++;
                            setTimeout(() => processBatch(), 1000);
                        },
                        (errMsg) => {
                            errors += batch.length;
                            done += batch.length;
                            setProgress(done, total);
                            showNotification(`Erro no grupo ${batchNum}: ${errMsg}`, 'error', 5000);
                            currentBatch++;
                            setTimeout(() => processBatch(), 1000);
                        }
                    );
                })
                .catch((error) => {
                    errors += batch.length;
                    done += batch.length;
                    setProgress(done, total);
                    showNotification(`Erro ao baixar grupo ${batchNum}: ${error}`, 'error', 5000);
                    currentBatch++;
                    setTimeout(() => processBatch(), 1000);
                });
        };

        processBatch();
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

        const observer = new MutationObserver(() => {
            addInlineButtons();
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
