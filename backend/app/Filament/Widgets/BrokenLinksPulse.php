<?php

namespace App\Filament\Widgets;

use App\Models\BrokenLink;
use Illuminate\Support\Carbon;

/**
 * The one list where the total is the least interesting number on it.
 *
 * Sixty-two rows, and forty-one of them are already fixed — so the list opens
 * looking like sixty-two problems when there are twenty-one. The lead figure is
 * what is still open, and the second is how long ago anything last checked,
 * because a sweep that has quietly stopped running looks exactly like a week
 * with no new breakages.
 */
class BrokenLinksPulse extends ListPulse
{
    protected function pulse(): array
    {
        $open = BrokenLink::where('is_fixed', false)->count();
        $fixed = BrokenLink::where('is_fixed', true)->count();
        $lastSweep = BrokenLink::max('last_checked_at');
        $sweepAge = $lastSweep ? (float) abs(now()->diffInDays(Carbon::parse($lastSweep))) : null;

        $gone = BrokenLink::where('is_fixed', false)->where('status_code', 404)->count();
        $unreachable = BrokenLink::where('is_fixed', false)->whereIn('status_code', [0, 403])->count();

        return [
            'lead' => [
                'label' => 'Still broken',
                'value' => (string) $open,
                'unit' => $open === 1 ? 'link' : 'links',
                'tone' => match (true) {
                    $open === 0 => 'good',
                    $open > 20 => 'bad',
                    default => 'warn',
                },
            ],
            'figures' => [
                // A 404 is ours to fix; a 403 or a timeout is usually somebody
                // else's server disliking a robot, and needs a look before a fix.
                ['label' => 'Gone (404)', 'value' => (string) $gone, 'tone' => $gone > 0 ? 'warn' : null],
                ['label' => 'Blocked or timed out', 'value' => (string) $unreachable],
                ['label' => 'Already fixed', 'value' => (string) $fixed, 'tone' => 'good'],
            ],
            'note' => $sweepAge === null
                ? 'Nothing has ever been swept.'
                : ($sweepAge <= 1
                    ? 'Last swept today.'
                    : 'Last swept '.(int) $sweepAge.' days ago.'),
        ];
    }
}
