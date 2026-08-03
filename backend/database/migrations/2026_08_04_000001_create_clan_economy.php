<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 1 of the clan base system (docs/33-clan-system-plan.md): the economy
 * backbone. Resources, the ledger they move through, the activity feed, and
 * applications — so clans accumulate history from day one, before any of the
 * pages that will show it exist.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clans', function (Blueprint $table) {
            $table->unsignedInteger('level')->default(1);
            $table->unsignedBigInteger('xp')->default(0);

            // Current balances — spendable once buildings arrive (F3).
            $table->unsignedBigInteger('intel')->default(0);
            $table->unsignedBigInteger('materials')->default(0);
            $table->unsignedBigInteger('prestige')->default(0);

            // Lifetime totals never decrease; Prestige lifetime is the
            // public measure of a clan's history.
            $table->unsignedBigInteger('intel_lifetime')->default(0);
            $table->unsignedBigInteger('materials_lifetime')->default(0);
            $table->unsignedBigInteger('prestige_lifetime')->default(0);

            $table->string('motto', 120)->nullable();
            $table->string('region', 40)->nullable();
            $table->string('language', 40)->nullable();
            $table->string('playstyle', 20)->nullable(); // competitive | casual | mixed
            $table->string('status', 20)->default('recruiting'); // recruiting | invite_only | closed
            $table->text('requirements')->nullable();
        });

        // The single source of truth for every resource movement. Member
        // contributions, /hr rates and activity scores are all derived from
        // here — nothing is counted twice.
        Schema::create('clan_ledger', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('resource', 12); // intel | materials | prestige
            $table->bigInteger('amount');   // positive earn, negative spend
            $table->string('reason', 80);
            $table->unsignedBigInteger('balance_after');
            $table->timestamps();

            $table->index(['clan_id', 'created_at']);
            // The daily-cap check: this member, this resource, today.
            $table->index(['user_id', 'resource', 'created_at']);
        });

        Schema::create('clan_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 30); // member_joined | member_left | level_up | application_* | achievement | …
            $table->string('title', 200);
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['clan_id', 'created_at']);
        });

        Schema::create('clan_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('message', 500)->nullable();
            $table->string('status', 16)->default('pending'); // pending | accepted | declined
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['clan_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clan_applications');
        Schema::dropIfExists('clan_activities');
        Schema::dropIfExists('clan_ledger');

        Schema::table('clans', function (Blueprint $table) {
            $table->dropColumn([
                'level', 'xp', 'intel', 'materials', 'prestige',
                'intel_lifetime', 'materials_lifetime', 'prestige_lifetime',
                'motto', 'region', 'language', 'playstyle', 'status', 'requirements',
            ]);
        });
    }
};
