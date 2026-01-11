<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Thread;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Str;

class ForumSeeder extends Seeder
{
    public function run(): void
    {
        // Get Admin User for authoring
        $admin = User::first() ?? User::factory()->create([
            'username' => 'Admin',
            'email' => 'admin@techplay.gg',
        ]);

        $categories = [
            [
                'name' => 'News & Announcements',
                'icon' => 'heroicon-o-megaphone',
                'description' => 'Official updates and announcements.',
                'slug' => 'news-announcements',
                'type' => 'forum',
            ],
            [
                'name' => 'General Gaming',
                'icon' => 'heroicon-o-puzzle-piece', // changed from gamepad-2 as heroicons are standard in filament usually
                'description' => 'General discussion about gaming.',
                'slug' => 'general-gaming',
                'type' => 'forum',
            ],
            [
                'name' => 'Hardware & Tech',
                'icon' => 'heroicon-o-cpu-chip',
                'description' => 'Discuss hardware, builds and tech.',
                'slug' => 'hardware-tech',
                'type' => 'forum',
            ],
            [
                'name' => 'Game Reviews',
                'icon' => 'heroicon-o-star',
                'description' => 'Community reviews and opinions.',
                'slug' => 'game-reviews',
                'type' => 'forum',
            ],
            [
                'name' => 'Off-Topic',
                'icon' => 'heroicon-o-chat-bubble-left-ellipsis',
                'description' => 'Everything else.',
                'slug' => 'off-topic',
                'type' => 'forum',
            ],
        ];

        foreach ($categories as $catData) {
            $category = Category::firstOrCreate(
                ['slug' => $catData['slug']],
                $catData
            );

            // Seed a welcome thread if it's News
            if ($catData['slug'] === 'news-announcements' && $category->threads()->count() === 0) {
                Thread::create([
                    'category_id' => $category->id,
                    'author_id' => $admin->id,
                    'title' => 'Welcome to TechPlay Forums!',
                    'slug' => 'welcome-to-techplay-forums',
                    'content' => '<p>Welcome to the <strong>TechPlay Community</strong>! This is the place to discuss everything from the latest AAA titles to the specific voltage of your new CPU.</p><p>Please be respectful and have fun!</p>',
                    'is_pinned' => true,
                    'is_locked' => true,
                ]);
            }

            // Seed a discussion thread if it's Hardware
            if ($catData['slug'] === 'hardware-tech' && $category->threads()->count() === 0) {
                $thread = Thread::create([
                    'category_id' => $category->id,
                    'author_id' => $admin->id,
                    'title' => 'RTX 5090 - Is it worth the hype?',
                    'slug' => 'rtx-5090-hype',
                    'content' => '<p>Rumors say the power consumption will be massive. What do you guys think? Is it time to upgrade our PSUs?</p>',
                ]);

                // Add a reply
                Post::create([
                    'thread_id' => $thread->id,
                    'author_id' => $admin->id,
                    'content' => 'I think I will wait for the benchmarks. Pure raw power is good, but efficiency matters too.',
                ]);
            }
        }
    }
}

