<?php

namespace Database\Seeders;

use App\Models\Achievement;
use Illuminate\Database\Seeder;

/**
 * Points each achievement at its artwork. Paths are relative to the public
 * storage disk — PublicUserResource/the frontend resolve them through
 * getStorageUrl(), so they must stay relative here.
 *
 * The files themselves are installed by
 * database/seeders/install-achievement-icons.ps1; the mapping (which drawing
 * belongs to which achievement) is documented in achievement-icon-map.md.
 * Only achievements that already exist are touched — nothing is created here.
 */
class AchievementIconSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->icons() as $name => $file) {
            Achievement::where('name', $name)->update(['icon_path' => "achievements/{$file}.png"]);
        }
    }

    /** @return array<string, string> achievement name → file basename */
    private function icons(): array
    {
        return [
            // 1. Getting started & profile
            'Verified Gamer' => 'verified-gamer',
            'Gamer Tag' => 'gamer-tag',
            'Multi-Platform' => 'multi-platform',
            'Battlestation' => 'battlestation',
            'Discord Native' => 'discord-native',
            'Plugged In' => 'plugged-in',
            'Early Adopter' => 'early-adopter',

            // 2. Collection size
            'Game Hunter' => 'game-hunter',
            'Growing Library' => 'growing-library',
            'Dedicated Collector' => 'dedicated-collector',
            'Game Hoarder' => 'game-hoarder',
            'Librarian' => 'librarian',
            'Platform Pioneer' => 'platform-pioneer',
            'Cross-Platform Gamer' => 'cross-platform-gamer',

            // 3. Playing & wishlist
            'In the Zone' => 'in-the-zone',
            'Juggler' => 'juggler',
            'Dreamer' => 'dreamer',
            'Window Shopper' => 'window-shopper',

            // 4. Completions
            'Finisher' => 'finisher',
            'Completionist' => 'completionist',
            'Master of Games' => 'master-of-games',
            'First Blood' => 'first-blood',
            'Ten Down' => 'ten-down',
            'Backlog Slayer' => 'backlog-slayer',
            'Backlog Conqueror' => 'backlog-conqueror',

            // 5. Reviews
            'First Opinion' => 'first-opinion',
            'Critic' => 'critic',
            'Voice of the People' => 'voice-of-the-people',

            // 6. Forum
            'First Steps' => 'first-steps',
            'Conversation Starter' => 'conversation-starter',
            'Active Voice' => 'active-voice',
            'Prolific Poster' => 'prolific-poster',
            'Forum Legend' => 'forum-legend',
            'Elite Member' => 'elite-member',
            'Discussion Leader' => 'discussion-leader',
            'Agenda Setter' => 'agenda-setter',
            'Essayist' => 'essayist',

            // 7. Helping the community
            'Problem Solver' => 'problem-solver',
            'Solution Machine' => 'solution-machine',
            'Community Pillar' => 'community-pillar',
            'Beloved' => 'beloved',

            // 8. Reputation
            'Rising Star' => 'rising-star',
            'Recognized' => 'recognized',
            'Local Legend' => 'local-legend',
            'Hall of Fame' => 'hall-of-fame',

            // 9. Levels
            'Level 5' => 'level-5',
            'Level 10' => 'level-10',
            'Level 25' => 'level-25',
            'Level 50' => 'level-50',

            // 10. Activity
            'Warming Up' => 'warming-up',
            'One Week Strong' => 'one-week-strong',
            'Iron Habit' => 'iron-habit',
            'Unbreakable' => 'unbreakable',
            'Consistent' => 'consistent',
            'Dedicated' => 'dedicated',

            // 11. Friends
            'Friendly' => 'friendly',
            'Socialite' => 'socialite',
            'Popular' => 'popular',

            // 12. Meta
            'Shelf Starter' => 'shelf-starter',
            'Serious Shelf' => 'serious-shelf',
            'The Vault' => 'the-vault',
            'Museum Curator' => 'museum-curator',

            // 13. Shop & support
            'Collector' => 'collector',
            'Gear Collector' => 'gear-collector',
            'TechPlay Patron' => 'techplay-patron',
            'Legacy Supporter' => 'legacy-supporter',
        ];
    }
}
