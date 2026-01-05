<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->nullable()->after('email');
            $table->string('avatar_url')->nullable();
            $table->text('bio')->nullable();
            $table->string('role')->default('user'); // user, editor, moderator, admin
            $table->integer('rank_id')->default(1); // 1 = Newbie
            $table->integer('forum_reputation')->default(0);
            $table->boolean('is_banned')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};
