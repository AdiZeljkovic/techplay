<x-filament-panels::page>
    <div
        style="display: flex; flex-direction: row; height: 75vh; width: 100%; border: 1px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; background-color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

        <!-- Sidebar (Dark) -->
        <div
            style="width: 280px; display: flex; flex-direction: column; background-color: #1a2234; color: #94a3b8; border-right: 1px solid #1e293b; flex-shrink: 0;">
            <!-- Header -->
            <div
                style="height: 60px; display: flex; align-items: center; padding-left: 20px; font-weight: bold; color: white; border-bottom: 1px solid #1e293b; background-color: #1a2234;">
                <span style="color: #3b82f6; margin-right: 8px;">◈</span> TechPlay Redakcija
            </div>

            <!-- Scrollable List -->
            <div style="flex: 1; overflow-y: auto; padding-top: 20px;">

                <!-- Channels -->
                <div style="margin-bottom: 30px;">
                    <div
                        style="padding: 0 20px; margin-bottom: 10px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; display: flex; justify-content: space-between;">
                        <span>Channels</span>
                    </div>
                    @foreach($this->channels as $id => $channel)
                        <button wire:click="setChannel('{{ $id }}')"
                            style="width: 100%; text-align: left; padding: 8px 20px; display: flex; align-items: center; gap: 10px; cursor: pointer; border: none; background: {{ $this->activeChannel === $id ? '#1d4ed8' : 'transparent' }}; color: {{ $this->activeChannel === $id ? 'white' : 'inherit' }}; transition: background 0.2s;">
                            <span>{{ $channel['icon'] }}</span>
                            <div style="flex: 1;">
                                <div style="font-size: 0.9rem;">{{ $channel['name'] }}</div>
                            </div>
                        </button>
                    @endforeach
                </div>

                <!-- DMs -->
                <div>
                    <div
                        style="padding: 0 20px; margin-bottom: 10px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">
                        Direct Messages
                    </div>
                    @foreach($this->users as $user)
                        @php
                            $roleBadge = $this->getUserRoleBadge($user);
                            $isOnline = $this->isUserOnline($user);
                        @endphp
                        <button wire:click="setRecipient({{ $user->id }})"
                            style="width: 100%; text-align: left; padding: 10px 20px; display: flex; align-items: center; gap: 12px; cursor: pointer; border: none; background: {{ $this->activeRecipient === $user->id ? '#1d4ed8' : 'transparent' }}; color: {{ $this->activeRecipient === $user->id ? 'white' : 'inherit' }}; transition: background 0.2s;">

                            <!-- Avatar with Online Status -->
                            <div style="position: relative;">
                                @if($user->avatar_url)
                                    <img src="{{ $user->user_avatar }}"
                                        style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
                                @else
                                    <div
                                        style="width: 32px; height: 32px; border-radius: 50%; background-color: {{ $user->id % 2 == 0 ? '#3b82f6' : '#6366f1' }}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold;">
                                        {{ substr($user->name, 0, 1) }}
                                    </div>
                                @endif
                                <div
                                    style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; border-radius: 50%; background-color: {{ $isOnline ? '#22c55e' : '#9ca3af' }}; border: 2px solid #1a2234;">
                                </div>
                            </div>

                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; align-items: center; justify-content: space-between;">
                                    <span
                                        style="font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">
                                        {{ $user->name }}
                                    </span>
                                    @if($user->unread_count > 0)
                                        <div
                                            style="background-color: #ef4444; color: white; font-size: 0.7rem; padding: 1px 6px; border-radius: 10px; font-weight: bold;">
                                            {{ $user->unread_count }}
                                        </div>
                                    @endif
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                                    <span
                                        style="font-size: 0.65rem; padding: 1px 4px; border-radius: 4px; background-color: {{ $roleBadge['color'] }}20; color: {{ $roleBadge['color'] }}; border: 1px solid {{ $roleBadge['color'] }}40;">
                                        {{ $roleBadge['short'] }}
                                    </span>
                                </div>
                            </div>
                        </button>
                    @endforeach
                </div>
            </div>
        </div>

        <!-- Main Chat Area -->
        <div style="flex: 1; display: flex; flex-direction: column; background-color: #f8fafc; min-width: 0;"
            wire:poll.3s>

            <!-- Context Header -->
            <div
                style="height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background-color: white; border-bottom: 1px solid #e2e8f0; flex-shrink: 0;">
                <div style="display: flex; align-items: center;">
                    @if($this->activeChannel)
                        <span
                            style="font-size: 1.5rem; margin-right: 12px;">{{ $this->channels[$this->activeChannel]['icon'] }}</span>
                        <div>
                            <h2 style="font-size: 1.125rem; font-weight: bold; color: #0f172a;">
                                {{ $this->channels[$this->activeChannel]['name'] }}
                            </h2>
                            <p style="font-size: 0.8rem; color: #64748b;">
                                {{ $this->channels[$this->activeChannel]['description'] }}
                            </p>
                        </div>
                    @elseif($this->activeRecipient)
                        @php
                            $recipient = $this->users->find($this->activeRecipient);
                            $isOnline = $this->isUserOnline($recipient);
                        @endphp
                        <div style="position: relative; margin-right: 12px;">
                            <div
                                style="width: 36px; height: 36px; border-radius: 50%; background-color: #3b82f6; display: flex; items-center; justify-content: center; color: white; font-weight: bold; line-height: 36px; text-align: center;">
                                {{ substr($recipient->name, 0, 1) }}
                            </div>
                            <div
                                style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; border-radius: 50%; background-color: {{ $isOnline ? '#22c55e' : '#9ca3af' }}; border: 2px solid white;">
                            </div>
                        </div>
                        <div>
                            <h2 style="font-size: 1.125rem; font-weight: bold; color: #0f172a;">
                                {{ $recipient->name }}
                            </h2>
                            <p style="font-size: 0.8rem; color: #64748b;">
                                Direct Message
                            </p>
                        </div>
                    @endif
                </div>

                <!-- Action Buttons (Placeholder for future) -->
                <div style="display: flex; gap: 8px;">
                    <!-- <button style="padding: 6px; color: #94a3b8; hover:text-slate-600;">🔍</button> -->
                </div>
            </div>

            <!-- Messages Stream -->
            <div
                style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column-reverse; gap: 20px;">
                @forelse($this->messages as $msg)
                    @php
                        $isMe = $msg->user_id === auth()->id();
                        $roleBadge = $this->getUserRoleBadge($msg->user);
                    @endphp
                    <div
                        style="display: flex; gap: 16px; align-items: flex-start; {{ $isMe ? 'flex-direction: row-reverse;' : '' }}">
                        <!-- Avatar -->
                        <div
                            style="width: 40px; height: 40px; border-radius: 8px; background-color: {{ $msg->user_id % 2 == 0 ? '#3b82f6' : '#8b5cf6' }}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            {{ substr($msg->user->name, 0, 1) }}
                        </div>

                        <!-- Content -->
                        <div
                            style="max-width: 70%; {{ $isMe ? 'align-items: flex-end; display: flex; flex-direction: column;' : '' }}">
                            <div
                                style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; {{ $isMe ? 'flex-direction: row-reverse;' : '' }}">
                                <span style="font-weight: bold; color: #0f172a; font-size: 0.9rem;">
                                    {{ $msg->user->name }}
                                </span>
                                <span
                                    style="font-size: 0.7rem; padding: 1px 4px; border-radius: 4px; background-color: {{ $roleBadge['color'] }}20; color: {{ $roleBadge['color'] }}; border: 1px solid {{ $roleBadge['color'] }}40;">
                                    {{ $roleBadge['short'] }}
                                </span>
                                <span style="font-size: 0.75rem; color: #94a3b8;">
                                    {{ $msg->created_at->format('H:i') }}
                                </span>
                            </div>
                            <div style="
                                        padding: 12px 16px; 
                                        border-radius: 12px; 
                                        background-color: {{ $isMe ? '#3b82f6' : 'white' }}; 
                                        color: {{ $isMe ? 'white' : '#1e293b' }}; 
                                        box-shadow: 0 1px 2px rgba(0,0,0,0.05); 
                                        {{ $isMe ? 'border-bottom-right-radius: 2px;' : 'border-bottom-left-radius: 2px;' }}
                                        font-size: 0.95rem; 
                                        line-height: 1.5;
                                        overflow-wrap: break-word;
                                    ">
                                @if($msg->attachment_url)
                                    <div style="margin-bottom: 8px;">
                                        @if(Str::endsWith($msg->attachment_url, ['.jpg', '.jpeg', '.png', '.gif', '.webp']))
                                            <a href="{{ asset('storage/' . $msg->attachment_url) }}" target="_blank">
                                                <img src="{{ asset('storage/' . $msg->attachment_url) }}"
                                                    style="max-width: 100%; border-radius: 8px; max-height: 200px; object-fit: cover;" />
                                            </a>
                                        @else
                                            <a href="{{ asset('storage/' . $msg->attachment_url) }}" target="_blank"
                                                style="display: flex; align-items: center; gap: 8px; padding: 8px; background-color: rgba(0,0,0,0.1); border-radius: 6px; color: inherit; text-decoration: none;">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                                    viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                </svg>
                                                <span style="font-size: 0.85rem; text-decoration: underline;">Available
                                                    Attachment</span>
                                            </a>
                                        @endif
                                    </div>
                                @endif
                                {!! $this->formatMessageContent($msg->content) !!}
                            </div>
                        </div>
                    </div>
                @empty
                    <div
                        style="text-align: center; padding: 40px; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 10px;">
                        <span style="font-size: 2rem;">📭</span>
                        <span>No messages yet in this channel.</span>
                        <span style="font-size: 0.85rem;">Be the first to say hello!</span>
                    </div>
                @endforelse
            </div>

            <!-- Input Area -->
            <div style="padding: 20px; background-color: white; border-top: 1px solid #e2e8f0;">

                @if($attachment)
                    <div
                        style="margin-bottom: 10px; padding: 8px; background-color: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 0.85rem; color: #475569;">
                            📎 {{ $attachment->getClientOriginalName() }}
                            <span style="color: #94a3b8; font-size: 0.75rem;">(Ready to send)</span>
                        </span>
                        <button wire:click="resetAttachment"
                            style="background: none; border: none; cursor: pointer; color: #ef4444; font-weight: bold;">✕</button>
                    </div>
                @endif

                <form wire:submit="sendMessage" style="position: relative;">
                    <div
                        style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background-color: white; transition: box-shadow 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">

                        <input type="text" wire:model="message"
                            style="width: 100%; border: none; padding: 16px; font-size: 0.95rem; outline: none; background: white; color: #0f172a;"
                            placeholder="Type a message... Use @ to mention" autofocus autocomplete="off" />

                        <div
                            style="display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <!-- File Upload Button -->
                                <label for="file-upload"
                                    style="cursor: pointer; color: #64748b; display: flex; align-items: center; padding: 4px; border-radius: 4px; transition: background 0.2s;"
                                    class="hover:bg-slate-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                </label>
                                <input type="file" id="file-upload" wire:model="attachment" style="display: none;" />

                                <!-- Formatting Hints -->
                                <div
                                    style="display: flex; gap: 10px; font-size: 0.75rem; color: #64748b; border-left: 1px solid #cbd5e1; padding-left: 12px;">
                                    <span><b>Markdown</b> supported</span>
                                </div>
                            </div>

                            <button type="submit"
                                style="background-color: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: background 0.2s; display: flex; align-items: center; gap: 6px;">
                                <span>Send</span>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                    class="w-4 h-4">
                                    <path
                                        d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 004.426 9H13a.75.75 0 010 1.5H4.426a1.5 1.5 0 00-.733.596l-1.414 4.925a.75.75 0 001.076.923l15-7a.75.75 0 000-1.386l-15-7z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</x-filament-panels::page>