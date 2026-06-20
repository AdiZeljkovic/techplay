<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class UserWowCharactersController extends Controller
{
    use ApiResponse;

    /**
     * Get all WoW characters for the authenticated user
     */
    public function index(Request $request)
    {
        $characters = $request->user()->wowCharacters()
            ->orderBy('is_main', 'desc')
            ->orderBy('item_level', 'desc')
            ->get();

        return $this->success($characters, 'Characters retrieved successfully');
    }

    /**
     * Set a character as the user's main character
     */
    public function setMain(Request $request, int $id)
    {
        $character = $request->user()->wowCharacters()->findOrFail($id);

        // Unset all other mains for this user
        $request->user()->wowCharacters()->update(['is_main' => false]);

        // Set this character as main
        $character->update(['is_main' => true]);

        return $this->success($character, 'Main character updated');
    }

    /**
     * Remove a character from the user's account
     */
    public function destroy(Request $request, int $id)
    {
        $character = $request->user()->wowCharacters()->findOrFail($id);
        $character->delete();

        return $this->success(null, 'Character removed');
    }
}
