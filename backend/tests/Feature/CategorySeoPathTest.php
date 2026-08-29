<?php

namespace Tests\Feature;

use App\Filament\Resources\CategoryResource\Pages\EditCategory;
use App\Models\Category;
use App\Models\PageSeo;
use App\Models\User;
use Database\Seeders\CategorySeoSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * A category's SEO and its page must agree on where the page is.
 *
 * The admin's SEO tab writes into the `page_seo` row for a category's path.
 * That path is built from the category's type and slug, and the same mapping
 * lives on the front end in `frontend/lib/categories.ts` — two copies that have
 * to say the same thing. `news-gaming` is served at /news/gaming and
 * `tech-tech-news` at /hardware/news; get either wrong and an editor's copy is
 * saved against a URL nobody visits, which looks exactly like the site ignoring
 * them.
 *
 * These are the mappings as the front end has them. Change one there, change it
 * here, and this test is what says so.
 */
class CategorySeoPathTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, array{string, string, ?string}> */
    public static function paths(): array
    {
        return [
            // section rows are the section page itself, not a category under it
            'news section' => ['news', 'news', '/news'],
            'reviews section' => ['reviews', 'reviews', '/reviews'],
            'tech section' => ['tech', 'tech', '/hardware'],

            'news child' => ['news-gaming', 'news', '/news/gaming'],
            'news child with dash' => ['news-movies-tv', 'news', '/news/movies-tv'],
            'news child hyphenated' => ['news-e-sport', 'news', '/news/e-sport'],

            'reviews child' => ['reviews-indie-gems', 'reviews', '/reviews/indie-gems'],
            'reviews child possessive' => ['reviews-editors-choice', 'reviews', '/reviews/editors-choice'],

            'tech child' => ['tech-benchmarks', 'tech', '/hardware/benchmarks'],
            // the one row carrying its prefix twice
            'tech news' => ['tech-tech-news', 'tech', '/hardware/news'],

            // forum boards keep their slug whole
            'forum board' => ['consoles', 'forum', '/forum/consoles'],
            'forum board hyphenated' => ['feedback-support', 'forum', '/forum/feedback-support'],
        ];
    }

    /**
     * @dataProvider paths
     */
    public function test_it_maps_a_category_to_the_url_its_page_is_served_at(string $slug, string $type, ?string $expected): void
    {
        $category = new Category(['slug' => $slug, 'type' => $type]);

        $this->assertSame($expected, $category->seoPagePath());
    }

    public function test_a_type_without_a_public_listing_has_no_seo_path(): void
    {
        $category = new Category(['slug' => 'whatever', 'type' => 'guides']);

        $this->assertNull($category->seoPagePath());
    }

    public function test_the_seeder_never_overwrites_copy_that_is_already_there(): void
    {
        // The version of this seeder that shipped for months passed its
        // generated title straight into updateOrCreate's update array, so one
        // `db:seed` would have replaced the written forum titles with
        // "Consoles Community Forum | TechPlay".
        $category = Category::firstOrCreate(
            ['slug' => 'consoles'],
            ['name' => 'Consoles & Peripherals', 'type' => 'forum'],
        );

        PageSeo::updateOrCreate(
            ['page_path' => $category->seoPagePath()],
            [
                'page_name' => 'Consoles & Peripherals',
                'meta_title' => 'Console & Peripheral Forums | PS5, Xbox, Switch Discussion',
            ],
        );

        $this->seed(CategorySeoSeeder::class);

        $this->assertSame(
            'Console & Peripheral Forums | PS5, Xbox, Switch Discussion',
            PageSeo::where('page_path', '/forum/consoles')->value('meta_title'),
        );
    }

    public function test_the_seeder_writes_to_the_path_the_page_is_served_at(): void
    {
        Category::firstOrCreate(
            ['slug' => 'tech-benchmarks'],
            ['name' => 'Benchmarks', 'type' => 'tech'],
        );

        $this->seed(CategorySeoSeeder::class);

        // Not /hardware/tech-benchmarks, which is where it used to land and is
        // not a page.
        $this->assertTrue(PageSeo::where('page_path', '/hardware/benchmarks')->exists());
        $this->assertFalse(PageSeo::where('page_path', '/hardware/tech-benchmarks')->exists());
    }

    public function test_a_section_row_does_not_repeat_its_own_name(): void
    {
        Category::firstOrCreate(['slug' => 'news'], ['name' => 'News', 'type' => 'news']);

        // The seeder only fills gaps, so clear the row the other seeders leave
        // behind — the wording under test is the one it writes from scratch.
        PageSeo::where('page_path', '/news')->delete();

        $this->seed(CategorySeoSeeder::class);

        // "News News & Updates" is what the old template produced here.
        $this->assertSame('News | TechPlay', PageSeo::where('page_path', '/news')->value('meta_title'));
    }

    public function test_the_admin_tab_reaches_the_row_the_page_reads(): void
    {
        // The whole point of the mapping: what the SEO tab saves under is what
        // /news/gaming asks the API for.
        // firstOrCreate, not create: the seeders already ship this category, and
        // the mapping is the thing under test either way.
        $category = Category::firstOrCreate(
            ['slug' => 'news-gaming'],
            ['name' => 'Gaming', 'type' => 'news'],
        );

        PageSeo::updateOrCreate([
            'page_path' => $category->seoPagePath(),
        ], [
            'page_name' => 'Gaming',
            'meta_title' => 'Gaming News 2026',
        ]);

        $this->getJson('/api/v1/page-seo/'.urlencode('/news/gaming'))
            ->assertOk()
            ->assertJsonPath('meta_title', 'Gaming News 2026');
    }

    /**
     * The tab, driven the way a person drives it.
     *
     * `page_seo_*` are not columns on `categories`, so if the lift-and-write in
     * EditCategory ever comes apart this is silent again: the form saves, the
     * category row is fine, and the wording goes nowhere — which is exactly the
     * failure the tab had before.
     */
    public function test_the_seo_tab_saves_into_the_row_the_page_reads(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $admin = User::factory()->create();
        $admin->assignRole('Super Admin');
        $this->actingAs($admin->fresh());
        Filament::setCurrentPanel(Filament::getPanel('admin'));

        $category = Category::firstOrCreate(
            ['slug' => 'reviews-indie-gems'],
            ['name' => 'Indie Gems', 'type' => 'reviews'],
        );

        Livewire::test(EditCategory::class, ['record' => $category->getKey()])
            ->fillForm([
                'page_seo_title' => 'Indie Game Reviews 2026',
                'page_seo_description' => 'The small releases worth your evening.',
                'page_seo_noindex' => false,
            ])
            ->call('save')
            ->assertHasNoFormErrors();

        $row = PageSeo::where('page_path', '/reviews/indie-gems')->first();

        $this->assertNotNull($row, 'The SEO tab wrote nowhere.');
        $this->assertSame('Indie Game Reviews 2026', $row->meta_title);
        $this->assertSame('The small releases worth your evening.', $row->meta_description);

        // And nothing was written onto the category row itself — the columns
        // that used to catch this were dropped, so a stray `seo_title` in the
        // payload would now be a mass-assignment error rather than a silent
        // write to a dead field.
        $this->assertArrayNotHasKey('seo_title', $category->fresh()->getAttributes());
    }
}
