<?php

namespace Tests\Feature;

use App\Filament\Resources\GuideResource\Pages\CreateGuide;
use App\Filament\Resources\NewsResource\Pages\CreateNews;
use App\Filament\Resources\ReviewResource\Pages\CreateReview;
use App\Filament\Resources\TechResource\Pages\CreateTech;
use App\Models\Article;
use App\Models\Category;
use App\Models\Guide;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
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

    /**
     * The whole round trip: fill each editor the way a person does, press
     * Create, and read the row back out.
     *
     * Field-name-versus-column catches the silent drops; this catches anything
     * that gets lost between the form and the table for some other reason.
     */
    public function test_a_filled_news_editor_stores_everything_it_offered(): void
    {
        $category = $this->category('news', 'Gaming');
        $author = $this->writer();

        Livewire::test(CreateNews::class)
            ->fillForm([
                'title' => 'A probe article with a reasonable headline',
                'slug' => 'a-probe-article',
                'excerpt' => 'A standfirst long enough to be worth checking.',
                'content' => '<h2>Head</h2><p>Body with <a href="/news">a link</a>.</p>',
                'status' => 'draft',
                'published_at' => now(),
                'category_id' => $category->id,
                'author_id' => $author->id,
                'tags' => ['probe', 'test'],
                'is_featured_in_hero' => true,
                'meta_title' => 'A search title',
                'meta_description' => 'A search description for the probe article.',
                'focus_keyword' => 'probe',
                'canonical_url' => 'https://techplay.gg/news/canonical-probe',
                'is_noindex' => true,
                'featured_image_url' => 'articles/probe.jpg',
                'featured_image_alt' => 'Alt text for the probe',
                'featured_video_url' => 'https://www.youtube.com/watch?v=probe',
            ])
            ->call('create')
            ->assertHasNoFormErrors();

        $article = Article::where('slug', 'a-probe-article')->firstOrFail();

        $this->assertSame('A probe article with a reasonable headline', $article->title);
        $this->assertSame('A standfirst long enough to be worth checking.', $article->excerpt);
        $this->assertSame('draft', $article->status);
        $this->assertSame($category->id, $article->category_id);
        $this->assertSame($author->id, $article->author_id);
        $this->assertSame(['probe', 'test'], $article->tags);
        $this->assertTrue((bool) $article->is_featured_in_hero);
        $this->assertSame('A search title', $article->meta_title);
        $this->assertSame('A search description for the probe article.', $article->meta_description);
        $this->assertSame('probe', $article->focus_keyword);
        $this->assertSame('https://techplay.gg/news/canonical-probe', $article->canonical_url);
        $this->assertTrue((bool) $article->is_noindex);
        // Read raw: `getFeaturedImageUrlAttribute` expands a stored path into a
        // full URL, so the accessor would answer a different string than the
        // column holds.
        $this->assertSame('articles/probe.jpg', $article->getRawOriginal('featured_image_url'));
        $this->assertSame('Alt text for the probe', $article->featured_image_alt);
        $this->assertSame('https://www.youtube.com/watch?v=probe', $article->featured_video_url);
        // Stamped by ContentObserver from the body, not sent by the form.
        $this->assertSame(1, (int) $article->reading_time);
    }

    public function test_a_filled_guide_editor_stores_everything_it_offered(): void
    {
        $author = $this->writer();

        Livewire::test(CreateGuide::class)
            ->fillForm([
                'title' => 'A probe guide with a reasonable headline',
                'slug' => 'a-probe-guide',
                'excerpt' => 'What the reader will learn.',
                'content' => '<p>The body.</p>',
                'status' => 'draft',
                'published_at' => now(),
                'difficulty' => 'intermediate',
                'author_id' => $author->id,
                'seo_title' => 'A guide search title',
                'seo_description' => 'A guide search description.',
                'canonical_url' => 'https://techplay.gg/guides/canonical-probe',
                'is_noindex' => true,
                'featured_image_url' => 'guides/probe.jpg',
                'steps' => [
                    ['title' => 'Step one', 'description' => '<p>Do it.</p>', 'image' => null],
                    ['title' => 'Step two', 'description' => '<p>Then this.</p>', 'image' => null],
                ],
            ])
            ->call('create')
            ->assertHasNoFormErrors();

        $guide = Guide::where('slug', 'a-probe-guide')->firstOrFail();

        $this->assertSame('intermediate', $guide->difficulty);
        // The four that used to be discarded on this screen.
        $this->assertSame('A guide search title', $guide->seo_title);
        $this->assertSame('A guide search description.', $guide->seo_description);
        $this->assertSame('https://techplay.gg/guides/canonical-probe', $guide->canonical_url);
        $this->assertCount(2, $guide->steps);
        $this->assertSame('Step two', $guide->steps[1]['title']);
    }

    /**
     * The Author select is fed by `CacheService::getAuthors()`, which lists only
     * users holding an editorial role — and caches the result.
     */
    private function writer(): User
    {
        $user = User::factory()->create();
        $user->assignRole('Journalist');
        Cache::flush();

        return $user->fresh();
    }

    private function category(string $type, string $name): Category
    {
        $parent = Category::create([
            'name' => ucfirst($type), 'slug' => $type.'-root-'.uniqid(), 'type' => $type,
        ]);

        return Category::create([
            'name' => $name, 'slug' => $type.'-'.uniqid(), 'type' => $type, 'parent_id' => $parent->id,
        ]);
    }
}
