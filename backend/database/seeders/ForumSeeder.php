<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Thread;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class ForumSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Clean up existing forum data to prevent duplicates
        $forumCategories = Category::where('type', 'forum')->get();
        foreach ($forumCategories as $cat) {
            // Threads and posts cascade delete, but we delete explicitly to relate safely
            // But since we have cascadeOnDelete in migration, deleting category is enough.
            $cat->delete();
        }

        // 2. Get Admin User
        $admin = User::first() ?? User::factory()->create([
            'username' => 'Admin',
            'email' => 'admin@techplay.gg',
        ]);

        // 3. Define Professional Hierarchy
        $structure = [
            'Official Information' => [
                'icon' => 'heroicon-o-information-circle',
                'children' => [
                    [
                        'name' => 'News & Announcements',
                        'description' => 'Official TechPlay updates, patch notes, and news.',
                        'icon' => 'heroicon-o-megaphone',
                        'slug' => 'news-announcements',
                        'threads' => [
                            [
                                'title' => 'Welcome to the new TechPlay Forums!',
                                'content' => '<p>Welcome everyone! We are excited to launch our new community platform. Please read the rules and enjoy your stay.</p>',
                                'pinned' => true,
                                'locked' => true
                            ],
                            [
                                'title' => 'Community Guidelines & Rules',
                                'content' => '<ul><li>Be respectful.</li><li>No spam.</li><li>Have fun!</li></ul>',
                                'pinned' => true,
                                'locked' => true
                            ]
                        ]
                    ],
                    [
                        'name' => 'Feedback & Support',
                        'description' => 'Get help with your account or report bugs.',
                        'icon' => 'heroicon-o-lifebuoy',
                        'slug' => 'feedback-support',
                        'threads' => []
                    ]
                ]
            ],
            'Gaming Central' => [
                'icon' => 'heroicon-o-puzzle-piece',
                'children' => [
                    [
                        'name' => 'General Gaming',
                        'description' => 'Talk about anything related to video games.',
                        'icon' => 'heroicon-o-chat-bubble-oval-left-ellipsis',
                        'slug' => 'general-gaming',
                        'threads' => [
                            [
                                'title' => 'What are you playing this weekend?',
                                'content' => '<p>I am finally starting Elden Ring DLC. Wish me luck!</p>',
                                'pinned' => false,
                                'locked' => false
                            ]
                        ]
                    ],
                    [
                        'name' => 'Game Reviews',
                        'description' => 'Share your own reviews and opinions.',
                        'icon' => 'heroicon-o-star',
                        'slug' => 'user-reviews',
                        'threads' => []
                    ],
                    [
                        'name' => 'Esports',
                        'description' => 'Competitive gaming, tournaments, and teams.',
                        'icon' => 'heroicon-o-trophy',
                        'slug' => 'esports',
                        'threads' => []
                    ]
                ]
            ],
            'Hardware & Tech' => [
                'icon' => 'heroicon-o-cpu-chip',
                'children' => [
                    [
                        'name' => 'PC Builds & Upgrades',
                        'description' => 'Show off your rig or ask for build advice.',
                        'icon' => 'heroicon-o-computer-desktop',
                        'slug' => 'pc-builds',
                        'threads' => [
                            [
                                'title' => 'Rate my Setup: White Theme 2026',
                                'content' => '<p>Just finished my new build with the RTX 5080. Thoughts?</p>',
                                'pinned' => false,
                                'locked' => false
                            ]
                        ]
                    ],
                    [
                        'name' => 'Consoles & Peripherals',
                        'description' => 'PlayStation, Xbox, Nintendo, and accessories.',
                        'icon' => 'heroicon-o-device-phone-mobile',
                        'slug' => 'consoles',
                        'threads' => []
                    ]
                ]
            ],
            'The Community' => [
                'icon' => 'heroicon-o-users',
                'children' => [
                    [
                        'name' => 'The Lounge',
                        'description' => 'Off-topic discussions, movies, music, and chill.',
                        'icon' => 'heroicon-o-musical-note',
                        'slug' => 'the-lounge',
                        'threads' => []
                    ],
                    [
                        'name' => 'Marketplace',
                        'description' => 'Buy, sell, and trade gaming gear.',
                        'icon' => 'heroicon-o-shopping-bag',
                        'slug' => 'marketplace',
                        'threads' => [
                            [
                                'title' => 'Marketplace Rules - READ BEFORE POSTING',
                                'content' => '<p>No scams. Use verified payment methods only.</p>',
                                'pinned' => true,
                                'locked' => true
                            ]
                        ]
                    ]
                ]
            ]
        ];

        // 4. Seed to Database
        foreach ($structure as $parentName => $data) {
            // Create Parent Category
            $parent = Category::create([
                'name' => $parentName,
                'slug' => Str::slug($parentName),
                'description' => "Category group for $parentName",
                'type' => 'forum',
                'icon' => $data['icon'],
                'parent_id' => null
            ]);

            foreach ($data['children'] as $childData) {
                // Create Child Category
                $child = Category::create([
                    'name' => $childData['name'],
                    'slug' => $childData['slug'],
                    'description' => $childData['description'],
                    'icon' => $childData['icon'],
                    'type' => 'forum',
                    'parent_id' => $parent->id
                ]);

                // Seed Threads
                if (!empty($childData['threads'])) {
                    foreach ($childData['threads'] as $threadData) {
                        $thread = Thread::create([
                            'title' => $threadData['title'],
                            'slug' => Str::slug($threadData['title']) . '-' . uniqid(),
                            'content' => $threadData['content'],
                            'category_id' => $child->id,
                            'author_id' => $admin->id,
                            'is_pinned' => $threadData['pinned'],
                            'is_locked' => $threadData['locked'],
                            'view_count' => rand(10, 500)
                        ]);

                        // Add a random reply to non-locked threads
                        if (!$threadData['locked']) {
                            Post::create([
                                'content' => 'This looks awesome! Thanks for sharing.',
                                'thread_id' => $thread->id,
                                'author_id' => $admin->id,
                                'is_solution' => false
                            ]);
                        }
                    }
                }
            }
        }
    }
}

