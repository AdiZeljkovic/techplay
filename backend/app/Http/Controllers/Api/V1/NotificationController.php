<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Friendship;
use App\Models\Message;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    use ApiResponse;

    /**
     * GET /notifications — recent in-app notifications (paginated).
     */
    public function index(Request $request): JsonResponse
    {
        $userId = Auth::id();

        $items = DatabaseNotification::where('notifiable_type', 'App\\Models\\User')
            ->where('notifiable_id', $userId)
            ->orderByDesc('created_at')
            ->paginate(20);

        $items->getCollection()->transform(fn ($n) => $this->present($n));

        return $this->paginated($items);
    }

    /**
     * PATCH /notifications/{id}/read — mark a single notification read.
     */
    public function markRead(Request $request, string $id): JsonResponse
    {
        DatabaseNotification::where('notifiable_id', Auth::id())
            ->where('id', $id)
            ->update(['read_at' => now()]);

        return $this->success(['message' => 'Marked as read']);
    }

    /**
     * POST /notifications/read-all — mark all as read.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        DatabaseNotification::where('notifiable_type', 'App\\Models\\User')
            ->where('notifiable_id', Auth::id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return $this->success(['message' => 'All notifications marked as read']);
    }

    /**
     * GET /user/notifications/counts — aggregated badge counts for the header.
     */
    public function counts(Request $request): JsonResponse
    {
        $userId = Auth::id();

        $unreadMessages = Message::where('receiver_id', $userId)
            ->where('is_read', false)
            ->where('deleted_by_receiver', false)
            ->count();

        $pendingRequests = Friendship::where('receiver_id', $userId)
            ->where('status', 'pending')
            ->count();

        $unreadNotifications = DatabaseNotification::where('notifiable_type', 'App\\Models\\User')
            ->where('notifiable_id', $userId)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'unread_messages' => $unreadMessages,
            'pending_requests' => $pendingRequests,
            'unread_notifications' => $unreadNotifications,
            'total' => $unreadMessages + $pendingRequests + $unreadNotifications,
        ]);
    }

    private function present(DatabaseNotification $n): array
    {
        $data = $n->data;

        return [
            'id' => $n->id,
            'type' => $data['type'] ?? 'general',
            'title' => $data['title'] ?? null,
            'message' => $data['message'] ?? null,
            'link' => $data['link'] ?? null,
            'icon_path' => $data['icon_path'] ?? null,
            'is_read' => ! is_null($n->read_at),
            'created_at' => $n->created_at?->toISOString(),
        ];
    }
}
