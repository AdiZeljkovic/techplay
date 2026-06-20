<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\StaffResource;
use App\Models\User;

class AboutController extends Controller
{
    public function index()
    {
        // Define editorial roles in priority order (what we want to display)
        $editorialRoles = ['Editor-in-Chief', 'Editor', 'Journalist', 'Moderator'];

        // Also include admin roles to fetch those users
        $allRoles = array_merge($editorialRoles, ['Super Admin']);

        // Priority order - editorial roles first
        $rolePriority = [
            'Editor-in-Chief' => 1,
            'Editor' => 2,
            'Journalist' => 3,
            'Moderator' => 4,
            'Super Admin' => 5,
        ];

        // Fetch users who have any of these roles
        $staff = User::with('roles')->role($allRoles)->get();

        // Group users by their BEST role (editorial preferred over admin)
        $grouped = $staff->groupBy(function ($user) use ($rolePriority) {
            // Sort user's roles by priority and get the best one
            $bestRole = $user->roles->sortBy(function ($role) use ($rolePriority) {
                return $rolePriority[$role->name] ?? 99;
            })->first()?->name;

            return $bestRole;
        });

        // Construct response - only include editorial roles (skip pure Super Admin)
        $response = [];
        foreach ($editorialRoles as $role) {
            if ($grouped->has($role)) {
                $response[$role] = StaffResource::collection($grouped[$role]);
            }
        }

        return response()->json($response);
    }
}
