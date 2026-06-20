<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'bounty_balance')) {
                $table->unsignedInteger('bounty_balance')->default(0)->after('xp');
            }
        });

        Schema::create('bounty_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('amount'); // positive = earn, negative = spend
            $table->string('type')->default('earn'); // earn | spend | admin
            $table->string('reason')->nullable();
            $table->integer('balance_after');
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });

        Schema::create('reward_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('cost')->default(0);
            $table->string('type')->default('perk'); // badge | frame | theme | perk | discount | physical
            $table->string('image')->nullable();
            $table->integer('stock')->nullable(); // null = unlimited
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('reward_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reward_item_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('cost'); // snapshot of cost at redemption time
            $table->string('status')->default('fulfilled'); // pending | fulfilled | cancelled
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reward_redemptions');
        Schema::dropIfExists('reward_items');
        Schema::dropIfExists('bounty_transactions');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('bounty_balance');
        });
    }
};
