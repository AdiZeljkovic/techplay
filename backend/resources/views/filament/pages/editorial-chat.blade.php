<x-filament-panels::page>
    <div
        style="display: flex; flex-direction: row; height: 75vh; width: 100%; border: 1px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; background-color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

        <!-- Sidebar (Dark) -->
        <div
            style="width: 260px; display: flex; flex-direction: column; background-color: #1a2234; color: #94a3b8; border-right: 1px solid #1e293b; flex-shrink: 0;">
            <!-- Header -->
            <div
                style="height: 60px; display: flex; align-items: center; padding-left: 20px; font-weight: bold; color: white; border-bottom: 1px solid #1e293b; background-color: #1a2234;">
                TechPlay Redakcija
            </div>

            <!-- Scrollable List -->
            <div style="flex: 1; overflow-y: auto; padding-top: 20px;">

                <!-- Channels -->
                <div style="margin-bottom: 30px;">
                    <div
                        style="padding: 0 20px; margin-bottom: 10px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">
                        Channels
                    </div>
                    @foreach(['general', 'news', 'reviews', 'random'] as $channel)
                        <button wire:click="setChannel('{{ $channel }}')"
                            style="width: 100%; text-align: left; padding: 8px 20px; display: flex; align-items: center; gap: 10px; cursor: pointer; border: none; background: {{ $this->activeChannel === $channel ? '#1d4ed8' : 'transparent' }}; color: {{ $this->activeChannel === $channel ? 'white' : 'inherit' }};">
                            <span style="opacity: 0.7;">#</span>
                            <span>{{ ucfirst($channel) }}</span>
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
                        <button wire:click="setRecipient({{ $user->id }})"
                            style="width: 100%; text-align: left; padding: 8px 20px; display: flex; align-items: center; gap: 10px; cursor: pointer; border: none; background: {{ $this->activeRecipient === $user->id ? '#1d4ed8' : 'transparent' }}; color: {{ $this->activeRecipient === $user->id ? 'white' : 'inherit' }};">
                            <div
                                style="width: 10px; height: 10px; border-radius: 50%; background-color: {{ $user->id % 2 == 0 ? '#22c55e' : '#9ca3af' }};">
                            </div>
                            <span>{{ $user->name }}</span>
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
                style="height: 60px; display: flex; align-items: center; padding: 0 24px; background-color: white; border-bottom: 1px solid #e2e8f0; flex-shrink: 0;">
                @if($this->activeChannel)
                    <span style="font-size: 1.5rem; color: #cbd5e1; margin-right: 8px;">#</span>
                    <h2 style="font-size: 1.125rem; font-weight: bold; color: #0f172a;">{{ ucfirst($this->activeChannel) }}
                    </h2>
                @elseif($this->activeRecipient)
                    <div
                        style="width: 12px; height: 12px; border-radius: 50%; background-color: #22c55e; margin-right: 12px;">
                    </div>
                    <h2 style="font-size: 1.125rem; font-weight: bold; color: #0f172a;">
                        {{ $this->users->find($this->activeRecipient)?->name }}
                    </h2>
                @endif
            </div>

            <!-- Messages Stream -->
            <!-- Order logic: 
                 We fetch latest messages. [MsgNewest, MsgOldest].
                 Standard chat should show Oldest at Top, Newest at Bottom.
                 So we need to reverse the collection in PHP or Iterate in Reverse?
                 Actually, standard fetch `latest()` gets Newest First.
                 If we simply iterate Newest First, standard HTML stacking puts Newest at Top.
            -->
            <div
                style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column-reverse; gap: 20px;">
                @forelse($this->messages as $msg)
                    <div style="display: flex; gap: 16px; align-items: flex-start;">
                        <!-- Avatar -->
                        <div
                            style="width: 40px; height: 40px; border-radius: 6px; background-color: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">
                            {{ substr($msg->user->name, 0, 1) }}
                        </div>

                        <!-- Content -->
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px;">
                                <span style="font-weight: bold; color: #0f172a; font-size: 0.95rem;">
                                    {{ $msg->user->name }}
                                </span>
                                <span style="font-size: 0.75rem; color: #64748b;">
                                    {{ $msg->created_at->format('H:i') }}
                                </span>
                            </div>
                            <div style="color: #334155; line-height: 1.5; font-size: 0.95rem; white-space: pre-wrap;">
                                {{ $msg->content }}</div>
                        </div>
                    </div>
                @empty
                    <div style="text-align: center; padding: 40px; color: #94a3b8;">
                        No messages yet.
                    </div>
                @endforelse
            </div>

            <!-- Input Area -->
            <div style="padding: 20px; background-color: white; border-top: 1px solid #e2e8f0;">
                <form wire:submit="sendMessage" style="position: relative;">
                    <div
                        style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background-color: white; transition: box-shadow 0.2s;">
                        <!-- Dummy Toolbar -->
                        <div
                            style="padding: 8px; background-color: #f8fafc; border-bottom: 1px solid #f1f5f9; display: flex; gap: 8px; color: #64748b;">
                            <span style="font-size: 12px; font-weight: bold;">B</span>
                            <span style="font-size: 12px; font-style: italic;">I</span>
                        </div>

                        <input type="text" wire:model="message"
                            style="width: 100%; border: none; padding: 12px 16px; font-size: 0.95rem; outline: none; background: transparent;"
                            placeholder="Message..." autofocus autocomplete="off" />

                        <div
                            style="display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background-color: white;">
                            <span style="font-size: 10px; color: #94a3b8;">Return to send</span>
                            <button type="submit"
                                style="background-color: #15803d; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem;">
                                Send
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</x-filament-panels::page>