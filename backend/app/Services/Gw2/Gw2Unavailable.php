<?php

namespace App\Services\Gw2;

use RuntimeException;

/**
 * ArenaNet could not answer.
 *
 * A network fault, a 5xx, or a timeout. The account is fine and the key is
 * fine; the sync should be tried again rather than written off. Nothing here
 * ever marks a connection broken.
 */
class Gw2Unavailable extends RuntimeException {}
