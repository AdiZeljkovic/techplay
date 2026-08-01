<?php

namespace Database\Seeders;

use App\Models\Achievement;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * The authoritative achievement catalog (2026 revision).
 *
 * Before this pass the catalog was split between this seeder and the
 * 2026_06_20 migration, which produced whole duplicate ladders: "Shelf
 * Starter → Museum Curator" counted games_added exactly like "Game Hunter →
 * Librarian", and "First Blood → The Finisher" counted games_completed
 * exactly like "Finisher → Master of Games". Several entries also pointed at
 * criteria that could never describe them (Essayist counted comments, First
 * Opinion counted comments rather than game reviews).
 *
 * This file is now the single source of truth. It upserts by name, so
 * already-unlocked achievements keep their unlock rows while their criteria
 * are corrected.
 */
class AchievementSeeder extends Seeder
{
    /** Legacy name → current name. Renaming preserves existing unlocks. */
    private const RENAMES = [
        'Big Spender' => 'Gear Collector',   // generic; and it clashed in tone with Collector
        'The Finisher' => 'Backlog Conqueror', // clashed with "Finisher"
        'Discord Linked' => 'Discord Native',
    ];

    public function run(): void
    {
        $this->applyRenames();

        foreach ($this->catalog() as $achievement) {
            Achievement::updateOrCreate(
                ['name' => $achievement['name']],
                $achievement + ['is_hidden' => false]
            );
        }

        $this->pruneRetired();
    }

    /**
     * Rename before upserting so the row (and everyone's unlock of it)
     * survives. Skipped when the target name already exists.
     */
    private function applyRenames(): void
    {
        foreach (self::RENAMES as $from => $to) {
            $old = Achievement::where('name', $from)->first();

            if (! $old) {
                continue;
            }

            if (Achievement::where('name', $to)->exists()) {
                // Target already present: fold unlocks over, then drop the old row.
                $target = Achievement::where('name', $to)->first();
                DB::table('user_achievements')
                    ->where('achievement_id', $old->id)
                    ->whereNotIn('user_id', function ($q) use ($target) {
                        $q->select('user_id')->from('user_achievements')->where('achievement_id', $target->id);
                    })
                    ->update(['achievement_id' => $target->id]);
                DB::table('user_achievements')->where('achievement_id', $old->id)->delete();
                $old->delete();

                continue;
            }

            $old->update(['name' => $to]);
        }
    }

    /**
     * Drop catalog entries nobody holds that are no longer part of the ladder.
     * Anything already unlocked is left alone — we never take a trophy back.
     */
    private function pruneRetired(): void
    {
        $keep = array_column($this->catalog(), 'name');

        Achievement::whereNotIn('name', $keep)
            ->whereDoesntHave('users')
            ->delete();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function catalog(): array
    {
        return [
            // ── 1. Getting started & profile ─────────────────────────────────
            ['name' => 'Verified Gamer', 'description' => 'Verify your email address', 'points' => 25, 'criteria_type' => 'email_verified', 'criteria_value' => 1],
            ['name' => 'Gamer Tag', 'description' => 'Add your first gaming platform ID', 'points' => 25, 'criteria_type' => 'gamertags', 'criteria_value' => 1],
            ['name' => 'Multi-Platform', 'description' => 'Add IDs for 3 different gaming platforms', 'points' => 75, 'criteria_type' => 'gamertags', 'criteria_value' => 3],
            ['name' => 'Battlestation', 'description' => 'Fill in all your core PC specifications', 'points' => 50, 'criteria_type' => 'pc_specs', 'criteria_value' => 4],
            ['name' => 'Discord Native', 'description' => 'Link your Discord account', 'points' => 75, 'criteria_type' => 'discord', 'criteria_value' => 1],
            ['name' => 'Plugged In', 'description' => 'Connect at least 3 external gaming accounts or services', 'points' => 100, 'criteria_type' => 'connected_accounts', 'criteria_value' => 3],
            ['name' => 'Early Adopter', 'description' => 'Create your account before the public launch date', 'points' => 200, 'criteria_type' => 'early_adopter', 'criteria_value' => 1],

            // ── 2. Collection size: 1 → 10 → 50 → 100 → 250 ──────────────────
            ['name' => 'Game Hunter', 'description' => 'Add your first game to your collection', 'points' => 25, 'criteria_type' => 'games_added', 'criteria_value' => 1],
            ['name' => 'Growing Library', 'description' => 'Add 10 games to your collection', 'points' => 75, 'criteria_type' => 'games_added', 'criteria_value' => 10],
            ['name' => 'Dedicated Collector', 'description' => 'Add 50 games to your collection', 'points' => 150, 'criteria_type' => 'games_added', 'criteria_value' => 50],
            ['name' => 'Game Hoarder', 'description' => 'Add 100 games to your collection', 'points' => 300, 'criteria_type' => 'games_added', 'criteria_value' => 100],
            ['name' => 'Librarian', 'description' => 'Add 250 games to your collection', 'points' => 500, 'criteria_type' => 'games_added', 'criteria_value' => 250],
            ['name' => 'Platform Pioneer', 'description' => 'Own games on at least 2 different platforms', 'points' => 100, 'criteria_type' => 'collection_platforms', 'criteria_value' => 2],
            ['name' => 'Cross-Platform Gamer', 'description' => 'Own games on at least 5 different platforms', 'points' => 250, 'criteria_type' => 'collection_platforms', 'criteria_value' => 5],

            // ── 3. Playing & wishlist ────────────────────────────────────────
            ['name' => 'In the Zone', 'description' => 'Mark your first game as Playing', 'points' => 15, 'criteria_type' => 'games_playing', 'criteria_value' => 1],
            ['name' => 'Juggler', 'description' => 'Have 5 games marked as Playing at once', 'points' => 75, 'criteria_type' => 'games_playing', 'criteria_value' => 5],
            ['name' => 'Dreamer', 'description' => 'Add your first game to your wishlist', 'points' => 50, 'criteria_type' => 'games_wishlisted', 'criteria_value' => 1],
            ['name' => 'Window Shopper', 'description' => 'Have 25 games on your wishlist', 'points' => 200, 'criteria_type' => 'games_wishlisted', 'criteria_value' => 25],

            // ── 4a. Completions (all games) ──────────────────────────────────
            ['name' => 'Finisher', 'description' => 'Mark your first game as completed', 'points' => 50, 'criteria_type' => 'games_completed', 'criteria_value' => 1],
            ['name' => 'Completionist', 'description' => 'Complete 10 games', 'points' => 200, 'criteria_type' => 'games_completed', 'criteria_value' => 10],
            ['name' => 'Master of Games', 'description' => 'Complete 50 games', 'points' => 750, 'criteria_type' => 'games_completed', 'criteria_value' => 50],

            // ── 4b. Completions out of the backlog (its own ladder) ──────────
            ['name' => 'First Blood', 'description' => 'Complete your first game that was sitting in your backlog', 'points' => 75, 'criteria_type' => 'backlog_completed', 'criteria_value' => 1],
            ['name' => 'Ten Down', 'description' => 'Clear 10 games out of your backlog', 'points' => 200, 'criteria_type' => 'backlog_completed', 'criteria_value' => 10],
            ['name' => 'Backlog Slayer', 'description' => 'Clear 25 games out of your backlog', 'points' => 400, 'criteria_type' => 'backlog_completed', 'criteria_value' => 25],
            ['name' => 'Backlog Conqueror', 'description' => 'Clear 50 games out of your backlog', 'points' => 1000, 'criteria_type' => 'backlog_completed', 'criteria_value' => 50],

            // ── 5. Rating games (a written verdict is required) ──────────────
            ['name' => 'First Opinion', 'description' => 'Publish your first written game review', 'points' => 10, 'criteria_type' => 'ratings_count', 'criteria_value' => 1],
            ['name' => 'Critic', 'description' => 'Publish written reviews for 10 games', 'points' => 100, 'criteria_type' => 'ratings_count', 'criteria_value' => 10],
            ['name' => 'Voice of the People', 'description' => 'Publish written reviews for 50 games', 'points' => 200, 'criteria_type' => 'ratings_count', 'criteria_value' => 50],

            // ── 6. Forum & discussions ───────────────────────────────────────
            ['name' => 'First Steps', 'description' => 'Reply to an existing discussion for the first time', 'points' => 50, 'criteria_type' => 'posts_count', 'criteria_value' => 1],
            ['name' => 'Conversation Starter', 'description' => 'Start your first thread', 'points' => 75, 'criteria_type' => 'threads_count', 'criteria_value' => 1],
            ['name' => 'Active Voice', 'description' => 'Publish 10 forum replies', 'points' => 100, 'criteria_type' => 'posts_count', 'criteria_value' => 10],
            ['name' => 'Prolific Poster', 'description' => 'Publish 50 forum replies', 'points' => 250, 'criteria_type' => 'posts_count', 'criteria_value' => 50],
            ['name' => 'Forum Legend', 'description' => 'Publish 250 forum replies', 'points' => 500, 'criteria_type' => 'posts_count', 'criteria_value' => 250],
            ['name' => 'Elite Member', 'description' => 'Publish 500 forum replies', 'points' => 750, 'criteria_type' => 'posts_count', 'criteria_value' => 500],
            ['name' => 'Discussion Leader', 'description' => 'Start 10 threads', 'points' => 200, 'criteria_type' => 'threads_count', 'criteria_value' => 10],
            ['name' => 'Agenda Setter', 'description' => 'Start 25 threads', 'points' => 400, 'criteria_type' => 'threads_count', 'criteria_value' => 25],
            ['name' => 'Essayist', 'description' => 'Publish 5 long-form posts of 500 words or more', 'points' => 300, 'criteria_type' => 'long_posts', 'criteria_value' => 5],

            // ── 7. Helping the community ─────────────────────────────────────
            ['name' => 'Problem Solver', 'description' => 'Get your first reply marked as the accepted answer', 'points' => 150, 'criteria_type' => 'solutions_count', 'criteria_value' => 1],
            ['name' => 'Solution Machine', 'description' => 'Collect 25 accepted answers', 'points' => 500, 'criteria_type' => 'solutions_count', 'criteria_value' => 25],
            ['name' => 'Community Pillar', 'description' => 'Collect 250 upvotes across the threads you started', 'points' => 300, 'criteria_type' => 'thread_upvotes_received', 'criteria_value' => 250],
            ['name' => 'Beloved', 'description' => 'Collect 500 likes on your content', 'points' => 400, 'criteria_type' => 'comment_likes_received', 'criteria_value' => 500],

            // ── 8. Reputation ────────────────────────────────────────────────
            ['name' => 'Rising Star', 'description' => 'Reach 100 reputation', 'points' => 100, 'criteria_type' => 'reputation', 'criteria_value' => 100],
            ['name' => 'Recognized', 'description' => 'Reach 500 reputation', 'points' => 300, 'criteria_type' => 'reputation', 'criteria_value' => 500],
            ['name' => 'Local Legend', 'description' => 'Reach 1,000 reputation', 'points' => 750, 'criteria_type' => 'reputation', 'criteria_value' => 1000],
            ['name' => 'Hall of Fame', 'description' => 'Reach 5,000 reputation', 'points' => 1000, 'criteria_type' => 'reputation', 'criteria_value' => 5000],

            // ── 9. Level progression (level = floor(xp / 1000) + 1) ──────────
            ['name' => 'Level 5', 'description' => 'Reach level 5', 'points' => 100, 'criteria_type' => 'xp', 'criteria_value' => 4000],
            ['name' => 'Level 10', 'description' => 'Reach level 10', 'points' => 250, 'criteria_type' => 'xp', 'criteria_value' => 9000],
            ['name' => 'Level 25', 'description' => 'Reach level 25', 'points' => 500, 'criteria_type' => 'xp', 'criteria_value' => 24000],
            ['name' => 'Level 50', 'description' => 'Reach level 50', 'points' => 1000, 'criteria_type' => 'xp', 'criteria_value' => 49000],

            // ── 10a. Unbroken streak ─────────────────────────────────────────
            ['name' => 'Warming Up', 'description' => 'Stay active 3 days in a row', 'points' => 50, 'criteria_type' => 'daily_streak', 'criteria_value' => 3],
            ['name' => 'One Week Strong', 'description' => 'Stay active 7 days in a row', 'points' => 100, 'criteria_type' => 'daily_streak', 'criteria_value' => 7],
            ['name' => 'Iron Habit', 'description' => 'Stay active 30 days in a row', 'points' => 400, 'criteria_type' => 'daily_streak', 'criteria_value' => 30],
            ['name' => 'Unbreakable', 'description' => 'Stay active 100 days in a row', 'points' => 1000, 'criteria_type' => 'daily_streak', 'criteria_value' => 100],

            // ── 10b. Total activity (a broken streak never costs these) ──────
            ['name' => 'Consistent', 'description' => 'Be active on 15 separate days', 'points' => 100, 'criteria_type' => 'active_days', 'criteria_value' => 15],
            ['name' => 'Dedicated', 'description' => 'Be active on 100 separate days', 'points' => 300, 'criteria_type' => 'active_days', 'criteria_value' => 100],

            // ── 11. Friends & social ─────────────────────────────────────────
            ['name' => 'Friendly', 'description' => 'Add your first friend', 'points' => 50, 'criteria_type' => 'friends_count', 'criteria_value' => 1],
            ['name' => 'Socialite', 'description' => 'Have 10 friends', 'points' => 150, 'criteria_type' => 'friends_count', 'criteria_value' => 10],
            ['name' => 'Popular', 'description' => 'Reach 50 friends', 'points' => 300, 'criteria_type' => 'friends_count', 'criteria_value' => 50],
            // Referrals don't exist yet — hidden so it can't advertise an
            // unreachable trophy. Unhide it with the referral feature.
            ['name' => 'Squad Goals', 'description' => 'Invite 5 people who create and verify a TechPlay account', 'points' => 200, 'criteria_type' => 'special', 'criteria_value' => 5, 'is_hidden' => true],

            // ── 12. Meta: collecting achievements ────────────────────────────
            ['name' => 'Shelf Starter', 'description' => 'Unlock 5 achievements', 'points' => 50, 'criteria_type' => 'achievements_count', 'criteria_value' => 5],
            ['name' => 'Serious Shelf', 'description' => 'Unlock 20 achievements', 'points' => 300, 'criteria_type' => 'achievements_count', 'criteria_value' => 20],
            ['name' => 'The Vault', 'description' => 'Unlock 40 achievements', 'points' => 500, 'criteria_type' => 'achievements_count', 'criteria_value' => 40],
            ['name' => 'Museum Curator', 'description' => 'Unlock 60 achievements', 'points' => 1000, 'criteria_type' => 'achievements_count', 'criteria_value' => 60],

            // ── 13. Shop & supporting the platform ───────────────────────────
            ['name' => 'Collector', 'description' => 'Make your first purchase in the TechPlay Shop', 'points' => 50, 'criteria_type' => 'orders_count', 'criteria_value' => 1],
            ['name' => 'Gear Collector', 'description' => 'Complete 5 successful purchases', 'points' => 250, 'criteria_type' => 'orders_count', 'criteria_value' => 5],
            ['name' => 'TechPlay Patron', 'description' => 'Become an active TechPlay supporter or subscriber', 'points' => 500, 'criteria_type' => 'support_tier', 'criteria_value' => 1],
            ['name' => 'Legacy Supporter', 'description' => 'Support TechPlay for at least 12 months', 'points' => 1000, 'criteria_type' => 'support_duration', 'criteria_value' => 12],
        ];
    }
}
