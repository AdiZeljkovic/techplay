<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class PostgresArray implements CastsAttributes
{
    /**
     * The one place a `{a,"b,c"}` literal is turned back into a PHP array.
     *
     * There were five of these. Two split on every comma, which is right until a
     * value contains one — and 3,522 of them do. `{"Cygames, Inc."}` came back
     * as two studios, `4X (explore, expand, exploit, and exterminate)` as four
     * tags. Both of those parsers fed taste matching, so the fragments became
     * interests nobody has. Counted per column on production: 2,715 developer
     * names, 454 platforms, 353 tags; genres, as it happens, none.
     *
     * PHP 8.4 changes str_getcsv()'s default $escape from "\\" to "", and warns
     * on every call that leaves it out. That warning arrives with a full stack
     * trace, and this runs on every game read — between 2,000 and 5,500 lines a
     * day, into a laravel.log that had reached 1.9 GB.
     *
     * Passing the current default explicitly is what keeps a quoted comma
     * together, but str_getcsv only *honours* the escape, it does not remove it:
     * `Ken \"coda\" Snyder` comes back with both backslashes still in it. 120
     * developer names carry embedded quotes, so the unescape below is the
     * difference between a studio's name and a mangled version of it.
     *
     * @return array<int,string>
     */
    public static function parse(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (! is_string($value) || $value === '' || $value === '{}') {
            return [];
        }

        $inner = trim($value, '{}');

        if ($inner === '') {
            return [];
        }

        $parts = array_filter(
            str_getcsv($inner, ',', '"', '\\'),
            fn ($item) => $item !== null && $item !== ''
        );

        // Postgres escapes a backslash and a double quote inside a quoted
        // element by prefixing each with a backslash, and nothing else. One
        // pass over the pair is the whole rule.
        return array_values(array_map(
            fn (string $item) => preg_replace('/\\\\(.)/', '$1', $item),
            $parts
        ));
    }

    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        return self::parse($value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        if (! is_array($value)) {
            return '{}';
        }

        $escaped = array_map(function (string $item): string {
            if (preg_match('/[,\s"{}\\\\]/', $item)) {
                return '"'.str_replace('"', '\\"', $item).'"';
            }

            return $item;
        }, array_filter(array_map('strval', $value)));

        return '{'.implode(',', $escaped).'}';
    }
}
