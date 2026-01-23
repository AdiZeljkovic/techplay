<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $news = \App\Models\Category::where('type', 'news')
            ->whereNull('parent_id')
            ->first();

        if ($news) {
            // Check if Interviews already exists
            $interviewsExists = \App\Models\Category::where('parent_id', $news->id)
                ->where('name', 'Interviews')
                ->exists();

            if (!$interviewsExists) {
                \App\Models\Category::create([
                    'name' => 'Interviews',
                    'slug' => 'news-interviews',
                    'parent_id' => $news->id,
                    'type' => 'news'
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \App\Models\Category::where('slug', 'news-interviews')->delete();
    }
};
