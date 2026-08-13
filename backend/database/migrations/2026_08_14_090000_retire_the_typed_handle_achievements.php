<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Three achievements lose the thing they measured.
 *
 * Gamertags and PC specs were typed into a settings form and displayed
 * nowhere the owner could see, so they are coming out of the profile. Two of
 * the three badges hanging off them were duplicates anyway: "Gamer Tag" and
 * "Multi-Platform" ask for one and three platform handles, which is exactly
 * what "Platform Pioneer" and "Cross-Platform Gamer" already ask for against
 * connected accounts — a real OAuth link rather than a string somebody typed.
 * "Battlestation" counted PC spec fields and has nothing left to count.
 *
 * Hidden rather than deleted. Anybody who already unlocked one keeps the row
 * and the points; it simply stops appearing in a catalogue where it could
 * never be earned again, which is the failure this project has already made
 * once — twelve badges offered for months that nothing could trigger.
 */
return new class extends Migration
{
    private const RETIRED = ['Gamer Tag', 'Multi-Platform', 'Battlestation'];

    public function up(): void
    {
        DB::table('achievements')->whereIn('name', self::RETIRED)->update(['is_hidden' => true]);
    }

    public function down(): void
    {
        DB::table('achievements')->whereIn('name', self::RETIRED)->update(['is_hidden' => false]);
    }
};
