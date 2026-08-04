<?php

namespace App\Services\Releases;

/**
 * The store could not answer us just now.
 *
 * Kept distinct from a store answering "there is no such game", because the
 * two deserve opposite treatment: a verdict about a game is a stable fact worth
 * remembering forever, while a failed request says nothing about the game at
 * all and must never be recorded as though it did.
 */
class TransientFailure extends \RuntimeException {}
