<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Http\Resources\V1\StaffResource;
use Illuminate\Http\Request;

class AboutController extends Controller
{
    public function index()
    {
        // Define the roles we want to display, in priority order
        $editorialRoles = ['Editor-in-Chief', 'Editor', 'Journalist', 'Moderator'];
        $adminRoles = ['Super Admin', 'Admin'];
        $allRoles = array_merge($editorialRoles, $adminRoles);

        // Priority order for grouping - editorial roles first
        $rolePriority = [
            'Editor-in-Chief' => 1,
            'Editor' => 2,
            'Journalist' => 3,
            'Moderator' => 4,
            'Admin' => 5,
            'Super Admin' => 6,
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

        // Construct response - editorial roles first, then admin roles
        $response = [];

        // Add editorial roles
        foreach ($editorialRoles as $role) {
            if ($grouped->has($role)) {
                $response[$role] = StaffResource::collection($grouped[$role]);
            }
        }

        // Add admin-only users under "Leadership" if they don't have editorial roles
        // (These are pure admins without editorial roles)
        foreach ($adminRoles as $role) {
            if ($grouped->has($role)) {
                // Rename to more display-friendly name
                $displayName = $role === 'Super Admin' ? 'Leadership' : 'Administration';
                $response[$displayName] = StaffResource::collection($grouped[$role]);
            }
        }

        return response()->json($response);
    }
}

