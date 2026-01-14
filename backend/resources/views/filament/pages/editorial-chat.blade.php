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
            padding: 20px 24px;
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

        .channel-icon {
            font-size: 1.2rem;
        }

        .channel-name {
            font-size: 0.875rem;
            font-weight: 500;
        }

        .channel-lock {
            font-size: 0.7rem;
            margin-left: auto;
            opacity: 0.5;
        }

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

        .dm-status.online {
            background: #22c55e;
        }

        .dm-status.offline {
            background: #6b7280;
        }

        .dm-info {
            flex: 1;
            min-width: 0;
        }

        .dm-name {
            font-size: 0.875rem;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

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
            padding: 16px 24px;
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
        }

        .chat-header-info h2 {
            font-size: 1.1rem;
            font-weight: 700;
            color: #fff;
            margin: 0;
        }

        .chat-header-info p {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.4);
        }

        .chat-search {
            flex: 1;
            max-width: 300px;
            margin-left: auto;
            position: relative;
        }

        .chat-search input {
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 8px 12px 8px 36px;
            color: #fff;
            outline: none;
            font-size: 0.875rem;
            transition: all 0.2s;
        }

        .chat-search input:focus {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(252, 65, 0, 0.5);
            box-shadow: 0 0 0 2px rgba(252, 65, 0, 0.1);
        }

        .chat-search-icon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: rgba(255, 255, 255, 0.3);
            pointer-events: none;
        }

        .pinned-bar {
            padding: 10px 24px;
            background: rgba(251, 191, 36, 0.08);
            border-bottom: 1px solid rgba(251, 191, 36, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .pinned-bar-icon {
            font-size: 1.1rem;
        }

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

        .pinned-message strong {
            color: #fbbf24;
        }

        .pinned-message span {
            color: rgba(255, 255, 255, 0.6);
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .pinned-message button {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.4);
            cursor: pointer;
            padding: 0;
        }

        .pinned-message button:hover {
            color: #ef4444;
        }

        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column-reverse;
            gap: 20px;
        }

        .message-row {
            display: flex;
            gap: 14px;
            max-width: 100%;
        }

        .message-row.from-me {
            flex-direction: row-reverse;
        }

        .message-avatar {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.8rem;
            color: #fff;
            flex-shrink: 0;
        }

        .message-content {
            max-width: 65%;
            display: flex;
            flex-direction: column;
        }

        .message-row.from-me .message-content {
            align-items: flex-end;
        }

        .message-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
            font-size: 0.75rem;
        }

        .message-row.from-me .message-meta {
            flex-direction: row-reverse;
        }

        .message-author {
            font-weight: 700;
            color: #fff;
        }

        .message-role {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.6rem;
            font-weight: 600;
        }

        .message-time {
            color: rgba(255, 255, 255, 0.35);
        }

        .message-bubble {
            padding: 12px 16px;
            border-radius: 16px;
            font-size: 0.9rem;
            line-height: 1.5;
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

        .message-attachment {
            margin-bottom: 10px;
        }

        .message-attachment img {
            max-width: 100%;
            max-height: 200px;
            border-radius: 10px;
        }

        .message-attachment a {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            color: inherit;
            text-decoration: underline;
        }

        .reactions-row {
            display: flex;
            gap: 6px;
            margin-top: 8px;
        }

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

        .reaction-btn:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        .reaction-btn.active {
            border-color: #3b82f6;
            background: rgba(59, 130, 246, 0.15);
        }

        .reaction-emoji {
            font-size: 0.85rem;
        }

        .reaction-count {
            color: rgba(255, 255, 255, 0.7);
            font-weight: 600;
        }

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

        .message-bubble:hover .hover-actions {
            display: flex;
        }

        .message-bubble.from-me .hover-actions {
            right: 100%;
            margin-right: 8px;
        }

        .message-bubble.from-other .hover-actions {
            left: 100%;
            margin-left: 8px;
        }

        .hover-actions button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            font-size: 0.9rem;
            transition: background 0.15s;
        }

        .hover-actions button:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .hover-actions button.danger:hover {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }

        .edited-badge {
            display: inline-block;
            font-size: 0.65rem;
            color: rgba(255, 255, 255, 0.4);
            margin-left: 6px;
            font-style: italic;
        }

        .edit-message-box {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(252, 65, 0, 0.3);
            border-radius: 8px;
            padding: 8px;
            margin-top: 8px;
        }

        .edit-message-box textarea {
            width: 100%;
            background: transparent;
            border: none;
            color: #fff;
            font-size: 0.875rem;
            resize: none;
            outline: none;
            font-family: inherit;
        }

        .edit-message-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            margin-top: 8px;
        }

        .edit-message-actions button {
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 0.75rem;
            cursor: pointer;
            border: none;
            transition: all 0.15s;
        }

        .edit-save-btn {
            background: #FC4100;
            color: #fff;
        }

        .edit-save-btn:hover {
            background: #d93800;
        }

        .edit-cancel-btn {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.7);
        }

        .edit-cancel-btn:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        .empty-state {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.3);
            text-align: center;
        }

        .empty-state-icon {
            font-size: 4rem;
            margin-bottom: 16px;
            opacity: 0.3;
        }

        .empty-state h3 {
            font-size: 1.25rem;
            margin: 0 0 8px;
            color: rgba(255, 255, 255, 0.4);
        }

        .empty-state p {
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.3);
        }

        .input-area {
            padding: 16px 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(17, 24, 39, 0.8);
        }

        .attachment-preview {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            margin-bottom: 12px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 10px;
            border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .attachment-preview-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .attachment-preview-icon {
            font-size: 1.2rem;
        }

        .attachment-preview-name {
            font-size: 0.875rem;
            color: #60a5fa;
            font-weight: 500;
        }

        .attachment-preview button {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            padding: 4px;
        }

        .attachment-preview button:hover {
            color: #ef4444;
        }

        .input-box {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-box:focus-within {
            border-color: rgba(252, 65, 0, 0.5);
            box-shadow: 0 0 0 3px rgba(252, 65, 0, 0.1);
        }

        .input-box input {
            width: 100%;
            background: transparent;
            border: none;
            padding: 14px 16px;
            font-size: 0.9rem;
            color: #fff;
            outline: none;
        }

        .input-box input::placeholder {
            color: rgba(255, 255, 255, 0.35);
        }

        .input-box textarea {
            width: 100%;
            background: transparent;
            border: none;
            padding: 14px 16px;
            font-size: 0.9rem;
            color: #fff;
            outline: none;
            resize: none;
            min-height: 24px;
            max-height: 120px;
            line-height: 1.4;
            font-family: inherit;
        }

        .input-box textarea::placeholder {
            color: rgba(255, 255, 255, 0.35);
        }

        .input-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .input-actions {
            display: flex;
            gap: 4px;
        }

        .input-action-btn {
            background: none;
            border: none;
            padding: 8px;
            border-radius: 8px;
            color: rgba(255, 255, 255, 0.4);
            cursor: pointer;
            transition: all 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .input-action-btn:hover {
            background: rgba(255, 255, 255, 0.08);
            color: rgba(255, 255, 255, 0.8);
        }

        .send-btn {
            background: linear-gradient(135deg, #FC4100 0%, #d93800 100%);
            border: none;
            padding: 8px 18px;
            border-radius: 8px;
            color: #fff;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: transform 0.1s, box-shadow 0.2s;
            box-shadow: 0 4px 15px rgba(252, 65, 0, 0.3);
        }

        .send-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(252, 65, 0, 0.4);
        }

        .send-btn:active {
            transform: scale(0.98);
        }

        .send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

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

        .emoji-picker button {
            background: none;
            border: none;
            font-size: 1.25rem;
            padding: 6px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.15s;
        }

        .emoji-picker button:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        /* Mentions Autocomplete */
        .mentions-dropdown {
            position: absolute;
            bottom: 100%;
            left: 0;
            margin-bottom: 8px;
            background: #1f2937;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            max-height: 200px;
            overflow-y: auto;
            min-width: 220px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
            z-index: 100;
        }

        .mentions-dropdown-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 14px;
            cursor: pointer;
            transition: background 0.15s;
        }

        .mentions-dropdown-item:hover,
        .mentions-dropdown-item.selected {
            background: rgba(252, 65, 0, 0.15);
        }

        .mentions-dropdown-item:first-child {
            border-radius: 10px 10px 0 0;
        }

        .mentions-dropdown-item:last-child {
            border-radius: 0 0 10px 10px;
        }

        .mentions-avatar {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.7rem;
            color: #fff;
        }

        .mentions-info {
            flex: 1;
        }

        .mentions-name {
            font-size: 0.875rem;
            font-weight: 500;
            color: #fff;
        }

        .mentions-role {
            font-size: 0.65rem;
            color: rgba(255, 255, 255, 0.5);
        }

        .mention-highlight {
            color: #60a5fa;
            font-weight: 600;
            background: rgba(59, 130, 246, 0.15);
            padding: 1px 4px;
            border-radius: 4px;
        }

        /* Image Lightbox */
        .lightbox-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.9);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
            cursor: zoom-out;
        }

        .lightbox-content {
            max-width: 90vw;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        }

        .lightbox-close {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: #fff;
            font-size: 1.5rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }

        .lightbox-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .message-image {
            cursor: zoom-in;
            transition: transform 0.2s;
        }

        .message-image:hover {
            transform: scale(1.02);
        }

        /* Scrollbar styling */
        .messages-container::-webkit-scrollbar,
        .chat-sidebar-content::-webkit-scrollbar {
            width: 6px;
        }

        .messages-container::-webkit-scrollbar-track,
        .chat-sidebar-content::-webkit-scrollbar-track {
            background: transparent;
        }

        .messages-container::-webkit-scrollbar-thumb,
        .chat-sidebar-content::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover,
        .chat-sidebar-content::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }
    </style>

    <div class="chat-wrapper">
        {{-- Sidebar --}}
        <div class="chat-sidebar">
            <div class="chat-sidebar-header">
                <span>◈</span> TechPlay Redakcija
            </div>

            <div class="chat-sidebar-content">
                {{-- Channels Section --}}
                <div class="sidebar-section-title">
                    <span>Channels</span>
                    @if(auth()->user()->hasRole('Super Admin'))
                        <a href="{{ \App\Filament\Resources\EditorialChannelResource::getUrl() }}"
                            title="Manage Channels">⚙️</a>
                    @endif
                </div>

                @foreach($this->channels as $channel)
                    <div wire:click="setChannel('{{ $channel->slug }}')"
                        class="channel-item {{ $this->activeChannel === $channel->slug ? 'active' : '' }}">
                        <span class="channel-icon">{{ $channel->icon ?? '#' }}</span>
                        <span class="channel-name">{{ $channel->name }}</span>
                        @if($channel->is_private)
                            <span class="channel-lock">🔒</span>
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
                        $isOnline = $this->isUserOnline($user);
                    @endphp
                    <div wire:click="setRecipient({{ $user->id }})"
                        class="dm-item {{ $this->activeRecipient === $user->id ? 'active' : '' }}">
                        <div class="dm-avatar" style="background: {{ $roleBadge['color'] }};">
                            {{ substr($user->name, 0, 1) }}
                            <div class="dm-status {{ $isOnline ? 'online' : 'offline' }}"></div>
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
        <div class="chat-main" wire:poll.3s data-last-message-id="{{ $this->messages->first()?->id }}">
            {{-- Header --}}
            <div class="chat-header">
                @if($this->activeChannel)
                    @php $channel = $this->channels->firstWhere('slug', $this->activeChannel); @endphp
                    @if($channel)
                        <div class="chat-header-icon">{{ $channel->icon ?? '#' }}</div>
                        <div class="chat-header-info">
                            <h2>{{ $channel->name }}</h2>
                            <p>{{ $channel->description ?? 'Chat with your team' }}</p>
                        </div>
                    @endif
                @elseif($this->activeRecipient)
                    @php
                        $recipient = $this->users->find($this->activeRecipient);
                        $isOnline = $this->isUserOnline($recipient);
                        $roleBadge = $this->getUserRoleBadge($recipient);
                    @endphp
                    <div class="dm-avatar"
                        style="background: {{ $roleBadge['color'] }}; width: 42px; height: 42px; font-size: 1rem;">
                        {{ substr($recipient->name, 0, 1) }}
                        <div class="dm-status {{ $isOnline ? 'online' : 'offline' }}"></div>
                    </div>
                    <div class="chat-header-info">
                        <h2>{{ $recipient->name }}</h2>
                        <p style="color: {{ $isOnline ? '#22c55e' : 'rgba(255,255,255,0.5)' }};">
                            {{ $isOnline ? 'Active now' : 'Offline' }}
                        </p>
                    </div>
                @endif

                <div class="chat-search">
                    <span class="chat-search-icon">🔍</span>
                    <input type="text" wire:model.live.debounce.500ms="search" placeholder="Search messages...">
                </div>
            </div>

            {{-- Pinned Messages --}}
            @if($this->activeChannel && $this->pinnedMessages->count() > 0)
                <div class="pinned-bar">
                    <span class="pinned-bar-icon">📌</span>
                    <div class="pinned-messages-scroll">
                        @foreach($this->pinnedMessages as $pinned)
                            <div class="pinned-message">
                                <strong>{{ $pinned->user->name }}:</strong>
                                <span>{{ Str::limit($pinned->content, 40) }}</span>
                                <button wire:click="unpinMessage({{ $pinned->id }})">✕</button>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif

            {{-- Messages --}}
            <div class="messages-container">
                @forelse($this->messages as $msg)
                    @php
                        $isMe = $msg->user_id === auth()->id();
                        $roleBadge = $this->getUserRoleBadge($msg->user);
                        $avatarColor = $isMe ? '#FC4100' : (['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b'][$msg->user_id % 4]);
                    @endphp

                    <div class="message-row {{ $isMe ? 'from-me' : '' }}">
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
                            </div>

                            <div class="message-bubble {{ $isMe ? 'from-me' : 'from-other' }}">
                                @if($msg->attachment_url)
                                    <div class="message-attachment">
                                        @if(Str::endsWith($msg->attachment_url, ['.jpg', '.jpeg', '.png', '.gif', '.webp']))
                                            <img src="{{ asset('storage/' . $msg->attachment_url) }}" alt="Attachment"
                                                class="message-image"
                                                @click="$dispatch('open-lightbox', { src: '{{ asset('storage/' . $msg->attachment_url) }}' })">
                                        @else
                                            <a href="{{ asset('storage/' . $msg->attachment_url) }}" target="_blank">
                                                📎 Download Attachment
                                            </a>
                                        @endif
                                    </div>
                                @endif

                                @if($editingMessageId === $msg->id)
                                    {{-- Edit Mode --}}
                                    <div class="edit-message-box">
                                        <textarea wire:model="editingContent" rows="2">{{ $editingContent }}</textarea>
                                        <div class="edit-message-actions">
                                            <button type="button" wire:click="cancelEdit"
                                                class="edit-cancel-btn">Cancel</button>
                                            <button type="button" wire:click="saveEdit" class="edit-save-btn">Save</button>
                                        </div>
                                    </div>
                                @else
                                    {!! $this->formatMessageContent($msg->content) !!}
                                    @if($msg->edited_at)
                                        <span class="edited-badge">(edited)</span>
                                    @endif
                                    @if($msg->isBookmarkedBy(auth()->user()))
                                        <div
                                            style="position: absolute; top: -6px; right: -6px; background: #fbbf24; color: #000; padding: 2px; border-radius: 50%; font-size: 0.6rem; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                                            ★
                                        </div>
                                    @endif
                                @endif

                                {{-- Hover Actions --}}
                                <div class="hover-actions">
                                    @foreach(['👍', '❤️', '😂', '🔥', '👀'] as $emoji)
                                        <button wire:click="toggleReaction({{ $msg->id }}, '{{ $emoji }}')"
                                            title="React">{{ $emoji }}</button>
                                    @endforeach
                                    <button wire:click="toggleBookmark({{ $msg->id }})" title="Bookmark"
                                        style="{{ $msg->isBookmarkedBy(auth()->user()) ? 'color: #fbbf24;' : '' }}">
                                        ★
                                    </button>
                                    @if(!$msg->is_pinned && $this->activeChannel)
                                        <button wire:click="pinMessage({{ $msg->id }})" title="Pin"
                                            style="border-left: 1px solid rgba(255,255,255,0.1); padding-left: 8px; margin-left: 4px;">📌</button>
                                    @endif
                                    @if($isMe && $msg->canEdit())
                                        <button wire:click="startEditMessage({{ $msg->id }})"
                                            title="Edit (within 15 min)">✏️</button>
                                    @endif
                                    @if($isMe)
                                        <button wire:click="deleteMessage({{ $msg->id }})" class="danger" title="Delete"
                                            onclick="return confirm('Delete this message?')">🗑️</button>
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
                        </div>
                    </div>
                @empty
                    <div class="empty-state">
                        <div class="empty-state-icon">💬</div>
                        <h3>No messages yet</h3>
                        <p>Start the conversation!</p>
                    </div>
                @endforelse
            </div>

            {{-- Input Area --}}
            <div class="input-area">
                @if($attachment)
                    <div class="attachment-preview">
                        <div class="attachment-preview-info">
                            <span class="attachment-preview-icon">📎</span>
                            <span class="attachment-preview-name">{{ $attachment->getClientOriginalName() }}</span>
                        </div>
                        <button wire:click="resetAttachment">✕</button>
                    </div>
                @endif

                <form wire:submit="sendMessage" x-data="{
                    showEmojis: false,
                    showMentions: false,
                    mentionSearch: '',
                    mentionIndex: 0,
                    users: @js($this->users->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'role' => $this->getUserRoleBadge($u)['short'], 'color' => $this->getUserRoleBadge($u)['color']])->values()),
                    get filteredUsers() {
                        if (!this.mentionSearch) return this.users.slice(0, 5);
                        const search = this.mentionSearch.toLowerCase();
                        return this.users.filter(u => u.name.toLowerCase().includes(search)).slice(0, 5);
                    },
                    checkMention(e) {
                        const textarea = e.target;
                        const cursorPos = textarea.selectionStart;
                        const text = textarea.value.substring(0, cursorPos);
                        const lastAt = text.lastIndexOf('@');
                        
                        if (lastAt !== -1) {
                            const afterAt = text.substring(lastAt + 1);
                            // Only show if @ is at start or after space, and no space after @
                            if ((lastAt === 0 || text[lastAt - 1] === ' ' || text[lastAt - 1] === '\n') && !afterAt.includes(' ')) {
                                this.mentionSearch = afterAt;
                                this.showMentions = true;
                                this.mentionIndex = 0;
                                return;
                            }
                        }
                        this.showMentions = false;
                    },
                    selectMention(user) {
                        const textarea = $refs.messageInput;
                        const cursorPos = textarea.selectionStart;
                        const text = textarea.value;
                        const lastAt = text.substring(0, cursorPos).lastIndexOf('@');
                        
                        const before = text.substring(0, lastAt);
                        const after = text.substring(cursorPos);
                        const newText = before + '@' + user.name + ' ' + after;
                        
                        textarea.value = newText;
                        $wire.set('message', newText);
                        this.showMentions = false;
                        textarea.focus();
                        textarea.selectionStart = textarea.selectionEnd = lastAt + user.name.length + 2;
                    },
                    handleMentionKeys(e) {
                        if (!this.showMentions) return;
                        
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            this.mentionIndex = Math.min(this.mentionIndex + 1, this.filteredUsers.length - 1);
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            this.mentionIndex = Math.max(this.mentionIndex - 1, 0);
                        } else if (e.key === 'Enter' || e.key === 'Tab') {
                            if (this.filteredUsers[this.mentionIndex]) {
                                e.preventDefault();
                                this.selectMention(this.filteredUsers[this.mentionIndex]);
                            }
                        } else if (e.key === 'Escape') {
                            this.showMentions = false;
                        }
                    }
                }" style="position: relative;">
                    {{-- Mentions Dropdown --}}
                    <div x-show="showMentions && filteredUsers.length > 0" x-transition class="mentions-dropdown">
                        <template x-for="(user, index) in filteredUsers" :key="user.id">
                            <div @click="selectMention(user)" class="mentions-dropdown-item"
                                :class="{ 'selected': index === mentionIndex }">
                                <div class="mentions-avatar" :style="'background:' + user.color">
                                    <span x-text="user.name.charAt(0)"></span>
                                </div>
                                <div class="mentions-info">
                                    <div class="mentions-name" x-text="user.name"></div>
                                    <div class="mentions-role" x-text="user.role"></div>
                                </div>
                            </div>
                        </template>
                    </div>

                    {{-- Emoji Picker --}}
                    <div x-show="showEmojis" @click.away="showEmojis = false" x-transition class="emoji-picker">
                        @foreach(['😀', '😂', '😍', '😎', '🤔', '😅', '😭', '👍', '👎', '🔥', '❤️', '🎉', '🚀', '👀', '✅', '❌', '🛑', '⚠️', '📢', '🎮', '⚽', '🎲'] as $emoji)
                            <button type="button"
                                @click="$wire.set('message', $wire.message + '{{ $emoji }}'); showEmojis = false; $refs.messageInput.focus()">
                                {{ $emoji }}
                            </button>
                        @endforeach
                    </div>

                    <div class="input-box">
                        <textarea wire:model="message" x-ref="messageInput" rows="1"
                            placeholder="Message #{{ $this->activeChannel ? ($this->channels->firstWhere('slug', $this->activeChannel)?->name ?? 'chat') : 'User' }}... (@ to mention)"
                            autofocus autocomplete="off"
                            @input="checkMention($event); $el.style.height = 'auto'; $el.style.height = Math.min($el.scrollHeight, 120) + 'px'"
                            @keydown="handleMentionKeys($event)" @keydown.enter.prevent="
                                if (showMentions && filteredUsers[mentionIndex]) {
                                    selectMention(filteredUsers[mentionIndex]);
                                } else if ($event.shiftKey) {
                                    const start = $el.selectionStart;
                                    const end = $el.selectionEnd;
                                    const value = $el.value;
                                    $el.value = value.substring(0, start) + '\n' + value.substring(end);
                                    $el.selectionStart = $el.selectionEnd = start + 1;
                                    $el.style.height = 'auto';
                                    $el.style.height = Math.min($el.scrollHeight, 120) + 'px';
                                    $wire.set('message', $el.value);
                                } else {
                                    if ($wire.message && $wire.message.trim()) {
                                        $wire.sendMessage();
                                    }
                                }
                            " @keydown.escape="showEmojis = false; showMentions = false"></textarea>

                        <div class="input-toolbar">
                            <div class="input-actions">
                                <button type="button" @click="showEmojis = !showEmojis" class="input-action-btn"
                                    title="Emoji">
                                    😊
                                </button>
                                <label class="input-action-btn" title="Attach file" style="cursor: pointer;">
                                    <input type="file" wire:model="attachment" style="display: none;">
                                    📎
                                </label>
                            </div>

                            <button type="submit" class="send-btn" wire:loading.attr="disabled">
                                <span>Send</span>
                                <span>➤</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    {{-- Lightbox Modal --}}
    <div x-data="{ open: false, src: '' }" @open-lightbox.window="open = true; src = $event.detail.src"
        @keydown.escape.window="open = false" x-show="open" x-transition.opacity class="lightbox-overlay"
        style="display: none;" x-show.important="open"> <!-- ensure it overrides display:none when open -->

        <button @click="open = false" class="lightbox-close">✕</button>
        <img :src="src" class="lightbox-content" @click.outside="open = false">
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            if (Notification.permission !== "granted" && Notification.permission !== "denied") {
                Notification.requestPermission();
            }
        });
    </script>
</x-filament-panels::page>