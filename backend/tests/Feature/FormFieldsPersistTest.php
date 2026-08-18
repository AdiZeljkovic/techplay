<?php

namespace Tests\Feature;

use App\Filament\Resources\GuideResource\Pages\CreateGuide;
use App\Filament\Resources\NewsResource\Pages\CreateNews;
use App\Filament\Resources\ReviewResource\Pages\CreateReview;
use App\Filament\Resources\TechResource\Pages\CreateTech;
use App\Models\Article;
use App\Models\Guide;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Livewire\Livewire;
use PHPUnit\Framework\Attributes\DataProvider;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Every field on an editor screen has to have somewhere to go.
 *
 * This is the check that was missing. Six fields on the Guides screen wrote to
 * columns `guides` does not have — the whole Step-by-Step repeater, the SEO
 * title, the meta description, the alt text, the featured video and the tag box
 * — and because none of them were in `$fillable`, Laravel dropped them on save
 * without raising anything. You could write eight steps with screenshots, press
 * Create, and get a saved guide with none of it and no error.
 *
 * Nothing about that was visible: the form rendered, the save succeeded, the
 * record appeared in the list. The only way to see it was to compare the
 * rendered field names against the table, which is what this does.
 */
class FormFieldsPersistTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Fields that legitimately do not map to a column: previews, dividers,
     * pickers that only fill other fields in.
     *
     * @var list<string>
     */
    private const NOT_STORED = [
        'seo_analysis',
        'catalogue_game_search',
    ];

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

    /** @return array<string, array{class-string, class-string}> */
    public static function editors(): array
    {
        return [
            'News' => [CreateNews::class, Article::class],
            'Reviews' => [CreateReview::class, Article::class],
            'Tech' => [CreateTech::class, Article::class],
            'Guides' => [CreateGuide::class, Guide::class],
        ];
    }

    #[DataProvider('editors')]
    public function test_every_field_on_the_editor_maps_to_a_fillable_column(string $page, string $modelClass): void
    {
        $model = new $modelClass;
        $columns = Schema::getColumnListing($model->getTable());
        $fillable = $model->getFillable();

        $fields = Livewire::test($page)->instance()->getSchema('form')->getFlatFields(withHidden: true);

        foreach (array_keys($fields) as $key) {
            // Nested state like `review_data.ratings.gameplay` lives inside its
            // own column, so only the root matters.
            $root = explode('.', $key)[0];

            if (str_starts_with($root, '_') || in_array($root, self::NOT_STORED, true)) {
                continue;
            }

            $this->assertContains(
                $root,
                $columns,
                "The editor offers `{$root}` and `{$model->getTable()}` has no such column, so anything typed there is discarded on save.",
            );

            $this->assertContains(
                $root,
                $fillable,
                "`{$root}` is a column on `{$model->getTable()}` but not fillable, so the editor's value never reaches it.",
            );
        }
    }

    /**
     * The specific loss that started this: eight steps and eight screenshots,
     * saved, gone.
     */
    public function test_a_guides_steps_survive_a_save(): void
    {
        $guide = Guide::create([
            'title' => 'How to do the thing',
            'slug' => 'how-to-do-the-thing',
            'excerpt' => 'x',
            'content' => 'y',
            'difficulty' => 'beginner',
            'status' => 'draft',
            'author_id' => User::factory()->create()->id,
            'steps' => [
                ['title' => 'Download it', 'description' => '<p>From the site.</p>', 'image' => null],
                ['title' => 'Run it', 'description' => '<p>Double click.</p>', 'image' => 'guides/steps/x.png'],
            ],
        ]);

        $fresh = $guide->fresh();

        $this->assertCount(2, $fresh->steps);
        $this->assertSame('Download it', $fresh->steps[0]['title']);
        $this->assertSame('guides/steps/x.png', $fresh->steps[1]['image']);
    }

    /**
     * Guides file their search overrides under `seo_*`; articles under `meta_*`.
     * The shared component used to write the article names on both screens.
     */
    public function test_a_guides_seo_override_reaches_its_column(): void
    {
        $guide = Guide::create([
            'title' => 'A guide with an override',
            'slug' => 'a-guide-with-an-override',
            'excerpt' => 'x',
            'content' => 'y',
            'difficulty' => 'beginner',
            'status' => 'draft',
            'author_id' => User::factory()->create()->id,
            'seo_title' => 'A shorter title for search',
            'seo_description' => 'And the line underneath it.',
        ]);

        $this->assertSame('A shorter title for search', $guide->fresh()->seo_title);
        $this->assertSame('And the line underneath it.', $guide->fresh()->seo_description);
    }
}
