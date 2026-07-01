<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'post_color')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('post_color', 7)->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'post_color')) {
                $table->dropColumn('post_color');
            }
        });
    }
};
