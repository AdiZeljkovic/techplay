<?php

namespace App\Services\Gw2;

use RuntimeException;

/**
 * The key itself was refused — 401 or 403.
 *
 * Deliberately not a subclass of Gw2Unavailable: everything else here means
 * try again, and this one may mean the player revoked the key. "May", because
 * this API is documented to answer "invalid key" transiently. The caller
 * counts refusals before it believes them.
 */
class Gw2KeyRejected extends RuntimeException {}
