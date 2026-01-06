<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Article>
 */
class ArticleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => 'Article ' . Str::random(10),
            'slug' => 'slug-' . Str::random(10),
            'excerpt' => 'This is a test excerpt ' . Str::random(20),
            'content' => 'This is test content ' . Str::random(100),
            'featured_image_url' => 'https://via.placeholder.com/800x400',
            'is_featured_in_hero' => (bool) rand(0, 1),
            'status' => 'published',
            'published_at' => now(),
            'author_id' => 1,
            'meta_title' => 'Meta Title ' . Str::random(10),
            'meta_description' => 'Meta Description ' . Str::random(20),
        ];
    }
}
