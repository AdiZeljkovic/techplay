<x-filament-panels::page>
    <style>
        /* ===== FOUNDATION ===== */
        .chat-wrapper {
            display: flex;
            height: calc(100vh - 130px);
            background: var(--tp-deep, #0a1228);
            border-radius: var(--tp-radius-sm, 8px);
            border: 1px solid var(--tp-border, rgba(255,255,255,0.08));
            overflow: hidden;
        }

        /* ===== SIDEBAR ===== */
        .chat-sidebar {
            width: 260px;
            background: var(--tp-abyss, #060c1a);
            border-right: 1px solid var(--tp-border-faint, rgba(255,255,255,0.04));
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        }

        .sidebar-header {
            padding: 12px 16px;
            border-bottom: 1px solid var(--tp-border-faint, rgba(255,255,255,0.04));
        }

        .sidebar-header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .workspace-name {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 1.05rem;
            font-weight: 800;
            color: var(--tp-text-bright, #fff);
            letter-spacing: -0.02em;
        }

        .workspace-name .chevron {
            font-size: 0.6rem;
            opacity: 0.5;
            margin-top: 1px;
        }

        .compose-btn {
            width: 28px;
            height: 28px;
            border-radius: var(--tp-radius-xs, 4px);
            background: var(--tp-surface, #122148);
            border: 1px solid var(--tp-border, rgba(255,255,255,0.08));
            color: var(--tp-text-secondary, #9BA8C9);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            transition: all 0.15s var(--tp-ease);
        }
        .compose-btn:hover { background: var(--tp-elevated, #182c5a); color: var(--tp-text-bright, #fff); }

        .sidebar-user {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
            padding: 4px 0;
        }

        .sidebar-user-avatar {
            width: 22px;
            height: 22px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.6rem;
            font-weight: 700;
            color: #fff;
            position: relative;
        }

        .sidebar-user-name {
            font-size: 0.8rem;
            color: var(--tp-text-secondary, #9BA8C9);
            flex: 1;
        }

        /* Status dot */
        .status-dot {
            display: inline-block;
            width: 9px;
            height: 9px;
            border-radius: 50%;
        }
        .status-dot.online { background: #22c55e; }
        .status-dot.away { background: #eab308; }
        .status-dot.busy { background: #ef4444; }
        .status-dot.offline { background: #6b7280; }

        /* Status selector */
        .status-selector { position: relative; }
        .status-trigger { background: none; border: none; cursor: pointer; padding: 2px; border-radius: 4px; display: flex; align-items: center; }
        .status-trigger:hover { background: rgba(255,255,255,0.06); }
        .status-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            margin-top: 4px;
            background: var(--tp-base, #0e1a3a);
            border: 1px solid var(--tp-border-strong, rgba(255,255,255,0.12));
            border-radius: var(--tp-radius-sm, 8px);
            padding: 4px;
            min-width: 150px;
            box-shadow: var(--tp-shadow-md, 0 8px 30px rgba(0,0,0,0.5));
            z-index: 100;
        }
        .status-dropdown button {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            background: none;
            border: none;
            color: var(--tp-text-primary, #E2E8F7);
            padding: 7px 10px;
            border-radius: var(--tp-radius-xs, 4px);
            cursor: pointer;
            font-size: 0.78rem;
            text-align: left;
            transition: background 0.1s;
        }
        .status-dropdown button:hover { background: rgba(255,255,255,0.05); }

        /* Quick Nav */
        .sidebar-nav {
            padding: 8px 0 4px;
            border-bottom: 1px solid var(--tp-border-faint, rgba(255,255,255,0.04));
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 5px 16px;
            cursor: pointer;
            color: var(--tp-text-secondary, #9BA8C9);
            font-size: 0.82rem;
            transition: all 0.1s;
            border-radius: 0;
        }
        .nav-item:hover { background: rgba(255,255,255,0.03); color: var(--tp-text-bright, #fff); }
        .nav-item .nav-icon { width: 20px; text-align: center; font-size: 0.9rem; opacity: 0.7; }
        .nav-item .nav-badge {
            margin-left: auto;
            background: var(--tp-red, #EF4444);
            color: #fff;
            font-size: 0.6rem;
            font-weight: 700;
            padding: 1px 6px;
            border-radius: 10px;
            min-width: 18px;
            text-align: center;
        }

        /* Sidebar content */
        .sidebar-content {
            flex: 1;
            overflow-y: auto;
            padding: 4px 0 16px;
        }

        /* Sections */
        .sidebar-section {
            margin-top: 8px;
        }

        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 16px;
            cursor: pointer;
        }

        .section-title {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--tp-text-muted, #5F6E8C);
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .section-title .toggle-icon {
            font-size: 0.5rem;
            transition: transform 0.15s;
        }

        .section-action {
            color: var(--tp-text-muted, #5F6E8C);
            text-decoration: none;
            font-size: 0.85rem;
            transition: color 0.15s;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        }
        .section-action:hover { color: var(--tp-text-bright, #fff); }

        /* Channel items */
        .channel-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 16px 4px 22px;
            cursor: pointer;
            color: var(--tp-text-secondary, #9BA8C9);
            font-size: 0.82rem;
            transition: all 0.1s;
            border-left: 2px solid transparent;
            position: relative;
        }
        .channel-item:hover { background: rgba(255,255,255,0.03); color: var(--tp-text-bright, #fff); }
        .channel-item.active {
            background: var(--tp-accent-subtle, rgba(252,65,0,0.15));
            color: var(--tp-text-bright, #fff);
            border-left-color: var(--tp-accent, #FC4100);
        }
        .channel-item.unread { color: var(--tp-text-bright, #fff); font-weight: 700; }

        .channel-hash {
            font-size: 0.9rem;
            font-weight: 400;
            opacity: 0.5;
            font-family: 'Courier New', monospace;
            width: 14px;
            text-align: center;
        }
        .channel-item.active .channel-hash { opacity: 0.8; }

        .channel-name { font-weight: inherit; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .channel-lock { font-size: 0.6rem; opacity: 0.4; }

        .unread-badge {
            background: var(--tp-red, #EF4444);
            color: #fff;
            font-size: 0.6rem;
            font-weight: 700;
            padding: 1px 5px;
            border-radius: 8px;
            min-width: 16px;
            text-align: center;
            line-height: 1.4;
        }

        /* DM items */
        .dm-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 16px 4px 22px;
            cursor: pointer;
            color: var(--tp-text-secondary, #9BA8C9);
            font-size: 0.82rem;
            transition: all 0.1s;
            border-left: 2px solid transparent;
        }
        .dm-item:hover { background: rgba(255,255,255,0.03); color: var(--tp-text-bright, #fff); }
        .dm-item.active {
            background: var(--tp-accent-subtle, rgba(252,65,0,0.15));
            color: var(--tp-text-bright, #fff);
            border-left-color: var(--tp-accent, #FC4100);
        }

        .dm-avatar {
            width: 22px;
            height: 22px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.6rem;
            color: #fff;
            position: relative;
            flex-shrink: 0;
        }

        .dm-status {
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            border: 1.5px solid var(--tp-abyss, #060c1a);
        }
        .dm-status.online { background: #22c55e; }
        .dm-status.away { background: #eab308; }
        .dm-status.busy { background: #ef4444; }
        .dm-status.offline { background: #6b7280; }

        .dm-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* ===== MAIN CHAT ===== */
        .chat-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            background: var(--tp-deep, #0a1228);
        }

        /* Header */
        .chat-header {
            padding: 0 16px;
            height: 48px;
            border-bottom: 1px solid var(--tp-border, rgba(255,255,255,0.08));
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--tp-deep, #0a1228);
            flex-shrink: 0;
        }

        .header-channel-name {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 1.05rem;
            font-weight: 800;
            color: var(--tp-text-bright, #fff);
            letter-spacing: -0.01em;
            white-space: nowrap;
        }

        .header-channel-name .hash {
            font-weight: 400;
            opacity: 0.5;
        }

        .header-divider {
            width: 1px;
            height: 18px;
            background: var(--tp-border, rgba(255,255,255,0.08));
            flex-shrink: 0;
        }

        .header-topic {
            font-size: 0.78rem;
            color: var(--tp-text-muted, #5F6E8C);
            flex: 1;
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: default;
        }
        .header-topic.editable { cursor: pointer; }
        .header-topic.editable:hover { color: var(--tp-text-secondary, #9BA8C9); }

        .topic-edit-row {
            display: flex;
            gap: 6px;
            align-items: center;
            flex: 1;
            min-width: 0;
        }
        .topic-edit-row input {
            flex: 1;
            background: var(--tp-surface, #122148);
            border: 1px solid var(--tp-border-accent, rgba(252,65,0,0.30));
            border-radius: var(--tp-radius-xs, 4px);
            padding: 3px 8px;
            color: var(--tp-text-bright, #fff);
            font-size: 0.78rem;
            outline: none;
        }
        .topic-edit-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 0.8rem;
            padding: 2px 4px;
            border-radius: 3px;
            transition: background 0.1s;
        }
        .topic-edit-btn:hover { background: rgba(255,255,255,0.06); }

        .header-dm-info {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }

        .header-dm-avatar {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.7rem;
            color: #fff;
            position: relative;
        }

        .header-dm-name {
            font-size: 1.05rem;
            font-weight: 800;
            color: var(--tp-text-bright, #fff);
        }

        .header-dm-presence {
            font-size: 0.75rem;
            margin-left: -4px;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 2px;
            margin-left: auto;
            flex-shrink: 0;
        }

        .header-btn {
            background: none;
            border: none;
            color: var(--tp-text-muted, #5F6E8C);
            padding: 6px 8px;
            border-radius: var(--tp-radius-xs, 4px);
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.1s;
        }
        .header-btn:hover { background: rgba(255,255,255,0.05); color: var(--tp-text-bright, #fff); }
        .header-btn.active { color: var(--tp-accent, #FC4100); background: var(--tp-accent-faint, rgba(252,65,0,0.06)); }

        /* Pinned dropdown */
        .pinned-dropdown {
            position: absolute;
            top: 48px;
            right: 16px;
            background: var(--tp-base, #0e1a3a);
            border: 1px solid var(--tp-border-strong, rgba(255,255,255,0.12));
            border-radius: var(--tp-radius-sm, 8px);
            padding: 8px;
            min-width: 300px;
            max-height: 400px;
            overflow-y: auto;
            box-shadow: var(--tp-shadow-lg, 0 20px 60px rgba(0,0,0,0.6));
            z-index: 80;
        }
        .pinned-dropdown-title {
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--tp-text-bright, #fff);
            padding: 6px 8px;
            border-bottom: 1px solid var(--tp-border-faint, rgba(255,255,255,0.04));
            margin-bottom: 4px;
        }
        .pinned-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            padding: 8px;
            border-radius: var(--tp-radius-xs, 4px);
            transition: background 0.1s;
        }
        .pinned-item:hover { background: rgba(255,255,255,0.03); }
        .pinned-item-author { font-size: 0.75rem; font-weight: 700; color: var(--tp-text-bright, #fff); }
        .pinned-item-text { font-size: 0.75rem; color: var(--tp-text-secondary, #9BA8C9); flex: 1; }
        .pinned-item-unpin {
            background: none; border: none; color: var(--tp-text-dim, #3D4A66);
            cursor: pointer; font-size: 0.7rem; padding: 2px; flex-shrink: 0;
        }
        .pinned-item-unpin:hover { color: var(--tp-red, #EF4444); }

        /* Search bar */
        .search-bar {
            padding: 8px 16px;
            border-bottom: 1px solid var(--tp-border-faint, rgba(255,255,255,0.04));
            display: flex;
            gap: 8px;
            align-items: center;
            background: var(--tp-base, #0e1a3a);
        }
        .search-bar input {
            flex: 1;
            background: var(--tp-surface, #122148);
            border: 1px solid var(--tp-border, rgba(255,255,255,0.08));
            border-radius: var(--tp-radius-xs, 4px);
            padding: 7px 12px;
            color: var(--tp-text-bright, #fff);
            font-size: 0.8rem;
            outline: none;
            transition: border-color 0.15s;
        }
        .search-bar input::placeholder { color: var(--tp-text-dim, #3D4A66); }
        .search-bar input:focus { border-color: var(--tp-accent, #FC4100); }
        .search-close {
            background: none; border: none; color: var(--tp-text-muted, #5F6E8C);
            cursor: pointer; padding: 4px; font-size: 0.9rem;
        }
        .search-close:hover { color: var(--tp-text-bright, #fff); }

        /* ===== MESSAGES ===== */
        .messages-container {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column-reverse;
            position: relative;
        }

        /* Date separator */
        .date-separator {
            display: flex;
            align-items: center;
            padding: 10px 20px 4px;
            position: relative;
        }
        .date-separator::before {
            content: '';
            position: absolute;
            left: 20px;
            right: 20px;
            top: 50%;
            height: 1px;
            background: var(--tp-border, rgba(255,255,255,0.08));
        }
        .date-separator-label {
            position: relative;
            z-index: 1;
            margin: 0 auto;
            padding: 2px 14px;
            font-size: 0.72rem;
            font-weight: 600;
            color: var(--tp-text-secondary, #9BA8C9);
            background: var(--tp-deep, #0a1228);
            border: 1px solid var(--tp-border, rgba(255,255,255,0.08));
            border-radius: 20px;
        }

        /* Unread divider */
        .unread-divider {
            display: flex;
            align-items: center;
            padding: 4px 20px;
        }
        .unread-divider-line { flex: 1; height: 1px; background: var(--tp-red, #EF4444); }
        .unread-divider-text {
            color: var(--tp-red, #EF4444);
            font-size: 0.7rem;
            font-weight: 600;
            padding: 0 12px;
            white-space: nowrap;
        }

        /* Message row - Slack flat style */
        .message-row {
            display: flex;
            gap: 8px;
            padding: 4px 20px;
            position: relative;
            transition: background 0.05s;
        }
        .message-row:hover { background: rgba(255,255,255,0.02); }

        .message-row:not(.grouped) {
            padding-top: 8px;
        }

        .message-row.grouped {
            padding-top: 0;
            padding-bottom: 0;
        }

        .message-row.highlight {
            background: rgba(252, 65, 0, 0.06);
        }

        .msg-avatar {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.72rem;
            color: #fff;
            flex-shrink: 0;
            margin-top: 1px;
        }

        .msg-avatar-spacer {
            width: 32px;
            flex-shrink: 0;
            display: flex;
            align-items: flex-start;
            justify-content: center;
        }

        .msg-hover-time {
            font-size: 0.58rem;
            color: transparent;
            padding-top: 2px;
            font-variant-numeric: tabular-nums;
            min-width: 32px;
            text-align: center;
        }
        .message-row.grouped:hover .msg-hover-time { color: var(--tp-text-dim, #3D4A66); }

        .msg-body {
            flex: 1;
            min-width: 0;
        }

        .msg-header {
            display: flex;
            align-items: baseline;
            gap: 5px;
            margin-bottom: 0;
            line-height: 1.3;
        }

        .msg-author {
            font-size: 0.84rem;
            font-weight: 800;
            color: var(--tp-text-bright, #fff);
            cursor: pointer;
        }
        .msg-author:hover { text-decoration: underline; }

        .msg-role {
            font-size: 0.55rem;
            font-weight: 600;
            padding: 1px 4px;
            border-radius: 3px;
            letter-spacing: 0.02em;
        }

        .msg-time {
            font-size: 0.68rem;
            color: var(--tp-text-dim, #3D4A66);
        }

        .msg-edited {
            font-size: 0.6rem;
            color: var(--tp-text-dim, #3D4A66);
        }

        .msg-text {
            font-size: 0.84rem;
            color: var(--tp-text-primary, #E2E8F7);
            line-height: 1.38;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }

        .msg-text a { color: var(--tp-blue, #3B82F6); }
        .msg-text a:hover { text-decoration: underline; }

        .msg-text pre {
            background: var(--tp-void, #04080f);
            border: 1px solid var(--tp-border, rgba(255,255,255,0.08));
            border-radius: var(--tp-radius-xs, 4px);
            padding: 8px 12px;
            margin: 4px 0;
            overflow-x: auto;
            font-size: 0.78rem;
            line-height: 1.35;
        }
        .msg-text code {
            background: var(--tp-void, #04080f);
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 0.78rem;
            border: 1px solid var(--tp-border-faint, rgba(255,255,255,0.04));
        }
        .msg-text pre code { background: none; padding: 0; border: none; }

        .msg-text .mention-highlight {
            color: var(--tp-blue, #3B82F6);
            font-weight: 600;
            background: rgba(59, 130, 246, 0.12);
            padding: 1px 4px;
            border-radius: 3px;
        }

        .msg-text .blockquote {
            border-left: 3px solid var(--tp-accent, #FC4100);
            padding: 2px 10px;
            margin: 2px 0;
            color: var(--tp-text-secondary, #9BA8C9);
        }

        /* Attachments */
        .msg-attachment { margin-top: 3px; }
        .msg-attachment img {
            max-width: 320px;
            max-height: 220px;
            border-radius: var(--tp-radius-sm, 8px);
            border: 1px solid var(--tp-border-faint, rgba(255,255,255,0.04));
            cursor: pointer;
        }
        .msg-attachment img:hover { border-color: var(--tp-border, rgba(255,255,255,0.08)); }
        .msg-file-download {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            background: var(--tp-base, #0e1a3a);
            border: 1px solid var(--tp-border, rgba(255,255,255,0.08));
            border-radius: 6px;
            color: var(--tp-text-primary, #E2E8F7);
            text-decoration: none;
            font-size: 0.78rem;
            margin-top: 3px;
            transition: border-color 0.15s;
        }
        .msg-file-download:hover { border-color: var(--tp-border-strong, rgba(255,255,255,0.12)); }

        .voice-player { margin-top: 2px; }
        .voice-player audio {
            width: 100%;
            max-width: 260px;
            height: 28px;
            border-radius: var(--tp-radius-xs, 4px);
        }

        /* Hover actions - Slack style, top-right of message row */
        .hover-actions {
            position: absolute;
            top: -4px;
            right: 20px;
            display: none;
            gap: 1px;
            background: var(--tp-base, #0e1a3a);
            border: 1px solid var(--tp-border-strong, rgba(255,255,255,0.12));
            border-radius: var(--tp-radius-sm, 8px);
            padding: 2px 4px;
            box-shadow: var(--tp-shadow-sm, 0 2px 8px rgba(0,0,0,0.4));
            z-index: 20;
        }
        .message-row:hover .hover-actions { display: flex; }

        .hover-actions button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 5px 6px;
            border-radius: var(--tp-radius-xs, 4px);
            font-size: 0.85rem;
            color: var(--tp-text-secondary, #9BA8C9);
            transition: background 0.1s;
        }
        .hover-actions button:hover {
            background: rgba(255,255,255,0.06);
            color: var(--tp-text-bright, #fff);
        }
        .hover-actions .action-sep {
            width: 1px;
            background: var(--tp-border-faint, rgba(255,255,255,0.04));
            margin: 4px 2px;
        }

        /* Reactions */
        .reactions-row {
            display: flex;
            gap: 3px;
            margin-top: 2px;
            flex-wrap: wrap;
        }

        .reaction-btn {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            padding: 1px 6px;
            border-radius: 12px;
            font-size: 0.72rem;
            background: var(--tp-surface, #122148);
            border: 1px solid var(--tp-border, rgba(255,255,255,0.08));
            cursor: pointer;
            transition: all 0.1s;
            color: var(--tp-text-secondary, #9BA8C9);
        }
        .reaction-btn:hover { background: var(--tp-elevated, #182c5a); border-color: var(--tp-border-strong, rgba(255,255,255,0.12)); }
        .reaction-btn.active { border-color: var(--tp-blue, #3B82F6); background: rgba(59, 130, 246, 0.1); }
        .reaction-emoji { font-size: 0.75rem; line-height: 1; }
        .reaction-count { font-weight: 600; font-size: 0.65rem; }

        /* Thread reply count */
        .thread-reply-count {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            background: none;
            border: none;
            color: var(--tp-blue, #3B82F6);
            font-size: 0.72rem;
            font-weight: 600;
            cursor: pointer;
            padding: 2px 0;
            margin-top: 1px;
            transition: color 0.1s;
        }
        .thread-reply-count:hover { color: #60a5fa; text-decoration: underline; }

        /* Empty state */
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 40px 20px;
            gap: 8px;
        }
        .empty-state-icon {
            width: 56px;
            height: 56px;
            border-radius: var(--tp-radius-md, 12px);
            background: var(--tp-accent-subtle, rgba(252,65,0,0.15));
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-bottom: 8px;
        }
        .empty-state h3 {
            font-size: 1.1rem;
            font-weight: 800;
            color: var(--tp-text-bright, #fff);
            margin: 0;
        }
        .empty-state p {
            font-size: 0.85rem;
            color: var(--tp-text-muted, #5F6E8C);
            margin: 0;
            max-width: 460px;
            line-height: 1.5;
        }

        /* ===== INPUT AREA ===== */
        .input-area {
            padding: 0 16px 16px;
            flex-shrink: 0;
        }

        .typing-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 4px 6px;
            font-size: 0.72rem;
            color: var(--tp-text-muted, #5F6E8C);
            min-height: 22px;
        }
        .typing-dots { display: inline-flex; gap: 2px; }
        .typing-dots span {
            width: 4px; height: 4px; border-radius: 50%;
            background: var(--tp-text-muted, #5F6E8C);
            animation: typingBounce 1.2s infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-3px); opacity: 1; }
        }

        .attachment-preview {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            margin-bottom: 8px;
            background: rgba(59, 130, 246, 0.08);
            border-radius: var(--tp-radius-sm, 8px);
            border: 1px solid rgba(59, 130, 246, 0.15);
        }
        .attachment-preview-info { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--tp-blue, #3B82F6); }
        .attachment-preview button {
            background: none; border: none; color: var(--tp-text-muted, #5F6E8C);
            cursor: pointer; padding: 2px; font-size: 0.85rem;
        }
        .attachment-preview button:hover { color: var(--tp-red, #EF4444); }

        .input-box {
            background: var(--tp-base, #0e1a3a);
            border: 1px solid var(--tp-border, rgba(255,255,255,0.08));
            border-radius: var(--tp-radius-sm, 8px);
            transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input-box:focus-within {
            border-color: var(--tp-border-accent, rgba(252,65,0,0.30));
            box-shadow: 0 0 0 2px var(--tp-accent-faint, rgba(252,65,0,0.06));
        }

        .input-box textarea {
            width: 100%;
            background: transparent;
            border: none;
            padding: 10px 14px;
            font-size: 0.88rem;
            color: var(--tp-text-bright, #fff);
            outline: none;
            resize: none;
            min-height: 22px;
            max-height: 160px;
            font-family: inherit;
            line-height: 1.4;
        }
        .input-box textarea::placeholder { color: var(--tp-text-dim, #3D4A66); }

        .input-bottom-bar {
            display: flex;
            align-items: center;
            padding: 4px 8px;
            border-top: 1px solid var(--tp-border-faint, rgba(255,255,255,0.04));
        }

        .format-group {
            display: flex;
            gap: 0;
        }

        .fmt-btn {
            background: none;
            border: none;
            color: var(--tp-text-dim, #3D4A66);
            padding: 5px 7px;
            border-radius: var(--tp-radius-xs, 4px);
            cursor: pointer;
            font-size: 0.78rem;
            transition: all 0.1s;
        }
        .fmt-btn:hover { background: rgba(255,255,255,0.05); color: var(--tp-text-secondary, #9BA8C9); }

        .input-sep {
            width: 1px;
            height: 18px;
            background: var(--tp-border-faint, rgba(255,255,255,0.04));
            margin: 0 4px;
        }

        .action-group {
            display: flex;
            gap: 0;
        }

        .act-btn {
            background: none;
            border: none;
            color: var(--tp-text-dim, #3D4A66);
            padding: 5px 7px;
            border-radius: var(--tp-radius-xs, 4px);
            cursor: pointer;
            font-size: 0.88rem;
            transition: all 0.1s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .act-btn:hover { background: rgba(255,255,255,0.05); color: var(--tp-text-secondary, #9BA8C9); }

        label.act-btn { cursor: pointer; }

        .send-btn {
            margin-left: auto;
            background: var(--tp-surface, #122148);
            border: none;
            padding: 5px 10px;
            border-radius: var(--tp-radius-xs, 4px);
            color: var(--tp-text-dim, #3D4A66);
            cursor: not-allowed;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: all 0.15s;
        }
        .send-btn.has-content {
            background: var(--tp-accent, #FC4100);
            color: #fff;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(252, 65, 0, 0.25);
        }
        .send-btn.has-content:hover {
            background: var(--tp-accent-bright, #FF6633);
            box-shadow: 0 4px 12px rgba(252, 65, 0, 0.35);
        }

        /* Pickers */
        .emoji-picker {
            position: absolute;
            bottom: 100%;
            left: 0;
            margin-bottom: 8px;
            background: var(--tp-base, #0e1a3a);
            border: 1px solid var(--tp-border-strong, rgba(255,255,255,0.12));
            border-radius: var(--tp-radius-sm, 8px);
            padding: 10px;
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
            box-shadow: var(--tp-shadow-md, 0 8px 30px rgba(0,0,0,0.5));
            z-index: 100;
        }
        .emoji-picker button {
            background: none; border: none; font-size: 1.2rem;
            padding: 5px; border-radius: 4px; cursor: pointer;
        }
        .emoji-picker button:hover { background: rgba(255,255,255,0.08); }

        .gif-picker {
            position: absolute;
            bottom: 100%;
            left: 40px;
            margin-bottom: 8px;
            background: var(--tp-base, #0e1a3a);
            border: 1px solid var(--tp-border-strong, rgba(255,255,255,0.12));
            border-radius: var(--tp-radius-sm, 8px);
            padding: 10px;
            width: 320px;
            max-height: 400px;
            box-shadow: var(--tp-shadow-md, 0 8px 30px rgba(0,0,0,0.5));
            z-index: 100;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .gif-picker-search {
            background: var(--tp-surface, #122148);
            border: 1px solid var(--tp-border, rgba(255,255,255,0.08));
            border-radius: var(--tp-radius-xs, 4px);
            padding: 8px 10px;
            color: var(--tp-text-bright, #fff);
            font-size: 0.82rem;
            outline: none;
        }
        .gif-picker-search::placeholder { color: var(--tp-text-dim, #3D4A66); }
        .gif-picker-results { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; overflow-y: auto; max-height: 300px; }
        .gif-picker-results img {
            width: 100%; height: 90px; object-fit: cover;
            border-radius: var(--tp-radius-xs, 4px); cursor: pointer;
            transition: opacity 0.1s;
        }
        .gif-picker-results img:hover { opacity: 0.8; }

        /* Voice recording */
        .voice-recording-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: var(--tp-radius-sm, 8px);
            margin-bottom: 8px;
        }
        .recording-dot { width: 8px; height: 8px; background: var(--tp-red, #EF4444); border-radius: 50%; animation: pulse 1s infinite; }
        .recording-time { font-size: 0.82rem; color: var(--tp-red, #EF4444); font-weight: 500; font-variant-numeric: tabular-nums; }
        .voice-recording-indicator button {
            margin-left: auto;
            background: none; border: none;
            color: var(--tp-text-muted, #5F6E8C);
            cursor: pointer; padding: 4px 6px; border-radius: 4px;
            font-size: 0.85rem;
        }
        .voice-recording-indicator button:hover { background: rgba(255,255,255,0.06); color: var(--tp-text-bright, #fff); }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        /* Drag & Drop */
        .messages-container.drag-over { outline: 2px dashed var(--tp-accent, #FC4100); outline-offset: -4px; }
        .drop-zone-overlay {
            position: absolute;
            inset: 0;
            background: rgba(252, 65, 0, 0.06);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 50;
            pointer-events: none;
        }
        .drop-zone-content {
            padding: 20px 40px;
            background: var(--tp-base, #0e1a3a);
            border: 2px dashed var(--tp-accent, #FC4100);
            border-radius: var(--tp-radius-md, 12px);
            color: var(--tp-accent, #FC4100);
            font-weight: 600;
            font-size: 0.88rem;
        }

        /* ===== THREAD PANEL ===== */
        .thread-panel {
            width: 380px;
            background: var(--tp-abyss, #060c1a);
            border-left: 1px solid var(--tp-border, rgba(255,255,255,0.08));
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        }

        .thread-header {
            height: 48px;
            padding: 0 16px;
            border-bottom: 1px solid var(--tp-border, rgba(255,255,255,0.08));
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .thread-header h3 {
            font-size: 0.95rem;
            font-weight: 800;
            color: var(--tp-text-bright, #fff);
            margin: 0;
        }
        .thread-close {
            background: none; border: none;
            color: var(--tp-text-muted, #5F6E8C);
            cursor: pointer; font-size: 1rem; padding: 4px;
            border-radius: 4px;
        }
        .thread-close:hover { background: rgba(255,255,255,0.06); color: var(--tp-text-bright, #fff); }

        .thread-parent {
            padding: 16px;
            border-bottom: 1px solid var(--tp-border-faint, rgba(255,255,255,0.04));
        }
        .thread-parent .msg-header { margin-bottom: 4px; }
        .thread-parent .msg-text { font-size: 0.85rem; }
        .thread-parent-img { max-width: 200px; border-radius: var(--tp-radius-sm, 8px); margin-bottom: 6px; }

        .thread-replies-divider {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 16px;
            border-bottom: 1px solid var(--tp-border-faint, rgba(255,255,255,0.04));
        }
        .thread-replies-divider span {
            font-size: 0.72rem;
            font-weight: 600;
            color: var(--tp-text-muted, #5F6E8C);
            white-space: nowrap;
        }
        .thread-replies-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--tp-border-faint, rgba(255,255,255,0.04));
        }

        .thread-messages {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }

        .thread-reply {
            display: flex;
            gap: 8px;
            padding: 6px 16px;
            transition: background 0.05s;
        }
        .thread-reply:hover { background: rgba(255,255,255,0.02); }

        .thread-reply-avatar {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.62rem;
            color: #fff;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .thread-reply-body { flex: 1; min-width: 0; }
        .thread-reply-meta {
            display: flex;
            align-items: baseline;
            gap: 6px;
            margin-bottom: 1px;
        }
        .thread-reply-author {
            font-size: 0.82rem;
            font-weight: 800;
            color: var(--tp-text-bright, #fff);
        }
        .thread-reply-time {
            font-size: 0.65rem;
            color: var(--tp-text-dim, #3D4A66);
        }
        .thread-reply-text {
            font-size: 0.82rem;
            color: var(--tp-text-primary, #E2E8F7);
            line-height: 1.4;
            word-wrap: break-word;
        }

        .thread-empty {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--tp-text-dim, #3D4A66);
            font-size: 0.82rem;
            padding: 24px;
            text-align: center;
        }

        .thread-input {
            padding: 12px 16px;
            border-top: 1px solid var(--tp-border, rgba(255,255,255,0.08));
        }
        .thread-input form { display: flex; gap: 8px; }
        .thread-input input {
            flex: 1;
            background: var(--tp-base, #0e1a3a);
            border: 1px solid var(--tp-border, rgba(255,255,255,0.08));
            border-radius: var(--tp-radius-xs, 4px);
            padding: 8px 12px;
            color: var(--tp-text-bright, #fff);
            font-size: 0.82rem;
            outline: none;
            transition: border-color 0.15s;
        }
        .thread-input input:focus { border-color: var(--tp-accent, #FC4100); }
        .thread-input input::placeholder { color: var(--tp-text-dim, #3D4A66); }
        .thread-input button {
            background: var(--tp-accent, #FC4100);
            border: none;
            color: #fff;
            padding: 8px 14px;
            border-radius: var(--tp-radius-xs, 4px);
            font-weight: 700;
            font-size: 0.78rem;
            cursor: pointer;
            transition: background 0.15s;
        }
        .thread-input button:hover { background: var(--tp-accent-dim, #c43500); }

        /* ===== SCROLLBARS ===== */
        .messages-container::-webkit-scrollbar,
        .sidebar-content::-webkit-scrollbar,
        .thread-messages::-webkit-scrollbar { width: 6px; }
        .messages-container::-webkit-scrollbar-track,
        .sidebar-content::-webkit-scrollbar-track,
        .thread-messages::-webkit-scrollbar-track { background: transparent; }
        .messages-container::-webkit-scrollbar-thumb,
        .sidebar-content::-webkit-scrollbar-thumb,
        .thread-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; }
        .messages-container::-webkit-scrollbar-thumb:hover,
        .sidebar-content::-webkit-scrollbar-thumb:hover,
        .thread-messages::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
    </style>

    <div class="chat-wrapper" wire:poll.3s
         x-data="{
            notifAudio: null,
            lastMsgId: '{{ $this->messages->first()?->id ?? '' }}',
            lastMsgCount: {{ $this->messages->count() }},
            init() {
                this.notifAudio = new Audio('data:audio/wav;base64,UklGRl9vT19teleWQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + 'tvT19t');
                this.notifAudio.volume = 0.3;
            }
         }"
         x-effect="
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
         @keydown.window.ctrl.k.prevent="$wire.set('showSearch', true); $nextTick(() => { if ($refs.searchInput) $refs.searchInput.focus(); })">

        {{-- ===== SIDEBAR ===== --}}
        <div class="chat-sidebar">
            <div class="sidebar-header">
                <div class="sidebar-header-top">
                    <div class="workspace-name">
                        TechPlay Redakcija
                        <span class="chevron">&#9660;</span>
                    </div>
                    @if(auth()->user()->hasRole('Super Admin'))
                        <a href="{{ \App\Filament\Resources\EditorialChannelResource::getUrl() }}" class="compose-btn" title="Manage Channels">&#9881;</a>
                    @endif
                </div>

                <div class="sidebar-user">
                    @php $myPresence = $this->getUserPresence(auth()->user()); @endphp
                    <div class="sidebar-user-avatar" style="background: var(--tp-accent);">
                        {{ substr(auth()->user()->name, 0, 1) }}
                    </div>
                    <span class="sidebar-user-name">{{ auth()->user()->name }}</span>
                    <div class="status-selector" x-data="{ open: false }">
                        <button @click="open = !open" class="status-trigger" title="Set status">
                            <span class="status-dot {{ $myPresence }}"></span>
                        </button>
                        <div x-show="open" @click.away="open = false" x-transition class="status-dropdown">
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
                                {{ substr($user->name, 0, 1) }}
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
                @if($this->activeChannel)
                    @php $channel = $this->channels->firstWhere('slug', $this->activeChannel); @endphp
                    @if($channel)
                        <span class="header-channel-name">
                            <span class="hash">#</span>{{ $channel->name }}
                        </span>

                        <div class="header-divider"></div>

                        @if($this->editingTopic)
                            <div class="topic-edit-row">
                                <input type="text" wire:model="topicContent" placeholder="Add a topic..." autofocus
                                    @keydown.enter.prevent="$wire.saveTopic()"
                                    @keydown.escape="$wire.cancelEditTopic()">
                                <button wire:click="saveTopic" class="topic-edit-btn" style="color: #22c55e;">&#10003;</button>
                                <button wire:click="cancelEditTopic" class="topic-edit-btn" style="color: var(--tp-text-muted);">&#10005;</button>
                            </div>
                        @else
                            <span class="header-topic {{ auth()->user()->hasRole(['Super Admin', 'Editor-in-Chief', 'Editor']) ? 'editable' : '' }}"
                                @if(auth()->user()->hasRole(['Super Admin', 'Editor-in-Chief', 'Editor']))
                                    wire:click="startEditTopic"
                                    title="Click to edit topic"
                                @endif>
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
                            {{ substr($recipient->name, 0, 1) }}
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
                            <button @click="showPinned = !showPinned"
                                class="header-btn" :class="{ active: showPinned }" title="Pinned messages">
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
                                        <button wire:click="unpinMessage({{ $pinned->id }})" class="pinned-item-unpin" title="Unpin">&#10005;</button>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endif

                    <button class="header-btn {{ $this->showSearch ? 'active' : '' }}"
                        wire:click="$toggle('showSearch')" title="Search (Ctrl+K)">
                        &#128269;
                    </button>
                </div>
            </div>

            {{-- Search Bar --}}
            @if($this->showSearch)
                <div class="search-bar">
                    <input type="text" wire:model.live.debounce.300ms="search" x-ref="searchInput"
                        placeholder="Search messages... (from:user has:attachment after:2026-01-01)" autofocus>
                    <button wire:click="$set('showSearch', false); $set('search', '')" class="search-close" title="Close">&#10005;</button>
                </div>
            @endif

            {{-- Messages --}}
            <div class="messages-container"
                 x-data="{ dragging: false }"
                 @dragover.prevent="dragging = true"
                 @dragleave.prevent="dragging = false"
                 @drop.prevent="dragging = false; let files = $event.dataTransfer.files; if (files.length > 0) { @this.upload('attachment', files[0]); }"
                 :class="{ 'drag-over': dragging }">

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

                    <div class="message-row {{ $isGrouped ? 'grouped' : '' }} {{ $this->highlightMessageId == $msg->id ? 'highlight' : '' }}"
                         id="msg-{{ $msg->id }}">

                        @if($isGrouped)
                            {{-- Grouped: show time on hover instead of avatar --}}
                            <div class="msg-avatar-spacer">
                                <span class="msg-hover-time">{{ $msg->created_at->format('H:i') }}</span>
                            </div>
                        @else
                            {{-- Full message: show avatar --}}
                            <div class="msg-avatar" style="background: {{ $avatarColor }};">
                                {{ substr($msg->user->name, 0, 1) }}
                            </div>
                        @endif

                        <div class="msg-body">
                            @if(!$isGrouped)
                                <div class="msg-header">
                                    <span class="msg-author">{{ $msg->user->name }}</span>
                                    <span class="msg-role"
                                        style="background: {{ $roleBadge['color'] }}15; color: {{ $roleBadge['color'] }};">
                                        {{ $roleBadge['short'] }}
                                    </span>
                                    <span class="msg-time">{{ $msg->created_at->format('H:i') }}</span>
                                    @if($msg->edited_at)
                                        <span class="msg-edited">(edited)</span>
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
                                        <a href="{{ Str::startsWith($msg->attachment_url, 'http') ? $msg->attachment_url : asset('storage/' . $msg->attachment_url) }}" target="_blank">
                                            <img src="{{ Str::startsWith($msg->attachment_url, 'http') ? $msg->attachment_url : asset('storage/' . $msg->attachment_url) }}" alt="Attachment">
                                        </a>
                                    @else
                                        <a href="{{ asset('storage/' . $msg->attachment_url) }}" target="_blank" class="msg-file-download">
                                            &#128206; {{ basename($msg->attachment_url) }}
                                        </a>
                                    @endif
                                </div>
                            @endif

                            @if($msg->content)
                                <div class="msg-text">{!! $this->formatMessageContent($msg->content) !!}</div>
                            @endif

                            {{-- Reactions --}}
                            @if($msg->reactions->count() > 0)
                                <div class="reactions-row">
                                    @foreach($msg->reactions->groupBy('emoji') as $emoji => $reactions)
                                        <button wire:click="toggleReaction({{ $msg->id }}, '{{ $emoji }}')"
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
                                <button wire:click="toggleReaction({{ $msg->id }}, '{{ html_entity_decode($emoji) }}')" title="React">{!! $emoji !!}</button>
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
                            @if($isMe)
                                <button wire:click="deleteMessage({{ $msg->id }})" title="Delete" style="color: var(--tp-red);">&#128465;</button>
                            @endif
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
                            <p>This is the very beginning of the <strong>#{{ $ch?->name ?? $this->activeChannel }}</strong> channel. Start the conversation!</p>
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
            </div>

            {{-- Typing Indicator --}}
            <div class="input-area">
                @if(count($this->typingUsers) > 0)
                    <div class="typing-indicator">
                        <span class="typing-dots"><span></span><span></span><span></span></span>
                        <span>{{ implode(', ', $this->typingUsers) }} {{ count($this->typingUsers) === 1 ? 'is' : 'are' }} typing...</span>
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

                <form wire:submit="sendMessage" x-data="{
                    showEmojis: false,
                    showGifs: false,
                    gifSearch: '',
                    gifs: [],
                    isRecording: false,
                    recordingTime: 0,
                    mediaRecorder: null,
                    audioChunks: [],
                    recordingInterval: null,

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
                    }
                }" style="position: relative;">

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
                        <button type="button" @click="stopRecording()" title="Send" style="color: #22c55e;">&#10003;</button>
                    </div>

                    <div class="input-box">
                        <textarea wire:model="message" x-ref="messageInput"
                            placeholder="Message {{ $this->activeChannel ? '#' . ($this->channels->firstWhere('slug', $this->activeChannel)?->name ?? 'channel') : ($this->activeRecipient ? $this->users->find($this->activeRecipient)?->name ?? 'user' : 'chat') }}..."
                            rows="1"
                            @keydown.enter.prevent="if (!$event.shiftKey) { $wire.sendMessage(); }"
                            autocomplete="off"></textarea>

                        <div class="input-bottom-bar">
                            <div class="format-group">
                                <button type="button" @click="wrapSelection('**', '**')" class="fmt-btn" title="Bold"><strong>B</strong></button>
                                <button type="button" @click="wrapSelection('*', '*')" class="fmt-btn" title="Italic"><em>I</em></button>
                                <button type="button" @click="wrapSelection('~~', '~~')" class="fmt-btn" title="Strikethrough"><del>S</del></button>
                                <button type="button" @click="wrapSelection('`', '`')" class="fmt-btn" title="Inline code" style="font-family: monospace;">&lt;/&gt;</button>
                                <button type="button" @click="wrapSelection('```\n', '\n```')" class="fmt-btn" title="Code block" style="font-family: monospace;">{ }</button>
                            </div>

                            <div class="input-sep"></div>

                            <div class="action-group">
                                <button type="button" @click="showEmojis = !showEmojis; showGifs = false"
                                    class="act-btn" title="Emoji">&#128522;</button>
                                <button type="button" @click="showGifs = !showGifs; showEmojis = false"
                                    class="act-btn" title="GIF" style="font-size: 0.7rem; font-weight: 700;">GIF</button>
                                <label class="act-btn" title="Attach file">
                                    <input type="file" wire:model="attachment" style="display: none;">
                                    &#128206;
                                </label>
                                <button type="button" @click="isRecording ? stopRecording() : startRecording()"
                                    class="act-btn" :style="isRecording ? 'color: var(--tp-red)' : ''"
                                    title="Voice message">&#127908;</button>
                            </div>

                            <button type="submit" class="send-btn" :class="{ 'has-content': $wire.message?.length > 0 }" wire:loading.attr="disabled">
                                &#10148;
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        {{-- ===== THREAD PANEL ===== --}}
        @if($this->activeThread)
            <div class="thread-panel">
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
                            <div class="thread-reply-avatar" style="background: {{ $parentColor }}; width: 32px; height: 32px; font-size: 0.7rem; border-radius: 8px;">
                                {{ substr($parentMsg->user->name, 0, 1) }}
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <div class="msg-header">
                                    <span class="msg-author" style="font-size: 0.85rem;">{{ $parentMsg->user->name }}</span>
                                    <span class="msg-role" style="background: {{ $parentBadge['color'] }}15; color: {{ $parentBadge['color'] }};">{{ $parentBadge['short'] }}</span>
                                    <span class="msg-time">{{ $parentMsg->created_at->format('H:i, d M') }}</span>
                                </div>
                                @if($parentMsg->attachment_url)
                                    @if(Str::endsWith($parentMsg->attachment_url, ['.jpg', '.jpeg', '.png', '.gif', '.webp']) || Str::startsWith($parentMsg->attachment_url, 'http'))
                                        <img src="{{ Str::startsWith($parentMsg->attachment_url, 'http') ? $parentMsg->attachment_url : asset('storage/' . $parentMsg->attachment_url) }}" alt="" class="thread-parent-img">
                                    @endif
                                @endif
                                <div class="msg-text" style="font-size: 0.85rem;">{!! $this->formatMessageContent($parentMsg->content) !!}</div>
                            </div>
                        </div>
                    </div>
                @endif

                @if($this->threadMessages->count() > 0)
                    <div class="thread-replies-divider">
                        <span>{{ $this->threadMessages->count() }} {{ Str::plural('reply', $this->threadMessages->count()) }}</span>
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
                                {{ substr($reply->user->name, 0, 1) }}
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
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            if (Notification.permission !== "granted" && Notification.permission !== "denied") {
                Notification.requestPermission();
            }
        });
    </script>
</x-filament-panels::page>
