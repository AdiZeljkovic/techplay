<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Give the guide editor's "Step-by-Step Instructions" somewhere to go.
 *
 * The section has been on the form the whole time — a repeater with a title, a
 * rich-text body and an image upload per step, and an "Add Step" button — and
 * `guides` has never had a column for it. `steps` is not in `$fillable` either,
 * so Laravel dropped it on save without a word: you could write eight steps,
 * upload eight screenshots, press Create, and get a saved guide with none of it
 * and no error anywhere.
 *
 * This stores it. Rendering is a separate job — `GuideDetailView` currently has
 * only a placeholder for it, in the JSON-LD HowTo block:
 *
 *     "step": [], // Could parse steps if structured
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guides', function (Blueprint $table) {
            $table->jsonb('steps')->nullable()->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('guides', function (Blueprint $table) {
            $table->dropColumn('steps');
        });
    }
};
