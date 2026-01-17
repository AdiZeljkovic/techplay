<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            if (!Schema::hasColumn('media', 'width')) {
                $table->unsignedInteger('width')->nullable()->after('size');
            }
            if (!Schema::hasColumn('media', 'height')) {
                $table->unsignedInteger('height')->nullable()->after('width');
            }
            if (!Schema::hasColumn('media', 'collection')) {
                $table->string('collection')->default('default')->after('height');
            }
            if (!Schema::hasColumn('media', 'uploaded_by')) {
                $table->foreignId('uploaded_by')->nullable()->after('collection')->constrained('users')->nullOnDelete();
            }
        });

        // Add index
        Schema::table('media', function (Blueprint $table) {
            $table->index('collection');
        });
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->dropIndex(['collection']);
            $table->dropColumn(['width', 'height', 'collection', 'uploaded_by']);
        });
    }
};
