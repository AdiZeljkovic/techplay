<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixNotificationProfileLinks extends Command
{
    protected $signature = 'notifications:fix-profile-links';

    protected $description = 'Fix old notifications that have /profile as link (should be /profile/{username})';

    public function handle(): int
    {
        $rows = DB::table('notifications')
            ->whereRaw("data->>'link' = '/profile'")
            ->get(['id', 'notifiable_id', 'data']);

        if ($rows->isEmpty()) {
            $this->info('No notifications to fix.');
            return self::SUCCESS;
        }

        $this->info("Found {$rows->count()} notification(s) to fix.");

        $fixed = 0;

        foreach ($rows as $row) {
            $user = User::find($row->notifiable_id);

            if (! $user || ! $user->username) {
                $this->warn("  Skipping notification {$row->id} — user not found.");
                continue;
            }

            $data = json_decode($row->data, true);
            $data['link'] = "/profile/{$user->username}";

            DB::table('notifications')
                ->where('id', $row->id)
                ->update(['data' => json_encode($data)]);

            $fixed++;
        }

        $this->info("Fixed {$fixed} notification(s).");

        return self::SUCCESS;
    }
}
