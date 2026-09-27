<?php

namespace App\Services\Gw2;

/**
 * Later, not no.
 *
 * Raised both by the API's own 429 and by our budget running out for the
 * minute. Measured on 27 September 2026: the bucket refills completely within
 * thirty seconds, so a job that catches this and comes back shortly finishes
 * the work it started.
 */
class Gw2RateLimited extends Gw2Unavailable {}
