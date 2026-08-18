<?php

namespace Tests\Feature;

use App\Filament\Resources\GuideResource\Pages\ListGuides;
use App\Filament\Resources\NewsResource\Pages\CreateNews;
use App\Filament\Resources\NewsResource\Pages\EditNews;
use App\Filament\Resources\NewsResource\Pages\ListNews;
use App\Filament\Resources\ReviewResource\Pages\ListReviews;
use App\Filament\Resources\TechResource\Pages\ListTeches;
use App\Models\Article;
use App\Models\Category;
use App\Models\Guide;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * The four writing desks — News, Reviews, Guides, Tech.
 *
 * These open each page the way a browser does. That distinction has already
 * cost this panel once: `Livewire::mount()` renders the shell and nothing
 * inside it, so a table whose cells throw passes a mount check and fails in
 * front of a person. Everything here goes through `Livewire::test()`, which
 * renders the rows.
 *
 * `->call('loadTable')` is not decoration either: the panel sets
 * `deferLoading()` for every list, so a table that is only mounted renders its
 * chrome and no rows at all — and a row assertion against it would pass or fail
 * for the wrong reason.
 */
class ArticleDeskTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $writer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->admin = User::factory()->create(['username' => 'adi']);
        $this->admin->assignRole('Super Admin');
        $this->writer = User::factory()->create(['username' => 'Dogashin']);

        $this->actingAs($this->admin->fresh());
        Filament::setCurrentPanel(Filament::getPanel('admin'));
    }

    private function category(string $type, string $name): Category
    {
        $parent = Category::create([
            'name' => ucfirst($type),
            'slug' => $type.'-root-'.uniqid(),
            'type' => $type,
        ]);

        return Category::create([
            'name' => $name,
            'slug' => $type.'-'.str($name)->slug().'-'.uniqid(),
            'type' => $type,
            'parent_id' => $parent->id,
        ]);
    }

    public function test_the_news_list_renders_the_byline_and_the_view_count(): void
    {
        $category = $this->category('news', 'Gaming');

        Article::factory()->create([
            'title' => 'Hogwarts Legacy 2 is officially being made',
            'category_id' => $category->id,
            'author_id' => $this->writer->id,
            'status' => 'published',
            'is_featured_in_hero' => false,
            'views' => 1414,
        ]);

        Livewire::test(ListNews::class)
            ->call('loadTable')
            ->assertOk()
            ->assertSee('Hogwarts Legacy 2 is officially being made')
            // The two things the old list could not tell you: who wrote it,
            // and whether anybody read it.
            ->assertSee('Dogashin')
            ->assertSee('1.4k');
    }

    /**
     * The point of dropping the status column.
     *
     * Every News row on the live site is published — 528 of 528 — so a status
     * column could only ever repeat itself. State now shows up when it is not
     * the ordinary case, and stays quiet when it is.
     */
    public function test_state_shows_only_when_it_is_not_published(): void
    {
        $category = $this->category('news', 'Industry');

        Article::factory()->create([
            'title' => 'A published piece',
            'category_id' => $category->id,
            'author_id' => $this->writer->id,
            'status' => 'published',
            'is_featured_in_hero' => false,
        ]);

        Livewire::test(ListNews::class)
            ->call('loadTable')
            ->assertOk()
            ->assertSee('A published piece')
            ->assertDontSee('tp-mark--draft', false);

        Article::factory()->create([
            'title' => 'An unfinished piece',
            'category_id' => $category->id,
            'author_id' => $this->writer->id,
            'status' => 'draft',
            'is_featured_in_hero' => false,
        ]);

        Livewire::test(ListNews::class)
            ->call('loadTable')
            ->assertOk()
            ->assertSee('Draft')
            ->assertSee('tp-mark--draft', false);
    }

    public function test_the_hero_flag_is_marked_on_the_row_it_belongs_to(): void
    {
        $category = $this->category('news', 'Gaming');

        Article::factory()->create([
            'title' => 'The one on the homepage',
            'category_id' => $category->id,
            'author_id' => $this->admin->id,
            'status' => 'published',
            'is_featured_in_hero' => true,
        ]);

        Livewire::test(ListNews::class)
            ->call('loadTable')
            ->assertOk()
            ->assertSee('tp-mark--hero', false);
    }

    public function test_every_desk_renders(): void
    {
        $news = $this->category('news', 'Gaming');
        $reviews = $this->category('reviews', 'AAA Titles');
        $tech = $this->category('tech', 'Tech News');

        Article::factory()->create([
            'title' => 'News row', 'category_id' => $news->id,
            'author_id' => $this->admin->id, 'is_featured_in_hero' => false,
        ]);
        Article::factory()->create([
            'title' => 'Review row', 'category_id' => $reviews->id,
            'author_id' => $this->admin->id, 'is_featured_in_hero' => false,
            'review_score' => 8.5,
        ]);
        Article::factory()->create([
            'title' => 'Tech row', 'category_id' => $tech->id,
            'author_id' => $this->admin->id, 'is_featured_in_hero' => false,
        ]);
        Guide::create([
            'title' => 'Guide row',
            'slug' => 'guide-row',
            'excerpt' => 'x',
            'content' => 'y',
            'difficulty' => 'beginner',
            'status' => 'published',
            'published_at' => now(),
            'author_id' => $this->admin->id,
        ]);

        Livewire::test(ListNews::class)->call('loadTable')->assertOk()->assertSee('News row');
        Livewire::test(ListReviews::class)->call('loadTable')->assertOk()->assertSee('Review row')->assertSee('8.5');
        Livewire::test(ListTeches::class)->call('loadTable')->assertOk()->assertSee('Tech row');
        // Guides file by difficulty, which rides the byline where a section would.
        Livewire::test(ListGuides::class)->call('loadTable')->assertOk()->assertSee('Guide row')->assertSee('Beginner');
    }

    public function test_the_editor_opens_with_a_headline_field(): void
    {
        Livewire::test(CreateNews::class)
            ->assertOk()
            ->assertSee('tp-headline', false)
            ->assertSee('techplay.gg/news/');
    }

    /**
     * The bug this rewrite fixes.
     *
     * The title field used to re-slug on every change, on the edit screen as
     * well as on create — so correcting a typo in the headline of a live
     * article silently moved its URL and left every inbound link on a 404,
     * with nothing on screen saying so.
     */
    public function test_editing_a_headline_does_not_move_a_published_url(): void
    {
        $category = $this->category('news', 'Gaming');

        $article = Article::factory()->create([
            'title' => 'Ghost of Yotei Complete Edition brings a new Story',
            'slug' => 'ghost-of-yotei-complete-edition',
            'category_id' => $category->id,
            'author_id' => $this->admin->id,
            'status' => 'published',
            'is_featured_in_hero' => false,
        ]);

        Livewire::test(EditNews::class, ['record' => $article->getKey()])
            ->assertOk()
            ->fillForm(['title' => 'Ghost of Yotei Complete Edition brings a new Story mode'])
            ->assertFormSet(['slug' => 'ghost-of-yotei-complete-edition']);
    }

    /**
     * ...while a new piece still gets its permalink written for it.
     */
    public function test_a_new_headline_still_fills_the_permalink(): void
    {
        Livewire::test(CreateNews::class)
            ->fillForm(['title' => 'Quake gets free new campaign for 30th anniversary'])
            ->assertFormSet(['slug' => 'quake-gets-free-new-campaign-for-30th-anniversary']);
    }
}
