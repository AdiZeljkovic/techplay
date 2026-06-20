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

        return str_getcsv(trim($value, '{}'));
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
