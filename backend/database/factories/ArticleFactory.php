<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

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
            'title' => $this->faker->sentence,
            'slug' => $this->faker->unique()->slug,
            'excerpt' => $this->faker->paragraph,
            'content' => $this->faker->paragraphs(3, true),
            'featured_image_url' => 'https://via.placeholder.com/800x400',
            'is_featured_in_hero' => $this->faker->boolean(20),
            'status' => 'published',
            'published_at' => now(),
            'author_id' => 1,
            'meta_title' => $this->faker->sentence,
            'meta_description' => $this->faker->sentence,
        ];
    }
}
