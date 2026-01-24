<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * API Response Standardization Trait
 *
 * CONSISTENCY: Provides standardized JSON response format across all API endpoints
 *
 * Usage: Add to controllers with `use ApiResponse;`
 */
trait ApiResponse
{
    /**
     * Success response with data
     */
    protected function success($data = null, string $message = null, int $code = 200): JsonResponse
    {
        $response = [
            'success' => true,
        ];

        if ($message) {
            $response['message'] = $message;
        }

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $code);
    }

    /**
     * Error response
     */
    protected function error(string $message, int $code = 400, array $errors = []): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }

    /**
     * Paginated response
     */
    protected function paginated(LengthAwarePaginator $paginator, string $message = null): JsonResponse
    {
        $response = [
            'success' => true,
            'data' => $paginator->items(),
            'pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];

        if ($message) {
            $response['message'] = $message;
        }

        return response()->json($response);
    }

    /**
     * Created response (HTTP 201)
     */
    protected function created($data = null, string $message = 'Resource created successfully'): JsonResponse
    {
        return $this->success($data, $message, 201);
    }

    /**
     * No content response (HTTP 204)
     */
    protected function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    /**
     * Validation error response (HTTP 422)
     */
    protected function validationError(array $errors, string $message = 'Validation failed'): JsonResponse
    {
        return $this->error($message, 422, $errors);
    }

    /**
     * Unauthorized response (HTTP 401)
     */
    protected function unauthorized(string $message = 'Unauthorized'): JsonResponse
    {
        return $this->error($message, 401);
    }

    /**
     * Forbidden response (HTTP 403)
     */
    protected function forbidden(string $message = 'Forbidden'): JsonResponse
    {
        return $this->error($message, 403);
    }

    /**
     * Not found response (HTTP 404)
     */
    protected function notFound(string $message = 'Resource not found'): JsonResponse
    {
        return $this->error($message, 404);
    }

    /**
     * Server error response (HTTP 500)
     */
    protected function serverError(string $message = 'Internal server error'): JsonResponse
    {
        return $this->error($message, 500);
    }
}
