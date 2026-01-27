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
        // Define the roles we want to display, in order
        $roles = ['Editor-in-Chief', 'Editor', 'Journalist', 'Moderator'];

        // Priority order for grouping - editorial roles first, admin roles last
        $rolePriority = [
            'Editor-in-Chief' => 1,
            'Editor' => 2,
            'Journalist' => 3,
            'Moderator' => 4,
            'Admin' => 5,
            'Super Admin' => 6,
        ];

        // Fetch users who have any of these roles (including Super Admin who may have editorial roles)
        $allRoles = array_merge($roles, ['Super Admin', 'Admin']);
        $staff = User::with('roles')->role($allRoles)->get();

        // Group users by their BEST editorial role (not first role)
        $grouped = $staff->groupBy(function ($user) use ($rolePriority, $roles) {
            // Sort user's roles by priority and get the best one
            $bestRole = $user->roles->sortBy(function ($role) use ($rolePriority) {
                return $rolePriority[$role->name] ?? 99;
            })->first()?->name;

            // Only group by editorial roles, skip pure admins
            return in_array($bestRole, $roles) ? $bestRole : null;
        });

        // Construct response maintaining role order
        $response = [];
        foreach ($roles as $role) {
            if ($grouped->has($role)) {
                $response[$role] = StaffResource::collection($grouped[$role]);
            }
        }

        return response()->json($response);
    }
}

