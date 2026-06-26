<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            CategorySeeder::class,
            SeasonSeeder::class,
            QuestSeeder::class,
            Gta6CharactersSeeder::class,
        ]);

        // Create Admin
        User::factory()->create([
            'name' => 'Adi',
            'username' => 'adi',
            'email' => 'adi@techplay.gg',
            'password' => 'BubaZeljkovic2112!', // Hashed by model cast or factory? Factory usually hashes 'password' => static::$password ??= Hash::make('password'), check UserFactory.
            'role' => 'admin',
        ]);

        // Create random articles for each category
        Category::whereNotNull('parent_id')->get()->each(function ($cat) {
            Article::factory(3)->create([
                'category_id' => $cat->id,
                'author_id' => 1,
            ]);
        });
    }
}
