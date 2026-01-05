<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ForumCategory;
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
                'title' => 'News & Announcements',
                'icon' => 'megaphone',
                'color' => '#ef4444', // Red-500
                'slug' => 'news-announcements',
                'order' => 1,
            ],
            [
                'title' => 'General Gaming',
                'icon' => 'gamepad-2',
                'color' => '#a855f7', // Purple-500
                'slug' => 'general-gaming',
                'order' => 2,
            ],
            [
                'title' => 'Hardware & Tech',
                'icon' => 'cpu',
                'color' => '#06b6d4', // Cyan-500 (Neon)
                'slug' => 'hardware-tech',
                'order' => 3,
            ],
            [
                'title' => 'Game Reviews',
                'icon' => 'star',
                'color' => '#f59e0b', // Amber-500
                'slug' => 'game-reviews',
                'order' => 4,
            ],
            [
                'title' => 'Off-Topic',
                'icon' => 'coffee',
                'color' => '#64748b', // Slate-500
                'slug' => 'off-topic',
                'order' => 5,
            ],
        ];

        foreach ($categories as $catData) {
            $category = ForumCategory::firstOrCreate(
                ['slug' => $catData['slug']],
                $catData
            );

            // Seed a welcome thread if it's News
            if ($catData['slug'] === 'news-announcements' && $category->threads()->count() === 0) {
                $thread = Thread::create([
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
