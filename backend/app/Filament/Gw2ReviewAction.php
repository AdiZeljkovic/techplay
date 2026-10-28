<?php

namespace App\Filament;

use App\Models\Gw2Source;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * "I have read this against the game" — for a guide or a rule.
 *
 * §24 gives both an owner, sources, a game build and `reviewed_at`, and until
 * now the only way to fill them was four separate fields in an edit form, so
 * none of the seventeen guides and twelve rules had ever been marked. This is
 * one click that records all three facts together: who, when, and against which
 * build of the game — the build being what makes "review everything older than
 * the last balance patch" possible later.
 *
 * The confirmation says what is being asserted, and names any source nobody has
 * checked. Marking a page reviewed on top of an unchecked source is allowed —
 * the reviewer may have checked the claim in game — but it should be a decision,
 * not something the button hid.
 */
class Gw2ReviewAction
{
    public static function make(): Action
    {
        return Action::make('review')
            ->label('Mark reviewed')
            ->icon('heroicon-o-check-badge')
            ->color('success')
            ->requiresConfirmation()
            ->modalHeading('Mark this reviewed')
            ->modalDescription(function (Model $record) {
                $build = self::build();
                $unchecked = self::uncheckedSources($record);

                return 'You are confirming that you have read this against the game'
                    .($build ? " as of build {$build}" : '')
                    .', and that it is still right.'
                    .($unchecked !== []
                        ? ' Not checked yet among its sources: '.implode('; ', $unchecked).'.'
                        : '');
            })
            ->modalSubmitActionLabel('Yes, reviewed')
            ->action(function (Model $record) {
                $record->update([
                    'reviewed_at' => now(),
                    'game_build' => self::build() ?? $record->game_build,
                    // Whoever reviews it answers for it, unless somebody
                    // already does.
                    'owner' => $record->owner ?: auth()->user()?->name,
                ]);

                Notification::make()->title('Marked reviewed')->success()->send();
            });
    }

    /** The game build the catalogue was last read at — the build being reviewed against. */
    private static function build(): ?int
    {
        $build = DB::table('gw2_catalog_meta')->where('endpoint', 'items')->value('build_id');

        return $build ? (int) $build : null;
    }

    /** @return array<int, string> */
    private static function uncheckedSources(Model $record): array
    {
        $ids = array_map('intval', (array) ($record->source_ids ?? []));

        return $ids === []
            ? []
            : Gw2Source::query()->whereIn('id', $ids)->whereNull('checked_at')->pluck('label')->all();
    }
}
