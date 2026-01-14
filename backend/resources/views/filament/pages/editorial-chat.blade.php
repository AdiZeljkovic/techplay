<x-filament-panels::page class="h-[calc(100vh-4rem)] flex flex-col">
    <div
        class="flex flex-1 w-full overflow-hidden bg-white border rounded-xl dark:bg-gray-900 dark:border-gray-800 shadow-xl"
        style="height: 75vh;">

        <!-- Sidebar -->
        <div class="flex flex-col w-72 bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex-shrink-0">
            <!-- Header -->
            <div class="flex items-center h-16 px-6 font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <span class="mr-2 text-[#FC4100]">◈</span> TechPlay Redakcija
            </div>

            <!-- Scrollable List -->
            <div class="flex-1 overflow-y-auto py-4 space-y-6">

                <!-- Channels -->
                <div>
                    <div class="flex items-center justify-between px-6 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                        <span>Channels</span>
                        @if(auth()->user()->hasRole('Super Admin'))
                         <a href="{{ \App\Filament\Resources\EditorialChannelResource::getUrl() }}" class="text-xs hover:text-[#FC4100] transition-colors" title="Manage Channels">⚙️</a>
                        @endif
                    </div>
                    @foreach($this->channels as $channel)
                        <button wire:click="setChannel('{{ $channel->slug }}')"
                            class="w-full text-left px-6 py-2 flex items-center gap-3 transition-colors duration-200
                            {{ $this->activeChannel === $channel->slug 
                                ? 'bg-[#FC4100]/10 text-[#FC4100] border-r-2 border-[#FC4100]' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200' 
                            }}">
                            <span class="text-lg">{{ $channel->icon }}</span>
                            <span class="text-sm font-medium truncate">{{ $channel->name }}</span>
                            @if($channel->is_private)
                                <span class="ml-auto text-xs text-gray-400">🔒</span>
                            @endif
                        </button>
                    @endforeach
                </div>

                <!-- DMs -->
                <div>
                    <div class="px-6 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                        Direct Messages
                    </div>
                    @foreach($this->users as $user)
                        @php
                            $roleBadge = $this->getUserRoleBadge($user);
                            $isOnline = $this->isUserOnline($user);
                        @endphp
                        <button wire:click="setRecipient({{ $user->id }})"
                            class="w-full text-left px-6 py-2.5 flex items-center gap-3 transition-colors duration-200 group
                            {{ $this->activeRecipient === $user->id 
                                ? 'bg-[#FC4100]/10 text-[#FC4100] border-r-2 border-[#FC4100]' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900' 
                            }}">

                            <!-- Avatar -->
                            <div class="relative flex-shrink-0">
                                @if($user->avatar_url)
                                    <img src="{{ $user->user_avatar }}" class="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800" />
                                @else
                                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white dark:ring-gray-800"
                                        style="background-color: {{ $roleBadge['color'] }};">
                                        {{ substr($user->name, 0, 1) }}
                                    </div>
                                @endif
                                <div class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-950 {{ $isOnline ? 'bg-green-500' : 'bg-gray-400' }}"></div>
                            </div>

                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm font-medium truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors {{ $this->activeRecipient === $user->id ? 'text-[#FC4100]' : '' }}">
                                        {{ $user->name }}
                                    </span>
                                    @if($user->unread_count > 0)
                                        <span class="px-1.5 py-0.5 text-[0.65rem] font-bold text-white bg-red-500 rounded-full animate-pulse">
                                            {{ $user->unread_count }}
                                        </span>
                                    @endif
                                </div>
                                <div class="flex items-center gap-1.5 mt-0.5">
                                    <span class="text-[0.6rem] px-1.5 py-px rounded border"
                                        style="color: {{ $roleBadge['color'] }}; background-color: {{ $roleBadge['color'] }}15; border-color: {{ $roleBadge['color'] }}30;">
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
        <div class="flex flex-col flex-1 min-w-0 bg-white dark:bg-gray-900"
            wire:poll.3s data-last-message-id="{{ $this->messages->first()?->id }}">

            <!-- Chat Header -->
            <div class="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                <div class="flex items-center gap-4">
                    @if($this->activeChannel)
                        @php $channel = $this->channels->firstWhere('slug', $this->activeChannel); @endphp
                        @if($channel)
                            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-2xl">
                                {{ $channel->icon }}
                            </div>
                            <div>
                                <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                                    {{ $channel->name }}
                                </h2>
                                <p class="text-xs text-gray-500 dark:text-gray-400">
                                    {{ $channel->description }}
                                </p>
                            </div>
                        @endif
                    @elseif($this->activeRecipient)
                        @php
                            $recipient = $this->users->find($this->activeRecipient);
                            $isOnline = $this->isUserOnline($recipient);
                        @endphp
                        <div class="relative">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-[#FC4100]">
                                {{ substr($recipient->name, 0, 1) }}
                            </div>
                            <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 {{ $isOnline ? 'bg-green-500' : 'bg-gray-400' }}"></div>
                        </div>
                        <div>
                            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                                {{ $recipient->name }}
                            </h2>
                            <p class="text-xs text-green-500 font-medium">
                                {{ $isOnline ? 'Active now' : 'Offline' }}
                            </p>
                        </div>
                    @endif
                </div>
            </div>

            <!-- Pinned Messages -->
            @if($this->activeChannel && $this->pinnedMessages->count() > 0)
                <div class="px-6 py-2 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800/30 flex items-start gap-3">
                    <span class="text-amber-500 text-lg">📌</span>
                    <div class="flex-1 overflow-x-auto flex gap-4 no-scrollbar">
                        @foreach($this->pinnedMessages as $pinned)
                            <div class="flex items-center gap-2 text-xs min-w-[200px] p-2 rounded bg-white dark:bg-gray-800 shadow-sm border border-amber-100 dark:border-amber-900/20">
                                <span class="font-bold text-gray-900 dark:text-white">{{ $pinned->user->name }}:</span>
                                <span class="text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{{ $pinned->content }}</span>
                                <button wire:click="unpinMessage({{ $pinned->id }})" class="ml-auto text-amber-600 hover:text-amber-800 dark:hover:text-amber-400">✕</button>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif

            <!-- Messages Stream -->
            <div class="flex-1 overflow-y-auto px-6 py-6 flex flex-col-reverse gap-6 bg-slate-50 dark:bg-gray-950/50">
                @forelse($this->messages as $msg)
                    @php
                        $isMe = $msg->user_id === auth()->id();
                        $roleBadge = $this->getUserRoleBadge($msg->user);
                    @endphp
                    <div class="group flex gap-4 {{ $isMe ? 'flex-row-reverse' : '' }}" x-data="{ showActions: false }" @mouseenter="showActions = true" @mouseleave="showActions = false">
                        
                        <!-- Avatar -->
                        <div class="flex-shrink-0 mt-1">
                            <div class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm"
                                style="background-color: {{ $isMe ? '#FC4100' : ($msg->user_id % 2 == 0 ? '#3b82f6' : '#8b5cf6') }};">
                                {{ substr($msg->user->name, 0, 1) }}
                            </div>
                        </div>

                        <!-- Content Body -->
                        <div class="flex flex-col max-w-[70%] {{ $isMe ? 'items-end' : 'items-start' }}">
                            
                            <!-- Metadata -->
                            <div class="flex items-center gap-2 mb-1 {{ $isMe ? 'flex-row-reverse' : '' }}">
                                <span class="text-sm font-bold text-gray-900 dark:text-white hover:underline cursor-pointer">
                                    {{ $msg->user->name }}
                                </span>
                                <span class="text-[0.6rem] px-1.5 py-px rounded border"
                                    style="color: {{ $roleBadge['color'] }}; background-color: {{ $roleBadge['color'] }}15; border-color: {{ $roleBadge['color'] }}30;">
                                    {{ $roleBadge['short'] }}
                                </span>
                                <span class="text-xs text-gray-400">
                                    {{ $msg->created_at->format('H:i') }}
                                </span>
                            </div>

                            <!-- Bubble -->
                            <div class="relative group/bubble">
                                <div class="px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words
                                    {{ $isMe 
                                        ? 'bg-[#FC4100] text-white rounded-br-none' 
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700' 
                                    }}">
                                    
                                    @if($msg->attachment_url)
                                        <div class="mb-2">
                                            @if(Str::endsWith($msg->attachment_url, ['.jpg', '.jpeg', '.png', '.gif', '.webp']))
                                                <a href="{{ asset('storage/' . $msg->attachment_url) }}" target="_blank" class="block overflow-hidden rounded-lg">
                                                    <img src="{{ asset('storage/' . $msg->attachment_url) }}" class="max-w-full max-h-60 object-cover hover:scale-105 transition-transform" />
                                                </a>
                                            @else
                                                <a href="{{ asset('storage/' . $msg->attachment_url) }}" target="_blank" class="flex items-center gap-2 p-3 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors">
                                                    <x-heroicon-o-paper-clip class="w-5 h-5"/>
                                                    <span class="underline">Download Attachment</span>
                                                </a>
                                            @endif
                                        </div>
                                    @endif

                                    {!! $this->formatMessageContent($msg->content) !!}
                                </div>

                                <!-- Reactions Display -->
                                @if($msg->reactions->count() > 0)
                                    <div class="absolute -bottom-6 {{ $isMe ? 'right-0' : 'left-0' }} flex gap-1">
                                        @foreach($msg->reactions->groupBy('emoji') as $emoji => $reactions)
                                        <button wire:click="toggleReaction({{ $msg->id }}, '{{ $emoji }}')"
                                            class="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border bg-white dark:bg-gray-800 shadow-sm
                                            {{ $reactions->where('user_id', auth()->id())->count() > 0 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700' }}">
                                            <span>{{ $emoji }}</span>
                                            <span class="font-semibold text-gray-600 dark:text-gray-400">{{ $reactions->count() }}</span>
                                        </button>
                                        @endforeach
                                    </div>
                                @endif

                                <!-- Hover Actions -->
                                <div class="absolute -top-3 {{ $isMe ? 'left-auto right-full mr-2' : 'right-auto left-full ml-2' }} hidden group-hover/bubble:flex items-center gap-1 bg-white dark:bg-gray-800 shadow-md border dark:border-gray-700 rounded-full px-2 py-1 z-10">
                                    <!-- Reactions -->
                                    <div class="flex gap-0.5 border-r border-gray-200 dark:border-gray-700 pr-1 mr-1">
                                        @foreach(['👍', '❤️', '😂', '🔥', '👀'] as $emoji)
                                            <button wire:click="toggleReaction({{ $msg->id }}, '{{ $emoji }}')" class="hover:scale-125 transition-transform p-0.5">{{ $emoji }}</button>
                                        @endforeach
                                    </div>
                                    
                                    @if(!$msg->is_pinned && $this->activeChannel)
                                        <button wire:click="pinMessage({{ $msg->id }})" class="p-1 text-gray-400 hover:text-amber-500" title="Pin">
                                            <x-heroicon-o-bookmark class="w-4 h-4" />
                                        </button>
                                    @endif

                                    @can('update', \App\Models\Task::class)
                                        <button wire:click="createTaskFromMessage({{ $msg->id }})" class="p-1 text-gray-400 hover:text-green-500" title="Create Task">
                                            <x-heroicon-o-check-circle class="w-4 h-4" />
                                        </button>
                                    @endcan
                                </div>
                            </div>
                        </div>
                    </div>
                @empty
                    <div class="flex flex-col items-center justify-center flex-1 text-center opacity-50">
                        <x-heroicon-o-chat-bubble-bottom-center-text class="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
                        <h3 class="text-xl font-bold text-gray-400 dark:text-gray-600">No messages yet</h3>
                        <p class="text-gray-400 dark:text-gray-600">Start the conversation!</p>
                    </div>
                @endforelse
            </div>

            <!-- Input Area -->
            <div class="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                
                @if($attachment)
                    <div class="flex items-center justify-between p-3 mb-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <div class="flex items-center gap-2">
                            <span class="text-xl">📎</span>
                            <span class="text-sm font-medium text-blue-700 dark:text-blue-300">{{ $attachment->getClientOriginalName() }}</span>
                        </div>
                        <button wire:click="resetAttachment" class="text-gray-400 hover:text-red-500">✕</button>
                    </div>
                @endif

                <form wire:submit="sendMessage" class="relative" x-data="{ showEmojis: false }">
                    <!-- Emoji Picker -->
                     <div x-show="showEmojis" @click.away="showEmojis = false"
                        x-transition
                        class="absolute bottom-full left-0 mb-4 w-72 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-2xl p-4 grid grid-cols-6 gap-2 z-50">
                        @foreach(['😀', '😂', '😍', '😎', '🤔', '😅', '😭', '👍', '👎', '🔥', '❤️', '🎉', '🚀', '👀', '✅', '❌', '🛑', '⚠️', '📢', '🎮', '⚽', '🎲', '🎵', '🍔'] as $emoji)
                            <button type="button" @click="$wire.set('message', $wire.message + '{{ $emoji }}'); showEmojis=false; $refs.messageInput.focus()"
                                class="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded">{{ $emoji }}</button>
                        @endforeach
                    </div>

                    <div class="relative bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus-within:ring-2 focus-within:ring-[#FC4100]/20 focus-within:border-[#FC4100] transition-all shadow-inner">
                        <input type="text" wire:model="message" x-ref="messageInput"
                            class="w-full bg-transparent border-none py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0"
                            placeholder="Message #{{ $this->activeChannel ? ($this->channels->firstWhere('slug', $this->activeChannel)?->name ?? 'chat') : 'User' }}..."
                            autofocus autocomplete="off" />

                        <div class="flex items-center justify-between px-2 py-2 border-t border-gray-100 dark:border-gray-800/50">
                            <div class="flex items-center gap-1">
                                <button type="button" @click="showEmojis = !showEmojis" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                    <x-heroicon-o-face-smile class="w-5 h-5" />
                                </button>
                                <label class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
                                    <input type="file" wire:model="attachment" class="hidden" />
                                    <x-heroicon-o-paper-clip class="w-5 h-5" />
                                </label>
                            </div>
                            
                            <button type="submit" 
                                class="bg-[#FC4100] hover:bg-[#d93800] text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow-lg shadow-[#FC4100]/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                wire:loading.attr="disabled">
                                <span>Send</span>
                                <x-heroicon-m-paper-airplane class="w-4 h-4 -rotate-45" />
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</x-filament-panels::page>

<style>
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>

<script>
    document.addEventListener('livewire:initialized', () => {
        // Scroll to bottom on load and message update
        const scrollToBottom = () => {
             const container = document.querySelector('.flex-col-reverse');
             if(container) container.scrollTop = container.scrollHeight;
        };

        Livewire.hook('morph.updated', ({ component, el }) => {
            // Optional: sophisticated scroll handling could go here
        });
    });
</script>
<script>
    document.addEventListener('DOMContentLoaded', () => {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }

        let lastMessageId = "{{ $this->messages->first()?->id }}";

        setInterval(() => {
            const el = document.querySelector('[data-last-message-id]');
            if (!el) return;

            const newMessageId = el.getAttribute('data-last-message-id');
            if (newMessageId && newMessageId != lastMessageId) {
                lastMessageId = newMessageId;

                // Play sound
                const audio = new Audio('https://inv.tux.Pizza/preview/1029/30ss.mp3'); // Simple notification sound placeholder or local asset
                // audio.play().catch(e => console.log('Audio play failed', e));

                // Show notification
                if (Notification.permission === "granted" && document.hidden) {
                    new Notification("TechPlay Redakcija", {
                        body: "Nova poruka u chatu!",
                        icon: "/images/logo.png"
                    });
                }
            }
        }, 2000);
    });
</script>