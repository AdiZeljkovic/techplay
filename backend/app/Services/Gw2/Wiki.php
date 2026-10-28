<?php

namespace App\Services\Gw2;

/**
 * Where something lives on the official Guild Wars 2 Wiki.
 *
 * Built here, from what we already hold, and never by asking the wiki. The
 * wiki is a place we send a reader, not a source this tool reads: its
 * robots.txt disallows index.php and Special: pages to crawlers, it has no
 * published bot policy, and in October 2026 it was down for over a week —
 * answering every URL with a maintenance page and HTTP 200. A link built from
 * our own catalogue keeps working through all of that; at worst the reader
 * lands on the maintenance notice, and the chat code beside the link still
 * opens the thing in game.
 *
 * Two kinds of link, chosen by what we can identify exactly.
 *
 * **Items go by chat code.** The wiki's search decodes a chat code to an id
 * and redirects to the page whose infobox carries it (wiki: "Chat link
 * format"). That is the only exact route: 74,265 items share 51,604 names in
 * our catalogue, one of them 135 times, so a page guessed from a name would be
 * wrong for thousands of them. gw2treasures links items the same way.
 *
 * **Everything else goes by name.** Achievements, mastery tracks, mounts,
 * raid encounters, world bosses and dungeons have no chat code the wiki is
 * known to decode, so the link is a search for the exact name with "Go":
 * where a page has that title the wiki opens it, and where it does not the
 * reader gets search results — a list to pick from, never a wrong page
 * presented as the right one.
 */
final class Wiki
{
    public const BASE = 'https://wiki.guildwars2.com';

    /** Chat link header for an item (wiki: Chat link format). */
    private const ITEM = 0x02;

    /**
     * The game's own chat code for an item: `[&` + base64 + `]`.
     *
     * Header byte, quantity byte, then the id as four little-endian bytes — the
     * top one is zero for a plain item. Item 19721 encodes to `[&AgEJTQAA]`,
     * which is exactly what the game prints and what gw2treasures links with.
     */
    public static function itemCode(int $itemId, int $quantity = 1): string
    {
        $bytes = chr(self::ITEM)
            .chr(max(1, min(255, $quantity)))
            .pack('V', $itemId);

        return '[&'.base64_encode($bytes).']';
    }

    /**
     * An item's page, and the code that opens it in game.
     *
     * @return array{url: string, chat_link: string}
     */
    public static function item(int $itemId): array
    {
        $code = self::itemCode($itemId);

        return ['url' => self::search($code), 'chat_link' => $code];
    }

    /**
     * Anything we can only name. Null for a blank name, which has no page.
     *
     * @return array{url: string, chat_link: null}|null
     */
    public static function named(?string $name): ?array
    {
        $name = trim((string) $name);

        if ($name === '') {
            return null;
        }

        return ['url' => self::search($name), 'chat_link' => null];
    }

    /**
     * The wiki's search with "Go", which jumps straight to an exact match.
     *
     * Through index.php rather than /wiki/Special:Search/…: a chat code holds
     * `[`, `&` and `]`, and as a query parameter those survive encoding
     * unambiguously where a path segment would not.
     */
    private static function search(string $term): string
    {
        return self::BASE.'/index.php?'.http_build_query([
            'title' => 'Special:Search',
            'search' => $term,
            'go' => 'Go',
        ], '', '&', PHP_QUERY_RFC3986);
    }
}
