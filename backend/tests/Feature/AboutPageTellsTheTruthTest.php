<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\Game;
use App\Models\HelpArticle;
use App\Models\HelpCategory;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * The About page states figures, and this is what keeps them true.
 *
 * The page it replaces printed "141,000 games" in three places. The catalogue
 * passed two hundred thousand in August 2026 and is over three hundred
 * thousand now, so for months the page understated the one thing it was
 * proudest of by more than half — and nothing could have caught it, because a
 * number typed into a paragraph has nothing to go wrong.
 *
 * So the page states nothing it has not been told, and the endpoint counts
 * rather than remembers. This test is the other half: it fails if the shape
 * the page reads ever stops arriving.
 */
class AboutPageTellsTheTruthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /** A leaf category, which is the only kind an article may be filed in. */
    private function category(): Category
    {
        $parent = Category::create(['name' => 'News', 'slug' => 'news-root-'.uniqid(), 'type' => 'news']);

        return Category::create([
            'name' => 'Gaming', 'slug' => 'news-'.uniqid(), 'type' => 'news', 'parent_id' => $parent->id,
        ]);
    }

    public function test_the_figures_are_counted_rather_than_remembered(): void
    {
        foreach (['one', 'two', 'three'] as $slug) {
            Game::create(['slug' => $slug, 'name' => ucfirst($slug)]);
        }

        $topic = HelpCategory::create(['name' => 'Topic', 'slug' => 'topic', 'is_published' => true]);
        HelpArticle::create([
            'help_category_id' => $topic->id,
            'title' => 'An answer',
            'slug' => 'an-answer',
            'content' => '<p>Yes.</p>',
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/v1/staff')->assertOk();

        $response->assertJsonPath('figures.games', 3);
        $response->assertJsonPath('figures.answers', 1);
        $response->assertJsonStructure(['figures' => ['games', 'studios', 'articles', 'answers']]);
    }

    /**
     * Everyone with a byline, not everyone with a role.
     *
     * The old version grouped by assigned role and returned two people out of
     * six: the other four have a public author page and no editorial role,
     * because roles are handed out by hand and that step is easy to forget. A
     * page about who we are that names a third of us is worse than one that
     * names nobody.
     */
    public function test_the_team_is_everyone_with_an_author_page(): void
    {
        $category = $this->category();

        $editor = User::factory()->create(['author_slug' => 'editor', 'display_name' => 'The Editor']);
        $editor->assignRole('Editor-in-Chief');

        $contributor = User::factory()->create(['author_slug' => 'contributor', 'display_name' => 'A Contributor']);

        // No byline, so not on the masthead however senior the account is.
        User::factory()->create(['author_slug' => null, 'display_name' => 'Nobody']);

        Article::factory()->count(2)->create([
            'author_id' => $contributor->id,
            'category_id' => $category->id,
            'status' => 'published',
        ]);

        $response = $this->getJson('/api/v1/staff')->assertOk();

        $response->assertJsonCount(2, 'team');
        $response->assertJsonMissing(['name' => 'Nobody']);

        // The editorial role sorts first even though the contributor has
        // written more — a masthead that is only a leaderboard reads as a
        // competition.
        $response->assertJsonPath('team.0.name', 'The Editor');
        $response->assertJsonPath('team.1.name', 'A Contributor');
        $response->assertJsonPath('team.1.articles', 2);
        $response->assertJsonPath('team.1.role', null);
    }

    /** Drafts are not published pieces, and the count beside a name says so. */
    public function test_the_piece_count_ignores_drafts(): void
    {
        $category = $this->category();
        $author = User::factory()->create(['author_slug' => 'author']);

        Article::factory()->create(['author_id' => $author->id, 'category_id' => $category->id, 'status' => 'published']);
        Article::factory()->create(['author_id' => $author->id, 'category_id' => $category->id, 'status' => 'draft']);

        $this->getJson('/api/v1/staff')
            ->assertOk()
            ->assertJsonPath('team.0.articles', 1);
    }
}
