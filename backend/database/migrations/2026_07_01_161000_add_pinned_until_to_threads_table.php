<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('threads', 'pinned_until')) {
            Schema::table('threads', function (Blueprint $table) {
                $table->timestamp('pinned_until')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::table('threads', function (Blueprint $table) {
            if (Schema::hasColumn('threads', 'pinned_until')) {
                $table->dropColumn('pinned_until');
            }
        });
    }
};
