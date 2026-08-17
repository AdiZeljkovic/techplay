<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Validate .env configuration
 *
 * DEPLOYMENT: Run this command before deploying to production
 * Usage: php artisan env:validate
 */
class ValidateEnv extends Command
{
    protected $signature = 'env:validate';

    protected $description = 'Validate required environment variables';

    private $errors = [];

    private $warnings = [];

    public function handle(): int
    {
        if ($this->refuseIfConfigIsCached()) {
            return 1;
        }

        $this->info('🔍 Validating environment configuration...');
        $this->newLine();

        $this->validateRequired();
        $this->validateDatabase();
        $this->validateMail();
        $this->validateSecurity();
        $this->validatePayPal();
        $this->validateCache();

        $this->displayResults();

        return empty($this->errors) ? 0 : 1;
    }

    /**
     * This command reads env() on purpose — it is checking the .env file, which
     * is the one job env() is for. But `config:cache` makes env() return null
     * for everything, so run afterwards it reports every variable as missing
     * and every check as failed.
     *
     * Rather than let it lie, it says so and stops. Deploy order is: validate,
     * then cache.
     */
    private function refuseIfConfigIsCached(): bool
    {
        if (! app()->configurationIsCached()) {
            return false;
        }

        $this->error('Configuration is cached, so env() reads as null and every check below would fail.');
        $this->line('  Run <fg=yellow>php artisan config:clear</fg=yellow> first, or run this before config:cache in the deploy.');

        return true;
    }

    private function validateRequired(): void
    {
        $required = ['APP_NAME', 'APP_KEY', 'APP_ENV', 'APP_URL'];

        foreach ($required as $var) {
            if (empty(env($var))) {
                $this->errors[] = "❌ {$var} is not set";
            }
        }

        // APP_KEY format validation
        if (strlen(env('APP_KEY')) < 20) {
            $this->errors[] = '❌ APP_KEY seems invalid (too short)';
        }
    }

    private function validateDatabase(): void
    {
        if (env('DB_CONNECTION') === 'mysql') {
            $required = ['DB_HOST', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD'];
            foreach ($required as $var) {
                if (empty(env($var))) {
                    $this->errors[] = "❌ {$var} is required for MySQL";
                }
            }
        }
    }

    private function validateMail(): void
    {
        if (! env('MAIL_MAILER')) {
            $this->warnings[] = '⚠️  MAIL_MAILER not set - email features will not work';
        }
    }

    private function validateSecurity(): void
    {
        // Sanctum stateful domains
        if (env('APP_ENV') === 'production' && ! env('SANCTUM_STATEFUL_DOMAINS')) {
            $this->warnings[] = '⚠️  SANCTUM_STATEFUL_DOMAINS not set - CSRF protection may not work';
        }

        // Session lifetime
        if (env('SESSION_LIFETIME', 120) < 60) {
            $this->warnings[] = '⚠️  SESSION_LIFETIME is very short - users will be logged out frequently';
        }
    }

    private function validatePayPal(): void
    {
        if (env('PAYPAL_MODE') === 'live') {
            $required = ['PAYPAL_CLIENT_ID', 'PAYPAL_SECRET', 'PAYPAL_WEBHOOK_ID'];
            foreach ($required as $var) {
                if (empty(env($var))) {
                    $this->errors[] = "❌ {$var} is required for PayPal live mode";
                }
            }
        }
    }

    private function validateCache(): void
    {
        if (env('APP_ENV') === 'production' && env('CACHE_STORE') === 'file') {
            $this->warnings[] = '⚠️  Using file cache in production - consider Redis for better performance';
        }
    }

    private function displayResults(): void
    {
        if (! empty($this->errors)) {
            $this->newLine();
            $this->error('ERRORS FOUND:');
            foreach ($this->errors as $error) {
                $this->line($error);
            }
        }

        if (! empty($this->warnings)) {
            $this->newLine();
            $this->warn('WARNINGS:');
            foreach ($this->warnings as $warning) {
                $this->line($warning);
            }
        }

        if (empty($this->errors) && empty($this->warnings)) {
            $this->newLine();
            $this->info('✅ Environment configuration is valid!');
        }

        $this->newLine();
    }
}
