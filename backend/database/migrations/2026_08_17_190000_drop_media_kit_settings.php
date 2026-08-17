<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * The media kit, removed in favour of a PDF.
 *
 * The table held 33 hand-entered settings, and four of them were the figures
 * the public page put in front of advertisers: "20K+ engaged gamers",
 * "CPM from $1.00", "62% desktop traffic", "12.4% monthly growth". Nothing in
 * this project measures any of them. They were flagged earlier the same day and
 * left standing pending a decision; the decision was to replace the whole page
 * with a PDF, which settles it — the numbers go with the page rather than being
 * carried forward.
 *
 * Removed alongside: the Filament resource, the model, its observer,
 * MediaKitService, MediaKitController, the /api/v1/media-kit route, the public
 * /media-kit page with its seven components, and the links to it in the footer,
 * the mobile bar and the marketing page.
 *
 * The marketing page keeps its email button. A dead link to a removed page
 * would be worse than one button.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('media_kit_settings');
    }

    /**
     * Deliberately empty — the model and service that read this table are gone,
     * so an empty table would be furniture. The 33 values were exported to
     * /root/pre-removal-2026-08-17/ before the drop.
     */
    public function down(): void
    {
        //
    }
};
