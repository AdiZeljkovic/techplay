<?php

namespace Tests\Feature;

use App\Filament\Resources\HelpArticleResource\Pages\CreateHelpArticle;
use App\Filament\Resources\HelpArticleResource\Pages\EditHelpArticle;
use App\Filament\Resources\HelpArticleResource\Pages\ListHelpArticles;
use App\Filament\Resources\HelpCategoryResource\Pages\ListHelpCategories;
use App\Models\HelpArticle;
use App\Models\HelpCategory;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * The help centre's two admin screens, opened the way a browser opens them.
 *
 * Same reasoning as ArticleDeskTest: `Livewire::mount()` renders the shell and
 * nothing inside it, so a table whose cells throw passes a mount check and
 * fails in front of a person. Everything here goes through `Livewire::test()`.
 *
 * These screens are also the first callers of two shared components with new
 * parameters — `PublishTab::make(withAuthor: false)` and
 * `ArticleEditorFields::make(excerptLabel: …)` — and the help form is the only
 * place where `withAuthor: false` is exercised. Get that wrong and the form
 * demands an author for a table that has no column to put one in, which is a
 * failure that only appears on save.
 */
class HelpDeskTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->admin = User::factory()->create(['username' => 'adi']);
        $this->admin->assignRole('Super Admin');

        $this->actingAs($this->admin->fresh());
        Filament::setCurrentPanel(Filament::getPanel('admin'));
    }

    private function topic(array $attributes = []): HelpCategory
    {
        return HelpCategory::create(array_merge([
            'name' => 'Connected accounts',
            'slug' => 'connections',
            'description' => 'Steam, Xbox, PlayStation, GOG and Epic.',
            'sort_order' => 1,
        ], $attributes));
    }

    public function test_the_answer_list_renders_its_topic_status_and_helpfulness(): void
    {
        $topic = $this->topic();

        $article = HelpArticle::create([
            'help_category_id' => $topic->id,
            'title' => 'Your Steam library is not syncing',
            'slug' => 'steam-library-is-not-syncing',
            'content' => '<p>Check both privacy switches.</p>',
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]);

        // forceFill, because the counters are deliberately not fillable: they
        // are written by FlushViewCounters out of Redis, never by a form, and
        // an editor who could type a number into "12 people found this helpful"
        // is an editor who can lie to the next reader.
        $article->forceFill(['helpful_count' => 12, 'unhelpful_count' => 1])->save();

        Livewire::test(ListHelpArticles::class)
            ->call('loadTable')
            ->assertOk()
            ->assertSee('Your Steam library is not syncing')
            // The topic and the state ride under the title, so a desk scanning
            // the list can see where an answer files without opening it.
            ->assertSee('Connected accounts')
            // The pair, not two columns nobody compares: an answer read often
            // and marked unhelpful is the next one to rewrite.
            ->assertSee('12 up / 1 down');
    }

    public function test_the_topic_list_renders_its_answer_count(): void
    {
        $topic = $this->topic();

        HelpArticle::create([
            'help_category_id' => $topic->id,
            'title' => 'Connect your GOG account',
            'slug' => 'connect-your-gog-account',
            'content' => '<p>Sign in through GOG.</p>',
            'status' => 'draft',
        ]);

        Livewire::test(ListHelpCategories::class)
            ->call('loadTable')
            ->assertOk()
            ->assertSee('Connected accounts')
            ->assertSee('1');
    }

    /**
     * The form opens, and does not ask for an author.
     *
     * `help_articles` has no `author_id`. PublishTab's author picker is
     * `->required()`, so if `withAuthor: false` were not honoured the screen
     * would refuse to save and there would be no column to save into anyway.
     */
    public function test_the_create_form_opens_without_asking_for_an_author(): void
    {
        $this->topic();

        Livewire::test(CreateHelpArticle::class)
            ->assertOk()
            ->assertFormFieldExists('title')
            ->assertFormFieldExists('help_category_id')
            ->assertFormFieldDoesNotExist('author_id');
    }

    /** An answer can be written and saved end to end from the panel. */
    public function test_an_answer_can_be_created_from_the_panel(): void
    {
        $topic = $this->topic();

        Livewire::test(CreateHelpArticle::class)
            ->fillForm([
                'title' => 'The Create account button is greyed out',
                'slug' => 'register-button-is-disabled',
                'help_category_id' => $topic->id,
                'content' => '<p>Turnstile has to finish before the button unlocks.</p>',
                'status' => 'draft',
            ])
            ->call('create')
            ->assertHasNoFormErrors();

        $this->assertDatabaseHas('help_articles', [
            'slug' => 'register-button-is-disabled',
            'help_category_id' => $topic->id,
        ]);
    }

    public function test_the_edit_form_opens_on_an_existing_answer(): void
    {
        $article = HelpArticle::create([
            'help_category_id' => $this->topic()->id,
            'title' => 'How XP and the daily cap work',
            'slug' => 'how-xp-and-the-daily-cap-work',
            'content' => '<p>Everything you do adds up, to a point.</p>',
            'status' => 'published',
            'published_at' => now(),
        ]);

        Livewire::test(EditHelpArticle::class, ['record' => $article->getKey()])
            ->assertOk()
            ->assertFormSet(['title' => 'How XP and the daily cap work']);
    }
}
