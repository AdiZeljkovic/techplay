<?php

use App\Models\Category;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $news = Category::where('type', 'news')
            ->whereNull('parent_id')
            ->first();

        if ($news) {
            // Check if Interviews already exists
            $interviewsExists = Category::where('parent_id', $news->id)
                ->where('name', 'Interviews')
                ->exists();

            if (! $interviewsExists) {
                Category::create([
                    'name' => 'Interviews',
                    'slug' => 'news-interviews',
                    'parent_id' => $news->id,
                    'type' => 'news',
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Category::where('slug', 'news-interviews')->delete();
    }
};
