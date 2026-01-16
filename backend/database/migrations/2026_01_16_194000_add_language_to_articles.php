<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Add language field to articles
        Schema::table('articles', function (Blueprint $table) {
            $table->string('language', 5)->default('hr')->after('status'); // hr, en, de, etc.
            $table->foreignId('translation_of_id')->nullable()->after('language')
                ->constrained('articles')->nullOnDelete();
        });

        // Index for efficient language queries
        Schema::table('articles', function (Blueprint $table) {
            $table->index('language');
            $table->index('translation_of_id');
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropForeign(['translation_of_id']);
            $table->dropColumn(['language', 'translation_of_id']);
        });
    }
};
