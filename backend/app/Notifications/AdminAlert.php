<?php

namespace App\Notifications;

use App\Models\User;
use Filament\Notifications\Actions\Action;
use Filament\Notifications\Notification as FilamentNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

/**
 * Something the panel should know about, addressed to staff.
 *
 * The `notifications` table had 157 rows before this class existed and every
 * one was written for a **player** — achievements, quests, rank-ups, all read
 * on techplay.gg. Nothing had ever spoken to an administrator through it.
 *
 * So the bell that was just switched on in the top bar would have shown the one
 * admin account its own achievements and nothing else. This is what gives it
 * something to say.
 *
 * Deliberately not queued. An alert about the queue being broken must not be
 * delivered by the queue.
 */
class AdminAlert extends Notification
{
    use Queueable;

    public function __construct(
        protected string $title,
        protected ?string $body = null,
        protected string $colour = 'warning',
        protected string $icon = 'heroicon-o-exclamation-triangle',
        protected ?string $url = null,
        protected ?string $urlLabel = null,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toDatabase(object $notifiable): array
    {
        $notification = FilamentNotification::make()
            ->title($this->title)
            ->icon($this->icon)
            ->color($this->colour);

        if ($this->body !== null) {
            $notification->body($this->body);
        }

        if ($this->url !== null) {
            $notification->actions([
                Action::make('open')
                    ->label($this->urlLabel ?? 'Open')
                    ->url($this->url)
                    ->markAsRead(),
            ]);
        }

        return $notification->getDatabaseMessage();
    }

    /**
     * Whoever is responsible for the machine.
     *
     * This looked for `users.role = 'admin'` or a Spatie role *named* 'admin',
     * and there has never been a role by that name — the ladder is Editor,
     * Editor-in-Chief, Journalist, Moderator, Super Admin. So the Spatie half
     * matched nobody and every alert this site has ever raised was delivered on
     * the strength of a legacy column that is being retired. Cleaning that
     * column would have silently addressed these to no one.
     *
     * Super Admin rather than everyone who can open the panel: all five roles
     * carry `view admin panel`, and a failed queue job is not a Journalist's
     * problem. If the role is ever renamed this returns zero, and the caller
     * says so rather than reporting a delivery that did not happen.
     */
    public const AUDIENCE = 'Super Admin';

    public static function send(
        string $title,
        ?string $body = null,
        string $colour = 'warning',
        string $icon = 'heroicon-o-exclamation-triangle',
        ?string $url = null,
        ?string $urlLabel = null,
    ): int {
        $admins = User::query()
            ->whereHas('roles', fn ($r) => $r->where('name', self::AUDIENCE))
            ->get();

        if ($admins->isEmpty()) {
            Log::error('AdminAlert reached nobody: no user holds the '.self::AUDIENCE.' role.', [
                'title' => $title,
            ]);

            return 0;
        }

        foreach ($admins as $admin) {
            $admin->notify(new self($title, $body, $colour, $icon, $url, $urlLabel));
        }

        return $admins->count();
    }
}
