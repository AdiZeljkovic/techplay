<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\CatalogueHealth;
use App\Filament\Widgets\CommunityPulse;
use App\Filament\Widgets\NeedsAttention;
use App\Filament\Widgets\PublishingPulse;
use App\Filament\Widgets\ReachPulse;
use App\Filament\Widgets\RecentContent;
use Filament\Pages\Dashboard as BaseDashboard;

/**
 * The dashboard, rebuilt 17 Aug 2026.
 *
 * What was here: a `StatsOverview` widget showing Total Users and Published
 * Articles, and beneath it a hand-written block of HTML with its own `<style>`
 * tag drawing four more cards — Drafts, Pending, Today, Users. "Users" appeared
 * in both, in two different visual languages, one above the other. Six further
 * widgets existed in the codebase and reached no screen at all.
 *
 * The rebuild follows one rule: **every number here should change what you do
 * next.** A total that only goes up — registered users, articles ever published
 * — reads the same on the best week and the worst, so it belongs on a report,
 * not on the screen somebody opens twenty times a day.
 *
 * The order is the order the questions get asked:
 *
 *   1. Is anything waiting for me?          NeedsAttention
 *   2. Are we still publishing?             PublishingPulse
 *   3. How is the catalogue doing?          CatalogueHealth
 *   4. Is anybody out there?                CommunityPulse
 *   5. What went out, and how did it do?    RecentContent
 *
 * The counts that used to live in this class are gone with the custom Blade
 * view — they are inside the widgets now, cached, where a number belongs.
 */
class Dashboard extends BaseDashboard
{
    /**
     * Back to Filament's own view.
     *
     * The custom one existed to draw four stat cards by hand. It also meant the
     * dashboard was the only screen in the panel with its own stylesheet, and
     * so the only one that did not quite match the rest — a Filament `Stat` and
     * a hand-rolled `.db-stat` sitting one above the other never looked like
     * they belonged to the same product.
     */
    /**
     * One column, and every widget spans it.
     *
     * The grid used to be three, which sounds like more control and was less:
     * each stats widget already lays its own cards out, so the page grid was
     * only deciding what happened to the leftovers — and produced the ragged
     * first row where two cards sat beside a third of empty page. With one
     * column the page is a stack of full-width bands, each band a question,
     * and the card counts inside them are stated by the widgets themselves.
     */
    public function getColumns(): int|array
    {
        return 1;
    }

    /**
     * The order the questions get asked.
     *
     *   1. Is anything waiting for me?          NeedsAttention
     *   2. Are we still publishing?             PublishingPulse
     *   3. Did anybody read it?                 ReachPulse
     *   4. How is the catalogue doing?          CatalogueHealth
     *   5. Is anybody out there?                CommunityPulse
     *   6. What went out, and how did it do?    RecentContent
     *
     * Reach was the missing one. Everything above it counted work going out and
     * nothing counted whether it arrived.
     */
    public function getWidgets(): array
    {
        return [
            NeedsAttention::class,
            PublishingPulse::class,
            ReachPulse::class,
            CatalogueHealth::class,
            CommunityPulse::class,
            RecentContent::class,
        ];
    }

    /**
     * All five are ordinary widgets rather than header and footer ones, so the
     * grid places them in the order above and they reflow together on a narrow
     * screen. The old split put one widget in the header and one in the footer
     * with hand-written HTML wedged between, which is why nothing on this page
     * lined up with anything else.
     */
    public function getHeaderWidgets(): array
    {
        return [];
    }

    public function getFooterWidgets(): array
    {
        return [];
    }
}
