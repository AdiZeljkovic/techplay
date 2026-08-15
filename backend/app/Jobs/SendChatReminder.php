<?php

namespace App\Jobs;

use App\Models\User;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendChatReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Mail. */
    public int $tries = 2;

    /** Seconds between attempts. */
    public array $backoff = [60, 300];

    /** A queue job that dies quietly is a job nobody knows stopped. */
    public function failed(Throwable $e): void
    {
        Log::error('SendChatReminder failed', ['error' => $e->getMessage()]);
    }

    public function __construct(
        protected int $userId,
        protected int $messageId,
        protected string $messagePreview,
        protected string $authorName
    ) {}

    public function handle(): void
    {
        $user = User::find($this->userId);
        if (! $user) {
            return;
        }

        $url = '/admin/editorial-chat?msg='.$this->messageId;

        Notification::make()
            ->title('Chat Reminder')
            ->body("From {$this->authorName}: {$this->messagePreview}")
            ->actions([
                Action::make('view')
                    ->label('View Message')
                    ->url($url),
            ])
            ->sendToDatabase($user);
    }
}
