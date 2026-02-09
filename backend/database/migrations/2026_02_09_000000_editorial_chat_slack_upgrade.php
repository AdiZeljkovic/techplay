<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('editorial_messages', function (Blueprint $table) {
            if (!Schema::hasColumn('editorial_messages', 'message_type')) {
                $table->string('message_type')->default('text')->after('content');
            }
        });

        Schema::table('editorial_channels', function (Blueprint $table) {
            if (!Schema::hasColumn('editorial_channels', 'topic')) {
                $table->string('topic')->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('editorial_messages', function (Blueprint $table) {
            $table->dropColumn('message_type');
        });

        Schema::table('editorial_channels', function (Blueprint $table) {
            $table->dropColumn('topic');
        });
    }
};
