<?php

namespace App\Filament\Widgets;

use App\Models\Media;

/**
 * What the library is missing, rather than how much of it there is.
 *
 * The count alone says nothing you can act on. These two do: 539 pictures with
 * no name are 539 you cannot find by searching, and 887 with no alt text are
 * 887 that a screen reader passes over in silence and Google reads as nothing.
 * Both were invisible until the library was tidied and could be counted.
 */
class MediaPulse extends ListPulse
{
    protected function pulse(): array
    {
        $total = Media::count();
        $unnamed = Media::whereNull('title')->count();
        $noAlt = Media::where(fn ($q) => $q->whereNull('alt_text')->orWhere('alt_text', ''))->count();

        $described = $total > 0 ? (int) round(($total - $noAlt) / $total * 100) : 0;

        return [
            'lead' => [
                'label' => 'Described for a screen reader',
                'value' => (string) $described,
                'unit' => '%',
                'tone' => match (true) {
                    $described >= 80 => 'good',
                    $described >= 40 => 'warn',
                    default => 'bad',
                },
            ],
            'figures' => [
                ['label' => 'Pictures in all', 'value' => static::compact($total)],
                ['label' => 'Without alt text', 'value' => static::compact($noAlt), 'tone' => $noAlt > 0 ? 'warn' : null],
                ['label' => 'Without a name', 'value' => static::compact($unnamed)],
            ],
            'note' => 'A picture with no name cannot be found by searching for it.',
        ];
    }
}
