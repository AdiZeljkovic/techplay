<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class PostgresArray implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        if (is_array($value)) {
            return $value;
        }
        if (! is_string($value) || $value === '{}') {
            return [];
        }

        // PHP 8.4 changes str_getcsv()'s default $escape from "\\" to "", and warns
        // on every call that leaves it out. That warning arrives with a full stack
        // trace, and these two run on every game read — between 2,000 and 5,500
        // lines a day, into a laravel.log that had reached 1.9 GB.
        //
        // Passing the current default explicitly keeps today's parsing exactly as
        // it is: PostgreSQL escapes with a backslash inside quoted array elements,
        // so "" would be the wrong value here, not merely a different one.
        return str_getcsv(trim($value, '{}'), ',', '"', '\\');
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
