<?php

namespace App\Filament\Pages;

use App\Models\EditorialMessage;
use App\Models\Task;
use App\Models\User;
use App\Filament\Resources\Tasks\TaskResource;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Livewire\WithFileUploads;

use App\Models\EditorialChannel;
use App\Models\EditorialMessageReaction;
use App\Jobs\FetchOgData;

class EditorialChat extends Page
{
    use WithFileUploads;

    public static function getNavigationIcon(): ?string
    {
        return 'heroicon-o-chat-bubble-left-right';
    }

    public static function getNavigationLabel(): string
    {
        return 'Editorial Chat';
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Editorial Tools';
    }

    public static function canAccess(): bool
    {
        $user = auth()->user();
        return $user && (
            $user->hasRole(['Super Admin', 'Editor-in-Chief', 'Editor', 'Journalist', 'Moderator']) ||
            in_array($user->role ?? '', ['admin', 'super_admin'])
        );
    }

    public function mount()
    {
        if (request()->has('msg')) {
            $msgId = request()->query('msg');
            $message = EditorialMessage::find($msgId);
            if ($message) {
                if ($message->channel) {
                    $this->activeChannel = $message->channel;
                    $this->activeRecipient = null;
                } elseif ($message->recipient_id) {
                    $otherId = $message->user_id === auth()->id() ? $message->recipient_id : $message->user_id;
                    $this->activeRecipient = $otherId;
                    $this->activeChannel = null;
                }

                $this->highlightMessageId = $msgId;

                if ($message->parent_id) {
                    $this->activeThread = $message->parent_id;
                }
            }
        }

        if ($this->activeChannel) {
            $key = 'user_' . auth()->id() . '_channel_' . $this->activeChannel . '_read_at';
            $this->previousReadAt = Cache::get($key);
            Cache::put($key, now(), now()->addDays(30));
        }
    }

    protected string $view = 'filament.pages.editorial-chat';

    public $message = '';
    public $activeChannel = 'general';
    public $activeRecipient = null;
    public $attachment = null;

    // Editing state
    public $editingMessageId = null;
    public $editingContent = '';

    // Search
    public $search = '';
    public $showSearch = false;

    // Threading
    public $activeThread = null;
    public $threadMessage = '';

    // Unread Divider
    public $previousReadAt = null;

    // Permalink
    public $highlightMessageId = null;

    // Giphy
    public $showGiphy = false;
    public $giphySearch = '';
    public $giphyResults = [];

    // Voice messages
    public $voiceMessage = [];

    // Channel topic editing
    public $editingTopic = false;
    public $topicContent = '';

    // User presence
    public $manualStatus = null;

    // Infinite scroll
    public $messageLimit = 50;
    public $loadingMore = false;

    // Custom status
    public $statusText = '';
    public $statusEmoji = '';

    // Computed property for channels
    public function getChannelsProperty()
    {
        $user = auth()->user();

        return EditorialChannel::orderBy('sort_order', 'asc')->get()->filter(function ($channel) use ($user) {
            if (!$channel->is_private) {
                return true;
            }
            $allowed = $channel->allowed_roles ?? [];
            if (in_array($user->role ?? '', ['admin', 'super_admin'])) {
                return true;
            }
            return $user->hasRole($allowed);
        });
    }

    // Editorial roles for filtering
    protected array $editorialRoles = [
        'Super Admin',
        'Editor-in-Chief',
        'Editor',
        'Journalist',
        'Moderator'
    ];

    public function setChannel($channelSlug)
    {
        $this->activeChannel = $channelSlug;
        $this->activeRecipient = null;

        $key = 'user_' . auth()->id() . '_channel_' . $this->activeChannel . '_read_at';
        $this->previousReadAt = Cache::get($key);
        Cache::put($key, now(), now()->addDays(30));

        $this->activeThread = null;
        $this->messageLimit = 50;
        $this->updateLastSeen();
        $this->resetAttachment();
    }

    public function setRecipient($userId)
    {
        $this->activeRecipient = $userId;
        $this->activeChannel = null;
        $this->messageLimit = 50;

        $firstUnread = EditorialMessage::where('recipient_id', auth()->id())
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->oldest()
            ->first();

        if ($firstUnread) {
            $this->previousReadAt = $firstUnread->created_at->subSecond();
            EditorialMessage::where('recipient_id', auth()->id())
                ->where('user_id', $userId)
                ->update(['read_at' => now()]);

            broadcast(new \App\Events\EditorialMessageRead(auth()->id(), $userId))->toOthers();
        } else {
            $this->previousReadAt = now();
        }

        $this->activeThread = null;
        $this->updateLastSeen();
        $this->resetAttachment();
    }

    protected function updateLastSeen()
    {
        try {
            auth()->user()->update(['last_seen_at' => now()]);
        } catch (\Exception $e) {
            // gracefully ignore if column missing
        }
    }

    public function resetAttachment()
    {
        $this->attachment = null;
    }

    // === Rate Limiting ===

    protected function isRateLimited(): bool
    {
        $key = 'chat_rate_limit:' . auth()->id();
        $count = Cache::get($key, 0);

        if ($count >= 5) {
            Notification::make()
                ->title('Slow down!')
                ->body('You can send up to 5 messages every 10 seconds.')
                ->warning()
                ->send();
            return true;
        }

        Cache::put($key, $count + 1, now()->addSeconds(10));
        return false;
    }

    // === Typing Indicators ===

    public function updatedMessage($value)
    {
        if (strlen($value) > 0) {
            $context = $this->activeChannel ?? 'dm_' . $this->activeRecipient;
            Cache::put("typing:{$context}:" . auth()->id(), auth()->user()->name, now()->addSeconds(4));
        }
        $this->updateLastSeen();
    }

    public function getTypingUsersProperty(): array
    {
        $context = $this->activeChannel ?? 'dm_' . $this->activeRecipient;
        if (!$context) return [];

        $typingUsers = [];
        $usersToCheck = $this->activeRecipient
            ? [$this->activeRecipient]
            : $this->users->pluck('id')->toArray();

        foreach ($usersToCheck as $userId) {
            if ($userId == auth()->id()) continue;
            $name = Cache::get("typing:{$context}:{$userId}");
            if ($name) $typingUsers[] = $name;
        }
        return $typingUsers;
    }

    // === Send Messages ===

    public function sendMessage()
    {
        if ($this->isRateLimited()) return;

        $this->validate([
            'message' => 'required_without:attachment|string|max:2000',
            'attachment' => 'nullable|file|max:10240',
        ]);

        $mentionedIds = $this->parseMentions($this->message);

        // @channel and @here broadcast mentions
        $mentionedIds = $this->resolveBroadcastMentions($this->message, $mentionedIds);

        $attachmentUrl = null;
        if ($this->attachment) {
            $attachmentUrl = $this->attachment->store('editorial-chat', 'public');
        }

        $message = EditorialMessage::create([
            'user_id' => auth()->id(),
            'content' => $this->message,
            'channel' => $this->activeChannel,
            'recipient_id' => $this->activeRecipient,
            'mentioned_user_ids' => $mentionedIds,
            'attachment_url' => $attachmentUrl,
        ]);

        // Dispatch OG data fetch for URLs in message
        $this->dispatchOgFetch($message);

        // Send notifications to mentioned users
        $notifyIds = collect($mentionedIds)->reject(auth()->id())->unique()->values();
        foreach ($notifyIds as $userId) {
            $mentionedUser = User::find($userId);
            if ($mentionedUser) {
                Notification::make()
                    ->title('Mentioned by ' . auth()->user()->name)
                    ->body(Str::limit($this->message, 100))
                    ->actions([
                        \Filament\Actions\Action::make('view')
                            ->label('View')
                            ->url('/admin/editorial-chat?msg=' . $message->id),
                    ])
                    ->sendToDatabase($mentionedUser);
            }
        }

        broadcast(new \App\Events\EditorialMessageSent($message))->toOthers();

        $this->message = '';
        $this->attachment = null;
        $this->updateLastSeen();

        // Clear typing indicator
        $context = $this->activeChannel ?? 'dm_' . $this->activeRecipient;
        Cache::forget("typing:{$context}:" . auth()->id());
    }

    protected function resolveBroadcastMentions(string $content, array $existingIds): array
    {
        if (!$this->activeChannel) return $existingIds;

        $mentionedIds = $existingIds;

        if (str_contains($content, '@channel')) {
            $channelUsers = User::whereHas('roles', fn($q) => $q->whereIn('name', $this->editorialRoles))
                ->where('id', '!=', auth()->id())
                ->pluck('id')
                ->toArray();
            $mentionedIds = array_unique(array_merge($mentionedIds, $channelUsers));
        } elseif (str_contains($content, '@here')) {
            $onlineUsers = User::whereHas('roles', fn($q) => $q->whereIn('name', $this->editorialRoles))
                ->where('id', '!=', auth()->id())
                ->where('last_seen_at', '>=', now()->subMinutes(5))
                ->pluck('id')
                ->toArray();
            $mentionedIds = array_unique(array_merge($mentionedIds, $onlineUsers));
        }

        return $mentionedIds;
    }

    protected function dispatchOgFetch(EditorialMessage $message): void
    {
        if (!$message->content) return;

        preg_match('/(https?:\/\/[^\s<>"\')]+)/i', $message->content, $matches);

        if (!empty($matches[1])) {
            FetchOgData::dispatchSync($message->id, $matches[1]);
        }
    }

    public function sendThreadReply()
    {
        if ($this->isRateLimited()) return;

        $this->validate([
            'threadMessage' => 'required',
        ]);

        if (!$this->activeThread)
            return;

        $mentionedIds = $this->parseMentions($this->threadMessage);

        $message = EditorialMessage::create([
            'user_id' => auth()->id(),
            'content' => $this->threadMessage,
            'channel' => $this->activeChannel,
            'mentioned_user_ids' => $mentionedIds,
            'parent_id' => $this->activeThread,
        ]);

        broadcast(new \App\Events\EditorialMessageSent($message))->toOthers();

        $this->threadMessage = '';
        $this->updateLastSeen();
    }

    // === Giphy ===

    public function updatedGiphySearch()
    {
        if (strlen($this->giphySearch) < 2) {
            $this->giphyResults = [];
            return;
        }

        $response = \Illuminate\Support\Facades\Http::get('https://api.giphy.com/v1/gifs/search', [
            'api_key' => env('GIPHY_API_KEY'),
            'q' => $this->giphySearch,
            'limit' => 20,
            'rating' => 'g'
        ]);

        if ($response->successful()) {
            $this->giphyResults = collect($response->json('data'))->map(function ($gif) {
                return [
                    'id' => $gif['id'],
                    'url' => $gif['images']['fixed_height']['url'],
                    'title' => $gif['title'],
                ];
            })->toArray();
        }
    }

    public function selectGiphy($url)
    {
        if ($this->isRateLimited()) return;

        $message = EditorialMessage::create([
            'user_id' => auth()->id(),
            'content' => '',
            'message_type' => 'gif',
            'channel' => $this->activeChannel,
            'recipient_id' => $this->activeRecipient,
            'mentioned_user_ids' => [],
            'attachment_url' => $url,
            'parent_id' => $this->activeThread,
        ]);

        broadcast(new \App\Events\EditorialMessageSent($message))->toOthers();

        $this->showGiphy = false;
        $this->giphySearch = '';
        $this->giphyResults = [];
        $this->updateLastSeen();
    }

    // === Threading ===

    public function setActiveThread($messageId)
    {
        $this->activeThread = $messageId;
    }

    public function closeThread()
    {
        $this->activeThread = null;
    }

    public function getThreadMessagesProperty()
    {
        if (!$this->activeThread)
            return collect();

        return EditorialMessage::with(['user.roles', 'reactions.user'])
            ->where('parent_id', $this->activeThread)
            ->oldest()
            ->get();
    }

    public function getActiveThreadMessageProperty()
    {
        return EditorialMessage::with('user')->find($this->activeThread);
    }

    // === Quoting ===

    public function quoteMessage($messageId)
    {
        $message = EditorialMessage::with('user')->find($messageId);
        if (!$message) return;

        $quotedText = str_replace("\n", "\n> ", $message->content);
        $author = $message->user->username ?? $message->user->name;
        $this->message = "> @{$author}: {$quotedText}\n\n" . $this->message;
    }

    // === Mentions ===

    protected function parseMentions(string $content): array
    {
        preg_match_all('/@(\w+)/', $content, $matches);

        if (empty($matches[1])) {
            return [];
        }

        return User::whereIn('username', $matches[1])
            ->pluck('id')
            ->toArray();
    }

    // === Messages Query ===

    protected function parseSearchFilters(string $search): array
    {
        $filters = ['text' => '', 'from' => null, 'has' => [], 'before' => null, 'after' => null];

        if (preg_match('/from:(\w+)/i', $search, $m)) {
            $filters['from'] = $m[1];
            $search = str_replace($m[0], '', $search);
        }

        if (preg_match_all('/has:(\w+)/i', $search, $m)) {
            $filters['has'] = $m[1];
            foreach ($m[0] as $match) {
                $search = str_replace($match, '', $search);
            }
        }

        if (preg_match('/before:([\d-]+)/i', $search, $m)) {
            $filters['before'] = $m[1];
            $search = str_replace($m[0], '', $search);
        }
        if (preg_match('/after:([\d-]+)/i', $search, $m)) {
            $filters['after'] = $m[1];
            $search = str_replace($m[0], '', $search);
        }

        $filters['text'] = trim($search);
        return $filters;
    }

    public function loadMoreMessages()
    {
        $this->messageLimit += 50;
    }

    public function getHasMoreMessagesProperty(): bool
    {
        $query = EditorialMessage::query();

        if (!$this->search) {
            $query->whereNull('parent_id');
        }

        if ($this->activeChannel) {
            $query->where('channel', $this->activeChannel)->whereNull('recipient_id');
        } elseif ($this->activeRecipient) {
            $query->where(function ($q) {
                $q->where('user_id', auth()->id())->where('recipient_id', $this->activeRecipient);
            })->orWhere(function ($q) {
                $q->where('user_id', $this->activeRecipient)->where('recipient_id', auth()->id());
            });
        }

        return $query->count() > $this->messageLimit;
    }

    public function getMessagesProperty()
    {
        $query = EditorialMessage::with(['user.roles', 'reactions.user', 'replies'])->orderBy('created_at', 'desc')->take($this->messageLimit);

        if ($this->search) {
            $filters = $this->parseSearchFilters($this->search);

            if ($filters['text']) {
                $query->where('content', 'like', '%' . $filters['text'] . '%');
            }
            if ($filters['from']) {
                $query->whereHas('user', fn($q) => $q->where('username', $filters['from'])->orWhere('name', 'like', '%' . $filters['from'] . '%'));
            }
            foreach ($filters['has'] as $has) {
                if ($has === 'attachment') $query->whereNotNull('attachment_url');
                if ($has === 'link') $query->where('content', 'like', '%http%');
            }
            if ($filters['before']) $query->where('created_at', '<', $filters['before']);
            if ($filters['after']) $query->where('created_at', '>', $filters['after']);
        }

        // Exclude replies from main view unless searching
        if (!$this->search) {
            $query->whereNull('parent_id');
        }

        if ($this->activeChannel) {
            $query->where('channel', $this->activeChannel)
                ->whereNull('recipient_id');
        } elseif ($this->activeRecipient) {
            $query->where(function ($q) {
                $q->where('user_id', auth()->id())
                    ->where('recipient_id', $this->activeRecipient);
            })->orWhere(function ($q) {
                $q->where('user_id', $this->activeRecipient)
                    ->where('recipient_id', auth()->id());
            });
        }

        return $query->get();
    }

    public function getUsersProperty()
    {
        return User::with('roles')
            ->where('id', '!=', auth()->id())
            ->where(function ($query) {
                $query->whereHas(
                    'roles',
                    fn($q) =>
                    $q->whereIn('name', $this->editorialRoles)
                );
                $query->orWhereIn('role', ['admin', 'super_admin']);
            })
            ->withCount([
                'sentEditorialMessages as unread_count' => function ($q) {
                    $q->where('recipient_id', auth()->id())
                        ->whereNull('read_at');
                }
            ])
            ->orderBy('name')
            ->get();
    }

    public function getMentionUsersJsonProperty(): array
    {
        return $this->users->map(fn($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'username' => $u->username,
            'role' => $this->getUserRoleBadge($u),
            'avatar_url' => $u->avatar_url,
        ])->values()->toArray();
    }

    public function getUnreadCountProperty()
    {
        return EditorialMessage::where('recipient_id', auth()->id())
            ->whereNull('read_at')
            ->count();
    }

    // === Channel Unread Badges ===

    public function getChannelUnreadCount(string $channelSlug): int
    {
        return Cache::remember(
            "channel_unread:{$channelSlug}:" . auth()->id(),
            10,
            function () use ($channelSlug) {
                $key = 'user_' . auth()->id() . '_channel_' . $channelSlug . '_read_at';
                $lastRead = Cache::get($key);

                $query = EditorialMessage::where('channel', $channelSlug)
                    ->whereNull('recipient_id')
                    ->whereNull('parent_id')
                    ->where('user_id', '!=', auth()->id());

                if ($lastRead) {
                    $query->where('created_at', '>', $lastRead);
                }

                return $query->count();
            }
        );
    }

    // === User Presence ===

    public function getUserPresence(User $user): string
    {
        $manual = Cache::get('user_manual_status:' . $user->id);
        if ($manual === 'busy') return 'busy';
        if ($manual === 'online') return 'online';
        if ($manual === 'away') return 'away';

        if (!$user->last_seen_at) return 'offline';

        $minutesAgo = $user->last_seen_at->diffInMinutes(now());

        if ($minutesAgo <= 5) return 'online';
        if ($minutesAgo <= 10) return 'away';

        return 'offline';
    }

    public function setUserStatus($status)
    {
        Cache::put('user_manual_status:' . auth()->id(), $status, now()->addHours(8));
        $this->manualStatus = $status;
        Notification::make()->title('Status updated to ' . ucfirst($status))->success()->send();
    }

    // === Custom Text Statuses ===

    public function setCustomStatus($emoji, $text, $minutes = 240)
    {
        $data = ['emoji' => $emoji, 'text' => $text];
        Cache::put('user_custom_status:' . auth()->id(), $data, now()->addMinutes($minutes));
        $this->statusEmoji = $emoji;
        $this->statusText = $text;
        Notification::make()->title('Status set: ' . $emoji . ' ' . $text)->success()->send();
    }

    public function clearCustomStatus()
    {
        Cache::forget('user_custom_status:' . auth()->id());
        $this->statusEmoji = '';
        $this->statusText = '';
        Notification::make()->title('Status cleared')->success()->send();
    }

    public function getCustomStatus(User $user): ?array
    {
        return Cache::get('user_custom_status:' . $user->id);
    }

    // === User Hovercards ===

    public function getUserHovercard($userId): array
    {
        $user = User::with('roles')->find($userId);
        if (!$user) return [];

        $roleBadge = $this->getUserRoleBadge($user);
        $presence = $this->getUserPresence($user);
        $customStatus = $this->getCustomStatus($user);

        $messageCount = EditorialMessage::where('user_id', $userId)
            ->when($this->activeChannel, fn($q) => $q->where('channel', $this->activeChannel))
            ->count();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'avatar_url' => $user->avatar_url,
            'role' => $roleBadge,
            'presence' => $presence,
            'custom_status' => $customStatus,
            'last_seen' => $user->last_seen_at?->diffForHumans(),
            'message_count' => $messageCount,
        ];
    }

    // === Away/Offline Warning ===

    public function getRecipientStatusProperty(): ?array
    {
        if (!$this->activeRecipient) return null;

        $recipient = User::find($this->activeRecipient);
        if (!$recipient) return null;

        $presence = $this->getUserPresence($recipient);
        $customStatus = $this->getCustomStatus($recipient);

        if ($presence === 'offline' || $presence === 'away') {
            $awayMinutes = $recipient->last_seen_at
                ? $recipient->last_seen_at->diffInMinutes(now())
                : 999;

            if ($awayMinutes > 10) {
                return [
                    'presence' => $presence,
                    'name' => $recipient->name,
                    'last_seen' => $recipient->last_seen_at?->diffForHumans() ?? 'a long time ago',
                    'custom_status' => $customStatus,
                ];
            }
        }

        return null;
    }

    public function getUserRoleBadge(User $user): array
    {
        $roleColors = [
            'Super Admin' => ['color' => '#ef4444', 'short' => 'SA'],
            'Editor-in-Chief' => ['color' => '#f97316', 'short' => 'EiC'],
            'Editor' => ['color' => '#eab308', 'short' => 'Ed'],
            'Journalist' => ['color' => '#22c55e', 'short' => 'Jr'],
            'Moderator' => ['color' => '#3b82f6', 'short' => 'Mod'],
        ];

        foreach ($user->roles as $role) {
            if (isset($roleColors[$role->name])) {
                return $roleColors[$role->name];
            }
        }

        if (in_array($user->role ?? '', ['admin', 'super_admin'])) {
            return ['color' => '#ef4444', 'short' => 'A'];
        }

        return ['color' => '#6b7280', 'short' => '?'];
    }

    // === Pinned Messages ===

    public function getPinnedMessagesProperty()
    {
        if (!$this->activeChannel)
            return collect();

        return EditorialMessage::with('user')
            ->where('channel', $this->activeChannel)
            ->where('is_pinned', true)
            ->latest()
            ->get();
    }

    public function pinMessage($messageId)
    {
        $message = EditorialMessage::find($messageId);
        if ($message && ($message->channel === $this->activeChannel)) {
            $message->update(['is_pinned' => true]);
            Notification::make()->title('Message pinned')->success()->send();
        }
    }

    public function unpinMessage($messageId)
    {
        $message = EditorialMessage::find($messageId);
        if ($message) {
            $message->update(['is_pinned' => false]);
            Notification::make()->title('Message unpinned')->success()->send();
        }
    }

    // === Reactions & Bookmarks ===

    public function toggleReaction($messageId, $emoji)
    {
        $message = EditorialMessage::find($messageId);
        if (!$message)
            return;

        $existing = EditorialMessageReaction::where('editorial_message_id', $messageId)
            ->where('user_id', auth()->id())
            ->where('emoji', $emoji)
            ->first();

        if ($existing) {
            $existing->delete();
        } else {
            EditorialMessageReaction::create([
                'editorial_message_id' => $messageId,
                'user_id' => auth()->id(),
                'emoji' => $emoji,
            ]);
        }
    }

    public function toggleBookmark($messageId)
    {
        $message = EditorialMessage::find($messageId);
        if (!$message)
            return;

        $user = auth()->user();

        if ($message->isBookmarkedBy($user)) {
            $message->bookmarks()->detach($user->id);
            Notification::make()->title('Bookmark removed')->success()->send();
        } else {
            $message->bookmarks()->attach($user->id);
            Notification::make()->title('Message bookmarked')->success()->send();
        }
    }

    // === Task Creation ===

    public function createTaskFromMessage($messageId)
    {
        $message = EditorialMessage::find($messageId);
        if (!$message)
            return;

        $task = Task::create([
            'title' => 'Task from Chat: ' . Str::limit($message->content, 30),
            'description' => "Source: Editorial Chat\nFrom: {$message->user->name}\n\n" . $message->content,
            'status' => 'pending',
            'priority' => 'medium',
            'created_by' => auth()->id(),
            'assigned_to' => $this->activeRecipient ?? null,
        ]);

        Notification::make()
            ->title('Task Created')
            ->body('Redirecting to task details...')
            ->success()
            ->send();

        return redirect()->to(TaskResource::getUrl('edit', ['record' => $task->id]));
    }

    // === Edit/Delete Message ===

    public function startEditMessage($messageId)
    {
        $message = EditorialMessage::find($messageId);
        if (!$message || !$message->canEdit()) {
            Notification::make()
                ->title('Cannot edit this message')
                ->body('Messages can only be edited within 15 minutes of sending.')
                ->warning()
                ->send();
            return;
        }

        $this->editingMessageId = $messageId;
        $this->editingContent = $message->content;
    }

    public function cancelEdit()
    {
        $this->editingMessageId = null;
        $this->editingContent = '';
    }

    public function saveEdit()
    {
        $message = EditorialMessage::find($this->editingMessageId);
        if (!$message || !$message->canEdit()) {
            $this->cancelEdit();
            return;
        }

        $message->update([
            'content' => $this->editingContent,
            'edited_at' => now(),
        ]);

        Notification::make()->title('Message updated')->success()->send();
        $this->cancelEdit();
    }

    public function deleteMessage($messageId)
    {
        $message = EditorialMessage::find($messageId);
        if (!$message || !$message->canDelete()) {
            Notification::make()
                ->title('Cannot delete this message')
                ->warning()
                ->send();
            return;
        }

        $message->delete();
        Notification::make()->title('Message deleted')->success()->send();
    }

    // === Voice Messages ===

    public function updatedVoiceMessage()
    {
        if (empty($this->voiceMessage)) return;

        $file = $this->voiceMessage[0];
        $path = $file->store('editorial-chat/voice', 'public');

        $message = EditorialMessage::create([
            'user_id' => auth()->id(),
            'content' => '',
            'message_type' => 'voice',
            'channel' => $this->activeChannel,
            'recipient_id' => $this->activeRecipient,
            'attachment_url' => $path,
            'mentioned_user_ids' => [],
        ]);

        broadcast(new \App\Events\EditorialMessageSent($message))->toOthers();
        $this->voiceMessage = [];
        $this->updateLastSeen();
    }

    // === Channel Topics ===

    public function startEditTopic()
    {
        $channel = EditorialChannel::where('slug', $this->activeChannel)->first();
        $this->topicContent = $channel->topic ?? '';
        $this->editingTopic = true;
    }

    public function saveTopic()
    {
        $user = auth()->user();
        if (!$user->hasRole(['Super Admin', 'Editor-in-Chief', 'Editor'])) {
            Notification::make()->title('Permission denied')->warning()->send();
            return;
        }

        $channel = EditorialChannel::where('slug', $this->activeChannel)->first();
        if ($channel) {
            $channel->update(['topic' => $this->topicContent]);
            Notification::make()->title('Topic updated')->success()->send();
        }
        $this->editingTopic = false;
    }

    public function cancelEditTopic()
    {
        $this->editingTopic = false;
        $this->topicContent = '';
    }

    // === Message Formatting ===

    public function formatMessageContent(string $content): string
    {
        // First, escape HTML
        $content = e($content);

        // Blockquotes (> text) - must be before other processing
        $content = preg_replace(
            '/^&gt;\s?(.+)$/m',
            '<div style="border-left: 3px solid #FC4100; padding: 4px 12px; margin: 4px 0; background: rgba(252,65,0,0.05); color: rgba(255,255,255,0.7); font-size: 0.8rem;">$1</div>',
            $content
        );

        // Code blocks (```code```)
        $content = preg_replace(
            '/```([\s\S]*?)```/',
            '<pre style="background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 0.8rem; overflow-x: auto; margin: 8px 0;">$1</pre>',
            $content
        );

        // Inline code (`code`)
        $content = preg_replace(
            '/`([^`]+)`/',
            '<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.85em;">$1</code>',
            $content
        );

        // Bold (**text** or __text__)
        $content = preg_replace(
            '/\*\*(.+?)\*\*|__(.+?)__/',
            '<strong>$1$2</strong>',
            $content
        );

        // Italic (*text* or _text_)
        $content = preg_replace(
            '/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/',
            '<em>$1$2</em>',
            $content
        );

        // Strikethrough (~~text~~)
        $content = preg_replace(
            '/~~(.+?)~~/',
            '<del style="opacity: 0.6;">$1</del>',
            $content
        );

        // Highlight @channel and @here as broadcast mentions
        $content = preg_replace(
            '/@(channel|here)\b/',
            '<span style="background: rgba(252,65,0,0.15); color: #FC4100; padding: 1px 4px; border-radius: 3px; font-weight: 600;">@$1</span>',
            $content
        );

        // Highlight @mentions
        $content = preg_replace(
            '/@(\w+)/',
            '<span class="mention-highlight">@$1</span>',
            $content
        );

        // Parse article links: /link:ID
        $content = preg_replace_callback(
            '/\/link:(\d+)/',
            function ($matches) {
                return $this->renderArticlePreview($matches[1]);
            },
            $content
        );

        // Convert newlines to <br>
        $content = nl2br($content);

        return $content;
    }

    protected function renderArticlePreview($articleId)
    {
        $article = \App\Models\Article::find($articleId);
        if (!$article)
            return '';

        $editUrl = "/admin/articles/{$article->id}/edit";
        $statusColor = $article->status === 'published' ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20';

        return view('filament.components.editorial-chat-article-preview', [
            'article' => $article,
            'editUrl' => $editUrl,
            'statusColor' => $statusColor
        ])->render();
    }

    // === Jump to Date ===

    public function jumpToDate($date)
    {
        if (!$date) return;

        try {
            $targetDate = \Carbon\Carbon::parse($date);
        } catch (\Exception $e) {
            return;
        }

        $query = EditorialMessage::query()->whereNull('parent_id');

        if ($this->activeChannel) {
            $query->where('channel', $this->activeChannel)->whereNull('recipient_id');
        } elseif ($this->activeRecipient) {
            $query->where(function ($q) {
                $q->where('user_id', auth()->id())->where('recipient_id', $this->activeRecipient);
            })->orWhere(function ($q) {
                $q->where('user_id', $this->activeRecipient)->where('recipient_id', auth()->id());
            });
        }

        // Count messages after target date to set proper limit
        $messagesAfter = (clone $query)->where('created_at', '>=', $targetDate->startOfDay())->count();
        $this->messageLimit = max(50, $messagesAfter + 10);

        // Find the first message on that date to highlight
        $firstMsg = (clone $query)->where('created_at', '>=', $targetDate->startOfDay())
            ->orderBy('created_at', 'asc')->first();

        if ($firstMsg) {
            $this->highlightMessageId = $firstMsg->id;
        }
    }

    // === Thread Notifications ===

    public function getUnreadThreadRepliesProperty(): int
    {
        // Count replies to threads the user participated in, since last seen
        $userThreadIds = EditorialMessage::where('user_id', auth()->id())
            ->whereNotNull('parent_id')
            ->pluck('parent_id')
            ->merge(
                EditorialMessage::where('user_id', auth()->id())
                    ->whereNull('parent_id')
                    ->has('replies')
                    ->pluck('id')
            )
            ->unique();

        if ($userThreadIds->isEmpty()) return 0;

        $lastSeen = auth()->user()->last_seen_at ?? now()->subDay();

        return EditorialMessage::whereIn('parent_id', $userThreadIds)
            ->where('user_id', '!=', auth()->id())
            ->where('created_at', '>', $lastSeen)
            ->count();
    }

    public function getUnreadThreadsProperty()
    {
        $lastSeen = auth()->user()->last_seen_at ?? now()->subDay();

        // Get parent message IDs of threads user participated in
        $userThreadIds = EditorialMessage::where('user_id', auth()->id())
            ->whereNotNull('parent_id')
            ->pluck('parent_id')
            ->merge(
                EditorialMessage::where('user_id', auth()->id())
                    ->whereNull('parent_id')
                    ->has('replies')
                    ->pluck('id')
            )
            ->unique();

        if ($userThreadIds->isEmpty()) return collect();

        return EditorialMessage::with(['user', 'replies' => function ($q) use ($lastSeen) {
                $q->where('created_at', '>', $lastSeen)->where('user_id', '!=', auth()->id());
            }])
            ->whereIn('id', $userThreadIds)
            ->whereHas('replies', function ($q) use ($lastSeen) {
                $q->where('created_at', '>', $lastSeen)->where('user_id', '!=', auth()->id());
            })
            ->latest()
            ->take(10)
            ->get();
    }

    // === Remind Me Later ===

    public function remindMe($messageId, $minutes)
    {
        $message = EditorialMessage::find($messageId);
        if (!$message) return;

        \App\Jobs\SendChatReminder::dispatch(
            auth()->id(),
            $messageId,
            Str::limit($message->content, 100),
            $message->user->name
        )->delay(now()->addMinutes($minutes));

        $timeLabel = match(true) {
            $minutes <= 30 => '30 minutes',
            $minutes <= 60 => '1 hour',
            $minutes <= 180 => '3 hours',
            $minutes <= 1440 => 'tomorrow',
            default => Str::plural('day', intdiv($minutes, 1440), intdiv($minutes, 1440)),
        };

        Notification::make()
            ->title("Reminder set for {$timeLabel}")
            ->body('You\'ll be notified about this message.')
            ->success()
            ->send();
    }
}
