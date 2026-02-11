<x-filament-panels::page>
    <style>
        /* ===== HIDE PAGE HEADER & MAKE CARD LAYOUT ===== */
        .fi-header {
            display: none !important;
        }

        .fi-main {
            padding: 1.5rem !important;
            max-width: none !important;
        }

        /* ===== FOUNDATION ===== */
        .chat-wrapper {
            display: flex;
            height: calc(100vh - 12rem);
            max-height: 720px;
            width: 100%;
            max-width: 1400px;
            margin: 0 auto;
            background: var(--tp-base, #ffffff);
            border-radius: var(--tp-radius-lg, 12px);
            border: none;
            box-shadow: var(--tp-shadow-lg, 0 4px 18px -4px rgba(71, 78, 114, 0.35));
            overflow: hidden;
            position: relative;
            font-family: 'Inter', sans-serif;
        }

        /* ===== SIDEBAR ===== */
        .chat-sidebar {
            width: 280px;
            background: var(--tp-base, #ffffff);
            border-right: 1px solid var(--tp-border, #ebe9f1);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            contain: layout style;
            z-index: 20;
        }

        .dark .chat-sidebar {
            border-right: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sidebar-header {
            padding: 20px 24px;
            /* slightly taller header */
        }

        .sidebar-header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }

        .workspace-name {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--tp-text-bright, #3a3541);
            letter-spacing: -0.01em;
        }

        .dark .workspace-name {
            color: #fff;
        }

        .workspace-name .chevron {
            font-size: 0.65rem;
            opacity: 0.5;
            margin-top: 2px;
        }

        .compose-btn {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: rgba(115, 103, 240, 0.1);
            color: #7367f0;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            transition: all 0.2s var(--tp-ease);
        }

        .compose-btn:hover {
            background: #7367f0;
            color: #fff;
            box-shadow: 0 4px 12px rgba(115, 103, 240, 0.4);
        }

        .sidebar-user {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 4px 0;
        }

        .sidebar-user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 700;
            color: #fff;
            position: relative;
            background: #7367f0;
            /* fallback */
        }

        .sidebar-user-name {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--tp-text-primary, #3a3541);
            flex: 1;
        }

        .dark .sidebar-user-name {
            color: #E2E8F7;
        }

        /* Status dot */
        .status-dot {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            border: 2px solid var(--tp-base, #ffffff);
            position: absolute;
            bottom: -2px;
            right: -2px;
        }

        .status-dot.online {
            background: #28c76f;
        }

        .status-dot.away {
            background: #ff9f43;
        }

        .status-dot.busy {
            background: #ea5455;
        }

        .status-dot.offline {
            background: #a8aaae;
        }

        /* Quick Nav */
        .sidebar-nav {
            padding: 8px 12px;
            border-bottom: 1px solid var(--tp-border-faint, rgba(75, 70, 92, 0.05));
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            min-height: 40px;
            padding: 8px 14px;
            cursor: pointer;
            color: var(--tp-text-secondary, #6f6b7d);
            font-size: 0.9rem;
            border-radius: 6px;
            transition: all 0.15s ease-in-out;
            margin-bottom: 2px;
        }

        .nav-item:hover {
            background: rgba(75, 70, 92, 0.04);
            color: var(--tp-text-primary, #3a3541);
        }

        .dark .nav-item {
            color: #bcd4ea;
        }

        .dark .nav-item:hover {
            background: rgba(255, 255, 255, 0.04);
            color: #fff;
        }

        .nav-item .nav-icon {
            width: 20px;
            text-align: center;
            font-size: 1.05rem;
            opacity: 0.9;
        }

        .nav-item .nav-badge {
            margin-left: auto;
            background: #ea5455;
            color: #fff;
            font-size: 0.65rem;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 12px;
            min-width: 20px;
            text-align: center;
            box-shadow: 0 2px 6px rgba(234, 84, 85, 0.3);
        }

        /* Sidebar content */
        .sidebar-content {
            flex: 1;
            overflow-y: auto;
            padding: 12px 12px 20px;
        }

        /* Sections */
        .sidebar-section {
            margin-top: 16px;
        }

        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 14px;
            cursor: pointer;
            margin-bottom: 4px;
        }

        .section-title {
            font-size: 0.72rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--tp-text-muted, #a8aaae);
            font-weight: 700;
        }

        /* Channel/DM items */
        .channel-item,
        .dm-item {
            display: flex;
            align-items: center;
            gap: 10px;
            min-height: 40px;
            padding: 8px 14px;
            margin-bottom: 2px;
            cursor: pointer;
            color: var(--tp-text-secondary, #6f6b7d);
            font-size: 0.9rem;
            border-radius: 6px;
            /* Pill shape */
            transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
            position: relative;
        }

        .dark .channel-item,
        .dark .dm-item {
            color: #b6bee3;
        }

        .channel-item:hover,
        .dm-item:hover {
            background: rgba(75, 70, 92, 0.04);
            color: var(--tp-text-primary, #3a3541);
            transform: translateX(3px);
        }

        .dark .channel-item:hover,
        .dark .dm-item:hover {
            background: rgba(255, 255, 255, 0.04);
            color: #fff;
        }

        /* Active State - Gradient Pill */
        .channel-item.active,
        .dm-item.active {
            background: linear-gradient(72.47deg, #7367f0 22.16%, rgba(115, 103, 240, 0.7) 76.47%);
            color: #fff !important;
            box-shadow: 0 3px 10px -2px rgba(115, 103, 240, 0.5);
        }

        .channel-item.active .channel-hash,
        .dm-item.active .dm-status {
            color: rgba(255, 255, 255, 0.8);
            border-color: transparent;
            /* hide status border */
        }

        .channel-hash {
            font-size: 1rem;
            font-weight: 400;
            opacity: 0.7;
            width: 18px;
            text-align: center;
        }

        .channel-name,
        .dm-name {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: 500;
        }

        .channel-item.active .channel-name,
        .dm-item.active .dm-name {
            font-weight: 600;
        }

        .unread-badge {
            background: #ea5455;
            color: #fff;
            font-size: 0.65rem;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 10px;
            min-width: 18px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(234, 84, 85, 0.3);
        }

        .dm-avatar {
            width: 26px;
            height: 26px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.7rem;
            color: #fff;
            position: relative;
            flex-shrink: 0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .dm-status {
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 9px;
            height: 9px;
            border-radius: 50%;
            border: 1.5px solid var(--tp-base, #ffffff);
            z-index: 2;
        }

        .dm-status.online {
            background: #28c76f;
        }

        .dm-status.away {
            background: #ff9f43;
        }

        .dm-status.busy {
            background: #ea5455;
        }

        .dm-status.offline {
            background: #a8aaae;
        }

        /* ===== MAIN CHAT ===== */
        .chat-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            background: var(--tp-void, #f4f5fa);
            position: relative;
        }

        .dark .chat-main {
            background: #25293c;
            /* Dark void */
        }

        /* Header */
        .chat-header {
            padding: 0 24px;
            height: 64px;
            border-bottom: 1px solid var(--tp-border, #ebe9f1);
            display: flex;
            align-items: center;
            gap: 12px;
            background: var(--tp-base, #ffffff);
            flex-shrink: 0;
            z-index: 10;
        }

        .dark .chat-header {
            border-bottom-color: rgba(255, 255, 255, 0.08);
        }

        .header-channel-name {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--tp-text-bright, #3a3541);
            letter-spacing: -0.01em;
            white-space: nowrap;
        }

        .dark .header-channel-name {
            color: #fff;
        }

        .header-channel-name .hash {
            font-weight: 400;
            opacity: 0.5;
            color: #a8aaae;
        }

        .header-divider {
            width: 1px;
            height: 24px;
            background: var(--tp-border, #ebe9f1);
            flex-shrink: 0;
        }

        .header-topic {
            font-size: 0.9rem;
            color: var(--tp-text-muted, #a8aaae);
            flex: 1;
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            cursor: default;
        }

        .header-topic.editable {
            cursor: pointer;
            transition: color 0.15s;
        }

        .header-topic.editable:hover {
            color: var(--tp-text-secondary, #6f6b7d);
        }

        .topic-edit-row {
            display: flex;
            gap: 8px;
            align-items: center;
            flex: 1;
            min-width: 0;
        }

        .topic-edit-row input {
            flex: 1;
            background: var(--tp-surface, #f4f5fa);
            border: 1px solid var(--tp-border-accent, #7367f0);
            border-radius: 6px;
            padding: 6px 12px;
            color: var(--tp-text-bright, #3a3541);
            font-size: 0.85rem;
            outline: none;
            box-shadow: 0 2px 8px rgba(115, 103, 240, 0.1);
        }

        .dark .topic-edit-row input {
            background: #2f3349;
            color: #fff;
        }

        .topic-edit-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            padding: 4px;
            border-radius: 4px;
            transition: background 0.1s;
            color: #28c76f;
        }

        .topic-edit-btn:hover {
            background: rgba(40, 199, 111, 0.1);
        }

        .header-dm-info {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
        }

        .header-dm-avatar {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.8rem;
            color: #fff;
            position: relative;
            background: #7367f0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header-dm-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--tp-text-bright, #3a3541);
        }

        .dark .header-dm-name {
            color: #fff;
        }

        .header-dm-presence {
            font-size: 0.75rem;
            margin-left: -4px;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-left: auto;
            flex-shrink: 0;
        }

        .header-btn {
            background: none;
            border: none;
            color: var(--tp-text-muted, #a8aaae);
            padding: 8px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1.1rem;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .header-btn:hover {
            background: rgba(75, 70, 92, 0.04);
            color: var(--tp-text-bright, #3a3541);
            transform: translateY(-1px);
        }

        .dark .header-btn:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.05);
        }

        .header-btn.active {
            color: #7367f0;
            background: rgba(115, 103, 240, 0.1);
        }

        /* Pinned dropdown */
        .pinned-dropdown {
            position: absolute;
            top: 60px;
            right: 24px;
            background: var(--tp-base, #ffffff);
            border: none;
            border-radius: 10px;
            padding: 12px;
            min-width: 320px;
            max-height: 400px;
            overflow-y: auto;
            box-shadow: var(--tp-shadow-lg, 0 4px 16px rgba(0, 0, 0, 0.15));
            z-index: 80;
        }

        .dark .pinned-dropdown {
            background: #2f3349;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        }

        .pinned-dropdown-title {
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--tp-text-bright, #3a3541);
            padding: 0 4px 8px;
            border-bottom: 1px solid var(--tp-border-faint, rgba(75, 70, 92, 0.05));
            margin-bottom: 8px;
        }

        .pinned-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 10px;
            border-radius: 8px;
            transition: background 0.15s;
            background: rgba(75, 70, 92, 0.02);
            margin-bottom: 4px;
        }

        .pinned-item:hover {
            background: rgba(75, 70, 92, 0.05);
        }

        .pinned-item-author {
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--tp-text-bright, #3a3541);
        }

        .dark .pinned-item-author {
            color: #fff;
        }

        .pinned-item-text {
            font-size: 0.8rem;
            color: var(--tp-text-secondary, #6f6b7d);
            flex: 1;
            line-height: 1.4;
        }

        .pinned-item-unpin {
            background: none;
            border: none;
            color: var(--tp-text-dim, #a8aaae);
            cursor: pointer;
            font-size: 0.8rem;
            padding: 4px;
            flex-shrink: 0;
            opacity: 0.5;
            transition: all 0.2s;
        }

        .pinned-item-unpin:hover {
            opacity: 1;
            color: #ea5455;
            transform: scale(1.1);
        }

        /* Search bar */
        .search-bar {
            padding: 12px 24px;
            border-bottom: 1px solid var(--tp-border-faint, rgba(75, 70, 92, 0.05));
            display: flex;
            gap: 10px;
            align-items: center;
            background: var(--tp-base, #ffffff);
        }

        .dark .search-bar {
            background: #2f3349;
        }

        .search-bar input {
            flex: 1;
            background: var(--tp-surface, #f4f5fa);
            border: 1px solid var(--tp-border, #ebe9f1);
            border-radius: 8px;
            padding: 8px 14px;
            color: var(--tp-text-bright, #3a3541);
            font-size: 0.9rem;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        .dark .search-bar input {
            background: #161d31;
            border-color: rgba(255, 255, 255, 0.08);
            color: #fff;
        }

        .search-bar input:focus {
            border-color: #7367f0;
            box-shadow: 0 2px 8px rgba(115, 103, 240, 0.15);
        }

        .search-close {
            background: none;
            border: none;
            color: var(--tp-text-muted, #a8aaae);
            cursor: pointer;
            padding: 6px;
            font-size: 1.1rem;
            border-radius: 50%;
            transition: background 0.15s;
        }

        .search-close:hover {
            color: #ea5455;
            background: rgba(234, 84, 85, 0.1);
        }

        /* ===== MESSAGES ===== */
        .messages-container {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column-reverse;
            position: relative;
            transform: translateZ(0);
            -webkit-overflow-scrolling: touch;
        }

        /* Date separator */
        .date-separator {
            display: flex;
            align-items: center;
            padding: 16px 24px 8px;
            position: relative;
            justify-content: center;
        }

        .date-separator::before {
            content: '';
            position: absolute;
            left: 24px;
            right: 24px;
            top: 55%;
            height: 1px;
            background: var(--tp-border, rgba(75, 70, 92, 0.08));
            z-index: 0;
        }

        .date-separator-label {
            position: relative;
            z-index: 1;
            padding: 4px 16px;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--tp-text-muted, #a8aaae);
            background: rgba(165, 163, 174, 0.12);
            /* Pill background */
            border-radius: 50px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 0 0 4px var(--tp-void, #f4f5fa);
            /* masking line */
        }

        .dark .date-separator-label {
            box-shadow: 0 0 0 4px #25293c;
            background: rgba(255, 255, 255, 0.1);
        }

        /* Unread divider */
        .unread-divider {
            display: flex;
            align-items: center;
            padding: 8px 24px;
            margin: 8px 0;
        }

        .unread-divider-line {
            flex: 1;
            height: 1px;
            background: #ea5455;
            opacity: 0.5;
        }

        .unread-divider-text {
            color: #ea5455;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 0 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        /* Message row */
        .message-row {
            display: flex;
            gap: 12px;
            padding: 2px 24px;
            position: relative;
            contain: layout style paint;
            will-change: transform;
            transition: all 0.1s;
        }

        .message-row:hover {
            z-index: 5;
            /* Ensure hover actions show on top */
        }

        .message-row:not(.grouped) {
            padding-top: 14px;
            margin-top: 4px;
        }

        .message-row.highlight {
            background: rgba(115, 103, 240, 0.08);
            animation: highlightFade 2s 1s forwards;
        }

        @keyframes highlightFade {
            to {
                background: transparent;
            }
        }

        /* Own messages - right aligned bubble */
        .message-row.own-message {
            flex-direction: row-reverse;
        }

        .message-row.own-message .msg-body {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }

        .message-row.own-message .msg-header {
            flex-direction: row-reverse;
            justify-content: flex-start;
        }

        /* BUBBLES */
        .msg-text {
            padding: 10px 16px;
            font-size: 0.95rem;
            line-height: 1.5;
            word-wrap: break-word;
            max-width: fit-content;
            position: relative;
        }

        .message-row.own-message .msg-text {
            background: linear-gradient(72.47deg, #7367f0 22.16%, rgba(115, 103, 240, 0.7) 76.47%);
            color: #fff;
            border-radius: 12px 12px 2px 12px;
            box-shadow: 0 4px 14px rgba(115, 103, 240, 0.3);
            text-align: left;
        }

        .message-row.own-message .msg-text a {
            color: #fff;
            text-decoration: underline;
            opacity: 0.9;
        }

        /* Other people messages - subtle bubble */
        .message-row:not(.own-message) .msg-text {
            background: var(--tp-base, #ffffff);
            color: var(--tp-text-primary, #3a3541);
            border-radius: 12px 12px 12px 2px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
            /* Card shadow */
        }

        .dark .message-row:not(.own-message) .msg-text {
            background: #2f3349;
            color: #e2e8f7;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        /* Avatar */
        .msg-avatar,
        .msg-avatar-spacer {
            width: 38px;
            height: 38px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.9rem;
            color: #fff;
            flex-shrink: 0;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .msg-avatar-spacer {
            box-shadow: none;
            background: none;
        }

        /* Message Header */
        .msg-header {
            display: flex;
            align-items: baseline;
            gap: 8px;
            margin-bottom: 4px;
            padding: 0 4px;
        }

        .msg-author {
            font-size: 0.9rem;
            font-weight: 700;
            color: var(--tp-text-bright, #3a3541);
        }

        .dark .msg-author {
            color: #fff;
        }

        .msg-time {
            font-size: 0.7rem;
            color: var(--tp-text-muted, #a8aaae);
        }

        .msg-role {
            font-size: 0.6rem;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            background: rgba(75, 70, 92, 0.08);
            color: var(--tp-text-secondary, #6f6b7d);
            text-transform: uppercase;
        }

        .msg-body {
            flex: 1;
            min-width: 0;
            width: 100%;
        }

        .msg-text a {
            color: #7367f0;
            text-decoration: underline;
        }

        .msg-text pre {
            background: var(--tp-void, #2b2c40);
            border: 1px solid var(--tp-border, #4b4b5a);
            border-radius: 6px;
            padding: 8px 12px;
            margin: 4px 0;
            overflow-x: auto;
            font-size: 0.85rem;
            line-height: 1.4;
            color: #e2e8f7;
        }

        .msg-text code {
            background: rgba(115, 103, 240, 0.1);
            color: #7367f0;
            padding: 2px 4px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-family: 'Public Sans', monospace;
        }

        .msg-text pre code {
            background: none;
            padding: 0;
            border: none;
            color: inherit;
        }

        .msg-text .mention-highlight {
            color: #7367f0;
            font-weight: 600;
            background: rgba(115, 103, 240, 0.1);
            padding: 1px 4px;
            border-radius: 4px;
        }

        .msg-text .blockquote {
            border-left: 3px solid #7367f0;
            padding: 2px 12px;
            margin: 4px 0;
            color: var(--tp-text-muted, #a8aaae);
            font-style: italic;
            background: rgba(115, 103, 240, 0.05);
            border-radius: 0 4px 4px 0;
        }

        /* Files & Attachments */
        .msg-attachment {
            margin-top: 8px;
            max-width: 320px;
        }

        .msg-attachment img {
            max-width: 100%;
            border-radius: 8px;
            cursor: zoom-in;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s;
        }

        .msg-attachment img:hover {
            transform: scale(1.02);
        }

        .msg-file-download {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: var(--tp-base, #ffffff);
            border: 1px solid var(--tp-border, #ebe9f1);
            border-radius: 8px;
            color: var(--tp-text-primary, #3a3541);
            text-decoration: none;
            font-size: 0.85rem;
            margin-top: 4px;
            transition: all 0.15s;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .dark .msg-file-download {
            background: #2f3349;
            color: #fff;
            border-color: rgba(255, 255, 255, 0.08);
        }

        .msg-file-download:hover {
            border-color: #7367f0;
            color: #7367f0;
            transform: translateY(-1px);
        }

        .voice-player {
            margin-top: 2px;
        }

        .voice-player audio {
            width: 100%;
            max-width: 260px;
            height: 28px;
            border-radius: var(--tp-radius-xs, 4px);
        }

        /* HOVER ACTIONS - FIXED */
        .hover-actions {
            position: absolute;
            top: -16px;
            right: 12px;
            display: none;
            /* KEY FIX: HIDDEN BY DEFAULT */
            gap: 2px;
            background: var(--tp-base, #ffffff);
            border: 1px solid var(--tp-border, #ebe9f1);
            border-radius: 50px;
            padding: 4px 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
            z-index: 20;
            animation: fadeIn 0.15s ease-out;
        }

        .dark .hover-actions {
            background: #2f3349;
            border-color: rgba(255, 255, 255, 0.08);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(4px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .message-row:hover .hover-actions {
            display: flex;
            /* TOP RIGHT OF ROW */
        }

        .message-row.own-message .hover-actions {
            right: auto;
            left: 12px;
            /* FLIP FOR OWN MESSAGES */
        }

        .hover-actions button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 6px;
            border-radius: 50%;
            font-size: 1rem;
            color: var(--tp-text-secondary, #6f6b7d);
            transition: all 0.15s cubic-bezier(0.25, 0.8, 0.25, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
        }

        .hover-actions button:hover {
            background: rgba(115, 103, 240, 0.08);
            color: #7367f0;
            transform: scale(1.15);
        }

        .hover-actions .action-sep {
            width: 1px;
            background: var(--tp-border-faint, rgba(75, 70, 92, 0.1));
            margin: 2px 2px;
        }

        /* Reactions */
        .reactions-row {
            display: flex;
            gap: 4px;
            margin-top: 4px;
            flex-wrap: wrap;
            padding-left: 2px;
        }

        .reaction-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            background: var(--tp-base, #ffffff);
            border: 1px solid var(--tp-border, #ebe9f1);
            cursor: pointer;
            transition: all 0.1s;
            color: var(--tp-text-secondary, #6f6b7d);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .dark .reaction-btn {
            background: #2f3349;
            border-color: rgba(255, 255, 255, 0.08);
        }

        .reaction-btn:hover {
            background: rgba(115, 103, 240, 0.05);
            border-color: #7367f0;
            color: #7367f0;
        }

        .reaction-btn.active {
            border-color: #7367f0;
            background: rgba(115, 103, 240, 0.12);
            color: #7367f0;
        }

        .reaction-emoji {
            font-size: 0.75rem;
            line-height: 1;
        }

        .reaction-count {
            font-weight: 700;
            font-size: 0.7rem;
        }

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

        .thread-reply-count:hover {
            color: #60a5fa;
            text-decoration: underline;
        }

        /* Empty state */
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 40px 24px;
            gap: 12px;
        }

        .empty-state-icon {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            background: rgba(115, 103, 240, 0.12);
            color: #7367f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            margin-bottom: 8px;
        }

        .empty-state h3 {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--tp-text-bright, #3a3541);
            margin: 0;
            letter-spacing: -0.01em;
        }

        .dark .empty-state h3 {
            color: #fff;
        }

        .empty-state p {
            font-size: 0.95rem;
            color: var(--tp-text-muted, #a8aaae);
            margin: 0;
            max-width: 500px;
            line-height: 1.6;
        }

        /* ===== MENTION AUTOCOMPLETE ===== */
        .mention-dropdown {
            position: absolute;
            bottom: 100%;
            left: 0;
            right: 0;
            margin-bottom: 8px;
            background: var(--tp-base, #ffffff);
            border: none;
            border-radius: 10px;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
            z-index: 50;
            max-height: 240px;
            overflow-y: auto;
            padding: 6px;
        }

        .dark .mention-dropdown {
            background: #2f3349;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
        }

        .mention-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.08s;
        }

        .mention-item:hover,
        .mention-item.active {
            background: rgba(115, 103, 240, 0.08);
            /* Purple tint */
        }

        .dark .mention-item:hover,
        .dark .mention-item.active {
            background: rgba(115, 103, 240, 0.2);
        }

        .mention-item-avatar {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.7rem;
            color: #fff;
            flex-shrink: 0;
            background: #7367f0;
        }

        .mention-item-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: inherit;
        }

        .mention-item-name {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--tp-text-bright, #3a3541);
        }

        .dark .mention-item-name {
            color: #fff;
        }

        .mention-item-username {
            font-size: 0.8rem;
            color: var(--tp-text-muted, #a8aaae);
            margin-left: 6px;
        }

        .mention-item-role {
            font-size: 0.6rem;
            font-weight: 700;
            padding: 2px 5px;
            border-radius: 4px;
            flex-shrink: 0;
            background: rgba(168, 170, 174, 0.15);
            color: #a8aaae;
        }

        .mention-item-broadcast {
            font-size: 0.72rem;
            color: var(--tp-text-secondary, #9BA8C9);
        }

        /* ===== INPUT AREA ===== */
        .input-area {
            padding: 16px 24px 24px;
            background: var(--tp-base, #ffffff);
            border-top: 1px solid var(--tp-border, #ebe9f1);
            position: relative;
            z-index: 30;
        }

        .dark .input-area {
            background: #2f3349;
            border-color: rgba(255, 255, 255, 0.08);
        }

        /* Typing Indicator */
        .typing-indicator {
            padding: 4px 12px;
            color: var(--tp-text-muted, #a8aaae);
            font-size: 0.75rem;
            font-weight: 600;
            height: 24px;
            display: flex;
            align-items: center;
            gap: 6px;
            opacity: 0;
            transition: opacity 0.2s;
            margin-bottom: 4px;
        }

        .typing-indicator.active {
            opacity: 1;
        }

        .typing-dots {
            display: flex;
            gap: 3px;
        }

        .typing-dot {
            width: 4px;
            height: 4px;
            background: var(--tp-text-muted, #a8aaae);
            border-radius: 50%;
            animation: typingBounce 1.4s infinite ease-in-out both;
        }

        .typing-dot:nth-child(1) {
            animation-delay: -0.32s;
        }

        .typing-dot:nth-child(2) {
            animation-delay: -0.16s;
        }

        @keyframes typingBounce {

            0%,
            60%,
            100% {
                transform: translateY(0);
                opacity: 0.4;
            }

            30% {
                transform: translateY(-3px);
                opacity: 1;
            }
        }

        /* Attachment Preview */
        .attachment-preview {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            margin-bottom: 8px;
            background: rgba(115, 103, 240, 0.08);
            border-radius: 8px;
            border: 1px solid rgba(115, 103, 240, 0.15);
        }

        .attachment-preview-info {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.85rem;
            color: #7367f0;
            font-weight: 500;
        }

        .attachment-preview button {
            background: none;
            border: none;
            color: var(--tp-text-muted, #a8aaae);
            cursor: pointer;
            padding: 4px;
            font-size: 0.9rem;
            border-radius: 4px;
            transition: all 0.15s;
        }

        .attachment-preview button:hover {
            color: #ea5455;
            background: rgba(234, 84, 85, 0.1);
        }

        .input-box {
            background: var(--tp-base, #ffffff);
            border: 1px solid var(--tp-border, #ebe9f1);
            border-radius: 12px;
            padding: 0;
            display: flex;
            flex-direction: column;
            transition: all 0.2s ease;
            position: relative;
            z-index: 20;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
        }

        .dark .input-box {
            background: #25293c;
            border-color: rgba(255, 255, 255, 0.08);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .input-box:focus-within {
            border-color: #7367f0;
            box-shadow: 0 4px 12px rgba(115, 103, 240, 0.15);
            transform: translateY(-1px);
        }

        .input-box textarea {
            width: 100%;
            background: transparent;
            border: none;
            padding: 12px 16px;
            font-size: 0.95rem;
            color: var(--tp-text-bright, #3a3541);
            outline: none;
            resize: none;
            min-height: 48px;
            max-height: 160px;
            font-family: inherit;
            line-height: 1.5;
        }

        .dark .input-box textarea {
            color: #e2e8f7;
        }

        .input-box textarea::placeholder {
            color: var(--tp-text-muted, #a8aaae);
        }

        .input-bottom-bar {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            border-top: 1px solid var(--tp-border-faint, rgba(75, 70, 92, 0.05));
            justify-content: space-between;
        }

        .dark .input-bottom-bar {
            border-color: rgba(255, 255, 255, 0.05);
        }

        .format-group {
            display: flex;
            gap: 2px;
        }

        .fmt-btn {
            background: none;
            border: none;
            color: var(--tp-text-muted, #a8aaae);
            padding: 6px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .fmt-btn:hover {
            background: rgba(75, 70, 92, 0.05);
            color: var(--tp-text-primary, #3a3541);
        }

        .dark .fmt-btn:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
        }

        .input-sep {
            width: 1px;
            height: 20px;
            background: var(--tp-border-faint, rgba(75, 70, 92, 0.1));
            margin: 0 6px;
        }

        .action-group {
            display: flex;
            gap: 2px;
        }

        .act-btn {
            background: none;
            border: none;
            color: var(--tp-text-muted, #a8aaae);
            padding: 6px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1.1rem;
            transition: all 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .act-btn:hover {
            background: rgba(75, 70, 92, 0.05);
            color: #7367f0;
            transform: scale(1.1);
        }

        .dark .act-btn:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        label.act-btn {
            cursor: pointer;
        }

        .send-btn {
            background: var(--tp-surface, #f4f5fa);
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            color: var(--tp-text-muted, #a8aaae);
            cursor: not-allowed;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
            font-weight: 600;
            margin-left: 8px;
        }

        .dark .send-btn {
            background: #25293c;
        }

        .send-btn.has-content {
            background: linear-gradient(72.47deg, #7367f0 22.16%, rgba(115, 103, 240, 0.7) 76.47%);
            color: #fff;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(115, 103, 240, 0.4);
            transform: translateY(0);
        }

        .send-btn.has-content:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(115, 103, 240, 0.5);
        }

        .send-btn i {
            font-size: 0.85rem;
        }

        /* Pickers */
        .emoji-picker {
            position: absolute;
            bottom: 100%;
            left: 0;
            margin-bottom: 12px;
            background: var(--tp-base, #ffffff);
            border: none;
            border-radius: 12px;
            padding: 12px;
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
            z-index: 100;
            animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .dark .emoji-picker {
            background: #2f3349;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
        }

        @keyframes popIn {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(10px);
            }

            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        .emoji-picker button {
            background: none;
            border: none;
            font-size: 1.4rem;
            padding: 6px;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.1s;
        }

        .emoji-picker button:hover {
            background: rgba(115, 103, 240, 0.08);
            transform: scale(1.2);
        }

        .dark .emoji-picker button:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .gif-picker {
            position: absolute;
            bottom: 100%;
            left: 40px;
            margin-bottom: 12px;
            background: var(--tp-base, #ffffff);
            border: none;
            border-radius: 12px;
            padding: 12px;
            width: 320px;
            max-height: 400px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
            z-index: 100;
            display: flex;
            flex-direction: column;
            gap: 12px;
            animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .dark .gif-picker {
            background: #2f3349;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
        }

        .gif-picker-search {
            background: var(--tp-surface, #f4f5fa);
            border: 1px solid var(--tp-border, #ebe9f1);
            border-radius: 8px;
            padding: 10px 14px;
            color: var(--tp-text-bright, #3a3541);
            font-size: 0.9rem;
            outline: none;
            transition: all 0.2s;
        }

        .dark .gif-picker-search {
            background: #161d31;
            border-color: rgba(255, 255, 255, 0.08);
            color: #fff;
        }

        .gif-picker-search:focus {
            border-color: #7367f0;
            box-shadow: 0 2px 8px rgba(115, 103, 240, 0.15);
        }

        .gif-picker-results {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            overflow-y: auto;
            max-height: 300px;
            padding-right: 4px;
        }

        .gif-picker-results img {
            width: 100%;
            height: 100px;
            object-fit: cover;
            border-radius: 6px;
            cursor: pointer;
            transition: transform 0.15s;
        }

        .gif-picker-results img:hover {
            transform: scale(1.05);
            z-index: 2;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        /* Voice recording */
        .voice-recording-indicator {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 16px;
            background: rgba(234, 84, 85, 0.08);
            border: 1px solid rgba(234, 84, 85, 0.2);
            border-radius: 8px;
            margin-bottom: 12px;
            width: fit-content;
        }

        .recording-dot {
            width: 10px;
            height: 10px;
            background: #ea5455;
            border-radius: 50%;
            animation: pulseRed 1.5s infinite;
        }

        @keyframes pulseRed {
            0% {
                box-shadow: 0 0 0 0 rgba(234, 84, 85, 0.4);
            }

            70% {
                box-shadow: 0 0 0 6px rgba(234, 84, 85, 0);
            }

            100% {
                box-shadow: 0 0 0 0 rgba(234, 84, 85, 0);
            }
        }

        .recording-time {
            color: #ea5455;
            font-weight: 700;
            font-family: monospace;
            font-size: 0.95rem;
        }

        .voice-recording-indicator button {
            margin-left: auto;
            background: none;
            border: none;
            color: var(--tp-text-muted, #a8aaae);
            cursor: pointer;
            padding: 4px 6px;
            border-radius: 4px;
            font-size: 0.9rem;
            transition: all 0.15s;
        }

        .voice-recording-indicator button:hover {
            background: rgba(234, 84, 85, 0.1);
            color: #ea5455;
        }

        /* Drag & Drop */
        .messages-container.drag-over {
            outline: 2px dashed #7367f0;
            outline-offset: -4px;
            background: rgba(115, 103, 240, 0.02);
        }

        .drop-zone-overlay {
            position: absolute;
            inset: 0;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(2px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 50;
            pointer-events: none;
            flex-direction: column;
            gap: 16px;
            color: #7367f0;
            font-weight: 600;
        }

        .dark .drop-zone-overlay {
            background: rgba(47, 51, 73, 0.8);
        }

        .drop-zone-content {
            padding: 32px;
            background: var(--tp-base, #ffffff);
            border: 2px dashed #7367f0;
            border-radius: 16px;
            color: #7367f0;
            font-weight: 600;
            font-size: 1.1rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .dark .drop-zone-content {
            background: #2f3349;
            color: #fff;
            border-color: #7367f0;
        }

        /* ===== THREAD PANEL ===== */
        .chat-thread-panel {
            width: 360px;
            background: var(--tp-base, #ffffff);
            border-left: 1px solid var(--tp-border, #ebe9f1);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            z-index: 25;
            box-shadow: -4px 0 16px rgba(0, 0, 0, 0.05);
        }

        .dark .chat-thread-panel {
            background: #2f3349;
            border-color: rgba(255, 255, 255, 0.08);
        }

        .thread-header {
            height: 56px;
            padding: 0 20px;
            border-bottom: 1px solid var(--tp-border, #ebe9f1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--tp-surface, #f8f7fa);
        }

        .dark .thread-header {
            background: #25293c;
            border-color: rgba(255, 255, 255, 0.08);
        }

        .thread-header h3 {
            font-size: 1rem;
            font-weight: 700;
            color: var(--tp-text-bright, #3a3541);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .dark .thread-header h3 {
            color: #fff;
        }

        .thread-close {
            background: none;
            border: none;
            color: var(--tp-text-muted, #a8aaae);
            cursor: pointer;
            font-size: 1.1rem;
            padding: 6px;
            border-radius: 50%;
            transition: all 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .thread-close:hover {
            background: rgba(75, 70, 92, 0.05);
            color: #ea5455;
            transform: rotate(90deg);
        }

        .dark .thread-close:hover {
            background: rgba(255, 255, 255, 0.05);
        }

        .thread-parent {
            padding: 16px 20px;
            border-bottom: 1px solid var(--tp-border-faint, rgba(75, 70, 92, 0.05));
            background: var(--tp-base, #ffffff);
        }

        .dark .thread-parent {
            background: #2f3349;
            border-color: rgba(255, 255, 255, 0.05);
        }

        .thread-parent .msg-header {
            margin-bottom: 6px;
            font-size: 0.85rem;
        }

        .thread-parent .msg-text {
            font-size: 0.9rem;
            color: var(--tp-text-primary, #3a3541);
            line-height: 1.5;
            background: var(--tp-surface, #f8f7fa);
            padding: 10px 14px;
            border-radius: 8px;
            border-left: 3px solid #7367f0;
        }

        .dark .thread-parent .msg-text {
            color: #e2e8f7;
            background: #25293c;
        }

        .thread-parent-img {
            max-width: 100%;
            border-radius: 8px;
            margin-bottom: 8px;
            border: 1px solid var(--tp-border, #ebe9f1);
        }

        .thread-replies-divider {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 20px 8px;
        }

        .thread-replies-divider span {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--tp-text-muted, #a8aaae);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .thread-replies-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--tp-border-faint, rgba(75, 70, 92, 0.1));
        }

        .dark .thread-replies-divider::after {
            background: rgba(255, 255, 255, 0.08);
        }

        .thread-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: var(--tp-base, #ffffff);
            scroll-behavior: smooth;
        }

        .dark .thread-messages {
            background: #2f3349;
        }

        .thread-reply {
            display: flex;
            gap: 12px;
            animation: fadeIn 0.3s ease-out;
            padding: 4px 8px;
            border-radius: 8px;
            transition: background 0.15s;
        }

        .thread-reply:hover {
            background: rgba(75, 70, 92, 0.03);
        }

        .dark .thread-reply:hover {
            background: rgba(255, 255, 255, 0.04);
        }

        .thread-reply-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.8rem;
            color: #fff;
            flex-shrink: 0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .thread-reply-body {
            flex: 1;
            min-width: 0;
        }

        .thread-reply-meta {
            display: flex;
            align-items: baseline;
            gap: 8px;
            margin-bottom: 4px;
        }

        .thread-reply-author {
            font-size: 0.9rem;
            font-weight: 700;
            color: var(--tp-text-bright, #3a3541);
        }

        .dark .thread-reply-author {
            color: #fff;
        }

        .thread-reply-time {
            font-size: 0.75rem;
            color: var(--tp-text-muted, #a8aaae);
        }

        .thread-reply-text {
            font-size: 0.95rem;
            color: var(--tp-text-primary, #3a3541);
            line-height: 1.5;
            word-wrap: break-word;
        }

        .dark .thread-reply-text {
            color: #e2e8f7;
        }

        .thread-empty {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--tp-text-muted, #a8aaae);
            font-size: 0.95rem;
            padding: 32px;
            text-align: center;
            flex-direction: column;
            gap: 12px;
            opacity: 0.7;
        }

        .thread-input {
            padding: 16px 24px;
            border-top: 1px solid var(--tp-border, #ebe9f1);
            background: var(--tp-surface, #f8f7fa);
        }

        .dark .thread-input {
            border-color: rgba(255, 255, 255, 0.08);
            background: #25293c;
        }

        .thread-input form {
            display: flex;
            gap: 12px;
            position: relative;
        }

        .thread-input input {
            flex: 1;
            background: var(--tp-base, #ffffff);
            border: 1px solid var(--tp-border, #ebe9f1);
            border-radius: 8px;
            padding: 10px 14px;
            color: var(--tp-text-bright, #3a3541);
            font-size: 0.95rem;
            outline: none;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }

        .dark .thread-input input {
            background: #161d31;
            border-color: rgba(255, 255, 255, 0.08);
            color: #fff;
        }

        .thread-input input:focus {
            border-color: #7367f0;
            box-shadow: 0 4px 12px rgba(115, 103, 240, 0.15);
        }

        .thread-input input::placeholder {
            color: var(--tp-text-muted, #a8aaae);
        }

        .thread-input button {
            background: #7367f0;
            border: none;
            color: #fff;
            padding: 0 20px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
            box-shadow: 0 2px 8px rgba(115, 103, 240, 0.3);
        }

        .thread-input button:hover {
            background: #685dd8;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(115, 103, 240, 0.4);
        }

        /* ===== SCROLLBARS ===== */
        .messages-container::-webkit-scrollbar,
        .sidebar-content::-webkit-scrollbar,
        .thread-messages::-webkit-scrollbar,
        .gif-picker-results::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        .messages-container::-webkit-scrollbar-track,
        .sidebar-content::-webkit-scrollbar-track,
        .thread-messages::-webkit-scrollbar-track,
        .gif-picker-results::-webkit-scrollbar-track {
            background: transparent;
        }

        .messages-container::-webkit-scrollbar-thumb,
        .sidebar-content::-webkit-scrollbar-thumb,
        .thread-messages::-webkit-scrollbar-thumb,
        .gif-picker-results::-webkit-scrollbar-thumb {
            background: rgba(75, 70, 92, 0.15);
            border-radius: 10px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover,
        .sidebar-content::-webkit-scrollbar-thumb:hover,
        .thread-messages::-webkit-scrollbar-thumb:hover,
        .gif-picker-results::-webkit-scrollbar-thumb:hover {
            background: rgba(75, 70, 92, 0.3);
        }

        .dark .messages-container::-webkit-scrollbar-thumb,
        .dark .sidebar-content::-webkit-scrollbar-thumb,
        .dark .thread-messages::-webkit-scrollbar-thumb,
        .dark .gif-picker-results::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15);
        }

        .dark .messages-container::-webkit-scrollbar-thumb:hover,
        .dark .sidebar-content::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.25);
        }

        /* ===== REAL AVATARS ===== */
        .avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: inherit;
            display: block;
        }

        /* ===== MESSAGE ANIMATIONS ===== */
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(8px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes glowOnce {
            0% {
                background: rgba(115, 103, 240, 0.08);
            }

            100% {
                background: transparent;
            }
        }

        .message-row[data-new] {
            animation: slideInUp 0.15s ease-out both;
        }

        /* ===== REACTION BOUNCE ===== */
        @keyframes reactionBounce {
            0% {
                transform: scale(1);
            }

            30% {
                transform: scale(1.25);
            }

            60% {
                transform: scale(0.95);
            }

            100% {
                transform: scale(1);
            }
        }

        .reaction-btn.just-reacted {
            animation: reactionBounce 0.3s ease-out;
        }

        /* ===== IMAGE LIGHTBOX ===== */
        .lightbox-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: zoom-out;
        }

        .lightbox-overlay img {
            max-width: 90vw;
            max-height: 90vh;
            object-fit: contain;
            border-radius: var(--tp-radius-sm, 8px);
            cursor: default;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .lightbox-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #fff;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            font-size: 1.2rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.15s;
        }

        .lightbox-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        /* ===== DRAFT INDICATOR ===== */
        .draft-indicator {
            font-size: 0.6rem;
            color: var(--tp-text-dim, #3D4A66);
            margin-left: auto;
            font-style: italic;
        }

        /* ===== INFINITE SCROLL ===== */
        .load-more-trigger {
            display: flex;
            justify-content: center;
            padding: 12px;
        }

        .load-more-btn {
            background: var(--tp-surface, #122148);
            border: 1px solid var(--tp-border, rgba(255, 255, 255, 0.08));
            color: var(--tp-text-secondary, #9BA8C9);
            padding: 6px 16px;
            border-radius: var(--tp-radius-xs, 4px);
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.15s;
        }

        .load-more-btn:hover {
            background: var(--tp-elevated, #182c5a);
            color: var(--tp-text-bright, #fff);
        }

        /* ===== OG PREVIEW ===== */
        .og-preview {
            margin-top: 6px;
            border-left: 3px solid var(--tp-accent, #FC4100);
            padding: 8px 12px;
            background: var(--tp-void, #04080f);
            border-radius: 0 6px 6px 0;
            max-width: 400px;
            display: flex;
            gap: 10px;
        }

        .og-preview-text {
            flex: 1;
            min-width: 0;
        }

        .og-preview-site {
            font-size: 0.65rem;
            color: var(--tp-text-muted, #5F6E8C);
            text-transform: uppercase;
            letter-spacing: 0.03em;
            font-weight: 600;
        }

        .og-preview-title {
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--tp-blue, #3B82F6);
            text-decoration: none;
            display: block;
            margin: 2px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .og-preview-title:hover {
            text-decoration: underline;
        }

        .og-preview-desc {
            font-size: 0.72rem;
            color: var(--tp-text-secondary, #9BA8C9);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            line-height: 1.35;
        }

        .og-preview-img {
            width: 70px;
            height: 70px;
            border-radius: var(--tp-radius-xs, 4px);
            object-fit: cover;
            flex-shrink: 0;
        }

        /* ===== CUSTOM STATUS ===== */
        .custom-status-emoji {
            font-size: 0.7rem;
        }

        .custom-status-text {
            font-size: 0.68rem;
            color: var(--tp-text-muted, #5F6E8C);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
        }

        .status-picker {
            position: absolute;
            top: 100%;
            left: 0;
            margin-top: 4px;
            background: var(--tp-base, #0e1a3a);
            border: 1px solid var(--tp-border-strong, rgba(255, 255, 255, 0.12));
            border-radius: var(--tp-radius-sm, 8px);
            padding: 10px;
            min-width: 260px;
            box-shadow: var(--tp-shadow-md, 0 8px 30px rgba(0, 0, 0, 0.5));
            z-index: 100;
        }

        .status-emoji-grid {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 2px;
            margin-bottom: 8px;
        }

        .status-emoji-grid button {
            background: none;
            border: none;
            font-size: 1rem;
            padding: 4px;
            border-radius: 4px;
            cursor: pointer;
        }

        .status-emoji-grid button:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        .status-picker input {
            width: 100%;
            background: var(--tp-surface, #122148);
            border: 1px solid var(--tp-border, rgba(255, 255, 255, 0.08));
            border-radius: var(--tp-radius-xs, 4px);
            padding: 6px 10px;
            color: var(--tp-text-bright, #fff);
            font-size: 0.78rem;
            outline: none;
            margin-bottom: 8px;
        }

        .status-picker input::placeholder {
            color: var(--tp-text-dim, #3D4A66);
        }

        .status-duration-row {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
        }

        .status-duration-btn {
            background: var(--tp-surface, #122148);
            border: 1px solid var(--tp-border, rgba(255, 255, 255, 0.08));
            color: var(--tp-text-secondary, #9BA8C9);
            padding: 3px 8px;
            border-radius: var(--tp-radius-xs, 4px);
            font-size: 0.68rem;
            cursor: pointer;
            transition: all 0.1s;
        }

        .status-duration-btn:hover {
            background: var(--tp-elevated, #182c5a);
            color: var(--tp-text-bright, #fff);
        }

        /* ===== HOVERCARD ===== */
        .hovercard {
            position: fixed;
            z-index: 200;
            width: 280px;
            background: var(--tp-base, #0e1a3a);
            border: 1px solid var(--tp-border-strong, rgba(255, 255, 255, 0.12));
            border-radius: 10px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
            padding: 16px;
            pointer-events: none;
        }

        .hovercard-avatar {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.1rem;
            color: #fff;
        }

        .hovercard-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: inherit;
        }

        .hovercard-name {
            font-size: 1rem;
            font-weight: 800;
            color: var(--tp-text-bright, #fff);
        }

        .hovercard-role {
            font-size: 0.65rem;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 3px;
            display: inline-block;
        }

        .hovercard-meta {
            font-size: 0.72rem;
            color: var(--tp-text-muted, #5F6E8C);
            margin-top: 6px;
        }

        /* ===== AWAY WARNING ===== */
        .away-warning {
            padding: 6px 12px;
            background: rgba(252, 165, 0, 0.08);
            border: 1px solid rgba(252, 165, 0, 0.15);
            border-radius: 6px;
            color: #fca500;
            font-size: 0.75rem;
            margin: 0 0 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        /* ===== MOBILE MENU BUTTON (hidden on desktop) ===== */
        .mobile-menu-btn {
            display: none;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            color: var(--tp-text-secondary, #9BA8C9);
            font-size: 1.2rem;
            cursor: pointer;
            padding: 4px 6px;
            border-radius: 4px;
            flex-shrink: 0;
        }

        .mobile-menu-btn:hover {
            background: var(--tp-surface, #122148);
        }

        /* ===== MOBILE RESPONSIVE (max-width: 900px) ===== */
        @media (max-width: 900px) {
            .chat-wrapper {
                height: calc(100vh - 110px);
                max-height: none;
                border-radius: 0;
                width: 100%;
                max-width: 100%;
                margin: 0;
                border: none;
            }

            .chat-sidebar {
                position: absolute;
                z-index: 50;
                width: 280px;
                height: 100%;
                left: 0;
                top: 0;
                transform: translateX(-100%);
                transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                box-shadow: 4px 0 24px rgba(0, 0, 0, 0.2);
            }

            .chat-sidebar.active {
                transform: translateX(0);
            }

            .chat-main {
                width: 100%;
                flex: 1;
            }

            .mobile-menu-btn {
                display: flex;
            }

            .chat-header {
                padding: 0 16px;
                height: 60px;
            }

            .header-topic,
            .header-divider {
                display: none;
            }

            .chat-thread-panel {
                position: absolute;
                right: 0;
                top: 0;
                height: 100%;
                width: 100%;
                max-width: 320px;
                transform: translateX(100%);
                transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                box-shadow: -4px 0 24px rgba(0, 0, 0, 0.2);
            }

            .chat-thread-panel.active {
                transform: translateX(0);
            }

            .messages-container {
                padding: 16px;
            }

            .message-row {
                padding: 2px 0;
            }

            .msg-actions {
                opacity: 1;
                display: flex;
            }

            .hover-actions {
                display: flex;
                opacity: 1;
                top: -12px;
                right: 0;
                transform: scale(0.9);
            }
        }

        /* ===== SMALL PHONES (max-width: 480px) ===== */
        @media (max-width: 480px) {
            .chat-wrapper {
                height: calc(100vh - 70px);
            }

            .chat-header {
                padding: 0 12px;
                height: 54px;
            }

            .header-channel-name {
                font-size: 0.9rem;
                max-width: 120px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .header-btn {
                width: 32px;
                height: 32px;
                padding: 6px;
            }

            .message-row {
                gap: 10px;
            }

            .msg-avatar,
            .msg-avatar-spacer {
                width: 32px;
                height: 32px;
            }

            .msg-content {
                max-width: 100%;
            }

            .msg-text {
                font-size: 0.9rem;
                padding: 10px 14px;
            }

            .input-area {
                padding: 12px;
            }

            .input-box {
                padding: 8px 12px;
            }

            .input-box textarea {
                max-height: 100px;
            }

            .emoji-picker,
            .gif-picker,
            .pinned-dropdown {
                width: calc(100vw - 24px);
                left: 12px;
                right: 12px;
                max-width: none;
            }

            .gif-picker {
                left: 12px !important;
            }

            .emoji-picker {
                grid-template-columns: repeat(6, 1fr);
            }

            .thread-header h3 {
                font-size: 0.9rem;
            }
        }

        /* Mobile Tab Bar */
        .mobile-tab-bar {
            display: none;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: var(--tp-base, #ffffff);
            border-top: 1px solid var(--tp-border, #ebe9f1);
            z-index: 1000;
            padding: 0 16px;
            justify-content: space-around;
            align-items: center;
            box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.05);
        }

        .dark .mobile-tab-bar {
            background: #25293c;
            border-color: rgba(255, 255, 255, 0.08);
        }

        @media (max-width: 768px) {
            .mobile-tab-bar {
                display: flex;
            }

            .chat-wrapper {
                padding-bottom: 60px;
            }
        }

        .mobile-tab-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            color: var(--tp-text-muted, #a8aaae);
            font-size: 0.7rem;
            font-weight: 500;
            background: none;
            border: none;
            cursor: pointer;
            transition: color 0.15s;
        }

        .mobile-tab-item.active {
            color: #7367f0;
        }

        .mobile-tab-item svg {
            width: 20px;
            height: 20px;
        }
    </style>

    <div class="chat-wrapper" wire:poll.3s @touchstart="handleTouchStart($event)" @touchmove="handleTouchMove($event)"
        x-data="{
            sidebarOpen: window.innerWidth > 768,
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
                                <input type="text" wire:model="topicContent" placeholder="Add a topic..." autofocus
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
                </div>
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
                            rows="1" @keydown="handleMentionKeydown($event)"
                            @keydown.enter="if ($event.shiftKey) return; $event.preventDefault(); if (!mentionJustSelected && !showMentions) { clearDraft('{{ $draftKey }}'); $wire.sendMessage(); }"
                            @paste="handlePaste($event)" @input="checkMention($event)"
                            @input.debounce.1000ms="saveDraft('{{ $draftKey }}', $event.target.value)"
                            autocomplete="off"></textarea>

                        <div class="input-bottom-bar">
                            <div class="format-group">
                                <button type="button" @click="wrapSelection('**', '**')" class="fmt-btn"
                                    title="Bold"><strong>B</strong></button>
                                <button type="button" @click="wrapSelection('*', '*')" class="fmt-btn"
                                    title="Italic"><em>I</em></button>
                                <button type="button" @click="wrapSelection('~~', '~~')" class="fmt-btn"
                                    title="Strikethrough"><del>S</del></button>
                                <button type="button" @click="wrapSelection('`', '`')" class="fmt-btn"
                                    title="Inline code" style="font-family: monospace;">&lt;/&gt;</button>
                                <button type="button" @click="wrapSelection('```\n', '\n```')" class="fmt-btn"
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