<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('author_slug')->nullable()->unique()->after('display_name');
        });

        // Auto-populate for existing users with display_name
        DB::table('users')->whereNotNull('display_name')->orderBy('id')->each(function ($user) {
            $base = Str::slug($user->display_name);
            if (empty($base)) return;

            $slug = $base;
            $i = 1;
            while (DB::table('users')->where('author_slug', $slug)->where('id', '!=', $user->id)->exists()) {
                $slug = $base . '-' . $i++;
            }

            DB::table('users')->where('id', $user->id)->update(['author_slug' => $slug]);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('author_slug');
        });
    }
};
