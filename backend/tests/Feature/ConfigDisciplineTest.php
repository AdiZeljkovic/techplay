<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * env() belongs in config files, and nowhere else.
 *
 * This is Laravel's own rule, not a house style: "If you are using the
 * config:cache command during deployment, you should be sure that you are only
 * calling the env function from within your configuration files." After
 * config:cache — which this project runs on every deploy — env() returns null
 * everywhere outside config/.
 *
 * The project already knew: DiagnoseConfig's docblock says so in as many words.
 * It was still being broken in five places, and the damage was real and silent:
 *
 *   - robots.txt announced the sitemap on the API's hostname, because a route
 *     read env('FRONTEND_URL') , got null, and fell back to the API URL. A
 *     sitemap on the wrong host is a sitemap search engines refuse.
 *   - Newsletter verification emails went out with no host in the link at all.
 *   - The Giphy picker in the editorial chat silently found nothing.
 *
 * None of those show up in a log. A test is the only place they can.
 */
class ConfigDisciplineTest extends TestCase
{
    /**
     * Files allowed to call env() outside config/.
     *
     * Exactly one: the command whose job is to read the .env file and report on
     * it. It refuses to run when configuration is cached, precisely because it
     * knows env() would lie to it.
     */
    private const ALLOWED = [
        'app/Console/Commands/ValidateEnv.php',
    ];

    public function test_env_is_only_called_from_config_files(): void
    {
        $base = base_path();
        $offenders = [];

        foreach (['app', 'routes', 'database'] as $dir) {
            $path = $base.DIRECTORY_SEPARATOR.$dir;

            if (! is_dir($path)) {
                continue;
            }

            $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path));

            foreach ($files as $file) {
                if ($file->getExtension() !== 'php') {
                    continue;
                }

                $relative = str_replace([$base.DIRECTORY_SEPARATOR, '\\'], ['', '/'], $file->getPathname());

                if (in_array($relative, self::ALLOWED, true)) {
                    continue;
                }

                $contents = file_get_contents($file->getPathname());

                // The call, not the word — "env(" inside a comment or a string
                // such as "environment" should not trip this.
                if (preg_match('/(?<![\w>$])env\s*\(/', $this->withoutCommentsAndStrings($contents))) {
                    $offenders[] = $relative;
                }
            }
        }

        sort($offenders);

        $this->assertSame([], $offenders, implode("\n", array_merge(
            ['env() called outside config/. Move the value into a config file and read it with config():'],
            array_map(fn ($f) => "  - {$f}", $offenders),
        )));
    }

    /**
     * FRONTEND_URL doubles as the CORS allow-list, so it can hold several
     * origins. Anything building a public link needs one address.
     */
    public function test_the_canonical_site_url_is_a_single_address(): void
    {
        $siteUrl = (string) config('app.site_url');

        $this->assertNotSame('', $siteUrl, 'app.site_url is not configured');
        $this->assertStringNotContainsString(',', $siteUrl, 'app.site_url still carries the comma-separated list');
        $this->assertStringStartsWith('http', $siteUrl);
        $this->assertStringEndsNotWith('/', $siteUrl);
    }

    /** Strips comments and string literals so only real code is searched. */
    private function withoutCommentsAndStrings(string $php): string
    {
        $out = '';

        foreach (token_get_all($php) as $token) {
            if (is_array($token)) {
                if (in_array($token[0], [T_COMMENT, T_DOC_COMMENT, T_CONSTANT_ENCAPSED_STRING, T_ENCAPSED_AND_WHITESPACE], true)) {
                    continue;
                }
                $out .= $token[1];

                continue;
            }

            $out .= $token;
        }

        return $out;
    }
}
