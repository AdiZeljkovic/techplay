<?php

namespace App\Jobs;

use App\Models\ConnectedAccount;
use App\Models\Presence;
use App\Services\PresenceService;
use App\Services\SteamService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class PollSteamPresence implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 60;

    public function handle(SteamService $steam, PresenceService $presence): void
    {
        $accounts = ConnectedAccount::where('provider', 'steam')
            ->where('visibility', 'public')
            ->whereNotNull('provider_user_id')
            ->with('user')
            ->get();

        if ($accounts->isEmpty()) {
            return;
        }

        $steamIds = $accounts->pluck('provider_user_id')->all();

        // Steam allows up to 100 IDs per call.
        foreach (array_chunk($steamIds, 100) as $chunk) {
            try {
                $summaries = $steam->getPlayerSummariesBatch($chunk);
            } catch (\Throwable $e) {
                Log::warning('PollSteamPresence: batch failed', ['error' => $e->getMessage()]);

                continue;
            }

            $summaryMap = collect($summaries)->keyBy('steamid');

            foreach ($chunk as $steamId) {
                $account = $accounts->firstWhere('provider_user_id', $steamId);
                if (! $account?->user) {
                    continue;
                }

                $summary = $summaryMap->get($steamId);
                $gameName = $summary['gameextrainfo'] ?? null;

                try {
                    if ($gameName) {
                        $presence->set($account->user, $gameName, 'steam');
                    } else {
                        // Only clear if the current active presence is from Steam (don't overwrite manual/discord).
                        $active = $presence->getActive($account->user);
                        if ($active && $active->source === 'steam') {
                            $presence->clear($account->user);
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning("PollSteamPresence: failed for user {$account->user_id}", ['error' => $e->getMessage()]);
                }
            }
        }
    }
}
