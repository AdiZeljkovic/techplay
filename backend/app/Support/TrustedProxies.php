<?php

namespace App\Support;

/**
 * Which proxies are allowed to tell us who the client is.
 *
 * Anything listed here may set X-Forwarded-For and be believed; everything
 * else has its claim ignored. That is what makes per-IP rate limiting, the
 * giveaway per-network cap and view-count fingerprinting mean anything — with
 * the previous `at: '*'`, every one of them keyed off a value the caller chose.
 *
 * Read straight from the environment rather than config(): this is resolved
 * while the application is still being assembled, before the config service
 * exists.
 */
class TrustedProxies
{
    /** nginx → Octane on the same host. */
    private const LOCAL = ['127.0.0.1', '::1'];

    /** In case a separate load balancer is added later. */
    private const PRIVATE_RANGES = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

    /** Cloudflare edge — https://www.cloudflare.com/ips/ */
    private const CLOUDFLARE = [
        '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22',
        '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18',
        '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22',
        '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
        '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
        '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32',
        '2405:b500::/32', '2405:8100::/32', '2a06:98c0::/29',
        '2c0f:f248::/32',
    ];

    /**
     * @return string|array<int, string>
     */
    public static function at(): string|array
    {
        $configured = $_SERVER['TRUSTED_PROXIES'] ?? $_ENV['TRUSTED_PROXIES'] ?? null;

        // Escape hatch: TRUSTED_PROXIES=* restores the old trust-everyone
        // behaviour without a deploy, should the real topology differ.
        if ($configured === '*') {
            return '*';
        }

        if (is_string($configured) && $configured !== '') {
            return array_map('trim', explode(',', $configured));
        }

        return array_merge(self::LOCAL, self::PRIVATE_RANGES, self::CLOUDFLARE);
    }
}
