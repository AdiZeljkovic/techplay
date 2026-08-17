<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\NewsroomConsole;
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
 *   1. Is anything waiting for me?
 *   2. Are we still publishing?
 *   3. Did anybody read it?
 *   4. How is the catalogue doing?
 *   5. Is anybody out there?
 *   6. What went out, and how did it do?
 *
 * ── Second rebuild, 18 Aug 2026 ──────────────────────────────────────────
 *
 * The first rebuild answered those six questions with six stats widgets, and
 * the result read as a spreadsheet: five bands of three identical boxes,
 * fifteen numbers at the same size in the same frame, nothing saying which to
 * read first. Right answers, no hierarchy.
 *
 * Questions one to five now live on one surface — `NewsroomConsole` — where
 * size can carry rank, a hairline can do the work a border was doing, and a
 * ratio can be a bar instead of a printed percentage. Question six is still a
 * table, because a list of what went out is a list.
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
     * Two widgets, not six.
     *
     * The six-widget version answered the right questions and looked like a
     * spreadsheet: five bands of three identical boxes, every number the same
     * size in the same frame. The questions have not changed — is anything
     * waiting, are we publishing, did anybody read it, how is the catalogue,
     * is anybody out there — but they now share one surface, where size can
     * say which matters and a hairline can do the work a border was doing.
     *
     * `NewsroomConsole` reads all of it from one cached payload, so the page
     * costs one round of queries instead of one per box.
     */
    public function getWidgets(): array
    {
        return [
            NewsroomConsole::class,
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
