<?php

namespace Tests\Feature;

use App\Filament\Resources\BrokenLinkResource\Pages\ListBrokenLinks;
use App\Filament\Resources\GuideResource\Pages\ListGuides;
use App\Filament\Resources\MediaResource\Pages\ListMedia;
use App\Filament\Resources\NewsResource\Pages\ListNews;
use App\Filament\Resources\ReviewResource\Pages\ListReviews;
use App\Filament\Resources\TechResource\Pages\ListTeches;
use App\Filament\Widgets\BrokenLinksPulse;
use App\Filament\Widgets\MediaPulse;
use App\Filament\Widgets\NewsPulse;
use App\Filament\Widgets\ReviewsPulse;
use App\Models\Article;
use App\Models\BrokenLink;
use App\Models\Category;
use App\Models\Media;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Livewire\Livewire;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * The strip above a list.
 *
 * The lead figure is days since the last publish, judged against each desk's
 * own median interval rather than a threshold somebody picked — which is the
 * only reason it can be right about both News, publishing several times a day,
 * and Guides, publishing about monthly.
 */
class ListPulseTest extends TestCase
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
        Cache::flush();
    }

    private function category(string $type): Category
    {
        $parent = Category::create(['name' => ucfirst($type), 'slug' => $type.'-root-'.uniqid(), 'type' => $type]);

        return Category::create([
            'name' => 'Section', 'slug' => $type.'-'.uniqid(), 'type' => $type, 'parent_id' => $parent->id,
        ]);
    }

    /** @param  array<int, int>  $daysAgo */
    private function reviews(array $daysAgo): void
    {
        $category = $this->category('reviews');
        $author = User::factory()->create();

        foreach ($daysAgo as $i => $days) {
            Article::factory()->create([
                'title' => 'Review '.$i,
                'slug' => 'review-'.$i.'-'.uniqid(),
                'category_id' => $category->id,
                'author_id' => $author->id,
                'status' => 'published',
                'is_featured_in_hero' => false,
                'published_at' => now()->subDays($days),
                'review_score' => 8.0,
                'views' => 100,
            ]);
        }
    }

    /**
     * A desk publishing every five days that has been silent for forty is the
     * case this whole thing exists for — and it is the state the Reviews list
     * was actually in when it was built.
     */
    public function test_a_desk_far_past_its_own_rhythm_reads_as_bad(): void
    {
        // Roughly every five days, then a long silence.
        $this->reviews([40, 45, 50, 55, 60, 65, 70]);

        $pulse = (new ReviewsPulse)->getPulse();

        $this->assertSame('40', $pulse['lead']['value']);
        $this->assertSame('days', $pulse['lead']['unit']);
        $this->assertSame('bad', $pulse['lead']['tone']);
        $this->assertStringContainsString('every 5 days', $pulse['note']);
    }

    /**
     * And the same desk publishing on time is not shouted at.
     */
    public function test_a_desk_on_its_own_rhythm_reads_as_good(): void
    {
        $this->reviews([1, 6, 11, 16, 21, 26]);

        $pulse = (new ReviewsPulse)->getPulse();

        $this->assertSame('1', $pulse['lead']['value']);
        $this->assertSame('day', $pulse['lead']['unit']);
        $this->assertSame('good', $pulse['lead']['tone']);
    }

    /**
     * The floor in `lateness()`. News has a median gap of a tenth of a day, and
     * without a floor a single quiet afternoon would be drawn as an emergency.
     */
    public function test_a_desk_that_publishes_hourly_is_not_alarmed_by_one_quiet_day(): void
    {
        $category = $this->category('news');
        $author = User::factory()->create();

        foreach (range(0, 20) as $i) {
            Article::factory()->create([
                'title' => 'Story '.$i,
                'slug' => 'story-'.$i.'-'.uniqid(),
                'category_id' => $category->id,
                'author_id' => $author->id,
                'status' => 'published',
                'is_featured_in_hero' => false,
                'published_at' => now()->subHours($i * 6 + 20),
            ]);
        }

        $pulse = (new NewsPulse)->getPulse();

        $this->assertSame('good', $pulse['lead']['tone']);
        $this->assertStringContainsString('several a day', $pulse['note']);
    }

    /**
     * "Not published yet" appears only when something is — the same rule the
     * article lists follow for status.
     */
    public function test_the_unfinished_count_stays_quiet_at_zero(): void
    {
        $this->reviews([1, 6, 11]);

        $labels = array_column((new ReviewsPulse)->getPulse()['figures'], 'label');
        $this->assertNotContains('Not published yet', $labels);

        Cache::flush();

        Article::factory()->create([
            'title' => 'A draft',
            'slug' => 'a-draft-'.uniqid(),
            'category_id' => Category::where('type', 'reviews')->whereNotNull('parent_id')->value('id'),
            'author_id' => User::factory()->create()->id,
            'status' => 'draft',
            'is_featured_in_hero' => false,
        ]);

        $labels = array_column((new ReviewsPulse)->getPulse()['figures'], 'label');
        $this->assertContains('Not published yet', $labels);
    }

    public function test_the_broken_link_strip_leads_on_what_is_still_open(): void
    {
        $article = Article::factory()->create([
            'category_id' => $this->category('news')->id,
            'author_id' => User::factory()->create()->id,
            'is_featured_in_hero' => false,
        ]);

        foreach ([[404, false], [404, false], [403, false], [200, true]] as [$code, $fixed]) {
            BrokenLink::create([
                'article_id' => $article->id,
                'url' => 'https://example.com/'.uniqid(),
                'status_code' => $code,
                'is_fixed' => $fixed,
                'last_checked_at' => now(),
            ]);
        }

        $pulse = (new BrokenLinksPulse)->getPulse();

        // Three open, not four rows.
        $this->assertSame('3', $pulse['lead']['value']);
        $this->assertSame('Gone (404)', $pulse['figures'][0]['label']);
        $this->assertSame('2', $pulse['figures'][0]['value']);
        $this->assertStringContainsString('today', $pulse['note']);
    }

    public function test_the_media_strip_leads_on_what_is_described(): void
    {
        Media::create(['path' => 'articles/a.jpg', 'mime_type' => 'image/jpeg', 'collection' => 'articles', 'alt_text' => 'Described']);
        Media::create(['path' => 'articles/b.jpg', 'mime_type' => 'image/jpeg', 'collection' => 'articles', 'alt_text' => null]);
        Media::create(['path' => 'articles/c.jpg', 'mime_type' => 'image/jpeg', 'collection' => 'articles', 'alt_text' => '']);
        Media::create(['path' => 'articles/d.jpg', 'mime_type' => 'image/jpeg', 'collection' => 'articles', 'alt_text' => 'Also described']);

        $pulse = (new MediaPulse)->getPulse();

        $this->assertSame('50', $pulse['lead']['value']);
        $this->assertSame('%', $pulse['lead']['unit']);
        $this->assertSame('warn', $pulse['lead']['tone']);
    }

    /**
     * And all six actually render on the page they belong to — a widget that
     * throws in its view is invisible to every check above.
     */
    public function test_every_strip_renders_on_its_list(): void
    {
        $this->reviews([2, 8]);
        Media::create(['path' => 'articles/a.jpg', 'mime_type' => 'image/jpeg', 'collection' => 'articles']);

        /*
         * On the initial render, deliberately, and without `loadTable()`.
         *
         * A header widget is its own nested Livewire component, and a component
         * update — which is what `call()` returns — does not re-serialise the
         * ones nested inside it. Asserting after `loadTable()` finds nothing and
         * says the strip is broken when it is sitting on the page. What a
         * browser receives on first paint is the initial render, so that is what
         * this checks.
         */
        foreach ([ListNews::class, ListReviews::class, ListTeches::class, ListGuides::class, ListBrokenLinks::class, ListMedia::class] as $page) {
            Livewire::test($page)->assertOk()->assertSee('tp-pulse', false);
        }
    }
}
