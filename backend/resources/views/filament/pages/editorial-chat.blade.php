<x-filament-panels::page>
    <style>
:root {
    --ec-bg: #ffffff; --ec-surface: #f8fafc; --ec-surface-2: #f1f5f9;
    --ec-border: rgba(0,0,0,0.09); --ec-border-hard: #000000;
    --ec-text: #0f172a; --ec-text-2: #374151; --ec-text-muted: #6b7280; --ec-text-dim: #9ca3af;
    --ec-accent: #7367f0; --ec-accent-2: #5b4ccf; --ec-accent-light: #ede9fe;
    --ec-red: #ef4444; --ec-green: #22c55e; --ec-yellow: #eab308;
    --ec-shadow: 3px 3px 0 0 #000; --ec-shadow-sm: 2px 2px 0 0 #000;
    --ec-radius: 10px; --ec-radius-sm: 6px;
    --tp-base: var(--ec-bg); --tp-elevated: var(--ec-surface); --tp-accent: var(--ec-accent); --tp-red: var(--ec-red);
    --tp-border: var(--ec-border); --tp-border-faint: rgba(0,0,0,0.05); --tp-border-strong: rgba(0,0,0,0.2);
    --tp-text-primary: var(--ec-text); --tp-text-secondary: var(--ec-text-2);
    --tp-text-muted: var(--ec-text-muted); --tp-text-dim: var(--ec-text-dim); --tp-text-bright: var(--ec-text);
}
.dark {
    --ec-bg: #1e1e2e; --ec-surface: #27273a; --ec-surface-2: #2d2d42;
    --ec-border: rgba(255,255,255,0.09); --ec-border-hard: rgba(255,255,255,0.25);
    --ec-text: #e2e8f0; --ec-text-2: #cbd5e1; --ec-text-muted: #94a3b8; --ec-text-dim: #64748b;
    --ec-accent-light: rgba(115,103,240,0.15);
    --ec-shadow: 3px 3px 0 0 rgba(255,255,255,0.15); --ec-shadow-sm: 2px 2px 0 0 rgba(255,255,255,0.12);
    --tp-base: var(--ec-bg); --tp-elevated: var(--ec-surface);
    --tp-border-faint: rgba(255,255,255,0.05); --tp-border-strong: rgba(255,255,255,0.2);
    --tp-text-primary: var(--ec-text); --tp-text-secondary: var(--ec-text-2);
    --tp-text-muted: var(--ec-text-muted); --tp-text-dim: var(--ec-text-dim); --tp-text-bright: var(--ec-text);
}
.fi-header { display: none !important; }
.fi-main { padding: 1.5rem !important; max-width: none !important; }
.chat-wrapper { display: flex; height: calc(100vh - 10rem); max-height: 860px; width: 100%; max-width: 1440px; margin: 0 auto; background: var(--ec-bg); border: 2px solid var(--ec-border-hard); border-radius: var(--ec-radius); box-shadow: var(--ec-shadow); overflow: hidden; position: relative; font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; font-size: 0.875rem; color: var(--ec-text); }
.chat-sidebar { width: 260px; min-width: 260px; background: var(--ec-surface); border-right: 2px solid var(--ec-border-hard); display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0; z-index: 20; transition: transform 0.2s ease; }
.sidebar-header { padding: 14px 14px 10px; border-bottom: 1.5px solid var(--ec-border-hard); flex-shrink: 0; }
.sidebar-header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.workspace-name { font-size: 0.9rem; font-weight: 800; color: var(--ec-text); display: flex; align-items: center; gap: 4px; cursor: default; }
.workspace-name .chevron { font-size: 0.65rem; color: var(--ec-text-muted); }
.compose-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--ec-border-hard); border-radius: var(--ec-radius-sm); background: var(--ec-bg); color: var(--ec-text); text-decoration: none; font-size: 0.85rem; box-shadow: var(--ec-shadow-sm); transition: all 0.1s; }
.compose-btn:hover { transform: translate(2px, 2px); box-shadow: none; }
.sidebar-user { display: flex; align-items: center; gap: 8px; }
.sidebar-user-avatar { width: 28px; height: 28px; border-radius: 6px; border: 1.5px solid var(--ec-border-hard); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem; color: #fff; flex-shrink: 0; overflow: hidden; }
.sidebar-user-name { font-size: 0.8rem; font-weight: 700; color: var(--ec-text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sidebar-nav { padding: 6px 8px; border-bottom: 1px solid var(--ec-border); flex-shrink: 0; }
.nav-item { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: var(--ec-radius-sm); cursor: pointer; font-size: 0.8rem; font-weight: 600; color: var(--ec-text-muted); transition: background 0.1s; user-select: none; border: 1.5px solid transparent; }
.nav-item:hover { background: var(--ec-bg); color: var(--ec-text); }
.nav-icon { font-size: 0.85rem; }
.nav-badge { margin-left: auto; background: var(--ec-accent); color: #fff; font-size: 0.625rem; font-weight: 800; padding: 1px 5px; border-radius: 10px; border: 1.5px solid var(--ec-border-hard); }
.sidebar-content { flex: 1; overflow-y: auto; padding: 8px 0; }
.sidebar-content::-webkit-scrollbar { width: 4px; }
.sidebar-content::-webkit-scrollbar-track { background: transparent; }
.sidebar-content::-webkit-scrollbar-thumb { background: var(--ec-border); border-radius: 2px; }
.sidebar-section { padding: 0 8px 8px; }
.section-header { padding: 2px 6px 6px; display: flex; align-items: center; }
.section-title { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ec-text-muted); display: flex; align-items: center; gap: 4px; }
.toggle-icon { font-size: 0.6rem; }
.channel-item { display: flex; align-items: center; gap: 5px; padding: 5px 8px; border-radius: var(--ec-radius-sm); cursor: pointer; font-size: 0.82rem; color: var(--ec-text-muted); transition: background 0.1s; user-select: none; border: 1.5px solid transparent; }
.channel-item:hover { background: var(--ec-bg); color: var(--ec-text); }
.channel-item.active { background: var(--ec-accent-light); border-color: var(--ec-accent); box-shadow: var(--ec-shadow-sm); color: var(--ec-accent-2); }
.channel-item.unread .channel-name { font-weight: 700; color: var(--ec-text); }
.channel-hash { font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
.channel-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.channel-lock { font-size: 0.7rem; opacity: 0.5; }
.draft-indicator { font-size: 0.6rem; font-weight: 700; background: #fef3c7; color: #b45309; padding: 1px 4px; border-radius: 3px; border: 1px solid #b45309; }
.unread-badge { margin-left: auto; background: var(--ec-accent); color: #fff; font-size: 0.625rem; font-weight: 800; min-width: 16px; padding: 1px 4px; border-radius: 8px; text-align: center; border: 1.5px solid var(--ec-border-hard); }
.dm-item { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: var(--ec-radius-sm); cursor: pointer; font-size: 0.82rem; color: var(--ec-text-muted); transition: background 0.1s; user-select: none; border: 1.5px solid transparent; }
.dm-item:hover { background: var(--ec-bg); color: var(--ec-text); }
.dm-item.active { background: var(--ec-accent-light); border-color: var(--ec-accent); box-shadow: var(--ec-shadow-sm); color: var(--ec-accent-2); }
.dm-avatar { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.65rem; color: #fff; flex-shrink: 0; position: relative; overflow: visible; border: 1.5px solid var(--ec-border-hard); }
.dm-status { position: absolute; bottom: -2px; right: -2px; width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--ec-surface); }
.dm-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.status-dot.online, .dm-status.online, .member-presence-dot.online { background: var(--ec-green); }
.status-dot.away, .dm-status.away, .member-presence-dot.away { background: var(--ec-yellow); }
.status-dot.busy, .dm-status.busy, .member-presence-dot.busy { background: var(--ec-red); }
.status-dot.offline, .dm-status.offline, .member-presence-dot.offline { background: var(--ec-text-dim); }
.status-selector { position: relative; }
.status-trigger { background: none; border: none; cursor: pointer; padding: 2px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: var(--ec-text-muted); }
.status-trigger:hover { background: var(--ec-border); }
.custom-status-emoji { font-size: 1rem; } .custom-status-text { font-size: 0.75rem; color: var(--ec-text-muted); }
.status-dropdown, .status-picker { position: absolute; left: 0; bottom: calc(100% + 6px); background: var(--ec-bg); border: 2px solid var(--ec-border-hard); border-radius: var(--ec-radius); box-shadow: var(--ec-shadow); padding: 6px; z-index: 50; min-width: 180px; }
.status-dropdown button { display: block; width: 100%; text-align: left; background: none; border: none; color: var(--ec-text); padding: 5px 10px; border-radius: var(--ec-radius-sm); cursor: pointer; font-size: 0.8rem; font-weight: 500; }
.status-dropdown button:hover { background: var(--ec-surface); }
.status-emoji-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; margin-bottom: 6px; }
.status-emoji-grid button { padding: 3px; font-size: 1rem; border-radius: 4px; background: none; border: none; cursor: pointer; }
.status-emoji-grid button:hover { background: var(--ec-surface); }
.status-picker input { display: block; width: 100%; border: 1.5px solid var(--ec-border-hard); border-radius: var(--ec-radius-sm); padding: 6px 8px; margin-bottom: 6px; font-size: 0.8rem; background: var(--ec-surface); color: var(--ec-text); box-sizing: border-box; }
.status-picker input:focus { outline: none; border-color: var(--ec-accent); }
.status-duration-row { display: flex; gap: 4px; }
.status-duration-btn { flex: 1; padding: 4px 2px; font-size: 0.7rem; font-weight: 700; border: 1.5px solid var(--ec-border-hard); border-radius: var(--ec-radius-sm); background: var(--ec-surface); color: var(--ec-text); cursor: pointer; text-align: center; box-shadow: var(--ec-shadow-sm); transition: all 0.1s; }
.status-duration-btn:hover { transform: translate(2px, 2px); box-shadow: none; }
.chat-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; background: var(--ec-bg); }
.chat-header { padding: 10px 16px; border-bottom: 2px solid var(--ec-border-hard); display: flex; align-items: center; gap: 8px; min-height: 52px; background: var(--ec-bg); flex-shrink: 0; }
.header-channel-name { font-size: 0.95rem; font-weight: 800; color: var(--ec-text); display: flex; align-items: center; gap: 2px; }
.header-channel-name .hash { font-size: 1.1rem; font-weight: 900; color: var(--ec-accent); margin-right: 1px; }
.header-divider { width: 1px; height: 20px; background: var(--ec-border); flex-shrink: 0; }
.header-topic { font-size: 0.78rem; color: var(--ec-text-muted); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header-topic.editable { cursor: pointer; } .header-topic.editable:hover { color: var(--ec-text); text-decoration: underline; }
.topic-edit-row { display: flex; align-items: center; gap: 4px; flex: 1; }
.topic-edit-row input { flex: 1; border: 1.5px solid var(--ec-border-hard); border-radius: var(--ec-radius-sm); padding: 4px 8px; font-size: 0.8rem; background: var(--ec-surface); color: var(--ec-text); }
.topic-edit-row input:focus { outline: none; border-color: var(--ec-accent); }
.topic-edit-btn { background: none; border: none; cursor: pointer; font-size: 0.85rem; padding: 2px 4px; }
.header-actions { display: flex; align-items: center; gap: 4px; margin-left: auto; flex-shrink: 0; }
.header-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 1.5px solid transparent; border-radius: var(--ec-radius-sm); background: none; cursor: pointer; color: var(--ec-text-muted); font-size: 0.85rem; transition: all 0.1s; }
.header-btn:hover { border-color: var(--ec-border-hard); background: var(--ec-surface); box-shadow: var(--ec-shadow-sm); color: var(--ec-text); }
.header-btn.active { background: var(--ec-accent-light); border-color: var(--ec-accent); color: var(--ec-accent); }
.header-dm-info { display: flex; align-items: center; gap: 10px; }
.header-dm-avatar { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem; color: #fff; border: 1.5px solid var(--ec-border-hard); position: relative; overflow: visible; }
.header-dm-name { font-size: 0.9rem; font-weight: 800; color: var(--ec-text); }
.mobile-menu-btn { display: none; border: none; background: none; color: var(--ec-text); cursor: pointer; font-size: 1.1rem; padding: 4px 6px; }
.pinned-count-btn { display: flex; align-items: center; gap: 4px; padding: 3px 8px; border: 1.5px solid var(--ec-border-hard); border-radius: 50px; background: var(--ec-surface); color: var(--ec-text-muted); font-size: 0.75rem; font-weight: 600; cursor: pointer; box-shadow: var(--ec-shadow-sm); transition: all 0.1s; }
.pinned-count-btn:hover { transform: translate(2px, 2px); box-shadow: none; color: var(--ec-text); }
.pinned-dropdown { position: absolute; top: calc(100% + 4px); right: 0; background: var(--ec-bg); border: 2px solid var(--ec-border-hard); border-radius: var(--ec-radius); box-shadow: var(--ec-shadow); padding: 8px; z-index: 40; min-width: 280px; max-width: 380px; max-height: 320px; overflow-y: auto; }
.pinned-msg-item { padding: 8px; border-radius: var(--ec-radius-sm); border: 1px solid var(--ec-border); margin-bottom: 6px; cursor: pointer; }
.pinned-msg-item:hover { background: var(--ec-surface); }
.pinned-msg-meta { font-size: 0.7rem; font-weight: 700; color: var(--ec-text-muted); margin-bottom: 3px; } .pinned-msg-text { font-size: 0.8rem; color: var(--ec-text); }
.search-bar { position: relative; }
.search-bar input { padding: 5px 10px; border: 1.5px solid var(--ec-border-hard); border-radius: 50px; background: var(--ec-surface); color: var(--ec-text); font-size: 0.8rem; width: 180px; }
.search-bar input:focus { outline: none; border-color: var(--ec-accent); }
.search-results { position: absolute; top: calc(100% + 4px); right: 0; width: 340px; background: var(--ec-bg); border: 2px solid var(--ec-border-hard); border-radius: var(--ec-radius); box-shadow: var(--ec-shadow); max-height: 360px; overflow-y: auto; z-index: 40; }
.search-result-item { padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--ec-border); }
.search-result-item:hover { background: var(--ec-surface); } .search-result-item:last-child { border-bottom: none; }
.search-result-author { font-size: 0.72rem; font-weight: 700; color: var(--ec-text-muted); margin-bottom: 2px; }
.search-result-text { font-size: 0.82rem; color: var(--ec-text); }
.search-result-text mark { background: #fef08a; padding: 0 1px; border-radius: 2px; }
.messages-container { flex: 1; overflow-y: auto; padding: 12px 0; display: flex; flex-direction: column-reverse; scroll-behavior: smooth; }
.messages-container::-webkit-scrollbar { width: 5px; } .messages-container::-webkit-scrollbar-track { background: transparent; }
.messages-container::-webkit-scrollbar-thumb { background: var(--ec-border); border-radius: 3px; }
.messages-inner { display: flex; flex-direction: column; gap: 0; }
.message-row { display: flex; gap: 10px; padding: 3px 16px; position: relative; transition: background 0.1s; }
.message-row:hover { background: var(--ec-surface); }
.message-row.grouped { padding-top: 1px; }
.message-row.highlight { background: #fef9c3; }
.dark .message-row.highlight { background: rgba(250,204,21,0.1); }
.message-row[data-new] { animation: msgFadeIn 0.25s ease; }
@keyframes msgFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.msg-avatar img, .dm-avatar img, .sidebar-user-avatar img, .header-dm-avatar img, .mention-item-avatar img, .hovercard-avatar img, .thread-reply-avatar img, .member-item-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.msg-avatar { width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid var(--ec-border-hard); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; color: #fff; flex-shrink: 0; overflow: hidden; margin-top: 2px; }
.msg-avatar-spacer { width: 36px; min-width: 36px; height: 16px; display: flex; align-items: center; justify-content: flex-end; flex-shrink: 0; }
.msg-hover-time { font-size: 0.625rem; color: var(--ec-text-dim); display: none; line-height: 1; white-space: nowrap; user-select: none; }
.message-row.grouped:hover .msg-hover-time { display: block; }
.msg-body { flex: 1; min-width: 0; }
.msg-header { display: flex; align-items: baseline; gap: 6px; margin-bottom: 3px; }
.msg-author { font-size: 0.875rem; font-weight: 800; color: var(--ec-text); cursor: pointer; }
.msg-author:hover { text-decoration: underline; }
.msg-role { font-size: 0.625rem; font-weight: 700; padding: 1px 5px; border-radius: 3px; border: 1px solid currentColor; opacity: 0.8; }
.msg-time { font-size: 0.6875rem; color: var(--ec-text-dim); font-weight: 400; }
.msg-edited { font-size: 0.6875rem; color: var(--ec-text-dim); }
.msg-text { font-size: 0.875rem; line-height: 1.55; color: var(--ec-text); background: var(--ec-surface); border: 1px solid var(--ec-border); border-radius: 2px 10px 10px 10px; padding: 6px 10px; display: inline-block; max-width: 680px; word-break: break-word; }
.own-message .msg-text { background: var(--ec-accent-light); border-color: rgba(115,103,240,0.2); }
.dark .own-message .msg-text { background: rgba(115,103,240,0.15); border-color: rgba(115,103,240,0.3); color: var(--ec-text); }
.quoted-message { border-left: 3px solid var(--ec-accent); padding: 4px 8px; background: var(--ec-surface-2); border-radius: 0 6px 6px 0; margin-bottom: 4px; font-size: 0.8rem; color: var(--ec-text-muted); }
.quoted-author { font-weight: 700; font-size: 0.75rem; color: var(--ec-accent); margin-bottom: 2px; }
.msg-text strong { font-weight: 800; } .msg-text em { font-style: italic; } .msg-text del { text-decoration: line-through; opacity: 0.7; }
.msg-text code { background: var(--ec-surface-2); border: 1px solid var(--ec-border); border-radius: 4px; padding: 1px 4px; font-family: monospace; font-size: 0.85em; }
.msg-text pre { background: var(--ec-surface-2); border: 1.5px solid var(--ec-border-hard); border-radius: 6px; padding: 10px 12px; overflow-x: auto; font-family: monospace; font-size: 0.82rem; margin: 4px 0; box-shadow: var(--ec-shadow-sm); }
.msg-text a { color: var(--ec-accent); text-decoration: underline; }
.msg-text .mention { background: rgba(115,103,240,0.15); color: var(--ec-accent-2); padding: 0 3px; border-radius: 3px; font-weight: 700; }
.edit-input { width: 100%; border: 1.5px solid var(--ec-border-hard); border-radius: var(--ec-radius-sm); padding: 6px 10px; font-size: 0.875rem; background: var(--ec-bg); color: var(--ec-text); box-shadow: var(--ec-shadow-sm); }
.edit-actions { display: flex; gap: 4px; margin-top: 4px; }
.edit-save-btn, .edit-cancel-btn { padding: 2px 10px; border-radius: var(--ec-radius-sm); border: 1.5px solid var(--ec-border-hard); font-size: 0.75rem; font-weight: 700; cursor: pointer; box-shadow: var(--ec-shadow-sm); transition: all 0.1s; }
.edit-save-btn { background: var(--ec-accent); color: #fff; } .edit-cancel-btn { background: var(--ec-surface); color: var(--ec-text); }
.edit-save-btn:hover, .edit-cancel-btn:hover { transform: translate(2px, 2px); box-shadow: none; }
.msg-attachment { margin-top: 4px; }
.msg-attachment img { max-width: 320px; max-height: 240px; object-fit: cover; border: 1.5px solid var(--ec-border-hard); border-radius: var(--ec-radius-sm); cursor: zoom-in; box-shadow: var(--ec-shadow-sm); display: block; }
.msg-file-download { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border: 1.5px solid var(--ec-border-hard); border-radius: var(--ec-radius-sm); background: var(--ec-surface); color: var(--ec-text); font-size: 0.8rem; text-decoration: none; box-shadow: var(--ec-shadow-sm); transition: all 0.1s; }
.msg-file-download:hover { transform: translate(2px, 2px); box-shadow: none; }
.og-preview { display: flex; gap: 10px; margin-top: 6px; border: 1.5px solid var(--ec-border-hard); border-radius: var(--ec-radius-sm); padding: 8px; background: var(--ec-surface); max-width: 420px; box-shadow: var(--ec-shadow-sm); border-left: 3px solid var(--ec-accent); }
.og-preview-text { flex: 1; min-width: 0; }
.og-preview-site { font-size: 0.7rem; font-weight: 800; color: var(--ec-accent); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
.og-preview-title { font-size: 0.82rem; font-weight: 700; color: var(--ec-text); text-decoration: none; display: block; margin-bottom: 2px; }
.og-preview-title:hover { text-decoration: underline; }
.og-preview-desc { font-size: 0.75rem; color: var(--ec-text-muted); }
.og-preview-img { width: 80px; height: 60px; object-fit: cover; border-radius: var(--ec-radius-sm); border: 1px solid var(--ec-border); flex-shrink: 0; }
.voice-player { margin-top: 4px; }
.voice-player audio { height: 32px; border: 1.5px solid var(--ec-border-hard); border-radius: 50px; box-shadow: var(--ec-shadow-sm); }
.hover-actions { position: absolute; top: -20px; right: 12px; display: none; align-items: center; gap: 1px; background: var(--ec-bg); border: 1.5px solid var(--ec-border-hard); border-radius: 50px; padding: 3px 5px; box-shadow: var(--ec-shadow-sm); z-index: 30; animation: hoverActionsIn 0.12s ease-out; }
@keyframes hoverActionsIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
.message-row:hover { z-index: 5; } .message-row:hover .hover-actions { display: flex; }
.hover-actions button { width: 26px; height: 26px; border: none; background: none; border-radius: 50%; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; transition: background 0.1s; color: var(--ec-text-muted); }
.hover-actions button:hover { background: var(--ec-surface); color: var(--ec-text); }
.action-sep { width: 1px; height: 16px; background: var(--ec-border); margin: 0 2px; flex-shrink: 0; }
.reactions-row { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.reaction-btn { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border: 1.5px solid var(--ec-border); border-radius: 50px; background: var(--ec-surface); cursor: pointer; font-size: 0.82rem; transition: all 0.1s; font-weight: 600; }
.reaction-btn:hover { border-color: var(--ec-accent); background: var(--ec-accent-light); }
.reaction-btn.active { background: var(--ec-accent-light); border-color: var(--ec-accent); color: var(--ec-accent-2); box-shadow: var(--ec-shadow-sm); }
.reaction-emoji { font-size: 0.9rem; } .reaction-count { font-size: 0.7rem; font-weight: 800; }
.thread-reply-count { display: inline-flex; align-items: center; gap: 4px; margin-top: 4px; padding: 2px 8px; background: none; border: 1.5px solid var(--ec-border); border-radius: 50px; font-size: 0.75rem; font-weight: 700; color: var(--ec-accent); cursor: pointer; transition: all 0.1s; }
.thread-reply-count:hover { border-color: var(--ec-accent); background: var(--ec-accent-light); box-shadow: var(--ec-shadow-sm); }
.date-separator { display: flex; align-items: center; gap: 12px; padding: 12px 16px 6px; user-select: none; }
.date-separator-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ec-text-muted); padding: 2px 10px; border: 1.5px solid var(--ec-border-hard); border-radius: 50px; background: var(--ec-surface); box-shadow: var(--ec-shadow-sm); }
.unread-divider { display: flex; align-items: center; gap: 10px; padding: 8px 16px; user-select: none; }
.unread-divider-line { flex: 1; height: 1.5px; background: var(--ec-red); }
.unread-divider-text { font-size: 0.7rem; font-weight: 800; color: var(--ec-red); text-transform: uppercase; letter-spacing: 0.06em; }
.load-more-trigger { padding: 12px 16px; text-align: center; }
.load-more-btn { padding: 5px 16px; border: 1.5px solid var(--ec-border-hard); border-radius: 50px; background: var(--ec-surface); color: var(--ec-text-muted); font-size: 0.78rem; font-weight: 700; cursor: pointer; box-shadow: var(--ec-shadow-sm); transition: all 0.1s; }
.load-more-btn:hover { transform: translate(2px, 2px); box-shadow: none; color: var(--ec-text); }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 40px 20px; text-align: center; gap: 10px; }
.empty-state-icon { font-size: 3rem; font-weight: 900; color: var(--ec-accent); line-height: 1; }
.empty-state h3 { font-size: 1rem; font-weight: 800; color: var(--ec-text); margin: 0; }
.empty-state p { font-size: 0.82rem; color: var(--ec-text-muted); margin: 0; max-width: 280px; }
.input-area { padding: 10px 14px 14px; border-top: 2px solid var(--ec-border-hard); background: var(--ec-bg); position: relative; flex-shrink: 0; }
.away-warning { display: flex; align-items: center; gap: 6px; padding: 6px 10px; margin-bottom: 8px; border: 1.5px solid #b45309; border-radius: var(--ec-radius-sm); background: #fef3c7; font-size: 0.78rem; color: #92400e; }
.typing-indicator { display: flex; align-items: center; gap: 6px; padding: 2px 4px; margin-bottom: 6px; font-size: 0.78rem; color: var(--ec-text-muted); font-style: italic; }
.typing-dots { display: inline-flex; gap: 2px; align-items: center; }
.typing-dots span { width: 4px; height: 4px; border-radius: 50%; background: var(--ec-text-muted); animation: typingBounce 1.2s ease-in-out infinite; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; } .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-4px); opacity: 1; } }
.attachment-preview { display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; margin-bottom: 8px; border: 1.5px solid var(--ec-border-hard); border-radius: var(--ec-radius-sm); background: var(--ec-surface); font-size: 0.8rem; box-shadow: var(--ec-shadow-sm); }
.attachment-preview button { border: none; background: none; cursor: pointer; color: var(--ec-red); font-size: 0.9rem; }
.attachment-preview-info { display: flex; align-items: center; gap: 6px; }
.input-box { border: 2px solid var(--ec-border-hard); border-radius: var(--ec-radius); background: var(--ec-bg); box-shadow: var(--ec-shadow); overflow: hidden; transition: border-color 0.15s, box-shadow 0.15s; }
.input-box:focus-within { border-color: var(--ec-accent); box-shadow: 3px 3px 0 0 var(--ec-accent); }
.input-box textarea { width: 100%; border: none; outline: none; background: transparent; color: var(--ec-text); font-size: 0.875rem; padding: 10px 12px 6px; resize: none; font-family: inherit; min-height: 40px; max-height: 160px; line-height: 1.5; }
.input-box textarea::placeholder { color: var(--ec-text-dim); }
.input-bottom-bar { display: flex; align-items: center; gap: 2px; padding: 4px 8px; border-top: 1px solid var(--ec-border); }
.format-group, .action-group { display: flex; align-items: center; gap: 1px; }
.fmt-btn, .act-btn { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border: none; background: none; border-radius: var(--ec-radius-sm); cursor: pointer; color: var(--ec-text-muted); font-size: 0.8rem; transition: background 0.1s; }
.fmt-btn:hover, .act-btn:hover { background: var(--ec-surface); color: var(--ec-text); }
.input-sep { width: 1px; height: 16px; background: var(--ec-border); margin: 0 4px; flex-shrink: 0; }
.send-btn { margin-left: auto; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--ec-border); border-radius: var(--ec-radius-sm); background: var(--ec-surface); color: var(--ec-text-dim); cursor: pointer; font-size: 0.9rem; transition: all 0.1s; flex-shrink: 0; }
.send-btn.has-content { background: var(--ec-accent); border: 2px solid var(--ec-border-hard); color: #fff; box-shadow: var(--ec-shadow-sm); }
.send-btn.has-content:hover { transform: translate(2px, 2px); box-shadow: none; }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.voice-recording-indicator { display: flex; align-items: center; gap: 8px; padding: 6px 10px; margin-bottom: 8px; border: 1.5px solid var(--ec-red); border-radius: var(--ec-radius-sm); background: #fef2f2; }
.recording-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ec-red); animation: recordPulse 1s ease-in-out infinite; }
@keyframes recordPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.recording-time { font-size: 0.8rem; font-weight: 700; color: var(--ec-red); }
.voice-recording-indicator button { border: none; background: none; cursor: pointer; font-size: 0.85rem; }
.emoji-picker, .gif-picker { position: absolute; bottom: calc(100% + 6px); left: 0; background: var(--ec-bg); border: 2px solid var(--ec-border-hard); border-radius: var(--ec-radius); box-shadow: var(--ec-shadow); z-index: 40; padding: 10px; }
.emoji-picker { width: 280px; display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; max-height: 240px; overflow-y: auto; }
.emoji-picker button { font-size: 1.1rem; padding: 4px; border: none; background: none; border-radius: 4px; cursor: pointer; text-align: center; line-height: 1; }
.emoji-picker button:hover { background: var(--ec-surface); }
.gif-picker { width: 300px; }
.gif-picker input { width: 100%; border: 1.5px solid var(--ec-border-hard); border-radius: var(--ec-radius-sm); padding: 5px 8px; font-size: 0.8rem; background: var(--ec-surface); color: var(--ec-text); margin-bottom: 8px; box-sizing: border-box; }
.gif-picker input:focus { outline: none; border-color: var(--ec-accent); }
.gif-picker-results { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; max-height: 200px; overflow-y: auto; }
.gif-picker-results img { width: 100%; height: 70px; object-fit: cover; border-radius: var(--ec-radius-sm); border: 1px solid var(--ec-border); cursor: pointer; transition: border-color 0.1s; }
.gif-picker-results img:hover { border-color: var(--ec-accent); }
.slash-dropdown { position: absolute; bottom: calc(100% + 6px); left: 0; right: 0; background: var(--ec-bg); border: 2px solid var(--ec-border-hard); border-radius: var(--ec-radius); box-shadow: var(--ec-shadow); z-index: 40; overflow: hidden; }
.slash-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--ec-border); transition: background 0.1s; }
.slash-item:last-child { border-bottom: none; }
.slash-item:hover, .slash-item.active { background: var(--ec-surface); }
.slash-item-icon { font-size: 1rem; } .slash-item-name { font-size: 0.82rem; font-weight: 700; color: var(--ec-text); } .slash-item-desc { font-size: 0.75rem; color: var(--ec-text-muted); margin-left: auto; }
.mention-dropdown { position: absolute; bottom: calc(100% + 6px); left: 0; right: 0; background: var(--ec-bg); border: 2px solid var(--ec-border-hard); border-radius: var(--ec-radius); box-shadow: var(--ec-shadow); z-index: 40; max-height: 220px; overflow-y: auto; }
.mention-item { display: flex; align-items: center; gap: 8px; padding: 6px 12px; cursor: pointer; border-bottom: 1px solid var(--ec-border); transition: background 0.1s; }
.mention-item:last-child { border-bottom: none; }
.mention-item:hover, .mention-item.active { background: var(--ec-accent-light); }
.mention-item-avatar { width: 28px; height: 28px; border-radius: 6px; border: 1.5px solid var(--ec-border-hard); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem; color: #fff; flex-shrink: 0; overflow: hidden; }
.mention-item-info { flex: 1; min-width: 0; }
.mention-item-name { font-size: 0.82rem; font-weight: 700; color: var(--ec-text); }
.mention-item-username { font-size: 0.75rem; color: var(--ec-text-muted); margin-left: 4px; }
.mention-item-broadcast { font-size: 0.75rem; color: var(--ec-text-muted); }
.mention-item-role { font-size: 0.6rem; font-weight: 700; padding: 1px 5px; border-radius: 3px; flex-shrink: 0; }
.chat-thread-panel { width: 320px; min-width: 320px; border-left: 2px solid var(--ec-border-hard); display: flex; flex-direction: column; background: var(--ec-bg); overflow: hidden; flex-shrink: 0; }
.thread-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1.5px solid var(--ec-border-hard); }
.thread-header h3 { margin: 0; font-size: 0.9rem; font-weight: 800; color: var(--ec-text); }
.thread-close { border: none; background: none; cursor: pointer; color: var(--ec-text-muted); font-size: 0.9rem; padding: 2px 6px; border-radius: 4px; }
.thread-close:hover { background: var(--ec-surface); color: var(--ec-text); }
.thread-parent { padding: 12px 14px; border-bottom: 1px solid var(--ec-border); background: var(--ec-surface); }
.thread-parent .msg-header { margin-bottom: 4px; }
.thread-parent .msg-text { font-size: 0.85rem; background: transparent; border: none; padding: 0; display: block; }
.thread-parent-img { max-width: 200px; max-height: 140px; object-fit: cover; border: 1.5px solid var(--ec-border-hard); border-radius: var(--ec-radius-sm); margin-bottom: 4px; display: block; }
.thread-replies-divider { padding: 8px 14px; border-bottom: 1px solid var(--ec-border); font-size: 0.7rem; font-weight: 800; color: var(--ec-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.thread-messages { flex: 1; overflow-y: auto; padding: 8px 0; }
.thread-reply { display: flex; gap: 8px; padding: 4px 14px; }
.thread-reply-avatar { width: 28px; height: 28px; min-width: 28px; border-radius: 6px; border: 1.5px solid var(--ec-border-hard); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.7rem; color: #fff; overflow: hidden; flex-shrink: 0; }
.thread-reply-body { flex: 1; min-width: 0; }
.thread-reply-meta { display: flex; align-items: baseline; gap: 6px; margin-bottom: 2px; }
.thread-reply-author { font-size: 0.82rem; font-weight: 700; color: var(--ec-text); }
.thread-reply-time { font-size: 0.65rem; color: var(--ec-text-dim); }
.thread-reply-text { font-size: 0.82rem; color: var(--ec-text); line-height: 1.5; }
.thread-empty { padding: 20px 14px; text-align: center; color: var(--ec-text-muted); font-size: 0.82rem; font-style: italic; }
.thread-input { padding: 10px 14px; border-top: 1.5px solid var(--ec-border-hard); }
.thread-input form { display: flex; gap: 6px; }
.thread-input input { flex: 1; border: 1.5px solid var(--ec-border-hard); border-radius: var(--ec-radius-sm); padding: 6px 10px; font-size: 0.82rem; background: var(--ec-surface); color: var(--ec-text); }
.thread-input input:focus { outline: none; border-color: var(--ec-accent); }
.thread-input button { padding: 6px 14px; border: 1.5px solid var(--ec-border-hard); border-radius: var(--ec-radius-sm); background: var(--ec-accent); color: #fff; font-size: 0.78rem; font-weight: 700; cursor: pointer; box-shadow: var(--ec-shadow-sm); transition: all 0.1s; }
.thread-input button:hover { transform: translate(2px, 2px); box-shadow: none; }

/* ─── 16. BOOKMARKS & MEMBERS PANELS ──────────── */
.bookmarks-panel, .members-panel {
    position: absolute;
    top: 0; right: 0; bottom: 0;
    width: 300px;
    background: var(--ec-bg);
    border-left: 2px solid var(--ec-border-hard);
    display: flex;
    flex-direction: column;
    z-index: 40;
    box-shadow: -4px 0 0 0 var(--ec-border-hard);
}
.bookmarks-panel-header, .members-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 2px solid var(--ec-border-hard);
    background: var(--ec-surface);
    font-weight: 700;
    font-size: 0.875rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ec-text);
}
.bookmarks-panel-header button, .members-panel-header button {
    width: 28px; height: 28px;
    border: 2px solid var(--ec-border-hard);
    border-radius: var(--ec-radius-sm);
    background: var(--ec-bg);
    color: var(--ec-text-muted);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
}
.bookmarks-panel-header button:hover, .members-panel-header button:hover {
    background: var(--ec-accent);
    color: #fff;
    box-shadow: var(--ec-shadow-sm);
    transform: translate(-1px,-1px);
}
.bookmarks-list, .members-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.bookmark-item {
    padding: 0.75rem;
    border: 2px solid var(--ec-border-hard);
    border-radius: var(--ec-radius-sm);
    background: var(--ec-surface);
    cursor: pointer;
    transition: all 0.15s;
}
.bookmark-item:hover {
    background: var(--ec-accent-light);
    box-shadow: var(--ec-shadow-sm);
    transform: translate(-1px,-1px);
}
.bookmark-item-author {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--ec-accent);
    margin-bottom: 0.25rem;
}
.bookmark-item-text {
    font-size: 0.8125rem;
    color: var(--ec-text);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.bookmark-item-time {
    font-size: 0.6875rem;
    color: var(--ec-text-dim);
    margin-top: 0.25rem;
}
.bookmark-item-remove {
    float: right;
    margin-top: -0.25rem;
    color: var(--ec-text-dim);
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 0.75rem;
}
.bookmark-item-remove:hover { color: var(--ec-red); background: rgba(239,68,68,0.1); }
.member-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 0.625rem;
    border-radius: var(--ec-radius-sm);
    cursor: default;
    transition: background 0.15s;
}
.member-item:hover { background: var(--ec-surface-2); }
.member-avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: 2px solid var(--ec-border-hard);
    object-fit: cover;
    flex-shrink: 0;
    font-size: 0.75rem;
    display: flex; align-items: center; justify-content: center;
    background: var(--ec-accent-light);
    color: var(--ec-accent);
    font-weight: 700;
}
.member-info { flex: 1; min-width: 0; }
.member-name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--ec-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.member-role {
    font-size: 0.6875rem;
    color: var(--ec-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}
.member-status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 2px solid var(--ec-bg);
}
.member-status-dot.online  { background: var(--ec-green); }
.member-status-dot.away    { background: var(--ec-yellow); }
.member-status-dot.offline { background: var(--ec-text-dim); }
.members-group-label {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ec-text-muted);
    padding: 0.5rem 0.625rem 0.25rem;
}
/* ─── 17. HOVERCARD ────────────────────────────── */
.hovercard {
    position: absolute;
    z-index: 200;
    width: 260px;
    background: var(--ec-bg);
    border: 2px solid var(--ec-border-hard);
    border-radius: var(--ec-radius);
    box-shadow: var(--ec-shadow);
    overflow: hidden;
    pointer-events: none;
}
.hovercard-banner {
    height: 60px;
    background: var(--ec-accent);
    position: relative;
}
.hovercard-avatar {
    position: absolute;
    bottom: -20px;
    left: 1rem;
    width: 48px; height: 48px;
    border-radius: 50%;
    border: 3px solid var(--ec-bg);
    object-fit: cover;
    background: var(--ec-surface);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ec-accent);
}
.hovercard-body {
    padding: 1.5rem 1rem 1rem;
}
.hovercard-name {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--ec-text);
    margin-bottom: 0.125rem;
}
.hovercard-username {
    font-size: 0.75rem;
    color: var(--ec-text-muted);
    margin-bottom: 0.5rem;
}
.hovercard-bio {
    font-size: 0.8125rem;
    color: var(--ec-text-2);
    line-height: 1.45;
    border-top: 2px solid var(--ec-border);
    padding-top: 0.5rem;
}
.hovercard-status {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border: 2px solid var(--ec-border-hard);
    border-radius: var(--ec-radius-sm);
    background: var(--ec-surface);
    color: var(--ec-text-muted);
    margin-bottom: 0.5rem;
}

/* ─── 18. LIGHTBOX ──────────────────────────────── */
.lightbox-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}
.lightbox-img {
    max-width: 90vw;
    max-height: 85vh;
    object-fit: contain;
    border: 3px solid var(--ec-border-hard);
    border-radius: var(--ec-radius);
    box-shadow: 6px 6px 0 0 rgba(255,255,255,0.15);
}
.lightbox-close {
    position: absolute;
    top: 1rem; right: 1rem;
    width: 40px; height: 40px;
    background: var(--ec-bg);
    border: 2px solid var(--ec-border-hard);
    border-radius: var(--ec-radius-sm);
    color: var(--ec-text);
    font-size: 1.25rem;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
}
.lightbox-close:hover {
    background: var(--ec-red);
    color: #fff;
    box-shadow: var(--ec-shadow-sm);
    transform: translate(-1px,-1px);
}
.lightbox-caption {
    position: absolute;
    bottom: 1.5rem;
    left: 50%; transform: translateX(-50%);
    background: var(--ec-bg);
    border: 2px solid var(--ec-border-hard);
    border-radius: var(--ec-radius-sm);
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
    color: var(--ec-text-muted);
    white-space: nowrap;
}
/* ─── 19. NOTIFICATION BANNER ──────────────────── */
.notification-banner {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 500;
    max-width: 340px;
    background: var(--ec-bg);
    border: 2px solid var(--ec-border-hard);
    border-radius: var(--ec-radius);
    box-shadow: var(--ec-shadow);
    padding: 0.75rem 1rem;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    animation: slideInRight 0.25s ease;
}
@keyframes slideInRight {
    from { transform: translateX(110%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
}
.notification-banner.leaving {
    animation: slideOutRight 0.25s ease forwards;
}
@keyframes slideOutRight {
    from { transform: translateX(0);    opacity: 1; }
    to   { transform: translateX(110%); opacity: 0; }
}
.notification-banner-icon {
    width: 36px; height: 36px;
    flex-shrink: 0;
    border-radius: 50%;
    border: 2px solid var(--ec-border-hard);
    object-fit: cover;
    background: var(--ec-accent-light);
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem;
}
.notification-banner-body { flex: 1; min-width: 0; }
.notification-banner-title {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--ec-text);
    margin-bottom: 0.125rem;
}
.notification-banner-text {
    font-size: 0.75rem;
    color: var(--ec-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.notification-banner-close {
    width: 20px; height: 20px;
    flex-shrink: 0;
    border: none;
    background: transparent;
    color: var(--ec-text-dim);
    cursor: pointer;
    font-size: 0.875rem;
    display: flex; align-items: center; justify-content: center;
    border-radius: 4px;
    padding: 0;
}
.notification-banner-close:hover { color: var(--ec-red); background: rgba(239,68,68,0.1); }

/* ─── 20. KEYBOARD HINTS ───────────────────────── */
.keyboard-hints {
    position: fixed;
    bottom: 1rem; right: 1rem;
    z-index: 300;
    background: var(--ec-bg);
    border: 2px solid var(--ec-border-hard);
    border-radius: var(--ec-radius);
    box-shadow: var(--ec-shadow);
    padding: 1rem;
    min-width: 220px;
}
.keyboard-hints-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--ec-text-muted);
    margin-bottom: 0.625rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--ec-border);
}
.keyboard-hint-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.25rem 0;
}
.keyboard-hint-label {
    font-size: 0.75rem;
    color: var(--ec-text-2);
}
.keyboard-hint-key {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
}
.keyboard-hint-key kbd {
    display: inline-block;
    padding: 0.125rem 0.375rem;
    font-size: 0.6875rem;
    font-family: ui-monospace, monospace;
    font-weight: 700;
    background: var(--ec-surface-2);
    border: 2px solid var(--ec-border-hard);
    border-radius: 4px;
    color: var(--ec-text);
    line-height: 1.4;
    box-shadow: 0 2px 0 0 var(--ec-border-hard);
}
/* ─── 21. PULL TO REFRESH ──────────────────────── */
.pull-to-refresh {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    font-size: 0.8125rem;
    color: var(--ec-text-muted);
    font-weight: 600;
    background: var(--ec-surface);
    border-bottom: 2px solid var(--ec-border);
}
.pull-to-refresh-spinner {
    width: 18px; height: 18px;
    border: 2px solid var(--ec-border-hard);
    border-top-color: var(--ec-accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── 22. MISC — PINNED BAR, EMPTY STATES ──────── */
.pinned-bar {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 1rem;
    background: var(--ec-surface);
    border-bottom: 2px solid var(--ec-border);
    font-size: 0.8125rem;
    color: var(--ec-text-2);
}
.pinned-bar-icon {
    color: var(--ec-accent);
    font-size: 0.875rem;
    flex-shrink: 0;
}
.pinned-bar-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
}
.pinned-bar-btn {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ec-accent);
    cursor: pointer;
    padding: 0.2rem 0.5rem;
    border: 2px solid var(--ec-accent);
    border-radius: 4px;
    background: transparent;
    transition: all 0.15s;
}
.pinned-bar-btn:hover {
    background: var(--ec-accent);
    color: #fff;
}
.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: var(--ec-text-dim);
    padding: 2rem;
    text-align: center;
}
.empty-state-icon {
    font-size: 2.5rem;
    opacity: 0.5;
}
.empty-state-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--ec-text-muted);
}
.empty-state-text {
    font-size: 0.8125rem;
    color: var(--ec-text-dim);
    max-width: 240px;
    line-height: 1.5;
}
.typing-indicator {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 1rem 0.5rem;
    font-size: 0.75rem;
    color: var(--ec-text-muted);
    min-height: 1.5rem;
}
.typing-dots {
    display: flex;
    align-items: center;
    gap: 3px;
}
.typing-dots span {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--ec-text-muted);
    animation: typingBounce 1.2s ease infinite;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typingBounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-4px); }
}
.message-edited-label {
    font-size: 0.6875rem;
    color: var(--ec-text-dim);
    margin-left: 0.25rem;
    font-style: italic;
}
.unread-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--ec-accent);
    flex-shrink: 0;
}
.unread-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px; height: 18px;
    padding: 0 4px;
    background: var(--ec-accent);
    color: #fff;
    font-size: 0.6875rem;
    font-weight: 700;
    border-radius: 9px;
    line-height: 1;
    border: 2px solid var(--ec-bg);
}
/* ─── 23. SCROLLBAR STYLING ────────────────────── */
.chat-messages::-webkit-scrollbar,
.bookmarks-list::-webkit-scrollbar,
.members-list::-webkit-scrollbar,
.thread-messages::-webkit-scrollbar,
.emoji-grid::-webkit-scrollbar {
    width: 6px;
}
.chat-messages::-webkit-scrollbar-track,
.bookmarks-list::-webkit-scrollbar-track,
.members-list::-webkit-scrollbar-track,
.thread-messages::-webkit-scrollbar-track,
.emoji-grid::-webkit-scrollbar-track {
    background: var(--ec-surface);
}
.chat-messages::-webkit-scrollbar-thumb,
.bookmarks-list::-webkit-scrollbar-thumb,
.members-list::-webkit-scrollbar-thumb,
.thread-messages::-webkit-scrollbar-thumb,
.emoji-grid::-webkit-scrollbar-thumb {
    background: var(--ec-border-hard);
    border-radius: 3px;
}
.chat-messages::-webkit-scrollbar-thumb:hover,
.bookmarks-list::-webkit-scrollbar-thumb:hover,
.members-list::-webkit-scrollbar-thumb:hover,
.thread-messages::-webkit-scrollbar-thumb:hover,
.emoji-grid::-webkit-scrollbar-thumb:hover {
    background: var(--ec-accent);
}

/* ─── 24. RESPONSIVE ───────────────────────────── */
@media (max-width: 768px) {
    .chat-wrapper {
        flex-direction: column;
        height: auto;
        min-height: 100dvh;
    }
    .chat-sidebar {
        width: 100%;
        height: auto;
        max-height: 200px;
        border-right: none;
        border-bottom: 2px solid var(--ec-border-hard);
        flex-direction: row;
        overflow-x: auto;
        overflow-y: hidden;
    }
    .sidebar-header,
    .sidebar-section-label,
    .sidebar-footer { display: none; }
    .channel-item, .dm-item {
        flex-shrink: 0;
        min-width: 100px;
    }
    .chat-main { height: calc(100dvh - 200px); }
    .thread-panel {
        position: fixed;
        inset: 0;
        z-index: 100;
        width: 100%;
        border-left: none;
    }
    .bookmarks-panel, .members-panel {
        position: fixed;
        inset: 0;
        z-index: 100;
        width: 100%;
        border-left: none;
    }
}
@media (max-width: 480px) {
    .message-row { padding: 0.375rem 0.75rem; }
    .chat-input-wrapper { padding: 0.75rem; }
    .chat-header { padding: 0 0.75rem; }
    .msg-bubble { max-width: 95%; }
    .hover-actions { display: none; }
}

/* ─── 25. UTILITY ANIMATIONS ───────────────────── */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fadeIn 0.2s ease; }

@keyframes scaleIn {
    from { opacity: 0; transform: scale(0.9); }
    to   { opacity: 1; transform: scale(1); }
}
.animate-scale-in { animation: scaleIn 0.15s ease; }

.transition-all { transition: all 0.15s ease; }

/* ─── 26. FOCUS VISIBLE ────────────────────────── */
*:focus-visible {
    outline: 2px solid var(--ec-accent);
    outline-offset: 2px;
}
button:focus-visible,
input:focus-visible,
textarea:focus-visible {
    outline: 2px solid var(--ec-accent);
    outline-offset: 2px;
}

</style>

    <div class="chat-wrapper" wire:poll.3s @touchstart="handleTouchStart($event)" @touchmove="handleTouchMove($event)"
        x-data="{
            sidebarOpen: window.innerWidth > 768,
            showBookmarks: false,
            showMembers: false,
            showSlashCommands: false,
            slashSuggestions: [],
            slashIndex: 0,
            showNotifBanner: (typeof Notification !== 'undefined' && Notification.permission === 'default'),
            notifSoundEnabled: true,
            mobileTab: 'chat',
            compactView: localStorage.getItem('chat_compact_view') === 'true',
            touchStartX: 0,
            touchStartY: 0,
            pulling: false,
            pullDistance: 0,
            notifAudio: null,
            lastMsgId: '{{ $this->messages->first()?->id ?? '' }}',
            lastMsgCount: {{ $this->messages->count() }},
            lightboxUrl: null,
            drafts: new Set(),
            showKeyboardHints: false,
            keyHintTimeout: null,
            init() {
                this.notifAudio = new Audio('data:audio/wav;base64,UklGRl9vT19teleWQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + 'tvT19t');
                this.notifAudio.volume = 0.3;
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('chat_draft_') && localStorage.getItem(key)?.trim()) {
                        this.drafts.add(key.replace('chat_draft_', ''));
                    }
                }

                // Keyboard shortcuts hint overlay
                document.addEventListener('keydown', (e) => {
                    if (e.ctrlKey && !this.showKeyboardHints) {
                        clearTimeout(this.keyHintTimeout);
                        this.showKeyboardHints = true;
                        this.keyHintTimeout = setTimeout(() => {
                            this.showKeyboardHints = false;
                        }, 2000);
                    }
                });
                this.initKeyboardShortcuts();
            },
            saveDraft(key, value) {
                if (value && value.trim()) {
                    localStorage.setItem('chat_draft_' + key, value);
                    this.drafts.add(key);
                } else {
                    localStorage.removeItem('chat_draft_' + key);
                    this.drafts.delete(key);
                }
            },
            getDraft(key) {
                return localStorage.getItem('chat_draft_' + key) || '';
            },
            clearDraft(key) {
                localStorage.removeItem('chat_draft_' + key);
                this.drafts.delete(key);
            },
            handleTouchStart(e) {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            },
            handleTouchMove(e) {
                if (!e.touches[0]) return;
                const deltaX = e.touches[0].clientX - this.touchStartX;
                const deltaY = e.touches[0].clientY - this.touchStartY;

                // Horizontal swipe (sidebar toggle)
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                    if (deltaX > 0 && this.touchStartX < 30 && window.innerWidth <= 768) {
                        this.sidebarOpen = true;
                    } else if (deltaX < -50 && this.sidebarOpen && window.innerWidth <= 768) {
                        this.sidebarOpen = false;
                    }
                }
            },
            handlePullStart(e) {
                const scrollTop = e.currentTarget.scrollTop;
                if (scrollTop === 0 && window.innerWidth <= 768) {
                    this.touchStartY = e.touches[0].clientY;
                    this.pulling = true;
                }
            },
            handlePullMove(e) {
                if (!this.pulling || !e.touches[0]) return;
                const delta = e.touches[0].clientY - this.touchStartY;
                if (delta > 0) {
                    this.pullDistance = Math.min(delta, 80);
                    if (this.pullDistance > 40) {
                        e.preventDefault();
                    }
                }
            },
            handlePullEnd() {
                if (this.pullDistance > 60) {
                    $wire.call('$refresh');
                }
                this.pulling = false;
                this.pullDistance = 0;
            },
            toggleCompactView() {
                this.compactView = !this.compactView;
                localStorage.setItem('chat_compact_view', this.compactView);
            },
            sendMessage() {
                $wire.call('sendMessage');
            },
            allUsers: @js($this->mentionUsersJson),
            hovercardData: null,
            hovercardPos: { x: 0, y: 0 },
            hovercardTimeout: null,
            async showHovercard(userId, event) {
                clearTimeout(this.hovercardTimeout);
                this.hovercardTimeout = setTimeout(async () => {
                    const rect = event.target.getBoundingClientRect();
                    this.hovercardPos = { x: rect.left, y: rect.bottom + 8 };
                    this.hovercardData = await $wire.getUserHovercard(userId);
                }, 400);
            },
            hideHovercard() {
                clearTimeout(this.hovercardTimeout);
                setTimeout(() => { this.hovercardData = null; }, 200);
            }
         }" x-effect="
            let newId = '{{ $this->messages->first()?->id ?? '' }}';
            let newCount = {{ $this->messages->count() }};
            if (newId && newId !== lastMsgId && newCount > lastMsgCount) {
                let latestUserId = {{ $this->messages->first()?->user_id ?? 0 }};
                if (latestUserId !== {{ auth()->id() }}) {
                    try { notifAudio.play(); } catch(e) {}
                }
            }
            lastMsgId = newId;
            lastMsgCount = newCount;
         "
        @keydown.window.ctrl.k.prevent="$wire.set('showSearch', true); $nextTick(() => { if ($refs.searchInput) $refs.searchInput.focus(); })"
        @keydown.window.ctrl.enter.prevent="sendMessage()"
        @keydown.window.ctrl.shift.s.prevent="sidebarOpen = !sidebarOpen"
        @keydown.window.ctrl.shift.t.prevent="activeThread = null"
        @keydown.window.escape="activeThread = null; lightboxUrl = null">

        {{-- ===== SIDEBAR ===== --}}
        <div class="chat-sidebar" :class="{ 'active': sidebarOpen }" 
            @click.away="if (window.innerWidth <= 900) sidebarOpen = false">
            <div class="sidebar-header">
                <div class="sidebar-header-top">
                    <div class="workspace-name">
                        TechPlay Redakcija
                        <span class="chevron">&#9660;</span>
                    </div>
                    @if(auth()->user()->hasRole('Super Admin'))
                        <a href="{{ \App\Filament\Resources\EditorialChannelResource::getUrl() }}" class="compose-btn"
                            title="Manage Channels">&#9881;</a>
                    @endif
                </div>

                <div class="sidebar-user">
                    @php $myPresence = $this->getUserPresence(auth()->user()); @endphp
                    <div class="sidebar-user-avatar" style="background: var(--tp-accent);">
                        @if(auth()->user()->avatar_url)
                            <img src="{{ auth()->user()->avatar_url }}" class="avatar-img" alt="">
                        @else
                            {{ substr(auth()->user()->name, 0, 1) }}
                        @endif
                    </div>
                    <span class="sidebar-user-name">{{ auth()->user()->name }}</span>
                    @php $myCustomStatus = $this->getCustomStatus(auth()->user()); @endphp
                    <div class="status-selector"
                        x-data="{ open: false, showStatusPicker: false, pickerEmoji: '{{ $myCustomStatus['emoji'] ?? '' }}', pickerText: '{{ $myCustomStatus['text'] ?? '' }}' }">
                        <button @click="open = !open; showStatusPicker = false" class="status-trigger"
                            title="Set status">
                            @if($myCustomStatus)
                                <span class="custom-status-emoji">{{ $myCustomStatus['emoji'] }}</span>
                            @else
                                <span class="status-dot {{ $myPresence }}"></span>
                            @endif
                        </button>
                        <div x-show="open" @click.away="open = false" x-transition class="status-dropdown">
                            @if($myCustomStatus)
                                <button wire:click="clearCustomStatus" @click="open = false">
                                    &#10005; Clear "{{ $myCustomStatus['emoji'] }} {{ $myCustomStatus['text'] }}"
                                </button>
                                <div style="height: 1px; background: var(--tp-border-faint); margin: 4px 0;"></div>
                            @endif
                            <button @click="showStatusPicker = !showStatusPicker">
                                &#128172; Set a status...
                            </button>
                            <div style="height: 1px; background: var(--tp-border-faint); margin: 4px 0;"></div>
                            <button wire:click="setUserStatus('online')" @click="open = false">
                                <span class="status-dot online"></span> Online
                            </button>
                            <button wire:click="setUserStatus('away')" @click="open = false">
                                <span class="status-dot away"></span> Away
                            </button>
                            <button wire:click="setUserStatus('busy')" @click="open = false">
                                <span class="status-dot busy"></span> Do Not Disturb
                            </button>
                        </div>
                        {{-- Custom status picker --}}
                        <div x-show="showStatusPicker" @click.away="showStatusPicker = false" x-transition
                            class="status-picker">
                            <div class="status-emoji-grid">
                                @foreach(['📝', '🏠', '☕', '🚌', '🤒', '🌴', '🎯', '💬', '🎮', '📞', '🍽️', '🎵', '💤', '🔇', '✈️', '🏃'] as $emoji)
                                    <button type="button" @click="pickerEmoji = '{{ $emoji }}'">{{ $emoji }}</button>
                                @endforeach
                            </div>
                            <input type="text" x-model="pickerText" placeholder="What's your status?" maxlength="80">
                            <div class="status-duration-row">
                                <button type="button" class="status-duration-btn"
                                    @click="$wire.setCustomStatus(pickerEmoji || '💬', pickerText, 30); open = false; showStatusPicker = false">30m</button>
                                <button type="button" class="status-duration-btn"
                                    @click="$wire.setCustomStatus(pickerEmoji || '💬', pickerText, 60); open = false; showStatusPicker = false">1h</button>
                                <button type="button" class="status-duration-btn"
                                    @click="$wire.setCustomStatus(pickerEmoji || '💬', pickerText, 240); open = false; showStatusPicker = false">4h</button>
                                <button type="button" class="status-duration-btn"
                                    @click="$wire.setCustomStatus(pickerEmoji || '💬', pickerText, 480); open = false; showStatusPicker = false">Today</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {{-- Quick Nav --}}
            <div class="sidebar-nav">
                @php $totalUnread = $this->unreadCount; @endphp
                <div class="nav-item">
                    <span class="nav-icon">&#128172;</span>
                    <span>All Unreads</span>
                    @if($totalUnread > 0)
                        <span class="nav-badge">{{ $totalUnread }}</span>
                    @endif
                </div>
                <div class="nav-item">
                    <span class="nav-icon">&#129525;</span>
                    <span>Threads</span>
                    @if($this->unreadThreadReplies > 0)
                        <span class="nav-badge">{{ $this->unreadThreadReplies }}</span>
                    @endif
                </div>
                <div class="nav-item" @click="showBookmarks = !showBookmarks; showMembers = false" :style="showBookmarks ? 'background:#ede9fe;border:2px solid #7367f0;box-shadow:2px 2px 0 0 #7367f0;border-radius:6px;' : ''">
                    <span class="nav-icon">&#128278;</span>
                    <span>Saved</span>
                </div>
            </div>

            <div class="sidebar-content">
                {{-- Channels --}}
                <div class="sidebar-section">
                    <div class="section-header">
                        <span class="section-title">
                            <span class="toggle-icon">&#9660;</span> Channels
                        </span>
                    </div>

                    @foreach($this->channels as $channel)
                        @php $channelUnread = $this->getChannelUnreadCount($channel->slug); @endphp
                        <div wire:click="setChannel('{{ $channel->slug }}')"
                            class="channel-item {{ $this->activeChannel === $channel->slug ? 'active' : '' }} {{ $channelUnread > 0 && $this->activeChannel !== $channel->slug ? 'unread' : '' }}">
                            <span class="channel-hash">#</span>
                            <span class="channel-name">{{ $channel->name }}</span>
                            @if($channel->is_private)
                                <span class="channel-lock">&#128274;</span>
                            @endif
                            <template x-if="drafts.has('{{ $channel->slug }}')">
                                <span class="draft-indicator">draft</span>
                            </template>
                            @if($channelUnread > 0 && $this->activeChannel !== $channel->slug)
                                <span class="unread-badge">{{ $channelUnread > 99 ? '99+' : $channelUnread }}</span>
                            @endif
                        </div>
                    @endforeach
                </div>

                {{-- Direct Messages --}}
                <div class="sidebar-section" style="margin-top: 8px;">
                    <div class="section-header">
                        <span class="section-title">
                            <span class="toggle-icon">&#9660;</span> Direct Messages
                        </span>
                    </div>

                    @foreach($this->users as $user)
                        @php
                            $roleBadge = $this->getUserRoleBadge($user);
                            $presence = $this->getUserPresence($user);
                        @endphp
                        <div wire:click="setRecipient({{ $user->id }})"
                            class="dm-item {{ $this->activeRecipient === $user->id ? 'active' : '' }}">
                            <div class="dm-avatar" style="background: {{ $roleBadge['color'] }};">
                                @if($user->avatar_url)
                                    <img src="{{ $user->avatar_url }}" class="avatar-img" alt="">
                                @else
                                    {{ substr($user->name, 0, 1) }}
                                @endif
                                <div class="dm-status {{ $presence }}"></div>
                            </div>
                            <span class="dm-name">{{ $user->name }}</span>
                            @if($user->unread_count > 0)
                                <span class="unread-badge">{{ $user->unread_count }}</span>
                            @endif
                        </div>
                    @endforeach
                </div>
            </div>
        </div>

        {{-- ===== MAIN CHAT ===== --}}
        <div class="chat-main">
            {{-- Header --}}
            <div class="chat-header" style="position: relative;">
                <button @click="sidebarOpen = !sidebarOpen" class="mobile-menu-btn" title="Menu">&#9776;</button>
                @if($this->activeChannel)
                    @php $channel = $this->channels->firstWhere('slug', $this->activeChannel); @endphp
                    @if($channel)
                        <span class="header-channel-name">
                            <span class="hash">#</span>{{ $channel->name }}
                        </span>

                        <div class="header-divider"></div>

                        @if($this->editingTopic)
                            <div class="topic-edit-row">
                                <input type="text" wire:model.live="topicContent" placeholder="Add a topic..." autofocus
                                    @keydown.enter.prevent="$wire.saveTopic()" @keydown.escape="$wire.cancelEditTopic()">
                                <button wire:click="saveTopic" class="topic-edit-btn" style="color: #22c55e;">&#10003;</button>
                                <button wire:click="cancelEditTopic" class="topic-edit-btn"
                                    style="color: var(--tp-text-muted);">&#10005;</button>
                            </div>
                        @else
                            <span
                                class="header-topic {{ auth()->user()->hasRole(['Super Admin', 'Editor-in-Chief', 'Editor']) ? 'editable' : '' }}"
                                @if(auth()->user()->hasRole(['Super Admin', 'Editor-in-Chief', 'Editor']))
                                wire:click="startEditTopic" title="Click to edit topic" @endif>
                                {{ $channel->topic ?? $channel->description ?? 'Add a topic' }}
                            </span>
                        @endif
                    @endif
                @elseif($this->activeRecipient)
                    @php
                        $recipient = $this->users->find($this->activeRecipient);
                        $recipientPresence = $this->getUserPresence($recipient);
                        $roleBadge = $this->getUserRoleBadge($recipient);
                        $presenceLabels = ['online' => 'Active', 'away' => 'Away', 'busy' => 'DND', 'offline' => 'Offline'];
                        $presenceColors = ['online' => '#22c55e', 'away' => '#eab308', 'busy' => '#ef4444', 'offline' => 'var(--tp-text-dim)'];
                    @endphp
                    <div class="header-dm-info">
                        <div class="header-dm-avatar" style="background: {{ $roleBadge['color'] }};">
                            @if($recipient->avatar_url)
                                <img src="{{ $recipient->avatar_url }}" class="avatar-img" alt="">
                            @else
                                {{ substr($recipient->name, 0, 1) }}
                            @endif
                            <div class="dm-status {{ $recipientPresence }}"></div>
                        </div>
                        <span class="header-dm-name">{{ $recipient->name }}</span>
                        <span class="header-dm-presence" style="color: {{ $presenceColors[$recipientPresence] }};">
                            {{ $presenceLabels[$recipientPresence] }}
                        </span>
                    </div>
                @endif

                <div class="header-actions">
                    @if($this->activeChannel && $this->pinnedMessages->count() > 0)
                        <div x-data="{ showPinned: false }" style="position: relative;">
                            <button @click="showPinned = !showPinned" class="header-btn" :class="{ active: showPinned }"
                                title="Pinned messages">
                                &#128204; {{ $this->pinnedMessages->count() }}
                            </button>
                            <div x-show="showPinned" @click.away="showPinned = false" x-transition class="pinned-dropdown">
                                <div class="pinned-dropdown-title">&#128204; Pinned Messages</div>
                                @foreach($this->pinnedMessages as $pinned)
                                    <div class="pinned-item">
                                        <div style="flex: 1; min-width: 0;">
                                            <div class="pinned-item-author">{{ $pinned->user->name }}</div>
                                            <div class="pinned-item-text">{{ Str::limit($pinned->content, 80) }}</div>
                                        </div>
                                        <button wire:click="unpinMessage({{ $pinned->id }})" class="pinned-item-unpin"
                                            title="Unpin">&#10005;</button>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endif

                    {{-- Jump to date --}}
                    <div x-data="{ showDatePicker: false }" style="position: relative;">
                        <button @click="showDatePicker = !showDatePicker" class="header-btn"
                            :class="{ active: showDatePicker }" title="Jump to date">
                            &#128197;
                        </button>
                        <div x-show="showDatePicker" @click.away="showDatePicker = false" x-transition
                            style="position: absolute; top: 100%; right: 0; margin-top: 4px; z-index: 80;">
                            <input type="date" @change="$wire.jumpToDate($event.target.value); showDatePicker = false"
                                style="background: var(--tp-base); border: 1px solid var(--tp-border-strong); border-radius: 6px; padding: 8px 12px; color: var(--tp-text-bright); font-size: 0.8rem; outline: none; color-scheme: dark;">
                        </div>
                    </div>

                    {{-- Thread notifications --}}
                    @if($this->unreadThreadReplies > 0)
                        <button class="header-btn" style="position: relative;" wire:click="$set('showSearch', false)"
                            title="Thread notifications">
                            &#129525;
                            <span
                                style="position: absolute; top: 2px; right: 2px; background: var(--tp-red); color: #fff; font-size: 0.5rem; font-weight: 700; padding: 1px 4px; border-radius: 8px; min-width: 14px; text-align: center;">{{ $this->unreadThreadReplies }}</span>
                        </button>
                    @endif

                    <button class="header-btn {{ $this->showSearch ? 'active' : '' }}"
                        wire:click="$toggle('showSearch')" title="Search (Ctrl+K)">
                        &#128269;
                    </button>
                    @if($this->activeChannel)
                    <button class="header-btn" @click="showMembers = !showMembers; showBookmarks = false" :class="{ active: showMembers }" title="Members">
                        &#128101;
                    </button>
                    @endif
                </div>
            </div>

            {{-- Notification Permission Banner --}}
            <div class="notif-banner" x-show="showNotifBanner" x-transition>
                <span>🔔 Enable notifications to get alerts when you're mentioned</span>
                <button @click="requestNotifications()">Enable</button>
                <button class="notif-banner-dismiss" @click="showNotifBanner = false">✕</button>
            </div>

            {{-- Search Bar --}}
            @if($this->showSearch)
                <div class="search-bar">
                    <input type="text" wire:model.live.debounce.300ms="search" x-ref="searchInput"
                        placeholder="Search messages... (from:user has:attachment after:2026-01-01)" autofocus>
                    <button wire:click="$set('showSearch', false); $set('search', '')" class="search-close"
                        title="Close">&#10005;</button>
                </div>
            @endif

            {{-- Messages --}}
            <div class="messages-container" x-data="{ dragging: false }" @touchstart="handlePullStart($event)"
                @touchmove="handlePullMove($event)" @touchend="handlePullEnd()" @dragover.prevent="dragging = true"
                @dragleave.prevent="dragging = false"
                @drop.prevent="dragging = false; let files = $event.dataTransfer.files; if (files.length > 0) { @this.upload('attachment', files[0]); }"
                :class="{ 'drag-over': dragging }"
                :style="pulling ? `transform: translateY(${pullDistance}px); transition: none;` : 'transition: transform 0.2s'">

                {{-- Drop zone overlay --}}
                <div x-show="dragging" class="drop-zone-overlay">
                    <div class="drop-zone-content">&#128206; Drop file to upload</div>
                </div>

                @php
                    $unreadDividerShown = false;
                @endphp

                @forelse($this->messages as $index => $msg)
                    @php
                        $isMe = $msg->user_id === auth()->id();
                        $roleBadge = $this->getUserRoleBadge($msg->user);
                        $avatarColor = $isMe ? 'var(--tp-accent)' : (['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b'][$msg->user_id % 4]);

                        // Message grouping: check next in DOM (displays ABOVE because column-reverse)
                        $nextInDom = $this->messages[$index + 1] ?? null;
                        $isGrouped = $nextInDom
                            && $nextInDom->user_id === $msg->user_id
                            && abs($nextInDom->created_at->diffInMinutes($msg->created_at)) < 5
                            && $nextInDom->created_at->isSameDay($msg->created_at);

                        // Date separator: show when next-in-DOM is a different day (or no next message)
                        $showDateSep = !$nextInDom || !$nextInDom->created_at->isSameDay($msg->created_at);

                        // Unread divider
                        $showDivider = false;
                        if ($this->previousReadAt && !$unreadDividerShown && !$isMe && $msg->created_at->gt($this->previousReadAt)) {
                            if (!$nextInDom || $nextInDom->created_at->lte($this->previousReadAt)) {
                                $showDivider = true;
                                $unreadDividerShown = true;
                            }
                        }
                    @endphp

                    @if($showDivider)
                        <div class="unread-divider">
                            <div class="unread-divider-line"></div>
                            <span class="unread-divider-text">New</span>
                            <div class="unread-divider-line"></div>
                        </div>
                    @endif

                    <div class="message-row {{ $isGrouped ? 'grouped' : '' }} {{ $isMe ? 'own-message' : '' }} {{ $this->highlightMessageId == $msg->id ? 'highlight' : '' }}"
                        id="msg-{{ $msg->id }}" @if($msg->created_at->diffInSeconds(now()) < 5) data-new @endif>

                        @if($isGrouped)
                            {{-- Grouped: show time on hover instead of avatar --}}
                            <div class="msg-avatar-spacer">
                                <span class="msg-hover-time">{{ $msg->created_at->format('H:i') }}</span>
                            </div>
                        @else
                            {{-- Full message: show avatar --}}
                            <div class="msg-avatar" style="background: {{ $avatarColor }};">
                                @if($msg->user->avatar_url)
                                    <img src="{{ $msg->user->avatar_url }}" class="avatar-img" alt="">
                                @else
                                    {{ substr($msg->user->name, 0, 1) }}
                                @endif
                            </div>
                        @endif

                        <div class="msg-body">
                            @if(!$isGrouped)
                                <div class="msg-header">
                                    <span class="msg-author" @mouseenter="showHovercard({{ $msg->user_id }}, $event)"
                                        @mouseleave="hideHovercard()">{{ $msg->user->name }}</span>
                                    <span class="msg-role"
                                        style="background: {{ $roleBadge['color'] }}15; color: {{ $roleBadge['color'] }};">
                                        {{ $roleBadge['short'] }}
                                    </span>
                                    <span class="msg-time">{{ $msg->created_at->format('H:i') }}</span>
                                    @if($msg->edited_at)
                                        <span class="msg-edited">(edited)</span>
                                    @endif
                                    @php $msgUserStatus = $this->getCustomStatus($msg->user); @endphp
                                    @if($msgUserStatus)
                                        <span class="custom-status-text">{{ $msgUserStatus['emoji'] }}
                                            {{ $msgUserStatus['text'] }}</span>
                                    @endif
                                </div>
                            @endif

                            {{-- Voice message --}}
                            @if(($msg->message_type ?? 'text') === 'voice' && $msg->attachment_url)
                                <div class="voice-player">
                                    <audio controls preload="metadata">
                                        <source src="{{ asset('storage/' . $msg->attachment_url) }}" type="audio/webm">
                                    </audio>
                                </div>
                            @elseif($msg->attachment_url)
                                <div class="msg-attachment">
                                    @if(Str::endsWith($msg->attachment_url, ['.jpg', '.jpeg', '.png', '.gif', '.webp']) || Str::startsWith($msg->attachment_url, 'http'))
                                        @php $imgUrl = Str::startsWith($msg->attachment_url, 'http') ? $msg->attachment_url : asset('storage/' . $msg->attachment_url); @endphp
                                        <a href="{{ $imgUrl }}" @click.prevent="lightboxUrl = '{{ $imgUrl }}'">
                                            <img src="{{ $imgUrl }}" alt="Attachment">
                                        </a>
                                    @else
                                        <a href="{{ asset('storage/' . $msg->attachment_url) }}" target="_blank"
                                            class="msg-file-download">
                                            &#128206; {{ basename($msg->attachment_url) }}
                                        </a>
                                    @endif
                                </div>
                            @endif

                            @if($msg->content)
                                @php
                                    $hasOgPreview = $msg->og_data && ($msg->og_data['title'] ?? null);
                                    $displayContent = $msg->content;
                                    if ($hasOgPreview && !empty($msg->og_data['url'])) {
                                        $displayContent = trim(str_replace($msg->og_data['url'], '', $displayContent));
                                    }
                                @endphp
                                @if($displayContent)
                                    <div class="msg-text">{!! $this->formatMessageContent($displayContent) !!}</div>
                                @endif
                            @endif

                            {{-- OG Preview --}}
                            @php $hasOgPreview = $hasOgPreview ?? ($msg->og_data && ($msg->og_data['title'] ?? null)); @endphp
                            @if($hasOgPreview)
                                <div class="og-preview">
                                    <div class="og-preview-text">
                                        @if($msg->og_data['site_name'] ?? null)
                                            <div class="og-preview-site">{{ $msg->og_data['site_name'] }}</div>
                                        @endif
                                        <a href="{{ $msg->og_data['url'] }}" target="_blank" rel="noopener"
                                            class="og-preview-title">{{ $msg->og_data['title'] }}</a>
                                        @if($msg->og_data['description'] ?? null)
                                            <div class="og-preview-desc">{{ $msg->og_data['description'] }}</div>
                                        @endif
                                    </div>
                                    @if($msg->og_data['image'] ?? null)
                                        <img src="{{ $msg->og_data['image'] }}" class="og-preview-img" alt="" loading="lazy">
                                    @endif
                                </div>
                            @endif

                            {{-- Reactions --}}
                            @if($msg->reactions->count() > 0)
                                <div class="reactions-row">
                                    @foreach($msg->reactions->groupBy('emoji') as $emoji => $reactions)
                                        <button x-data="{ bounced: false }"
                                            @click="bounced = true; setTimeout(() => bounced = false, 300); $wire.toggleReaction({{ $msg->id }}, '{{ $emoji }}')"
                                            :class="{ 'just-reacted': bounced }"
                                            class="reaction-btn {{ $reactions->where('user_id', auth()->id())->count() > 0 ? 'active' : '' }}">
                                            <span class="reaction-emoji">{{ $emoji }}</span>
                                            <span class="reaction-count">{{ $reactions->count() }}</span>
                                        </button>
                                    @endforeach
                                </div>
                            @endif

                            {{-- Thread replies --}}
                            @if($msg->replies->count() > 0)
                                <button wire:click="setActiveThread({{ $msg->id }})" class="thread-reply-count">
                                    &#129525; {{ $msg->replies->count() }} {{ Str::plural('reply', $msg->replies->count()) }}
                                </button>
                            @endif
                        </div>

                        {{-- Hover Actions --}}
                        <div class="hover-actions">
                            @foreach(['&#128077;', '&#10084;&#65039;', '&#128514;', '&#128293;', '&#128064;'] as $emoji)
                                <button wire:click="toggleReaction({{ $msg->id }}, '{{ html_entity_decode($emoji) }}')"
                                    title="React">{!! $emoji !!}</button>
                            @endforeach
                            <div class="action-sep"></div>
                            <button wire:click="setActiveThread({{ $msg->id }})" title="Reply in thread">&#129525;</button>
                            <button wire:click="quoteMessage({{ $msg->id }})" title="Quote">&#128172;</button>
                            @if(!$msg->is_pinned && $this->activeChannel)
                                <button wire:click="pinMessage({{ $msg->id }})" title="Pin">&#128204;</button>
                            @endif
                            @if($isMe && $msg->canEdit())
                                <button wire:click="startEditMessage({{ $msg->id }})" title="Edit">&#9998;</button>
                            @endif
                            @if($isMe || auth()->user()->hasRole('Super Admin'))
                                <button wire:click="deleteMessage({{ $msg->id }})" title="Delete"
                                    style="color: var(--tp-red);">&#128465;</button>
                            @endif
                            <div class="action-sep"></div>
                            <div x-data="{ showRemind: false }" style="position: relative;">
                                <button @click="showRemind = !showRemind" title="Remind me">&#128276;</button>
                                <div x-show="showRemind" @click.away="showRemind = false" x-transition
                                    style="position: absolute; top: 100%; right: 0; margin-top: 4px; background: var(--tp-base); border: 1px solid var(--tp-border-strong); border-radius: 8px; padding: 4px; min-width: 140px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 30;">
                                    <button wire:click="remindMe({{ $msg->id }}, 20)" @click="showRemind = false"
                                        style="display: block; width: 100%; text-align: left; background: none; border: none; color: var(--tp-text-primary); padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;"
                                        onmouseover="this.style.background='rgba(255,255,255,0.05)'"
                                        onmouseout="this.style.background='none'">
                                        &#9201; 20 minutes</button>
                                    <button wire:click="remindMe({{ $msg->id }}, 60)" @click="showRemind = false"
                                        style="display: block; width: 100%; text-align: left; background: none; border: none; color: var(--tp-text-primary); padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;"
                                        onmouseover="this.style.background='rgba(255,255,255,0.05)'"
                                        onmouseout="this.style.background='none'">
                                        &#128339; 1 hour</button>
                                    <button wire:click="remindMe({{ $msg->id }}, 180)" @click="showRemind = false"
                                        style="display: block; width: 100%; text-align: left; background: none; border: none; color: var(--tp-text-primary); padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;"
                                        onmouseover="this.style.background='rgba(255,255,255,0.05)'"
                                        onmouseout="this.style.background='none'">
                                        &#128338; 3 hours</button>
                                    <button wire:click="remindMe({{ $msg->id }}, 1080)" @click="showRemind = false"
                                        style="display: block; width: 100%; text-align: left; background: none; border: none; color: var(--tp-text-primary); padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;"
                                        onmouseover="this.style.background='rgba(255,255,255,0.05)'"
                                        onmouseout="this.style.background='none'">
                                        &#9728;&#65039; Tomorrow 9am</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    @if($showDateSep)
                        <div class="date-separator">
                            <span class="date-separator-label">
                                @if($msg->created_at->isToday())
                                    Today
                                @elseif($msg->created_at->isYesterday())
                                    Yesterday
                                @else
                                    {{ $msg->created_at->format('F j, Y') }}
                                @endif
                            </span>
                        </div>
                    @endif

                @empty
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            @if($this->activeChannel)
                                #
                            @else
                                &#128172;
                            @endif
                        </div>
                        @if($this->activeChannel)
                            @php $ch = $this->channels->firstWhere('slug', $this->activeChannel); @endphp
                            <h3>Welcome to #{{ $ch?->name ?? $this->activeChannel }}</h3>
                            <p>This is the very beginning of the <strong>#{{ $ch?->name ?? $this->activeChannel }}</strong>
                                channel. Start the conversation!</p>
                        @elseif($this->activeRecipient)
                            @php $r = $this->users->find($this->activeRecipient); @endphp
                            <h3>{{ $r?->name }}</h3>
                            <p>This is the beginning of your direct message history with <strong>{{ $r?->name }}</strong>.</p>
                        @else
                            <h3>Editorial Chat</h3>
                            <p>Select a channel or person to start chatting.</p>
                        @endif
                    </div>
                @endforelse

                {{-- Load more (shows at top due to column-reverse) --}}
                @if($this->hasMoreMessages)
                    <div class="load-more-trigger">
                        <button wire:click="loadMoreMessages" class="load-more-btn" wire:loading.attr="disabled">
                            <span wire:loading.remove wire:target="loadMoreMessages">&#8593; Load older messages</span>
                            <span wire:loading wire:target="loadMoreMessages">Loading...</span>
                        </button>
                    </div>
                @endif
            </div>

            {{-- Input Area --}}
            <div class="input-area">
                {{-- Away warning for DMs --}}
                @if($this->activeRecipient && $this->recipientStatus)
                    <div class="away-warning">
                        <span>&#9888;&#65039;</span>
                        <span><strong>{{ $this->recipientStatus['name'] }}</strong> is
                            {{ $this->recipientStatus['presence'] }}
                            (last seen {{ $this->recipientStatus['last_seen'] }}).
                            They may not see this right away.</span>
                    </div>
                @endif

                {{-- Typing Indicator --}}
                @if(count($this->typingUsers) > 0)
                    <div class="typing-indicator">
                        <span class="typing-dots"><span></span><span></span><span></span></span>
                        <span>{{ implode(', ', $this->typingUsers) }} {{ count($this->typingUsers) === 1 ? 'is' : 'are' }}
                            typing...</span>
                    </div>
                @endif

                @if($attachment)
                    <div class="attachment-preview">
                        <div class="attachment-preview-info">
                            <span>&#128206;</span>
                            <span>{{ $attachment->getClientOriginalName() }}</span>
                        </div>
                        <button wire:click="resetAttachment" title="Remove">&#10005;</button>
                    </div>
                @endif

                @php $draftKey = $this->activeChannel ?? ('dm_' . ($this->activeRecipient ?? 'none')); @endphp
                <form wire:submit="sendMessage" @submit="clearDraft('{{ $draftKey }}')" x-data="{
                    showEmojis: false,
                    showGifs: false,
                    gifSearch: '',
                    gifs: [],
                    isRecording: false,
                    recordingTime: 0,
                    mediaRecorder: null,
                    audioChunks: [],
                    recordingInterval: null,

                    init() {
                        const draft = getDraft('{{ $draftKey }}');
                        if (draft) {
                            $wire.set('message', draft);
                        }
                    },

                    handlePaste(event) {
                        const items = event.clipboardData?.items;
                        if (items) {
                            for (let i = 0; i < items.length; i++) {
                                if (items[i].type.startsWith('image/')) {
                                    const file = items[i].getAsFile();
                                    if (file) {
                                        event.preventDefault();
                                        $wire.upload('attachment', file);
                                        break;
                                    }
                                }
                            }
                        }
                    },

                    wrapSelection(prefix, suffix) {
                        const ta = this.$refs.messageInput;
                        const start = ta.selectionStart;
                        const end = ta.selectionEnd;
                        const text = ta.value;
                        const selected = text.substring(start, end);
                        const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
                        $wire.set('message', newText);
                        $nextTick(() => {
                            if (selected) {
                                ta.selectionStart = start + prefix.length;
                                ta.selectionEnd = end + prefix.length;
                            } else {
                                ta.selectionStart = ta.selectionEnd = start + prefix.length;
                            }
                            ta.focus();
                        });
                    },

                    async searchGifs() {
                        if (this.gifSearch.length < 2) return;
                        const apiKey = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65';
                        const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${this.gifSearch}&limit=12&rating=g`);
                        const data = await response.json();
                        this.gifs = data.data;
                    },

                    selectGif(gifUrl) {
                        $wire.selectGiphy(gifUrl);
                        this.showGifs = false;
                        this.gifSearch = '';
                        this.gifs = [];
                    },

                    async startRecording() {
                        try {
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            this.mediaRecorder = new MediaRecorder(stream);
                            this.audioChunks = [];
                            this.mediaRecorder.ondataavailable = (e) => { this.audioChunks.push(e.data); };
                            this.mediaRecorder.onstop = async () => {
                                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                                $wire.uploadMultiple('voiceMessage', [audioBlob]);
                            };
                            this.mediaRecorder.start();
                            this.isRecording = true;
                            this.recordingTime = 0;
                            this.recordingInterval = setInterval(() => { this.recordingTime++; }, 1000);
                        } catch (err) { console.error('Could not start recording:', err); }
                    },

                    stopRecording() {
                        if (this.mediaRecorder && this.isRecording) {
                            this.mediaRecorder.stop();
                            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
                            this.isRecording = false;
                            clearInterval(this.recordingInterval);
                        }
                    },

                    cancelRecording() {
                        if (this.mediaRecorder && this.isRecording) {
                            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
                            this.isRecording = false;
                            this.audioChunks = [];
                            clearInterval(this.recordingInterval);
                        }
                    },

                    formatTime(seconds) {
                        const mins = Math.floor(seconds / 60);
                        const secs = seconds % 60;
                        return `${mins}:${secs.toString().padStart(2, '0')}`;
                    },

                    // Mention autocomplete
                    showMentions: false,
                    mentionQuery: '',
                    mentionResults: [],
                    mentionIndex: 0,
                    mentionStart: -1,
                    mentionJustSelected: false,

                    checkMention(event) {
                        const ta = event.target;
                        const pos = ta.selectionStart;
                        const text = ta.value;

                        // Find the @ that starts the current mention
                        let atPos = -1;
                        for (let i = pos - 1; i >= 0; i--) {
                            if (text[i] === '@') {
                                // Check it's start of word (beginning or preceded by space/newline)
                                if (i === 0 || /[\s]/.test(text[i - 1])) {
                                    atPos = i;
                                }
                                break;
                            }
                            if (/[\s]/.test(text[i])) break;
                        }

                        if (atPos === -1) {
                            this.showMentions = false;
                            return;
                        }

                        this.mentionStart = atPos;
                        this.mentionQuery = text.substring(atPos + 1, pos).toLowerCase();
                        this.mentionIndex = 0;

                        const q = this.mentionQuery;
                        const specials = [
                            { type: 'broadcast', username: 'channel', name: '@channel', desc: 'Notify everyone in channel' },
                            { type: 'broadcast', username: 'here', name: '@here', desc: 'Notify online members' },
                        ];

                        const matchedSpecials = specials.filter(s =>
                            s.username.startsWith(q) || s.name.toLowerCase().includes(q)
                        );

                        const users = this.allUsers || [];
                        const matchedUsers = users.filter(u =>
                            (u.name && u.name.toLowerCase().includes(q)) ||
                            (u.username && u.username.toLowerCase().includes(q))
                        ).slice(0, 6);

                        this.mentionResults = [...matchedSpecials, ...matchedUsers];
                        this.showMentions = this.mentionResults.length > 0;
                    },

                    selectMention(item) {
                        const ta = this.$refs.messageInput;
                        const text = ta.value;
                        const insertName = item.username || item.name;
                        const before = text.substring(0, this.mentionStart);
                        const after = text.substring(ta.selectionStart);
                        const newText = before + '@' + insertName + ' ' + after;

                        $wire.set('message', newText);
                        this.showMentions = false;
                        this.mentionQuery = '';
                        this.mentionJustSelected = true;
                        setTimeout(() => { this.mentionJustSelected = false; }, 50);

                        $nextTick(() => {
                            const newPos = this.mentionStart + insertName.length + 2;
                            ta.selectionStart = ta.selectionEnd = newPos;
                            ta.focus();
                        });
                    },

                    // === Keyboard Shortcuts ===
                    initKeyboardShortcuts() {
                        document.addEventListener('keydown', (e) => {
                            // Ctrl+K = focus search
                            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                                e.preventDefault();
                                $wire.set('showSearch', true);
                                setTimeout(() => document.querySelector('.search-bar input')?.focus(), 100);
                            }
                            // Ctrl+Enter = send message
                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                const ta = this.$refs.messageInput;
                                if (document.activeElement === ta && ta?.value?.trim()) {
                                    $wire.call('sendMessage');
                                }
                            }
                            // Escape = cancel edit or close panels
                            if (e.key === 'Escape') {
                                if ($wire.editingMessageId) { $wire.call('cancelEdit'); return; }
                                if (this.showBookmarks) { this.showBookmarks = false; return; }
                                if (this.showMembers) { this.showMembers = false; return; }
                                if (this.showSlashCommands) { this.showSlashCommands = false; return; }
                            }
                            // Up arrow = edit last own message
                            if (e.key === 'ArrowUp') {
                                const ta = this.$refs.messageInput;
                                if (document.activeElement === ta && !ta?.value?.trim()) {
                                    e.preventDefault();
                                    // Find last own message and start editing
                                    const ownMessages = document.querySelectorAll('.message-row.own-message');
                                    if (ownMessages.length) {
                                        const last = ownMessages[ownMessages.length - 1];
                                        const msgId = last.getAttribute('data-msg-id');
                                        if (msgId) $wire.call('startEditMessage', parseInt(msgId));
                                    }
                                }
                            }
                        });
                    },

                    // === Text Formatting (wrap selected) ===
                    wrapText(prefix, suffix = null) {
                        const ta = this.$refs.messageInput;
                        if (!ta) return;
                        const start = ta.selectionStart;
                        const end = ta.selectionEnd;
                        const selected = ta.value.substring(start, end);
                        const sfx = suffix || prefix;
                        const wrapped = prefix + selected + sfx;
                        const newVal = ta.value.substring(0, start) + wrapped + ta.value.substring(end);
                        $wire.set('message', newVal);
                        setTimeout(() => {
                            ta.selectionStart = start + prefix.length;
                            ta.selectionEnd = end + prefix.length;
                            ta.focus();
                        }, 30);
                    },

                    // === Slash Commands ===
                    checkSlashCommand(value) {
                        if (!value.startsWith('/') || value.includes(' ')) {
                            this.showSlashCommands = false;
                            return;
                        }
                        const query = value.slice(1).toLowerCase();
                        const commands = [
                            { name: '/giphy', desc: 'Search and send a GIF', icon: '🎬' },
                            { name: '/status', desc: 'Set your status (e.g. /status 🎮 Gaming)', icon: '💬' },
                            { name: '/remind', desc: 'Remind yourself (e.g. /remind 30m)', icon: '⏰' },
                            { name: '/link', desc: 'Share article preview (e.g. /link 42)', icon: '📰' },
                            { name: '/clear', desc: 'Clear message input', icon: '🗑️' },
                        ];
                        this.slashSuggestions = commands.filter(c => c.name.includes(query) || !query);
                        this.showSlashCommands = this.slashSuggestions.length > 0;
                        this.slashIndex = 0;
                    },

                    executeSlash(command) {
                        this.showSlashCommands = false;
                        if (command === '/giphy') {
                            $wire.set('message', '');
                            $wire.set('showGiphy', true);
                        } else if (command === '/clear') {
                            $wire.set('message', '');
                        } else {
                            $wire.set('message', command + ' ');
                            setTimeout(() => this.$refs.messageInput?.focus(), 30);
                        }
                    },

                    handleSlashKeydown(event) {
                        if (!this.showSlashCommands) return;
                        if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            this.slashIndex = Math.min(this.slashIndex + 1, this.slashSuggestions.length - 1);
                        } else if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            this.slashIndex = Math.max(this.slashIndex - 1, 0);
                        } else if (event.key === 'Tab' || event.key === 'Enter') {
                            event.preventDefault();
                            this.executeSlash(this.slashSuggestions[this.slashIndex].name);
                        } else if (event.key === 'Escape') {
                            this.showSlashCommands = false;
                        }
                    },

                    // === Notification Sound ===
                    playNotificationSound() {
                        if (!this.notifSoundEnabled) return;
                        try {
                            const ctx = new (window.AudioContext || window.webkitAudioContext)();
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.frequency.setValueAtTime(880, ctx.currentTime);
                            osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.05);
                            gain.gain.setValueAtTime(0.15, ctx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                            osc.start(ctx.currentTime);
                            osc.stop(ctx.currentTime + 0.2);
                        } catch(e) {}
                    },

                    // === Push Notifications ===
                    requestNotifications() {
                        if (typeof Notification === 'undefined') return;
                        Notification.requestPermission().then(perm => {
                            this.showNotifBanner = false;
                            if (perm === 'granted') {
                                new Notification('TechPlay Editorial Chat', {
                                    body: 'Notifications enabled! You\'ll be notified of @mentions.',
                                    icon: '/favicon.ico'
                                });
                            }
                        });
                    },

                    sendPushNotification(title, body) {
                        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
                        if (document.hasFocus()) return; // Only notify when tab is not focused
                        new Notification(title, { body, icon: '/favicon.ico' });
                    },

                    handleMentionKeydown(event) {
                        if (!this.showMentions) return;

                        if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            this.mentionIndex = Math.min(this.mentionIndex + 1, this.mentionResults.length - 1);
                        } else if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            this.mentionIndex = Math.max(this.mentionIndex - 1, 0);
                        } else if (event.key === 'Tab' || (event.key === 'Enter' && !event.shiftKey)) {
                            if (this.mentionResults.length > 0) {
                                event.preventDefault();
                                event.stopPropagation();
                                this.selectMention(this.mentionResults[this.mentionIndex]);
                            }
                        } else if (event.key === 'Escape') {
                            this.showMentions = false;
                        }
                    }
                }" style="position: relative;">

                    {{-- Slash Command Dropdown --}}
                    <div x-show="showSlashCommands" @click.away="showSlashCommands = false" class="slash-dropdown">
                        <template x-for="(cmd, idx) in slashSuggestions" :key="cmd.name">
                            <div class="slash-item" :class="{ active: idx === slashIndex }" @click="executeSlash(cmd.name)">
                                <span style="font-size:1.25rem;" x-text="cmd.icon"></span>
                                <div>
                                    <div class="slash-item-name" x-text="cmd.name"></div>
                                    <div class="slash-item-desc" x-text="cmd.desc"></div>
                                </div>
                            </div>
                        </template>
                    </div>

                    {{-- Emoji Picker --}}
                    <div x-show="showEmojis" @click.away="showEmojis = false" x-transition class="emoji-picker">
                        @foreach(['😀', '😂', '😍', '😎', '🤔', '😅', '😭', '👍', '👎', '🔥', '❤️', '🎉', '🚀', '👀', '✅', '❌', '🛑', '⚠️', '📢', '🎮', '⚽'] as $emoji)
                            <button type="button"
                                @click="$wire.set('message', $wire.message + '{{ $emoji }}'); showEmojis = false; $refs.messageInput.focus()">
                                {{ $emoji }}
                            </button>
                        @endforeach
                    </div>

                    {{-- GIF Picker --}}
                    <div x-show="showGifs" @click.away="showGifs = false" x-transition class="gif-picker">
                        <input type="text" x-model="gifSearch" @input.debounce.300ms="searchGifs()"
                            class="gif-picker-search" placeholder="Search GIFs...">
                        <div class="gif-picker-results">
                            <template x-for="gif in gifs" :key="gif.id">
                                <img :src="gif.images.fixed_height_small.url"
                                    @click="selectGif(gif.images.original.url)" :alt="gif.title">
                            </template>
                        </div>
                        <div x-show="gifs.length === 0 && gifSearch.length > 1"
                            style="text-align: center; color: var(--tp-text-dim); padding: 16px; font-size: 0.78rem;">
                            No GIFs found
                        </div>
                    </div>

                    {{-- Voice Recording Indicator --}}
                    <div x-show="isRecording" class="voice-recording-indicator">
                        <div class="recording-dot"></div>
                        <span class="recording-time" x-text="formatTime(recordingTime)"></span>
                        <button type="button" @click="cancelRecording()" title="Cancel">&#10005;</button>
                        <button type="button" @click="stopRecording()" title="Send"
                            style="color: #22c55e;">&#10003;</button>
                    </div>

                    {{-- Mention Autocomplete Dropdown --}}
                    <div x-show="showMentions" x-transition.opacity class="mention-dropdown">
                        <template x-for="(item, idx) in mentionResults" :key="item.username || item.name">
                            <div class="mention-item" :class="{ 'active': idx === mentionIndex }"
                                @click="selectMention(item)" @mouseenter="mentionIndex = idx">
                                <template x-if="item.type === 'broadcast'">
                                    <div class="mention-item-avatar"
                                        style="background: var(--tp-accent, #FC4100); font-size: 0.7rem;">
                                        <span x-text="item.username === 'channel' ? '📢' : '👋'"></span>
                                    </div>
                                </template>
                                <template x-if="item.type !== 'broadcast'">
                                    <div class="mention-item-avatar"
                                        :style="'background:' + (item.role?.color || '#3b82f6')">
                                        <template x-if="item.avatar_url">
                                            <img :src="item.avatar_url" alt="">
                                        </template>
                                        <template x-if="!item.avatar_url">
                                            <span x-text="item.name?.charAt(0) || '?'"></span>
                                        </template>
                                    </div>
                                </template>
                                <div class="mention-item-info">
                                    <template x-if="item.type === 'broadcast'">
                                        <div>
                                            <span class="mention-item-name" x-text="item.name"></span>
                                            <span class="mention-item-broadcast" x-text="' — ' + item.desc"></span>
                                        </div>
                                    </template>
                                    <template x-if="item.type !== 'broadcast'">
                                        <div>
                                            <span class="mention-item-name" x-text="item.name"></span>
                                            <span class="mention-item-username" x-text="'@' + item.username"></span>
                                        </div>
                                    </template>
                                </div>
                                <template x-if="item.role && item.type !== 'broadcast'">
                                    <span class="mention-item-role"
                                        :style="'background:' + item.role.color + '15; color:' + item.role.color"
                                        x-text="item.role.short"></span>
                                </template>
                            </div>
                        </template>
                    </div>

                    <div class="input-box">
                        <textarea wire:model="message" x-ref="messageInput"
                            placeholder="Message {{ $this->activeChannel ? '#' . ($this->channels->firstWhere('slug', $this->activeChannel)?->name ?? 'channel') : ($this->activeRecipient ? $this->users->find($this->activeRecipient)?->name ?? 'user' : 'chat') }}..."
                            rows="1" @keydown="handleMentionKeydown($event); handleSlashKeydown($event)"
                            @keydown.enter="if ($event.shiftKey) return; $event.preventDefault(); if (!mentionJustSelected && !showMentions) { clearDraft('{{ $draftKey }}'); $wire.sendMessage(); }"
                            @paste="handlePaste($event)" @input="checkMention($event); checkSlashCommand($event.target.value)"
                            @input.debounce.1000ms="saveDraft('{{ $draftKey }}', $event.target.value)"
                            autocomplete="off"></textarea>

                        <div class="input-bottom-bar">
                            <div class="format-group">
                                <button type="button" @click="wrapText('**')" class="fmt-btn"
                                    title="Bold"><strong>B</strong></button>
                                <button type="button" @click="wrapText('_')" class="fmt-btn"
                                    title="Italic"><em>I</em></button>
                                <button type="button" @click="wrapText('~~')" class="fmt-btn"
                                    title="Strikethrough"><del>S</del></button>
                                <button type="button" @click="wrapText('\`')" class="fmt-btn"
                                    title="Inline code" style="font-family: monospace;">&lt;/&gt;</button>
                                <button type="button" @click="wrapText('```\n', '\n```')" class="fmt-btn"
                                    title="Code block" style="font-family: monospace;">{ }</button>
                            </div>

                            <div class="input-sep"></div>

                            <div class="action-group">
                                <button type="button" @click="showEmojis = !showEmojis; showGifs = false"
                                    class="act-btn" title="Emoji">&#128522;</button>
                                <button type="button" @click="showGifs = !showGifs; showEmojis = false" class="act-btn"
                                    title="GIF" style="font-size: 0.7rem; font-weight: 700;">GIF</button>
                                <label class="act-btn" title="Attach file">
                                    <input type="file" wire:model="attachment" style="display: none;">
                                    &#128206;
                                </label>
                                <button type="button" @click="isRecording ? stopRecording() : startRecording()"
                                    class="act-btn" :style="isRecording ? 'color: var(--tp-red)' : ''"
                                    title="Voice message">&#127908;</button>
                            </div>

                            <button type="submit" class="send-btn" :class="{ 'has-content': $wire.message?.length > 0 }"
                                wire:loading.attr="disabled">
                                &#10148;
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        {{-- ===== IMAGE LIGHTBOX ===== --}}
        <div x-show="lightboxUrl" x-transition.opacity.duration.150ms @click="lightboxUrl = null"
            class="lightbox-overlay" style="display: none;">
            <img :src="lightboxUrl" @click.stop alt="Full size">
            <button @click="lightboxUrl = null" class="lightbox-close">&#10005;</button>
        </div>

        {{-- ===== HOVERCARD ===== --}}
        <div x-show="hovercardData" x-transition.opacity.duration.100ms class="hovercard" style="display: none;"
            :style="'left: ' + hovercardPos.x + 'px; top: ' + hovercardPos.y + 'px;'">
            <template x-if="hovercardData">
                <div>
                    <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 10px;">
                        <div class="hovercard-avatar"
                            :style="'background: ' + (hovercardData.role?.color || '#6b7280')">
                            <template x-if="hovercardData.avatar_url">
                                <img :src="hovercardData.avatar_url" alt="">
                            </template>
                            <template x-if="!hovercardData.avatar_url">
                                <span x-text="hovercardData.name?.charAt(0)"></span>
                            </template>
                        </div>
                        <div>
                            <div class="hovercard-name" x-text="hovercardData.name"></div>
                            <span class="hovercard-role"
                                :style="'background: ' + (hovercardData.role?.color || '#6b7280') + '15; color: ' + (hovercardData.role?.color || '#6b7280')"
                                x-text="hovercardData.role?.short"></span>
                        </div>
                    </div>
                    <template x-if="hovercardData.custom_status">
                        <div style="font-size: 0.75rem; color: var(--tp-text-secondary); margin-bottom: 6px;">
                            <span x-text="hovercardData.custom_status.emoji"></span>
                            <span x-text="hovercardData.custom_status.text"></span>
                        </div>
                    </template>
                    <div class="hovercard-meta">
                        <div>
                            <span
                                style="display: inline-block; width: 6px; height: 6px; border-radius: 50; margin-right: 4px;"
                                :style="'background: ' + ({online: '#22c55e', away: '#eab308', busy: '#ef4444', offline: '#6b7280'}[hovercardData.presence] || '#6b7280')"></span>
                            <span
                                x-text="hovercardData.presence === 'online' ? 'Active now' : ('Last seen ' + (hovercardData.last_seen || 'unknown'))"></span>
                        </div>
                        <div x-text="hovercardData.message_count + ' messages in this channel'"
                            style="margin-top: 2px;"></div>
                    </div>
                </div>
            </template>
        </div>

        {{-- Bookmarks Panel --}}
        <div class="bookmarks-panel" x-show="showBookmarks" x-transition:enter="transition ease-out duration-150" x-transition:enter-start="opacity-0 translate-x-4" x-transition:enter-end="opacity-100 translate-x-0">
            <div class="bookmarks-header">
                <span>🔖 Saved Messages</span>
                <button class="bookmarks-close" @click="showBookmarks = false">✕</button>
            </div>
            <div style="flex: 1; overflow-y: auto;">
                @forelse($this->bookmarks as $bm)
                    <div class="bookmark-item" wire:click="setChannel('{{ $bm->channel }}')">
                        <div class="bookmark-item-author">{{ $bm->user->name }}
                            @if($bm->channel) <span style="font-weight:400;color:var(--tp-text-muted)">#{{ $bm->channel }}</span> @endif
                        </div>
                        @if($bm->content)
                            <div class="bookmark-item-text">{!! $this->formatMessageContent($bm->content) !!}</div>
                        @else
                            <div class="bookmark-item-text" style="font-style:italic;color:var(--tp-text-muted)">Attachment</div>
                        @endif
                        <div class="bookmark-item-time">{{ $bm->created_at->diffForHumans() }}</div>
                    </div>
                @empty
                    <div style="padding:2rem;text-align:center;color:var(--tp-text-muted);font-size:0.875rem;">
                        <div style="font-size:2rem;margin-bottom:0.5rem;">🔖</div>
                        No saved messages yet.<br>
                        <span style="font-size:0.8rem;">Hover a message and click the bookmark icon.</span>
                    </div>
                @endforelse
            </div>
        </div>

        {{-- Members Panel --}}
        <div class="members-panel" x-show="showMembers" x-transition:enter="transition ease-out duration-150" x-transition:enter-start="opacity-0 translate-x-4" x-transition:enter-end="opacity-100 translate-x-0">
            <div class="members-header">
                <span>👥 Members</span>
                <button class="bookmarks-close" @click="showMembers = false">✕</button>
            </div>
            <div style="flex: 1; overflow-y: auto;">
                @php
                    $members = $this->channelMembers;
                    $online = array_filter($members, fn($m) => $m['presence'] !== 'offline');
                    $offline = array_filter($members, fn($m) => $m['presence'] === 'offline');
                @endphp
                @if(count($online) > 0)
                    <div class="members-group-title">Online — {{ count($online) }}</div>
                    @foreach($online as $member)
                        <div class="member-item">
                            <div class="member-item-avatar" style="position:relative;">
                                @if($member['avatar_url'])
                                    <img src="{{ $member['avatar_url'] }}" style="width:100%;height:100%;object-fit:cover;" alt="">
                                @else
                                    {{ strtoupper(substr($member['name'], 0, 2)) }}
                                @endif
                                <span class="member-presence-dot {{ $member['presence'] }}"></span>
                            </div>
                            <div style="flex:1;min-width:0;">
                                <div class="member-item-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ $member['name'] }}</div>
                                @if(!empty($member['custom_status']))
                                    <div class="member-item-status">{{ $member['custom_status']['emoji'] ?? '' }} {{ $member['custom_status']['text'] ?? '' }}</div>
                                @endif
                            </div>
                            <span style="font-size:0.65rem;font-weight:800;padding:1px 5px;border-radius:3px;background:{{ $member['role']['color'] ?? '#6b7280' }}20;color:{{ $member['role']['color'] ?? '#6b7280' }};border:1px solid {{ $member['role']['color'] ?? '#6b7280' }};">{{ $member['role']['short'] ?? '?' }}</span>
                        </div>
                    @endforeach
                @endif
                @if(count($offline) > 0)
                    <div class="members-group-title">Offline — {{ count($offline) }}</div>
                    @foreach($offline as $member)
                        <div class="member-item" style="opacity:0.5;">
                            <div class="member-item-avatar" style="position:relative;">
                                @if($member['avatar_url'])
                                    <img src="{{ $member['avatar_url'] }}" style="width:100%;height:100%;object-fit:cover;" alt="">
                                @else
                                    {{ strtoupper(substr($member['name'], 0, 2)) }}
                                @endif
                                <span class="member-presence-dot offline"></span>
                            </div>
                            <div class="member-item-name">{{ $member['name'] }}</div>
                        </div>
                    @endforeach
                @endif
            </div>
        </div>

        {{-- ===== THREAD PANEL ===== --}}
        @if($this->activeThread)
            <div class="chat-thread-panel active">
                <div class="thread-header">
                    <h3>Thread</h3>
                    <button wire:click="closeThread" class="thread-close" title="Close">&#10005;</button>
                </div>

                @if($this->activeThreadMessage)
                    @php
                        $parentMsg = $this->activeThreadMessage;
                        $parentBadge = $this->getUserRoleBadge($parentMsg->user);
                        $parentColor = $parentMsg->user_id === auth()->id() ? 'var(--tp-accent)' : (['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b'][$parentMsg->user_id % 4]);
                    @endphp
                    <div class="thread-parent">
                        <div style="display: flex; gap: 10px;">
                            <div class="thread-reply-avatar"
                                style="background: {{ $parentColor }}; width: 32px; height: 32px; font-size: 0.7rem; border-radius: 8px;">
                                @if($parentMsg->user->avatar_url)
                                    <img src="{{ $parentMsg->user->avatar_url }}" class="avatar-img" alt="">
                                @else
                                    {{ substr($parentMsg->user->name, 0, 1) }}
                                @endif
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div class="msg-header">
                                    <span class="msg-author" style="font-size: 0.85rem;">{{ $parentMsg->user->name }}</span>
                                    <span class="msg-role"
                                        style="background: {{ $parentBadge['color'] }}15; color: {{ $parentBadge['color'] }};">{{ $parentBadge['short'] }}</span>
                                    <span class="msg-time">{{ $parentMsg->created_at->format('H:i, d M') }}</span>
                                </div>
                                @if($parentMsg->attachment_url)
                                    @if(Str::endsWith($parentMsg->attachment_url, ['.jpg', '.jpeg', '.png', '.gif', '.webp']) || Str::startsWith($parentMsg->attachment_url, 'http'))
                                        @php $threadImgUrl = Str::startsWith($parentMsg->attachment_url, 'http') ? $parentMsg->attachment_url : asset('storage/' . $parentMsg->attachment_url); @endphp
                                        <img src="{{ $threadImgUrl }}" alt="" class="thread-parent-img" style="cursor: zoom-in;"
                                            @click="lightboxUrl = '{{ $threadImgUrl }}'">
                                    @endif
                                @endif
                                <div class="msg-text" style="font-size: 0.85rem;">
                                    {!! $this->formatMessageContent($parentMsg->content) !!}
                                </div>
                            </div>
                        </div>
                    </div>
                @endif

                @if($this->threadMessages->count() > 0)
                    <div class="thread-replies-divider">
                        <span>{{ $this->threadMessages->count() }}
                            {{ Str::plural('reply', $this->threadMessages->count()) }}</span>
                    </div>
                @endif

                <div class="thread-messages">
                    @forelse($this->threadMessages as $reply)
                        @php
                            $replyBadge = $this->getUserRoleBadge($reply->user);
                            $replyColor = $reply->user_id === auth()->id() ? 'var(--tp-accent)' : (['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b'][$reply->user_id % 4]);
                        @endphp
                        <div class="thread-reply">
                            <div class="thread-reply-avatar" style="background: {{ $replyColor }};">
                                @if($reply->user->avatar_url)
                                    <img src="{{ $reply->user->avatar_url }}" class="avatar-img" alt="">
                                @else
                                    {{ substr($reply->user->name, 0, 1) }}
                                @endif
                            </div>
                            <div class="thread-reply-body">
                                <div class="thread-reply-meta">
                                    <span class="thread-reply-author">{{ $reply->user->name }}</span>
                                    <span class="thread-reply-time">{{ $reply->created_at->format('H:i') }}</span>
                                </div>
                                <div class="thread-reply-text">{!! $this->formatMessageContent($reply->content) !!}</div>
                            </div>
                        </div>
                    @empty
                        <div class="thread-empty">
                            No replies yet. Start the thread!
                        </div>
                    @endforelse
                </div>

                <div class="thread-input">
                    <form wire:submit="sendThreadReply">
                        <input type="text" wire:model="threadMessage" placeholder="Reply..." autocomplete="off">
                        <button type="submit">Reply</button>
                    </form>
                </div>
            </div>
        @endif

        {{-- Pull-to-refresh indicator --}}
        <div class="pull-refresh-indicator" :class="{ 'active': pullDistance > 40 }" x-show="pulling">
            <div class="spinner" x-show="pullDistance > 60"></div>
            <span x-text="pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'"></span>
        </div>

        {{-- Mobile Bottom Tab Bar --}}
        <div class="mobile-tab-bar">
            <div class="mobile-tab-item" :class="{ 'active': mobileTab === 'home' }"
                @click="mobileTab = 'home'; sidebarOpen = true">
                <span class="icon">&#127968;</span>
                <span>Home</span>
            </div>
            <div class="mobile-tab-item" :class="{ 'active': mobileTab === 'dms' }"
                @click="mobileTab = 'dms'; sidebarOpen = true">
                <span class="icon">&#128172;</span>
                <span>DMs</span>
                @if($this->unreadCount > 0)
                    <span class="mobile-tab-badge">{{ $this->unreadCount }}</span>
                @endif
            </div>
            <div class="mobile-tab-item" :class="{ 'active': mobileTab === 'chat' }"
                @click="mobileTab = 'chat'; sidebarOpen = false">
                <span class="icon">&#128172;</span>
                <span>Chat</span>
            </div>
            <div class="mobile-tab-item" :class="{ 'active': mobileTab === 'mentions' }"
                @click="mobileTab = 'mentions'">
                <span class="icon">&#64;</span>
                <span>Mentions</span>
            </div>
            <div class="mobile-tab-item" @click="toggleCompactView()">
                <span class="icon" x-text="compactView ? '&#128269;' : '&#128200;'"></span>
                <span x-text="compactView ? 'Expand' : 'Compact'"></span>
            </div>
        </div>

        {{-- Keyboard shortcuts hint overlay --}}
        <div x-show="showKeyboardHints" x-transition style="position: absolute; bottom: 20px; right: 20px; background: var(--tp-base, #ffffff);
                    border: 1px solid var(--tp-border, #ebe9f1); border-radius: 8px;
                    padding: 12px 16px; font-size: 0.75rem; color: var(--tp-text-muted, #5F6E8C);
                    z-index: 200; pointer-events: none; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
            <div style="font-weight: 700; margin-bottom: 4px; color: var(--tp-text-bright, #333);">Keyboard Shortcuts
            </div>
            <div>Ctrl+K: Search</div>
            <div>Ctrl+Enter: Send Message</div>
            <div>Ctrl+Shift+S: Toggle Sidebar</div>
            <div>Ctrl+Shift+T: Close Thread</div>
            <div>Esc: Close Overlays</div>
        </div>
    </div>



    <script>
        document.addEventListener('DOMContentLoaded', () => {
            if (Notification.permission !== "granted" && Notification.permission !== "denied") {
                Notification.requestPermission();
            }
        });
    </script>
</x-filament-panels::page>