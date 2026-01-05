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
        $roles = ['Super Admin', 'Editor-in-Chief', 'Editor', 'Journalist', 'Moderator'];

        // Fetch users who have any of these roles
        $staff = User::with('roles')->role($roles)->get();

        // Group users by their primary role
        $grouped = $staff->groupBy(function ($user) {
            return $user->roles->first()?->name;
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
