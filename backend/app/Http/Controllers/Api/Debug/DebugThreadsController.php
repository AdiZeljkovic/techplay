<?php

namespace App\Http\Controllers\Api\Debug;

use App\Http\Controllers\Controller;
use App\Models\Thread;
use Illuminate\Support\Facades\DB;

class DebugThreadsController extends Controller
{
    public function index()
    {
        // Get raw threads from database
        $rawThreads = DB::table('threads')->limit(5)->get();

        // Get threads via Eloquent
        $eloquentThreads = Thread::limit(5)->get(['id', 'title', 'slug', 'author_id', 'category_id']);

        // Get threads with relationships
        $withRelations = Thread::with(['author', 'category'])->limit(5)->get();

        return response()->json([
            'raw_threads' => $rawThreads,
            'eloquent_threads' => $eloquentThreads,
            'with_relations' => $withRelations,
            'thread_count' => Thread::count(),
            'table_columns' => DB::getSchemaBuilder()->getColumnListing('threads'),
        ]);
    }
}
