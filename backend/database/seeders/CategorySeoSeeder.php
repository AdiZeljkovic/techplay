<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\PageSeo;
use Illuminate\Database\Seeder;

/**
 * A starting SEO row for any category page that has none.
 *
 * What this used to do, and why none of it survived:
 *
 * It built the path itself, and got three of the four types wrong. News went to
 * `/news/category/news-gaming` and reviews to `/reviews/category/...`, neither
 * of which is a URL on this site; tech went to `/hardware/tech-benchmarks`
 * where the page is served at `/hardware/benchmarks`. Rows were written for
 * pages that do not exist while the real pages had none — and the one type it
 * did get right, forum, was the dangerous one: `updateOrCreate` passed the
 * generated title in the update array unconditionally, so a single `db:seed`
 * would have overwritten "Console & Peripheral Forums | PS5, Xbox, Switch
 * Discussion" with "Consoles Community Forum | TechPlay". A seeder that
 * destroys written copy is worse than no seeder.
 *
 * It also wrote the same two strings onto `categories.seo_title` and
 * `categories.seo_description`, columns nothing reads. That is where
 * "Community Community Forum" and "News News & Updates" came from — the
 * category's name already carried the word the template then appended.
 *
 * So: the path comes from Category::seoPagePath(), the one place that knows it;
 * an existing row is never touched; and the dead columns are left alone.
 */
class CategorySeoSeeder extends Seeder
{
    public function run(): void
    {
        $written = 0;
        $skipped = 0;

        foreach (Category::all() as $category) {
            $path = $category->seoPagePath();

            // A category type with no public listing page has nothing to
            // describe.
            if ($path === null) {
                continue;
            }

            // Anything already written wins — a human wrote it, or an earlier
            // run of this seeder did, and neither is worth replacing with a
            // template.
            if (PageSeo::where('page_path', $path)->exists()) {
                $skipped++;

                continue;
            }

            PageSeo::create([
                'page_path' => $path,
                'page_name' => $category->name,
                'meta_title' => $this->title($category),
                'meta_description' => $this->description($category),
            ]);

            $written++;
        }

        PageSeo::forgetCache();

        $this->command?->info("Category SEO: {$written} created, {$skipped} left as they were.");
    }

    /**
     * Placeholder wording, and it should read like one.
     *
     * The section name is not repeated: the bare `news` category is named
     * "News", and "{name} News & Updates" turned that into "News News &
     * Updates" on the row for /news.
     */
    private function title(Category $category): string
    {
        $name = trim((string) $category->name);

        $suffix = match ($category->type) {
            'news' => 'News',
            'reviews' => 'Reviews',
            'tech' => 'Hardware',
            'forum' => 'Forum',
            default => null,
        };

        if ($suffix === null || strcasecmp($name, $suffix) === 0) {
            return $name.' | TechPlay';
        }

        return "{$name} {$suffix} | TechPlay";
    }

    private function description(Category $category): string
    {
        $name = trim((string) $category->name);

        return match ($category->type) {
            'news' => "News and updates on {$name}, covered as it happens.",
            'reviews' => "Scored reviews in {$name}, with what each game gets right and where it falls short.",
            'tech' => "Hardware coverage in {$name}, with measured numbers rather than impressions.",
            'forum' => "Threads on {$name} from the TechPlay community.",
            default => "{$name} on TechPlay.",
        };
    }
}
