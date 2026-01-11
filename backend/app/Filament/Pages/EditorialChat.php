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
        // Only editorial staff can access
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

    // Meaningful channels for editorial workflow
    public array $channels = [
        'general' => ['name' => 'Općenito', 'icon' => '💬', 'description' => 'General team discussion'],
        'news' => ['name' => 'Vijesti', 'icon' => '📰', 'description' => 'News article coordination'],
        'reviews' => ['name' => 'Recenzije', 'icon' => '🎮', 'description' => 'Review assignments'],
        'announcements' => ['name' => 'Najave', 'icon' => '📢', 'description' => 'Important announcements'],
        'tech' => ['name' => 'Tehnika', 'icon' => '🔧', 'description' => 'Technical support'],
        'urgent' => ['name' => 'Hitno', 'icon' => '🚨', 'description' => 'Urgent matters'],
    ];

    // Editorial roles for filtering
    protected array $editorialRoles = [
        'Super Admin',
        'Editor-in-Chief',
        'Editor',
        'Journalist',
        'Moderator'
    ];

    public function setChannel($channel)
    {
        $this->activeChannel = $channel;
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
        auth()->user()->update(['last_seen_at' => now()]);
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
            'channel' => $this->activeChannel,
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
        $query = EditorialMessage::with('user.roles')->latest()->take(100);

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

    public function formatMessageContent(string $content): string
    {
        // Highlight @mentions
        $content = preg_replace(
            '/@(\w+)/',
            '<span style="color: #3b82f6; font-weight: 600;">@$1</span>',
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
        $statusColor = $article->status === 'published' ? '#22c55e' : '#eab308';

        return '
            <div style="margin-top: 8px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #f8fafc; display: flex; max-width: 400px;">
                ' . ($article->featured_image_url ? '<div style="width: 80px; background-image: url(' . asset('storage/' . $article->featured_image_url) . '); background-size: cover; background-position: center;"></div>' : '') . '
                <div style="padding: 10px; flex: 1;">
                    <div style="font-weight: bold; font-size: 0.9rem; color: #0f172a; margin-bottom: 4px;">' . e($article->title) . '</div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; background-color: ' . $statusColor . '20; color: ' . $statusColor . '; border: 1px solid ' . $statusColor . '40; text-transform: uppercase;">' . e($article->status) . '</span>
                        <a href="' . $editUrl . '" target="_blank" style="font-size: 0.8rem; color: #3b82f6; font-weight: bold; text-decoration: none;">Ediit -></a>
                    </div>
                </div>
            </div>
        ';
    }
}
