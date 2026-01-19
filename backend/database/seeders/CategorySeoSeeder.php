<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

use App\Models\PageSeo;

class CategorySeoSeeder extends Seeder
{
    public function run()
    {
        // Fetch ALL categories from the database
        $categories = Category::all();

        foreach ($categories as $category) {
            // 1. Determine Path Prefix based on Type
            $pathPrefix = match ($category->type) {
                'news' => '/news',
                'reviews' => '/reviews',
                'tech' => '/hardware', // 'tech' maps to '/hardware'
                'forum' => '/forum',
                default => '/' . $category->type,
            };

            // 2. Construct Full Path
            // If the slug matches the parent folder (e.g. 'hardware' inside '/hardware'), we might want just '/hardware'
            // But usually categories are sub-sections. Let's keep /hardware/hardware if the slug is hardware.
            // Or better, assume categories are children.
            $path = $pathPrefix . '/' . $category->slug;

            // 3. Generate "Professional" SEO defaults if missing on the category itself
            $seoTitle = $category->seo_title;
            // Fallback templates
            if (empty($seoTitle)) {
                $seoTitle = match ($category->type) {
                    'news' => "{$category->name} News & Updates | TechPlay",
                    'reviews' => "{$category->name} Reviews & Ratings | TechPlay",
                    'tech' => "{$category->name} Hardware Specs & Features | TechPlay",
                    'forum' => "{$category->name} Community Forum | TechPlay",
                    default => "{$category->name} | TechPlay",
                };
            }

            $seoDesc = $category->seo_description;
            if (empty($seoDesc)) {
                $seoDesc = match ($category->type) {
                    'news' => "Latest breaking news, rumors, and updates about {$category->name}. Stay informed with TechPlay's daily coverage.",
                    'reviews' => "In-depth reviews, benchmarks, and honest ratings for {$category->name}. See if it's worth your money.",
                    'tech' => "Detailed specifications, features, and analysis of {$category->name}. Expert hardware insights.",
                    'forum' => "Join the discussion about {$category->name} in our community forum. Share your thoughts and get help.",
                    default => "Everything you need to know about {$category->name} at TechPlay.",
                };
            }

            // 4. Update the Category model with these generated values if they were missing
            if (empty($category->seo_title) || empty($category->seo_description)) {
                $category->update([
                    'seo_title' => $seoTitle,
                    'seo_description' => $seoDesc,
                ]);
            }

            // 5. Sync to PageSeo table (For "Page SEO" Admin View)
            PageSeo::updateOrCreate(
                ['page_path' => $path],
                [
                    'page_name' => $category->name,
                    'meta_title' => $seoTitle,
                    'meta_description' => $seoDesc,
                    'is_noindex' => $category->is_noindex ?? false,
                    'updated_at' => now(), // Force update timestamp
                ]
            );
        }
    }
}
