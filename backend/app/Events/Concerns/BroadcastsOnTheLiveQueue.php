<?php

namespace App\Events\Concerns;

/**
 * Live updates do not wait behind the catalogue.
 *
 * Every broadcast on this site is queued rather than sent inside the request,
 * which is right — nobody's save should wait on Reverb. But queued meant the
 * single `default` queue, shared with the heavy work: EnrichSteamBatch holds a
 * worker for most of every minute all day long, and a library sync for two to
 * five minutes. A chat message dispatched behind those arrived when they were
 * finished, so "real time" was routinely tens of seconds late and sometimes
 * minutes.
 *
 * These jobs are a few hundred bytes posted to a server on localhost. They get
 * their own queue and their own worker (`techplay-worker-live`), so the longest
 * a broadcast waits is the length of another broadcast.
 */
trait BroadcastsOnTheLiveQueue
{
    /** Read by BroadcastManager when it queues the event. */
    public $broadcastQueue = 'live';
}
