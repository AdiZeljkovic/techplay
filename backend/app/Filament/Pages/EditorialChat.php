<?php

namespace App\Filament\Pages;

use App\Models\EditorialMessage;
use App\Models\Task;
use App\Models\User;
use App\Filament\Resources\Tasks\TaskResource;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Str;
use Livewire\WithFileUploads;


use App\Models\EditorialChannel;
use App\Models\EditorialMessageReaction;

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

    protected string $view = 'filament.pages.editorial-chat';

    public $message = '';
    public $activeChannel = 'general';
    public $activeRecipient = null;
    public $attachment = null;

    // Editing state
    public $editingMessageId = null;
    public $editingContent = '';

    // Computed property for channels
    public function getChannelsProperty()
    {
        $user = auth()->user();

        return EditorialChannel::orderBy('sort_order', 'asc')->get()->filter(function ($channel) use ($user) {
            if (!$channel->is_private) {
                return true;
            }
            // Check roles if private
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
        $this->updateLastSeen();
        $this->resetAttachment();
    }

    public function setRecipient($userId)
    {
        $this->activeRecipient = $userId;
        $this->activeChannel = null;
        $this->updateLastSeen();
        $this->resetAttachment();
    }

    protected function updateLastSeen()
    {
        // Update user's last seen timestamp for online status
        // Ensure the last_seen_at column exists or wrap in try/catch if migration failed on server potentially
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

    public function sendMessage()
    {
        $this->validate([
            'message' => 'required_without:attachment|string|max:2000',
            'attachment' => 'nullable|file|max:10240', // 10MB max
        ]);

        // Parse @mentions
        $mentionedIds = $this->parseMentions($this->message);

        $attachmentUrl = null;
        if ($this->attachment) {
            $attachmentUrl = $this->attachment->store('editorial-chat', 'public');
        }

        EditorialMessage::create([
            'user_id' => auth()->id(),
            'content' => $this->message,
            'channel' => $this->activeChannel, // Still storing slug string for simplicity and backward compat
            'recipient_id' => $this->activeRecipient,
            'mentioned_user_ids' => $mentionedIds,
            'attachment_url' => $attachmentUrl,
        ]);

        $this->message = '';
        $this->attachment = null;
        $this->updateLastSeen();
    }

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

    public function getMessagesProperty()
    {
        $query = EditorialMessage::with(['user.roles', 'reactions.user'])->latest()->take(100);

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
        // Only return users with editorial roles
        return User::with('roles')
            ->where('id', '!=', auth()->id())
            ->where(function ($query) {
                // Check Spatie roles
                $query->whereHas(
                    'roles',
                    fn($q) =>
                    $q->whereIn('name', $this->editorialRoles)
                );
                // OR check old role column
                $query->orWhereIn('role', ['admin', 'super_admin']);
            })
            // Count unread DM messages sent BY this user TO me
            ->withCount([
                'sentEditorialMessages as unread_count' => function ($q) {
                    $q->where('recipient_id', auth()->id())
                        ->whereNull('read_at');
                }
            ])
            ->orderBy('name')
            ->get();
    }

    public function getUnreadCountProperty()
    {
        // Count unread messages for current user
        return EditorialMessage::where('recipient_id', auth()->id())
            ->whereNull('read_at')
            ->count();
    }

    public function isUserOnline(User $user): bool
    {
        if (!$user->last_seen_at) {
            return false;
        }
        // Consider online if seen in last 5 minutes
        return $user->last_seen_at->gt(now()->subMinutes(5));
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

        // Check Spatie roles first
        foreach ($user->roles as $role) {
            if (isset($roleColors[$role->name])) {
                return $roleColors[$role->name];
            }
        }

        // Fallback to old role column
        if (in_array($user->role ?? '', ['admin', 'super_admin'])) {
            return ['color' => '#ef4444', 'short' => 'A'];
        }

        return ['color' => '#6b7280', 'short' => '?'];
    }

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
            'assigned_to' => $this->activeRecipient ?? null, // Assign to DM recipient if in DM
        ]);

        Notification::make()
            ->title('Task Created')
            ->body('Redirecting to task details...')
            ->success()
            ->send();

        return redirect()->to(TaskResource::getUrl('edit', ['record' => $task->id]));
    }

    // === Edit/Delete Message Methods ===

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

        $message->delete(); // Soft delete
        Notification::make()->title('Message deleted')->success()->send();
    }

    public function formatMessageContent(string $content): string
    {
        // Highlight @mentions
        $content = preg_replace(
            '/@(\w+)/',
            '<span class="text-primary-500 font-semibold cursor-pointer hover:underline">@$1</span>',
            e($content)
        );

        // Parse article links: /link:ID or techplay.gg/news/slug
        // 1. /link:123 syntax
        $content = preg_replace_callback(
            '/\/link:(\d+)/',
            function ($matches) {
                return $this->renderArticlePreview($matches[1]);
            },
            $content
        );

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
}
