<?php

namespace App\Filament\Pages;

use App\Models\EditorialMessage;
use App\Models\User;
use Filament\Pages\Page;

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

    protected string $view = 'filament.pages.editorial-chat';

    public $message = '';
    public $activeChannel = 'general'; // Default channel
    public $activeRecipient = null; // User ID for PMs

    public function setChannel($channel)
    {
        $this->activeChannel = $channel;
        $this->activeRecipient = null;
    }

    public function setRecipient($userId)
    {
        $this->activeRecipient = $userId;
        $this->activeChannel = null;
    }

    public function sendMessage()
    {
        $this->validate([
            'message' => 'required|string|max:1000',
        ]);

        EditorialMessage::create([
            'user_id' => auth()->id(),
            'content' => $this->message,
            'channel' => $this->activeChannel,
            'recipient_id' => $this->activeRecipient,
        ]);

        $this->message = '';
    }

    public function getMessagesProperty()
    {
        $query = EditorialMessage::with('user')->latest()->take(50);

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

        return $query->get(); // Order: Newest first [100, 99...]. UI uses flex-col-reverse, so Newest (100) is at Bottom.
        // Actually, previous implementation used flex-col-reverse which expects latest first.
        // Let's stick to latest() -> get() and let UI handle order.
        // Wait, standard chat is: Top = Oldest, Bottom = Newest.
        // If I use flex-col-reverse, the top of the container is the bottom visually, so the first item in DOM is at the bottom.
        // So `latest()->get()` returns [Newest, ..., Oldest].
        // In flex-col-reverse:
        // Item 0 (Newest) -> Bottom
        // Item Last (Oldest) -> Top
        // This is correct for scrolling to bottom.
        // So I will keep returning `latest()->get()`.
    }

    public function getUsersProperty()
    {
        return User::where('id', '!=', auth()->id())->get();
    }
}
