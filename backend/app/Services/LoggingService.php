<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Centralized logging service for consistent error tracking
 *
 * MONITORING: All errors logged with context for debugging
 * FUTURE: Can integrate with Sentry, Bugsnag, or other services
 */
class LoggingService
{
    /**
     * Log application error with full context
     */
    public function logError(Throwable $e, string $context = 'general', array $extra = []): void
    {
        Log::error($this->formatErrorMessage($e, $context), array_merge([
            'exception' => get_class($e),
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $this->getCleanTrace($e),
            'context' => $context,
            'user_id' => auth()->id(),
            'ip' => request()->ip(),
            'url' => request()->fullUrl(),
            'method' => request()->method(),
            'user_agent' => request()->userAgent(),
        ], $extra));
    }

    /**
     * Log security incident
     */
    public function logSecurityIncident(string $type, string $message, array $context = []): void
    {
        Log::warning("[SECURITY] {$type}: {$message}", array_merge([
            'type' => $type,
            'user_id' => auth()->id(),
            'ip' => request()->ip(),
            'url' => request()->fullUrl(),
            'timestamp' => now()->toIso8601String(),
        ], $context));
    }

    /**
     * Log slow query for performance monitoring
     */
    public function logSlowQuery(string $sql, float $time, array $bindings = []): void
    {
        if ($time > config('logging.slow_query_threshold', 1000)) {
            Log::warning('[SLOW QUERY] Query took ' . round($time, 2) . 'ms', [
                'sql' => $sql,
                'bindings' => $bindings,
                'time_ms' => round($time, 2),
                'url' => request()->fullUrl(),
            ]);
        }
    }

    /**
     * Log API request for debugging
     */
    public function logApiRequest(string $endpoint, array $data = [], string $level = 'info'): void
    {
        if (config('logging.log_api_requests', false)) {
            Log::log($level, "[API REQUEST] {$endpoint}", [
                'endpoint' => $endpoint,
                'method' => request()->method(),
                'data' => $data,
                'user_id' => auth()->id(),
                'ip' => request()->ip(),
            ]);
        }
    }

    /**
     * Log suspicious activity
     */
    public function logSuspiciousActivity(string $activity, array $context = []): void
    {
        Log::warning("[SUSPICIOUS] {$activity}", array_merge([
            'activity' => $activity,
            'user_id' => auth()->id(),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'url' => request()->fullUrl(),
            'timestamp' => now()->toIso8601String(),
        ], $context));
    }

    /**
     * Log performance metrics
     */
    public function logPerformance(string $operation, float $duration, array $metrics = []): void
    {
        if (config('logging.log_performance', false)) {
            Log::info("[PERFORMANCE] {$operation} took " . round($duration, 2) . 'ms', array_merge([
                'operation' => $operation,
                'duration_ms' => round($duration, 2),
            ], $metrics));
        }
    }

    /**
     * Format error message for logs
     */
    private function formatErrorMessage(Throwable $e, string $context): string
    {
        return sprintf(
            '[%s] %s in %s:%d',
            $context,
            $e->getMessage(),
            basename($e->getFile()),
            $e->getLine()
        );
    }

    /**
     * Get cleaned stack trace (first 5 frames)
     */
    private function getCleanTrace(Throwable $e): array
    {
        $trace = collect($e->getTrace())->take(5)->map(function ($frame) {
            return [
                'file' => $frame['file'] ?? 'unknown',
                'line' => $frame['line'] ?? 0,
                'function' => ($frame['class'] ?? '') . ($frame['type'] ?? '') . ($frame['function'] ?? ''),
            ];
        })->toArray();

        return $trace;
    }
}
