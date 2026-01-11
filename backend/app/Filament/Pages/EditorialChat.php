<?php

namespace App\Filament\Pages;

use App\Models\EditorialMessage;
use App\Models\User;
use Filament\Pages\Page;
use Illuminate\Support\Str;

class EditorialChat extends Page
{
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
    }

    public function setRecipient($userId)
    {
        $this->activeRecipient = $userId;
        $this->activeChannel = null;
        $this->updateLastSeen();
    }

    protected function updateLastSeen()
    {
        // Update user's last seen timestamp for online status
        auth()->user()->update(['last_seen_at' => now()]);
    }

    public function sendMessage()
    {
        $this->validate([
            'message' => 'required|string|max:2000',
        ]);

        // Parse @mentions
        $mentionedIds = $this->parseMentions($this->message);

        EditorialMessage::create([
            'user_id' => auth()->id(),
            'content' => $this->message,
            'channel' => $this->activeChannel,
            'recipient_id' => $this->activeRecipient,
            'mentioned_user_ids' => $mentionedIds,
        ]);

        $this->message = '';
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

    public function formatMessageContent(string $content): string
    {
        // Highlight @mentions
        $content = preg_replace(
            '/@(\w+)/',
            '<span style="color: #3b82f6; font-weight: 600;">@$1</span>',
            e($content)
        );

        // Parse article links: /link:ID
        $content = preg_replace_callback(
            '/\/link:(\d+)/',
            function ($matches) {
                $articleId = $matches[1];
                $article = \App\Models\Article::find($articleId);
                if ($article) {
                    return '<a href="/admin/articles/' . $articleId . '/edit" style="color: #8b5cf6; text-decoration: underline;" target="_blank">📄 ' . e(Str::limit($article->title, 30)) . '</a>';
                }
                return $matches[0];
            },
            $content
        );

        return $content;
    }
}
