<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Thread;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'reportable_type' => ['required', 'string', Rule::in(['thread', 'post'])],
            'reportable_id' => 'required|integer',
            'reason' => 'nullable|string|max:500',
        ]);

        $modelClass = null;

        switch ($request->reportable_type) {
            case 'thread':
                $modelClass = Thread::class;
                break;
            case 'post':
                $modelClass = Post::class;
                break;
        }

        if (!$modelClass) {
            return response()->json(['message' => 'Invalid reportable type.'], 400);
        }

        $model = $modelClass::find($request->reportable_id);

        if (!$model) {
            return response()->json(['message' => 'Content not found.'], 404);
        }

        $exists = Report::where('user_id', Auth::id())
            ->where('reportable_type', $modelClass)
            ->where('reportable_id', $request->reportable_id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'You have already reported this content.'], 409);
        }

        $report = Report::create([
            'user_id' => Auth::id(),
            'reportable_type' => $modelClass,
            'reportable_id' => $request->reportable_id,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);
        // SECURITY: Only return report ID, not full model data
        return response()->json([
            'message' => 'Report submitted successfully.',
            'report_id' => $report->id
        ], 201);
    }
}
