<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/{key}.txt', function ($key) {
    $configuredKey = \App\Models\SiteSetting::get('seo_indexnow_key');
    if ($key === $configuredKey) {
        return response($key, 200)
            ->header('Content-Type', 'text/plain');
    }
    abort(404);
})->where('key', '[a-zA-Z0-9]+');
