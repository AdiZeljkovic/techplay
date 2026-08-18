<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Remember what the person called the file.
 *
 * Filament stores an upload under a generated ULID — which is the right thing
 * to do, because it cannot collide and cannot carry a hostile name — and until
 * now that was the only name kept. Every one of the 36 rows in the library is
 * titled with its own storage name:
 *
 *     01KEQ5KW66WJGTKV4KBRH7WEH4
 *     usUTo74GmWm0hYlJLA1yYR10R8jvTwRfXkYf1405
 *
 * So "Choose from library" offered a list of thirty-six of those, with a search
 * box that could only match against them. The picture a person uploaded as
 * `hogwarts-legacy-2-key-art.jpg` was findable by nothing they knew about it.
 *
 * The storage name stays generated. This is the other one — what it was called
 * when it arrived, which is the only name anybody can search for.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->string('original_name')->nullable()->after('title');
        });
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->dropColumn('original_name');
        });
    }
};
