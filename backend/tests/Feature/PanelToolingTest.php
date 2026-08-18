<?php

namespace Tests\Feature;

use App\Filament\Resources\GameResource;
use App\Filament\Resources\GameResource\Pages\ListGames;
use App\Filament\Resources\QuestResource\Pages\ListQuests;
use App\Filament\Resources\SeoManagerResource;
use App\Models\User;
use Croustibat\FilamentJobsMonitor\Models\QueueMonitor;
use Database\Seeders\RolesAndPermissionsSeeder;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Livewire\Livewire;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Gaps found by introspecting all 38 lists at once — what each one offers by
 * way of search, sorting, filters and authorisation — rather than by opening
 * them one at a time.
 */
class PanelToolingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $admin = User::factory()->create();
        $admin->assignRole('Super Admin');
        $this->actingAs($admin->fresh());

        Filament::setCurrentPanel(Filament::getPanel('admin'));
    }

    /**
     * Forty-two quests over seven columns and not one of them could be ordered
     * by anything — so "which quest pays the most" had no answer on the screen
     * that lists quests.
     */
    public function test_the_quest_list_can_be_ordered(): void
    {
        // Through the page, not a hand-built table: the page is what a browser
        // gets, and building a Filament table outside one means implementing a
        // contract just to ask a question about a column.
        $columns = Livewire::test(ListQuests::class)->instance()->getTable()->getColumns();

        $sortable = array_filter($columns, fn ($column) => $column->isSortable());

        $this->assertGreaterThanOrEqual(4, count($sortable), 'the quest list must be orderable');
    }

    /**
     * The one screen whose entire purpose is those two lengths was measuring
     * them in bytes: 74 titles and 141 descriptions across the catalogue read
     * wrong, and eight of them were given the wrong badge colour by it.
     */
    public function test_the_seo_manager_measures_characters_not_bytes(): void
    {
        $source = file_get_contents(
            (new \ReflectionClass(SeoManagerResource::class))->getFileName()
        );

        // A negative lookbehind, because `mb_strlen(` ends with `strlen(` — the
        // plain substring check passes on the fixed file and fails on nothing.
        $this->assertSame(
            0,
            preg_match('/(?<!mb_)strlen\(\$record->/', $source),
            'meta lengths must be counted in characters, not bytes',
        );

        $this->assertStringContainsString('mb_strlen($record->meta_title', $source);
        $this->assertStringContainsString('mb_strlen($record->meta_description', $source);
    }

    /**
     * The Jobs Monitor arrived with the plugin and was the last model in the
     * panel with no policy. Filament allows everything for an unmapped model,
     * and that list carries two bulk actions over the only record of what
     * failed and why.
     */
    public function test_the_job_monitor_is_behind_a_policy(): void
    {
        $this->assertNotNull(
            Gate::getPolicyFor(QueueMonitor::class),
            'every model with a list in the panel needs a policy',
        );
    }

    /**
     * Every model behind a list, in fact — this is the check that found the
     * one above.
     */
    public function test_no_list_in_the_panel_is_left_unmapped(): void
    {
        $unmapped = [];

        foreach (Filament::getResources() as $resource) {
            if (! isset($resource::getPages()['index'])) {
                continue;
            }

            if (! Gate::getPolicyFor($resource::getModel())) {
                $unmapped[] = $resource::getNavigationLabel();
            }
        }

        $this->assertSame([], $unmapped);
    }

    /**
     * The platform filter runs through `@> ARRAY[?]::text[]`, which is what
     * `games_platforms_gin` answers — written as a `LIKE` against the array's
     * text form it would read all 142,110 rows instead.
     *
     * The query itself cannot run here: `platforms` is a PostgreSQL `text[]`
     * and the suite runs on SQLite, which has neither the type nor the
     * operator. So this checks the two things that are checkable — that the
     * filter is registered, and that it is written the way the index can
     * answer — and skips the rest rather than pretending.
     */
    public function test_the_games_list_offers_a_platform_filter(): void
    {
        $filters = Livewire::test(ListGames::class)->instance()->getTable()->getFilters();

        $this->assertArrayHasKey('platform', $filters);
        $this->assertArrayHasKey('cover', $filters);
        $this->assertArrayHasKey('description', $filters);

        $source = file_get_contents((new \ReflectionClass(GameResource::class))->getFileName());

        $this->assertStringContainsString('platforms @> ARRAY[?]::text[]', $source);
    }
}
