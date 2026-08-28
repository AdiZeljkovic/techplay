<?php

namespace Tests\Feature;

use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Unwrapping 36,916 descriptions is a one-way trip through the whole
 * catalogue, so the shape of the edit is worth pinning down first.
 *
 * The rule is narrow on purpose: the anchor goes, everything else stays byte
 * for byte. Running each description through HTMLPurifier instead would have
 * renormalised every other tag on every row — a very large diff to fix a very
 * small thing, and a diff nobody could review.
 */
class StripCatalogueLinksTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $description): Game
    {
        static $n = 0;
        $n++;

        return Game::create([
            'slug' => 'g-'.$n,
            'name' => 'Game '.$n,
            'description' => $description,
        ]);
    }

    public function test_the_anchor_goes_and_the_sentence_survives(): void
    {
        $game = $this->game(
            '<p>V-Tennis 2 is the sequel to <a href="https://www.mobygames.com/game/71251/v-tennis/">V Tennis</a>, notable for its animation.</p>'
        );

        $this->artisan('games:strip-catalogue-links')->assertExitCode(0);

        $after = $game->fresh()->description;

        $this->assertSame(
            '<p>V-Tennis 2 is the sequel to V Tennis, notable for its animation.</p>',
            $after,
        );
    }

    public function test_nothing_but_the_anchor_is_touched(): void
    {
        // The whole point of a regex rather than the purifier: everything that
        // is not an anchor comes out identical.
        $game = $this->game(
            '<p>A <strong>bold</strong> claim.</p><ul><li>one</li><li><a href="https://mobygames.com/x">two</a></li></ul>'
        );

        $this->artisan('games:strip-catalogue-links');

        $this->assertSame(
            '<p>A <strong>bold</strong> claim.</p><ul><li>one</li><li>two</li></ul>',
            $game->fresh()->description,
        );
    }

    public function test_a_dry_run_writes_nothing(): void
    {
        $original = '<p>See <a href="https://mobygames.com/y">this</a>.</p>';
        $game = $this->game($original);

        $this->artisan('games:strip-catalogue-links --dry-run')->assertExitCode(0);

        $this->assertSame($original, $game->fresh()->description);
    }

    public function test_running_it_twice_changes_nothing_the_second_time(): void
    {
        $game = $this->game('<p>See <a href="https://mobygames.com/z">this</a>.</p>');

        $this->artisan('games:strip-catalogue-links');
        $once = $game->fresh()->description;

        $this->artisan('games:strip-catalogue-links');

        $this->assertSame($once, $game->fresh()->description);
        $this->assertStringNotContainsString('<a', $once);
    }

    public function test_descriptions_without_anchors_are_left_alone(): void
    {
        $plain = '<p>Nothing to see here.</p>';
        $game = $this->game($plain);

        $this->artisan('games:strip-catalogue-links');

        $this->assertSame($plain, $game->fresh()->description);
    }

    public function test_it_keeps_a_copy_of_what_it_changed(): void
    {
        $original = '<p>Before <a href="https://mobygames.com/q">the edit</a>.</p>';
        $this->game($original);

        $this->artisan('games:strip-catalogue-links');

        $backups = glob(storage_path('app/backups/game-descriptions-*.jsonl'));

        $this->assertNotEmpty($backups, 'The previous text was overwritten with no copy kept.');

        $written = file_get_contents(end($backups));
        $this->assertStringContainsString('the edit', $written);

        foreach ($backups as $file) {
            @unlink($file);
        }
    }

    public function test_a_multiline_anchor_is_still_an_anchor(): void
    {
        // Real descriptions are not tidy; the tag can carry a title and wrap.
        $game = $this->game(
            "<p>Look at <a\n   href=\"https://mobygames.com/w\"\n   title=\"A game\">this one</a> closely.</p>"
        );

        $this->artisan('games:strip-catalogue-links');

        $after = $game->fresh()->description;

        $this->assertStringNotContainsString('<a', $after);
        $this->assertStringContainsString('this one', $after);
        $this->assertStringContainsString('closely', $after);
    }

    public function test_it_reports_zero_when_there_is_nothing_to_do(): void
    {
        $this->game('<p>Clean already.</p>');

        $this->artisan('games:strip-catalogue-links')
            ->expectsOutputToContain('Nothing to do')
            ->assertExitCode(0);

        $this->assertSame(0, DB::table('games')->where('description', 'like', '%<a %')->count());
    }
}
