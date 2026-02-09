<x-filament-panels::page>
    <style>
        .chat-wrapper {
            display: flex;
            height: 75vh;
            background: rgba(30, 30, 40, 0.95);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .chat-sidebar {
            width: 280px;
            background: rgba(17, 24, 39, 0.98);
            border-right: 1px solid rgba(255, 255, 255, 0.06);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        }

        .chat-sidebar-header {
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            font-weight: 700;
            font-size: 1rem;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(252, 65, 0, 0.05);
        }

        .chat-sidebar-header span {
            color: #FC4100;
        }

        .chat-sidebar-content {
            flex: 1;
            overflow-y: auto;
            padding: 16px 0;
        }

        .sidebar-section-title {
            padding: 8px 24px;
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: rgba(255, 255, 255, 0.4);
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .sidebar-section-title a {
            color: rgba(255, 255, 255, 0.5);
            text-decoration: none;
            transition: color 0.2s;
        }

        .sidebar-section-title a:hover {
            color: #FC4100;
        }

        .channel-item,
        .dm-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 24px;
            cursor: pointer;
            transition: all 0.15s;
            color: rgba(255, 255, 255, 0.6);
            border-left: 3px solid transparent;
        }

        .channel-item:hover,
        .dm-item:hover {
            background: rgba(255, 255, 255, 0.03);
            color: #fff;
        }

        .channel-item.active,
        .dm-item.active {
            background: rgba(252, 65, 0, 0.1);
            color: #FC4100;
            border-left-color: #FC4100;
        }

        .channel-icon { font-size: 1.2rem; }
        .channel-name { font-size: 0.875rem; font-weight: 500; flex: 1; }
        .channel-lock { font-size: 0.7rem; opacity: 0.5; }

        .dm-avatar {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.75rem;
            color: #fff;
            position: relative;
        }

        .dm-status {
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            border: 2px solid #111827;
        }

        .dm-status.online { background: #22c55e; }
        .dm-status.away { background: #eab308; }
        .dm-status.busy { background: #ef4444; }
        .dm-status.offline { background: #6b7280; }

        .dm-info { flex: 1; min-width: 0; }
        .dm-name { font-size: 0.875rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .dm-role {
            font-size: 0.6rem;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 3px;
            display: inline-block;
        }

        .unread-badge {
            background: #ef4444;
            color: #fff;
            font-size: 0.65rem;
            padding: 2px 6px;
            border-radius: 10px;
            font-weight: 700;
        }

        .chat-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            background: rgba(15, 23, 42, 0.5);
        }

        .chat-header {
            padding: 12px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            display: flex;
            align-items: center;
            gap: 16px;
            background: rgba(17, 24, 39, 0.8);
        }

        .chat-header-icon {
            width: 42px;
            height: 42px;
            border-radius: 10px;
            background: rgba(252, 65, 0, 0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            flex-shrink: 0;
        }

        .chat-header-info { flex: 1; min-width: 0; }
        .chat-header-info h2 { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0; }
        .chat-header-info p { font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); margin: 4px 0 0; cursor: default; }
        .chat-header-info p.editable-topic { cursor: pointer; }
        .chat-header-info p.editable-topic:hover { color: rgba(255, 255, 255, 0.7); }

        .chat-header-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .chat-header-btn {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: rgba(255, 255, 255, 0.5);
            padding: 6px 10px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.15s;
        }
        .chat-header-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
        .chat-header-btn.active { background: rgba(252, 65, 0, 0.15); color: #FC4100; border-color: rgba(252, 65, 0, 0.3); }

        .pinned-bar {
            padding: 10px 24px;
            background: rgba(251, 191, 36, 0.08);
            border-bottom: 1px solid rgba(251, 191, 36, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .pinned-bar-icon { font-size: 1.1rem; }

        .pinned-messages-scroll {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            flex: 1;
        }

        .pinned-message {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 0.75rem;
            min-width: 180px;
            display: flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(251, 191, 36, 0.2);
        }

        .pinned-message strong { color: #fbbf24; }
        .pinned-message span { color: rgba(255, 255, 255, 0.6); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pinned-message button { background: none; border: none; color: rgba(255, 255, 255, 0.4); cursor: pointer; padding: 0; }
        .pinned-message button:hover { color: #ef4444; }

        /* Search bar */
        .search-bar {
            padding: 8px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            display: flex;
            gap: 8px;
            align-items: center;
            background: rgba(17, 24, 39, 0.6);
        }
        .search-bar input {
            flex: 1;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 8px 12px;
            color: #fff;
            font-size: 0.8rem;
            outline: none;
        }
        .search-bar input::placeholder { color: rgba(255, 255, 255, 0.3); }
        .search-bar input:focus { border-color: rgba(252, 65, 0, 0.4); }
        .search-bar button { background: none; border: none; color: rgba(255, 255, 255, 0.4); cursor: pointer; padding: 4px; font-size: 1rem; }
        .search-bar button:hover { color: #fff; }

        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column-reverse;
            gap: 10px;
            position: relative;
        }

        .message-row { display: flex; gap: 10px; max-width: 100%; }
        .message-row.from-me { flex-direction: row-reverse; }

        .message-avatar {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.7rem;
            color: #fff;
            flex-shrink: 0;
        }

        .message-content { max-width: 65%; display: flex; flex-direction: column; }
        .message-row.from-me .message-content { align-items: flex-end; }
        .message-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; font-size: 0.7rem; }
        .message-row.from-me .message-meta { flex-direction: row-reverse; }
        .message-author { font-weight: 700; color: #fff; }
        .message-role { padding: 2px 6px; border-radius: 4px; font-size: 0.6rem; font-weight: 600; }
        .message-time { color: rgba(255, 255, 255, 0.35); }

        .message-bubble {
            padding: 8px 12px;
            border-radius: 12px;
            font-size: 0.82rem;
            line-height: 1.4;
            word-wrap: break-word;
            position: relative;
        }

        .message-bubble.from-me {
            background: linear-gradient(135deg, #FC4100 0%, #d93800 100%);
            color: #fff;
            border-bottom-right-radius: 4px;
        }

        .message-bubble.from-other {
            background: rgba(255, 255, 255, 0.08);
            color: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-bottom-left-radius: 4px;
        }

        .message-attachment { margin-bottom: 10px; }
        .message-attachment img { max-width: 100%; max-height: 200px; border-radius: 10px; }
        .message-attachment a { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(0, 0, 0, 0.2); border-radius: 8px; color: inherit; text-decoration: underline; }

        .voice-player audio { width: 100%; max-width: 280px; height: 36px; border-radius: 8px; }

        .reactions-row { display: flex; gap: 6px; margin-top: 8px; }

        .reaction-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: all 0.15s;
        }
        .reaction-btn:hover { background: rgba(255, 255, 255, 0.15); }
        .reaction-btn.active { border-color: #3b82f6; background: rgba(59, 130, 246, 0.15); }
        .reaction-emoji { font-size: 0.85rem; }
        .reaction-count { color: rgba(255, 255, 255, 0.7); font-weight: 600; }

        .hover-actions {
            position: absolute;
            top: -12px;
            display: none;
            gap: 4px;
            background: #1f2937;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 4px 6px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
        .message-bubble:hover .hover-actions { display: flex; }
        .message-bubble.from-me .hover-actions { right: 100%; margin-right: 8px; }
        .message-bubble.from-other .hover-actions { left: 100%; margin-left: 8px; }
        .hover-actions button { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; font-size: 0.9rem; transition: background 0.15s; color: rgba(255,255,255,0.7); }
        .hover-actions button:hover { background: rgba(255, 255, 255, 0.1); }

        .thread-reply-count {
            background: none;
            border: none;
            color: #3b82f6;
            font-size: 0.72rem;
            font-weight: 600;
            cursor: pointer;
            padding: 4px 0;
            margin-top: 4px;
            transition: color 0.15s;
        }
        .thread-reply-count:hover { color: #60a5fa; text-decoration: underline; }

        .edited-indicator { font-size: 0.65rem; color: rgba(255, 255, 255, 0.3); margin-top: 2px; }

        /* Unread divider */
        .unread-divider { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
        .unread-divider-line { flex: 1; height: 1px; background: #ef4444; }
        .unread-divider span { color: #ef4444; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }

        .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.3); text-align: center; }
        .empty-state-icon { font-size: 4rem; margin-bottom: 16px; opacity: 0.3; }
        .empty-state h3 { font-size: 1.25rem; margin: 0 0 8px; color: rgba(255, 255, 255, 0.4); }
        .empty-state p { font-size: 0.875rem; color: rgba(255, 255, 255, 0.3); }

        /* Typing indicator */
        .typing-indicator {
            padding: 6px 24px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.5);
            min-height: 28px;
        }
        .typing-dots { display: inline-flex; gap: 3px; }
        .typing-dots span {
            width: 5px; height: 5px; border-radius: 50%; background: rgba(255, 255, 255, 0.4);
            animation: typingBounce 1.2s infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-4px); opacity: 1; }
        }

        .input-area {
            padding: 12px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(17, 24, 39, 0.8);
        }

        .attachment-preview {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            margin-bottom: 10px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 10px;
            border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .attachment-preview-info { display: flex; align-items: center; gap: 10px; }
        .attachment-preview-icon { font-size: 1.2rem; }
        .attachment-preview-name { font-size: 0.875rem; color: #60a5fa; font-weight: 500; }
        .attachment-preview button { background: none; border: none; color: rgba(255, 255, 255, 0.5); cursor: pointer; padding: 4px; }
        .attachment-preview button:hover { color: #ef4444; }

        .input-box {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-box:focus-within { border-color: rgba(252, 65, 0, 0.5); box-shadow: 0 0 0 3px rgba(252, 65, 0, 0.1); }

        .formatting-toolbar {
            display: flex;
            gap: 2px;
            padding: 6px 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .format-btn {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.35);
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.15s;
        }
        .format-btn:hover { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.8); }

        .input-box textarea {
            width: 100%;
            background: transparent;
            border: none;
            padding: 10px 16px;
            font-size: 0.9rem;
            color: #fff;
            outline: none;
            resize: none;
            min-height: 40px;
            max-height: 120px;
            font-family: inherit;
            line-height: 1.4;
        }
        .input-box textarea::placeholder { color: rgba(255, 255, 255, 0.35); }

        .input-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .input-actions { display: flex; gap: 4px; }

        .input-action-btn {
            background: none;
            border: none;
            padding: 6px 8px;
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.4);
            cursor: pointer;
            transition: all 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.85rem;
        }
        .input-action-btn:hover { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.8); }

        .send-btn {
            background: linear-gradient(135deg, #FC4100 0%, #d93800 100%);
            border: none;
            padding: 6px 16px;
            border-radius: 8px;
            color: #fff;
            font-weight: 600;
            font-size: 0.8rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: transform 0.1s, box-shadow 0.2s;
            box-shadow: 0 4px 15px rgba(252, 65, 0, 0.3);
        }
        .send-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(252, 65, 0, 0.4); }
        .send-btn:active { transform: scale(0.98); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .emoji-picker {
            position: absolute;
            bottom: 100%;
            left: 0;
            margin-bottom: 12px;
            background: #1f2937;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 12px;
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 6px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
            z-index: 100;
        }
        .emoji-picker button { background: none; border: none; font-size: 1.25rem; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
        .emoji-picker button:hover { background: rgba(255, 255, 255, 0.1); }

        .mention-highlight {
            color: #60a5fa;
            font-weight: 600;
            background: rgba(59, 130, 246, 0.15);
            padding: 1px 4px;
            border-radius: 4px;
        }

        /* Scrollbar styling */
        .messages-container::-webkit-scrollbar,
        .chat-sidebar-content::-webkit-scrollbar,
        .thread-messages::-webkit-scrollbar { width: 6px; }
        .messages-container::-webkit-scrollbar-track,
        .chat-sidebar-content::-webkit-scrollbar-track,
        .thread-messages::-webkit-scrollbar-track { background: transparent; }
        .messages-container::-webkit-scrollbar-thumb,
        .chat-sidebar-content::-webkit-scrollbar-thumb,
        .thread-messages::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 3px; }
        .messages-container::-webkit-scrollbar-thumb:hover,
        .chat-sidebar-content::-webkit-scrollbar-thumb:hover,
        .thread-messages::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }

        /* GIF Picker */
        .gif-picker {
            position: absolute;
            bottom: 100%;
            left: 50px;
            margin-bottom: 12px;
            background: #1f2937;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 12px;
            width: 320px;
            max-height: 400px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
            z-index: 100;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .gif-picker-search { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 10px 12px; color: #fff; font-size: 0.875rem; outline: none; }
        .gif-picker-search::placeholder { color: rgba(255, 255, 255, 0.4); }
        .gif-picker-results { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; overflow-y: auto; max-height: 300px; }
        .gif-picker-results img { width: 100%; height: 100px; object-fit: cover; border-radius: 8px; cursor: pointer; transition: transform 0.15s, opacity 0.15s; }
        .gif-picker-results img:hover { transform: scale(1.05); opacity: 0.9; }

        /* Voice */
        .voice-recording-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 14px;
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 10px;
            margin-bottom: 10px;
        }
        .voice-recording-indicator .recording-dot { width: 10px; height: 10px; background: #ef4444; border-radius: 50%; animation: pulse 1s infinite; }
        .voice-recording-indicator .recording-time { font-size: 0.875rem; color: #ef4444; font-weight: 500; }
        .voice-recording-indicator button { margin-left: auto; background: none; border: none; color: rgba(255, 255, 255, 0.6); cursor: pointer; padding: 4px 8px; border-radius: 4px; }
        .voice-recording-indicator button:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

        /* Drag & Drop */
        .messages-container.drag-over { border: 2px dashed #FC4100 !important; }
        .drop-zone-overlay {
            position: absolute;
            inset: 0;
            background: rgba(252, 65, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 50;
            border-radius: 8px;
            pointer-events: none;
        }
        .drop-zone-content {
            padding: 24px 48px;
            background: rgba(17, 24, 39, 0.95);
            border: 2px dashed #FC4100;
            border-radius: 12px;
            color: #FC4100;
            font-weight: 600;
            font-size: 0.9rem;
        }

        /* Thread Panel */
        .thread-panel {
            width: 360px;
            background: rgba(17, 24, 39, 0.98);
            border-left: 1px solid rgba(255, 255, 255, 0.06);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
        }
        .thread-header {
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(252, 65, 0, 0.05);
        }
        .thread-header h3 { font-size: 1rem; font-weight: 700; color: #fff; margin: 0; }
        .thread-close-btn { background: none; border: none; color: rgba(255, 255, 255, 0.5); cursor: pointer; font-size: 1.2rem; padding: 4px; border-radius: 6px; }
        .thread-close-btn:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
        .thread-parent {
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(0, 0, 0, 0.15);
        }
        .thread-parent-content { font-size: 0.82rem; color: rgba(255, 255, 255, 0.8); line-height: 1.4; margin-top: 6px; }
        .thread-messages {
            flex: 1;
            overflow-y: auto;
            padding: 12px 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .thread-reply { display: flex; gap: 8px; }
        .thread-reply-avatar { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.6rem; color: #fff; flex-shrink: 0; }
        .thread-reply-body { flex: 1; min-width: 0; }
        .thread-reply-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; font-size: 0.68rem; }
        .thread-reply-text { font-size: 0.8rem; color: rgba(255, 255, 255, 0.85); line-height: 1.4; }
        .thread-input {
            padding: 12px 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .thread-input form { display: flex; gap: 8px; }
        .thread-input input {
            flex: 1;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 8px 12px;
            color: #fff;
            font-size: 0.82rem;
            outline: none;
        }
        .thread-input input:focus { border-color: rgba(252, 65, 0, 0.4); }
        .thread-input input::placeholder { color: rgba(255, 255, 255, 0.3); }
        .thread-input button { background: #FC4100; border: none; color: #fff; padding: 8px 14px; border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer; }
        .thread-input button:hover { background: #d93800; }

        /* Status selector */
        .status-selector { position: relative; margin-left: auto; }
        .current-status-btn { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 6px; }
        .current-status-btn:hover { background: rgba(255,255,255,0.08); }
        .status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
        .status-dot.online { background: #22c55e; }
        .status-dot.away { background: #eab308; }
        .status-dot.busy { background: #ef4444; }
        .status-dot.offline { background: #6b7280; }
        .status-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 6px;
            background: #1f2937;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 6px;
            min-width: 160px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            z-index: 100;
        }
        .status-dropdown button {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            background: none;
            border: none;
            color: rgba(255,255,255,0.8);
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.8rem;
            text-align: left;
        }
        .status-dropdown button:hover { background: rgba(255,255,255,0.06); }

        /* Topic edit */
        .topic-edit-row {
            display: flex;
            gap: 8px;
            align-items: center;
            margin-top: 4px;
        }
        .topic-edit-row input {
            flex: 1;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 6px;
            padding: 4px 8px;
            color: #fff;
            font-size: 0.75rem;
            outline: none;
        }
        .topic-edit-row input:focus { border-color: rgba(252,65,0,0.4); }
        .topic-edit-btn { background: none; border: none; cursor: pointer; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; }
        .topic-edit-btn:hover { background: rgba(255,255,255,0.08); }
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

        {{-- Sidebar --}}
        <div class="chat-sidebar">
            <div class="chat-sidebar-header">
                <span>&#9670;</span> TechPlay Redakcija

                {{-- Status Selector --}}
                <div class="status-selector" x-data="{ open: false }">
                    @php $myPresence = $this->getUserPresence(auth()->user()); @endphp
                    <button @click="open = !open" class="current-status-btn" title="Set status">
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

            <div class="chat-sidebar-content">
                {{-- Channels Section --}}
                <div class="sidebar-section-title">
                    <span>Channels</span>
                    @if(auth()->user()->hasRole('Super Admin'))
                        <a href="{{ \App\Filament\Resources\EditorialChannelResource::getUrl() }}" title="Manage Channels">&#9881;</a>
                    @endif
                </div>

                @foreach($this->channels as $channel)
                    <div wire:click="setChannel('{{ $channel->slug }}')"
                        class="channel-item {{ $this->activeChannel === $channel->slug ? 'active' : '' }}">
                        <span class="channel-icon">{{ $channel->icon ?? '#' }}</span>
                        <span class="channel-name">{{ $channel->name }}</span>
                        @if($channel->is_private)
                            <span class="channel-lock">&#128274;</span>
                        @endif
                        @php $channelUnread = $this->getChannelUnreadCount($channel->slug); @endphp
                        @if($channelUnread > 0 && $this->activeChannel !== $channel->slug)
                            <span class="unread-badge">{{ $channelUnread > 99 ? '99+' : $channelUnread }}</span>
                        @endif
                    </div>
                @endforeach

                {{-- DMs Section --}}
                <div class="sidebar-section-title" style="margin-top: 24px;">
                    <span>Direct Messages</span>
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
                        <div class="dm-info">
                            <div class="dm-name">{{ $user->name }}</div>
                            <span class="dm-role"
                                style="background: {{ $roleBadge['color'] }}20; color: {{ $roleBadge['color'] }}; border: 1px solid {{ $roleBadge['color'] }}40;">
                                {{ $roleBadge['short'] }}
                            </span>
                        </div>
                        @if($user->unread_count > 0)
                            <span class="unread-badge">{{ $user->unread_count }}</span>
                        @endif
                    </div>
                @endforeach
            </div>
        </div>

        {{-- Main Chat Area --}}
        <div class="chat-main">
            {{-- Header --}}
            <div class="chat-header">
                @if($this->activeChannel)
                    @php $channel = $this->channels->firstWhere('slug', $this->activeChannel); @endphp
                    @if($channel)
                        <div class="chat-header-icon">{{ $channel->icon ?? '#' }}</div>
                        <div class="chat-header-info">
                            <h2>{{ $channel->name }}</h2>
                            @if($this->editingTopic)
                                <div class="topic-edit-row">
                                    <input type="text" wire:model="topicContent" placeholder="Set a topic..." autofocus>
                                    <button wire:click="saveTopic" class="topic-edit-btn" style="color: #22c55e;">&#10003;</button>
                                    <button wire:click="cancelEditTopic" class="topic-edit-btn" style="color: rgba(255,255,255,0.5);">&#10005;</button>
                                </div>
                            @else
                                <p @if(auth()->user()->hasRole(['Super Admin', 'Editor-in-Chief', 'Editor']))
                                        wire:click="startEditTopic"
                                        class="editable-topic"
                                        title="Click to edit topic"
                                   @endif>
                                    {{ $channel->topic ?? $channel->description ?? 'Chat with your team' }}
                                </p>
                            @endif
                        </div>
                    @endif
                @elseif($this->activeRecipient)
                    @php
                        $recipient = $this->users->find($this->activeRecipient);
                        $recipientPresence = $this->getUserPresence($recipient);
                        $roleBadge = $this->getUserRoleBadge($recipient);
                        $presenceLabels = ['online' => 'Active now', 'away' => 'Away', 'busy' => 'Do Not Disturb', 'offline' => 'Offline'];
                        $presenceColors = ['online' => '#22c55e', 'away' => '#eab308', 'busy' => '#ef4444', 'offline' => 'rgba(255,255,255,0.5)'];
                    @endphp
                    <div class="dm-avatar" style="background: {{ $roleBadge['color'] }}; width: 42px; height: 42px; font-size: 1rem;">
                        {{ substr($recipient->name, 0, 1) }}
                        <div class="dm-status {{ $recipientPresence }}"></div>
                    </div>
                    <div class="chat-header-info">
                        <h2>{{ $recipient->name }}</h2>
                        <p style="color: {{ $presenceColors[$recipientPresence] }};">
                            {{ $presenceLabels[$recipientPresence] }}
                        </p>
                    </div>
                @endif

                <div class="chat-header-actions">
                    <button class="chat-header-btn {{ $this->showSearch ? 'active' : '' }}"
                            wire:click="$toggle('showSearch')" title="Search (Ctrl+K)">&#128269;</button>
                </div>
            </div>

            {{-- Search Bar --}}
            @if($this->showSearch)
                <div class="search-bar">
                    <input type="text" wire:model.live.debounce.300ms="search" x-ref="searchInput"
                           placeholder="Search... (from:user has:attachment after:2026-01-01)" autofocus>
                    <button wire:click="$set('showSearch', false); $set('search', '')" title="Close">&#10005;</button>
                </div>
            @endif

            {{-- Pinned Messages --}}
            @if($this->activeChannel && $this->pinnedMessages->count() > 0)
                <div class="pinned-bar">
                    <span class="pinned-bar-icon">&#128204;</span>
                    <div class="pinned-messages-scroll">
                        @foreach($this->pinnedMessages as $pinned)
                            <div class="pinned-message">
                                <strong>{{ $pinned->user->name }}:</strong>
                                <span>{{ Str::limit($pinned->content, 40) }}</span>
                                <button wire:click="unpinMessage({{ $pinned->id }})">&#10005;</button>
                            </div>
                        @endforeach
                    </div>
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
                    <div class="drop-zone-content">Drop file here to upload</div>
                </div>

                @php $unreadDividerShown = false; @endphp
                @forelse($this->messages as $index => $msg)
                    @php
                        $isMe = $msg->user_id === auth()->id();
                        $roleBadge = $this->getUserRoleBadge($msg->user);
                        $avatarColor = $isMe ? '#FC4100' : (['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b'][$msg->user_id % 4]);

                        // Unread divider logic (messages ordered desc, so newest first)
                        $showDivider = false;
                        if ($this->previousReadAt && !$unreadDividerShown && !$isMe && $msg->created_at->gt($this->previousReadAt)) {
                            $nextMsg = $this->messages[$index + 1] ?? null;
                            if (!$nextMsg || $nextMsg->created_at->lte($this->previousReadAt)) {
                                $showDivider = true;
                                $unreadDividerShown = true;
                            }
                        }
                    @endphp

                    @if($showDivider)
                        <div class="unread-divider">
                            <div class="unread-divider-line"></div>
                            <span>New Messages</span>
                            <div class="unread-divider-line"></div>
                        </div>
                    @endif

                    <div class="message-row {{ $isMe ? 'from-me' : '' }}" id="msg-{{ $msg->id }}">
                        <div class="message-avatar" style="background: {{ $avatarColor }};">
                            {{ substr($msg->user->name, 0, 1) }}
                        </div>

                        <div class="message-content">
                            <div class="message-meta">
                                <span class="message-author">{{ $msg->user->name }}</span>
                                <span class="message-role"
                                    style="background: {{ $roleBadge['color'] }}20; color: {{ $roleBadge['color'] }};">
                                    {{ $roleBadge['short'] }}
                                </span>
                                <span class="message-time">{{ $msg->created_at->format('H:i') }}</span>
                                @if($msg->edited_at)
                                    <span class="edited-indicator">(edited)</span>
                                @endif
                            </div>

                            <div class="message-bubble {{ $isMe ? 'from-me' : 'from-other' }}">
                                {{-- Voice message --}}
                                @if(($msg->message_type ?? 'text') === 'voice' && $msg->attachment_url)
                                    <div class="voice-player">
                                        <audio controls preload="metadata">
                                            <source src="{{ asset('storage/' . $msg->attachment_url) }}" type="audio/webm">
                                        </audio>
                                    </div>
                                @elseif($msg->attachment_url)
                                    <div class="message-attachment">
                                        @if(Str::endsWith($msg->attachment_url, ['.jpg', '.jpeg', '.png', '.gif', '.webp']) || Str::startsWith($msg->attachment_url, 'http'))
                                            <a href="{{ Str::startsWith($msg->attachment_url, 'http') ? $msg->attachment_url : asset('storage/' . $msg->attachment_url) }}" target="_blank">
                                                <img src="{{ Str::startsWith($msg->attachment_url, 'http') ? $msg->attachment_url : asset('storage/' . $msg->attachment_url) }}" alt="Attachment">
                                            </a>
                                        @else
                                            <a href="{{ asset('storage/' . $msg->attachment_url) }}" target="_blank">
                                                &#128206; Download Attachment
                                            </a>
                                        @endif
                                    </div>
                                @endif

                                @if($msg->content)
                                    {!! $this->formatMessageContent($msg->content) !!}
                                @endif

                                {{-- Hover Actions --}}
                                <div class="hover-actions">
                                    @foreach(['&#128077;', '&#10084;&#65039;', '&#128514;', '&#128293;', '&#128064;'] as $emoji)
                                        <button wire:click="toggleReaction({{ $msg->id }}, '{{ html_entity_decode($emoji) }}')" title="React">{!! $emoji !!}</button>
                                    @endforeach
                                    <button wire:click="setActiveThread({{ $msg->id }})" title="Reply in thread" style="border-left: 1px solid rgba(255,255,255,0.1); padding-left: 8px; margin-left: 4px;">&#129525;</button>
                                    <button wire:click="quoteMessage({{ $msg->id }})" title="Quote">&#128172;</button>
                                    @if(!$msg->is_pinned && $this->activeChannel)
                                        <button wire:click="pinMessage({{ $msg->id }})" title="Pin">&#128204;</button>
                                    @endif
                                </div>
                            </div>

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

                            {{-- Thread reply count --}}
                            @if($msg->replies->count() > 0)
                                <button wire:click="setActiveThread({{ $msg->id }})" class="thread-reply-count">
                                    &#129525; {{ $msg->replies->count() }} {{ Str::plural('reply', $msg->replies->count()) }}
                                </button>
                            @endif
                        </div>
                    </div>
                @empty
                    <div class="empty-state">
                        <div class="empty-state-icon">&#128172;</div>
                        <h3>No messages yet</h3>
                        <p>Start the conversation!</p>
                    </div>
                @endforelse
            </div>

            {{-- Typing Indicator --}}
            @if(count($this->typingUsers) > 0)
                <div class="typing-indicator">
                    <span class="typing-dots"><span></span><span></span><span></span></span>
                    <span>{{ implode(', ', $this->typingUsers) }} {{ count($this->typingUsers) === 1 ? 'is' : 'are' }} typing...</span>
                </div>
            @endif

            {{-- Input Area --}}
            <div class="input-area">
                @if($attachment)
                    <div class="attachment-preview">
                        <div class="attachment-preview-info">
                            <span class="attachment-preview-icon">&#128206;</span>
                            <span class="attachment-preview-name">{{ $attachment->getClientOriginalName() }}</span>
                        </div>
                        <button wire:click="resetAttachment">&#10005;</button>
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
                        } catch (err) {
                            console.error('Could not start recording:', err);
                        }
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
                        @foreach(['😀', '😂', '😍', '😎', '🤔', '😅', '😭', '👍', '👎', '🔥', '❤️', '🎉', '🚀', '👀', '✅', '❌', '🛑', '⚠️', '📢', '🎮', '⚽', '🎲'] as $emoji)
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
                            style="text-align: center; color: rgba(255,255,255,0.4); padding: 20px; font-size: 0.8rem;">
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
                        {{-- Formatting Toolbar --}}
                        <div class="formatting-toolbar">
                            <button type="button" @click="wrapSelection('**', '**')" class="format-btn" title="Bold"><strong>B</strong></button>
                            <button type="button" @click="wrapSelection('*', '*')" class="format-btn" title="Italic"><em>I</em></button>
                            <button type="button" @click="wrapSelection('~~', '~~')" class="format-btn" title="Strikethrough"><del>S</del></button>
                            <button type="button" @click="wrapSelection('`', '`')" class="format-btn" title="Code" style="font-family: monospace;">&lt;/&gt;</button>
                            <button type="button" @click="wrapSelection('```\n', '\n```')" class="format-btn" title="Code Block" style="font-family: monospace;">{ }</button>
                        </div>

                        <textarea wire:model="message" x-ref="messageInput"
                            placeholder="Message #{{ $this->activeChannel ? ($this->channels->firstWhere('slug', $this->activeChannel)?->name ?? 'chat') : 'User' }}..."
                            rows="1"
                            @keydown.enter.prevent="if (!$event.shiftKey) { $wire.sendMessage(); }"
                            autocomplete="off"></textarea>

                        <div class="input-toolbar">
                            <div class="input-actions">
                                <button type="button" @click="showEmojis = !showEmojis; showGifs = false"
                                    class="input-action-btn" title="Emoji">&#128522;</button>
                                <button type="button" @click="showGifs = !showGifs; showEmojis = false"
                                    class="input-action-btn" title="GIF">GIF</button>
                                <label class="input-action-btn" title="Attach file" style="cursor: pointer;">
                                    <input type="file" wire:model="attachment" style="display: none;">
                                    &#128206;
                                </label>
                                <button type="button" @click="isRecording ? stopRecording() : startRecording()"
                                    class="input-action-btn" :style="isRecording ? 'color: #ef4444' : ''"
                                    title="Voice Message">&#127908;</button>
                            </div>

                            <button type="submit" class="send-btn" wire:loading.attr="disabled">
                                <span>Send</span>
                                <span>&#10148;</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        {{-- Thread Panel --}}
        @if($this->activeThread)
            <div class="thread-panel">
                <div class="thread-header">
                    <h3>&#129525; Thread</h3>
                    <button wire:click="closeThread" class="thread-close-btn">&#10005;</button>
                </div>

                {{-- Parent message --}}
                @if($this->activeThreadMessage)
                    @php
                        $parentMsg = $this->activeThreadMessage;
                        $parentBadge = $this->getUserRoleBadge($parentMsg->user);
                        $parentColor = (['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b'][$parentMsg->user_id % 4]);
                    @endphp
                    <div class="thread-parent">
                        <div class="message-meta">
                            <span class="message-author">{{ $parentMsg->user->name }}</span>
                            <span class="message-role" style="background: {{ $parentBadge['color'] }}20; color: {{ $parentBadge['color'] }};">{{ $parentBadge['short'] }}</span>
                            <span class="message-time">{{ $parentMsg->created_at->format('H:i, d M') }}</span>
                        </div>
                        <div class="thread-parent-content">
                            @if($parentMsg->attachment_url)
                                @if(Str::endsWith($parentMsg->attachment_url, ['.jpg', '.jpeg', '.png', '.gif', '.webp']) || Str::startsWith($parentMsg->attachment_url, 'http'))
                                    <img src="{{ Str::startsWith($parentMsg->attachment_url, 'http') ? $parentMsg->attachment_url : asset('storage/' . $parentMsg->attachment_url) }}" alt="" style="max-width: 200px; border-radius: 8px; margin-bottom: 8px;">
                                @endif
                            @endif
                            {!! $this->formatMessageContent($parentMsg->content) !!}
                        </div>
                    </div>
                @endif

                {{-- Thread replies --}}
                <div class="thread-messages">
                    @forelse($this->threadMessages as $reply)
                        @php
                            $replyBadge = $this->getUserRoleBadge($reply->user);
                            $replyColor = (['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b'][$reply->user_id % 4]);
                        @endphp
                        <div class="thread-reply">
                            <div class="thread-reply-avatar" style="background: {{ $reply->user_id === auth()->id() ? '#FC4100' : $replyColor }};">
                                {{ substr($reply->user->name, 0, 1) }}
                            </div>
                            <div class="thread-reply-body">
                                <div class="thread-reply-meta">
                                    <span class="message-author">{{ $reply->user->name }}</span>
                                    <span class="message-time">{{ $reply->created_at->format('H:i') }}</span>
                                </div>
                                <div class="thread-reply-text">
                                    {!! $this->formatMessageContent($reply->content) !!}
                                </div>
                            </div>
                        </div>
                    @empty
                        <div style="text-align: center; color: rgba(255,255,255,0.3); padding: 24px; font-size: 0.82rem;">
                            No replies yet. Start the thread!
                        </div>
                    @endforelse
                </div>

                {{-- Thread input --}}
                <div class="thread-input">
                    <form wire:submit="sendThreadReply">
                        <input type="text" wire:model="threadMessage" placeholder="Reply in thread..." autocomplete="off">
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
