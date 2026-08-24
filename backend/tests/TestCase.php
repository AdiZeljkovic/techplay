<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Sleep;

abstract class TestCase extends BaseTestCase
{
    /**
     * Nothing in a test run may actually sleep.
     *
     * Five platform integrations now build their HTTP clients with
     * `retry(2, 1500)` — the right behaviour against a store that drops a
     * request, and a real three-second pause every time a test fakes a
     * failure. Measured on the two newest suites: 35.5s before, 11.8s after.
     *
     * `Sleep::fake()` records the pauses instead of taking them, so retry
     * logic still runs and still counts its attempts — a test asserting that a
     * call was retried keeps working. Production is untouched.
     */
    protected function setUp(): void
    {
        parent::setUp();

        Sleep::fake();
    }
}
