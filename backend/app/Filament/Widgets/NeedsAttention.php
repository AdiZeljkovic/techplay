<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\CommentResource;
use App\Filament\Resources\NewsResource;
use App\Filament\Resources\ReportResource;
use App\Models\Article;
use App\Models\Comment;
use App\Models\Report;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The first question anyone opening the panel is really asking.
 *
 * Not "how many users do we have" — that number does not change what you do
 * next. This one is: **is anything waiting for me?**
 *
 * It shows only what is non-zero. A row reading "Pending comments: 0" is a
 * space the eye learns to skip, and once it has learned that, it skips the same
 * space on the day the number is 14. When nothing is waiting, the widget says
 * so in one card and gets out of the way.
 *
 * Every card that has somewhere to go, goes there. A count you cannot act on
 * from where you are reading it is a count you will read again tomorrow.
 */
class NeedsAttention extends BaseWidget
{
    protected static ?int $sort = 1;

    protected ?string $heading = 'Traži pažnju';

    /**
     * Sixty seconds.
     *
     * Long enough that opening three pages in a row does not re-run six counts,
     * short enough that a moderator who just approved a comment sees the number
     * drop. The queue counts in particular are the kind a person watches
     * immediately after acting on them.
     */
    protected function getStats(): array
    {
        $counts = Cache::remember('dashboard.attention.v1', 60, fn () => [
            'comments' => Comment::where('status', 'pending')->count(),
            'reports' => Report::where('status', 'pending')->count(),
            'review' => Article::where('status', 'pending_review')->count(),
            'drafts' => Article::where('status', 'draft')->count(),
            'failed' => DB::table('failed_jobs')->count(),
            'links' => DB::table('broken_links')->where('is_fixed', false)->count(),
        ]);

        $stats = [];

        if ($counts['comments'] > 0) {
            $stats[] = Stat::make('Komentari na čekanju', $counts['comments'])
                ->description('Čekaju odobrenje')
                ->descriptionIcon('heroicon-m-chat-bubble-left-ellipsis')
                ->url(CommentResource::getUrl('index'))
                ->color('warning');
        }

        if ($counts['reports'] > 0) {
            $stats[] = Stat::make('Otvorene prijave', $counts['reports'])
                ->description('Neko je nešto prijavio')
                ->descriptionIcon('heroicon-m-flag')
                ->url(ReportResource::getUrl('index'))
                ->color('danger');
        }

        if ($counts['review'] > 0) {
            $stats[] = Stat::make('Na reviziji', $counts['review'])
                ->description('Napisano, čeka odobrenje')
                ->descriptionIcon('heroicon-m-eye')
                ->url(NewsResource::getUrl('index'))
                ->color('warning');
        }

        if ($counts['drafts'] > 0) {
            $stats[] = Stat::make('Draftovi', $counts['drafts'])
                ->description('Započeto, nije objavljeno')
                ->descriptionIcon('heroicon-m-pencil')
                ->url(NewsResource::getUrl('index'))
                ->color('gray');
        }

        // A failed job is never routine. It stays red however few there are.
        if ($counts['failed'] > 0) {
            $stats[] = Stat::make('Neuspjeli poslovi', $counts['failed'])
                ->description('Red poslova nešto nije obradio')
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color('danger');
        }

        if ($counts['links'] > 0) {
            $stats[] = Stat::make('Mrtvi linkovi', $counts['links'])
                ->description('Nađeni sedmičnim skenom')
                ->descriptionIcon('heroicon-m-link-slash')
                ->color($counts['links'] > 50 ? 'danger' : 'warning');
        }

        if ($stats === []) {
            return [
                Stat::make('Sve čisto', '—')
                    ->description('Ništa ne čeka odobrenje ni popravku')
                    ->descriptionIcon('heroicon-m-check-circle')
                    ->color('success'),
            ];
        }

        return $stats;
    }
}
