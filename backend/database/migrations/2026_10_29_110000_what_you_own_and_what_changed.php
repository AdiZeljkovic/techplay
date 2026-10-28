<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Two editorial tables, each row with its source.
 *
 * `gw2_products` — the expansions and Living World seasons, which `access` flag
 * the game uses for each, what each grants, and what is free or included since
 * the bundling of 13 October 2026. The API answers "which flags does this
 * account have"; it does not answer "what does that flag mean", and that part
 * is editorial and goes stale with every store change.
 *
 * `gw2_changes` — dated changes since 2023 for a returning player, filtered by
 * what they own. Summaries are ours, written from the cited page; nothing is
 * copied from ArenaNet beyond the facts.
 *
 * Both start from `database/data/*.json`, researched 28 October 2026 and
 * read against each cited page. Inserted only into an empty table, so an
 * editor's later corrections are never overwritten by a re-run.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gw2_products', function (Blueprint $table) {
            $table->id();
            $table->string('key', 48)->unique();
            $table->string('name', 120);
            // base | expansion | living_world
            $table->string('kind', 24);
            $table->unsignedSmallInteger('sort_order')->default(0);
            // `/v2/account` access strings that mean the account owns this.
            $table->jsonb('access_flags')->nullable();
            // Product keys whose ownership brings this one along.
            $table->jsonb('included_with')->nullable();
            $table->boolean('is_free')->default(false);
            $table->text('grants')->nullable();
            $table->string('grants_source_url', 500)->nullable();
            $table->string('grants_source_label', 200)->nullable();
            $table->text('note')->nullable();
            $table->string('source_url', 500)->nullable();
            $table->string('source_label', 200)->nullable();
            $table->timestamp('checked_at')->nullable();
            $table->timestamps();
        });

        Schema::create('gw2_changes', function (Blueprint $table) {
            $table->id();
            $table->date('happened_on')->index();
            $table->string('title', 200);
            $table->text('summary');
            // A product key from gw2_products, or `all`.
            $table->string('applies_to', 48)->index();
            $table->string('category', 32);
            $table->string('source_url', 500);
            $table->string('source_label', 200);
            $table->boolean('is_published')->default(true)->index();
            $table->timestamps();
        });

        $this->load('gw2_products', 'gw2_products.json', fn (array $r) => [
            'key' => $r['key'],
            'name' => $r['name'],
            'kind' => $r['kind'],
            'sort_order' => $r['sort_order'],
            'access_flags' => json_encode($r['access_flags']),
            'included_with' => json_encode($r['included_with']),
            'is_free' => $r['is_free'],
            'grants' => $r['grants'],
            'grants_source_url' => $r['grants_source_url'],
            'grants_source_label' => $r['grants_source_label'],
            'note' => $r['note'],
            'source_url' => $r['source_url'],
            'source_label' => $r['source_label'],
        ]);

        $this->load('gw2_changes', 'gw2_changes.json', fn (array $r) => [
            'happened_on' => $r['date'],
            'title' => $r['title'],
            'summary' => $r['summary'],
            'applies_to' => $r['applies_to'],
            'category' => $r['category'],
            'source_url' => $r['source_url'],
            'source_label' => $r['source_label'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('gw2_changes');
        Schema::dropIfExists('gw2_products');
    }

    private function load(string $table, string $file, callable $map): void
    {
        if (DB::table($table)->exists()) {
            return;
        }

        $rows = json_decode((string) file_get_contents(database_path('data/'.$file)), true) ?: [];

        DB::table($table)->insert(array_map(
            fn (array $r) => $map($r) + ['created_at' => now(), 'updated_at' => now()],
            $rows
        ));
    }
};
